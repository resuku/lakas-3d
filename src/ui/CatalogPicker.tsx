import {
  COLOR_SOURCE_LABEL,
  CURTAIN_PRODUCTS,
  CURTAIN_TYPE_LABEL,
  DOOR_PRODUCTS,
  DOOR_STYLE_LABEL,
  FLOOR_PRODUCTS,
  PAINT_FAMILIES,
  PAINT_PRODUCTS,
  WALL_PANELS,
  findCurtain,
  findDoor,
  findFloor,
  findPaint,
} from '../data/products';
import type { CurtainProduct, DoorProduct, FloorProduct, PaintProduct } from '../model/types';
import { useMemo } from 'react';
import { SwatchGroup, useCatalogFilter } from './catalogFilter';

/** Kiválasztott katalógustermék egy sorban: márka, név, kód, a szín eredete és link. */
export function ProductInfo({ id, kind }: { id?: string; kind: 'paint' | 'floor' | 'door' | 'curtain' }) {
  if (kind === 'door' || kind === 'curtain') {
    const d = kind === 'door' ? findDoor(id) : undefined;
    const c = kind === 'curtain' ? findCurtain(id) : undefined;
    const item = d ?? c;
    if (!item) return null;
    const spec = d
      ? [DOOR_STYLE_LABEL[d.style], d.surface].filter(Boolean).join(', ')
      : [CURTAIN_TYPE_LABEL[c!.type], c!.size && `${c!.size.w} × ${c!.size.l} cm`, c!.pack].filter(Boolean).join(', ');
    return (
      <div className="product-info">
        <b>{item.store}</b> · {d ? `${d.manufacturer} ${d.line} – ${d.name}` : `${c!.name}, ${c!.colorName}`}
        <small>
          {spec} · {COLOR_SOURCE_LABEL[item.hexSource]}
          {item.price && ` · ${item.price}`} ·{' '}
          <a href={item.url} target="_blank" rel="noreferrer">
            termékoldal
          </a>
        </small>
      </div>
    );
  }
  if (kind === 'paint') {
    const p = findPaint(id);
    if (!p) return null;
    return (
      <div className="product-info">
        <b>{p.brand}</b> {p.line} · {p.name} {p.code && <span>({p.code})</span>}
        <small>
          {COLOR_SOURCE_LABEL[p.hexSource]}
          {p.price && ` · ${p.price}`} ·{' '}
          <a href={p.url} target="_blank" rel="noreferrer">
            színoldal
          </a>
          {p.shopUrl && (
            <>
              {' · '}
              <a href={p.shopUrl} target="_blank" rel="noreferrer">
                webáruház
              </a>
            </>
          )}
        </small>
      </div>
    );
  }
  const f = findFloor(id);
  if (!f) return null;
  if (f.existing)
    return (
      <div className="product-info">
        <b>Meglévő</b> · {f.name} – megmarad
        <small>
          {f.size && `kb. ${f.size.l} × ${f.size.w} mm`} · {COLOR_SOURCE_LABEL[f.hexSource]}
        </small>
        {f.note && <small>{f.note}</small>}
      </div>
    );
  return (
    <div className="product-info">
      <b>{f.store}</b> · {f.manufacturer} {f.name}
      <small>
        {f.size ? `${f.size.l} × ${f.size.w} mm` : 'lapméret nincs megadva'} · {f.type}
        {f.wear && ` · ${f.wear}`} · {COLOR_SOURCE_LABEL[f.hexSource]}
        {f.price && ` · ${f.price}`} ·{' '}
        <a href={f.url} target="_blank" rel="noreferrer">
          termékoldal
        </a>
      </small>
    </div>
  );
}

const paintText = (p: PaintProduct) => `${p.brand} ${p.line} ${p.name} ${p.code}`;
const paintStore = (p: PaintProduct) => p.brand;

