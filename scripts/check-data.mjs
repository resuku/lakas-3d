// Összeveti a helyiség-adatfájlok (src/data/rooms/*.json) forráshivatkozásait
// a legfrissebb live tervezési naplóval (Felujítás/Doc, az old mappa nélkül).
//
// Futtatás a konténerben:  npm run check-data
// Adatkönyvtár: FELUJITAS_DIR (alapértelmezés: /data, lásd docker-compose.yml)

import fs from 'node:fs';
import path from 'node:path';
import * as XLSX from 'xlsx';

const DATA_DIR = process.env.FELUJITAS_DIR || '/data';
const DOC_DIR = path.join(DATA_DIR, 'Doc');
const ROOMS_DIR = path.resolve(import.meta.dirname, '../src/data/rooms');
const TOLERANCE = 0.051;

function latestPlanningLog() {
  const files = fs
    .readdirSync(DOC_DIR)
    .map((f) => ({ f, m: /^Lakasfelujitas_tervezesi_naplo_v(\d+).*\.xlsx$/.exec(f) }))
    .filter((x) => x.m)
    .sort((a, b) => Number(b.m[1]) - Number(a.m[1]));
  if (!files.length) throw new Error(`Nem található tervezési napló: ${DOC_DIR}`);
  return { file: files[0].f, version: Number(files[0].m[1]) };
}

function numbersIn(row) {
  const out = [];
  for (const c of row) {
    if (typeof c === 'number') out.push(c);
    else if (typeof c === 'string') {
      for (const m of c.matchAll(/\d+(?:[.,]\d+)?/g)) out.push(Number(m[0].replace(',', '.')));
    }
  }
  return out;
}

function indexSheets(wb) {
  const idx = new Map();
  for (const name of wb.SheetNames) {
    const rows = XLSX.utils.sheet_to_json(wb.Sheets[name], { header: 1, raw: true, defval: null });
    const byKey = new Map();
    for (const row of rows) {
      const first = row.find((c) => c !== null && String(c).trim() !== '');
      if (first === undefined) continue;
      const key = String(first).trim();
      if (!byKey.has(key)) byKey.set(key, []);
      byKey.get(key).push(row);
    }
    idx.set(name, byKey);
  }
  return idx;
}

function* walkVals(node, trail) {
  if (Array.isArray(node)) {
    for (let i = 0; i < node.length; i++) yield* walkVals(node[i], `${trail}[${i}]`);
  } else if (node && typeof node === 'object') {
    if (typeof node.v === 'number' && typeof node.s === 'string') yield { trail, val: node };
    for (const [k, v] of Object.entries(node)) yield* walkVals(v, trail ? `${trail}.${k}` : k);
  }
}

const { file, version } = latestPlanningLog();
const wb = XLSX.read(fs.readFileSync(path.join(DOC_DIR, file)));
const idx = indexSheets(wb);

console.log(`Tervezési napló: ${file}`);
// A modell legutóbb a V15-tel összevetve (2026-11-02: berendezési sorok, a geometria nem változott)
if (version !== 15) console.log(`FIGYELEM: a modell a V15 alapján készült, most V${version} az aktuális – nézd át a változásokat.`);

let ok = 0;
const failures = [];
const statusCount = {};

for (const roomFile of fs.readdirSync(ROOMS_DIR).filter((f) => f.endsWith('.json'))) {
  const room = JSON.parse(fs.readFileSync(path.join(ROOMS_DIR, roomFile), 'utf8'));
  for (const { trail, val } of walkVals(room, '')) {
    statusCount[`${room.id}:${val.s}`] = (statusCount[`${room.id}:${val.s}`] ?? 0) + 1;
    for (const src of val.src ?? []) {
      const rows = idx.get(src.sheet)?.get(src.key);
      if (!idx.has(src.sheet)) {
        failures.push(`${room.id} ${trail}: nincs ilyen munkalap: "${src.sheet}"`);
      } else if (!rows) {
        failures.push(`${room.id} ${trail}: nincs "${src.key}" sor a(z) "${src.sheet}" lapon`);
      } else if (!rows.some((r) => numbersIn(r).some((n) => Math.abs(n - src.n) < TOLERANCE))) {
        failures.push(`${room.id} ${trail}: ${src.sheet} / ${src.key} sorában nem szerepel ${src.n} (sor: ${JSON.stringify(rows[0])})`);
      } else {
        ok++;
      }
    }
  }
}

