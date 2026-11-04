import { DEFAULT_CHOICES } from '../data/choices';
import { FURNISH_GAPS, FURNISHING } from '../data/furnishing';
import { findFurniture } from '../data/products';
import type { FurnitureProduct, FurnSpec, Room } from '../model/types';
import { mm, roomDims, wallFrames, type WallFrame } from './geom';
import { layoutTvWall, TV, tvWallParts } from './tvWall';

// Berendezési javaslat: a választásoktól függő elemek, alaprajzi befoglalók (m) és a közlekedési ellenőrzések.

export interface Rect {
  x0: number;
  x1: number;
  z0: number;
  z1: number;
}

/** A látható elemek; ha a termékhelyre katalógusbútor van választva, annak méretével (`product` mezővel). */
export function activeFurnishing(roomId: string, choices: Record<string, string>, picks: Record<string, string> = {}): ResolvedSpec[] {
  const is = (c: { group: string; option: string }) => (choices[c.group] ?? DEFAULT_CHOICES[c.group]) === c.option;
  const specs = (FURNISHING[roomId] ?? []).filter((f) => (!f.choice || is(f.choice)) && (f.when ?? []).every(is) && !(f.unless && is(f.unless)));
  return resolveFurnishing(specs, picks);
}

export type ResolvedSpec = FurnSpec & { product?: FurnitureProduct };

/** A fal mellé állított bútorok: termékcserénél a hátuk a falnál marad. */
const BACK_TO_WALL = new Set<FurnSpec['kind']>(['sofa', 'tvUnit', 'tvWall', 'bed', 'nightstand', 'desk', 'sideboard', 'shoeCabinet', 'bookcase', 'console']);
/** A betolt szék ülése ennyivel ér az asztallap alá (mm). */
const TUCK = 150;

/**
 * A választott katalógustermék méretei a helyőrző helyén. Az asztalnál a kör / bővített választás szerint a zárt vagy a
 * bővített hossz számít (a hosszú oldal a helyiség z tengelyében); a székek az asztalhoz, az éjjeliszekrények az új ágyhoz igazodnak.
 */
export function resolveFurnishing(specs: FurnSpec[], picks: Record<string, string>): ResolvedSpec[] {
  const out: ResolvedSpec[] = specs.map((f) => {
    const p = f.slot ? findFurniture(picks[f.slot]) : undefined;
    if (!p || p.category !== f.category) return { ...f };
    const s = p.size;
    const r: ResolvedSpec = { ...f, product: p, w: s.w ?? f.w, d: s.d ?? f.d, h: s.h ?? f.h };
    if (f.kind === 'table') {
      const extended = f.shape === 'oval';
      if ((p.shape ?? 'round') === 'round') {
        r.w = s.w ?? f.w;
        r.d = extended ? (s.ext ?? r.w) : r.w;
        r.shape = r.d > r.w ? 'oval' : 'round';
      } else {
        r.w = s.d ?? f.w;
        r.d = extended ? (s.ext ?? s.w ?? f.d) : (s.w ?? f.d);
        r.shape = p.shape;
      }
    }
    if (f.kind === 'divider') r.h = Math.min(r.h, f.h);
    if (f.chaise) {
      const side = p.chaiseSide === 'left' || p.chaiseSide === 'right' ? p.chaiseSide : f.chaise.side;
      r.chaise =
        f.kind === 'desk'
          ? { side, w: s.legD ?? f.chaise.w, d: s.legL ?? f.chaise.d }
          : { side, w: s.chaiseW ?? f.chaise.w, d: s.chaiseD ?? f.chaise.d, corner: p.lType === 'corner' };
    }
    // elemlista nélküli TV-fal: a teljes szélességű alacsony pad a termék formájával (lásd tvWallParts)
    if (f.kind === 'tvWall') r.parts = p.parts?.length ? p.parts : p.form ? [{ kind: 'low', w: r.w, d: r.d, h: Math.min(r.h, 600), form: p.form }] : undefined;
    // falra szerelt szekrény: az alsó éle a forma szerinti magasságban
    else if (p.form?.base === 'wall') r.y = p.form.baseH ?? 0;
    if (f.kind === 'desk') r.h = s.h ?? s.hMin ?? f.h;
    const th = ((f.rot ?? 0) * Math.PI) / 180;
    if (BACK_TO_WALL.has(f.kind)) {
      const dd = (r.d - f.d) / 2;
      r.x = f.x + Math.sin(th) * dd;
      r.z = f.z + Math.cos(th) * dd;
    }
    if (f.kind === 'divider') {
      // a fal felőli vége marad a helyén
      const dw = (r.w - f.w) / 2;
      r.x = f.x + Math.cos(th) * dw;
      r.z = f.z - Math.sin(th) * dw;
    }
    return r;
  });
  const table = out.find((f) => f.kind === 'table');
  if (table)
    for (const c of out.filter((f) => f.kind === 'chair')) {
      const dx = c.x - table.x;
      const dz = c.z - table.z;
      if (Math.abs(dx) > Math.abs(dz)) c.x = table.x + Math.sign(dx) * (table.w / 2 + c.d / 2 - TUCK);
      else c.z = table.z + Math.sign(dz) * (table.d / 2 + c.d / 2 - TUCK);
    }
  const bed = out.find((f) => f.kind === 'bed');
  if (bed)
    for (const n of out.filter((f) => f.kind === 'nightstand')) n.z = bed.z + Math.sign(n.z - bed.z) * (bed.w / 2 + 20 + n.w / 2);
  // a falra szerelt TV a TV-fal elrendezése szerint: a magas elemek közti résben, a pad fölött
  const wall = out.find((f) => f.kind === 'tvWall');
  const tv = out.find((f) => f.kind === 'tv');
  if (wall && tv) {
    const l = layoutTvWall(tvWallParts(wall), mm(wall.w));
    const th = ((wall.rot ?? 0) * Math.PI) / 180;
    tv.x += Math.round(Math.cos(th) * l.tvX * 1000);
    tv.z -= Math.round(Math.sin(th) * l.tvX * 1000);
    tv.y = Math.round(l.tvY * 1000);
  }
  return out;
}