export function PaintCatalog({ selectedId, onPick, families, open }: { selectedId?: string; onPick: (p: PaintProduct) => void; families?: string[]; open?: boolean }) {
  const base = useMemo(() => PAINT_PRODUCTS.filter((p) => !families || families.includes(p.family)), [families]);
  const { list, bar, active } = useCatalogFilter(base, paintText, paintStore);
  if (!base.length) return null;
  const groups = PAINT_FAMILIES.filter((f) => !families || families.includes(f.id));
  return (
    <details className="catalog" open={open}>
      <summary>Katalógus – valós festékszínek ({base.length})</summary>
      {bar}
      {groups.map((g) => (
        <SwatchGroup
          key={g.id}
          label={g.label}
          all={active}
          items={list.filter((p) => p.family === g.id)}
          render={(p) => (
            <button
              key={p.id}
              className={`swatch square ${p.id === selectedId ? 'on' : ''}`}
              style={{ background: p.hex }}
              title={`${p.brand} ${p.line} – ${p.name}${p.code ? ` (${p.code})` : ''} · ${p.hex} · ${COLOR_SOURCE_LABEL[p.hexSource]}`}
              onClick={() => onPick(p)}
            />
          )}
        />
      ))}
    </details>
  );
}

const TONE_LABEL: Record<FloorProduct['tone'], string> = {
  light: 'Világos',
  natural: 'Natúr',
  honey: 'Mézes',
  grey: 'Szürkés',
  dark: 'Sötét',
};

/** `tiles`: csak a járólapok (a járólapos zónához); egyébként minden padló, a járólapok külön csoportban a végén. */
const floorText = (f: FloorProduct) => `${f.store} ${f.manufacturer} ${f.name} ${f.decor ?? ''} ${f.type} ${f.note ?? ''}`;
const floorStore = (f: FloorProduct) => f.store;

export function FloorCatalog({ selectedId, onPick, tiles, open }: { selectedId?: string; onPick: (f: FloorProduct) => void; tiles?: boolean; open?: boolean }) {
  const base = useMemo(() => FLOOR_PRODUCTS.filter((f) => !tiles || f.pattern === 'tile'), [tiles]);
  const { list: all, bar, active } = useCatalogFilter(base, floorText, floorStore);
  if (!base.length) return null;
  const groups: { key: string; label: string; items: FloorProduct[] }[] = [
    { key: 'existing', label: 'Meglévő burkolat', items: all.filter((f) => f.existing) },
    ...(Object.keys(TONE_LABEL) as FloorProduct['tone'][]).map((t) => ({
      key: t,
      label: TONE_LABEL[t],
      items: all.filter((f) => !f.existing && f.pattern !== 'tile' && f.tone === t),
    })),
    ...(Object.keys(TONE_LABEL) as FloorProduct['tone'][]).map((t) => ({
      key: `tile-${t}`,
      label: `Járólap – ${TONE_LABEL[t].toLowerCase()}`,
      items: all.filter((f) => !f.existing && f.pattern === 'tile' && f.tone === t),
    })),
  ];
  return (
    <details className="catalog" open={open}>
      <summary>
        Katalógus – {tiles ? 'járólapok' : 'valós padlók'} ({base.length})
      </summary>
      {bar}
      {groups.map((g) => (
        <SwatchGroup
          key={g.key}
          label={g.label}
          all={active}
          items={g.items}
          render={(f) => (
            <button
              key={f.id}
              className={`swatch square ${f.pattern === 'herringbone' ? 'hb' : ''} ${f.id === selectedId ? 'on' : ''}`}
              style={{ background: f.hex }}
              title={`${f.existing ? `Meglévő: ${f.name}` : `${f.store}: ${f.manufacturer} ${f.name}`}${f.size ? ` · ${f.existing ? 'kb. ' : ''}${f.size.l} × ${f.size.w} mm` : ''}${f.pattern === 'herringbone' ? ' · halszálka' : ''}${f.price ? ` · ${f.price}` : ''}`}
              onClick={() => onPick(f)}
            />
          )}
        />
      ))}
    </details>
  );
}

const DOOR_TONE_LABEL: Record<DoorProduct['tone'], string> = {
  white: 'Fehér',
  offwhite: 'Tört fehér, kasmír',
  light: 'Világos fa',
  natural: 'Natúr fa',
  warm: 'Meleg, középtónusú fa',
  dark: 'Sötét fa',
  grey: 'Szürke',
  black: 'Fekete, antracit',
};

const doorText = (d: DoorProduct) => `${d.store} ${d.manufacturer} ${d.line} ${d.name} ${d.decor ?? ''} ${d.surface ?? ''} ${DOOR_STYLE_LABEL[d.style]}`;
const doorStore = (d: DoorProduct) => d.store;

