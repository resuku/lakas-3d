import { useEffect, useMemo, useState } from 'react';
import { DECOR_GROUPS, DECOR_TYPES, findDecorType } from '../data/decor';
import { FURNITURE_PRODUCTS } from '../data/products';
import { getRoom } from '../data/rooms';
import type { DecorItem, WallId } from '../model/types';
import { decorFit } from '../lib/colorClash';
import { subShortName } from '../data/subVariants';
import { furnitureFit, type FitItem } from '../lib/furnitureFit';
import { useStore, useVariant } from '../store';
import { Field, Toggle } from './controls';

// Dekorelemek egy helyiségben: típus választása és elhelyezése kattintással (fal, padló, bútor teteje), a kijelölt elem
// finomhangolása (5 cm-es lépések, forgatás, méret, szín), áthelyezés, másolat, törlés.

const PANEL_TYPE: Record<string, string> = { 'akusztik-lamella': 'slat', 'akusztik-hatszog': 'hexagon', 'akusztik-filc': 'felt' };
const STEP = 50;

function Selected({ d, fit }: { d: DecorItem; fit: FitItem | null }) {
  const s = useStore();
  const t = findDecorType(d.type)!;
  const room = getRoom(d.roomId);
  const up = (patch: Partial<DecorItem>) => s.updateDecor(d.id, patch);
  const products = FURNITURE_PRODUCTS.filter((p) => p.category === 'acousticPanel' && p.panelType === PANEL_TYPE[t.id]);
  const nudge = (k: 'a' | 'x' | 'z' | 'y', dv: number) => up({ [k]: Math.max(0, Math.round((d[k] ?? 0) + dv)) });
  return (
    <div className="decor-selected">
      <b>{t.label}</b>
      <small>
        {d.wall ? `${room.walls[d.wall].name}, a fal mentén ${d.a} mm, alja ${d.y} mm` : `x ${d.x} · z ${d.z} mm, alap ${d.y} mm, ${d.rot ?? 0}°`}
      </small>
      <div className="row nudge">
        {d.wall ? (
          <>
            <button onClick={() => nudge('a', -STEP)} title="Balra a fal mentén (5 cm)">◀</button>
            <button onClick={() => nudge('a', STEP)} title="Jobbra a fal mentén (5 cm)">▶</button>
            <button onClick={() => nudge('y', STEP)} title="Feljebb (5 cm)">▲</button>
            <button onClick={() => nudge('y', -STEP)} title="Lejjebb (5 cm)">▼</button>
          </>
        ) : (
          <>
            <button onClick={() => nudge('x', -STEP)} title="x − 5 cm">x−</button>
            <button onClick={() => nudge('x', STEP)} title="x + 5 cm">x+</button>
            <button onClick={() => nudge('z', -STEP)} title="z − 5 cm">z−</button>
            <button onClick={() => nudge('z', STEP)} title="z + 5 cm">z+</button>
            <button onClick={() => up({ rot: ((d.rot ?? 0) + 345) % 360 })} title="Forgatás balra 15°">⟲</button>
            <button onClick={() => up({ rot: ((d.rot ?? 0) + 15) % 360 })} title="Forgatás jobbra 15°">⟳</button>
          </>
        )}
      </div>
      {d.wall && (
        <select value={d.wall} onChange={(e) => up({ wall: e.target.value as WallId })} title="Melyik falon">
          {(Object.keys(room.walls) as WallId[]).map((w) => (
            <option key={w} value={w}>
              {room.walls[w].name}
            </option>
          ))}
        </select>
      )}
      {t.variants && (
        <select value={d.variant ?? t.variants[0].id} onChange={(e) => up({ variant: e.target.value })} disabled={!!d.productId} title="Szín / keret">
          {t.variants.map((v) => (
            <option key={v.id} value={v.id}>
              {v.label}
            </option>
          ))}
        </select>
      )}
      {fit?.verdict === 'bad' && <span className="warn-text">⚠ Elüt a javaslat színvilágától (legközelebbi minta: {fit.label}) – más szín vagy keret illik jobban.</span>}
      {d.origin && <small>Aljavaslatból ({subShortName(d.origin)}); másik aljavaslat választásakor cserélődik.</small>}
      {t.sizes && (
        <div className="row">
          <select value={d.w ?? t.w} onChange={(e) => up({ w: Number(e.target.value) })} title="Szélesség">
            {t.sizes.w.map((v) => (
              <option key={v} value={v}>
                {v / 10} cm széles
              </option>
            ))}
          </select>
          <select value={d.h ?? t.h} onChange={(e) => up({ h: Number(e.target.value) })} title="Magasság">
            {t.sizes.h.map((v) => (
              <option key={v} value={v}>
                {v / 10} cm magas
              </option>
            ))}
          </select>
        </div>
      )}
      {products.length > 0 && (
        <select value={d.productId ?? ''} onChange={(e) => up({ productId: e.target.value || undefined })} title="Katalógustermék (szín, ár, bevásárlólista)">
          <option value="">termék nélkül (jelzésszerű)</option>
          {products.map((p) => (
            <option key={p.id} value={p.id}>
              {p.store} – {p.name}
              {p.price ? ` – ${p.price.split(' (')[0]}` : ''}
            </option>
          ))}
        </select>
      )}
      <div className="row">
        <button onClick={() => s.setPlacing({ moveId: d.id })} title="Kattints az új helyre a 3D nézetben">
          Áthelyezés…
        </button>
        <button
          onClick={() => s.addDecor({ ...d, id: `d-${Date.now().toString(36)}`, ...(d.wall ? { a: (d.a ?? 0) + (d.w ?? t.w) + 100 } : { x: (d.x ?? 0) + 300 }) })}
          title="Másolat mellé"
        >
          Másolat
        </button>
        <button className="danger" onClick={() => s.removeDecor(d.id)}>
          Törlés
        </button>
      </div>
    </div>
  );
}

