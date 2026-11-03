import * as THREE from 'three';
import type { ThreeEvent } from '@react-three/fiber';
import { findDecorType, type DecorType } from '../data/decor';
import { mm, roomDims, WALL_IDS, wallFrames } from '../lib/geom';
import type { DecorItem, Room, WallId } from '../model/types';
import { useStore } from '../store';

// Dekorelem elhelyezése és mozgatása az egérrel. A helyiség csoportjára kötött kezelők a sugár mentén az első látható
// felületet veszik (a „szellem” falakat, az üveget, a zónákat, az áttetsző elemeket, az előnézetet és a húzott elemet
// átugorják). Falra kerülő elem a fal síkjára, padlóra vagy bútorra kerülő elem a vízszintes felületre kerül; függőleges
// felületre mutatva a felület elé, a padlóra. Ugyanez a számítás adja a kattintásos lerakást, a halvány előnézetet
// (elhelyezés közben) és az M + húzással mozgatást.

function pickable(o: THREE.Object3D) {
  const m = (o as THREE.Mesh).material as THREE.Material | THREE.Material[] | undefined;
  if (!(o as THREE.Mesh).isMesh || !m || !o.visible || o.userData.glass) return false;
  for (const mat of Array.isArray(m) ? m : [m]) {
    if (mat.userData.ghost || !mat.colorWrite || mat.type === 'MeshBasicMaterial') return false;
    if (mat.transparent && mat.opacity < 0.6) return false;
  }
  return true;
}

function ancestors(o: THREE.Object3D, root: THREE.Object3D) {
  const out: THREE.Object3D[] = [];
  for (let p: THREE.Object3D | null = o; p && p !== root; p = p.parent) out.push(p);
  return out;
}

function isInside(o: THREE.Object3D, root: THREE.Object3D) {
  for (let p: THREE.Object3D | null = o; p; p = p.parent) if (p === root) return true;
  return false;
}

const clamp = (v: number, a: number, b: number) => Math.min(Math.max(v, a), Math.max(a, b));

type Hit = { intersections: THREE.Intersection[]; eventObject: THREE.Object3D };
/** Megfogási eltolás (m): a húzott elem a megfogás helyén marad az egér alatt. */
type Offset = { a: number; y: number; x: number; z: number };
const NO_OFFSET: Offset = { a: 0, y: 0, x: 0, z: 0 };

/** A leendő hely (DecorItem-mezők) az egér alatti felületen, vagy null, ha ott nem helyezhető el. */
export function computePlacement(room: Room, e: Hit, t: DecorType, moving?: DecorItem, off: Offset = NO_OFFSET): Partial<DecorItem> | null {
  const root = e.eventObject;
  const hit = e.intersections.find((i) => {
    if (!isInside(i.object, root) || !pickable(i.object)) return false;
    const up = ancestors(i.object, root);
    return !up.some((p) => p.userData.decorPreview || (moving && p.userData.decorId === moving.id));
  });
  if (!hit) return null;
  const inv = new THREE.Matrix4().copy(root.matrixWorld).invert();
  const p = hit.point.clone().applyMatrix4(inv);
  const n = hit.face ? hit.face.normal.clone().transformDirection(hit.object.matrixWorld).transformDirection(inv) : new THREE.Vector3(0, 1, 0);
  const { W, L, H } = roomDims(room);
  const frames = wallFrames(room);
  let wall = (ancestors(hit.object, root).find((o) => o.userData.wallId)?.userData.wallId as WallId | undefined) ?? null;
  // függőleges felület a fal közelében (pl. szegély, radiátor): a legközelebbi fal
  if (!wall && Math.abs(n.y) < 0.3) {
    const dist: Record<WallId, number> = { x0: p.x, x1: W - p.x, z0: p.z, z1: L - p.z };
    const near = WALL_IDS.reduce((a, b) => (dist[b] < dist[a] ? b : a));
    if (dist[near] < 0.3) wall = near;
  }
  const w = mm(moving?.w ?? t.w);
  const h = mm(moving?.h ?? t.h);
  const d = mm(t.d);
  if (t.mount === 'wall') {
    if (!wall) return null; // falra kerülő elem csak falra
    const f = frames[wall];
    const a = clamp(p.clone().sub(f.origin).dot(f.u) + off.a, w / 2, f.length - w / 2);
    const y = clamp(p.y - h / 2 + off.y, 0, H - h);
    return { roomId: room.id, wall, a: Math.round(a * 1000), y: Math.round(y * 1000), x: undefined, z: undefined, rot: undefined };
  }
  if (n.y > 0.6)
    return { roomId: room.id, wall: undefined, a: undefined, x: Math.round(clamp(p.x + off.x, 0, W) * 1000), z: Math.round(clamp(p.z + off.z, 0, L) * 1000), y: Math.round(Math.max(0, p.y) * 1000), rot: moving?.rot ?? 0 };
  // függőleges felületre mutatva: a padlóra, a felület elé, a felület felé fordítva
  const nn = wall ? frames[wall].n.clone() : new THREE.Vector3(n.x, 0, n.z).normalize();
  const q = p.clone().addScaledVector(nn, d / 2 + 0.03);
  return {
    roomId: room.id,
    wall: undefined,
    a: undefined,
    x: Math.round(clamp(q.x, 0, W) * 1000),
    z: Math.round(clamp(q.z, 0, L) * 1000),
    y: 0,
    rot: Math.round((Math.atan2(nn.x, nn.z) * 180) / Math.PI),
  };
}