/** Méretkeret termékhelyenként (mm): a katalógusválasztó ezzel jelzi, mi fér a javasolt helyre. */
export const SLOT_LIMITS: Record<
  string,
  { label: string; w?: [number, number]; d?: [number, number]; h?: [number, number]; chaiseD?: [number, number]; mattressMinW?: number }
> = {
  'nappali.kanape': { label: 'szélesség 190–235, mélység legfeljebb 100 cm', w: [1900, 2350], d: [0, 1000] },
  'nappali.kanape-chaise': { label: 'szélesség legfeljebb 260, az L ága legfeljebb kb. 180 cm (az erkély felé ennél hosszabb az erkélyajtó vonalába lóg)', w: [0, 2600], d: [0, 1000], chaiseD: [0, 1800] },
  'nappali.tvfal': { label: 'legfeljebb 250 cm széles (a radiátortól ~30 cm), az alsó rész legfeljebb 46 cm mély', w: [1600, 2500], d: [0, 460], h: [0, 2600] },
  'dolgozo.asztal': { label: 'hosszú ág 150–220 cm, mélység legalább 60 cm, rövid ág legfeljebb 125 cm (az ajtó előtt)', w: [1500, 2200], d: [600, 900] },
  'dolgozo.asztal-sziget': { label: 'hosszú ág 150–200 cm, rövid ág legfeljebb 170 cm (a háló felőli falig ≥ 75 cm)', w: [1500, 2000], d: [600, 900] },
  'nappali.puff': { label: '45–100 cm, magasság 35–48 cm', w: [450, 1000], d: [450, 1000], h: [350, 480] },
  'nappali.tvszekreny': { label: 'ND-006: kb. 180–200 cm széles, 35–45 cm mély, alacsony', w: [1750, 2050], d: [330, 460], h: [0, 600] },
  'nappali.asztal': { label: 'kör ø legfeljebb 120 vagy zárt hossz legfeljebb 140 cm, bővítve legfeljebb 200 cm', w: [0, 1400], d: [0, 1200] },
  'nappali.szek': { label: 'szélesség legfeljebb 55, mélység legfeljebb 60 cm', w: [0, 550], d: [0, 600] },
  'nappali.szonyeg': { label: '230–300 × 160–200 cm', w: [2300, 3000], d: [1600, 2000] },
  'nappali.terelvalaszto': { label: 'szélesség 90–150 cm', w: [900, 1500] },
  'halo.szonyeg': { label: '230–300 × 160–200 cm, legfeljebb 10 mm vastag (ágyfiók, ajtó)', w: [2300, 3000], d: [1600, 2000], h: [0, 10] },
  'halo.agy': { label: 'legalább 180 × 200-as matrachoz; hossz legfeljebb 228 cm (lábvég–gardrób ≥ 70 cm), szélesség legfeljebb 220 cm', w: [0, 2200], d: [0, 2280], mattressMinW: 1800 },
  'halo.ejjeli': { label: '35–55 × 30–45 cm, magasság 40–60 cm', w: [350, 550], d: [300, 450], h: [400, 600] },
};

