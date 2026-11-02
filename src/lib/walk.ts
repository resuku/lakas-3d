import * as THREE from 'three';
import type { Room } from '../model/types';
import { inRect, type Rect2, roomMatrix, worldRect } from '../data/layout';
import { mm, wallFrames } from './geom';

// Bejárható területek: a helyiségek alapterülete (a falaktól MARGIN-nyira) és a két modellezett
// helyiséget összekötő ajtók, átjárók sávja a falon át.

export const MARGIN = 0.2;

export interface Doorway {
  roomId: string;
  openingId: string;
  rect: Rect2;
}

/** A modellezett helyiségeket összekötő nyílások (a másik oldal egy megjelenített helyiségbe esik). */
export function doorways(rooms: Room[], whole: boolean): Doorway[] {
  if (!whole) return [];
  const rects = new Map(rooms.map((r) => [r.id, worldRect(r)]));
  const out: Doorway[] = [];
  for (const room of rooms) {
    const m = roomMatrix(room.id);
    const frames = wallFrames(room);
    for (const o of room.openings) {
      if (o.kind === 'window') continue;
      const f = frames[o.wall];
      const a = mm(o.offset.v) + 0.08;
      const b = mm(o.offset.v + o.width.v) - 0.08;
      const mid = (a + b) / 2;
      const w = (x: number, z: number) => new THREE.Vector3(x, 0, z).applyMatrix4(f.matrix).applyMatrix4(m);
      const beyond = w(mid, -(f.t + 0.3));
      const other = rooms.find((r) => r.id !== room.id && inRect(rects.get(r.id)!, beyond.x, beyond.z));
      if (!other) continue;
      const p = [w(a, MARGIN + 0.15), w(b, MARGIN + 0.15), w(a, -(f.t + MARGIN + 0.15)), w(b, -(f.t + MARGIN + 0.15))];
      out.push({
        roomId: room.id,
        openingId: o.id,
        rect: {
          x0: Math.min(...p.map((v) => v.x)),
          x1: Math.max(...p.map((v) => v.x)),
          z0: Math.min(...p.map((v) => v.z)),
          z1: Math.max(...p.map((v) => v.z)),
        },
      });
    }
  }
  return out;
}

/** Bejárható téglalapok a közös rendszerben (egy helyiséges nézetben a helyiség saját rendszere). */
export function walkAreas(rooms: Room[], whole: boolean): Rect2[] {
  const shrink = (r: Rect2): Rect2 => ({ x0: r.x0 + MARGIN, x1: r.x1 - MARGIN, z0: r.z0 + MARGIN, z1: r.z1 - MARGIN });
  const roomRects = rooms.map((r) => shrink(whole ? worldRect(r) : worldRect(r, new THREE.Matrix4())));
  return [...roomRects, ...doorways(rooms, whole).map((d) => d.rect)];
}

/** A helyiség, amelyben a pont van (közös rendszerben). */
export function roomAt(rooms: Room[], x: number, z: number) {
  return rooms.find((r) => inRect(worldRect(r), x, z));
}
