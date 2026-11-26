import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { COLOR_NOTE, DOOR_COLORS, FABRICS, PAINTS, TILE_TONES, WOOD_TONES } from '../data/catalog';
import { getRoom } from '../data/rooms';
import { SCENES } from '../data/scenes';
import { compassLabel, computeLighting, formatHour } from '../lib/lighting';
import { wallBearing } from '../lib/geom';
import { roomFixtures, roomLampLm, FIXTURE_LABEL } from '../lib/fixtures';
import { LOCATION } from '../lib/sun';
import type { LampGroup, Variant, WallId } from '../model/types';
import { configSnapshot, isConfigFile, type SidebarTab, useStore, useVariant } from '../store';
import { Field, NavRow, Popover, RowGroup, Section, Segmented, Slider, Sub, SwatchPicker, Toggle } from './controls';
import { findCurtain, findDoor, findFloor, findPaint, WALL_PANELS } from '../data/products';
import { CurtainCatalog, DoorCatalog, FloorCatalog, PaintCatalog, ProductInfo, WallPanelCatalog } from './CatalogPicker';
import { FixtureEditor, LampRows, LightPlanPicker } from './LightPlanEditor';
import { FurnitureFitPanel } from './FurnitureFitPanel';
import { CHOICE_GROUPS } from '../data/choices';
import { ColorClashes, FurnishingPanel, FurnitureSlotEditor, hasFurnishing, VariantFurniture } from './FurnishingPanel';
import { findSubVariant, subVariantsOf } from '../data/subVariants';
import { VariantOptions } from './VariantOptions';
import { DecorPanel } from './DecorPanel';
import { useLocalTextureCount } from '../lib/localTextures';
import { download } from './files';

// Oldalsáv (2026-11-26-i átrendezés): fent a javaslat (választás, kedvenc, leírás és vélemények), alatta négy
// feladat szerinti fül – Felületek, Világítás, Berendezés, Továbbiak. A fülön tömör sorok állnak; egy sorra kattintva
// a szerkesztője (katalógussal) az oldalsávra úszik, a 3D nézet közben látszik. A nézet vezérlői az eszköztáron vannak
// (Toolbar.tsx), a tervezői mód és a megjelenítés minősége a Beállítások menüben.

/** A meglévő járólap (products/floors-existing.json) – a járólapos zóna kapcsolójának kiinduló burkolata. */
const EXISTING_TILE = 'meglevo-jarolap';

const MONTHS = ['jan.', 'febr.', 'márc.', 'ápr.', 'máj.', 'jún.', 'júl.', 'aug.', 'szept.', 'okt.', 'nov.', 'dec.'];

const TABS: { id: SidebarTab; label: string; title: string }[] = [
  { id: 'surfaces', label: 'Felületek', title: 'Fal, mennyezet, padló, járólap, ajtó, szegély, függöny' },
  { id: 'light', label: 'Világítás', title: 'Világítási terv, lámpák, fény finomhangolása' },
  { id: 'furnish', label: 'Berendezés', title: 'Bútorok, illő bútorszínek, dekor' },
  { id: 'more', label: 'Továbbiak', title: 'Nyitott lehetőségek, konfiguráció mentése, alaphelyzet' },
];

const HANDLE_LABEL = { steel: 'inox kilincs', black: 'fekete kilincs', brass: 'sárgaréz kilincs' } as const;
const SKIRTING_LABEL = { wall: 'falszínű', door: 'ajtószínű', white: 'fehér' } as const;
const PATTERN_LABEL = { plank: 'hajópadló', herringbone: 'halszálka', tile: 'lap' } as const;

/** A ráúszó szerkesztő: felület (`wall`, `floor`…), lámpa (`fixture:<id>`) vagy bútor-termékhely (`furn:<slot>`). */
type Drawer = { id: string; title: string } | null;

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

/** Módosító a változaton; `slot` a katalógustermék hozzárendelése egy felülethez (undefined = kézi szín, törlődik). */
function useVariantEdit(v: Variant) {
  const update = useStore((s) => s.updateVariant);
  const set = (fn: (x: Variant) => void) =>
    update(v.id, (x) => {
      fn(x);
      return x;
    });
  const slot = (x: Variant, key: string, id?: string) => {
    x.products = { ...(x.products ?? {}) };
    if (id) x.products[key] = id;
    else delete x.products[key];
  };
  return { set, slot };
}

