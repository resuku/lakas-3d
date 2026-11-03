import { getRoom } from '../data/rooms';
import { FIXTURE_LABEL, LAMP_PRODUCTS, findLamp, fixtureSpec, lampKey, placeholderFixtures, roomFixtures } from '../lib/fixtures';
import { roomDims } from '../lib/geom';
import type { Fixture, FixtureType, LampProduct } from '../model/types';
import { useStore } from '../store';
import { Field, Segmented, Slider, Toggle } from './controls';

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

function FixtureCard({ f, roomId, W, L, onChange, onDelete }: { f: Fixture; roomId: string; W: number; L: number; onChange: (f: Fixture) => void; onDelete: () => void }) {
  const off = useStore((s) => !!s.lampsOff[lampKey(roomId, f)]);
  const toggle = useStore((s) => s.toggleLamp);
  const products = LAMP_PRODUCTS.filter((p) => p.type === f.type);
  return (
    <div className={`fixture ${off ? 'off' : ''}`}>
      <div className="fixture-head">
        <b>{f.label ?? FIXTURE_LABEL[f.type]}</b>
        <button className={off ? '' : 'on'} onClick={() => toggle(lampKey(roomId, f))} title="Ki/be – a 3D nézetben a lámpára kattintva is">
          {off ? 'ki' : 'be'}
        </button>
        <button onClick={onDelete} title="Lámpa törlése">
          ✕
        </button>
      </div>
      <select value={f.productId ?? ''} onChange={(e) => onChange({ ...f, productId: e.target.value || undefined })}>
        <option value="">általános (termék nélkül)</option>
        {products.map((p) => (
          <option key={p.id} value={p.id}>
            {lampLabel(p)}
          </option>
        ))}
      </select>
      <LampInfo f={f} />
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

export function LightPlanEditor({ roomId }: { roomId: string }) {
  const s = useStore();
  const room = getRoom(roomId);
  const plan = s.lightPlans.find((p) => p.id === s.activePlanId) ?? s.lightPlans[0];
  const activeVariant = s.variants.find((v) => v.id === s.activeId);
  const suggested = s.lightPlans.find((p) => p.id === activeVariant?.lightPlanId);
  const fixtures = roomFixtures(plan, room);
  const { W, L } = roomDims(room);
  const setFixtures = (fs: Fixture[]) => s.updatePlan(plan.id, (p) => ({ ...p, rooms: { ...p.rooms, [roomId]: fs } }));
  const own = !!plan.rooms[roomId];

  // teljes fényerőn, minden lámpa bekapcsolva
  const totalLm = fixtures.reduce((a, f) => a + fixtureSpec(f, s.light).lm, 0);
  const area = W * L;
  const lx = (totalLm * UF) / area;
  const target = TARGET_LX[roomId];

  const add = (type: FixtureType) =>
    setFixtures([
      ...fixtures,
      { id: `${type}-${Date.now().toString(36)}`, type, x: Math.round((W * 1000) / 2), z: Math.round((L * 1000) / 2), ...(type === 'track' ? { rot: 90 } : {}) },
    ]);

  return (
    <>
      <Field label="Világítási terv (lakásszintű)">
        <select value={plan.id} onChange={(e) => s.setActivePlan(e.target.value)}>
          <optgroup label="Általános tervek">
            {s.lightPlans
              .filter((p) => !/^lj\d/.test(p.id))
              .map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
          </optgroup>
          <optgroup label="A J-javaslatokhoz illesztve">
            {s.lightPlans
              .filter((p) => /^lj\d/.test(p.id))
              .sort((a, b) => Number(a.name.match(/^J(\d+)/)?.[1] ?? 1000) - Number(b.name.match(/^J(\d+)/)?.[1] ?? 1000))
              .map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
          </optgroup>
        </select>
        <Toggle checked={s.planFollowsVariant} onChange={s.setPlanFollowsVariant} label="a J-javaslat választásakor a hozzá illő világítás is" />
        {suggested && suggested.id !== plan.id && (
          <button className="wide" onClick={() => s.setActivePlan(suggested.id)}>
            A változathoz javasolt: {suggested.name}
          </button>
        )}
        {plan.note && <p className="variant-note">{plan.note}</p>}
        {s.details && (
        <div className="row">
          <button onClick={() => s.duplicatePlan(plan.id)}>Másolat</button>
          <button onClick={() => s.deletePlan(plan.id)} disabled={s.lightPlans.length <= 1}>
            Törlés
          </button>
        </div>
        )}
      </Field>
      <Field label={`Lámpák – ${room.name}`}>
        <p className="note">
          {fixtures.length} lámpa, teljes fényerőn {Math.round(totalLm)} lm → átlagosan kb. {Math.round(lx)} lx
          {target ? ` (irányérték ${target[0]}–${target[1]} lx: ${target[2]})` : ''}. Becslés: a fényáram fele jut a padló szintjére.
          {!own && ' A terv ezt a helyiséget nem részletezi: a felmért helyőrzők látszanak.'}
        </p>
        {!s.details && (
          <ul className="lamp-list">
            {fixtures.map((f) => {
              const p = findLamp(f.productId);
              return (
                <li key={f.id}>
                  {f.label ?? FIXTURE_LABEL[f.type]}: {p ? `${p.store} ${p.name}` : 'általános lámpa'}
                </li>
              );
            })}
          </ul>
        )}
        {s.details && fixtures.map((f, i) => (
          <FixtureCard
            key={f.id}
            f={f}
            roomId={roomId}
            W={W * 1000}
            L={L * 1000}
            onChange={(nf) => setFixtures(fixtures.map((x, j) => (j === i ? nf : x)))}
            onDelete={() => setFixtures(fixtures.filter((_, j) => j !== i))}
          />
        ))}
        {s.details && (
        <div className="add-lamps">
          {ADDABLE.map((t) => (
            <button key={t} onClick={() => add(t)}>
              + {FIXTURE_LABEL[t]}
            </button>
          ))}
        </div>
        )}
        {own && s.details && (
          <button className="wide" onClick={() => setFixtures(placeholderFixtures(room))}>
            Vissza a felmért helyekre ebben a helyiségben
          </button>
        )}
        <p className="note">A 3D nézetben a lámpára kattintva az adott lámpa ki- és bekapcsol.</p>
      </Field>
    </>
  );
}
