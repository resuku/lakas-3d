import * as THREE from 'three';
import type { ThreeEvent } from '@react-three/fiber';
import { findDecorType } from '../data/decor';
import { mm, roomDims, WALL_IDS, wallFrames } from '../lib/geom';
import type { Room, WallId } from '../model/types';
import { useStore } from '../store';

// Dekorelem elhelyezése kattintással: a helyiség csoportjára kötött kezelő a sugár mentén az első látható felületet veszi
// (a „szellem” falakat, az üveget, a zónákat és az áttetsző elemeket átugorja). Falra kerülő elem a fal síkjára, padlóra
// vagy bútorra kerülő elem a vízszintes felületre kerül; függőleges felületre kattintva a fal elé, a padlóra.

function pickable(o: THREE.Object3D) {
  const m = (o as THREE.Mesh).material as THREE.Material | THREE.Material[] | undefined;
  if (!(o as THREE.Mesh).isMesh || !m || !o.visible || o.userData.glass) return false;
  for (const mat of Array.isArray(m) ? m : [m]) {
    if (mat.userData.ghost || !mat.colorWrite || mat.type === 'MeshBasicMaterial') return false;
    if (mat.transparent && mat.opacity < 0.6) return false;
  }
  return true;
}

function isInside(o: THREE.Object3D, root: THREE.Object3D) {
  for (let p: THREE.Object3D | null = o; p; p = p.parent) if (p === root) return true;
  return false;
}

function wallOf(o: THREE.Object3D, root: THREE.Object3D): WallId | null {
  for (let p: THREE.Object3D | null = o; p && p !== root; p = p.parent) if (p.userData.wallId) return p.userData.wallId as WallId;
  return null;
}

const clamp = (v: number, a: number, b: number) => Math.min(Math.max(v, a), Math.max(a, b));

export function placementHandler(room: Room) {
  return (e: ThreeEvent<MouseEvent>) => {
    const st = useStore.getState();
    const pl = st.placing;
    if (!pl || st.walk || e.delta > 4) return;
    const root = e.eventObject;
    const hit = e.intersections.find((i) => isInside(i.object, root) && pickable(i.object));
    if (!hit) return;
    e.stopPropagation();
    const moving = pl.moveId ? st.decor.find((d) => d.id === pl.moveId) : undefined;
    const t = findDecorType(moving?.type ?? pl.typeId ?? '');
    if (!t) return st.setPlacing(null);
    const inv = new THREE.Matrix4().copy(root.matrixWorld).invert();
    const p = hit.point.clone().applyMatrix4(inv);
    const n = hit.face ? hit.face.normal.clone().transformDirection(hit.object.matrixWorld).transformDirection(inv) : new THREE.Vector3(0, 1, 0);
    const { W, L, H } = roomDims(room);
    const frames = wallFrames(room);
    let wall = wallOf(hit.object, root);
    // függőleges felület a fal közelében (pl. szegély, radiátor): a legközelebbi fal
    if (!wall && Math.abs(n.y) < 0.3) {
      const dist: Record<WallId, number> = { x0: p.x, x1: W - p.x, z0: p.z, z1: L - p.z };
      const near = WALL_IDS.reduce((a, b) => (dist[b] < dist[a] ? b : a));
      if (dist[near] < 0.3) wall = near;
    }
    const w = mm(moving?.w ?? t.w);
    const h = mm(moving?.h ?? t.h);
    const d = mm(t.d);
    let patch;
    if (t.mount === 'wall') {
      if (!wall) return; // falra kerülő elem csak falra
      const f = frames[wall];
      const a = clamp(p.clone().sub(f.origin).dot(f.u), w / 2, f.length - w / 2);
      const y = clamp(p.y - h / 2, 0, H - h);
      patch = { wall, a: Math.round(a * 1000), y: Math.round(y * 1000), x: undefined, z: undefined, rot: undefined };
    } else if (n.y > 0.6) {
      patch = { wall: undefined, a: undefined, x: Math.round(clamp(p.x, 0, W) * 1000), z: Math.round(clamp(p.z, 0, L) * 1000), y: Math.round(Math.max(0, p.y) * 1000), rot: moving?.rot ?? 0 };
    } else {
      // függőleges felületre kattintva: a padlóra, a felület elé, a felület felé fordítva
      const nn = wall ? frames[wall].n.clone() : new THREE.Vector3(n.x, 0, n.z).normalize();
      const q = p.clone().addScaledVector(nn, d / 2 + 0.03);
      patch = {
        wall: undefined,
        a: undefined,
        x: Math.round(clamp(q.x, 0, W) * 1000),
        z: Math.round(clamp(q.z, 0, L) * 1000),
        y: 0,
        rot: Math.round((Math.atan2(nn.x, nn.z) * 180) / Math.PI),
      };
    }
    if (moving) st.updateDecor(moving.id, { ...patch, roomId: room.id });
    else
      st.addDecor({
        id: `d-${Date.now().toString(36)}`,
        type: t.id,
        roomId: room.id,
        ...patch,
        variant: t.variants?.[0]?.id,
      });
    st.setPlacing(null);
  };
}