const accentWallOf = (v: Variant, roomId: string) => (Object.keys(getRoom(roomId).walls) as WallId[]).find((w) => v.accents[`${roomId}.${w}`]);

/** Felületek fül: tömör sorok, lakásszintű és helyiségszintű csoportban. */
function SurfaceRows({ v, roomId, open }: { v: Variant; roomId: string; open: (id: string, title: string) => void }) {
  const room = getRoom(roomId);
  const accentWall = accentWallOf(v, roomId);
  const accentKey = `${roomId}.${accentWall}`;
  const paintName = (key: string, hex: string) => findPaint(v.products?.[key])?.name ?? hex;
  const floor = findFloor(v.products?.floor);
  const hall = findFloor(v.products?.hallFloor);
  const door = findDoor(v.products?.door);
  const curtain = findCurtain(v.products?.curtain);
  const panel = WALL_PANELS.find((p) => p.id === v.products?.[`accent:${accentKey}`]);
  return (
    <>
      <RowGroup title="Lakásszintű">
        <NavRow label="Fal" swatch={v.wall} value={`${paintName('wall', v.wall)}${v.wallFinish === 'selyem' ? ', selyemfényű' : ''}`} onClick={() => open('wall', 'Falszín (lakásszintű)')} />
        <NavRow label="Mennyezet" swatch={v.ceiling} value={paintName('ceiling', v.ceiling)} onClick={() => open('ceiling', 'Mennyezet')} />
        <NavRow
          label="Padló"
          swatch={v.floor.tone}
          value={floor ? (floor.existing ? `Meglévő ${floor.name.toLowerCase()}` : floor.name) : PATTERN_LABEL[v.floor.pattern]}
          onClick={() => open('floor', 'Padló')}
        />
        <NavRow
          label="Járólapos zóna"
          swatch={v.hallFloor?.tone}
          value={v.hallFloor ? (hall ? (hall.existing ? `Meglévő ${hall.name.toLowerCase()}` : hall.name) : 'külön lap') : v.floorAll === false ? 'járólap-helyőrző' : 'a padló folytatódik'}
          onClick={() => open('hall', 'Járólapos zóna')}
          title="Előszoba, közlekedő és a nappali dolgozó felőli sávja"
        />
        <NavRow
          label="Ajtók"
          swatch={v.door}
          value={`${door ? `${door.store}: ${door.name}` : v.door}, ${HANDLE_LABEL[v.handle ?? 'steel']}`}
          onClick={() => open('door', 'Ajtók, tokok, kilincs')}
        />
        <NavRow label="Szegélyléc" value={v.skirting.h ? `${v.skirting.h} mm, ${SKIRTING_LABEL[v.skirting.mode]}` : 'nincs'} onClick={() => open('skirting', 'Szegélyléc')} />
        <NavRow
          label="Függöny"
          swatch={v.curtain.on ? v.curtain.color : undefined}
          value={v.curtain.on ? `${curtain ? `${curtain.store}: ${curtain.name}` : v.curtain.color}${v.curtain.sheerLayer ? ' + fátyol' : ''}` : 'nincs'}
          onClick={() => open('curtain', 'Függöny')}
        />
      </RowGroup>
      <RowGroup title={room.name}>
        <NavRow
          label="Kiemelt fal"
          swatch={accentWall ? v.accents[accentKey] : undefined}
          value={accentWall ? `${room.walls[accentWall].name}: ${panel ? `${panel.brand} ${panel.name}` : paintName(`accent:${accentKey}`, v.accents[accentKey])}` : 'nincs'}
          onClick={() => open('accent', `Kiemelt fal – ${room.name.toLowerCase()}`)}
        />
      </RowGroup>
      <p className="note">{COLOR_NOTE}</p>
    </>
  );
}

