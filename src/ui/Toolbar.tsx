import { getRoom, ROOMS } from '../data/rooms';
import { SCENES } from '../data/scenes';
import { ELEC_LEGEND } from '../lib/electrical';
import { STATUS_INFO } from '../lib/status';
import type { Status } from '../model/types';
import { useStore, useVariant } from '../store';
import { Popover, Segmented, Toggle } from './controls';
import { screenshot } from './files';

// Eszköztár a 3D nézet fölött: mit és honnan látunk – helyiség, nézőpont, bejárás, fényjelenet, nézetmód, rétegek,
// képernyőkép. (2026-11-26 előtt ez az oldalsáv Nézet fülén volt.)

function Legend({ items }: { items: [string, string][] }) {
  return (
    <div className="legend">
      {items.map(([label, color]) => (
        <span key={label}>
          <i style={{ background: color }} />
          {label}
        </span>
      ))}
    </div>
  );
}

export function Toolbar() {
  const s = useStore();
  const room = getRoom(s.roomId);
  const active = useVariant(s.activeId);
  const scene = SCENES.find((x) => x.id === s.sceneId);
  const layerCount = (['furniture', 'decor', 'doorsOpen', ...(s.details ? ['status', 'zones', 'dims', 'electrical'] : [])] as const).filter(
    (k) => s.layers[k as keyof typeof s.layers],
  ).length;
  const shotName = () =>
    `${room.id}_${active.name.replace(/[^\p{L}\p{N}]+/gu, '_')}_${s.viewMode === 'split' ? `${s.sceneId || 'egyedi'}_es_termekhu` : s.productView ? 'termekhu' : s.sceneId || 'egyedi'}.png`;

  return (
    <div className="toolbar">
      <div className="room-tabs" role="group" aria-label="Helyiség">
        {ROOMS.map((r) => (
          <button key={r.id} className={r.id === s.roomId ? 'on' : ''} onClick={() => s.setRoom(r.id)}>
            {r.name}
          </button>
        ))}
      </div>
      <button className={s.whole ? 'on' : ''} onClick={() => s.setWhole(!s.whole)} title="Minden helyiség a helyén; a kiválasztott helyiség a szerkesztett, a nézőpontok oda viszik a kamerát">
        Teljes lakás
      </button>

      <span className="tb-sep" />

      <select
        className="tb-select"
        value=""
        onChange={(e) => {
          if (e.target.value) s.requestCamera(e.target.value);
        }}
        title="Kész nézőpontok ebben a helyiségben"
      >
        <option value="">Nézőpont…</option>
        {room.cameras.map((c, i) => (
          <option key={c.name} value={String(i)}>
            {c.name}
          </option>
        ))}
        <option value="overview" disabled={s.walk}>
          Áttekintő
        </option>
        <option value="top" disabled={s.walk}>
          Felülnézet
        </option>
      </select>
      <button className={s.walk ? 'on' : ''} onClick={() => s.setWalk(!s.walk)} title="Séta szemmagasságban – W A S D / nyilak: mozgás, egérhúzás: körbenézés, Shift: gyorsabban, Esc: kilépés">
        {s.walk ? 'Bejárás vége' : 'Bejárás'}
      </button>

      <span className="tb-sep" />

      <select className="tb-select" value={s.sceneId ?? ''} onChange={(e) => e.target.value && s.applyScene(e.target.value)} title={scene?.hint ?? 'Egyéni fénybeállítás (Világítás fül)'}>
        {!scene && <option value="">Egyéni fény</option>}
        {SCENES.map((sc) => (
          <option key={sc.id} value={sc.id} title={sc.hint}>
            {sc.name}
          </option>
        ))}
      </select>

      <Popover label="Nézet ▾" title="Egy vagy két nézet, termékhű nézet">
        <Segmented value={s.viewMode} options={[{ v: 'single', label: 'Egy nézet' }, { v: 'split', label: 'Fényjelenet + termékhű' }]} onChange={s.setViewMode} />
        {s.viewMode === 'split' ? (
          <p className="note">Bal oldalt a fényjelenet, jobb oldalt a termékhű nézet (semleges stúdiófény) – ugyanaz a javaslat, közös kamerával.</p>
        ) : (
          <Toggle
            checked={s.productView}
            onChange={(b) => s.setViewer({ productView: b })}
            label="Termékhű nézet (T)"
            hint="Semleges stúdiófény: a szemből látott felület a katalógus színét mutatja."
          />
        )}
        <p className="note">Gyorsinfó: Alt nyomva tartva (vagy I) az egér alatti elem terméke; Ctrl + kattintás: a termék oldala.</p>
      </Popover>

      <Popover label={`Rétegek${layerCount ? ` (${layerCount})` : ''} ▾`} title="Mi látszódjon a 3D nézetben">
        <Toggle checked={s.layers.furniture} onChange={(b) => s.setLayer('furniture', b)} label="Bútorok" hint="Berendezési javaslat (Berendezés fül)" />
        <Toggle checked={s.layers.decor} onChange={(b) => s.setLayer('decor', b)} label="Dekorelemek" hint="Elhelyezés: Berendezés fül → Dekor" />
        <Toggle checked={s.layers.doorsOpen} onChange={(b) => s.setLayer('doorsOpen', b)} label="Ajtók nyitva" hint="Bejáráshoz" />
        {s.details && (
          <>
            <div className="popover-sep" />
            <Toggle checked={s.layers.status} onChange={(b) => s.setLayer('status', b)} label="Adatbiztonság színezése" />
            {s.layers.status && <Legend items={(Object.keys(STATUS_INFO) as Status[]).map((k) => [`${k} ${STATUS_INFO[k].label}`, STATUS_INFO[k].color])} />}
            <Toggle checked={s.layers.zones} onChange={(b) => s.setLayer('zones', b)} label="Funkcionális zónák" hint="Ajtónyitás, radiátor" />
            <Toggle checked={s.layers.dims} onChange={(b) => s.setLayer('dims', b)} label="Méretek" />
            <Toggle checked={s.layers.electrical} onChange={(b) => s.setLayer('electrical', b)} label="Villamosság" hint="Kapcsolók, dugaljak, kiállások" />
            {s.layers.electrical && <Legend items={ELEC_LEGEND} />}
          </>
        )}
        {!s.details && <p className="note">További rétegek (adatbiztonság, méretek, villamosság) a tervezői módban – Beállítások.</p>}
      </Popover>

      <button className="tb-right" onClick={() => screenshot(shotName())} title="A 3D nézet mentése PNG-képként">
        Kép mentése
      </button>
    </div>
  );
}
