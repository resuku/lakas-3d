import { useMemo, useRef, useState } from 'react';
import { COLOR_NOTE, DOOR_COLORS, FABRICS, PAINTS, TILE_TONES, WOOD_TONES } from '../data/catalog';
import { WALL_PANELS } from '../data/products';
import { getRoom, ROOMS } from '../data/rooms';
import { SCENES } from '../data/scenes';
import { compassLabel, computeLighting, formatHour } from '../lib/lighting';
import { wallBearing } from '../lib/geom';
import { roomLampLm } from '../lib/fixtures';
import { LOCATION } from '../lib/sun';
import { STATUS_INFO } from '../lib/status';
import type { LampGroup, Status, Variant, WallId } from '../model/types';
import { configSnapshot, isConfigFile, type SidebarTab, useStore, useVariant } from '../store';
import { Field, Section, Segmented, Slider, Sub, SwatchPicker, Toggle } from './controls';
import { findCurtain, findDoor, findFloor, findPaint } from '../data/products';
import { CurtainCatalog, DoorCatalog, FloorCatalog, PaintCatalog, ProductInfo } from './CatalogPicker';
import { LightPlanEditor } from './LightPlanEditor';
import { FurnitureFitPanel } from './FurnitureFitPanel';
import { CHOICE_GROUPS } from '../data/choices';
import { ColorClashes, FurnishingPanel, hasFurnishing, VariantFurniture } from './FurnishingPanel';
import { findSubVariant, subVariantsOf } from '../data/subVariants';
import { VariantOptions } from './VariantOptions';
import { DecorPanel } from './DecorPanel';
import { useLocalTextureCount } from '../lib/localTextures';
import { ELEC_LEGEND } from '../lib/electrical';

const MONTHS = ['jan.', 'febr.', 'márc.', 'ápr.', 'máj.', 'jún.', 'júl.', 'aug.', 'szept.', 'okt.', 'nov.', 'dec.'];

function download(name: string, blob: Blob) {
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = name;
  a.click();
  setTimeout(() => URL.revokeObjectURL(a.href), 1000);
}

/** Képernyőkép: két nézetes módban (fényjelenet + termékhű) a két vászon egymás mellé kerül. */
function screenshot(name: string) {
  const canvases = [...document.querySelectorAll<HTMLCanvasElement>('.viewport canvas')];
  if (!canvases.length) return;
  const out = document.createElement('canvas');
  out.width = canvases.reduce((a, c) => a + c.width, 0);
  out.height = Math.max(...canvases.map((c) => c.height));
  const ctx = out.getContext('2d')!;
  let x = 0;
  for (const c of canvases) {
    ctx.drawImage(c, x, 0);
    x += c.width;
  }
  out.toBlob((b) => b && download(name, b), 'image/png');
}

function LampControls({ label, g, onChange }: { label: string; g: LampGroup; onChange: (g: LampGroup) => void }) {
  return (
    <Field label={label}>
      <Toggle checked={g.on} onChange={(on) => onChange({ ...g, on })} label="bekapcsolva" />
      {g.on && (
        <>
          <Slider value={g.lm} min={100} max={4000} step={50} onChange={(lm) => onChange({ ...g, lm })} format={(v) => `${v} lm`} />
          <Slider value={g.K} min={2200} max={6500} step={100} onChange={(K) => onChange({ ...g, K })} format={(v) => `${v} K`} />
          <Slider value={g.dim} min={0.05} max={1} step={0.05} onChange={(dim) => onChange({ ...g, dim })} format={(v) => `${Math.round(v * 100)}%`} />
        </>
      )}
    </Field>
  );
}

