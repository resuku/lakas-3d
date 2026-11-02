import * as THREE from 'three';
import { useEffect, useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { inRect, type Rect2 } from '../data/layout';
import { type CamPose, useStore } from '../store';

// Bejárás: WASD / nyilak = mozgás, egérhúzás = körbenézés, Shift = gyorsabban, Esc = kilépés.
// Szemmagasságban, a bejárható területen (helyiségek, összekötő ajtók) belül marad, a falak mentén csúszik.
// Összehasonlító nézetben az „a” nézet vezérel, a másik a kamerapozíciót követi.

const inside = (areas: Rect2[], x: number, z: number) => areas.some((r) => inRect(r, x, z));

/** A pont a legközelebbi bejárható területre húzva. */
function nearest(areas: Rect2[], p: THREE.Vector3) {
  let best: [number, number] = [p.x, p.z];
  let bd = Infinity;
  for (const r of areas) {
    const x = Math.min(Math.max(p.x, r.x0), r.x1);
    const z = Math.min(Math.max(p.z, r.z0), r.z1);
    const d = (x - p.x) ** 2 + (z - p.z) ** 2;
    if (d < bd) {
      bd = d;
      best = [x, z];
    }
  }
  p.x = best[0];
  p.z = best[1];
}

export const EYE = 1.6;
const SPEED = 1.3;
const LOOK = 0.0035;

const KEYS: Record<string, [number, number]> = {
  KeyW: [1, 0],
  ArrowUp: [1, 0],
  KeyS: [-1, 0],
  ArrowDown: [-1, 0],
  KeyA: [0, -1],
  ArrowLeft: [0, -1],
  KeyD: [0, 1],
  ArrowRight: [0, 1],
};

function typing(e: KeyboardEvent) {
  const t = e.target as HTMLElement | null;
  return !!t && (t.tagName === 'INPUT' || t.tagName === 'SELECT' || t.tagName === 'TEXTAREA');
}

export function WalkControls({ areas, viewId }: { areas: Rect2[]; viewId: string }) {
  const camera = useThree((s) => s.camera);
  const gl = useThree((s) => s.gl);
  const publish = useStore((s) => s.publishCamera);
  const setWalk = useStore((s) => s.setWalk);
  const lead = viewId === 'a';
  const yaw = useRef(0);
  const pitch = useRef(0);
  const pressed = useRef(new Set<string>());
  const run = useRef(false);
  const dirty = useRef(true);
  const lastSync = useRef(0);

  // Indulás a jelenlegi kamerából, szemmagasságban, a legközelebbi bejárható ponton
  useEffect(() => {
    const dir = new THREE.Vector3();
    camera.getWorldDirection(dir);
    yaw.current = Math.atan2(-dir.x, -dir.z);
    pitch.current = 0;
    if (!inside(areas, camera.position.x, camera.position.z)) nearest(areas, camera.position);
    camera.position.y = EYE;
    dirty.current = true;
  }, [areas, camera]);

  useEffect(() => {
    if (!lead) return;
    const el = gl.domElement;
    let drag: { x: number; y: number } | null = null;
    const down = (e: PointerEvent) => {
      drag = { x: e.clientX, y: e.clientY };
      el.setPointerCapture(e.pointerId);
    };
    const move = (e: PointerEvent) => {
      if (!drag) return;
      yaw.current -= (e.clientX - drag.x) * LOOK;
      pitch.current = Math.min(Math.max(pitch.current - (e.clientY - drag.y) * LOOK, -1.3), 1.3);
      drag = { x: e.clientX, y: e.clientY };
      dirty.current = true;
    };
    const up = () => (drag = null);
    const kd = (e: KeyboardEvent) => {
      if (typing(e)) return;
      if (e.code === 'Escape') return setWalk(false);
      run.current = e.shiftKey;
      if (KEYS[e.code]) {
        pressed.current.add(e.code);
        e.preventDefault();
      }
    };
    const ku = (e: KeyboardEvent) => {
      run.current = e.shiftKey;
      pressed.current.delete(e.code);
    };
    const blur = () => pressed.current.clear();
    el.addEventListener('pointerdown', down);
    el.addEventListener('pointermove', move);
    el.addEventListener('pointerup', up);
    window.addEventListener('keydown', kd);
    window.addEventListener('keyup', ku);
    window.addEventListener('blur', blur);
    return () => {
      el.removeEventListener('pointerdown', down);
      el.removeEventListener('pointermove', move);
      el.removeEventListener('pointerup', up);
      window.removeEventListener('keydown', kd);
      window.removeEventListener('keyup', ku);
      window.removeEventListener('blur', blur);
    };
  }, [lead, gl, setWalk]);

  useFrame((_, dt) => {
    if (!lead) {
      // követő nézet: a vezérlő nézet pozícióját veszi át
      const s = useStore.getState().camSync;
      if (s.n !== lastSync.current) {
        lastSync.current = s.n;
        camera.position.set(...s.pos);
        camera.lookAt(...s.target);
      }
      return;
    }
    let f = 0;
    let r = 0;
    for (const k of pressed.current) {
      f += KEYS[k][0];
      r += KEYS[k][1];
    }
    if (f || r) {
      const step = Math.min(dt, 0.1) * SPEED * (run.current ? 2 : 1);
      const fwd = new THREE.Vector3(-Math.sin(yaw.current), 0, -Math.cos(yaw.current));
      const right = new THREE.Vector3(-fwd.z, 0, fwd.x);
      const v = fwd.multiplyScalar(f).add(right.multiplyScalar(r));
      if (v.lengthSq() > 0) {
        v.normalize().multiplyScalar(step);
        const p = camera.position;
        // teljes lépés, vagy csúszás a fal mentén (csak x vagy csak z irányban)
        if (inside(areas, p.x + v.x, p.z + v.z)) p.set(p.x + v.x, EYE, p.z + v.z);
        else if (inside(areas, p.x + v.x, p.z)) p.x += v.x;
        else if (inside(areas, p.x, p.z + v.z)) p.z += v.z;
        dirty.current = true;
      }
    }
    if (!dirty.current) return;
    dirty.current = false;
    camera.rotation.set(pitch.current, yaw.current, 0, 'YXZ');
    const t = new THREE.Vector3(0, 0, -1).applyEuler(camera.rotation).add(camera.position);
    publish({ pos: camera.position.toArray() as CamPose['pos'], target: t.toArray() as CamPose['target'] }, viewId);
  });

  return null;
}
