import type { FurnPart, FurnSpec } from '../model/types';
import { mm } from './geom';

// TV-fal elemeinek jelzésszerű elrendezése (m, helyi x a fal mentén, 0 = a TV-fal közepe). A termékoldalak ritkán adják
// meg az elemek helyét, ezért szabály szerint: a magas elemek a két szélre, a falra szerelt TV a magas elemek közti résbe
// (a középhez a lehető legközelebb), alatta az alacsony pad(ok), a falra szerelt elemek a TV mellé, egy magas elem fölé
// vagy a TV fölé – úgy, hogy egyik se takarja a TV-t.

/** A falra szerelt TV (meglévő LG OLED55B23LA, data/furnishing.ts – tv): fél szélesség, magasság, alsó él (m). */
export const TV = { half: 0.614, h: 0.708, bottom: 0.72 };
/** Hézag a TV körül, és a falra szerelt elemek felső határa (belmagasság kb. 2,6 m). */
const GAP = 0.05;
const TOP = 2.5;

export interface TvWallBox {
  x0: number;
  x1: number;
  y0: number;
  y1: number;
  d: number;
  kind: FurnPart['kind'];
}

export interface TvWallLayout {
  boxes: TvWallBox[];
  /** A TV közepe a TV-fal közepéhez képest (m, helyi x) és az alsó éle (m). */
  tvX: number;
  tvY: number;
  /** A TV elfér a magas elemek között. */
  tvFits: boolean;
  /** A legmagasabb elem teteje (m). */
  maxY: number;
}

/** A TV-fal elemei; elemlista hiányában a teljes szélességű alacsony pad. */
export const tvWallParts = (f: FurnSpec): FurnPart[] => (f.parts?.length ? f.parts : [{ kind: 'low', w: f.w, d: f.d, h: Math.min(f.h, 600) }]);

const clamp = (v: number, a: number, b: number) => (a > b ? (a + b) / 2 : Math.min(Math.max(v, a), b));
const overlaps = (a: TvWallBox, b: { x0: number; x1: number; y0: number; y1: number }) => a.x0 < b.x1 - 1e-6 && a.x1 > b.x0 + 1e-6 && a.y0 < b.y1 - 1e-6 && a.y1 > b.y0 + 1e-6;

