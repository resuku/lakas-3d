import { CURTAIN_TYPE_LABEL, DOOR_STYLE_LABEL, findCurtain, findDoor, findFloor, findPaint } from '../data/products';
import type { Fixture, LightSettings, Opening, Room, Val, Variant } from '../model/types';
import { FIXTURE_LABEL, findLamp, fixtureSpec } from './fixtures';
import { STATUS_INFO } from './status';

// Gyorsinfó (Alt): rövid leírás az egér alatti elemről. A 3D objektumok `userData.inspect` mezőjében.

export interface InspectInfo {
  title: string;
  lines: string[];
}

export const info = (title: string, ...lines: (string | false | undefined)[]) => ({ inspect: { title, lines: lines.filter(Boolean) as string[] } });

const priceOf = (p?: string) => (p ? p.split(' (')[0] : '');
const val = (v: Val) => `${v.v} mm (${v.s} – ${STATUS_INFO[v.s].label.toLowerCase()})`;

export function paintLine(hex: string, pid?: string) {
  const p = findPaint(pid);
  if (!p) return `${hex} – kézi szín, nincs hozzárendelt termék`;
  return `${p.brand} ${p.line} – ${p.name}${p.code && p.code !== p.name ? ` (${p.code})` : ''} · ${hex}${p.price ? ` · ${priceOf(p.price)}` : ''}`;
}

export function wallInfo(room: Room, wallId: string, v: Variant) {
  const key = `${room.id}.${wallId}`;
  const accent = v.accents[key];
  const wood = v.accentWood?.includes(key);
  return info(
    `${room.name} – ${room.walls[wallId as keyof Room['walls']].name}`,
    accent ? `Kiemelt fal${wood ? ' (fa falpanel)' : ''}: ${paintLine(accent, v.products?.[`accent:${key}`])}` : `Falszín: ${paintLine(v.wall, v.products?.wall)}`,
    `Felület: ${v.wallFinish === 'matt' ? 'matt' : 'selyemfényű'}`,
  );
}

export function floorInfo(room: Room, v: Variant) {
  if (room.floor && v.floorAll === false) return info(`${room.name} – padló`, 'Eltérő burkolat: járólap', room.floor.note);
  const f = findFloor(v.products?.floor);
  const pattern = v.floor.pattern === 'herringbone' ? 'halszálka' : v.floor.pattern === 'tile' ? 'lap' : 'hajópadló';
  return info(
    `${room.name} – padló`,
    f ? `${f.store}: ${f.manufacturer} ${f.name}${f.decor ? ` (${f.decor})` : ''}` : `${v.floor.tone} – kézi szín, nincs hozzárendelt termék`,
    f?.size && `${f.size.l} × ${f.size.w} mm · ${f.type}${f.wear ? ` · ${f.wear}` : ''}`,
    `Minta: ${pattern}${f?.price ? ` · ${priceOf(f.price)}` : ''}`,
  );
}

export const ceilingInfo = (room: Room, v: Variant) => info(`${room.name} – mennyezet`, paintLine(v.ceiling, v.products?.ceiling));

export function doorInfo(room: Room, o: Opening, v: Variant, showLeaf: boolean) {
  const size = `${o.width.v} × ${o.height.v} mm nyílás`;
  if (o.leaf?.fixed) return info(`${room.name} – ${o.label}`, size, o.leaf.fixed.note ?? 'Nem része az ajtócserének.');
  const d = findDoor(v.products?.door);
  return info(
    `${room.name} – ${o.label}`,
    size,
    !showLeaf
      ? 'Ajtólap nélkül (tok)'
      : d
        ? `${d.store}: ${d.line} – ${d.name}${d.decor ? ` (${d.decor})` : ''} · ${DOOR_STYLE_LABEL[d.style]}${d.price ? ` · ${priceOf(d.price)}` : ''}`
        : `${v.door} – kézi szín, ${DOOR_STYLE_LABEL[v.doorStyle ?? 'flat']}`,
    showLeaf && `Kilincs: ${{ steel: 'inox', black: 'fekete', brass: 'sárgaréz' }[v.handle ?? 'steel']}`,
    o.note,
  );
}

export const windowInfo = (room: Room, o: Opening) =>
  info(`${room.name} – ${o.label}`, `Szélesség ${val(o.width)}`, `Magasság ${val(o.height)}`, o.bottom.v > 0 && `Parapet ${val(o.bottom)}`);

export function curtainInfo(room: Room, v: Variant) {
  const c = findCurtain(v.products?.curtain);
  const s = findCurtain(v.products?.sheer);
  return info(
    `${room.name} – függöny`,
    c ? `${c.store}: ${c.name}, ${c.colorName} · ${CURTAIN_TYPE_LABEL[c.type]}${c.price ? ` · ${priceOf(c.price)}` : ''}` : `${v.curtain.color} – kézi szín (${v.curtain.sheer ? 'áttetsző' : 'vastag'})`,
    v.curtain.sheerLayer && (s ? `Áttetsző réteg: ${s.store}: ${s.name}, ${s.colorName}` : `Áttetsző réteg: ${v.curtain.sheerLayer}`),
    `${{ wall: 'Falszéles', clear: 'Falszéles, a radiátorig / klímáig', window: 'Ablak + 25 cm' }[v.curtain.span]}, ${v.curtain.length === 'floor' ? 'padlóig' : 'párkányig'}`,
  );
}

export function lampInfo(room: Room, f: Fixture, ls: LightSettings, off: boolean) {
  const p = findLamp(f.productId);
  const spec = fixtureSpec(f, ls);
  return info(
    `${room.name} – ${f.label ?? FIXTURE_LABEL[f.type]}`,
    p ? `${p.store}: ${p.brand ? `${p.brand} ` : ''}${p.name}${p.price ? ` · ${priceOf(p.price)}` : ''}` : `Általános ${FIXTURE_LABEL[f.type]} (termék nélkül)`,
    `${Math.round(spec.lm)} lm${spec.K ? ` · ${spec.K} K` : ''} · ${off ? 'lekapcsolva' : 'bekapcsolva'} (kattintás: ki/be)`,
  );
}
