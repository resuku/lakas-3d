import * as THREE from 'three';
import { useEffect, useLayoutEffect, useMemo, useRef } from 'react';
import { useThree } from '@react-three/fiber';
import { RectAreaLightUniformsLib } from 'three/examples/jsm/lights/RectAreaLightUniformsLib.js';
import type { LightSettings, Room } from '../model/types';
import { lampKey, roomFixtures } from '../lib/fixtures';
import { mm, roomDims, toRoom, wallFrames } from '../lib/geom';
import { WINDOW_FACTOR, type LightingResult } from '../lib/lighting';
import { useActivePlan, useStore } from '../store';
import { FixtureMesh } from './Fixtures';

RectAreaLightUniformsLib.init();

/** Égbolt-kupola: a színek luminanciaként (cd/m²) értendők, így ugyanaz az expozíció érvényes rájuk. */
export function SkyDome({ lr, center }: { lr: LightingResult; center: THREE.Vector3 }) {
  const geom = useMemo(() => new THREE.SphereGeometry(60, 32, 16), []);
  useEffect(() => {
    const pos = geom.attributes.position as THREE.BufferAttribute;
    const colors = new Float32Array(pos.count * 3);
    const c = new THREE.Color();
    for (let i = 0; i < pos.count; i++) {
      const y = pos.getY(i) / 60;
      if (y >= 0) c.copy(lr.horizon).lerp(lr.zenith, Math.pow(y, 0.5));
      else c.copy(lr.ground);
      colors.set([c.r, c.g, c.b], i * 3);
    }
    geom.setAttribute('color', new THREE.BufferAttribute(colors, 3));
  }, [geom, lr]);
  return (
    <mesh geometry={geom} position={center} renderOrder={-1}>
      <meshBasicMaterial vertexColors side={THREE.BackSide} depthWrite={false} />
    </mesh>
  );
}

function Sun({ lr, center, radius }: { lr: LightingResult; center: THREE.Vector3; radius: number }) {
  const light = useRef<THREE.DirectionalLight>(null);
  const target = useMemo(() => new THREE.Object3D(), []);
  useLayoutEffect(() => {
    target.position.copy(center);
    target.updateMatrixWorld();
    if (light.current) light.current.target = target;
  }, [center, target]);
  const pos = center.clone().add(lr.sunDir.clone().multiplyScalar(20));
  return (
    <>
      <primitive object={target} />
      <directionalLight
        ref={light}
        position={pos}
        intensity={lr.sunLux}
        color={lr.sunColor}
        castShadow
        shadow-mapSize={radius > 5 ? [4096, 4096] : [2048, 2048]}
        shadow-bias={-0.0004}
        shadow-normalBias={0.02}
        shadow-camera-left={-radius}
        shadow-camera-right={radius}
        shadow-camera-top={radius}
        shadow-camera-bottom={-radius}
        shadow-camera-near={1}
        shadow-camera-far={45}
      />
    </>
  );
}

function WindowLight({ position, target, width, height, intensity, color }: { position: THREE.Vector3; target: THREE.Vector3; width: number; height: number; intensity: number; color: THREE.Color }) {
  const ref = useRef<THREE.RectAreaLight>(null);
  useLayoutEffect(() => {
    ref.current?.lookAt(target);
  }, [target, position]);
  return <rectAreaLight ref={ref} position={position} width={width} height={height} intensity={intensity} color={color} />;
}

/**
 * Helyiségenkénti fények a helyiség saját rendszerében: ablakfény és az aktív világítási terv lámpái.
 * @param shadows a lámpák árnyékot vetnek (teljes lakás nézetben a sok fényforrás miatt kikapcsolva)
 */
export function RoomLights({ room, ls, lr, shadows = true }: { room: Room; ls: LightSettings; lr: LightingResult; shadows?: boolean }) {
  const plan = useActivePlan();
  const lampsOff = useStore((s) => s.lampsOff);
  const toggleLamp = useStore((s) => s.toggleLamp);
  const fixtures = roomFixtures(plan, room);
  const frames = useMemo(() => wallFrames(room), [room]);
  const windows = useMemo(
    () =>
      room.openings
        .filter((o) => o.kind === 'window')
        .map((o) => {
          const f = frames[o.wall];
          const cx = mm(o.offset.v + o.width.v / 2);
          const cy = mm(o.bottom.v + o.height.v / 2);
          return {
            id: o.id,
            position: toRoom(f, cx, cy, 0.01),
            target: toRoom(f, cx, cy, 1),
            width: mm(o.width.v),
            height: mm(o.height.v),
          };
        }),
    [room, frames],
  );
  return (
    <>
      {lr.skyL > 0.5 &&
        windows.map((w) => (
          <WindowLight key={w.id} position={w.position} target={w.target} width={w.width} height={w.height} intensity={lr.skyL * WINDOW_FACTOR} color={lr.windowColor} />
        ))}
      {fixtures.map((f) => {
        const key = lampKey(room.id, f);
        return <FixtureMesh key={f.id} f={f} room={room} ls={ls} off={!!lampsOff[key]} shadows={shadows} onToggle={() => toggleLamp(key)} />;
      })}
    </>
  );
}

/**
 * Közös fények: égbolt, félgömbfény, nap és expozíció. `lr` a nézőpont helyiségéé (expozíció, szórt fény),
 * `sunLr` egy ablakos, el nem forgatott helyiségé (napirány és égbolt a közös rendszerben).
 */
export function GlobalLights({ lr, sunLr, center, radius, hemiScale = 1 }: { lr: LightingResult; sunLr: LightingResult; center: THREE.Vector3; radius: number; hemiScale?: number }) {
  const gl = useThree((s) => s.gl);
  useEffect(() => {
    gl.toneMappingExposure = lr.exposure;
  }, [gl, lr.exposure]);
  const hemiSky = useMemo(() => new THREE.Color('#ffffff').lerp(lr.windowColor, 0.35), [lr.windowColor]);
  const hemiGround = useMemo(() => new THREE.Color('#d9cbb8'), []);
  return (
    <>
      <SkyDome lr={sunLr} center={center} />
      <hemisphereLight args={[hemiSky, hemiGround, lr.hemiI * hemiScale]} />
      {sunLr.sunLux > 0 && <Sun lr={sunLr} center={center} radius={radius} />}
    </>
  );
}

export function Lights({ room, ls, lr }: { room: Room; ls: LightSettings; lr: LightingResult }) {
  const { W, L, H } = roomDims(room);
  const center = useMemo(() => new THREE.Vector3(W / 2, H / 2, L / 2), [W, L, H]);
  const radius = Math.hypot(W, L, H) / 2 + 0.5;
  return (
    <>
      <GlobalLights lr={lr} sunLr={lr} center={center} radius={radius} />
      <RoomLights room={room} ls={ls} lr={lr} />
    </>
  );
}
