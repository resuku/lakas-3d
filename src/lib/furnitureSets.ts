import { FURNISHING, FURNITURE_PROPOSAL } from '../data/furnishing';
import { findFurniture, FURNITURE_PRODUCTS } from '../data/products';
import type { FurnCategory, FurnitureProduct, FurnSpec, Variant } from '../model/types';
import { outOfLimits } from './furnish';
import { furnitureFit, furniturePalette, nearestFit, toLch, type FitItem, type FurnitureFit, type FurniturePalette } from './furnitureFit';

// Bútorjavaslat egy színváltozathoz: termékhelyenként a katalógusból a változat színvilágához legjobban illő termék.
// Heurisztika, nem döntés: a méretkeretbe férő termékek közül a színvilág ítélete (jól megy / elmegy; kerülendő kiesik),
// a változat bútor-színeihez való közelség, a konszignáció-tervezet (★ / ☆), az ellenőrzött ár és a fotóból vett szín számít.

/** Kézi felülírás változatonként (pl. a lakberendező eredeti termékei a J7-ben – j6-tervezoi –, ahol a méretkeretbe férnek). */
export const FURNITURE_OVERRIDES: Record<string, { picks: Record<string, string>; note: string }> = {
  'j6-tervezoi': {
    picks: {
      'nappali.asztal': 'furn-butor1-asztal-oswego-167-vilagos-travertin-aszt',
      'nappali.szek': 'furn-jysk-etkezoszek-hygum-barna-textilbor-fekete',
      'nappali.terelvalaszto': 'furn-premiumlamellak-diy-terelvalaszto-alpesi-dio',
      'nappali.szonyeg': 'furn-euhome-hu-nagymeretu-shaggy-szonyeg-moshato-pluss',
    },
    note: 'A lakberendező konszignációjának termékei, ahol a méretkeretbe férnek (Oswego asztal, HYGUM szék, alpesi dió lamellás térelválasztó, krém shaggy szőnyeg); a többi a színvilág szerint.',
  },
};

/** Termékhelyek megnevezése, ahol a hely első elemének címkéje nem egyértelmű. */
const SLOT_LABEL: Record<string, string> = {
  'nappali.kanape-chaise': 'L alakú kanapé',
  'dolgozo.asztal': 'Sarok íróasztal (ajtó mellett)',
  'dolgozo.asztal-sziget': 'Sarok íróasztal (félsziget)',
};

export interface FurnitureLine {
  slot: string;
  label: string;
  product: FurnitureProduct;
  fit: FitItem;
  why: string;
}

const VERDICT_SCORE = { good: 3, ok: 1, bad: -100 };
const ab = (hex: string) => {
  const c = toLch(hex);
  const r = (c.h * Math.PI) / 180;
  return [c.L, c.C * Math.cos(r), c.C * Math.sin(r)];
};
const dist = (a: string, b: string) => {
  const p = ab(a);
  const q = ab(b);
  return Math.hypot(p[0] - q[0], p[1] - q[1], p[2] - q[2]);
};
const price = (p: FurnitureProduct) => Number(p.price?.match(/^([\d\s]+)\s*Ft/)?.[1].replace(/\s/g, '')) || undefined;

/** Melyik bútor-színvilág listával és melyik változatszínnel vessük össze a termékhely termékeit. */
function target(cat: FurnCategory, kind: FurnSpec['kind'], fit: FurnitureFit, pal: FurniturePalette): { lists: FitItem[][]; hex: string } {
  switch (cat) {
    case 'sofa':
    case 'sofaChaise':
      return { lists: [fit.sofa], hex: pal.upholstery.hex };
    case 'ottoman':
    case 'chair':
      return { lists: [fit.sofa], hex: pal.upholstery2.hex };
    case 'rugLiving':
    case 'rugBedroom':
      return { lists: [fit.sofa], hex: pal.rug.hex };
    case 'divider':
      return { lists: [fit.wood], hex: pal.wood.hex };
    case 'bed':
      return { lists: [fit.sofa, fit.wood], hex: pal.wood.hex };
    default:
      return { lists: [fit.wood], hex: kind === 'table' ? pal.wood.hex : pal.body.hex };
  }
}

