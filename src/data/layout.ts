import * as THREE from 'three';
import type { Room } from '../model/types';
import { roomDims } from '../lib/geom';

/**
 * A helyiségek elhelyezése a teljes lakás nézethez (D – levezetett).
 * Közös rendszer: a 2026-11-01-i szkennelés vízszintes síkja méterben (x = szkennelés X, z = szkennelés Y,
 * +z = észak). A helyiség saját origója ide kerül, `rot` szöggel elforgatva a függőleges tengely körül.
 *
 * - Előszoba, közlekedő: a szkennelésből (a közös fal felével korrigálva).
 * - Nappali: 180°-kal fordítva; a hosszú fal a szkennelt X = 6168 mm-en, a dolgozó felőli fal Y = 7910 mm-en –
 *   így a nappali saját (erkélytől mért) nyílásai pontosan a közlekedő és az előszoba szkennelt nyílásaira esnek.
 * - Háló: a hálóajtó (AJ-01) a közlekedő végén, a fal mögött (Y = 7912 + 100 mm).
 * - Dolgozó: a dolgozóajtó (AJ-02) a nappali dolgozó felőli falán, a fal mögött (Y = 7910 + 100 mm).
 * Ellenőrzés: a háló és a dolgozó közti rés 59 mm (a 100 mm-es válaszfalon belül), és a két ablakfal
 * ugyanarra a homlokzatvonalra esik (11 454 / 11 441 mm).
 */
export const PLACEMENT: Record<string, { x: number; z: number; rot: number }> = {
  eloszoba: { x: 0, z: 3.204, rot: 0 },
  kozlekedo: { x: 1.702, z: 4.595, rot: 0 },
  nappali: { x: 6.168, z: 7.91, rot: Math.PI },
  halo: { x: 0.002, z: 8.012, rot: 0 },
  dolgozo: { x: 3.726, z: 8.01, rot: 0 },
};

/** Helyi (helyiség) → közös (lakás) mátrix. */
export function roomMatrix(id: string) {
  const p = PLACEMENT[id] ?? { x: 0, z: 0, rot: 0 };
  return new THREE.Matrix4().makeRotationY(p.rot).setPosition(p.x, 0, p.z);
}

export interface Rect2 {
  x0: number;
  x1: number;
  z0: number;
  z1: number;
}

/** A helyiség alapterülete a közös rendszerben. */
export function worldRect(room: Room, m = roomMatrix(room.id)): Rect2 {
  const { W, L } = roomDims(room);
  const a = new THREE.Vector3(0, 0, 0).applyMatrix4(m);
  const b = new THREE.Vector3(W, 0, L).applyMatrix4(m);
  return { x0: Math.min(a.x, b.x), x1: Math.max(a.x, b.x), z0: Math.min(a.z, b.z), z1: Math.max(a.z, b.z) };
}

export const inRect = (r: Rect2, x: number, z: number, pad = 0) => x >= r.x0 - pad && x <= r.x1 + pad && z >= r.z0 - pad && z <= r.z1 + pad;

export function boundsOf(rects: Rect2[]): Rect2 {
  return {
    x0: Math.min(...rects.map((r) => r.x0)),
    x1: Math.max(...rects.map((r) => r.x1)),
    z0: Math.min(...rects.map((r) => r.z0)),
    z1: Math.max(...rects.map((r) => r.z1)),
  };
}
