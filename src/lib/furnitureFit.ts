import type { Variant } from '../model/types';

// Bútor-színvilág ajánló: a változat felületeiből (fal, kiemelés, padló, ajtó) heurisztikus szabályokkal
// pontozza a jellemző kárpit-, bútortest- és fémszíneket. Színtér: OKLab / LCh. Nem szabály, csak irány:
// a végső döntést anyagmintával, a helyszíni fényben kell meghozni.

interface LCh {
  L: number;
  C: number;
  h: number;
  hex: string;
}

const lin = (c: number) => {
  c /= 255;
  return c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
};

export function toLch(hex: string): LCh {
  const n = parseInt(hex.slice(1), 16);
  const r = lin((n >> 16) & 255);
  const g = lin((n >> 8) & 255);
  const b = lin(n & 255);
  const l = Math.cbrt(0.4122214708 * r + 0.5363325363 * g + 0.0514459929 * b);
  const m = Math.cbrt(0.2119034982 * r + 0.6806995451 * g + 0.1073969566 * b);
  const s = Math.cbrt(0.0883024619 * r + 0.2817188376 * g + 0.6299787005 * b);
  const L = 0.2104542553 * l + 0.793617785 * m - 0.0040720468 * s;
  const A = 1.9779984951 * l - 2.428592205 * m + 0.4505937099 * s;
  const B = 0.0259040371 * l + 0.7827717662 * m - 0.808675766 * s;
  return { L, C: Math.hypot(A, B), h: ((Math.atan2(B, A) * 180) / Math.PI + 360) % 360, hex };
}

const hueDiff = (a: LCh, b: LCh) => {
  const d = Math.abs(a.h - b.h) % 360;
  return d > 180 ? 360 - d : d;
};

type Temp = 'warm' | 'cool' | 'neutral';
/**
 * Színhőmérséklet OKLab árnyalatból (piros ~30°, narancs ~55°, sárga ~110°, zöld ~140°, kék ~260°):
 * akromatikus (szürke) = neutral; a zöldek és a lilák „köztes” árnyalatok (mid).
 */
const hueClass = (c: LCh): Temp | 'mid' =>
  c.C < 0.012 ? 'neutral' : (c.h >= 15 && c.h <= 120) || c.h >= 340 ? 'warm' : c.h >= 170 && c.h <= 300 ? 'cool' : 'mid';
const tempOf = (c: LCh): Temp => {
  const k = hueClass(c);
  return k === 'mid' ? 'neutral' : k;
};
const isWood = (c: LCh) => c.C > 0.03 && c.h >= 35 && c.h <= 95;

export type Verdict = 'good' | 'ok' | 'bad';
export interface FitItem {
  id: string;
  label: string;
  hex: string;
  verdict: Verdict;
  reasons: string[];
  /** Mennyire gyakori a kínálatban (1 ritkább – 3 nagyon gyakori). */
  common: number;
}
export interface FurnitureFit {
  temp: Temp;
  sofa: FitItem[];
  wood: FitItem[];
  metal: FitItem[];
  ease: { level: 'könnyű' | 'közepes' | 'nehezebb'; text: string };
}

const SOFA = [
  { id: 'krem', label: 'krém / törtfehér', hex: '#EDE6D8', common: 2 },
  { id: 'homok', label: 'homok / bézs', hex: '#CDBB9C', common: 3 },
  { id: 'greige', label: 'taupe / greige', hex: '#A79C8E', common: 2 },
  { id: 'vszurke', label: 'világosszürke', hex: '#B9BBBD', common: 3 },
  { id: 'grafit', label: 'grafit / sötétszürke', hex: '#4A4C4F', common: 3 },
  { id: 'konyak', label: 'konyak / barna bőr', hex: '#8A5A3A', common: 2 },
  { id: 'csoki', label: 'csokoládébarna', hex: '#4E3A30', common: 1 },
  { id: 'zsalya', label: 'zsálya', hex: '#9DA58E', common: 1 },
  { id: 'oliva', label: 'olíva', hex: '#6F7350', common: 1 },
  { id: 'mustar', label: 'mustár / okker', hex: '#C49A3A', common: 1 },
  { id: 'terrakotta', label: 'terrakotta / rozsda', hex: '#A65A3F', common: 1 },
  { id: 'melykek', label: 'mélykék', hex: '#2F3E57', common: 2 },
];
const WOOD = [
  { id: 'feher', label: 'fehér matt', hex: '#F2F0EB', common: 3 },
  { id: 'fekete', label: 'fekete matt', hex: '#262524', common: 3 },
  { id: 'vtolgy', label: 'világos tölgy / nyír', hex: '#D4BC94', common: 3 },
  { id: 'ntolgy', label: 'natúr tölgy', hex: '#B8915F', common: 3 },
  { id: 'dio', label: 'dió', hex: '#6B4A33', common: 2 },
  { id: 'antracit', label: 'antracit / szürke lap', hex: '#5A5A5A', common: 2 },
];
const METAL = [
  { id: 'feketefem', label: 'fekete fém', hex: '#2B2A28', common: 3 },
  { id: 'sargarez', label: 'sárgaréz / arany', hex: '#B08D57', common: 2 },
  { id: 'krom', label: 'króm / inox', hex: '#A8ACB0', common: 3 },
];