export function DoorCatalog({ selectedId, onPick, open }: { selectedId?: string; onPick: (d: DoorProduct) => void; open?: boolean }) {
  const { list, bar, active } = useCatalogFilter(DOOR_PRODUCTS, doorText, doorStore);
  if (!DOOR_PRODUCTS.length) return null;
  return (
    <details className="catalog" open={open}>
      <summary>Katalógus – valós ajtók ({DOOR_PRODUCTS.length})</summary>
      {bar}
      {(Object.keys(DOOR_TONE_LABEL) as DoorProduct['tone'][]).map((t) => (
        <SwatchGroup
          key={t}
          label={DOOR_TONE_LABEL[t]}
          all={active}
          items={list.filter((d) => d.tone === t)}
          render={(d) => (
            <button
              key={d.id}
              className={`swatch square ${d.id === selectedId ? 'on' : ''}`}
              style={{ background: d.hex }}
              title={`${d.store}: ${d.manufacturer} ${d.line} – ${d.name} · ${DOOR_STYLE_LABEL[d.style]}${d.price ? ` · ${d.price}` : ''}`}
              onClick={() => onPick(d)}
            />
          )}
        />
      ))}
    </details>
  );
}

const curtainText = (c: CurtainProduct) => `${c.store} ${c.name} ${c.colorName} ${c.material ?? ''}`;
const curtainStore = (c: CurtainProduct) => c.store;

export function CurtainCatalog({ selectedId, onPick, sheer, open }: { selectedId?: string; onPick: (c: CurtainProduct) => void; sheer: boolean; open?: boolean }) {
  const base = useMemo(() => CURTAIN_PRODUCTS.filter((c) => (c.type === 'sheer') === sheer), [sheer]);
  const { list: items, bar, active } = useCatalogFilter(base, curtainText, curtainStore);
  if (!base.length) return null;
  const groups: CurtainProduct['type'][] = sheer ? ['sheer'] : ['blackout', 'dimout'];
  return (
    <details className="catalog" open={open}>
      <summary>
        Katalógus – {sheer ? 'áttetsző függönyök' : 'vastag függönyök'} ({base.length})
      </summary>
      {bar}
      {groups.map((g) => (
        <SwatchGroup
          key={g}
          label={CURTAIN_TYPE_LABEL[g]}
          all={active}
          items={items.filter((c) => c.type === g)}
          render={(c) => (
            <button
              key={c.id}
              className={`swatch square ${c.id === selectedId ? 'on' : ''}`}
              style={{ background: c.hex }}
              title={`${c.store}: ${c.name} – ${c.colorName}${c.size ? ` · ${c.size.w} × ${c.size.l} cm` : ''}${c.price ? ` · ${c.price}` : ''}`}
              onClick={() => onPick(c)}
            />
          )}
        />
      ))}
    </details>
  );
}

const panelText = (p: PaintProduct) => `${p.brand} ${p.line} ${p.name} ${p.code}`;
const panelStore = (p: PaintProduct) => p.brand;

/** Fa falpanelek (a kiemelt falra): kereséssel, márka szerint, korlátozott mintasorral. */
export function WallPanelCatalog({ selectedId, onPick, open }: { selectedId?: string; onPick: (p: PaintProduct) => void; open?: boolean }) {
  const { list, bar, active } = useCatalogFilter(WALL_PANELS, panelText, panelStore);
  if (!WALL_PANELS.length) return null;
  const brands = [...new Set(list.map((p) => p.brand))];
  return (
    <details className="catalog" open={open}>
      <summary>Katalógus – fa falpanelek ({WALL_PANELS.length})</summary>
      {bar}
      {brands.map((b) => (
        <SwatchGroup
          key={b}
          label={b}
          all={active}
          items={list.filter((p) => p.brand === b)}
          render={(p) => (
            <button
              key={p.id}
              className={`swatch square ${p.id === selectedId ? 'on' : ''}`}
              style={{ background: p.hex }}
              title={`${p.brand} – ${p.name}${p.code ? ` (${p.code})` : ''} · falpanel${p.price ? ` · ${p.price}` : ''}`}
              onClick={() => onPick(p)}
            />
          )}
        />
      ))}
    </details>
  );
}
