import { CURTAIN_PRODUCTS, DOOR_PRODUCTS, FLOOR_PRODUCTS, PAINT_PRODUCTS, WALL_PANELS, findCurtain, findDoor, findFloor, findPaint } from '../data/products';
import { DEFAULT_VARIANTS, VARIANT_GROUPS } from '../data/variants';
import type { ColorSource, CurtainProduct, DoorProduct, FloorProduct, HandleFinish, PaintProduct, Variant } from '../model/types';
import { toLch } from './furnitureFit';

// Hozzáillő változat (2026-11-26, user): a változat bepipált elemei megmaradnak, a többi elemhez a generátor valós
// katalógusterméket választ. Két forrásból dolgozik:
//  1. minta: a beépített javaslatok (DEFAULT_VARIANTS) közül az, amelyik a megtartott elemekhez a legjobban illik
//     (kis eltérésnél a kiinduló változathoz is közel áll, nagynál attól távol) – a szabad elemek célszíne a mintáé;
//  2. arányok: a beépített javaslatokban előforduló világosság- és kontrasztviszonyok (fal–padló, fal–kiemelés,
//     padló–ajtó, fal–függöny) tartománya; ami ezen kívül esik, pontlevonást kap (nem tiltás).
// Színtér: OKLab (ΔE ≈ 0,02 alig látható különbség). Gépi összeállítás, nem lakberendezői javaslat.

export type RemixKey = 'wall' | 'accents' | 'floor' | 'hall' | 'door' | 'handle' | 'skirting' | 'curtain' | 'light';
export type RemixLevel = 'small' | 'medium' | 'large';

export const REMIX_LEVELS: { v: RemixLevel; label: string; hint: string }[] = [
  { v: 'small', label: 'kicsi', hint: 'rokon árnyalatok, más termékek; a kiinduló változat hangulata marad' },
  { v: 'medium', label: 'közepes', hint: 'a megtartott elemekhez illő javaslatok irányai' },
  { v: 'large', label: 'nagy', hint: 'új színirány: a szabad elemek érezhetően eltérnek a mostanitól' },
];

type Lab = [number, number, number];
const labCache = new Map<string, Lab>();
function lab(hex: string): Lab {
  let r = labCache.get(hex);
  if (!r) {
    const c = toLch(hex);
    const rad = (c.h * Math.PI) / 180;
    r = [c.L, c.C * Math.cos(rad), c.C * Math.sin(rad)];
    labCache.set(hex, r);
  }
  return r;
}
const dE = (x: string, y: string) => {
  const a = lab(x);
  const b = lab(y);
  return Math.hypot(a[0] - b[0], a[1] - b[1], a[2] - b[2]);
};
const L = (hex: string) => lab(hex)[0];
const C = (hex: string) => Math.hypot(lab(hex)[1], lab(hex)[2]);

/** Determinisztikus véletlen (mulberry32) – ugyanaz a mag ugyanazokat a jelölteket adja. */
function rng(seed: number) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// ---------------------------------------------------------------------------
// Arányok a beépített javaslatokból

/** Egy változat színei (a fa falpanelt külön, az arányokban nem számít kiemelő festékként). */
interface Colors {
  wall?: string;
  accents?: string[];
  floor?: string;
  hall?: string;
  door?: string;
  curtain?: string;
  sheer?: string;
}

const colorsOf = (v: Variant): Colors => ({
  wall: v.wall,
  accents: Object.entries(v.accents)
    .filter(([k]) => !v.accentWood?.includes(k))
    .map(([, h]) => h),
  floor: v.floor.tone,
  hall: v.hallFloor?.tone,
  door: v.door,
  curtain: v.curtain.on ? v.curtain.color : undefined,
  sheer: v.curtain.on ? v.curtain.sheerLayer : undefined,
});