console.log(`\nForráshivatkozások: ${ok} rendben, ${failures.length} eltérés.`);
for (const f of failures) console.log(`  ELTÉRÉS  ${f}`);

console.log('\nAdatstátuszok helyiségenként:');
const byRoom = {};
for (const [k, n] of Object.entries(statusCount)) {
  const [room, s] = k.split(':');
  (byRoom[room] ??= {})[s] = n;
}
for (const [room, counts] of Object.entries(byRoom)) {
  const order = ['M', 'D', 'S', 'P', 'A', 'U'];
  console.log(`  ${room}: ${order.filter((s) => counts[s]).map((s) => `${s}=${counts[s]}`).join(', ')}`);
}

// Bútorkatalógus: a berendezési javaslat (data/furnishing.ts) termékhivatkozásai léteznek-e
const furniture = JSON.parse(fs.readFileSync(path.resolve(import.meta.dirname, '../src/data/products/furniture.json'), 'utf8'));
const furnIds = new Set(furniture.items.map((i) => i.id));
const furnRefs = [...fs.readFileSync(path.resolve(import.meta.dirname, '../src/data/furnishing.ts'), 'utf8').matchAll(/'(furn-[^']+)'/g)].map((m) => m[1]);
const missingFurn = furnRefs.filter((id) => !furnIds.has(id));
console.log(`
Bútorkatalógus: ${furniture.items.length} termék; a javaslat ${furnRefs.length} hivatkozásából ${missingFurn.length} hiányzik.`);
for (const id of missingFurn) console.log(`  HIÁNYZÓ TERMÉK  ${id}`);

// Dobozbútor-formák (model/types.ts – CabinetForm): ismert értékek, az oszlopszélességek száma az oszlopokéval egyezik
const BASES = ['legs', 'plinth', 'frame', 'wall', 'none'];
const CELLS = ['door', 'drawer', 'flap', 'open', 'glass', 'slats'];
const HANDLES = ['none', 'knob', 'bar', 'grip', 'slot'];
const formErrors = [];
let formCount = 0;
const checkForm = (where, f) => {
  formCount++;
  const err = (m) => formErrors.push(`${where}: ${m}`);
  if (!BASES.includes(f.base)) err(`ismeretlen talp: ${f.base}`);
  if (!['photo', 'page', 'photo+page'].includes(f.src)) err(`ismeretlen forrás: ${f.src}`);
  if (f.handle && !HANDLES.includes(f.handle)) err(`ismeretlen fogantyú: ${f.handle}`);
  if (f.woodOn && !['body', 'front', 'all', 'none'].includes(f.woodOn)) err(`ismeretlen woodOn: ${f.woodOn}`);
  if (f.sliding && f.cols) err('tolóajtó és oszlopok egyszerre');
  if (f.colW && f.colW.length !== (f.cols ?? []).length) err(`colW (${f.colW.length}) ≠ oszlopok (${(f.cols ?? []).length})`);
  for (const c of (f.cols ?? []).flat()) {
    const k = typeof c === 'string' ? c : c.k;
    if (!CELLS.includes(k)) err(`ismeretlen frontcella: ${k}`);
    if (typeof c !== 'string' && !(c.h > 0)) err(`hibás cellamagasság: ${JSON.stringify(c)}`);
  }
};
for (const p of furniture.items) {
  if (p.form) checkForm(p.id, p.form);
  for (const [i, part] of (p.parts ?? []).entries()) if (part.form) checkForm(`${p.id} [${i}. elem]`, part.form);
}
console.log(`Dobozbútor-forma: ${formCount} (termék vagy TV-fal-elem); ${formErrors.length} hiba.`);
for (const e of formErrors) console.log(`  FORMAHIBA  ${e}`);

process.exit(failures.length || missingFurn.length || formErrors.length ? 1 : 0);
