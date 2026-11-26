import { getRoom } from '../data/rooms';
import { FIXTURE_LABEL, LAMP_PRODUCTS, findLamp, fixtureSpec, lampKey, placeholderFixtures, roomFixtures } from '../lib/fixtures';
import { roomDims } from '../lib/geom';
import type { Fixture, FixtureType, LampProduct } from '../model/types';
import { useStore } from '../store';
import { Field, NavRow, Segmented, Slider, Toggle } from './controls';
import { useMemo } from 'react';
import { useCatalogFilter } from './catalogFilter';

const lampText = (p: LampProduct) => `${p.store} ${p.brand ?? ''} ${p.name} ${p.colorName ?? ''}`;
const lampStore = (p: LampProduct) => p.store;

// Világítási terv szerkesztése az aktuális helyiségben.

/** Átlagos megvilágítás irányértéke (lx) helyiségtípusonként – tájékoztató tartomány. */
const TARGET_LX: Record<string, [number, number, string]> = {
  nappali: [100, 200, 'általános fény; az étkezőasztalon 200–300 lx'],
  halo: [75, 150, 'általános fény; olvasáshoz a fejnél 300 lx körül'],
  dolgozo: [300, 500, 'az íróasztalon, munkafénnyel együtt'],
  eloszoba: [100, 150, 'közlekedés, tükör előtt több'],
  kozlekedo: [75, 100, 'közlekedés'],
};

/** Hasznosítási tényező: a fényáram ekkora része jut átlagosan a padló szintjére (világos falak, kis helyiség). */
const UF = 0.5;

const ADDABLE: FixtureType[] = ['pendant', 'ceiling', 'track', 'floor', 'wall', 'table'];

function lampLabel(p: LampProduct) {
  const lm = p.lm ? `${p.lm} lm` : p.socket ? `${p.socket.count}× ${p.socket.type}` : '';
  return `${p.store}: ${p.name}${lm ? ` – ${lm}` : ''}${p.price ? ` – ${p.price.split(' (')[0]}` : ''}`;
}

function LampInfo({ f }: { f: Fixture }) {
  const light = useStore((s) => s.light);
  const p = findLamp(f.productId);
  const spec = fixtureSpec(f, light);
  const src = spec.lmSource === 'product' ? 'beépített LED' : spec.lmSource === 'bulb' ? `feltételezett ${p?.socket?.type} LED izzóval (izzó nélkül kapható)` : 'a fényjelenet beállításából';
  return (
    <div className="product-info">
      {p ? (
        <>
          <b>{p.store}</b> · {p.brand ? `${p.brand} ` : ''}
          {p.name}
          {p.colorName ? `, ${p.colorName}` : ''}
          <small>
            {[p.size.d && `Ø ${p.size.d} mm`, p.size.h && `magasság ${p.size.h} mm`, p.size.l && `hossz ${p.size.l} mm`, p.heads && `${p.heads} spot`].filter(Boolean).join(', ')}
            {p.price && ` · ${p.price}`} ·{' '}
            <a href={p.url} target="_blank" rel="noreferrer">
              termékoldal
            </a>
          </small>
        </>
      ) : (
        <small>Általános {FIXTURE_LABEL[f.type]}, termék nélkül.</small>
      )}
      <small>
        Fényáram: {Math.round(spec.lm)} lm ({src}){spec.K ? `, ${spec.K} K` : ''}.
      </small>
      {p?.note && <small>{p.note}</small>}
      {f.type === 'pendant' && (f.y ?? 1700) < 1900 && <small className="warn">Az alsó éle fejmagasság alatt van – csak asztal fölé.</small>}
    </div>
  );
}