/** Egy felület szerkesztője (a ráúszó panelben): kézi színek, katalógus (nyitva), a választott termék, beállítások. */
function SurfaceDrawer({ id, v, roomId }: { id: string; v: Variant; roomId: string }) {
  const { set, slot } = useVariantEdit(v);
  const room = getRoom(roomId);
  if (id === 'wall')
    return (
      <>
        <Segmented value={v.wallFinish} options={[{ v: 'matt', label: 'matt' }, { v: 'selyem', label: 'selyemfényű' }]} onChange={(f) => set((x) => void (x.wallFinish = f))} />
        <ProductInfo kind="paint" id={v.products?.wall} />
        <SwatchPicker value={v.wall} swatches={PAINTS} onChange={(hex) => set((x) => void ((x.wall = hex), slot(x, 'wall')))} />
        <PaintCatalog open selectedId={v.products?.wall} onPick={(p) => set((x) => void ((x.wall = p.hex), slot(x, 'wall', p.id)))} />
      </>
    );
  if (id === 'ceiling')
    return (
      <>
        <ProductInfo kind="paint" id={v.products?.ceiling} />
        <SwatchPicker value={v.ceiling} swatches={PAINTS.slice(0, 5)} onChange={(hex) => set((x) => void ((x.ceiling = hex), slot(x, 'ceiling')))} />
        <PaintCatalog open families={['warmWhite']} selectedId={v.products?.ceiling} onPick={(p) => set((x) => void ((x.ceiling = p.hex), slot(x, 'ceiling', p.id)))} />
      </>
    );
  if (id === 'accent') {
    const accentWall = accentWallOf(v, roomId);
    const k = `${roomId}.${accentWall}`;
    const accentSlot = `accent:${k}`;
    return (
      <>
        <Field label="Melyik fal">
          <select
            value={accentWall ?? ''}
            onChange={(e) =>
              set((x) => {
                for (const w of Object.keys(room.walls)) {
                  delete x.accents[`${roomId}.${w}`];
                  slot(x, `accent:${roomId}.${w}`);
                  x.accentWood = x.accentWood?.filter((kk) => kk !== `${roomId}.${w}`);
                }
                if (e.target.value) x.accents[`${roomId}.${e.target.value}`] = PAINTS[11].hex;
              })
            }
          >
            <option value="">nincs kiemelt fal</option>
            {(Object.keys(room.walls) as WallId[]).map((w) => (
              <option key={w} value={w}>
                {room.walls[w].name}
              </option>
            ))}
          </select>
        </Field>
        {accentWall && (
          <>
            <Toggle
              checked={!!v.accentWood?.includes(k)}
              onChange={(b) =>
                set((x) => {
                  x.accentWood = (x.accentWood ?? []).filter((w) => w !== k);
                  if (b) x.accentWood.push(k);
                })
              }
              label="Fa falpanel (függőleges lapok)"
            />
            <ProductInfo kind="paint" id={v.products?.[accentSlot]} />
            <SwatchPicker value={v.accents[k]} swatches={PAINTS} onChange={(hex) => set((x) => void ((x.accents[k] = hex), slot(x, accentSlot)))} />
            <PaintCatalog open selectedId={v.products?.[accentSlot]} onPick={(p) => set((x) => void ((x.accents[k] = p.hex), slot(x, accentSlot, p.id)))} />
            <WallPanelCatalog
              selectedId={v.products?.[accentSlot]}
              onPick={(p) =>
                set((x) => {
                  x.accents[k] = p.hex;
                  x.accentWood = [...(x.accentWood ?? []).filter((w) => w !== k), k];
                  slot(x, accentSlot, p.id);
                })
              }
            />
          </>
        )}
      </>
    );
  }
  if (id === 'floor')
    return (
      <>
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
        {v.floor.pattern !== 'tile' && (
          <Segmented value={v.floor.dir} options={[{ v: 'z', label: 'ablak felé fut' }, { v: 'x', label: 'keresztben' }]} onChange={(d) => set((x) => void (x.floor.dir = d))} />
        )}
        <ProductInfo kind="floor" id={v.products?.floor} />
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
          open
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
      </>
    );
  if (id === 'hall') {
    const zoneNote = getRoom('nappali').floorZone?.note;
    return (
      <>
        <p className="note">Az előszoba, a közlekedő és a nappali dolgozó felőli sávja. Kikapcsolva a lakás padlója folytatódik.</p>
        <Toggle
          checked={!!v.hallFloor}
          onChange={(b) =>
            set((x) => {
              if (b) {
                const t = findFloor(EXISTING_TILE)!;
                x.hallFloor = { pattern: t.pattern, tone: t.hex, ...(t.size ? { plank: { l: t.size.l, w: t.size.w } } : {}) };
                slot(x, 'hallFloor', t.id);
              } else {
                delete x.hallFloor;
                slot(x, 'hallFloor');
              }
            })
          }
          label="Külön burkolat a járólapos zónában"
        />
        {v.hallFloor ? (
          <>
            <ProductInfo kind="floor" id={v.products?.hallFloor} />
            <FloorCatalog
              open
              tiles
              selectedId={v.products?.hallFloor}
              onPick={(f) =>
                set((x) => {
                  x.hallFloor = { pattern: f.pattern, tone: f.hex, ...(f.size ? { plank: { l: f.size.l, w: f.size.w } } : {}) };
                  slot(x, 'hallFloor', f.id);
                })
              }
            />
            {zoneNote && <p className="note">{zoneNote}</p>}
          </>
        ) : (
          <>
            <Toggle
              checked={v.floorAll === false}
              onChange={(b) => set((x) => void (x.floorAll = !b))}
              label="Járólap-helyőrző az előszobában és a közlekedőben"
              hint="Termék nélküli, általános járólap a régi modell szerint"
            />
            {v.floorAll === false && <p className="note">{getRoom('eloszoba').floor?.note}</p>}
          </>
        )}
      </>
    );
  }
  if (id === 'door')
    return (
      <>
        <Segmented
          value={v.handle ?? 'steel'}
          options={[
            { v: 'steel', label: 'inox kilincs' },
            { v: 'black', label: 'fekete' },
            { v: 'brass', label: 'sárgaréz' },
          ]}
          onChange={(h) => set((x) => void (x.handle = h))}
        />
        <Segmented
          value={v.doorStyle ?? 'flat'}
          options={[
            { v: 'flat', label: 'sima' },
            { v: 'groove', label: 'marással' },
            { v: 'glass', label: 'üvegbetétes' },
          ]}
          onChange={(st) => set((x) => void ((x.doorStyle = st), slot(x, 'door')))}
        />
        <Toggle checked={v.doorLeafOptional} onChange={(b) => set((x) => void (x.doorLeafOptional = b))} label="Opcionális új ajtólapok (pl. dolgozó)" />
        <ProductInfo kind="door" id={v.products?.door} />
        <SwatchPicker value={v.door} swatches={DOOR_COLORS} onChange={(hex) => set((x) => void ((x.door = hex), slot(x, 'door')))} />
        <DoorCatalog open selectedId={v.products?.door} onPick={(d) => set((x) => void ((x.door = d.hex), (x.doorStyle = d.style), slot(x, 'door', d.id)))} />
      </>
    );
  if (id === 'skirting')
    return (
      <>
        <Field label="Magasság">
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
        </Field>
        <Field label="Szín">
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
      </>
    );
  if (id === 'curtain')
    return (
      <>
        <Toggle checked={v.curtain.on} onChange={(b) => set((x) => void (x.curtain.on = b))} label="Van függöny" />
        {v.curtain.on && (
          <>
            <Field label="Méret és állapot">
              <Segmented
                value={v.curtain.span}
                options={[
                  { v: 'wall', label: 'falszéles' },
                  { v: 'clear', label: 'radiátorig' },
                  { v: 'window', label: 'ablak + 25 cm' },
                ]}
                onChange={(sp) => set((x) => void (x.curtain.span = sp))}
              />
              <Segmented value={v.curtain.length} options={[{ v: 'floor', label: 'padlóig' }, { v: 'sill', label: 'párkányig' }]} onChange={(l) => set((x) => void (x.curtain.length = l))} />
              <Segmented value={v.curtain.closed ? 'closed' : 'open'} options={[{ v: 'open', label: 'nyitva' }, { v: 'closed', label: 'behúzva' }]} onChange={(c) => set((x) => void (x.curtain.closed = c === 'closed'))} />
            </Field>
            <Field label="Függöny">
              <Segmented
                value={v.curtain.sheer ? 'sheer' : 'solid'}
                options={[
                  { v: 'solid', label: 'vastag / sötétítő' },
                  { v: 'sheer', label: 'áttetsző' },
                ]}
                onChange={(t) => set((x) => void ((x.curtain.sheer = t === 'sheer'), slot(x, 'curtain')))}
              />
              <ProductInfo kind="curtain" id={v.products?.curtain} />
              <SwatchPicker value={v.curtain.color} swatches={FABRICS} onChange={(hex) => set((x) => void ((x.curtain.color = hex), slot(x, 'curtain')))} />
              <CurtainCatalog open sheer={v.curtain.sheer} selectedId={v.products?.curtain} onPick={(c) => set((x) => void ((x.curtain.color = c.hex), slot(x, 'curtain', c.id)))} />
            </Field>
            {!v.curtain.sheer && (
              <Field label="Fátyol mögötte">
                <Toggle
                  checked={!!v.curtain.sheerLayer}
                  onChange={(b) => set((x) => void ((x.curtain.sheerLayer = b ? '#F4F1EA' : undefined), slot(x, 'sheer')))}
                  label="Áttetsző réteg (kétsoros sín)"
                />
                {v.curtain.sheerLayer && (
                  <>
                    <ProductInfo kind="curtain" id={v.products?.sheer} />
                    <CurtainCatalog sheer selectedId={v.products?.sheer} onPick={(c) => set((x) => void ((x.curtain.sheerLayer = c.hex), slot(x, 'sheer', c.id)))} />
                  </>
                )}
              </Field>
            )}
          </>
        )}
      </>
    );
  return null;
}

