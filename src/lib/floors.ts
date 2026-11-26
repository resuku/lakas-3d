import type { FloorPattern, Room, Variant } from '../model/types';
import { mm } from './geom';

// Melyik burkolat hol látszik: a változat padlója, a járólapos zóna külön burkolata (`hallFloor`: előszoba, közlekedő
// és a nappali `floorZone`-ja), vagy a régi kapcsoló szerinti járólap-helyőrző (`floorAll === false`, csak az
// előszobában és a közlekedőben).

export interface FloorSpec {
  kind: 'main' | 'hall' | 'alt';
  pattern: FloorPattern;
  tone: string;
  dir: 'x' | 'z';
  plank?: { l: number; w: number };
  /** Katalógustermék (a helyi fotótextúrához és a gyorsinfóhoz); az `alt` helyőrzőnek nincs. */
  productId?: string;
}

/** A helyiség (teljes) padlója. */
export function roomFloor(room: Room, v: Variant): FloorSpec {
  if (room.floor && v.hallFloor) return { kind: 'hall', ...v.hallFloor, dir: v.floor.dir, productId: v.products?.hallFloor };
  if (room.floor && v.floorAll === false) return { kind: 'alt', pattern: room.floor.pattern, tone: room.floor.tone, plank: room.floor.plank, dir: v.floor.dir };
  return { kind: 'main', ...v.floor, productId: v.products?.floor };
}

/** A helyiség járólapos része (m-ben, a helyiség rendszerében), ha a változatban külön burkolatú. */
export function zoneFloor(room: Room, v: Variant): (FloorSpec & { x0: number; x1: number; z0: number; z1: number }) | null {
  const z = room.floorZone;
  if (!z || !v.hallFloor) return null;
  return { kind: 'hall', ...v.hallFloor, dir: v.floor.dir, productId: v.products?.hallFloor, x0: mm(z.x0.v), x1: mm(z.x1.v), z0: mm(z.z0.v), z1: mm(z.z1.v) };
}

/** A járólapos zóna területe a helyiségben (m²): a teljes helyiség (előszoba, közlekedő) vagy a `floorZone`. */
export function hallArea(room: Room): number {
  if (room.floor) return mm(room.size.x.v) * mm(room.size.z.v);
  const z = room.floorZone;
  return z ? mm(z.x1.v - z.x0.v) * mm(z.z1.v - z.z0.v) : 0;
}
