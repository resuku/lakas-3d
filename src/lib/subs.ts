import { DEFAULT_CHOICES } from '../data/choices';
import { findDecorType } from '../data/decor';
import { findFurniture } from '../data/products';
import { SUB_THEMES, type SubVariant } from '../data/subVariants';
import type { DecorItem, Variant } from '../model/types';
import { autoDecorVariant } from './colorClash';
import { activeFurnishing, standTop } from './furnish';
import { furnitureFit, furniturePalette, nearestFit, type FitItem } from './furnitureFit';
import { rankSlot, suggestFurniture } from './furnitureSets';

// Aljavaslat alkalmazása (data/subVariants.ts): bútorlehetőségek, termékek és dekor a fő javaslat színvilágában.

/** Az aljavaslatok által állított bútorcsoportok: aljavaslat-váltáskor ezek az alapértékről indulnak. */
export const SUB_GROUPS = [...new Set(SUB_THEMES.flatMap((t) => Object.keys(t.choices)))];

/** A választások az aljavaslattal (null: az aljavaslat-csoportok vissza az alapértékre); a többi csoport marad. */
export function subChoices(choices: Record<string, string>, sub: SubVariant | null | undefined): Record<string, string> {
  const out = { ...choices };
  for (const g of SUB_GROUPS) out[g] = DEFAULT_CHOICES[g];
  return { ...out, ...(sub?.choices ?? {}) };
}

/** A termékek: a javaslat alapbútora, az aljavaslat helyein a rangsor megadott helye vagy a megadott termék. */
export function subPicks(v: Variant, sub: SubVariant | null | undefined): Record<string, string> {
  const picks = { ...suggestFurniture(v).picks };
  const fit = furnitureFit(v);
  const pal = furniturePalette(fit);
  for (const [slot, want] of Object.entries(sub?.picks ?? {})) {
    const id = typeof want === 'number' ? rankSlot(v, slot, fit, pal)[want]?.p.id : findFurniture(want)?.id;
    if (id) picks[slot] = id;
  }
  return picks;
}

/** Az aljavaslat dekorja: 'auto' színnél a színvilághoz illő változat, bútor tetején a választott bútor magasságán. */
export function subDecor(v: Variant, sub: SubVariant, choices: Record<string, string>, picks: Record<string, string>): DecorItem[] {
  const fit = furnitureFit(v);
  const pal = furniturePalette(fit);
  // kedvelt szín: az első, amely jól megy, aztán az első, amely elmegy
  const preferred = (prefer: string[], hexOf: (id: string) => string | undefined, list: FitItem[]) =>
    (['good', 'ok'] as const).map((verdict) => prefer.find((id) => hexOf(id) && nearestFit([list], hexOf(id)!).verdict === verdict)).find(Boolean);
  return sub.decor.flatMap(({ prefer, ...d }, i) => {
    const t = findDecorType(d.type);
    if (!t) return [];
    const liked = prefer && t.fit ? preferred(prefer, (id) => t.variants?.find((x) => x.id === id)?.hex, fit[t.fit]) : undefined;
    const variant = d.variant === 'auto' ? (liked ?? autoDecorVariant(fit, pal, t)) : d.variant;
    const top = t.mount === 'surface' && !d.wall && d.y > 0 ? standTop(activeFurnishing(d.roomId, choices, picks), d.x ?? 0, d.z ?? 0) : null;
    return [{ ...d, id: `sub-${sub.id}-${i}`, origin: `sub:${sub.id}`, variant, y: top !== null ? Math.round(top * 1000) : d.y }];
  });
}

export const isSubDecor = (d: DecorItem) => !!d.origin?.startsWith('sub:');

