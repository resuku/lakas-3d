import { useMemo, useState, type ReactNode } from 'react';

// Szűrő a nagy katalógusokhoz (2026-11-25-i bővítés): szöveges keresés (ékezet nélkül is), bolt, és csoportonként
// korlátozott mintasor „további” gombbal.

const norm = (s: string) =>
  s
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '');

export function useCatalogFilter<T>(items: T[], text: (x: T) => string, store: (x: T) => string) {
  const [q, setQ] = useState('');
  const [st, setSt] = useState('');
  const stores = useMemo(() => [...new Set(items.map(store))].filter(Boolean).sort((a, b) => a.localeCompare(b, 'hu')), [items, store]);
  const list = useMemo(() => {
    const words = norm(q).split(/\s+/).filter(Boolean);
    return items.filter((x) => (!st || store(x) === st) && (!words.length || words.every((w) => norm(text(x)).includes(w))));
  }, [items, q, st, text, store]);
  const bar =
    items.length > 40 ? (
      <div className="catalog-filter">
        <input type="search" value={q} placeholder="Keresés (név, szín, dekor…)" onChange={(e) => setQ(e.target.value)} />
        {stores.length > 1 && (
          <select value={st} onChange={(e) => setSt(e.target.value)}>
            <option value="">minden bolt ({stores.length})</option>
            {stores.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        )}
        {(q || st) && <small>{list.length} találat</small>}
      </div>
    ) : null;
  return { list, bar, active: !!(q || st) };
}

/** Egy csoport mintái; `limit` fölött „+N további” gomb (szűrés közben mind látszik). */
export function SwatchGroup<T>({
  label,
  items,
  render,
  limit = 60,
  all = false,
}: {
  label: string;
  items: T[];
  render: (x: T) => ReactNode;
  limit?: number;
  all?: boolean;
}) {
  const [open, setOpen] = useState(false);
  if (!items.length) return null;
  const shown = all || open ? items : items.slice(0, limit);
  return (
    <div className="catalog-group">
      <span>
        {label} <small>({items.length})</small>
      </span>
      <div className="swatches">
        {shown.map(render)}
        {shown.length < items.length && (
          <button className="swatch-more" onClick={() => setOpen(true)} title="Az összes mutatása">
            +{items.length - shown.length}
          </button>
        )}
      </div>
    </div>
  );
}
