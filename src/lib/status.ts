import type { Room, Status, Val } from '../model/types';

export const STATUS_INFO: Record<Status, { label: string; color: string }> = {
  M: { label: 'mért', color: '#2e7d32' },
  D: { label: 'levezetett', color: '#1565c0' },
  S: { label: 'szkennelt', color: '#00897b' },
  P: { label: 'fotóról', color: '#7b1fa2' },
  A: { label: 'közelítő', color: '#ef6c00' },
  U: { label: 'ismeretlen', color: '#c62828' },
};

const ORDER: Status[] = ['M', 'D', 'S', 'P', 'A', 'U'];

export function worst(...items: (Val | Status | undefined)[]): Status {
  let w = 0;
  for (const it of items) {
    if (!it) continue;
    const s = typeof it === 'string' ? it : it.s;
    w = Math.max(w, ORDER.indexOf(s));
  }
  return ORDER[w];
}

export interface ValRow {
  group: string;
  label: string;
  v: number | null;
  s: Status;
  note?: string;
  refs: string;
}

function row(group: string, label: string, val: Val): ValRow {
  return {
    group,
    label,
    v: val.v,
    s: val.s,
    note: val.note,
    refs: (val.src ?? []).map((s) => `${s.sheet} / ${s.key}`).join('; '),
  };
}

/** A helyiség összes projektadata táblázatos formában (Adatok fül). */
export function collectVals(room: Room): ValRow[] {
  const out: ValRow[] = [];
  const g = 'Helyiség';
  out.push(row(g, `Szélesség (x: ${room.walls.x0.name} → ${room.walls.x1.name})`, room.size.x));
  out.push(row(g, `Hossz (z: ${room.walls.z0.name} → ${room.walls.z1.name})`, room.size.z));
  out.push(row(g, 'Belmagasság', room.size.h));
  out.push({ group: g, label: 'Tájolás (északi fal)', v: null, s: room.north.s, note: `${room.walls[room.north.wall].name}. ${room.north.note}`, refs: '' });
  for (const id of ['z0', 'x1', 'z1', 'x0'] as const) out.push(row('Falak', `${room.walls[id].name} – vastagság`, room.walls[id].t));
  for (const o of room.openings) {
    const grp = `${o.id} ${o.label}`;
    out.push(row(grp, `Pozíció a ${room.walls[o.wall].name.toLowerCase()} kezdősarkától`, o.offset));
    out.push(row(grp, 'Szélesség', o.width));
    out.push(row(grp, 'Magasság', o.height));
    out.push(row(grp, 'Alsó él a padlótól', o.bottom));
    if (o.leaf) {
      out.push(row(grp, `Ajtólap szélesség${o.leaf.existing ? '' : ' (új, opcionális)'}`, o.leaf.width));
      out.push(row(grp, 'Ajtólap magasság', o.leaf.height));
    }
    if (o.transom) out.push(row(grp, 'Felülvilágító felső éle', o.transom.top));
    if (o.sill) out.push(row(grp, 'Belső párkány mélysége', o.sill.depth));
    if (o.doorPane) out.push(row(grp, `Erkélyajtó-szárny szélessége (${o.doorPane.outward ? 'kifelé' : 'befelé'} nyílik)`, o.doorPane.leaf));
    for (const s of o.vsplits ?? []) out.push({ group: grp, label: 'Függőleges osztás a nyílás kezdetétől', v: s.at, s: s.s, refs: '' });
    for (const s of o.splits ?? []) out.push({ group: grp, label: 'Vízszintes osztás a nyílás aljától', v: s.at, s: s.s, refs: '' });
  }
  for (const u of room.units ?? []) {
    const grp = `${u.id} ${u.label}`;
    out.push(row(grp, `Pozíció a ${room.walls[u.wall].name.toLowerCase()} kezdősarkától`, u.offset));
    out.push(row(grp, 'Szélesség', u.width));
    out.push(row(grp, 'Magasság', u.height));
    out.push(row(grp, 'Alsó él a padlótól', u.bottom));
    out.push(row(grp, 'Kiállás a faltól', u.depth));
  }
  for (const r of room.radiators) {
    const grp = `${r.id} ${r.label}`;
    out.push(row(grp, `Pozíció a ${room.walls[r.wall].name.toLowerCase()} kezdősarkától`, r.offset));
    out.push(row(grp, 'Szélesség', r.width));
    out.push(row(grp, 'Magasság', r.height));
    out.push(row(grp, 'Alsó él', r.bottom));
    out.push(row(grp, 'Falhézag', r.gap));
    out.push(row(grp, 'Testmélység', r.depth));
  }
  for (const p of room.pipes) out.push({ group: `${p.id} ${p.label}`, label: 'Nyomvonal és magasság', v: null, s: p.s, note: p.note, refs: '' });
  if (room.wardrobe) {
    const w = room.wardrobe;
    const grp = `${w.id} ${w.label}`;
    out.push(row(grp, 'Kezdete', w.from));
    out.push(row(grp, 'Vége', w.to));
    out.push(row(grp, 'Mélység', w.depth));
    out.push(row(grp, 'Magasság', w.height));
  }
  for (const b of room.beds) {
    const grp = `${b.id} ${b.label}`;
    out.push(row(grp, 'Fejvég pozíció (x)', b.x0));
    out.push(row(grp, 'Oldalpozíció (z)', b.z0));
    out.push(row(grp, 'Hossz', b.sx));
    out.push(row(grp, 'Szélesség', b.sz));
    out.push(row(grp, 'Keretmagasság', b.h));
    out.push(row(grp, 'Matracvastagság', b.mattressH));
    out.push(row(grp, 'Fejvég magassága', b.headH));
  }
  for (const l of room.ceilingLights) {
    out.push(row(`${l.id} ${l.label}`, 'Pozíció x', l.x));
    out.push(row(`${l.id} ${l.label}`, 'Pozíció z', l.z));
  }
  for (const l of room.accentLights) out.push({ group: `${l.id} ${l.label}`, label: 'Helyőrző', v: null, s: l.s, note: l.note, refs: '' });
  return out;
}