const modifier = (e: ThreeEvent<MouseEvent | PointerEvent>) => e.nativeEvent.ctrlKey || e.nativeEvent.metaKey;

/** Kattintás: lerakás (új elem) vagy áthelyezés a kattintott helyre. */
export function placementHandler(room: Room) {
  return (e: ThreeEvent<MouseEvent>) => {
    const st = useStore.getState();
    const pl = st.placing;
    if (!pl || st.walk || e.delta > 4 || modifier(e)) return;
    const moving = pl.moveId ? st.decor.find((d) => d.id === pl.moveId) : undefined;
    const t = findDecorType(moving?.type ?? pl.typeId ?? '');
    if (!t) return st.setPlacing(null);
    const patch = computePlacement(room, e, t, moving);
    if (!patch) return;
    e.stopPropagation();
    if (moving) st.updateDecor(moving.id, patch);
    else st.addDecor({ id: `d-${Date.now().toString(36)}`, type: t.id, y: 0, ...patch, roomId: room.id, variant: t.variants?.[0]?.id });
    st.setPlacing(null);
  };
}

/** A húzás eleje (M + egérgomb a dekorelemen): a megfogás helye és az elem közti eltolás megjegyzése. */
let grab: Offset = NO_OFFSET;
export function startDrag(room: Room, e: ThreeEvent<PointerEvent>, d: DecorItem) {
  let root: THREE.Object3D | null = e.eventObject;
  while (root && root.userData.roomRoot !== room.id) root = root.parent;
  const t = findDecorType(d.type);
  const p = root && t ? computePlacement(room, { intersections: e.intersections, eventObject: root }, t, d) : null;
  grab = NO_OFFSET;
  if (p && d.wall && p.wall === d.wall) grab = { ...NO_OFFSET, a: ((d.a ?? 0) - (p.a ?? 0)) / 1000, y: (d.y - (p.y ?? 0)) / 1000 };
  else if (p && !d.wall && !p.wall) grab = { ...NO_OFFSET, x: ((d.x ?? 0) - (p.x ?? 0)) / 1000, z: ((d.z ?? 0) - (p.z ?? 0)) / 1000 };
  useStore.getState().setDecorDrag(d.id);
}

/** Egérmozgás: elhelyezés közben az előnézet, M + húzás közben a húzott elem követi az egeret. */
export function placementMoveHandler(room: Room) {
  return (e: ThreeEvent<PointerEvent>) => {
    const st = useStore.getState();
    if (st.walk) return;
    if (st.decorDrag) {
      const d = st.decor.find((x) => x.id === st.decorDrag);
      const t = d && findDecorType(d.type);
      if (!d || !t) return;
      const patch = computePlacement(room, e, t, d, grab);
      if (!patch) return;
      e.stopPropagation();
      st.updateDecor(d.id, patch);
      return;
    }
    const pl = st.placing;
    if (!pl) return;
    const moving = pl.moveId ? st.decor.find((d) => d.id === pl.moveId) : undefined;
    const t = findDecorType(moving?.type ?? pl.typeId ?? '');
    if (!t) return;
    const patch = computePlacement(room, e, t, moving);
    if (!patch) return;
    e.stopPropagation();
    const base: DecorItem = moving ?? { id: 'preview', type: t.id, roomId: room.id, y: 0, variant: t.variants?.[0]?.id };
    st.setDecorPreview({ roomId: room.id, item: { ...base, ...patch, roomId: room.id } as DecorItem });
  };
}