type Feature = { id: string; x: number };
function features(c: Colors): Feature[] {
  const f: Feature[] = [];
  // a fal árnyalata (OKLab a, b) is: a javaslatok falai melegfehérek, greige-ek, kevés hideg tónussal
  if (c.wall) f.push({ id: 'wallL', x: L(c.wall) }, { id: 'wallC', x: C(c.wall) }, { id: 'wallA', x: lab(c.wall)[1] }, { id: 'wallB', x: lab(c.wall)[2] });
  if (c.wall && c.floor) f.push({ id: 'floorWallL', x: L(c.floor) - L(c.wall) });
  for (const a of c.accents ?? []) {
    f.push({ id: 'accentL', x: L(a) }, { id: 'accentC', x: C(a) });
    if (c.wall) f.push({ id: 'accentWallDE', x: dE(a, c.wall) });
  }
  if (c.door && c.floor) f.push({ id: 'doorFloorL', x: L(c.door) - L(c.floor) });
  if (c.door) f.push({ id: 'doorC', x: C(c.door) });
  if (c.curtain) {
    f.push({ id: 'curtainL', x: L(c.curtain) }, { id: 'curtainC', x: C(c.curtain) });
    if (c.wall) f.push({ id: 'curtainWallDE', x: dE(c.curtain, c.wall) });
  }
  if (c.sheer) f.push({ id: 'sheerL', x: L(c.sheer) }, { id: 'sheerC', x: C(c.sheer) });
  if (c.hall) f.push({ id: 'hallL', x: L(c.hall) }, { id: 'hallC', x: C(c.hall) });
  return f;
}

let ranges: Map<string, [number, number]> | null = null;
function corpusRanges() {
  if (ranges) return ranges;
  ranges = new Map();
  for (const v of DEFAULT_VARIANTS)
    for (const { id, x } of features(colorsOf(v))) {
      const r = ranges.get(id);
      ranges.set(id, r ? [Math.min(r[0], x), Math.max(r[1], x)] : [x, x]);
    }
  return ranges;
}

/** Tartományon kívüliség, a tartomány szélességében mérve (0 = a javaslatokban előfordul). */
function penalty(c: Colors): number {
  const R = corpusRanges();
  let p = 0;
  for (const { id, x } of features(c)) {
    const r = R.get(id);
    if (!r) continue;
    const w = Math.max(r[1] - r[0], 0.04);
    p += Math.max(0, r[0] - x, x - r[1]) / w;
  }
  return p;
}

const FEATURE_TEXT: Record<string, [string, string]> = {
  wallL: ['a falszín sötétebb, mint bármelyik javaslatban', 'a falszín világosabb, mint bármelyik javaslatban'],
  wallC: ['', 'a falszín telítettebb a javaslatokénál'],
  wallA: ['a falszín zöldesebb a javaslatokénál', 'a falszín rózsásabb a javaslatokénál'],
  wallB: ['a falszín hidegebb (kékesebb) a javaslatokénál', 'a falszín sárgásabb a javaslatokénál'],
  floorWallL: ['a padló és a fal között nagyobb a világosságkülönbség a szokásosnál', 'a padló és a fal világossága szokatlanul közel van'],
  accentL: ['a kiemelt fal sötétebb a javaslatokénál', 'a kiemelt fal világosabb a javaslatokénál'],
  accentC: ['', 'a kiemelt fal élénkebb a javaslatokénál'],
  accentWallDE: ['a kiemelt fal alig tér el a faltól', 'a kiemelt fal erősebb kontraszt a szokásosnál'],
  doorFloorL: ['az ajtó sötétebb a padlóhoz képest a szokásosnál', 'az ajtó és a padló kontrasztja szokatlan'],
  doorC: ['', 'az ajtó színe telítettebb a javaslatokénál'],
  curtainC: ['', 'a függöny élénkebb a javaslatokénál'],
  curtainL: ['a függöny sötétebb a javaslatokénál', 'a függöny világosabb a javaslatokénál'],
  curtainWallDE: ['', 'a függöny jobban elüt a faltól, mint a javaslatokban'],
  sheerL: ['a fátyol sötétebb a szokásosnál', ''],
  sheerC: ['', 'a fátyol színesebb a szokásosnál'],
  hallL: ['a járólap sötétebb a javaslatokénál', 'a járólap világosabb a javaslatokénál'],
  hallC: ['', 'a járólap színesebb a javaslatokénál'],
};

