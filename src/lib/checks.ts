import type { Room, Variant } from '../model/types';
import { CHOICE_GROUPS, DEFAULT_CHOICES } from '../data/choices';
import { curtainLayouts } from './curtain';
import { mm, roomDims, toRoom, wallFrames } from './geom';
import { collectVals, worst } from './status';

export interface Finding {
  level: 'warn' | 'info' | 'ok';
  text: string;
}

/** Funkcionális és adatbiztonsági ellenőrzések az aktuális helyiségre és változatra. */
export function runChecks(room: Room, v: Variant, choices: Record<string, string> = DEFAULT_CHOICES): Finding[] {
  const out: Finding[] = [];
  const { W } = roomDims(room);

  // Függöny ↔ radiátor (10 Háló: a radiátor hőleadását vastag függöny nem akadályozhatja tartósan)
  for (const c of curtainLayouts(room, v, choices)) {
    for (const r of room.radiators.filter((r) => r.wall === c.wall)) {
      const rx0 = mm(r.offset.v);
      const rx1 = rx0 + mm(r.width.v);
      const rTop = mm(r.bottom.v + r.height.v);
      const covered = c.panels.some(([p0, p1]) => p0 < rx1 && p1 > rx0) && c.bottom < rTop;
      if (!covered) continue;
      const state = v.curtain.closed ? 'zárt' : 'nyitott';
      out.push(
        v.curtain.sheer
          ? { level: 'info', text: `Áttetsző függöny lóg a radiátor (${r.id}) előtt ${state} állapotban – kisebb mértékben, de akadályozza a hőleadást.` }
          : { level: 'warn', text: `Vastag függöny takarja a radiátort (${r.id}) ${state} állapotban. A radiátor hőleadását tartósan nem akadályozhatja – rövidebb vagy keskenyebb függöny, illetve más sínkiosztás kell.` },
      );
    }
  }

  // Függönyköteg ↔ szomszédos falon álló (sarok)radiátor: alaprajzi ütközés
  const frames = wallFrames(room);
  for (const c of curtainLayouts(room, v, choices)) {
    const cf = frames[c.wall];
    for (const r of room.radiators.filter((r) => r.wall !== c.wall)) {
      const rf = frames[r.wall];
      const ra = toRoom(rf, mm(r.offset.v), 0, 0);
      const rb = toRoom(rf, mm(r.offset.v + r.width.v), 0, mm(r.gap.v + r.depth.v));
      const hit = c.panels.some(([p0, p1]) => {
        const ca = toRoom(cf, p0, 0, c.z - 0.06);
        const cb = toRoom(cf, p1, 0, c.z + 0.06);
        const ov = (a0: number, a1: number, b0: number, b1: number) =>
          Math.min(Math.max(a0, a1), Math.max(b0, b1)) > Math.max(Math.min(a0, a1), Math.min(b0, b1));
        return ov(ca.x, cb.x, ra.x, rb.x) && ov(ca.z, cb.z, ra.z, rb.z);
      });
      if (hit)
        out.push({
          level: 'warn',
          text: `A függöny ${v.curtain.closed ? '' : 'nyitott állapotban összehúzott '}lapja a sarokban ütközik a radiátorral (${r.id}). Rövidebb sín vagy a radiátor felőli oldalon keskenyebb köteg kell.`,
        });
    }
  }

  // Falra szerelt egység (klíma) ↔ függöny, fűtéscső és radiátor ugyanazon a falon
  const active = (room.units ?? []).filter((u) => !u.choice || (choices[u.choice.group] ?? DEFAULT_CHOICES[u.choice.group]) === u.choice.option);
  for (const u of active) {
    const ux0 = mm(u.offset.v);
    const ux1 = ux0 + mm(u.width.v);
    const uy0 = mm(u.bottom.v);
    const uy1 = uy0 + mm(u.height.v);
    for (const c of curtainLayouts(room, v, choices).filter((c) => c.wall === u.wall)) {
      // a sín a mennyezeten fut, a függöny a fal előtt c.z-n; a klíma mélysége ennél nagyobb
      const railHit = c.a < ux1 && c.b > ux0 && mm(u.depth.v) > c.z - 0.05;
      if (railHit)
        out.push({
          level: 'warn',
          text: `A függönysín a klíma (${u.id}) előtt fut: ${Math.round((Math.min(c.b, ux1) - Math.max(c.a, ux0)) * 1000)} mm-en átfednek. A sínnek a klíma előtt véget kell érnie (a sötétítéshez ekkor fényzáró roló kell), vagy a klíma más helyre kerül.`,
        });
    }
    for (const p of room.pipes.filter((p) => p.wall === u.wall && p.kind === 'h')) {
      const py = mm(p.y ?? 0);
      const pr = mm(p.d) / 2;
      const overlapAlong = mm(p.from ?? 0) < ux1 && mm(p.to ?? 0) > ux0;
      if (overlapAlong && py - pr < uy1 + 0.05)
        out.push({ level: 'warn', text: `A klíma (${u.id}) teteje és a fűtéscső (${p.id}) között 50 mm-nél kevesebb a hely – a beszívó oldal nem kap elég levegőt.` });
    }
    for (const r of room.radiators.filter((r) => r.wall === u.wall)) {
      const rx0 = mm(r.offset.v);
      const rx1 = rx0 + mm(r.width.v);
      if (rx0 < ux1 && rx1 > ux0)
        out.push({
          level: 'info',
          text: `A klíma (${u.id}) a radiátor (${r.id}) fölött van: fűtésnél a meleg levegő a beltéri egység felé száll, hűtésnél a lefelé áramló hideg levegő a termosztátfejet érheti – a lamellákat vízszintesre érdemes állítani.`,
        });
    }
  }
  for (const g of CHOICE_GROUPS.filter((g) => g.roomId === room.id)) {
    const opt = g.options.find((o) => o.id === (choices[g.id] ?? g.default));
    if (opt?.note) out.push({ level: 'info', text: `${g.label} – ${opt.label}: ${opt.note}` });
  }

  // Sötétítés: mennyit takar a függöny az ablakon túl (fényrés az oldalakon)
  for (const c of curtainLayouts(room, v, choices)) {
    const wins = room.openings.filter((o) => o.kind === 'window' && o.wall === c.wall);
    if (!wins.length || v.curtain.sheer) continue;
    const winA = Math.min(...wins.map((o) => mm(o.offset.v)));
    const winB = Math.max(...wins.map((o) => mm(o.offset.v + o.width.v)));
    const over = Math.min(winA - c.a, c.b - winB);
    if (over < 0.1)
      out.push({
        level: 'info',
        text: `Sötétítés: a függöny az ablak egyik oldalán csak ${Math.max(0, Math.round(over * 1000))} mm-rel nyúlik túl – ott fény szűrődik be. Teljes sötétítéshez az ablakkeretbe szerelt fényzáró roló javasolt (a függöny akkor díszítő).`,
      });
  }

  // Közlekedősáv az ágy lábvége és a gardróbfront között
  if (room.wardrobe && room.wardrobe.wall === 'x1') {
    for (const b of room.beds) {
      const gap = W - mm(room.wardrobe.depth.v) - mm(b.x0.v + b.sx.v);
      const s = worst(room.size.x, room.wardrobe.depth, b.x0, b.sx);
      const g = Math.round(gap * 1000);
      out.push({
        level: gap < 0.7 ? 'warn' : 'ok',
        text: `Közlekedősáv az ágy lábvége és a gardróbfront között: ~${g} mm (${s}). ${gap < 0.7 ? 'Szűk – 700 mm alatt.' : 'Elegendő a tolóajtós gardrób használatához.'}`,
      });
    }
  }

  for (const t of room.conflicts) out.push({ level: 'warn', text: `Ellentmondás: ${t}` });
  for (const t of room.missing) out.push({ level: 'info', text: `Hiányzó / lezáratlan adat: ${t}` });

  const vals = collectVals(room);
  const a = vals.filter((r) => r.s === 'A').length;
  const u = vals.filter((r) => r.s === 'U').length;
  out.push({ level: 'info', text: `${vals.length} adatból ${a} közelítő (A) és ${u} ismeretlen (U). Kivitelezési döntés előtt a kritikusakat méréssel vagy szkenneléssel le kell zárni.` });
  return out;
}