/** A termék mely méretei lógnak ki a termékhely méretkeretéből (üres = belefér; a hiányzó méret nem számít). */
export function outOfLimits(slot: string, p: FurnitureProduct): string[] {
  const lim = SLOT_LIMITS[slot];
  if (!lim) return [];
  const out: string[] = [];
  const chk = (name: string, v: number | undefined, r?: [number, number]) => {
    if (r && v !== undefined && (v < r[0] || v > r[1])) out.push(`${name} ${Math.round(v / 10)} cm`);
  };
  chk('szélesség', p.size.w, lim.w);
  chk(slot === 'nappali.asztal' && p.shape !== 'round' ? 'asztalszélesség' : 'mélység', p.size.d, lim.d);
  chk(slot === 'halo.szonyeg' ? 'vastagság' : 'magasság', slot === 'halo.szonyeg' ? (p.size.h ?? p.size.pile) : p.size.h, lim.h);
  chk('chaise-mélység', p.size.chaiseD, lim.chaiseD);
  const legMax = slot === 'dolgozo.asztal' ? 1250 : slot === 'dolgozo.asztal-sziget' ? 1700 : 0;
  if (legMax && p.size.legL && p.size.legL > legMax) out.push(`rövid ág ${Math.round(p.size.legL / 10)} cm`);
  if (slot === 'nappali.asztal' && p.size.ext && p.size.ext > 2000) out.push(`bővítve ${Math.round(p.size.ext / 10)} cm`);
  const mw = Number(p.mattress?.split('x')[0]) * 10;
  if (lim.mattressMinW && mw && mw < lim.mattressMinW) out.push(`matrac ${p.mattress?.replace('x', ' × ')} (legalább ${lim.mattressMinW / 10} × 200 kell)`);
  return out;
}

/** Az asztali lámpa alatti bútor teteje (m), ha a pont egy asztal, éjjeliszekrény vagy szekrény fölé esik. */
export function standTop(specs: FurnSpec[], x: number, z: number): number | null {
  const tops = specs
    .filter((f) => ['desk', 'nightstand', 'tvUnit', 'table', 'sideboard', 'shoeCabinet', 'console', 'bookcase', 'cart'].includes(f.kind))
    .filter((f) => footprint(f).some((r) => mm(x) >= r.x0 && mm(x) <= r.x1 && mm(z) >= r.z0 && mm(z) <= r.z1))
    .map((f) => mm((f.y ?? 0) + f.h));
  return tops.length ? Math.max(...tops) : null;
}

/** A felmért elemek (ágy, éjjeliszekrény), amelyeket a látható javaslat helyettesít. */
export function replacedIds(specs: FurnSpec[]): Set<string> {
  return new Set(specs.flatMap((f) => f.replaces ?? []));
}

/** A bútor alaprajzi befoglaló téglalapjai a helyiség rendszerében (m); chaise-nél kettő. */
export function footprint(f: FurnSpec): Rect[] {
  const th = ((f.rot ?? 0) * Math.PI) / 180;
  const c = Math.cos(th);
  const s = Math.sin(th);
  const w = mm(f.w) / 2;
  const d = mm(f.d) / 2;
  const local: [number, number, number, number][] = [[-w, w, -d, d]];
  if (f.chaise) {
    // ülve nézve jobb oldal = helyi −x
    const cw = mm(f.chaise.w);
    const x = f.chaise.side === 'right' ? [-w, -w + cw] : [w - cw, w];
    local.push([x[0], x[1], -d, -d + mm(f.chaise.d)]);
  }
  return local.map(([a0, a1, b0, b1]) => {
    const pts = [
      [a0, b0],
      [a1, b0],
      [a0, b1],
      [a1, b1],
    ].map(([x, z]) => [x * c + z * s + mm(f.x), -x * s + z * c + mm(f.z)]);
    const xs = pts.map((p) => p[0]);
    const zs = pts.map((p) => p[1]);
    return { x0: Math.min(...xs), x1: Math.max(...xs), z0: Math.min(...zs), z1: Math.max(...zs) };
  });
}