/** Szöveges figyelmeztetések a tartományon kívüli arányokra (ismétlés nélkül). */
function warnings(c: Colors): string[] {
  const R = corpusRanges();
  const out = new Set<string>();
  for (const { id, x } of features(c)) {
    const r = R.get(id);
    const w = r ? Math.max(r[1] - r[0], 0.04) : 0;
    if (!r) continue;
    const t = x < r[0] - 0.15 * w ? FEATURE_TEXT[id]?.[0] : x > r[1] + 0.15 * w ? FEATURE_TEXT[id]?.[1] : '';
    if (t) out.add(t);
  }
  return [...out];
}

// ---------------------------------------------------------------------------
// Minta (beépített javaslat) választása

const GROUP_OF = new Map(VARIANT_GROUPS.flatMap((g) => g.ids.map((id) => [id, g.id] as const)));

const accentDist = (a: Variant, b: Variant) => {
  const x = Object.values(a.accents);
  const y = Object.values(b.accents);
  if (!x.length || !y.length) return x.length === y.length ? 0 : 0.08;
  return Math.min(...x.flatMap((p) => y.map((q) => dE(p, q))));
};

/** Elemenkénti távolság két változat között. */
function elemDist(k: RemixKey, a: Variant, b: Variant): number {
  switch (k) {
    case 'wall':
      return dE(a.wall, b.wall);
    case 'accents':
      return accentDist(a, b);
    case 'floor':
      return dE(a.floor.tone, b.floor.tone);
    case 'hall':
      return a.hallFloor && b.hallFloor ? dE(a.hallFloor.tone, b.hallFloor.tone) : a.hallFloor || b.hallFloor ? 0.05 : 0;
    case 'door':
      return dE(a.door, b.door) + ((a.doorStyle ?? 'flat') !== (b.doorStyle ?? 'flat') ? 0.03 : 0);
    case 'handle':
      return (a.handle ?? 'steel') === (b.handle ?? 'steel') ? 0 : 0.08;
    case 'skirting':
      return a.skirting.mode === b.skirting.mode ? 0 : 0.03;
    case 'curtain':
      return a.curtain.on && b.curtain.on ? dE(a.curtain.color, b.curtain.color) : 0;
    case 'light':
      return 0;
  }
}

const COLOR_KEYS: RemixKey[] = ['wall', 'accents', 'floor', 'hall', 'door', 'handle', 'skirting', 'curtain'];

function pickDonors(src: Variant, pins: Set<RemixKey>, level: RemixLevel, n: number, rand: () => number, favs: Set<string>): Variant[] {
  const scored = DEFAULT_VARIANTS.filter((d) => level === 'small' || d.id !== src.id).map((d) => {
    const fit = [...pins].reduce((s, k) => s + elemDist(k, d, src), 0);
    const diff = COLOR_KEYS.filter((k) => !pins.has(k)).reduce((s, k) => s + elemDist(k, d, src), 0);
    const s = level === 'small' ? fit + 0.6 * diff : level === 'medium' ? fit : fit - 0.2 * diff;
    return { d, s: s - (favs.has(d.id) ? 0.03 : 0) };
  });
  const out: Variant[] = [];
  const groups = new Map<string, number>();
  while (out.length < n && scored.length) {
    // a már választott stílusvonal kis levonást kap (változatosság), majd súlyozott véletlen a legjobbak közül
    const adj = scored.map((x) => ({ ...x, a: x.s + (level === 'small' ? 0 : 0.15 * (groups.get(GROUP_OF.get(x.d.id) ?? '') ?? 0)) })).sort((p, q) => p.a - q.a);
    const top = adj.slice(0, level === 'small' ? 3 : 6);
    const w = top.map((x) => Math.exp(-(x.a - top[0].a) / 0.05));
    let r = rand() * w.reduce((s, x) => s + x, 0);
    let i = 0;
    while (i < top.length - 1 && (r -= w[i]) > 0) i++;
    const pick = top[i].d;
    out.push(pick);
    const g = GROUP_OF.get(pick.id) ?? '';
    groups.set(g, (groups.get(g) ?? 0) + 1);
    // kis eltérésnél ugyanaz a minta többször is jöhet (a termékek úgyis mások); egyébként mindegyik egyszer
    if (level !== 'small') scored.splice(scored.findIndex((x) => x.d.id === pick.id), 1);
  }
  return out;
}

