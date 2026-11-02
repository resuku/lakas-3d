import type { Room, Variant, WallId } from '../model/types';
import { DEFAULT_CHOICES } from '../data/choices';
import { mm, roomDims, wallFrames, wardrobeRangeOnWall } from './geom';

export interface CurtainLayout {
  wall: WallId;
  /** Sín két vége a fal mentén (m). */
  a: number;
  b: number;
  /** Függönylapok vízszintes kiterjedése (m). */
  panels: [number, number][];
  bottom: number;
  top: number;
  /** A sín távolsága a fal síkjától (m). */
  z: number;
}

const STANDOFF = 0.13;
const SIDE_EXTRA = 0.25;

/** Függönysín és lapok elhelyezése az ablakos falakon (mennyezeti sín). */
export function curtainLayouts(room: Room, v: Variant, choices: Record<string, string> = DEFAULT_CHOICES): CurtainLayout[] {
  if (!v.curtain.on) return [];
  const frames = wallFrames(room);
  const { H } = roomDims(room);
  const out: CurtainLayout[] = [];
  const walls = [...new Set(room.openings.filter((o) => o.kind === 'window').map((o) => o.wall))];
  for (const wall of walls) {
    const f = frames[wall];
    const wins = room.openings.filter((o) => o.kind === 'window' && o.wall === wall);
    const winA = Math.min(...wins.map((o) => mm(o.offset.v)));
    const winB = Math.max(...wins.map((o) => mm(o.offset.v + o.width.v)));
    let a = v.curtain.span === 'window' ? winA - SIDE_EXTRA : 0.02;
    let b = v.curtain.span === 'window' ? winB + SIDE_EXTRA : f.length - 0.02;
    a = Math.max(a, 0.02);
    b = Math.min(b, f.length - 0.02);
    if (v.curtain.span === 'clear') {
      // a radiátor és a bekapcsolt falra szerelt egység (klíma) előtt megáll, hogy azokat ne takarja
      const units = (room.units ?? []).filter((u) => !u.choice || (choices[u.choice.group] ?? DEFAULT_CHOICES[u.choice.group]) === u.choice.option);
      const obstacles = [...room.radiators, ...units].filter((o) => o.wall === wall).map((o) => [mm(o.offset.v), mm(o.offset.v + o.width.v)]);
      for (const [o0, o1] of obstacles) {
        if (o0 >= winB) b = Math.min(b, o0 - 0.03);
        else if (o1 <= winA) a = Math.max(a, o1 + 0.03);
      }
    }
    const wr = wardrobeRangeOnWall(room, wall);
    if (wr) {
      if (wr[0] >= winB) b = Math.min(b, wr[0] - 0.02);
      else if (wr[1] <= winA) a = Math.max(a, wr[1] + 0.02);
    }
    const minBottom = Math.min(...wins.map((o) => mm(o.bottom.v)));
    const bottom = v.curtain.length === 'sill' && minBottom > 0.3 ? minBottom + 0.01 : 0.015;
    const span = b - a;
    const mid = (a + b) / 2;
    const stack = Math.max(0.28, span * 0.16);
    const panels: [number, number][] = v.curtain.closed
      ? [
          [a, mid],
          [mid, b],
        ]
      : [
          [a, a + stack],
          [b - stack, b],
        ];
    out.push({ wall, a, b, panels, bottom, top: H - 0.03, z: STANDOFF });
  }
  return out;
}