const overlap = (a: Rect, b: Rect) => a.x0 < b.x1 - 1e-6 && a.x1 > b.x0 + 1e-6 && a.z0 < b.z1 - 1e-6 && a.z1 > b.z0 + 1e-6;

/** Két téglalap távolsága és a köztük húzott mérővonal (ha egy tengely mentén elválnak). */
export function rectGap(a: Rect, b: Rect): { gap: number; from: [number, number]; to: [number, number] } | null {
  const gx = Math.max(b.x0 - a.x1, a.x0 - b.x1);
  const gz = Math.max(b.z0 - a.z1, a.z0 - b.z1);
  if (gx <= 0 && gz <= 0) return { gap: 0, from: [a.x1, a.z1], to: [a.x1, a.z1] };
  if (gx >= gz) {
    const z = (Math.max(a.z0, b.z0) + Math.min(a.z1, b.z1)) / 2;
    return a.x1 <= b.x0 ? { gap: gx, from: [a.x1, z], to: [b.x0, z] } : { gap: gx, from: [b.x1, z], to: [a.x0, z] };
  }
  const x = (Math.max(a.x0, b.x0) + Math.min(a.x1, b.x1)) / 2;
  return a.z1 <= b.z0 ? { gap: gz, from: [x, a.z1], to: [x, b.z0] } : { gap: gz, from: [x, b.z1], to: [x, a.z0] };
}

/** A javaslat mérendő közei (csak a látható elemek között). */
export function furnishGaps(roomId: string, specs: FurnSpec[]) {
  const byId = new Map(specs.map((f) => [f.id, f]));
  return (FURNISH_GAPS[roomId] ?? []).flatMap((g) => {
    const a = byId.get(g.a);
    const b = byId.get(g.b);
    if (!a || !b) return [];
    let best: ReturnType<typeof rectGap> = null;
    for (const ra of footprint(a))
      for (const rb of footprint(b)) {
        const r = rectGap(ra, rb);
        if (r && (!best || r.gap < best.gap)) best = r;
      }
    return best ? [{ ...g, ...best }] : [];
  });
}

/** Téglalap a fal saját rendszerében: `a` a fal mentén, `d` a faltól befelé mért távolság (m). */
function onWall(f: WallFrame, r: Rect) {
  const pts = [
    [r.x0, r.z0],
    [r.x1, r.z0],
    [r.x0, r.z1],
    [r.x1, r.z1],
  ].map(([x, z]) => ({ a: (x - f.origin.x) * f.u.x + (z - f.origin.z) * f.u.z, d: (x - f.origin.x) * f.n.x + (z - f.origin.z) * f.n.z }));
  return { a0: Math.min(...pts.map((p) => p.a)), a1: Math.max(...pts.map((p) => p.a)), d0: Math.min(...pts.map((p) => p.d)), d1: Math.max(...pts.map((p) => p.d)) };
}

/** Falmenti sáv téglalapja a helyiség rendszerében: `along` a fal mentén, `depth` a faltól befelé (m). */
function wallRect(f: WallFrame, a0: number, a1: number, d0: number, d1: number): Rect {
  const pts = [
    [a0, d0],
    [a1, d0],
    [a0, d1],
    [a1, d1],
  ].map(([a, d]) => f.origin.clone().addScaledVector(f.u, a).addScaledVector(f.n, d));
  return { x0: Math.min(...pts.map((p) => p.x)), x1: Math.max(...pts.map((p) => p.x)), z0: Math.min(...pts.map((p) => p.z)), z1: Math.max(...pts.map((p) => p.z)) };
}

