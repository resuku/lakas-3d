import { findDecorType, type DecorType } from '../data/decor';
import { FURNISHING } from '../data/furnishing';
import { findFurniture } from '../data/products';
import { getRoom } from '../data/rooms';
import type { DecorItem, Variant } from '../model/types';
import { activeFurnishing } from './furnish';
import { furnitureFit, nearestFit, type FitItem, type FurnitureFit, type FurniturePalette } from './furnitureFit';
import { furnitureLines } from './furnitureSets';

// Színütközés: a választott bútortermék, a meglévő bútor vagy a dekorelem színe a változat bútor-színvilágában
// kerülendő (lib/furnitureFit.ts – a legközelebbi minta ítélete „bad”). Figyelmeztetés, nem tiltás.

export interface Clash {
  kind: 'furniture' | 'decor';
  roomId: string;
  /** Termékhely (bútor), spec- vagy dekorazonosító. */
  id: string;
  label: string;
  color: string;
  fit: FitItem;
}

function decorColor(d: DecorItem, t: DecorType): { hex: string; label: string } | null {
  const p = findFurniture(d.productId);
  if (p) return { hex: p.hex, label: p.colorName ?? p.hex };
  const v = t.variants?.find((x) => x.id === d.variant) ?? t.variants?.[0];
  return v ? { hex: v.hex, label: v.label } : null;
}

/** A dekorelem színének ítélete a változat bútor-színvilágában (a típus `fit` listájával); null, ha nincs színe. */
export function decorFit(fit: FurnitureFit, d: DecorItem): FitItem | null {
  const t = findDecorType(d.type);
  if (!t?.fit) return null;
  const c = decorColor(d, t);
  return c ? nearestFit([fit[t.fit]], c.hex) : null;
}

const RANK = { good: 2, ok: 1, bad: 0 };

/** A dekortípus színváltozata, amely a változat bútor-színvilágához a legjobban illik (aljavaslat 'auto' színe). */
export function autoDecorVariant(fit: FurnitureFit, pal: FurniturePalette, t: DecorType): string | undefined {
  if (!t.variants?.length || !t.fit) return t.variants?.[0].id;
  // keret: a bútortest színe; fa: a natúr fatónus; kerámia, filc: a második kárpitszín; fém: a bútorfém
  const target = t.fit === 'metal' ? pal.metal : t.fit === 'sofa' ? pal.upholstery2 : t.group === 'picture' ? pal.body : pal.wood;
  const score = (hex: string, i: number) => {
    const nf = nearestFit([fit[t.fit!]], hex);
    return RANK[nf.verdict] * 2 + (nf.id === target.id ? 1 : 0) - i * 0.01;
  };
  return t.variants.map((v, i) => ({ id: v.id, s: score(v.hex, i) })).sort((a, b) => b.s - a.s)[0].id;
}

const clashText = (c: Clash) => `${c.label} – ${c.color} (legközelebbi minta: ${c.fit.label}${c.fit.reasons[0] ? `; ${c.fit.reasons[0]}` : ''})`;
export const CLASH_PREFIX = '⚠ Elüt a javaslat színvilágától';
export const clashLine = (c: Clash) => `${CLASH_PREFIX}: ${clashText(c)}`;

/**
 * A változat színvilágától elütő elemek: a látható bútorok közül a választott termék (termékhelyenként egyszer) vagy a
 * rögzített színű meglévő bútor, és a dekorelemek. `rooms`: csak ezek a helyiségek; `picks` null, ha a bútorok rejtve vannak.
 */
export function colorClashes(v: Variant, choices: Record<string, string>, picks: Record<string, string> | null, decor: DecorItem[], rooms?: string[]): Clash[] {
  const fit = furnitureFit(v);
  const out: Clash[] = [];
  const inScope = (roomId: string) => !rooms || rooms.includes(roomId);
  if (picks) {
    const lines = new Map(furnitureLines(v, picks).map((l) => [l.slot, l]));
    for (const roomId of Object.keys(FURNISHING).filter(inScope)) {
      const seen = new Set<string>();
      for (const f of activeFurnishing(roomId, choices, picks)) {
        if (f.slot) {
          if (seen.has(f.slot)) continue;
          seen.add(f.slot);
          const l = lines.get(f.slot);
          if (l?.fit.verdict === 'bad') out.push({ kind: 'furniture', roomId, id: f.slot, label: l.label, color: l.product.colorName ?? l.product.hex, fit: l.fit });
        } else if (f.hex) {
          const nf = nearestFit([fit.wood], f.hex);
          if (nf.verdict === 'bad') out.push({ kind: 'furniture', roomId, id: f.id, label: f.label, color: f.hex, fit: nf });
        }
      }
    }
  }
  for (const d of decor.filter((d) => inScope(d.roomId))) {
    const nf = decorFit(fit, d);
    const t = findDecorType(d.type);
    if (nf?.verdict === 'bad' && t) out.push({ kind: 'decor', roomId: d.roomId, id: d.id, label: t.label, color: decorColor(d, t)!.label, fit: nf });
  }
  return out;
}

/** Rövid sor a helyiség nevével (a Javaslat fül összesítőjéhez). */
export const clashRow = (c: Clash) => `${getRoom(c.roomId).name}: ${clashText(c)}`;
