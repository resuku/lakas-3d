import { findCurtain, findDoor, findFloor, findPaint } from '../data/products';
import { ROOMS } from '../data/rooms';
import type { LightPlan, Room, Variant } from '../model/types';
import { curtainLayouts } from './curtain';
import { FIXTURE_LABEL, findLamp, roomFixtures } from './fixtures';
import { mm, roomDims, WALL_IDS, wallFrames } from './geom';

// Bevásárlólista: az aktív változat és világítási terv termékei becsült mennyiséggel és összeggel.
// Becslés tervezéshez – rendelés előtt helyszíni felmérés és a gyártói kiadósság a mérvadó.

export interface ShoppingRow {
  category: string;
  place: string;
  product: string;
  store: string;
  spec: string;
  qty: string;
  unitPrice: string;
  /** Becsült összeg (Ft), ha az ár és az egység kiolvasható. */
  total?: number;
  note: string;
  url: string;
}

/** Festék: 2 réteg, 12 m²/l (óvatos kiadósság); padló: 10 % ráhagyás; függöny: kétszeres ráncolás. */
export const ASSUME = { coats: 2, m2PerLitre: 12, floorWaste: 1.1, fullness: 2 };

const priceNum = (p?: string) => {
  const m = p?.match(/^([\d\s]+)\s*Ft/);
  return m ? Number(m[1].replace(/\s/g, '')) : undefined;
};
const priceText = (p?: string) => (p ? p.split(' (')[0] : '');
const ft = (n: number) => `${Math.round(n).toLocaleString('hu-HU')} Ft`;
/** Tizedesvesszős szám (a kiszerelésnél egész liter, ha az). */
const dec = (n: number, digits = 1) => (digits === 0 && !Number.isInteger(n) ? n.toFixed(1) : n.toFixed(digits)).replace('.', ',');

/** Falfelület helyiségenként (m², nyílások nélkül), a teljes falat takaró gardrób mögötti fal nélkül. */
function wallAreas(room: Room) {
  const { H } = roomDims(room);
  const frames = wallFrames(room);
  const out: Record<string, number> = {};
  for (const id of WALL_IDS) {
    const f = frames[id];
    const w = room.wardrobe;
    if (w && w.wall === id && mm(w.to.v - w.from.v) >= f.length - 0.05 && mm(w.height.v) >= H - 0.05) continue;
    const holes = room.openings.filter((o) => o.wall === id).reduce((a, o) => a + mm(o.width.v) * Math.min(mm(o.height.v), H), 0);
    out[id] = Math.max(0, f.length * H - holes);
  }
  return out;
}