function FixtureCard({ f, roomId, W, L, onChange, onDelete, details }: { f: Fixture; roomId: string; W: number; L: number; onChange: (f: Fixture) => void; onDelete: () => void; details: boolean }) {
  const off = useStore((s) => !!s.lampsOff[lampKey(roomId, f)]);
  const toggle = useStore((s) => s.toggleLamp);
  const all = useMemo(() => LAMP_PRODUCTS.filter((p) => p.type === f.type), [f.type]);
  const { list, bar } = useCatalogFilter(all, lampText, lampStore);
  // a kiválasztott termék szűrés közben is a listában marad
  const sel = f.productId ? all.find((p) => p.id === f.productId) : undefined;
  const products = sel && !list.includes(sel) ? [sel, ...list] : list;
  return (
    <div className={`fixture ${off ? 'off' : ''}`}>
      <div className="fixture-head">
        <b>{FIXTURE_LABEL[f.type]}</b>
        <button className={off ? '' : 'on'} onClick={() => toggle(lampKey(roomId, f))} title="Ki/be – a 3D nézetben a lámpára kattintva is">
          {off ? 'ki' : 'be'}
        </button>
        {details && (
          <button onClick={onDelete} title="Lámpa törlése">
            Törlés
          </button>
        )}
      </div>
      {bar}
      <select value={f.productId ?? ''} onChange={(e) => onChange({ ...f, productId: e.target.value || undefined })}>
        <option value="">általános (termék nélkül){products.length < all.length ? ` – ${products.length} / ${all.length} termék` : ''}</option>
        {products.map((p) => (
          <option key={p.id} value={p.id}>
            {lampLabel(p)}
          </option>
        ))}
      </select>
      <LampInfo f={f} />
      {details && <FixturePosition f={f} W={W} L={L} onChange={onChange} />}
    </div>
  );
}

/** A lámpa helye (tervezői mód): x, z, függeszték alsó éle, falikar magassága, sín iránya. */
function FixturePosition({ f, W, L, onChange }: { f: Fixture; W: number; L: number; onChange: (f: Fixture) => void }) {
  return (
    <div className="fixture-pos">
      <div className="field-label">Hely</div>
      <Slider value={f.x} min={100} max={Math.round(W) - 100} step={10} onChange={(x) => onChange({ ...f, x })} format={(v) => `x ${v} mm`} />
      <Slider value={f.z} min={100} max={Math.round(L) - 100} step={10} onChange={(z) => onChange({ ...f, z })} format={(v) => `z ${v} mm`} />
      {f.type === 'pendant' && (
        <Slider value={f.y ?? 1700} min={1300} max={2400} step={10} onChange={(y) => onChange({ ...f, y })} format={(v) => `alsó éle ${v} mm`} />
      )}
      {f.type === 'wall' && <Slider value={f.y ?? 1150} min={800} max={2000} step={10} onChange={(y) => onChange({ ...f, y })} format={(v) => `magasság ${v} mm`} />}
      {f.type === 'track' && (
        <Segmented
          value={String(f.rot ?? 0)}
          options={[
            { v: '0', label: 'x irányú' },
            { v: '90', label: 'z irányú' },
          ]}
          onChange={(r) => onChange({ ...f, rot: Number(r) })}
        />
      )}
    </div>
  );
}

/** Rendezés: az általános tervek, utánuk a J-, JF-, JS-, JM-, JP- és JR-tervek szám szerint. */
function planOrder(name: string) {
  const m = name.match(/^J([RFSMP]?)(\d+)/);
  return m ? ({ '': 0, F: 300, S: 350, M: 400, P: 450, R: 500 } as Record<string, number>)[m[1]] + Number(m[2]) : 1000;
}