function SurfaceEditor({ v, roomId }: { v: Variant; roomId: string }) {
  const update = useStore((s) => s.updateVariant);
  const room = getRoom(roomId);
  const set = (fn: (x: Variant) => void) =>
    update(v.id, (x) => {
      fn(x);
      return x;
    });
  const accentWall = (Object.keys(room.walls) as WallId[]).find((w) => v.accents[`${roomId}.${w}`]);
  const accentSlot = `accent:${roomId}.${accentWall}`;
  // Katalógustermék hozzárendelése egy felülethez (undefined = kézi szín, a hozzárendelés törlődik)
  const slot = (x: Variant, key: string, id?: string) => {
    x.products = { ...(x.products ?? {}) };
    if (id) x.products[key] = id;
    else delete x.products[key];
  };
  const wallHint = (findPaint(v.products?.wall)?.name ?? v.wall) + (accentWall ? ' + kiemelés' : '');
  const floorHint = findFloor(v.products?.floor)?.name ?? (v.floor.pattern === 'tile' ? 'lap' : v.floor.pattern === 'herringbone' ? 'halszálka' : 'hajópadló');
  return (
    <>
      <p className="note">{COLOR_NOTE}</p>
      <Sub title="Falak és mennyezet" open hint={wallHint}>
      <Field label="Falszín (lakásszintű)">
        <SwatchPicker value={v.wall} swatches={PAINTS} onChange={(hex) => set((x) => void ((x.wall = hex), slot(x, 'wall')))} />
        <PaintCatalog selectedId={v.products?.wall} onPick={(p) => set((x) => void ((x.wall = p.hex), slot(x, 'wall', p.id)))} />
        <ProductInfo kind="paint" id={v.products?.wall} />
        <Segmented value={v.wallFinish} options={[{ v: 'matt', label: 'matt' }, { v: 'selyem', label: 'selyemfényű' }]} onChange={(f) => set((x) => void (x.wallFinish = f))} />
      </Field>
      <Field label={`Kiemelt fal – ${room.name}`}>
        <select
          value={accentWall ?? ''}
          onChange={(e) =>
            set((x) => {
              for (const w of Object.keys(room.walls)) {
                delete x.accents[`${roomId}.${w}`];
                slot(x, `accent:${roomId}.${w}`);
                x.accentWood = x.accentWood?.filter((k) => k !== `${roomId}.${w}`);
              }
              if (e.target.value) x.accents[`${roomId}.${e.target.value}`] = PAINTS[11].hex;
            })
          }
        >
          <option value="">nincs</option>
          {(Object.keys(room.walls) as WallId[]).map((w) => (
            <option key={w} value={w}>
              {room.walls[w].name}
            </option>
          ))}
        </select>
        {accentWall && (
          <>
            <SwatchPicker
              value={v.accents[`${roomId}.${accentWall}`]}
              swatches={PAINTS}
              onChange={(hex) => set((x) => void ((x.accents[`${roomId}.${accentWall}`] = hex), slot(x, accentSlot)))}
            />
            <PaintCatalog
              selectedId={v.products?.[accentSlot]}
              onPick={(p) => set((x) => void ((x.accents[`${roomId}.${accentWall}`] = p.hex), slot(x, accentSlot, p.id)))}
            />
            <ProductInfo kind="paint" id={v.products?.[accentSlot]} />
            <Toggle
              checked={!!v.accentWood?.includes(`${roomId}.${accentWall}`)}
              onChange={(b) =>
                set((x) => {
                  const k = `${roomId}.${accentWall}`;
                  x.accentWood = (x.accentWood ?? []).filter((w) => w !== k);
                  if (b) x.accentWood.push(k);
                })
              }
              label="fa falpanel (függőleges lapok)"
            />
            {WALL_PANELS.length > 0 && (
              <div className="swatches">
                {WALL_PANELS.map((p) => (
                  <button
                    key={p.id}
                    className={`swatch square ${v.products?.[accentSlot] === p.id ? 'on' : ''}`}
                    style={{ background: p.hex }}
                    title={`${p.brand} – ${p.name} (${p.code}) · falpanel`}
                    onClick={() =>
                      set((x) => {
                        const k = `${roomId}.${accentWall}`;
                        x.accents[k] = p.hex;
                        x.accentWood = [...(x.accentWood ?? []).filter((w) => w !== k), k];
                        slot(x, accentSlot, p.id);
                      })
                    }
                  />
                ))}
              </div>
            )}
          </>
        )}
      </Field>
      <Field label="Mennyezet">
        <SwatchPicker value={v.ceiling} swatches={PAINTS.slice(0, 5)} onChange={(hex) => set((x) => void ((x.ceiling = hex), slot(x, 'ceiling')))} />
        <PaintCatalog families={['warmWhite']} selectedId={v.products?.ceiling} onPick={(p) => set((x) => void ((x.ceiling = p.hex), slot(x, 'ceiling', p.id)))} />
        <ProductInfo kind="paint" id={v.products?.ceiling} />
      </Field>
      </Sub>
      <Sub title="Padló" hint={floorHint}>
      <Field label="Padló">
        <Segmented
          value={v.floor.pattern}
          options={[
            { v: 'plank', label: 'hajópadló' },
            { v: 'herringbone', label: 'halszálka' },
            { v: 'tile', label: 'lap 60×60' },
          ]}
          onChange={(p) =>
            set((x) => {
              x.floor.pattern = p;
              delete x.floor.plank;
              slot(x, 'floor');
              const tones = p === 'tile' ? TILE_TONES : WOOD_TONES;
              if (!tones.some((t) => t.hex === x.floor.tone)) x.floor.tone = tones[1].hex;
            })
          }
        />
        <SwatchPicker
          value={v.floor.tone}
          swatches={v.floor.pattern === 'tile' ? TILE_TONES : WOOD_TONES}
          onChange={(hex) =>
            set((x) => {
              x.floor.tone = hex;
              delete x.floor.plank;
              slot(x, 'floor');
            })
          }
        />
        <FloorCatalog
          selectedId={v.products?.floor}
          onPick={(f) =>
            set((x) => {
              x.floor.pattern = f.pattern;
              x.floor.tone = f.hex;
              if (f.size) x.floor.plank = { l: f.size.l, w: f.size.w };
              else delete x.floor.plank;
              slot(x, 'floor', f.id);
            })
          }
        />
        <ProductInfo kind="floor" id={v.products?.floor} />
        {room.floor && (
          <>
            <Toggle checked={v.floorAll !== false} onChange={(b) => set((x) => void (x.floorAll = b))} label={`ez a padló itt is (${room.name.toLowerCase()}); kikapcsolva járólap`} />
            {v.floorAll === false && <p className="note">{room.floor.note}</p>}
          </>
        )}
        {v.floor.pattern !== 'tile' && (
          <Segmented value={v.floor.dir} options={[{ v: 'z', label: 'ablak felé fut' }, { v: 'x', label: 'keresztben' }]} onChange={(d) => set((x) => void (x.floor.dir = d))} />
        )}
      </Field>
      </Sub>
      <Sub title="Ajtók és szegélyléc" hint={findDoor(v.products?.door)?.name ?? v.door}>
      <Field label="Ajtók, tokok">
        <SwatchPicker value={v.door} swatches={DOOR_COLORS} onChange={(hex) => set((x) => void ((x.door = hex), slot(x, 'door')))} />
        <DoorCatalog
          selectedId={v.products?.door}
          onPick={(d) => set((x) => void ((x.door = d.hex), (x.doorStyle = d.style), slot(x, 'door', d.id)))}
        />
        <ProductInfo kind="door" id={v.products?.door} />
        <Segmented
          value={v.doorStyle ?? 'flat'}
          options={[
            { v: 'flat', label: 'sima' },
            { v: 'groove', label: 'marással' },
            { v: 'glass', label: 'üvegbetétes' },
          ]}
          onChange={(st) => set((x) => void ((x.doorStyle = st), slot(x, 'door')))}
        />
        <Segmented
          value={v.handle ?? 'steel'}
          options={[
            { v: 'steel', label: 'inox kilincs' },
            { v: 'black', label: 'fekete' },
            { v: 'brass', label: 'sárgaréz' },
          ]}
          onChange={(h) => set((x) => void (x.handle = h))}
        />
        <Toggle checked={v.doorLeafOptional} onChange={(b) => set((x) => void (x.doorLeafOptional = b))} label="opcionális új ajtólapok (pl. dolgozó)" />
      </Field>
      <Field label="Szegélyléc">
        <Segmented
          value={String(v.skirting.h)}
          options={[
            { v: '0', label: 'nincs' },
            { v: '60', label: '60' },
            { v: '80', label: '80' },
            { v: '100', label: '100 mm' },
          ]}
          onChange={(h) => set((x) => void (x.skirting.h = Number(h)))}
        />
        <Segmented
          value={v.skirting.mode}
          options={[
            { v: 'wall', label: 'falszínű' },
            { v: 'door', label: 'ajtószínű' },
            { v: 'white', label: 'fehér' },
          ]}
          onChange={(m) => set((x) => void (x.skirting.mode = m))}
        />
      </Field>
      </Sub>
      <Sub title="Függöny" hint={v.curtain.on ? (findCurtain(v.products?.curtain)?.name ?? v.curtain.color) : 'nincs'}>
      <Field label="Függöny">
        <Toggle checked={v.curtain.on} onChange={(b) => set((x) => void (x.curtain.on = b))} label="van függöny" />
        {v.curtain.on && (
          <>
            <SwatchPicker value={v.curtain.color} swatches={FABRICS} onChange={(hex) => set((x) => void ((x.curtain.color = hex), slot(x, 'curtain')))} />
            <Segmented
              value={v.curtain.sheer ? 'sheer' : 'solid'}
              options={[
                { v: 'solid', label: 'vastag / sötétítő' },
                { v: 'sheer', label: 'áttetsző' },
              ]}
              onChange={(s) => set((x) => void ((x.curtain.sheer = s === 'sheer'), slot(x, 'curtain')))}
            />
            <CurtainCatalog
              sheer={v.curtain.sheer}
              selectedId={v.products?.curtain}
              onPick={(c) => set((x) => void ((x.curtain.color = c.hex), slot(x, 'curtain', c.id)))}
            />
            <ProductInfo kind="curtain" id={v.products?.curtain} />
            {!v.curtain.sheer && (
              <>
                <Toggle
                  checked={!!v.curtain.sheerLayer}
                  onChange={(b) => set((x) => void ((x.curtain.sheerLayer = b ? '#F4F1EA' : undefined), slot(x, 'sheer')))}
                  label="mögötte áttetsző réteg (kétsoros sín)"
                />
                {v.curtain.sheerLayer && (
                  <>
                    <CurtainCatalog
                      sheer
                      selectedId={v.products?.sheer}
                      onPick={(c) => set((x) => void ((x.curtain.sheerLayer = c.hex), slot(x, 'sheer', c.id)))}
                    />
                    <ProductInfo kind="curtain" id={v.products?.sheer} />
                  </>
                )}
              </>
            )}
            <Segmented
              value={v.curtain.span}
              options={[
                { v: 'wall', label: 'falszéles' },
                { v: 'clear', label: 'radiátorig' },
                { v: 'window', label: 'ablak + 25 cm' },
              ]}
              onChange={(s) => set((x) => void (x.curtain.span = s))}
            />
            <Segmented value={v.curtain.length} options={[{ v: 'floor', label: 'padlóig' }, { v: 'sill', label: 'párkányig' }]} onChange={(s) => set((x) => void (x.curtain.length = s))} />
            <Segmented value={v.curtain.closed ? 'closed' : 'open'} options={[{ v: 'open', label: 'nyitva' }, { v: 'closed', label: 'behúzva' }]} onChange={(s) => set((x) => void (x.curtain.closed = s === 'closed'))} />
          </>
        )}
      </Field>
      </Sub>
      {(room.wardrobe || room.beds.length > 0 || hasFurnishing(roomId)) && (
      <Sub title={`Bútor – ${room.name.toLowerCase()}`}>
      {hasFurnishing(roomId) && <FurnishingPanel v={v} roomId={roomId} />}
      {room.wardrobe && (
        <Field label="Gardróbfront (megtartott korpusz)">
          <Segmented
            value={v.wardrobeFront}
            options={[
              { v: 'mirror', label: 'tükör' },
              { v: 'mirrorWood', label: 'tükör + fa' },
              { v: 'wood', label: 'fa' },
              { v: 'white', label: 'fehér' },
            ]}
            onChange={(f) => set((x) => void (x.wardrobeFront = f))}
          />
        </Field>
      )}
      {room.beds.length > 0 && (
        <Field label="Textil (ágytakaró)">
          <SwatchPicker value={v.textile} swatches={FABRICS} onChange={(hex) => set((x) => void (x.textile = hex))} />
        </Field>
      )}
      </Sub>
      )}
      <DecorSub roomId={roomId} />
    </>
  );
}