/** Szabadon tartandó zónák: radiátor előtt, erkélyajtó megközelítése, befelé nyíló ajtólap íve. */
function keepClearZones(room: Room): { label: string; r: Rect }[] {
  const frames = wallFrames(room);
  const out: { label: string; r: Rect }[] = [];
  for (const r of room.radiators) {
    const a = mm(r.offset.v);
    out.push({ label: `a radiátor (${r.id}) előtti szabad zóna`, r: wallRect(frames[r.wall], a - 0.05, a + mm(r.width.v) + 0.05, 0, mm(r.gap.v + r.depth.v) + 0.3) });
  }
  for (const o of room.openings) {
    const f = frames[o.wall];
    const a = mm(o.offset.v);
    if (o.doorPane?.outward) {
      const b = [0, ...(o.vsplits ?? []).map((v) => v.at), o.width.v];
      const i = o.doorPane.index;
      out.push({ label: 'az erkélyajtó megközelítése (90 cm)', r: wallRect(f, a + mm(b[i]), a + mm(b[i + 1]), 0, 0.9) });
    }
    if (o.kind === 'door' && o.leaf && !o.leaf.away && !o.leaf.fixed) {
      const lw = mm(o.leaf.width.v);
      const h = o.leaf.hinge === 'end' ? a + mm(o.width.v) - 0.03 : a + 0.03;
      out.push({ label: `${o.label.toLowerCase()} nyitási íve`, r: wallRect(f, o.leaf.hinge === 'end' ? h - lw : h, o.leaf.hinge === 'end' ? h : h + lw, 0, lw) });
    }
  }
  return out;
}

export interface FurnishFinding {
  level: 'warn' | 'info' | 'ok';
  text: string;
}