/** A lakásszintű világítási terv választója (a változathoz illő terv ajánlásával). */
export function LightPlanPicker() {
  const s = useStore();
  const plan = s.lightPlans.find((p) => p.id === s.activePlanId) ?? s.lightPlans[0];
  const activeVariant = s.variants.find((v) => v.id === s.activeId);
  const suggested = s.lightPlans.find((p) => p.id === activeVariant?.lightPlanId);
  return (
    <Field label="Világítási terv (lakásszintű)">
      <select value={plan.id} onChange={(e) => s.setActivePlan(e.target.value)}>
        <optgroup label="Általános tervek">
          {s.lightPlans
            .filter((p) => !/^lj[rfsmp]?\d/.test(p.id))
            .map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
        </optgroup>
        <optgroup label="A javaslatokhoz illesztve">
          {s.lightPlans
            .filter((p) => /^lj[rfsmp]?\d/.test(p.id))
            .sort((a, b) => planOrder(a.name) - planOrder(b.name))
            .map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
        </optgroup>
      </select>
      {suggested && suggested.id !== plan.id && (
        <button className="wide" onClick={() => s.setActivePlan(suggested.id)}>
          A változathoz javasolt: {suggested.name}
        </button>
      )}
      {plan.note && (
        <details className="more-text">
          <summary>A terv leírása</summary>
          <p className="variant-note">{plan.note}</p>
        </details>
      )}
      <Toggle checked={s.planFollowsVariant} onChange={s.setPlanFollowsVariant} label="Javaslatváltáskor a hozzá illő terv is" />
      {s.details && (
        <div className="row">
          <button onClick={() => s.duplicatePlan(plan.id)}>Terv másolata</button>
          <button onClick={() => s.deletePlan(plan.id)} disabled={s.lightPlans.length <= 1}>
            Terv törlése
          </button>
        </div>
      )}
    </Field>
  );
}

function usePlanRoom(roomId: string) {
  const s = useStore();
  const room = getRoom(roomId);
  const plan = s.lightPlans.find((p) => p.id === s.activePlanId) ?? s.lightPlans[0];
  const fixtures = roomFixtures(plan, room);
  const setFixtures = (fs: Fixture[]) => s.updatePlan(plan.id, (p) => ({ ...p, rooms: { ...p.rooms, [roomId]: fs } }));
  return { s, room, plan, fixtures, setFixtures, own: !!plan.rooms[roomId], ...roomDims(room) };
}

/** A helyiség lámpái tömör sorokban (ki/be, termék); a sorra kattintva a lámpa szerkesztője nyílik. */
export function LampRows({ roomId, onOpen }: { roomId: string; onOpen: (fixtureId: string) => void }) {
  const { s, room, fixtures, setFixtures, own, W, L } = usePlanRoom(roomId);
  const toggle = s.toggleLamp;
  // teljes fényerőn, minden lámpa bekapcsolva
  const totalLm = fixtures.reduce((a, f) => a + fixtureSpec(f, s.light).lm, 0);
  const lx = (totalLm * UF) / (W * L);
  const target = TARGET_LX[roomId];
  const add = (type: FixtureType) => {
    const id = `${type}-${Date.now().toString(36)}`;
    setFixtures([...fixtures, { id, type, x: Math.round((W * 1000) / 2), z: Math.round((L * 1000) / 2), ...(type === 'track' ? { rot: 90 } : {}) }]);
    onOpen(id);
  };
  return (
    <>
      {fixtures.map((f) => {
        const p = findLamp(f.productId);
        const off = !!s.lampsOff[lampKey(roomId, f)];
        return (
          <div key={f.id} className={`lamp-row ${off ? 'off' : ''}`}>
            <button className={`lamp-switch ${off ? '' : 'on'}`} onClick={() => toggle(lampKey(roomId, f))} title="Ki/be – a 3D nézetben a lámpára kattintva is">
              {off ? 'ki' : 'be'}
            </button>
            <NavRow label={f.label ?? FIXTURE_LABEL[f.type]} swatch={p?.color} value={p ? `${p.store}: ${p.name}` : 'általános lámpa'} onClick={() => onOpen(f.id)} />
          </div>
        );
      })}
      <p className="note">
        {fixtures.length} lámpa, teljes fényerőn {Math.round(totalLm)} lm → átlagosan kb. {Math.round(lx)} lx
        {target ? ` (irányérték ${target[0]}–${target[1]} lx: ${target[2]})` : ''}. Becslés: a fényáram fele jut a padló szintjére.
        {!own && ' A terv ezt a helyiséget nem részletezi: a felmért helyőrzők látszanak.'}
      </p>
      {s.details && (
        <details className="more-text">
          <summary>Lámpa hozzáadása{own ? ', visszaállítás' : ''}</summary>
          <div className="add-lamps">
            {ADDABLE.map((t) => (
              <button key={t} onClick={() => add(t)}>
                + {FIXTURE_LABEL[t]}
              </button>
            ))}
          </div>
          {own && (
            <button className="wide" onClick={() => setFixtures(placeholderFixtures(room))}>
              Vissza a felmért helyekre ebben a helyiségben
            </button>
          )}
        </details>
      )}
    </>
  );
}

/** Egy lámpa szerkesztője (termék, ki/be; tervezői módban hely és törlés). */
export function FixtureEditor({ roomId, fixtureId, onDone }: { roomId: string; fixtureId: string; onDone: () => void }) {
  const { s, fixtures, setFixtures, W, L } = usePlanRoom(roomId);
  const i = fixtures.findIndex((f) => f.id === fixtureId);
  if (i < 0) return <p className="note">Ez a lámpa ebben a helyiségben nem szerepel a tervben.</p>;
  return (
    <FixtureCard
      f={fixtures[i]}
      roomId={roomId}
      W={W * 1000}
      L={L * 1000}
      details={s.details}
      onChange={(nf) => setFixtures(fixtures.map((x, j) => (j === i ? nf : x)))}
      onDelete={() => {
        setFixtures(fixtures.filter((_, j) => j !== i));
        onDone();
      }}
    />
  );
}