/** Helyiséghez kötött bútorbeállítások a Berendezés fülön: lehetőségek, termékhelyek, gardróbfront, ágytextil. */
function RoomFurnishing({ v, roomId, open }: { v: Variant; roomId: string; open: (id: string, title: string) => void }) {
  const room = getRoom(roomId);
  const { set } = useVariantEdit(v);
  if (!room.wardrobe && room.beds.length === 0 && !hasFurnishing(roomId)) return <p className="note">Ebben a helyiségben nincs berendezési javaslat.</p>;
  return (
    <>
      {hasFurnishing(roomId) && <FurnishingPanel v={v} roomId={roomId} roomName={room.name} onOpenSlot={(slot, label) => open(`furn:${slot}`, label)} />}
      {(room.wardrobe || room.beds.length > 0) && (
        <RowGroup title={room.name}>
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
            <Field label="Ágytakaró színe">
              <SwatchPicker value={v.textile} swatches={FABRICS} onChange={(hex) => set((x) => void (x.textile = hex))} />
            </Field>
          )}
        </RowGroup>
      )}
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

/** Saját vélemény (név, megjegyzés) az aktív változathoz; a többiek visszajelzései alatta. A kedvenc a fejlécben. */
function Feedback({ v }: { v: Variant }) {
  const s = useStore();
  const me = s.viewerName.trim() || 'én';
  const mine = v.feedback?.[me];
  const others = Object.entries(v.feedback ?? {}).filter(([who]) => who !== me);
  return (
    <div className="feedback">
      <input className="name-input" placeholder="A neved (a véleményekhez)" value={s.viewerName} onChange={(e) => s.setViewer({ viewerName: e.target.value })} />
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
    <>
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
    </>
  );
}

