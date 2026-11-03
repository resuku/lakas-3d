import { useMemo } from 'react';
import { CHOICE_GROUPS } from '../data/choices';
import { FURNISHING, FURNITURE_PROPOSAL } from '../data/furnishing';
import { COLOR_SOURCE_LABEL, findFurniture, FURNITURE_PRODUCTS } from '../data/products';
import { activeFurnishing, outOfLimits, SLOT_LIMITS, type ResolvedSpec } from '../lib/furnish';
import { furnitureFit, furniturePalette, nearestFit, type FurnitureFit } from '../lib/furnitureFit';
import { STATUS_INFO } from '../lib/status';
import { furnitureLines, suggestFurniture } from '../lib/furnitureSets';
import { clashRow, colorClashes } from '../lib/colorClash';
import { subPicks } from '../lib/subs';
import { findSubVariant } from '../data/subVariants';
import type { FurnCategory, FurnitureProduct, Variant } from '../model/types';
import { useStore } from '../store';
import { Field, Segmented, Toggle } from './controls';

// Berendezési javaslat egy helyiségre: a lehetőségek (kanapé, asztal, ágy…), termékhelyenként a katalógusbútor
// választása, a 3D-ben használt színek és az elemek listája.

export const hasFurnishing = (roomId: string) => (FURNISHING[roomId] ?? []).length > 0;

const VERDICT = { good: '✓ jól megy', ok: '≈ elmegy', bad: '✕ kerülendő' };
const cm = (v?: number) => (v === undefined ? '?' : `${Math.round(v / 10)}`);

/** Melyik bútor-színvilág listával vessük össze a termék színét. */
function fitLists(fit: FurnitureFit, cat: FurnCategory) {
  if (cat === 'bed') return [fit.sofa, fit.wood];
  return ['tvUnit', 'nightstand', 'diningTable', 'divider'].includes(cat) ? [fit.wood] : [fit.sofa];
}

function sizeText(p: FurnitureProduct) {
  const s = p.size;
  const main = p.shape === 'round' ? `ø${cm(s.w)}` : `${cm(s.w)} × ${cm(s.d)}`;
  return [
    `${main}${s.h ? ` × ${cm(s.h)}` : ''} cm`,
    s.ext && `bővítve ${cm(s.ext)} cm`,
    s.chaiseD && `chaise ${cm(s.chaiseW)} × ${cm(s.chaiseD)} cm`,
    s.sleepW && s.sleepL && `fekvőfelület ${cm(s.sleepW)} × ${cm(s.sleepL)} cm`,
    s.seatH && `ülésmagasság ${cm(s.seatH)} cm`,
    s.pile && `szál ${s.pile} mm`,
  ]
    .filter(Boolean)
    .join(', ');
}

function ProductPicker({ spec, fit, mine }: { spec: ResolvedSpec; fit: FurnitureFit; mine?: string }) {
  const s = useStore();
  const slot = spec.slot!;
  const pick = s.furniturePicks[slot];
  const list = FURNITURE_PRODUCTS.filter((p) => p.category === spec.category);
  const fits = list.filter((p) => !outOfLimits(slot, p).length);
  const over = list.filter((p) => outOfLimits(slot, p).length);
  const p = spec.product;
  const prop = FURNITURE_PROPOSAL.find((x) => x.slot === slot);
  const mark = (id: string) => `${id === mine ? '◆ ' : ''}${prop?.pick === id ? '★ ' : prop?.alt.includes(id) ? '☆ ' : ''}`;
  const opt = (x: FurnitureProduct) => (
    <option key={x.id} value={x.id}>
      {mark(x.id)}
      {x.store} – {x.name}
      {x.price ? ` – ${x.price.split(' (')[0]}` : ''}
    </option>
  );
  const nf = p ? nearestFit(fitLists(fit, p.category), p.hex) : null;
  const out = p ? outOfLimits(slot, p) : [];
  return (
    <div className="furnish-pick">
      <select value={pick ?? ''} onChange={(e) => s.setFurniturePick(slot, e.target.value || undefined)} title={SLOT_LIMITS[slot]?.label}>
        <option value="">helyőrző ({spec.w} × {spec.d} mm)</option>
        {fits.length > 0 && <optgroup label={`Belefér (${SLOT_LIMITS[slot]?.label ?? 'méretkeret'})`}>{fits.map(opt)}</optgroup>}
        {over.length > 0 && <optgroup label="Kilóg a méretkeretből">{over.map(opt)}</optgroup>}
      </select>
      {prop && pick !== prop.pick && findFurniture(prop.pick) && (
        <button className="link-btn" onClick={() => s.setFurniturePick(slot, prop.pick)} title={prop.why}>
          ★ Javasolt: {findFurniture(prop.pick)!.store} – {findFurniture(prop.pick)!.name.split(',')[0]}
        </button>
      )}
      {p && (
        <div className="furnish-product">
          {prop && (prop.pick === p.id || prop.alt.includes(p.id)) && <small>{prop.pick === p.id ? '★ Javasolt' : '☆ Alternatíva'} (tervezet): {prop.why}</small>}
          <span>
            {sizeText(p)}
            {p.price && <> · {p.price}</>}{' '}
            <a href={p.url} target="_blank" rel="noreferrer">
              termékoldal ↗
            </a>
          </span>
          {nf && (
            <span className={`fit-chip ${nf.verdict}`} title={`A legközelebbi bútor-színvilág minta: ${nf.label}. ${nf.reasons.join('; ')}`}>
              <i style={{ background: p.hex }} />
              {p.colorName ?? p.hex} ({COLOR_SOURCE_LABEL[p.hexSource]}) – {VERDICT[nf.verdict]} a változathoz
            </span>
          )}
          {nf?.verdict === 'bad' && <span className="warn-text">⚠ Elüt a javaslat színvilágától – a {nf.label} minta ehhez a változathoz kerülendő.</span>}
          {out.length > 0 && <span className="warn-text">Kilóg a méretkeretből: {out.join(', ')}</span>}
          {p.note && <small>{p.note}</small>}
        </div>
      )}
    </div>
  );
}

