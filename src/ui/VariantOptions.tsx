import { subVariantsOf } from '../data/subVariants';
import { DEFAULT_VARIANTS } from '../data/variants';
import type { Variant } from '../model/types';

// A változatválasztó opciói csoportosítva: elöl a kiemelt (aljavaslatos) J-javaslatok, aztán a többi javaslat, végül a
// saját (másolt, importált) változatok; a csoportokon belül a J-szám szerint.

const BASE = new Set(DEFAULT_VARIANTS.map((v) => v.id));
const num = (v: Variant) => Number(v.name.match(/^J(\d+)\b/)?.[1] ?? 1000);
const byNum = (vs: Variant[]) => [...vs].sort((a, b) => num(a) - num(b));

export function VariantOptions({ variants, suffix }: { variants: Variant[]; suffix?: (v: Variant) => string }) {
  const featured = (v: Variant) => subVariantsOf(v.id).length > 0;
  const groups = [
    { label: 'Kiemelt javaslatok – aljavaslatokkal', items: byNum(variants.filter(featured)) },
    { label: 'További javaslatok', items: byNum(variants.filter((v) => BASE.has(v.id) && !featured(v))) },
    { label: 'Saját változatok', items: variants.filter((v) => !BASE.has(v.id) && !featured(v)) },
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
