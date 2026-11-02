import * as THREE from 'three';
import type { Room, WallId } from '../model/types';

export const mm = (v: number) => v / 1000;

export const WALL_IDS: WallId[] = ['z0', 'x1', 'z1', 'x0'];

/**
 * Egy fal helyi koordinátarendszere (méterben):
 * x = a fal mentén (offset iránya), y = fel, z = a helyiség belseje felé.
 * A `matrix` a fal helyi rendszeréből a helyiség rendszerébe visz (z1 és x0 falnál tükrözés).
 */
export interface WallFrame {
  id: WallId;
  origin: THREE.Vector3;
  u: THREE.Vector3;
  n: THREE.Vector3;
  length: number;
  t: number;
  startExt: number;
  endExt: number;
  matrix: THREE.Matrix4;
}

export function roomDims(room: Room) {
  return { W: mm(room.size.x.v), L: mm(room.size.z.v), H: mm(room.size.h.v) };
}

export function wallFrames(room: Room): Record<WallId, WallFrame> {
  const { W, L } = roomDims(room);
  const t = (id: WallId) => mm(room.walls[id].t.v);
  const up = new THREE.Vector3(0, 1, 0);
  const V = (x: number, y: number, z: number) => new THREE.Vector3(x, y, z);
  const mk = (
    id: WallId,
    origin: THREE.Vector3,
    u: THREE.Vector3,
    n: THREE.Vector3,
    length: number,
    startExt: number,
    endExt: number,
  ): WallFrame => ({
    id,
    origin,
    u,
    n,
    length,
    t: t(id),
    startExt,
    endExt,
    matrix: new THREE.Matrix4().makeBasis(u, up, n).setPosition(origin),
  });
  // A z-falak átnyúlnak a sarkokon, így a sarkok zártak.
  return {
    z0: mk('z0', V(0, 0, 0), V(1, 0, 0), V(0, 0, 1), W, t('x0'), t('x1')),
    z1: mk('z1', V(0, 0, L), V(1, 0, 0), V(0, 0, -1), W, t('x0'), t('x1')),
    x0: mk('x0', V(0, 0, 0), V(0, 0, 1), V(1, 0, 0), L, 0, 0),
    x1: mk('x1', V(W, 0, 0), V(0, 0, 1), V(-1, 0, 0), L, 0, 0),
  };
}

export function toRoom(f: WallFrame, x: number, y: number, z: number) {
  return new THREE.Vector3(x, y, z).applyMatrix4(f.matrix);
}

/** A gardrób által elfoglalt szakasz egy szomszédos fal mentén (m), ha van. */
export function wardrobeRangeOnWall(room: Room, wall: WallId): [number, number] | null {
  const w = room.wardrobe;
  if (!w) return null;
  const { W, L } = roomDims(room);
  const d = mm(w.depth.v);
  const zWalls = wall === 'z0' || wall === 'z1';
  if (w.wall === 'x1' && zWalls) return [W - d, W];
  if (w.wall === 'x0' && zWalls) return [0, d];
  if (w.wall === 'z1' && !zWalls) return [L - d, L];
  if (w.wall === 'z0' && !zWalls) return [0, d];
  return null;
}

/** Égtájvektorok a helyiség rendszerében: N = az északi fal kifelé mutató normálisa. */
export function compass(room: Room) {
  const f = wallFrames(room)[room.north.wall];
  const N = f.n.clone().negate();
  const E = N.clone().cross(new THREE.Vector3(0, 1, 0));
  return { N, E };
}
