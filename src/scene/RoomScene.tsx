import * as THREE from 'three';
import { useMemo, useRef, useState } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { getRoom, ROOMS } from '../data/rooms';
import { boundsOf, roomMatrix, worldRect } from '../data/layout';
import { computeLighting } from '../lib/lighting';
import { doorways, roomAt } from '../lib/walk';
import { roomLampLm } from '../lib/fixtures';
import { useActivePlan, useStore, useVariant } from '../store';
import { CameraRig } from './CameraRig';
import { Furniture, FloorAndCeiling } from './Interior';
import { GlobalLights, Lights, RoomLights, StudioLights } from './Lights';
import { DevProbe } from './DevProbe';
import { StudioContext, useStudio } from './studio';
import { Walls } from './Walls';
import { Inspector, ProductLinks } from './Inspector';
import { DecorLayer } from './DecorModels';
import { placementHandler, placementMoveHandler } from './placement';

function Scene({ variantId, viewId }: { variantId: string; viewId: string }) {
  const roomId = useStore((s) => s.roomId);
  const room = getRoom(roomId);
  const variant = useVariant(variantId);
  const light = useStore((s) => s.light);
  const layers = useStore((s) => s.layers);
  const plan = useActivePlan();
  const lampsOff = useStore((s) => s.lampsOff);
  const lr = useMemo(() => computeLighting(room, light, roomLampLm(room, plan, light, lampsOff)), [room, light, plan, lampsOff]);
  const onPlace = useMemo(() => placementHandler(room), [room]);
  const onMove = useMemo(() => placementMoveHandler(room), [room]);
  const studio = useStudio();
  return (
    <>
      <Lights room={room} ls={light} lr={lr} studio={studio} />
      <group onClick={onPlace} onPointerMove={onMove} userData={{ roomRoot: room.id }}>
        <FloorAndCeiling room={room} variant={variant} />
        <Walls room={room} variant={variant} layers={layers} />
        <Furniture room={room} variant={variant} layers={layers} />
        <DecorLayer room={room} />
      </group>
      <CameraRig room={room} viewId={viewId} />
    </>
  );
}

/** Teljes lakás: minden helyiség a helyén; az expozíció és a szórt fény a nézőpont helyiségéé. */
function WholeScene({ variantId, viewId }: { variantId: string; viewId: string }) {
  const roomId = useStore((s) => s.roomId);
  const room = getRoom(roomId);
  const variant = useVariant(variantId);
  const light = useStore((s) => s.light);
  const layers = useStore((s) => s.layers);
  const camera = useThree((s) => s.camera);
  const plan = useActivePlan();
  const lampsOff = useStore((s) => s.lampsOff);
  const lrs = useMemo(
    () => Object.fromEntries(ROOMS.map((r) => [r.id, computeLighting(r, light, roomLampLm(r, plan, light, lampsOff))])),
    [light, plan, lampsOff],
  );
  const connected = useMemo(() => {
    const m = new Map<string, Set<string>>();
    for (const d of doorways(ROOMS, true)) m.set(d.roomId, (m.get(d.roomId) ?? new Set()).add(d.openingId));
    return m;
  }, []);
  const mats = useMemo(() => Object.fromEntries(ROOMS.map((r) => [r.id, roomMatrix(r.id)])), []);
  const placers = useMemo(() => Object.fromEntries(ROOMS.map((r) => [r.id, placementHandler(r)])), []);
  const movers = useMemo(() => Object.fromEntries(ROOMS.map((r) => [r.id, placementMoveHandler(r)])), []);
  const bounds = useMemo(() => boundsOf(ROOMS.map((r) => worldRect(r))), []);
  const center = useMemo(() => new THREE.Vector3((bounds.x0 + bounds.x1) / 2, 1.3, (bounds.z0 + bounds.z1) / 2), [bounds]);
  const radius = Math.hypot(bounds.x1 - bounds.x0, bounds.z1 - bounds.z0) / 2 + 1;
  // A nézőpont helyisége (kívülről nézve a kiválasztott helyiség) – ehhez igazodik az expozíció
  const [here, setHere] = useState(roomId);
  const last = useRef(here);
  useFrame(() => {
    const id = roomAt(ROOMS, camera.position.x, camera.position.z)?.id ?? roomId;
    if (id !== last.current) {
      last.current = id;
      setHere(id);
    }
  });
  // Napirány és égbolt egy ablakos, el nem forgatott helyiségből (háló)
  const sunLr = lrs.halo ?? lrs[room.id];
  // Ablaktalan helyiségben itt a szomszéd szobák ablakfénye is beér (árnyék nélkül), ezért a szórt fény
  // az egy helyiséges nézetre hangolt értéknek csak a harmada
  const hereRoom = getRoom(here);
  const hemiScale = hereRoom.openings.some((o) => o.kind === 'window') ? 1 : 1 / 3;
  const studio = useStudio();
  return (
    <>
      {studio ? (
        <StudioLights center={center} radius={radius} />
      ) : (
        <GlobalLights lr={lrs[here] ?? lrs[room.id]} sunLr={sunLr} center={center} radius={radius} hemiScale={hemiScale} />
      )}
      {ROOMS.map((r) => (
        <group key={r.id} matrixAutoUpdate={false} matrix={mats[r.id]} onClick={placers[r.id]} onPointerMove={movers[r.id]} userData={{ roomRoot: r.id }}>
          <RoomLights room={r} ls={light} lr={lrs[r.id]} shadows={false} studio={studio} />
          <FloorAndCeiling room={r} variant={variant} />
          <Walls room={r} variant={variant} layers={layers} connected={connected.get(r.id)} />
          <Furniture room={r} variant={variant} layers={layers} />
          <DecorLayer room={r} />
        </group>
      ))}
      <CameraRig room={room} viewId={viewId} />
    </>
  );
}

function SceneSwitch({ variantId, viewId }: { variantId: string; viewId: string }) {
  const whole = useStore((s) => s.whole);
  return whole ? <WholeScene variantId={variantId} viewId={viewId} /> : <Scene variantId={variantId} viewId={viewId} />;
}

/**
 * Egy 3D nézet (vászon). `studio`: a két nézetes módban a vászon rögzített nézete (false: fényjelenet, true: termékhű);
 * hiányában a néző kapcsolója dönt.
 */
export function Viewport({ variantId, viewId, studio }: { variantId: string; viewId: string; studio?: boolean }) {
  // könnyített megjelenítés: árnyéktérképek nélkül, 1-es pixelaránnyal (a vásznat újra kell létrehozni)
  const low = useStore((s) => s.lowQuality);
  return (
    <Canvas
      key={low ? 'low' : 'full'}
      shadows={!low}
      dpr={low ? 1 : [1, 2]}
      camera={{ fov: 62, near: 0.03, far: 200, position: [1, 1.6, 1] }}
      gl={{ preserveDrawingBuffer: true, antialias: true }}
      data-view={viewId}
    >
      <StudioContext.Provider value={studio ?? null}>
        <SceneSwitch variantId={variantId} viewId={viewId} />
      </StudioContext.Provider>
      <Inspector />
      <ProductLinks />
      {import.meta.env.DEV && <DevProbe name={viewId === 'a' ? 'probe' : 'probeB'} />}
    </Canvas>
  );
}