export function layoutTvWall(parts: FurnPart[], width: number): TvWallLayout {
  const W = width / 2;
  const units = parts.flatMap((p) => Array.from({ length: p.qty ?? 1 }, () => ({ ...p, w: mm(p.w), d: mm(p.d || 300), h: mm(p.h), y: p.y !== undefined ? mm(p.y) : undefined })));
  // a 70 cm-nél alacsonyabb „magas” elem alacsony elemként számít
  const isTall = (u: (typeof units)[number]) => u.kind === 'tall' && u.h >= 0.7;
  const isLow = (u: (typeof units)[number]) => u.kind === 'low' || (u.kind === 'tall' && !isTall(u));
  const out: TvWallBox[] = [];

  // 1. magas elemek a két szélre
  let left = -W;
  let right = W;
  const towers: (TvWallBox & { top: number })[] = [];
  let tallN = 0;
  for (const u of units.filter(isTall)) {
    const atLeft = u.side === 'left' || (u.side !== 'right' && tallN++ % 2 === 0);
    const b = atLeft ? { x0: left, x1: left + u.w } : { x0: right - u.w, x1: right };
    const box = { ...b, y0: 0, y1: u.h, d: u.d, kind: u.kind };
    out.push(box);
    towers.push({ ...box, top: u.h });
    if (atLeft) left += u.w;
    else right -= u.w;
  }

  // 2. a TV a magas elemek közti résbe, a középhez a lehető legközelebb; ha nem fér el, a magas elemek kifelé tolódnak
  const half = TV.half + GAP;
  const tvFits = right - left >= 2 * TV.half - 1e-6;
  if (!tvFits) {
    const need = (2 * TV.half + 0.04 - (right - left)) / 2;
    for (const t of towers) {
      const dx = (t.x0 + t.x1) / 2 < (left + right) / 2 ? -need : need;
      const box = out.find((b) => b.x0 === t.x0 && b.y1 === t.y1 && b.kind === t.kind)!;
      for (const b of [t, box]) {
        b.x0 += dx;
        b.x1 += dx;
      }
    }
    left -= need;
    right += need;
  }
  const tvX = right - left >= 2 * half ? clamp(0, left + half, right - half) : (left + right) / 2;

  // 3. alacsony elemek sorokban a TV alá; ami nem fér el egymás mellett, a sor tetejére kerül
  let rowY = 0;
  let row: typeof units = [];
  const flush = () => {
    // néhány cm-es eltérés (kerekítés a termékadatban): a sor a résbe szűkül
    const over = row.reduce((a, u) => a + u.w, 0) - (right - left);
    if (over > 0 && over < 0.03) row = row.map((u) => ({ ...u, w: u.w - over / row.length }));
    const tw = row.reduce((a, u) => a + u.w, 0);
    let x = clamp(tvX, left + tw / 2, right - tw / 2) - tw / 2;
    for (const u of row) {
      out.push({ x0: x, x1: x + u.w, y0: rowY, y1: rowY + u.h, d: u.d, kind: 'low' });
      x += u.w;
    }
    rowY += Math.max(0, ...row.map((u) => u.h));
    row = [];
  };
  for (const u of units.filter(isLow)) {
    if (row.length && row.reduce((a, v) => a + v.w, 0) + u.w > right - left + 1e-6) flush();
    row.push(u);
  }
  if (row.length) flush();
  // a TV a pad fölé (ha a pad magasabb a szokásosnál, a TV feljebb kerül)
  const under = out.filter((b) => b.kind === 'low' && b.x0 < tvX + half && b.x1 > tvX - half);
  const tvY = Math.max(TV.bottom, ...under.map((b) => b.y1 + GAP));
  const tvRect = { x0: tvX - half, x1: tvX + half, y0: tvY - GAP, y1: tvY + TV.h + GAP };
  const free = (b: TvWallBox) => !overlaps(b, tvRect) && !out.some((o) => overlaps(b, o));
  const topAt = (x0: number, x1: number) => Math.max(0, ...out.filter((b) => b.x0 < x1 && b.x1 > x0).map((b) => b.y1));

  // 4. falra szerelt elemek: a TV mellé, egy magas elem fölé, különben a TV fölötti sávba
  const band: (typeof units)[] = [[]];
  const bandCap = right - left;
  let sideN = 0;
  for (const u of units.filter((u) => u.kind === 'wall' || u.kind === 'shelf')) {
    const wide = u.w >= 1.1 || (u.kind === 'shelf' && u.w >= 0.7);
    let placed = false;
    if (!wide) {
      const first = u.side === 'right' || (u.side !== 'left' && sideN++ % 2 === 1) ? 'r' : 'l';
      for (const k of first === 'l' ? ['l', 'r'] : ['r', 'l']) {
        const x0 = k === 'l' ? tvRect.x0 - u.w : tvRect.x1;
        const x1 = x0 + u.w;
        if (x0 < left - 1e-6 || x1 > right + 1e-6) continue;
        const y0 = Math.max(u.y ?? tvY, topAt(x0, x1) + (u.y !== undefined ? 0 : 0.3));
        const b = { x0, x1, y0, y1: y0 + u.h, d: u.d, kind: u.kind };
        if (b.y1 <= TOP && free(b)) {
          out.push(b);
          placed = true;
          break;
        }
      }
      for (const t of placed ? [] : towers) {
        if (u.w > t.x1 - t.x0 + 0.02) continue;
        const c = (t.x0 + t.x1) / 2;
        const b = { x0: c - u.w / 2, x1: c + u.w / 2, y0: t.top + 0.15, y1: t.top + 0.15 + u.h, d: u.d, kind: u.kind };
        if (b.y1 <= TOP && free(b)) {
          out.push(b);
          t.top = b.y1;
          placed = true;
          break;
        }
      }
    }
    if (placed) continue;
    const cur = band[band.length - 1];
    if (cur.length && cur.reduce((a, v) => a + v.w, 0) + u.w > bandCap + 1e-6) band.push([u]);
    else cur.push(u);
  }
  let y = Math.max(tvRect.y1 + 0.07, rowY + 0.3);
  for (const r of band.filter((r) => r.length)) {
    const tw = r.reduce((a, u) => a + u.w, 0);
    let x = clamp(tvX, left + tw / 2, right - tw / 2) - tw / 2;
    for (const u of r) {
      out.push({ x0: x, x1: x + u.w, y0: y, y1: y + u.h, d: u.d, kind: u.kind });
      x += u.w;
    }
    y += Math.max(...r.map((u) => u.h)) + 0.02;
  }
  return { boxes: out, tvX, tvY, tvFits, maxY: Math.max(0, ...out.map((b) => b.y1)) };
}

/** Elemek, amelyek a TV-be lógnak (ellenőrzéshez). */
export function tvOverlaps(l: TvWallLayout): TvWallBox[] {
  const r = { x0: l.tvX - TV.half, x1: l.tvX + TV.half, y0: l.tvY, y1: l.tvY + TV.h };
  return l.boxes.filter((b) => overlaps(b, r));
}