export function shoppingList(v: Variant, plan: LightPlan | undefined, choices: Record<string, string>): ShoppingRow[] {
  const rows: ShoppingRow[] = [];
  const floorRooms = ROOMS.filter((r) => !r.floor || v.floorAll !== false);
  const area = (r: Room) => mm(r.size.x.v) * mm(r.size.z.v);

  // Padló
  const fl = findFloor(v.products?.floor);
  const flArea = floorRooms.reduce((a, r) => a + area(r), 0) * ASSUME.floorWaste;
  const flPrice = priceNum(fl?.price);
  rows.push({
    category: 'Padló',
    place: floorRooms.map((r) => r.name).join(', '),
    product: fl ? `${fl.manufacturer} ${fl.name}` : `kézi szín ${v.floor.tone} (nincs termék)`,
    store: fl?.store ?? '',
    spec: fl?.size ? `${fl.size.l} × ${fl.size.w} mm, ${fl.type}` : '',
    qty: `${dec(flArea)} m²`,
    unitPrice: priceText(fl?.price),
    total: flPrice ? flPrice * flArea : undefined,
    note: '10 % ráhagyással; alátét, szegély és dilatációs profil külön',
    url: fl?.url ?? '',
  });

  // Festék és falpanel: alapszín, kiemelt falak, mennyezet
  const paintArea: Record<string, { area: number; places: string[] }> = {};
  const add = (key: string, a: number, place: string) => {
    paintArea[key] = paintArea[key] ?? { area: 0, places: [] };
    paintArea[key].area += a;
    if (!paintArea[key].places.includes(place)) paintArea[key].places.push(place);
  };
  for (const r of ROOMS) {
    for (const [wallId, a] of Object.entries(wallAreas(r))) {
      const k = `${r.id}.${wallId}`;
      if (v.accents[k]) add(`accent:${k}`, a, `${r.name} – ${r.walls[wallId as keyof Room['walls']].name}`);
      else add('wall', a, r.name);
    }
    add('ceiling', area(r), r.name);
  }
  // azonos termékű kiemelések összevonva
  const bySlot = new Map<string, { slots: string[]; area: number; places: string[] }>();
  for (const [slot, { area: a, places }] of Object.entries(paintArea)) {
    const pid = v.products?.[slot] ?? `kezi:${slot === 'wall' ? v.wall : slot === 'ceiling' ? v.ceiling : v.accents[slot.slice(7)]}`;
    const cur = bySlot.get(pid) ?? { slots: [], area: 0, places: [] };
    cur.slots.push(slot);
    cur.area += a;
    cur.places.push(...places);
    bySlot.set(pid, cur);
  }
  for (const [pid, { slots, area: a, places }] of bySlot) {
    const p = findPaint(pid);
    const isPanel = pid.startsWith('panel-');
    const label = slots.includes('ceiling') ? 'Mennyezet' : slots.includes('wall') ? 'Falfestés (alapszín)' : 'Kiemelt fal';
    if (isPanel && p) {
      const boards = Math.ceil(a / (0.65 * 2.75));
      rows.push({ category: 'Falpanel', place: places.join('; '), product: `${p.brand} – ${p.name}`, store: p.brand, spec: p.line, qty: `${boards} tábla (${dec(a)} m²)`, unitPrice: priceText(p.price), total: priceNum(p.price) ? priceNum(p.price)! * boards : undefined, note: 'Ragasztó külön; a vágási veszteség miatt +1 tábla javasolt', url: p.url });
      continue;
    }
    const litres = (a * ASSUME.coats) / ASSUME.m2PerLitre;
    const can = p?.price?.match(/\/\s*([\d,]+)\s*l/);
    const canL = can ? Number(can[1].replace(',', '.')) : undefined;
    const cans = canL ? Math.ceil(litres / canL) : undefined;
    const unit = priceNum(p?.price);
    rows.push({
      category: label,
      place: places.join('; '),
      product: p ? `${p.brand} ${p.name}${p.code && p.code !== p.name ? ` (${p.code})` : ''}` : `kézi szín ${pid.slice(5)} (nincs termék)`,
      store: p?.shopUrl ? 'OBI / bolt' : (p?.brand ?? ''),
      spec: p?.line ?? '',
      qty: `${dec(a)} m² → kb. ${dec(litres)} l${cans ? ` = ${cans} × ${dec(canL!, 0)} l` : ''}`,
      unitPrice: priceText(p?.price),
      total: unit && cans ? unit * cans : undefined,
      note: `${ASSUME.coats} réteg, ${ASSUME.m2PerLitre} m²/l; alapozó külön${p?.line.startsWith('színkeverés') ? '; keverős szín – az ár a színezetlen alapé' : ''}`,
      url: p?.shopUrl ?? p?.url ?? '',
    });
  }

  // Ajtók: azonos azonosítójú nyílás (pl. a háló ajtaja a hálóban és a közlekedőben) egyszer
  const doorIds = new Map<string, string>();
  for (const r of ROOMS)
    for (const o of r.openings)
      if (o.kind === 'door' && o.leaf && !o.leaf.fixed && (o.leaf.existing || (o.leaf.optional && v.doorLeafOptional))) doorIds.set(o.id, `${o.label} (${o.id})`);
  const d = findDoor(v.products?.door);
  if (doorIds.size)
    rows.push({
      category: 'Beltéri ajtó',
      place: [...doorIds.values()].join('; '),
      product: d ? `${d.manufacturer} ${d.line} – ${d.name}` : `kézi szín ${v.door} (nincs termék)`,
      store: d?.store ?? '',
      spec: d?.decor ?? '',
      qty: `${doorIds.size} db`,
      unitPrice: priceText(d?.price),
      total: priceNum(d?.price) ? priceNum(d?.price)! * doorIds.size : undefined,
      note: 'Gyártás előtt végleges helyszíni felmérés; a tároló takarása és a bejárati ajtó nincs benne',
      url: d?.url ?? '',
    });

  // Függöny és áttetsző réteg: sínhossz × ráncolás / lapszélesség
  for (const [slot, sheerRow] of [['curtain', false], ['sheer', true]] as const) {
    const c = findCurtain(v.products?.[slot]);
    if (!c || (sheerRow && !v.curtain.sheerLayer) || !v.curtain.on) continue;
    let panels = 0;
    const places: string[] = [];
    for (const r of ROOMS)
      for (const l of curtainLayouts(r, v, choices)) {
        panels += Math.max(2, Math.ceil(((l.b - l.a) * ASSUME.fullness) / ((c.size?.w ?? 140) / 100)));
        places.push(r.name);
      }
    if (!panels) continue;
    const pair = /pár/.test(c.pack ?? c.price ?? '');
    const units = pair ? Math.ceil(panels / 2) : panels;
    rows.push({
      category: sheerRow ? 'Függöny – áttetsző' : 'Függöny',
      place: places.join(', '),
      product: `${c.name}, ${c.colorName}`,
      store: c.store,
      spec: c.size ? `${c.size.w} × ${c.size.l} cm` : '',
      qty: `${units} ${pair ? 'pár' : 'db'} (${panels} lap)`,
      unitPrice: priceText(c.price),
      total: priceNum(c.price) ? priceNum(c.price)! * units : undefined,
      note: `kétszeres ráncolással; ${c.size && c.size.l > 265 ? 'rövidítendő; ' : ''}sín és rögzítők külön`,
      url: c.url,
    });
  }

  // Lámpák és izzók
  const lamps = new Map<string, { n: number; places: string[] }>();
  const bulbs: Record<string, number> = {};
  for (const r of ROOMS)
    for (const f of roomFixtures(plan, r)) {
      const p = findLamp(f.productId);
      if (!p) continue;
      const cur = lamps.get(p.id) ?? { n: 0, places: [] };
      cur.n++;
      cur.places.push(`${r.name} – ${f.label ?? FIXTURE_LABEL[f.type]}`);
      lamps.set(p.id, cur);
      if (p.socket && !p.bulbIncluded) bulbs[p.socket.type] = (bulbs[p.socket.type] ?? 0) + p.socket.count;
    }
  for (const [pid, { n, places }] of lamps) {
    const p = findLamp(pid)!;
    rows.push({ category: 'Lámpa', place: places.join('; '), product: `${p.brand ? `${p.brand} ` : ''}${p.name}`, store: p.store, spec: [p.size.d && `Ø ${p.size.d} mm`, p.size.l && `${p.size.l} mm`].filter(Boolean).join(', '), qty: `${n} db`, unitPrice: priceText(p.price), total: priceNum(p.price) ? priceNum(p.price)! * n : undefined, note: p.lm ? `${p.lm} lm beépített LED` : 'izzó külön (lásd lent)', url: p.url });
  }
  const BULB: Record<string, [string, number]> = { E27: ['IKEA SOLHETTA LED E27 806 lm, 2700 K', 1990], E14: ['IKEA SOLHETTA LED E14 470 lm, 2700 K', 1190], GU10: ['IKEA SOLHETTA LED GU10 345 lm, 2700 K', 1290] };
  for (const [type, n] of Object.entries(bulbs)) {
    const b = BULB[type];
    rows.push({ category: 'Izzó', place: '', product: b ? b[0] : `${type} LED izzó`, store: b ? 'IKEA' : '', spec: type, qty: `${n} db`, unitPrice: b ? ft(b[1]) : '', total: b ? b[1] * n : undefined, note: 'meleg fehér, a lámpa max. teljesítményén belül', url: '' });
  }
  return rows;
}

export const shoppingTotal = (rows: ShoppingRow[]) => rows.reduce((a, r) => a + (r.total ?? 0), 0);

/** CSV Excelhez: pontosvessző, UTF-8 BOM, idézőjelezett mezők. */
export function shoppingCsv(rows: ShoppingRow[], title: string) {
  const q = (s: string | number) => `"${String(s).replace(/"/g, '""')}"`;
  const head = ['Kategória', 'Hely', 'Termék', 'Bolt', 'Kód / méret', 'Mennyiség', 'Egységár', 'Becsült összeg (Ft)', 'Megjegyzés', 'Link'];
  const lines = [
    q(title),
    head.map(q).join(';'),
    ...rows.map((r) => [r.category, r.place, r.product, r.store, r.spec, r.qty, r.unitPrice, r.total ? Math.round(r.total) : '', r.note, r.url].map(q).join(';')),
    ['', '', '', '', '', '', 'Összesen (becslés)', Math.round(shoppingTotal(rows)), 'munkadíj, segédanyagok és szállítás nélkül', ''].map(q).join(';'),
  ];
  return '﻿' + lines.join('\r\n');
}
