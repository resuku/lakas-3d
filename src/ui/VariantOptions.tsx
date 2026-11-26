import { DEFAULT_VARIANTS, VARIANT_GROUPS } from '../data/variants';
import type { Variant } from '../model/types';

// A változatválasztó opciói stílusvonalak szerint csoportosítva (2026-11-26, user): fekete/antracit, skandináv, melegebb
// világos, japandi, egyéb, alul a meglévő padlót megtartók, a végén a saját (másolt, importált) változatok. A csoportok és
// a sorrend a generátorból jönnek (scripts/gen/gen_variants.py – VARIANT_GROUPS); kiemelt csoport nincs.

const BASE = new Set(DEFAULT_VARIANTS.map((v) => v.id));

export function VariantOptions({ variants, suffix }: { variants: Variant[]; suffix?: (v: Variant) => string }) {
  const byId = new Map(variants.map((v) => [v.id, v]));
  const groups = [
    ...VARIANT_GROUPS.map((g) => ({ label: `${g.label} (${g.ids.length})`, items: g.ids.map((id) => byId.get(id)).filter((v): v is Variant => !!v) })),
    { label: 'Saját változatok', items: variants.filter((v) => !BASE.has(v.id)) },
  ];
  return (
    <>
      {groups
        .filter((g) => g.items.length)
        .map((g) => (
          <optgroup key={g.label} label={g.label}>
            {g.items.map((v) => (
              <option key={v.id} value={v.id}>
                {v.name}
                {suffix?.(v) ?? ''}
              </option>
            ))}
          </optgroup>
        ))}
    </>
  );
}