/** Ellenőrzések a látható berendezésre: zónák, ajtók és átjárók előtti szabad hely, mérendő közök, ágy és gardrób között. */
export function furnishChecks(room: Room, choices: Record<string, string>, picks: Record<string, string> = {}): FurnishFinding[] {
  const specs = activeFurnishing(room.id, choices, picks);
  if (!specs.length) return [];
  const out: FurnishFinding[] = [];
  const solid = specs.filter((f) => f.kind !== 'rug' && f.kind !== 'tv');

  // TV-fal: a jelzésszerű elrendezésben hová kerül a TV, és elfér-e
  const tvWall = specs.find((f) => f.kind === 'tvWall');
  if (tvWall && specs.some((f) => f.kind === 'tv')) {
    const l = layoutTvWall(tvWallParts(tvWall), mm(tvWall.w));
    const cmOf = (m: number) => Math.round(Math.abs(m) * 100);
    if (!l.tvFits)
      out.push({ level: 'warn', text: `${tvWall.label}: a TV (${(TV.half * 200).toFixed(1).replace('.', ',')} cm) szélesebb, mint a magas elemek közti rés – a magas elemeket szét kell húzni, a TV-fal így szélesebb a termékoldali méretnél.` });
    if (cmOf(l.tvX) >= 2)
      out.push({ level: 'info', text: `${tvWall.label}: a magas elem miatt a TV a TV-fal közepétől kb. ${cmOf(l.tvX)} cm-rel ${l.tvX > 0 ? 'az erkély' : 'az étkező'} felé kerül (a kanapé középvonalától is).` });
    if (l.tvY > TV.bottom + 0.01) out.push({ level: 'info', text: `${tvWall.label}: a pad magassága miatt a TV alsó éle kb. ${cmOf(l.tvY)} cm-re kerül (alapból ${cmOf(TV.bottom)} cm).` });
    if (l.maxY > 2.5)
      out.push({ level: 'info', text: `${tvWall.label}: a termékoldal elemei a jelzésszerű elrendezésben kb. ${cmOf(l.maxY)} cm magasra érnek – a valós összeállítást a termékoldalon érdemes megnézni.` });
  }

  for (const z of keepClearZones(room)) {
    for (const f of solid)
      if (footprint(f).some((r) => overlap(r, z.r))) out.push({ level: 'warn', text: `${f.label}: belelóg ${z.label} területébe.` });
    for (const f of specs.filter((f) => f.kind === 'rug'))
      if (z.label.includes('nyitási') && footprint(f).some((r) => overlap(r, z.r)))
        out.push({ level: 'info', text: `${f.label}: az ajtólap a szőnyeg fölött nyílik – lapos szövésű szőnyeg vagy elég nagy ajtóalsó hézag kell (a ${f.h} mm-es modellben).` });
  }

  // Ajtók és átjárók előtt: a nyílás szélességében a legközelebbi bútorig mért szabad mélység (a megmaradó felmért ágy és
  // éjjeliszekrény is számít)
  const frames = wallFrames(room);
  const hidden = replacedIds(specs);
  const rects = [
    ...solid.flatMap(footprint),
    ...room.beds.filter((b) => !hidden.has(b.id)).map((b) => ({ x0: mm(b.x0.v), x1: mm(b.x0.v + b.sx.v), z0: mm(b.z0.v), z1: mm(b.z0.v + b.sz.v) })),
    ...(room.furniture ?? []).filter((n) => !hidden.has(n.id)).map((n) => ({ x0: mm(n.x0), x1: mm(n.x0 + n.sx), z0: mm(n.z0), z1: mm(n.z0 + n.sz) })),
  ];
  for (const o of room.openings.filter((o) => o.kind !== 'window')) {
    const f = frames[o.wall];
    const a0 = mm(o.offset.v);
    const a1 = a0 + mm(o.width.v);
    let free = Infinity;
    for (const r of rects) {
      const w = onWall(f, r);
      if (w.a0 < a1 && w.a1 > a0) free = Math.min(free, w.d0);
    }
    if (free < 1.2)
      out.push({
        level: free < 0.6 ? 'warn' : 'ok',
        text: `Szabad hely a nyílás előtt (${o.label}), a legközelebbi bútorig: ~${Math.round(free * 1000)} mm${free < 0.6 ? ' – szűk, 600 mm alatt.' : '.'}`,
      });
  }

  // Az L ága az erkélyajtó vonalában: a faltól mért hossza és az ajtómező kezdete (user, 2026-11-02: legfeljebb ~180 cm)
  for (const o of room.openings.filter((o) => o.doorPane?.outward)) {
    const f = frames[o.wall];
    const b = [0, ...(o.vsplits ?? []).map((v) => v.at), o.width.v];
    const door0 = mm(o.offset.v + b[o.doorPane!.index]);
    const door1 = mm(o.offset.v + b[o.doorPane!.index + 1]);
    for (const s of specs.filter((s) => s.chaise)) {
      const w = onWall(f, footprint(s)[1]);
      if (w.d0 > 1.5) continue;
      // az ág a fal síkjától a nyílás felé: melyik vége esik közelebb az ajtómezőhöz
      const into = w.a1 > door0 && w.a0 < door1;
      out.push({
        level: into ? 'warn' : 'ok',
        text: into
          ? `${s.label}: az L ága ${Math.round(w.a0 * 1000)}–${Math.round(w.a1 * 1000)} mm között fut, az erkélyajtó mezője ${Math.round(door0 * 1000)} mm-nél kezdődik – belelóg az erkélyajtó vonalába (az osztás helye fotóbecslés).`
          : `${s.label}: az L ága ${Math.round(w.a1 * 1000)} mm-ig nyúlik, az erkélyajtó mezője ${Math.round(door0 * 1000)} mm-nél kezdődik – az ajtó vonala szabad.`,
      });
    }
  }

  for (const g of furnishGaps(room.id, specs)) {
    const v = Math.round(g.gap * 1000);
    out.push({ level: v < g.min ? 'warn' : 'ok', text: `${g.label}: ~${v} mm${v < g.min ? ` – szűk, ${g.min} mm alatt.` : '.'}` });
  }

  // Ágy lábvége és gardróbfront (a javasolt új ágynál; a meglévőt a fő ellenőrzés méri)
  if (room.wardrobe?.wall === 'x1')
    for (const b of specs.filter((f) => f.kind === 'bed')) {
      const { W } = roomDims(room);
      const gap = W - mm(room.wardrobe.depth.v) - Math.max(...footprint(b).map((r) => r.x1));
      out.push({
        level: gap < 0.7 ? 'warn' : 'ok',
        text: `Közlekedősáv az új ágy lábvége és a gardróbfront között: ~${Math.round(gap * 1000)} mm (A). ${gap < 0.7 ? 'Szűk – 700 mm alatt.' : 'Elegendő.'}`,
      });
    }
  return out;
}