/** Az összes termékhely (minden helyiség, minden lehetőség), helyenként az első elemével. */
export function slotSpecs(): Map<string, FurnSpec> {
  const slots = new Map<string, FurnSpec>();
  for (const specs of Object.values(FURNISHING)) for (const f of specs) if (f.slot && f.category && !slots.has(f.slot)) slots.set(f.slot, f);
  return slots;
}

export interface RankedProduct {
  p: FurnitureProduct;
  s: number;
  nf: FitItem;
}

/** A termékhely termékei a változathoz illés szerint rangsorolva (a kerülendő színűek nélkül). */
export function rankSlot(v: Variant, slot: string, fit = furnitureFit(v), pal = furniturePalette(fit)): RankedProduct[] {
  const spec = slotSpecs().get(slot);
  if (!spec) return [];
  const t = target(spec.category!, spec.kind, fit, pal);
  const prop = FURNITURE_PROPOSAL.find((x) => x.slot === slot);
  const cands = FURNITURE_PRODUCTS.filter((p) => p.category === spec.category && !outOfLimits(slot, p).length);
  const prices = cands.map(price).filter((x): x is number => !!x).sort((a, b) => a - b);
  const median = prices[Math.floor(prices.length / 2)] ?? 0;
  return cands
    .map((p) => {
      const nf = nearestFit(t.lists, p.hex);
      const pr = price(p);
      const s =
        VERDICT_SCORE[nf.verdict] +
        2 * Math.max(0, 1 - dist(p.hex, t.hex) / 0.15) +
        (prop?.pick === p.id ? 1.5 : prop?.alt.includes(p.id) ? 0.8 : 0) +
        (p.hexSource === 'photo-sample' ? 0.2 : 0) +
        // ND-003: körből oválissá bővíthető asztal az elsődleges irány
        (spec.kind === 'table' && p.shape === 'round' && p.size.ext ? 1 : 0) -
        (pr ? (median && pr > median * 1.6 ? 1 : 0) : 1.5);
      return { p, s, nf };
    })
    .filter((r) => r.s > -50)
    .sort((a, b) => b.s - a.s);
}

const labelOf = (slot: string, spec: FurnSpec) => SLOT_LABEL[slot] ?? spec.label.replace(/\s*\(.*\)$/, '');

/** A megadott termékek sorai a változat színvilágának ítéletével (megjelenítéshez, figyelmeztetéshez). */
export function furnitureLines(v: Variant, picks: Record<string, string>, why: Record<string, string> = {}): FurnitureLine[] {
  const fit = furnitureFit(v);
  const pal = furniturePalette(fit);
  const out: FurnitureLine[] = [];
  for (const [slot, spec] of slotSpecs()) {
    const p = findFurniture(picks[slot]);
    if (!p) continue;
    const nf = nearestFit(target(spec.category!, spec.kind, fit, pal).lists, p.hex);
    out.push({ slot, label: labelOf(slot, spec), product: p, fit: nf, why: why[slot] ?? nf.reasons[0] ?? `${nf.label} – ${nf.verdict === 'good' ? 'jól megy' : nf.verdict === 'ok' ? 'elmegy' : 'kerülendő'} a változathoz` });
  }
  return out;
}

/** Termékhelyenként egy termék a változathoz (minden helyiség, minden lehetőség termékhelye). */
export function suggestFurniture(v: Variant): { picks: Record<string, string>; lines: FurnitureLine[]; note?: string } {
  const fit = furnitureFit(v);
  const pal = furniturePalette(fit);
  const over = FURNITURE_OVERRIDES[v.id];
  const picks: Record<string, string> = {};
  const why: Record<string, string> = {};
  for (const slot of slotSpecs().keys()) {
    const forced = over?.picks[slot] ? findFurniture(over.picks[slot]) : undefined;
    if (forced) {
      picks[slot] = forced.id;
      why[slot] = 'a lakberendező eredeti terméke';
      continue;
    }
    const best = rankSlot(v, slot, fit, pal)[0];
    if (best) picks[slot] = best.p.id;
  }
  return { picks, lines: furnitureLines(v, picks, why), note: over?.note };
}