// ---------------------------------------------------------------------------
// Termékválasztás

/** Ennyivel kell legalább eltérnie a szabad elemnek a kiinduló változatétól (OKLab ΔE), elemszorzóval. */
const MIN_CHANGE: Record<RemixLevel, number> = { small: 0.018, medium: 0.04, large: 0.075 };
// a fal, az ajtó és a fátyol háttérelem: elég, ha más termék; az új színirányt főleg a kiemelés, a függöny és a padló hozza
const CHANGE_FACTOR: Record<string, number> = { wall: 0.3, door: 0.3, sheer: 0.3, floor: 0.7, hall: 0.6, curtain: 0.8 };
const JITTER: Record<RemixLevel, number> = { small: 0.012, medium: 0.025, large: 0.04 };
const SOURCE_PENALTY: Partial<Record<ColorSource, number>> = { 'color-name': 0.02, 'site-photo': 0.01 };

interface Ctx {
  level: RemixLevel;
  rand: () => number;
  /** A korábbi jelöltekben már szereplő termékek (elemenként) – változatosság. */
  used: Map<string, Set<string>>;
}

function choose<T extends { id: string; hex: string; hexSource: ColorSource }>(
  ctx: Ctx,
  elem: string,
  pool: T[],
  target: string,
  current: string | undefined,
  colorsWith: (hex: string) => Colors,
  extra: (p: T) => number = () => 0,
): T {
  const minChange = MIN_CHANGE[ctx.level] * (CHANGE_FACTOR[elem] ?? 1);
  const used = ctx.used.get(elem) ?? new Set<string>();
  let best: T = pool[0];
  let bestS = Infinity;
  for (const p of pool) {
    let s = dE(p.hex, target) + 0.25 * penalty(colorsWith(p.hex)) + extra(p) + (SOURCE_PENALTY[p.hexSource] ?? 0);
    if (current && dE(p.hex, current) < minChange) s += 0.5;
    if (used.has(p.id)) s += 0.06;
    s += ctx.rand() * JITTER[ctx.level];
    if (s < bestS) {
      bestS = s;
      best = p;
    }
  }
  used.add(best.id);
  ctx.used.set(elem, used);
  return best;
}

// a kiválasztható termékkörök (egyszer számolva)
let pools: { wall: PaintProduct[]; accent: PaintProduct[]; floor: FloorProduct[]; hall: FloorProduct[]; curtain: CurtainProduct[]; sheer: CurtainProduct[] } | null = null;
function getPools() {
  if (pools) return pools;
  const paints = PAINT_PRODUCTS.filter((p) => p.family !== 'vivid');
  const R = corpusRanges();
  const wallL = R.get('wallL')!;
  pools = {
    // falnak csak a javaslatok falszíneihez hasonlóan világos festék (a sötétebbek kiemelésnek valók)
    wall: paints.filter((p) => L(p.hex) >= wallL[0] - 0.04),
    accent: paints,
    floor: FLOOR_PRODUCTS.filter((p) => p.pattern !== 'tile'),
    hall: FLOOR_PRODUCTS.filter((p) => p.pattern === 'tile'),
    curtain: CURTAIN_PRODUCTS.filter((p) => p.type !== 'sheer'),
    sheer: CURTAIN_PRODUCTS.filter((p) => p.type === 'sheer'),
  };
  return pools;
}