/** Alaphelyzet: kétlépéses megerősítés, mert a saját változatok is elvesznek. */
function ResetAll() {
  const [ask, setAsk] = useState(false);
  const resetAll = useStore((s) => s.resetAll);
  if (!ask)
    return (
      <button className="wide" onClick={() => setAsk(true)}>
        Alaphelyzet…
      </button>
    );
  return (
    <div className="confirm">
      <p>Minden beállítás (helyiség, nézet, fény, rétegek) és változat visszaáll a kezdetire; a saját változatok és módosítások elvesznek. Előtte a Konfiguráció mentése gombbal mentheted őket.</p>
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

/** Változatlista exportja és importja (változatlista vagy teljes konfigurációs fájl). */
function useVariantFiles() {
  const s = useStore();
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
  return { exportVariants, importVariants };
}

/** A fejléc javaslatblokkja: választó, kedvenc, másolat, további műveletek, aljavaslat, leírás és vélemények. */
function VariantHeader({ v }: { v: Variant }) {
  const s = useStore();
  const fileInput = useRef<HTMLInputElement>(null);
  const { exportVariants, importVariants } = useVariantFiles();
  const me = s.viewerName.trim() || 'én';
  const fav = !!v.feedback?.[me]?.fav;
  const subs = subVariantsOf(v.id);
  const sub = findSubVariant(s.activeSubId);
  const activeSub = sub?.parent === v.id ? sub : undefined;
  const others = Object.entries(v.feedback ?? {}).filter(([who, f]) => who !== me && (f.fav || f.note)).length;
  return (
    <div className="variant-head">
      <select value={s.activeId} onChange={(e) => s.setActive(e.target.value)} title="Aktív javaslat (szín- és anyagirány)">
        <VariantOptions
          variants={s.variants}
          suffix={(x) => {
            const favs = Object.values(x.feedback ?? {}).filter((f) => f.fav).length;
            return favs ? `  ★${favs > 1 ? favs : ''}` : '';
          }}
        />
      </select>
      {subs.length > 0 && (
        <select value={activeSub?.id ?? ''} onChange={(e) => s.applySub(e.target.value || null)} title="Aljavaslat: ugyanaz a szín- és anyagirány, más bútor és dekor">
          <option value="">Aljavaslat: nincs (alapjavaslat)</option>
          {subs.map((x) => (
            <option key={x.id} value={x.id}>
              Aljavaslat: {x.name}
            </option>
          ))}
        </select>
      )}
      <div className="row">
        <button className={fav ? 'on' : ''} onClick={() => s.setFeedback(v.id, { fav: !fav })} title="Kedvenc (a neveddel együtt mentődik)">
          {fav ? '★ Kedvenc' : '☆ Kedvenc'}
        </button>
        <button onClick={() => s.duplicateVariant(v.id)} title="Saját másolat a kísérletezéshez – a konfigurációval visszaküldhető">
          Másolat
        </button>
        <Popover label="Műveletek ▾" title="Átnevezés, törlés, export, import">
          <Field label="Név">
            <input className="name-input" value={v.name} onChange={(e) => s.updateVariant(v.id, (x) => ({ ...x, name: e.target.value }))} />
          </Field>
          <div className="row">
            <button onClick={() => s.deleteVariant(v.id)} disabled={s.variants.length <= 1}>
              Változat törlése
            </button>
            <button onClick={exportVariants} title="Az összes változat JSON-fájlba">
              Export
            </button>
            <button onClick={() => fileInput.current?.click()} title="Változatlista vagy konfigurációs fájl betöltése">
              Import…
            </button>
          </div>
          <input ref={fileInput} type="file" accept="application/json" hidden onChange={(e) => e.target.files?.[0] && importVariants(e.target.files[0])} />
        </Popover>
      </div>
      <details className="more-text">
        <summary>
          Leírás és vélemények{others ? ` (${others})` : ''}
        </summary>
        {v.note && <p className="variant-note">{v.note}</p>}
        {activeSub ? (
          <p className="variant-note">
            <b>{activeSub.name}:</b> {activeSub.note}
          </p>
        ) : (
          subs.length > 0 && (
            <p className="note">
              {subs.length} aljavaslat: a falak, a padló és a textilek maradnak, a bútorlehetőségek, a termékek és az előre elrendezett dekor cserélődik. A saját
              elhelyezésű dekor megmarad.
            </p>
          )
        )}
        <Feedback v={v} />
      </details>
    </div>
  );
}

/** Beállítások menü: tervezői mód, fotótextúrák, könnyített megjelenítés. */
function SettingsMenu() {
  const s = useStore();
  const localTex = useLocalTextureCount();
  return (
    <Popover label="Beállítások ▾" align="right" title="Tervezői mód, téma, megjelenítés">
      <Field label="Téma">
        <Segmented
          value={s.theme}
          options={[
            { v: 'system', label: 'rendszer' },
            { v: 'light', label: 'világos' },
            { v: 'dark', label: 'sötét' },
          ]}
          onChange={(t) => s.setViewer({ theme: t })}
        />
      </Field>
      <Toggle
        checked={s.details}
        onChange={(b) => s.setViewer({ details: b })}
        label="Tervezői mód"
        hint="Adatbiztonság, méretek, villamosság, ellenőrzések és források, lámpák helye, fény finomhangolása"
      />
      {localTex > 0 && (
        <Toggle
          checked={s.photoTextures}
          onChange={(b) => s.setViewer({ photoTextures: b })}
          label="Fotótextúrák"
          hint={`${localTex} termék (padló, ajtó, bútor) a termékfotóból – csak ezen a gépen`}
        />
      )}
      <Toggle checked={s.lowQuality} onChange={(b) => s.setViewer({ lowQuality: b })} label="Könnyített megjelenítés" hint="Gyengébb gépen: árnyék nélkül" />
    </Popover>
  );
}

/** A ráúszó szerkesztő kerete: vissza gomb, cím, tartalom. */
function DrawerFrame({ title, sub, onBack, children }: { title: string; sub?: string; onBack: () => void; children: ReactNode }) {
  return (
    <div className="drawer">
      <div className="drawer-head">
        <button onClick={onBack} title="Vissza a listához (Esc)">
          ‹ Vissza
        </button>
        <b>{title}</b>
        {sub && <span>{sub}</span>}
      </div>
      <div className="drawer-body">{children}</div>
    </div>
  );
}

export function Sidebar() {
  const s = useStore();
  const tab: SidebarTab = TABS.some((t) => t.id === s.sidebarTab) ? s.sidebarTab : 'surfaces';
  const room = getRoom(s.roomId);
  const active = useVariant(s.activeId);
  const [drawer, setDrawer] = useState<Drawer>(null);
  const open = (id: string, title: string) => setDrawer({ id, title });
  const plan = s.lightPlans.find((p) => p.id === s.activePlanId) ?? s.lightPlans[0];
  const lr = useMemo(() => computeLighting(room, s.light, roomLampLm(room, plan, s.light, s.lampsOff)), [room, s.light, plan, s.lampsOff]);
  const scene = SCENES.find((x) => x.id === s.sceneId);
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

  // helyiségváltáskor a helyiséghez kötött szerkesztő (lámpa, bútor-termékhely) bezárul; Esc: vissza a listához
  useEffect(() => setDrawer((d) => (d && (d.id.startsWith('fixture:') || d.id.startsWith('furn:')) ? null : d)), [s.roomId]);
  // fülváltáskor (pl. dekorra kattintva a 3D nézetben) a szerkesztő bezárul
  useEffect(() => setDrawer(null), [tab]);
  useEffect(() => {
    if (!drawer) return;
    const esc = (e: KeyboardEvent) => {
      const t = e.target as HTMLElement;
      if (e.key === 'Escape' && !s.placing && !s.walk && t.tagName !== 'INPUT' && t.tagName !== 'SELECT' && t.tagName !== 'TEXTAREA') setDrawer(null);
    };
    window.addEventListener('keydown', esc);
    return () => window.removeEventListener('keydown', esc);
  }, [drawer, s.placing, s.walk]);

  const drawerBody = () => {
    if (!drawer) return null;
    if (drawer.id.startsWith('fixture:')) return <FixtureEditor roomId={s.roomId} fixtureId={drawer.id.slice(8)} onDone={() => setDrawer(null)} />;
    if (drawer.id.startsWith('furn:')) return <FurnitureSlotEditor v={active} roomId={s.roomId} slot={drawer.id.slice(5)} />;
    return <SurfaceDrawer id={drawer.id} v={active} roomId={s.roomId} />;
  };
  const drawerSub = drawer && (drawer.id.startsWith('fixture:') || drawer.id.startsWith('furn:') || drawer.id === 'accent') ? room.name : active.name.split(' – ')[0];
  const fixtureTitle = (id: string) => {
    const f = roomFixtures(plan, room).find((x) => x.id === id);
    return f ? (f.label ?? FIXTURE_LABEL[f.type]) : 'Lámpa';
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
            <SettingsMenu />
          </div>
        </div>
        <VariantHeader v={active} />
        <nav className="side-tabs">
          {TABS.map((t) => (
            <button
              key={t.id}
              className={tab === t.id ? 'on' : ''}
              onClick={() => {
                setDrawer(null);
                s.setViewer({ sidebarTab: t.id });
              }}
              title={t.title}
            >
              {t.label}
            </button>
          ))}
        </nav>
      </header>

      <div className="side-body">
        {drawer ? (
          <DrawerFrame title={drawer.id.startsWith('fixture:') ? fixtureTitle(drawer.id.slice(8)) : drawer.title} sub={drawerSub} onBack={() => setDrawer(null)}>
            {drawerBody()}
          </DrawerFrame>
        ) : (
          <>
            {tab === 'surfaces' && (
              <div className="tab-pad">
                <SurfaceRows v={active} roomId={s.roomId} open={open} />
              </div>
            )}

            {tab === 'light' && (
              <div className="tab-pad">
                {s.productView && s.viewMode === 'single' && (
                  <p className="note warn-text">
                    Termékhű nézet: a 3D nézetben semleges stúdiófény világít, a fénybeállítások most nem látszanak.{' '}
                    <button onClick={() => s.setViewer({ productView: false })}>Kikapcsolás (T)</button>
                  </p>
                )}
                <LightPlanPicker />
                <RowGroup title={`Lámpák – ${room.name}`}>
                  <LampRows roomId={s.roomId} onOpen={(fid) => open(`fixture:${fid}`, 'Lámpa')} />
                </RowGroup>
                <RowGroup title="Fény">
                  <p className="note">
                    {scene ? (
                      <>
                        <b>{scene.name}</b> – {scene.hint}
                      </>
                    ) : (
                      'Egyéni fénybeállítás.'
                    )}{' '}
                    A fényjelenet az eszköztáron váltható (a 3D nézet fölött).
                  </p>
                  {s.details ? (
                    <details className="more-text">
                      <summary>Fény finomhangolása</summary>
                      <Field label="Égbolt">
                        <Segmented value={s.light.sky} options={[{ v: 'clear', label: 'derült' }, { v: 'overcast', label: 'borult' }]} onChange={(sky) => s.setLight((l) => ({ ...l, sky }))} />
                      </Field>
                      <Field label="Dátum és idő">
                        <select value={s.light.month} onChange={(e) => s.setLight((l) => ({ ...l, month: Number(e.target.value), day: 15 }))}>
                          {MONTHS.map((m, i) => (
                            <option key={m} value={i + 1}>
                              {m} 15.
                            </option>
                          ))}
                        </select>
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
                    </details>
                  ) : (
                    <p className="note">Égbolt, időpont, lámpacsoportok és expozíció: tervezői módban (Beállítások).</p>
                  )}
                </RowGroup>
              </div>
            )}

            {tab === 'furnish' && (
              <div className="tab-pad">
                <RoomFurnishing v={active} roomId={s.roomId} open={open} />
                <Sub title="A változathoz illő bútorok" hint="◆ termékek, minden helyiségben">
                  <VariantFurniture v={active} />
                </Sub>
                <Sub title="Illő bútorszínek" hint="kanapé, bútortest, fém">
                  <FurnitureFitPanel v={active} />
                </Sub>
                <Sub title="Színellenőrzés" hint="bútor és dekor">
                  <ColorClashes v={active} />
                </Sub>
                <DecorSub roomId={s.roomId} />
              </div>
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
                <Section title="Mentés és megosztás">
                  <ConfigIO />
                </Section>
                <Section title="Alaphelyzet">
                  <ResetAll />
                </Section>
              </>
            )}
          </>
        )}
      </div>
    </aside>
  );
}
