import * as THREE from 'three';
import { useEffect } from 'react';
import { useThree } from '@react-three/fiber';
import type { InspectInfo } from '../lib/inspect';
import { useStore } from '../store';

// Gyorsinfó: Alt nyomva tartva (vagy I-vel rögzítve) az egér alatti elem leírása (userData.inspect).
// Az elrejtett („szellem”) falakat és a mennyezetet átugorja, így a látható elem adata jelenik meg.

/** Az utolsó egérpozíció, hogy az Alt lenyomásakor mozgatás nélkül is legyen találat. */
const last = { x: -1, y: -1 };
if (typeof window !== 'undefined') window.addEventListener('pointermove', (e) => ((last.x = e.clientX), (last.y = e.clientY)), { passive: true });

function pick(hits: THREE.Intersection[]): InspectInfo | null {
  for (const h of hits) {
    const mats = ([] as THREE.Material[]).concat((h.object as THREE.Mesh).material ?? []);
    if (!h.object.visible || mats.some((m) => m.colorWrite === false)) continue;
    let o: THREE.Object3D | null = h.object;
    while (o && !o.userData.inspect) o = o.parent;
    return (o?.userData.inspect as InspectInfo) ?? null;
  }
  return null;
}

export function Inspector() {
  const camera = useThree((s) => s.camera);
  const scene = useThree((s) => s.scene);
  const gl = useThree((s) => s.gl);
  const active = useStore((s) => s.inspect.on || s.inspect.sticky);
  const setInspect = useStore((s) => s.setInspect);

  useEffect(() => {
    if (!active) return;
    const el = gl.domElement;
    const ray = new THREE.Raycaster();
    const probe = (cx: number, cy: number) => {
      const r = el.getBoundingClientRect();
      if (cx < r.left || cx > r.right || cy < r.top || cy > r.bottom) return;
      ray.setFromCamera(new THREE.Vector2(((cx - r.left) / r.width) * 2 - 1, -((cy - r.top) / r.height) * 2 + 1), camera);
      const found = pick(ray.intersectObjects(scene.children, true));
      setInspect((i) => ({ ...i, info: found, x: cx, y: cy }));
    };
    const move = (e: PointerEvent) => probe(e.clientX, e.clientY);
    const leave = () => setInspect((i) => ({ ...i, info: null }));
    probe(last.x, last.y);
    el.addEventListener('pointermove', move);
    el.addEventListener('pointerleave', leave);
    return () => {
      el.removeEventListener('pointermove', move);
      el.removeEventListener('pointerleave', leave);
    };
  }, [active, camera, scene, gl, setInspect]);

  return null;
}

const typing = (e: KeyboardEvent) => {
  const t = e.target as HTMLElement | null;
  return !!t && (t.tagName === 'INPUT' || t.tagName === 'SELECT' || t.tagName === 'TEXTAREA');
};

/** Billentyűk: Alt nyomva tartva = gyorsinfó; I = rögzítés be/ki. A böngésző Alt-menüjét elnyomja. */
export function useInspectKeys() {
  const setInspect = useStore((s) => s.setInspect);
  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === 'Alt') {
        e.preventDefault();
        setInspect((i) => (i.on ? i : { ...i, on: true }));
      } else if (e.code === 'KeyI' && !typing(e) && !e.ctrlKey && !e.metaKey) {
        setInspect((i) => ({ ...i, sticky: !i.sticky, info: i.sticky && !i.on ? null : i.info }));
      }
    };
    const up = (e: KeyboardEvent) => {
      if (e.key === 'Alt') {
        e.preventDefault();
        setInspect((i) => ({ ...i, on: false, info: i.sticky ? i.info : null }));
      }
    };
    const blur = () => setInspect((i) => ({ ...i, on: false, info: i.sticky ? i.info : null }));
    window.addEventListener('keydown', down);
    window.addEventListener('keyup', up);
    window.addEventListener('blur', blur);
    return () => {
      window.removeEventListener('keydown', down);
      window.removeEventListener('keyup', up);
      window.removeEventListener('blur', blur);
    };
  }, [setInspect]);
}

/** A buborék az egér mellett (DOM, a 3D nézet fölött). */
export function InspectTip() {
  const s = useStore((st) => st.inspect);
  if (!(s.on || s.sticky)) return null;
  const left = Math.min(s.x + 16, window.innerWidth - 380);
  const top = Math.min(s.y + 16, window.innerHeight - 160);
  return (
    <div className="inspect-tip" style={{ left, top }}>
      {s.info ? (
        <>
          <b>{s.info.title}</b>
          {s.info.lines.map((l, i) => (
            <span key={i}>{l}</span>
          ))}
        </>
      ) : (
        <span className="muted">Vidd az egeret egy elem fölé{s.sticky ? ' (I: gyorsinfó ki)' : ''}</span>
      )}
    </div>
  );
}