// ---------------------------------------------------------------------------
// Jelöltek

export interface RemixCandidate {
  /** A kész változat (az azonosítót és a nevet a hívó adja véglegesen). */
  variant: Variant;
  donor: Variant;
  /** A választott termékek elemenként: [címke, termék rövid neve, szín, megtartott-e]. */
  parts: { label: string; name: string; hex: string; kept: boolean }[];
  warnings: string[];
}

const HANDLE_TEXT: Record<HandleFinish, string> = { steel: 'inox', black: 'fekete', brass: 'sárgaréz' };
const SKIRT_TEXT = { wall: 'falszínű', door: 'ajtószínű', white: 'fehér' } as const;
const short = (v: Variant) => v.name.split(' – ')[0];
/** Festéknév; a névtelen Dulux kevert színeknél a kód. */
const paintTitle = (p: PaintProduct) => (p.name === 'kevert szín' ? `${p.code} (kevert)` : p.name);
const paintName = (p?: PaintProduct) => (p ? `${p.brand} ${paintTitle(p)}` : '');
const roomLabel: Record<string, string> = { nappali: 'nappali', halo: 'háló', dolgozo: 'dolgozó', eloszoba: 'előszoba', kozlekedo: 'közlekedő' };

/** Elemcímkék a választóhoz és a jelöltlistához. */
export const REMIX_LABEL: Record<RemixKey, string> = {
  wall: 'Falszín',
  accents: 'Kiemelt falak',
  floor: 'Padló',
  hall: 'Járólapos zóna',
  door: 'Ajtók',
  handle: 'Kilincs',
  skirting: 'Szegélyléc',
  curtain: 'Függöny',
  light: 'Világítási terv',
};

/** A változatban jelen lévő, megtartható elemek. */
export function remixKeys(v: Variant): RemixKey[] {
  return (['wall', 'accents', 'floor', 'hall', 'door', 'handle', 'skirting', 'curtain', 'light'] as RemixKey[]).filter(
    (k) => (k !== 'accents' || Object.keys(v.accents).length > 0) && (k !== 'hall' || !!v.hallFloor) && (k !== 'curtain' || v.curtain.on),
  );
}