export function DecorPanel({ roomId }: { roomId: string }) {
  const s = useStore();
  const [ask, setAsk] = useState(false);
  const items = s.decor.filter((d) => d.roomId === roomId);
  const sel = items.find((d) => d.id === s.selectedDecor);
  const v = useVariant(s.activeId);
  const vf = useMemo(() => furnitureFit(v), [v]);
  const fits = useMemo(() => new Map(items.map((d) => [d.id, decorFit(vf, d)])), [items, vf]);
  const placingType = s.placing ? findDecorType(s.placing.typeId ?? s.decor.find((d) => d.id === s.placing?.moveId)?.type ?? '') : undefined;
  useEffect(() => {
    if (!s.placing) return;
    const esc = (e: KeyboardEvent) => e.key === 'Escape' && useStore.getState().setPlacing(null);
    document.body.classList.add('placing');
    window.addEventListener('keydown', esc);
    return () => {
      document.body.classList.remove('placing');
      window.removeEventListener('keydown', esc);
    };
  }, [s.placing]);
  return (
    <>
      <Toggle checked={s.layers.decor} onChange={(b) => s.setLayer('decor', b)} label="Dekorelemek megjelenítése (minden helyiségben)" />
      {s.placing && placingType && (
        <div className="decor-placing">
          <b>{placingType.label}</b>: kattints a 3D nézetben {placingType.mount === 'wall' ? 'egy falra' : placingType.mount === 'surface' ? 'egy bútor tetejére vagy a padlóra' : 'a padlóra'}. (Esc: mégse)
          <button onClick={() => s.setPlacing(null)}>Mégse</button>
        </div>
      )}
      <p className="note">Jelzésszerű formák „mutatóba” – nem termékek. Válassz egy elemet: a 3D nézetben halvány előnézet követi az egeret, kattintásra a helyére kerül. Mozgatás: az <b>M</b> billentyűt nyomva tartva húzd az elemet (falon a fal mentén, padlón a padlón vagy bútorra); a kijelölt elem lent is hangolható. Az akusztikus panelekhez katalógustermék is rendelhető. A listában ◇: aljavaslatból betöltött elem, ⚠: a színe elüt a javaslat színvilágától.</p>
      {DECOR_GROUPS.map((g) => (
        <Field key={g.id} label={g.label}>
          <div className="decor-types">
            {DECOR_TYPES.filter((t) => t.group === g.id).map((t) => (
              <button key={t.id} className={s.placing?.typeId === t.id ? 'on' : ''} onClick={() => s.setPlacing(s.placing?.typeId === t.id ? null : { typeId: t.id })} title={`${t.w / 10} × ${t.h / 10} cm – ${t.mount === 'wall' ? 'falra' : t.mount === 'surface' ? 'bútorra vagy padlóra' : 'padlóra'}`}>
                {t.label}
              </button>
            ))}
          </div>
        </Field>
      ))}
      {items.length > 0 && (
        <Field label={`Elhelyezve ebben a helyiségben (${items.length})`}>
          <ul className="decor-list">
            {items.map((d) => (
              <li key={d.id} className={d.id === s.selectedDecor ? 'on' : ''}>
                <button
                  className="link-btn"
                  onClick={() => s.selectDecor(d.id === s.selectedDecor ? null : d.id)}
                  title={fits.get(d.id)?.verdict === 'bad' ? `Elüt a javaslat színvilágától (${fits.get(d.id)!.label})` : d.origin ? 'Aljavaslatból' : undefined}
                >
                  {fits.get(d.id)?.verdict === 'bad' ? '⚠ ' : ''}
                  {findDecorType(d.type)?.label ?? d.type}
                  {d.origin ? ' ◇' : ''}
                </button>
              </li>
            ))}
          </ul>
          {sel && <Selected d={sel} fit={fits.get(sel.id) ?? null} />}
          {!ask ? (
            <button className="wide" onClick={() => setAsk(true)}>
              Minden dekor törlése ebben a helyiségben…
            </button>
          ) : (
            <div className="row">
              <button
                className="danger"
                onClick={() => {
                  items.forEach((d) => s.removeDecor(d.id));
                  setAsk(false);
                }}
              >
                Törlés ({items.length})
              </button>
              <button onClick={() => setAsk(false)}>Mégse</button>
            </div>
          )}
        </Field>
      )}
    </>
  );
}