export function FurnishingPanel({ v, roomId }: { v: Variant; roomId: string }) {
  const s = useStore();
  const on = s.layers.furniture;
  const fit = useMemo(() => furnitureFit(v), [v]);
  const pal = useMemo(() => furniturePalette(fit), [fit]);
  const specs = useMemo(() => activeFurnishing(roomId, s.choices, s.furniturePicks), [roomId, s.choices, s.furniturePicks]);
  const groups = CHOICE_GROUPS.filter((g) => g.furniture && g.roomId === roomId);
  // termékhelyenként az első látható elem (a 4 szék egy terméket kap)
  const slots = [...new Map(specs.filter((f) => f.slot && f.category).map((f) => [f.slot!, f])).values()];
  const sugg = useMemo(() => suggestFurniture(v), [v]);
  return (
    <>
      <Toggle checked={on} onChange={(b) => s.setLayer('furniture', b)} label="Bútorok megjelenítése (minden helyiségben)" />
      {on && (
        <>
          <p className="note">
            Termék nélkül befoglaló méretű helyőrző, a szín a Javaslat fül bútor-színvilágából (kárpit {pal.upholstery.label}, szék és puff {pal.upholstery2.label},
            bútortest {pal.body.label}, fa {pal.wood.label}, szőnyeg {pal.rug.label}, fém {pal.metal.label}). Választott termékkel a termékoldal mérete és
            színe látszik; a választás a színváltozattól független.
          </p>
          {groups.map((g) => {
            const val = s.choices[g.id] ?? g.default;
            const opt = g.options.find((o) => o.id === val);
            return (
              <Field key={g.id} label={g.label}>
                <Segmented value={val} options={g.options.map((o) => ({ v: o.id, label: o.label }))} onChange={(o) => s.setChoice(g.id, o)} />
                {opt?.note && <p className="note">{opt.note}</p>}
              </Field>
            );
          })}
          {FURNITURE_PRODUCTS.length > 0 && slots.length > 0 && (
            <div className="row">
              <button
                onClick={() => s.setFurniturePicks({ ...s.furniturePicks, ...Object.fromEntries(FURNITURE_PROPOSAL.map((x) => [x.slot, x.pick])) })}
                title="Minden termékhelyre a konszignáció-tervezet javasolt terméke (★) – javaslat, nem döntés"
              >
                Konszignáció-tervezet (★)
              </button>
              <button onClick={() => s.setFurniturePicks(sugg.picks)} title={`A(z) ${v.name} változathoz illő bútorok (◆) – a Javaslat fülön részletezve`}>
                A változat bútorai (◆)
              </button>
              <button onClick={() => s.setFurniturePicks({})} disabled={!Object.keys(s.furniturePicks).length} title="Minden bútor vissza a befoglaló méretű helyőrzőre">
                Mind helyőrző
              </button>
            </div>
          )}
          {FURNITURE_PRODUCTS.length > 0 &&
            slots.map((f) => (
              <Field key={f.slot} label={`${f.label} – termék`}>
                <ProductPicker spec={f} fit={fit} mine={sugg.picks[f.slot!]} />
              </Field>
            ))}
          <ul className="furnish-list">
            {specs.map((f) => (
              <li key={f.id} title={[f.basis, f.note].filter(Boolean).join('\n')}>
                <b>{f.label}</b> {f.w} × {f.d} × {f.h} mm{' '}
                {f.product ? (
                  <span className="status-chip product">termék</span>
                ) : (
                  <span className="status-chip" style={{ background: STATUS_INFO[f.s].color }}>
                    {f.s}
                  </span>
                )}
                {s.details && <small>{f.product ? `${f.product.store}: ${f.product.name}` : f.basis}</small>}
              </li>
            ))}
          </ul>
        </>
      )}
    </>
  );
}