function verdictOf(score: number): Verdict {
  return score >= 1 ? 'good' : score <= -1 ? 'bad' : 'ok';
}

export function furnitureFit(v: Variant): FurnitureFit {
  const wall = toLch(v.wall);
  const floor = toLch(v.floor.tone);
  const door = toLch(v.door);
  const accents = [...new Set(Object.values(v.accents))].map(toLch);
  // a nappali kiemelése a kanapé szempontjából a legfontosabb
  const living = v.accents['nappali.x1'] ? toLch(v.accents['nappali.x1']) : accents[0];

  // a paletta melegsége súlyozva (fal és padló dominál)
  const parts: [LCh, number][] = [[wall, 3], [floor, 3], [door, 1], ...accents.map((a) => [a, 2] as [LCh, number])];
  const warmth = parts.reduce((s, [c, w]) => s + w * (tempOf(c) === 'warm' ? Math.min(c.C / 0.04, 1) : tempOf(c) === 'cool' ? -Math.min(c.C / 0.04, 1) : 0), 0) / parts.reduce((s, [, w]) => s + w, 0);
  const temp: Temp = warmth > 0.25 ? 'warm' : warmth < -0.15 ? 'cool' : 'neutral';
  const coolAccent = accents.some((a) => tempOf(a) === 'cool' && a.C > 0.02);
  const dark = floor.L < 0.5 || accents.some((a) => a.L < 0.5);
  // nagy felületű fekete elem (ajtó); a fekete kilincs önmagában kevés hozzá
  const blackDetail = door.L < 0.35;
  const darkBrown = [door, ...accents].some((c) => c.L < 0.58 && tempOf(c) === 'warm' && c.C > 0.025);
  const creamWall = tempOf(wall) === 'warm' && wall.C > 0.012 && wall.L > 0.82;

  const sofa: FitItem[] = SOFA.map((s) => {
    const c = toLch(s.hex);
    const t = hueClass(c);
    let score = 0;
    const r: string[] = [];
    if (temp === 'warm' && t === 'cool' && !coolAccent) ((score -= 2), r.push('hideg árnyalat a meleg alapon – kilóg'));
    if (temp === 'warm' && t === 'neutral' && c.L > 0.55 && !coolAccent) ((score -= 1), r.push('tiszta szürke: a meleg falak mellett hűvösnek, fakónak hat'));
    if (t === 'cool' && (temp === 'cool' || coolAccent)) ((score += 1), r.push('rímel a hűvös kiemelésre'));
    if (temp === 'warm' && t === 'warm' && c.C < 0.08) ((score += 1), r.push('meleg semleges – illik az alaphoz'));
    if (Math.abs(c.L - floor.L) < 0.07 && hueDiff(c, floor) < 25 && c.C > 0.02) ((score -= 1), r.push('a padló árnyalatához túl közel – beleolvad'));
    if (living) {
      const dh = hueDiff(c, living);
      if (c.C > 0.05 && living.C > 0.05 && dh > 40 && dh < 120) ((score -= 1), r.push('ütközhet a nappali kiemelt falával'));
      else if (dh < 25 && Math.abs(c.L - living.L) > 0.12 && living.C > 0.03) ((score += 1), r.push('tónus a tónusban a kiemelt fallal'));
      else if (dh > 150 && living.C > 0.03 && c.C > 0.03 && c.C < 0.1) ((score += 1), r.push('kiegészítő kontraszt a kiemelt fallal'));
    }
    if (dark && c.L < 0.42) ((score -= 1), r.push('a sötét kiemelés vagy padló mellett túl nehéz összkép'));
    return { ...s, verdict: verdictOf(score), reasons: r };
  });

  const wood: FitItem[] = WOOD.map((w) => {
    const c = toLch(w.hex);
    let score = 0;
    const r: string[] = [];
    if (isWood(c)) {
      const dl = Math.abs(c.L - floor.L);
      const dh = hueDiff(c, floor);
      if (dl < 0.06 && dh < 20) ((score += 1), r.push('szinte egyezik a padlóval – egységes'));
      else if (dl < 0.12) ((score -= 1), r.push('a padlótól alig eltérő fatónus – zavaró'));
      else ((score += 1), r.push('határozott kontraszt a padlóval'));
      if (isWood(door) && Math.abs(c.L - door.L) < 0.08 && hueDiff(c, door) < 15) ((score += 1), r.push('illik az ajtókhoz'));
      if (w.id === 'dio' && darkBrown) ((score += 1), r.push('rímel a sötétbarna (dió / mokka) elemekre'));
    } else if (w.id === 'feher') {
      if (creamWall && darkBrown) ((score -= 1), r.push('a krémes fal és a sötétbarna (dió / mokka) mellett a tiszta fehér éles, hideg kontraszt'));
      else if (creamWall) r.push('a krémes fal mellett a tiszta fehér kissé hidegnek hat – törtfehér jobb');
      else if (wall.C < 0.012) ((score += 1), r.push('a semleges fehér falhoz illik'));
    } else if (w.id === 'fekete') {
      if (blackDetail) ((score += 1), r.push('rímel a fekete ajtókra'));
      else if (darkBrown) ((score -= 1), r.push('a sötétbarna mellett a fekete nehéz, „poros” hatású'));
      else if (!dark) r.push('erős kontraszt – kis felületen (lábak, keretek) jó, nagy bútorként kemény');
    } else if (w.id === 'antracit' && temp === 'warm' && !coolAccent) ((score -= 1), r.push('hideg szürke a meleg alapon'));
    return { ...w, verdict: verdictOf(score), reasons: r };
  });

  const metal: FitItem[] = METAL.map((m) => {
    let score = 0;
    const r: string[] = [];
    if (m.id === 'feketefem' && (blackDetail || dark || v.handle === 'black')) ((score += 1), r.push(v.handle === 'black' ? 'egyezik a fekete kilinccsel' : 'illik a sötét részletekhez'));
    if (m.id === 'sargarez') {
      if (temp === 'warm') ((score += 1), r.push('meleg palettához illik'));
      if (v.handle === 'brass') ((score += 1), r.push('egyezik a kilinccsel'));
    }
    if (m.id === 'krom') {
      if (temp === 'warm' && !coolAccent) ((score -= 1), r.push('hideg fém a meleg alapon'));
      else ((score += 1), r.push('rímel a hűvösebb árnyalatokra'));
    }
    return { ...m, verdict: verdictOf(score), reasons: r };
  });

  // Beszerezhetőség: a gyakori színek mekkora része „megy” vagy „elmegy”
  const all = [...sofa, ...wood];
  const weight = (i: FitItem) => i.common * (i.verdict === 'good' ? 1 : i.verdict === 'ok' ? 0.6 : 0);
  const ratio = all.reduce((s, i) => s + weight(i), 0) / all.reduce((s, i) => s + i.common, 0);
  const badCommon = all.filter((i) => i.common === 3 && i.verdict === 'bad').map((i) => i.label);
  const level = ratio > 0.6 ? 'könnyű' : ratio > 0.42 ? 'közepes' : 'nehezebb';
  const text =
    level === 'könnyű'
      ? 'A kínálatban gyakori színek többsége illik hozzá – könnyű bútort találni.'
      : `${badCommon.length ? `A gyakori ${badCommon.join(', ')} ide kevésbé illik; ` : ''}${level === 'nehezebb' ? 'célzottan kell keresni (meleg semleges és fa tónusok).' : 'van választék, de válogatni kell.'}`;
  return { temp, sofa, wood, metal, ease: { level, text } };
}