function generate(src: Variant, donor: Variant, pins: Set<RemixKey>, ctx: Ctx): RemixCandidate {
  const P = getPools();
  const v: Variant = structuredClone(src);
  delete v.feedback;
  v.products = { ...(src.products ?? {}) };
  const c: Colors = {};
  const kept = (k: RemixKey) => pins.has(k);
  const big = ctx.level === 'large';
  const srcColors = colorsOf(src);
  // a megtartott elemek színe ismert, a többi sorban kerül be: padló → fal → ajtó → kiemelés → járólap → függöny
  if (kept('wall')) c.wall = src.wall;
  if (kept('floor')) c.floor = src.floor.tone;
  if (kept('door')) c.door = src.door;
  if (kept('accents')) c.accents = srcColors.accents;
  if (kept('hall')) c.hall = srcColors.hall;
  if (kept('curtain')) Object.assign(c, { curtain: srcColors.curtain, sheer: srcColors.sheer });

  if (!kept('floor')) {
    // a lerakási minta (hajópadló / halszálka) kis és közepes eltérésnél marad, nagynál a mintáé
    const pattern = big ? donor.floor.pattern : src.floor.pattern;
    const pool = P.floor.filter((p) => p.pattern === (pattern === 'tile' ? 'plank' : pattern));
    const p = choose(ctx, 'floor', pool, donor.floor.tone, src.floor.tone, (h) => ({ ...c, floor: h }));
    v.floor = { pattern: p.pattern, tone: p.hex, dir: src.floor.dir, ...(p.size ? { plank: { l: p.size.l, w: p.size.w } } : {}) };
    v.products.floor = p.id;
    c.floor = p.hex;
  }
  if (!kept('wall')) {
    const p = choose(ctx, 'wall', P.wall, donor.wall, src.wall, (h) => ({ ...c, wall: h }));
    v.wall = p.hex;
    v.products.wall = p.id;
    c.wall = p.hex;
  }
  if (!kept('door')) {
    const style = big ? (donor.doorStyle ?? 'flat') : (src.doorStyle ?? 'flat');
    const p = choose<DoorProduct>(ctx, 'door', DOOR_PRODUCTS, donor.door, src.door, (h) => ({ ...c, door: h }), (d) => (d.style === style ? 0 : 0.05));
    v.door = p.hex;
    v.doorStyle = p.style;
    v.products.door = p.id;
    c.door = p.hex;
  }
  if (!kept('handle')) v.handle = donor.handle ?? 'steel';
  if (!kept('skirting')) v.skirting = { h: src.skirting.h, mode: donor.skirting.mode };

  if (!kept('accents')) {
    // a kiemelt falak helye a kiinduló változaté (ha nincs, a mintáé); fa falpanel: kis/közepes eltérésnél ahol eddig, nagynál ahol a mintában
    const keys = Object.keys(src.accents).length ? Object.keys(src.accents) : Object.keys(donor.accents);
    const donorAcc = Object.entries(donor.accents);
    v.accents = {};
    v.accentWood = [];
    for (const k of Object.keys(src.accents)) delete v.products[`accent:${k}`];
    c.accents = [];
    for (const k of keys) {
      const wood = big ? !!donor.accentWood?.includes(k) : !!src.accentWood?.includes(k);
      const target = donor.accents[k] ?? donorAcc[0]?.[1] ?? src.accents[k];
      if (!target) continue;
      const pool = wood ? WALL_PANELS : P.accent;
      const p = choose(ctx, wood ? 'panel' : 'accent', pool, target, src.accents[k], (h) => (wood ? c : { ...c, accents: [...(c.accents ?? []), h] }));
      v.accents[k] = p.hex;
      v.products[`accent:${k}`] = p.id;
      if (wood) v.accentWood.push(k);
      else c.accents.push(p.hex);
    }
    if (!v.accentWood.length) delete v.accentWood;
  }
  if (!kept('hall') && src.hallFloor) {
    const p = choose(ctx, 'hall', P.hall, donor.hallFloor?.tone ?? src.hallFloor.tone, src.hallFloor.tone, (h) => ({ ...c, hall: h }));
    v.hallFloor = { pattern: 'tile', tone: p.hex, ...(p.size ? { plank: { l: p.size.l, w: p.size.w } } : {}) };
    v.products.hallFloor = p.id;
    c.hall = p.hex;
  }
  if (!kept('curtain') && src.curtain.on) {
    const target = donor.curtain.on ? donor.curtain.color : src.curtain.color;
    const p = choose(ctx, 'curtain', P.curtain, target, src.curtain.color, (h) => ({ ...c, curtain: h }));
    v.curtain = { ...src.curtain, color: p.hex };
    v.products.curtain = p.id;
    c.curtain = p.hex;
    if (src.curtain.sheerLayer) {
      const s = choose(ctx, 'sheer', P.sheer, donor.curtain.sheerLayer ?? src.curtain.sheerLayer, src.curtain.sheerLayer, (h) => ({ ...c, sheer: h }));
      v.curtain.sheerLayer = s.hex;
      v.products.sheer = s.id;
      c.sheer = s.hex;
    }
  }
  if (!kept('light')) v.lightPlanId = donor.lightPlanId;
  v.textile = donor.textile;

  // leírás és összegzés
  const accName = (k: string) => {
    const [room] = k.split('.');
    const p = findPaint(v.products?.[`accent:${k}`]);
    return `${roomLabel[room] ?? room}: ${p ? paintName(p) : v.accents[k]}`;
  };
  const floor = findFloor(v.products.floor);
  const door = findDoor(v.products.door);
  const curtain = findCurtain(v.products.curtain);
  const parts: RemixCandidate['parts'] = [
    { label: 'Fal', name: paintName(findPaint(v.products.wall)) || v.wall, hex: v.wall, kept: kept('wall') },
    ...Object.keys(v.accents).map((k) => ({ label: 'Kiemelés', name: accName(k), hex: v.accents[k], kept: kept('accents') })),
    { label: 'Padló', name: floor ? (floor.existing ? `meglévő ${floor.name.toLowerCase()}` : `${floor.store}: ${floor.name}`) : v.floor.tone, hex: v.floor.tone, kept: kept('floor') },
    ...(v.hallFloor ? [{ label: 'Járólap', name: findFloor(v.products.hallFloor)?.name ?? v.hallFloor.tone, hex: v.hallFloor.tone, kept: kept('hall') }] : []),
    { label: 'Ajtó', name: `${door ? `${door.store}: ${door.name}` : v.door}, ${HANDLE_TEXT[v.handle ?? 'steel']} kilincs`, hex: v.door, kept: kept('door') },
    ...(v.curtain.on ? [{ label: 'Függöny', name: curtain ? `${curtain.store}: ${curtain.name}` : v.curtain.color, hex: v.curtain.color, kept: kept('curtain') }] : []),
  ];
  const keptText = [...pins].map((k) => REMIX_LABEL[k].toLowerCase()).join(', ');
  const day = new Date().toISOString().slice(0, 10);
  const head = DEFAULT_VARIANTS.find((x) => x.id === src.id) ? short(src) : `„${src.name}”`;
  v.note =
    `Gépi összeállítás (${day}) – nem lakberendezői javaslat, a színeket mintán kell ellenőrizni. ` +
    (keptText ? `A(z) ${head} változatból megtartva: ${keptText}. ` : `Kiindulás: ${head}. `) +
    `A többi elem a(z) ${short(donor)} párosításai alapján, valós katalógustermékekkel: ` +
    parts
      .filter((p) => !p.kept)
      .map((p) => `${p.label.toLowerCase()} – ${p.name}`)
      .join('; ') +
    `. Szegélyléc: ${SKIRT_TEXT[v.skirting.mode]}.`;
  const main = Object.keys(v.accents)[0];
  const accP = main ? findPaint(v.products[`accent:${main}`]) : undefined;
  const wallP = findPaint(v.products.wall);
  v.name = `Hozzáillő – ${accP ? paintTitle(accP) : wallP ? paintTitle(wallP) : 'új színek'}, ${floor ? (floor.existing ? 'meglévő padló' : floor.name.split(/ [-–] /)[0].slice(0, 32)) : 'padló'}`;
  return { variant: v, donor, parts, warnings: warnings(c) };
}

/**
 * `n` jelölt a kiinduló változatból: a `pins` elemek megmaradnak, a többi a mintákból és az arányokból.
 * `favs`: a kedvencnek jelölt beépített javaslatok (mintaként kis előnyt kapnak).
 */
export function remixCandidates(src: Variant, pins: Set<RemixKey>, level: RemixLevel, seed: number, n = 4, favs = new Set<string>()): RemixCandidate[] {
  const rand = rng(seed * 7919 + (level === 'small' ? 1 : level === 'medium' ? 2 : 3));
  const donors = pickDonors(src, pins, level, n, rand, favs);
  const ctx: Ctx = { level, rand, used: new Map() };
  return donors.map((d) => generate(src, d, pins, ctx));
}