/** A változathoz (aljavaslatnál annak termékeivel) illő bútorok (lib/furnitureSets.ts), a színvilág ítéletével. */
export function VariantFurniture({ v }: { v: Variant }) {
  const s = useStore();
  const found = findSubVariant(s.activeSubId);
  const sub = found?.parent === v.id ? found : undefined;
  const sugg = useMemo(() => suggestFurniture(v), [v]);
  const picks = useMemo(() => (sub ? subPicks(v, sub) : sugg.picks), [v, sub, sugg]);
  const lines = useMemo(() => {
    if (!sub) return sugg.lines;
    // aljavaslatnál csak a választott lehetőségek termékhelyei; a rangsorból vett alternatíva jelölve
    const visible = new Set(Object.keys(FURNISHING).flatMap((r) => activeFurnishing(r, s.choices, picks).map((f) => f.slot)));
    const why = Object.fromEntries(
      Object.entries(sub.picks ?? {})
        .filter(([, n]) => typeof n === 'number' && n > 0)
        .map(([slot, n]) => [slot, `${Number(n) + 1}. a változat rangsorában (alternatíva)`]),
    );
    return furnitureLines(v, picks, why).filter((l) => visible.has(l.slot));
  }, [v, sub, sugg, picks, s.choices]);
  const same = Object.entries(picks).every(([k, id]) => s.furniturePicks[k] === id);
  return (
    <>
      <p className="note">
        {sub
          ? `${sub.name}: a választott lehetőségek termékei – ahol az aljavaslat mást kér, a változat rangsorának egy másik, szintén illő terméke (heurisztika, nem döntés).`
          : 'Termékhelyenként a katalógusból a méretkeretbe férő, a változat színeihez legjobban illő termék (heurisztika, nem döntés; az egyes helyek a lehetőségek szerint látszanak, pl. egyenes vagy L kanapé).'}{' '}
        {sugg.note}
      </p>
      <ul className="furnish-sugg">
        {lines.map((l) => (
          <li key={l.slot} title={[l.product.note, l.fit.reasons.join('; ')].filter(Boolean).join('\n')}>
            <i style={{ background: l.product.hex }} />
            <span>
              <b>{l.label}:</b> {l.product.store} – {l.product.name}
              {l.product.price ? ` · ${l.product.price.split(' (')[0]}` : ''}{' '}
              <a href={l.product.url} target="_blank" rel="noreferrer">
                ↗
              </a>
              <small className={`fit-chip ${l.fit.verdict}`}>{l.fit.verdict === 'good' ? '✓' : l.fit.verdict === 'ok' ? '≈' : '⚠'} {l.why}</small>
            </span>
          </li>
        ))}
      </ul>
      <div className="row">
        <button onClick={() => s.setFurniturePicks(picks)} disabled={same} title="A fenti termékek a 3D nézetbe és a bevásárlólistába">
          {same ? 'Ezek látszanak a 3D nézetben' : 'Betöltés a 3D nézetbe'}
        </button>
      </div>
      <Toggle checked={s.furnitureFollowsVariant} onChange={(b) => s.setFurnitureFollowsVariant(b)} label="A javaslat választásakor a bútorok is cserélődnek" />
    </>
  );
}

/** A változat színvilágától elütő látható bútorok és dekorelemek, minden helyiségben (lib/colorClash.ts). */
export function ColorClashes({ v }: { v: Variant }) {
  const s = useStore();
  const furnish = s.layers.furniture ? s.furniturePicks : null;
  const decor = s.layers.decor ? s.decor : null;
  const clashes = useMemo(() => colorClashes(v, s.choices, furnish, decor ?? []), [v, s.choices, furnish, decor]);
  if (!furnish && !decor) return <p className="note">A bútorok és a dekor rejtve – nincs mit ellenőrizni.</p>;
  return clashes.length ? (
    <div className="clash-box">
      <b>⚠ Elüt a javaslat színvilágától ({clashes.length}):</b>
      <ul>
        {clashes.map((c) => (
          <li key={`${c.kind}-${c.id}`}>{clashRow(c)}</li>
        ))}
      </ul>
      <small>Figyelmeztetés, nem tiltás: a választott termék vagy dekor színe a változat bútor-színvilágában a kerülendők közé esik.</small>
    </div>
  ) : (
    <p className="note ok-text">✓ A látható bútorok{decor ? ' és dekorelemek' : ''} színe nem üt el a javaslat színvilágától.</p>
  );
}