/** Dekor alcsoport: kijelöléskor vagy elhelyezés közben nyitva. */
function DecorSub({ roomId }: { roomId: string }) {
  const selected = useStore((s) => s.decor.some((d) => d.id === s.selectedDecor && d.roomId === roomId));
  const placing = useStore((s) => !!s.placing);
  const n = useStore((s) => s.decor.filter((d) => d.roomId === roomId).length);
  return (
    <Sub key={selected || placing ? 'open' : 'auto'} title="Dekor és akusztikus panel" open={selected || placing} hint={n ? `${n} elem` : 'nincs'}>
      <DecorPanel roomId={roomId} />
    </Sub>
  );
}

/** Alaphelyzet: kétlépéses megerősítés, mert a saját változatok is elvesznek. */
/** Saját vélemény (kedvenc, megjegyzés) az aktív változathoz, név szerint; a többiek visszajelzései alatta. */
function Feedback() {
  const s = useStore();
  const v = s.variants.find((x) => x.id === s.activeId) ?? s.variants[0];
  const me = s.viewerName.trim() || 'én';
  const mine = v.feedback?.[me];
  const others = Object.entries(v.feedback ?? {}).filter(([who]) => who !== me);
  return (
    <div className="feedback">
      <div className="row">
        <input className="name-input" placeholder="A neved (a véleményekhez)" value={s.viewerName} onChange={(e) => s.setViewer({ viewerName: e.target.value })} />
        <button className={mine?.fav ? 'on' : ''} onClick={() => s.setFeedback(v.id, { fav: !mine?.fav })} title="Kedvenc">
          {mine?.fav ? '★ kedvenc' : '☆ kedvenc'}
        </button>
      </div>
      <textarea placeholder="Megjegyzés ehhez a változathoz (pl. „a háló túl sötét”)" value={mine?.note ?? ''} rows={2} onChange={(e) => s.setFeedback(v.id, { note: e.target.value })} />
      {others.length > 0 && (
        <ul className="others">
          {others.map(([who, f]) => (
            <li key={who}>
              <b>{who}</b>
              {f.fav ? ' ★' : ''}
              {f.note ? `: ${f.note}` : ''}
              {f.at ? <small> ({f.at})</small> : null}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

/** A teljes beállítás mentése JSON-fájlba és visszatöltése (pl. a család közti megosztáshoz). */
function ConfigIO() {
  const loadConfig = useStore((s) => s.loadConfig);
  const input = useRef<HTMLInputElement>(null);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const save = () => {
    const cfg = configSnapshot();
    const day = cfg.savedAt.slice(0, 10);
    download(`lakas-3d-konfig-${day}.json`, new Blob([JSON.stringify(cfg, null, 2)], { type: 'application/json' }));
    setMsg({ ok: true, text: `Mentve (${day}): ${cfg.state.variants.length} változat, ${cfg.state.lightPlans.length} világítási terv és minden beállítás.` });
  };
  const mergeFeedback = useStore((s) => s.mergeFeedback);
  const fbInput = useRef<HTMLInputElement>(null);
  const merge = async (f: File) => {
    try {
      setMsg({ ok: true, text: `${f.name}: ${mergeFeedback(JSON.parse(await f.text()))}` });
    } catch {
      setMsg({ ok: false, text: 'A fájl nem olvasható JSON.' });
    }
  };
  const load = async (f: File) => {
    try {
      const err = loadConfig(JSON.parse(await f.text()));
      setMsg(err ? { ok: false, text: err } : { ok: true, text: `Betöltve: ${f.name}` });
    } catch {
      setMsg({ ok: false, text: 'A fájl nem olvasható JSON.' });
    }
  };
  return (
    <div className="reset">
      <div className="row">
        <button onClick={save} title="Az összes beállítás (változatok, világítás, fény, nézet, választások) JSON-fájlba">
          Konfiguráció mentése
        </button>
        <button onClick={() => input.current?.click()} title="Korábban mentett konfiguráció visszatöltése">
          Konfiguráció betöltése…
        </button>
        <input
          ref={input}
          type="file"
          accept="application/json,.json"
          hidden
          onChange={(e) => {
            if (e.target.files?.[0]) void load(e.target.files[0]);
            e.target.value = '';
          }}
        />
      </div>
      <button className="wide" onClick={() => fbInput.current?.click()} title="Egy családtag elküldött konfigurációjából csak a kedvencek, megjegyzések és az új változatok kerülnek át; a saját beállításaid maradnak">
        Visszajelzések átvétele fájlból…
      </button>
      <input
        ref={fbInput}
        type="file"
        accept="application/json,.json"
        hidden
        onChange={(e) => {
          if (e.target.files?.[0]) void merge(e.target.files[0]);
          e.target.value = '';
        }}
      />
      {msg && <p className={`note ${msg.ok ? '' : 'warn-text'}`}>{msg.text}</p>}
    </div>
  );
}

function ResetAll() {
  const [ask, setAsk] = useState(false);
  const resetAll = useStore((s) => s.resetAll);
  if (!ask)
    return (
      <div className="reset">
        <button className="wide" onClick={() => setAsk(true)}>
          Alaphelyzet…
        </button>
      </div>
    );
  return (
    <div className="reset confirm">
      <p>Minden beállítás (helyiség, nézet, fény, rétegek) és változat visszaáll a kezdetire; a saját változatok és módosítások elvesznek. Előtte az Export gombbal mentheted őket.</p>
      <div className="row">
        <button
          className="danger"
          onClick={() => {
            resetAll();
            setAsk(false);
          }}
        >
          Visszaállítás
        </button>
        <button onClick={() => setAsk(false)}>Mégse</button>
      </div>
    </div>
  );
}

const TABS: { id: SidebarTab; label: string; title: string }[] = [
  { id: 'view', label: 'Nézet', title: 'Nézőpontok, teljes lakás, bejárás, megjelenítés' },
  { id: 'variant', label: 'Javaslat', title: 'Szín- és anyagjavaslat, vélemény, illő bútorszínek' },
  { id: 'materials', label: 'Anyagok', title: 'Fal, mennyezet, padló, ajtó, függöny, bútor' },
  { id: 'light', label: 'Világítás', title: 'Világítási terv és fényjelenetek' },
  { id: 'more', label: 'Továbbiak', title: 'Nyitott lehetőségek, konfiguráció mentése, alaphelyzet' },
];

/** Aljavaslat a J-javaslaton belül (data/subVariants.ts): ugyanaz a szín- és anyagirány, más bútor és dekor. */
function SubSelect({ v }: { v: Variant }) {
  const s = useStore();
  const subs = subVariantsOf(v.id);
  if (!subs.length) return null;
  const sub = findSubVariant(s.activeSubId);
  return (
    <Field label="Aljavaslat (bútor és dekor, ugyanebben a színvilágban)">
      <select value={sub?.parent === v.id ? sub.id : ''} onChange={(e) => s.applySub(e.target.value || null)}>
        <option value="">– alapjavaslat (aljavaslat nélkül) –</option>
        {subs.map((x) => (
          <option key={x.id} value={x.id}>
            {x.name}
          </option>
        ))}
      </select>
      {sub?.parent === v.id ? (
        <p className="variant-note">{sub.note}</p>
      ) : (
        <p className="note">
          {subs.length} aljavaslat: a falak, a padló és a textilek maradnak, a bútorlehetőségek (kanapé, TV, asztal, tálaló, polcok, előszoba), a termékek és
          az előre elrendezett dekor cserélődik. A saját elhelyezésű dekor megmarad.
        </p>
      )}
    </Field>
  );
}

export function Sidebar() {
  const s = useStore();
  const localTex = useLocalTextureCount();
  const tab = s.sidebarTab;
  const room = getRoom(s.roomId);
  const active = useVariant(s.activeId);
  const fileInput = useRef<HTMLInputElement>(null);
  const plan = s.lightPlans.find((p) => p.id === s.activePlanId) ?? s.lightPlans[0];
  const lr = useMemo(() => computeLighting(room, s.light, roomLampLm(room, plan, s.light, s.lampsOff)), [room, s.light, plan, s.lampsOff]);
  // az ablakos fal(ak) tájolása, pl. „186° (D)”
  const windowFacing = useMemo(
    () =>
      [...new Set(room.openings.filter((o) => o.kind === 'window').map((o) => o.wall))]
        .map((w) => {
          const b = wallBearing(room, w);
          return `${Math.round(b)}° (${compassLabel(b)})`;
        })
        .join(', '),
    [room],
  );

  const exportVariants = () => download('lakas-3d-valtozatok.json', new Blob([JSON.stringify(s.variants, null, 2)], { type: 'application/json' }));
  const importVariants = async (f: File) => {
    try {
      const data = JSON.parse(await f.text());
      if (isConfigFile(data)) {
        const err = s.loadConfig(data);
        if (err) alert(err);
      } else if (Array.isArray(data) && data.length && data.every((v) => v.id && v.name && v.floor)) s.replaceVariants(data);
      else alert('A fájl nem változatlista és nem konfigurációs fájl.');
    } catch {
      alert('A fájl nem olvasható JSON.');
    }
  };

  return (
    <aside className="sidebar">
      <header>
        <div className="title-row">
          <h1>Lakás 3D</h1>
          <div className="row">
            <button onClick={() => s.setViewer({ helpSeen: false })} title="Rövid használati útmutató">
              Súgó
            </button>
          </div>
        </div>
        <Segmented
          value={s.details ? 'details' : 'simple'}
          options={[
            { v: 'simple', label: 'Egyszerű nézet' },
            { v: 'details', label: 'Részletes (tervezői)' },
          ]}
          onChange={(m) => s.setViewer({ details: m === 'details' })}
        />
        <div className="room-tabs">
          {ROOMS.map((r) => (
            <button key={r.id} className={r.id === s.roomId ? 'on' : ''} onClick={() => s.setRoom(r.id)}>
              {r.name}
            </button>
          ))}
        </div>
        <nav className="side-tabs">
          {TABS.map((t) => (
            <button key={t.id} className={tab === t.id ? 'on' : ''} onClick={() => s.setViewer({ sidebarTab: t.id })} title={t.title}>
              {t.label}
            </button>
          ))}
        </nav>
      </header>

      <div className="side-body">
      {tab === 'view' && (
        <>
      <Section title="Nézet">
        <Segmented value={s.viewMode} options={[{ v: 'single', label: 'Egy nézet' }, { v: 'split', label: 'Fényjelenet + termékhű' }]} onChange={s.setViewMode} />
        {s.viewMode === 'split' && <p className="note">Bal oldalt a Világítás fül fényjelenete, jobb oldalt a termékhű nézet (semleges stúdiófény) – ugyanaz a javaslat, közös kamerával.</p>}
        <Segmented
          value={s.whole ? 'whole' : 'room'}
          options={[
            { v: 'room', label: 'Egy helyiség' },
            { v: 'whole', label: 'Teljes lakás' },
          ]}
          onChange={(m) => s.setWhole(m === 'whole')}
        />
        <Toggle checked={s.layers.furniture} onChange={(b) => s.setLayer('furniture', b)} label="Bútorok (berendezési javaslat; lehetőségek: Anyagok → Bútor)" />
        <Toggle checked={s.layers.decor} onChange={(b) => s.setLayer('decor', b)} label="Dekorelemek (elhelyezés: Anyagok → Dekor)" />
        {s.whole && <p className="note">A kiválasztott helyiség a szerkesztett; a gombjai oda viszik a kamerát. A konyha, a fürdő, a WC, a tároló és az erkély nincs modellezve (szürke helyőrző).</p>}
        <div className="cam-buttons">
          {room.cameras.map((c, i) => (
            <button key={c.name} onClick={() => s.requestCamera(String(i))}>
              {c.name}
            </button>
          ))}
          <button onClick={() => s.requestCamera('overview')} disabled={s.walk}>
            Áttekintő
          </button>
          <button onClick={() => s.requestCamera('top')} disabled={s.walk}>
            Felülnézet
          </button>
        </div>
        <button className={`wide ${s.walk ? 'on' : ''}`} onClick={() => s.setWalk(!s.walk)} title="W A S D / nyilak: mozgás, egérhúzás: körbenézés, Shift: gyorsabban, Esc: kilépés">
          {s.walk ? 'Bejárás vége' : 'Bejárás (W A S D + egér)'}
        </button>
        <p className="note">Gyorsinfó: tartsd lenyomva az Alt billentyűt, és vidd az egeret egy elem fölé (I: rögzítés be/ki).</p>
        {s.viewMode === 'single' && (
          <Toggle checked={s.productView} onChange={(b) => s.setViewer({ productView: b })} label="Termékhű nézet (T): semleges stúdiófény – a szemből látott felület a katalógus színét mutatja" />
        )}
        {localTex > 0 && (
          <Toggle
            checked={s.photoTextures}
            onChange={(b) => s.setViewer({ photoTextures: b })}
            label={`Fotótextúrák (${localTex} termék: padló, ajtó, bútor a termékfotóból – csak ezen a gépen)`}
          />
        )}
        <Toggle checked={s.lowQuality} onChange={(b) => s.setViewer({ lowQuality: b })} label="Könnyített megjelenítés (gyengébb gépen: árnyék nélkül)" />
        <button
          className="wide"
          onClick={() => screenshot(`${room.id}_${active.name.replace(/[^\p{L}\p{N}]+/gu, '_')}_${s.viewMode === 'split' ? `${s.sceneId || 'egyedi'}_es_termekhu` : s.productView ? 'termekhu' : s.sceneId || 'egyedi'}.png`)}
        >
          Képernyőkép mentése
        </button>
      </Section>

      {s.details && (
      <Section title="Rétegek">
        <Toggle checked={s.layers.status} onChange={(b) => s.setLayer('status', b)} label="Adatbiztonság színezése" />
        {s.layers.status && (
          <div className="legend">
            {(Object.keys(STATUS_INFO) as Status[]).map((k) => (
              <span key={k}>
                <i style={{ background: STATUS_INFO[k].color }} />
                {k} {STATUS_INFO[k].label}
              </span>
            ))}
          </div>
        )}
        <Toggle checked={s.layers.zones} onChange={(b) => s.setLayer('zones', b)} label="Funkcionális zónák (ajtónyitás, radiátor)" />
        <Toggle checked={s.layers.dims} onChange={(b) => s.setLayer('dims', b)} label="Méretek" />
        <Toggle checked={s.layers.doorsOpen} onChange={(b) => s.setLayer('doorsOpen', b)} label="Ajtók nyitva" />
        <Toggle checked={s.layers.electrical} onChange={(b) => s.setLayer('electrical', b)} label="Villamosság (kapcsolók, dugaljak, kiállások)" />
        {s.layers.electrical && (
          <div className="legend">
            {ELEC_LEGEND.map(([label, color]) => (
              <span key={label}>
                <i style={{ background: color }} />
                {label}
              </span>
            ))}
          </div>
        )}
      </Section>
      )}
      {!s.details && (
        <div className="tab-pad">
          <Toggle checked={s.layers.doorsOpen} onChange={(b) => s.setLayer('doorsOpen', b)} label="Ajtók nyitva (bejáráshoz)" />
        </div>
      )}
        </>
      )}
      {tab === 'variant' && (
        <>
      <Section title="Változat (paletta)">
        <Field label="Aktív változat">
          <select value={s.activeId} onChange={(e) => s.setActive(e.target.value)}>
            <VariantOptions
              variants={s.variants}
              suffix={(v) => {
                const favs = Object.values(v.feedback ?? {}).filter((f) => f.fav).length;
                return favs ? `  ★${favs > 1 ? favs : ''}` : '';
              }}
            />
          </select>
        </Field>
        {s.details && <input className="name-input" value={active.name} onChange={(e) => s.updateVariant(active.id, (x) => ({ ...x, name: e.target.value }))} />}
        {active.note && <p className="variant-note">{active.note}</p>}
        <SubSelect v={active} />
        <Feedback />
        <div className="row">
          <button onClick={() => s.duplicateVariant(active.id)} title="Saját másolat a kísérletezéshez – a konfigurációval visszaküldhető">
            Másolat
          </button>
          <button onClick={() => s.deleteVariant(active.id)} disabled={s.variants.length <= 1}>
            Törlés
          </button>
          <button onClick={exportVariants}>Export</button>
          <button onClick={() => fileInput.current?.click()}>Import</button>
          <input ref={fileInput} type="file" accept="application/json" hidden onChange={(e) => e.target.files?.[0] && importVariants(e.target.files[0])} />
        </div>
      </Section>

      <Section title="Bútorok színvilága (javaslat)">
        <FurnitureFitPanel v={active} />
      </Section>

      <Section title="Bútorjavaslat ehhez a változathoz">
        <VariantFurniture v={active} />
      </Section>

      <Section title="Színellenőrzés (bútor és dekor)">
        <ColorClashes v={active} />
      </Section>

        </>
      )}
      {tab === 'materials' && (
        <div className="tab-pad">
          <p className="tab-title">
            Anyagok – <b>{active.name}</b>, {room.name.toLowerCase()}
          </p>
      <SurfaceEditor v={active} roomId={s.roomId} />

        </div>
      )}
      {tab === 'light' && (
        <>
      <Section title="Világítási terv">
        <LightPlanEditor roomId={s.roomId} />
      </Section>

      <Section title="Fény">
        {s.productView && s.viewMode === 'single' && (
          <p className="note warn-text">
            A termékhű nézet be van kapcsolva: a 3D nézetben semleges stúdiófény világít, ezek a beállítások ilyenkor nem látszanak.{' '}
            <button onClick={() => s.setViewer({ productView: false })}>Kikapcsolás (T)</button>
          </p>
        )}
        <div className="scene-buttons">
          {SCENES.map((sc) => (
            <button key={sc.id} className={sc.id === s.sceneId ? 'on' : ''} title={sc.hint} onClick={() => s.applyScene(sc.id)}>
              {sc.name}
            </button>
          ))}
        </div>
        {s.sceneId && <p className="note">{SCENES.find((x) => x.id === s.sceneId)?.hint}</p>}
        {s.details && (
          <>
        <Field label="Égbolt">
          <Segmented value={s.light.sky} options={[{ v: 'clear', label: 'derült' }, { v: 'overcast', label: 'borult' }]} onChange={(sky) => s.setLight((l) => ({ ...l, sky }))} />
        </Field>
        <Field label="Dátum és idő">
          <div className="row">
            <select value={s.light.month} onChange={(e) => s.setLight((l) => ({ ...l, month: Number(e.target.value), day: 15 }))}>
              {MONTHS.map((m, i) => (
                <option key={m} value={i + 1}>
                  {m} 15.
                </option>
              ))}
            </select>
          </div>
          <Slider value={s.light.hour} min={4} max={23.75} step={0.25} onChange={(hour) => s.setLight((l) => ({ ...l, hour }))} format={formatHour} />
          <p className="note">
            Nap: {lr.sunAlt.toFixed(0)}° magasan, {lr.sunAz.toFixed(0)}° azimut ({LOCATION.label}).{' '}
            {lr.sunAlt <= 0 ? 'A nap a horizont alatt van.' : lr.sunInFront ? 'A nap az ablak oldalán áll – direkt napfény bejuthat.' : 'A nap az épület másik oldalán – csak szórt égboltfény.'}
            {windowFacing && ` Az ablak ${windowFacing} felé néz.`}
            {lr.sunAlt > 0 && ` Átlagos megvilágítás nappal kb. ${Math.round(lr.eDay + lr.eSun)} lux${lr.eSun > 0 ? `, ebből besütő nap ${Math.round(lr.eSun)}` : ''}.`}
          </p>
        </Field>
        <LampControls label="Mennyezeti lámpák (függeszték, plafon, sín)" g={s.light.ceiling} onChange={(g) => s.setLight((l) => ({ ...l, ceiling: g }))} />
        <LampControls label="Kiegészítő lámpák (álló, fali, asztali)" g={s.light.accent} onChange={(g) => s.setLight((l) => ({ ...l, accent: g }))} />
        <p className="note">A lumen-csúszka a termék nélküli lámpákra vonatkozik; a termékeknél a saját fényáramuk számít. A színhőmérséklet a megadott K nélküli termékekre érvényes.</p>
        <Field label="Expozíció-korrekció">
          <Slider value={s.light.ev} min={-3} max={3} step={0.25} onChange={(ev) => s.setLight((l) => ({ ...l, ev }))} format={(v) => `${v > 0 ? '+' : ''}${v} EV`} />
        </Field>
          </>
        )}
      </Section>

        </>
      )}
      {tab === 'more' && (
        <>
      <Section title="Nyitott lehetőségek">
        <p className="note">Még eldöntetlen műszaki megoldások, a színváltozattól függetlenül kapcsolhatók.</p>
        {CHOICE_GROUPS.filter((g) => !g.furniture).map((g) => {
          const val = s.choices[g.id] ?? g.default;
          const opt = g.options.find((o) => o.id === val);
          return (
            <Field key={g.id} label={`${g.label} (${getRoom(g.roomId).name.toLowerCase()})`}>
              <Segmented value={val} options={g.options.map((o) => ({ v: o.id, label: o.label }))} onChange={(o) => s.setChoice(g.id, o)} />
              {opt?.note && <p className="note">{opt.note}</p>}
            </Field>
          );
        })}
      </Section>

      <ConfigIO />
      <ResetAll />
        </>
      )}
      </div>
    </aside>
  );
}
