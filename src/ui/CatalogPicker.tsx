import {
  COLOR_SOURCE_LABEL,
  CURTAIN_PRODUCTS,
  CURTAIN_TYPE_LABEL,
  DOOR_PRODUCTS,
  DOOR_STYLE_LABEL,
  FLOOR_PRODUCTS,
  PAINT_FAMILIES,
  PAINT_PRODUCTS,
  findCurtain,
  findDoor,
  findFloor,
  findPaint,
} from '../data/products';
import type { CurtainProduct, DoorProduct, FloorProduct, PaintProduct } from '../model/types';

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

export function PaintCatalog({ selectedId, onPick, families }: { selectedId?: string; onPick: (p: PaintProduct) => void; families?: string[] }) {
  if (!PAINT_PRODUCTS.length) return null;
  const groups = PAINT_FAMILIES.filter((f) => !families || families.includes(f.id));
  return (
    <details className="catalog">
      <summary>Katalógus – valós festékszínek ({PAINT_PRODUCTS.length})</summary>
      {groups.map((g) => {
        const items = PAINT_PRODUCTS.filter((p) => p.family === g.id);
        if (!items.length) return null;
        return (
          <div key={g.id} className="catalog-group">
            <span>{g.label}</span>
            <div className="swatches">
              {items.map((p) => (
                <button
                  key={p.id}
                  className={`swatch square ${p.id === selectedId ? 'on' : ''}`}
                  style={{ background: p.hex }}
                  title={`${p.brand} ${p.line} – ${p.name}${p.code ? ` (${p.code})` : ''} · ${p.hex} · ${COLOR_SOURCE_LABEL[p.hexSource]}`}
                  onClick={() => onPick(p)}
                />
              ))}
            </div>
          </div>
        );
      })}
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

export function FloorCatalog({ selectedId, onPick }: { selectedId?: string; onPick: (f: FloorProduct) => void }) {
  if (!FLOOR_PRODUCTS.length) return null;
  return (
    <details className="catalog">
      <summary>Katalógus – valós padlók ({FLOOR_PRODUCTS.length})</summary>
      {(Object.keys(TONE_LABEL) as FloorProduct['tone'][]).map((t) => {
        const items = FLOOR_PRODUCTS.filter((f) => f.tone === t);
        if (!items.length) return null;
        return (
          <div key={t} className="catalog-group">
            <span>{TONE_LABEL[t]}</span>
            <div className="swatches">
              {items.map((f) => (
                <button
                  key={f.id}
                  className={`swatch square ${f.pattern === 'herringbone' ? 'hb' : ''} ${f.id === selectedId ? 'on' : ''}`}
                  style={{ background: f.hex }}
                  title={`${f.store}: ${f.manufacturer} ${f.name}${f.size ? ` · ${f.size.l} × ${f.size.w} mm` : ''}${f.pattern === 'herringbone' ? ' · halszálka' : ''}`}
                  onClick={() => onPick(f)}
                />
              ))}
            </div>
          </div>
        );
      })}
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

export function DoorCatalog({ selectedId, onPick }: { selectedId?: string; onPick: (d: DoorProduct) => void }) {
  if (!DOOR_PRODUCTS.length) return null;
  return (
    <details className="catalog">
      <summary>Katalógus – valós ajtók ({DOOR_PRODUCTS.length})</summary>
      {(Object.keys(DOOR_TONE_LABEL) as DoorProduct['tone'][]).map((t) => {
        const items = DOOR_PRODUCTS.filter((d) => d.tone === t);
        if (!items.length) return null;
        return (
          <div key={t} className="catalog-group">
            <span>{DOOR_TONE_LABEL[t]}</span>
            <div className="swatches">
              {items.map((d) => (
                <button
                  key={d.id}
                  className={`swatch square ${d.id === selectedId ? 'on' : ''}`}
                  style={{ background: d.hex }}
                  title={`${d.store}: ${d.manufacturer} ${d.line} – ${d.name} · ${DOOR_STYLE_LABEL[d.style]}${d.price ? ` · ${d.price}` : ''}`}
                  onClick={() => onPick(d)}
                />
              ))}
            </div>
          </div>
        );
      })}
    </details>
  );
}

export function CurtainCatalog({ selectedId, onPick, sheer }: { selectedId?: string; onPick: (c: CurtainProduct) => void; sheer: boolean }) {
  const items = CURTAIN_PRODUCTS.filter((c) => (c.type === 'sheer') === sheer);
  if (!items.length) return null;
  const groups: CurtainProduct['type'][] = sheer ? ['sheer'] : ['blackout', 'dimout'];
  return (
    <details className="catalog">
      <summary>
        Katalógus – {sheer ? 'áttetsző függönyök' : 'vastag függönyök'} ({items.length})
      </summary>
      {groups.map((g) => {
        const list = items.filter((c) => c.type === g);
        if (!list.length) return null;
        return (
          <div key={g} className="catalog-group">
            <span>{CURTAIN_TYPE_LABEL[g]}</span>
            <div className="swatches">
              {list.map((c) => (
                <button
                  key={c.id}
                  className={`swatch square ${c.id === selectedId ? 'on' : ''}`}
                  style={{ background: c.hex }}
                  title={`${c.store}: ${c.name} – ${c.colorName}${c.size ? ` · ${c.size.w} × ${c.size.l} cm` : ''}${c.price ? ` · ${c.price}` : ''}`}
                  onClick={() => onPick(c)}
                />
              ))}
            </div>
          </div>
        );
      })}
    </details>
  );
}
