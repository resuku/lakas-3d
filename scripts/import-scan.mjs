// RoomPlan (OpenPlan3D "Editable plan JSON" = room.json) → a projekt saját szkennelési formátuma.
//
// Futtatás a konténerben:
//   node scripts/import-scan.mjs <bemenet.json> <név>
//   pl. node scripts/import-scan.mjs "/data/Képek/Scan/openplan-….json" nappali-kozlekedo
//
// Kimenet: src/data/scans/<név>.json (mm, a falakhoz igazított síkrajz).
// Ha létezik src/data/scans/<név>.controls.json, a kontrollméréseket is összeveti.
//
// Fontos: a RoomPlan a falakat vastagság nélküli síkként adja vissza. Ha egy falat mindkét
// oldaláról szkenneltünk (pl. nappali–közlekedő fal), a sík a fal belsejébe kerül, ezért a két
// oldali szabad méretek nagyobbak lesznek a valósnál. A fal menti pozíciók pontosak.

import fs from 'node:fs';
import path from 'node:path';

const [, , input, name] = process.argv;
if (!input || !name) {
  console.error('Használat: node scripts/import-scan.mjs <room.json> <név>');
  process.exit(2);
}
const OUT_DIR = path.resolve(import.meta.dirname, '../src/data/scans');
const room = JSON.parse(fs.readFileSync(input, 'utf8'));

const r1 = (v) => Math.round(v);
const confOf = (e) => Object.keys(e.confidence ?? {})[0] ?? 'unknown';
const catOf = (e) => Object.keys(e.category ?? {})[0] ?? 'unknown';

function frame(e) {
  const m = e.transform; // oszlopfolytonos 4×4
  return { x: [m[0], m[2]], t: [m[12], m[13], m[14]], dims: e.dimensions };
}

// 1) Igazítás: a leghosszabb fal irányát a tengelyhez forgatjuk (90°-os modulussal).
const walls0 = room.walls.map(frame);
const longest = walls0.reduce((a, w) => (w.dims[0] > a.dims[0] ? w : a));
const ang = Math.atan2(longest.x[1], longest.x[0]);
const rot = -(((ang % (Math.PI / 2)) + Math.PI / 2 + Math.PI / 4) % (Math.PI / 2) - Math.PI / 4);
const c = Math.cos(rot);
const s = Math.sin(rot);
const R = ([x, z]) => [x * c - z * s, x * s + z * c];

// Padlószint: a falak alsó síkja
const floorY = Math.min(...walls0.map((w) => w.t[1] - w.dims[1] / 2));

function seg(e) {
  const f = frame(e);
  const [w] = f.dims;
  const a = R([f.t[0] - (f.x[0] * w) / 2, f.t[2] - (f.x[1] * w) / 2]);
  const b = R([f.t[0] + (f.x[0] * w) / 2, f.t[2] + (f.x[1] * w) / 2]);
  return { a, b, w, h: f.dims[1], yc: f.t[1] };
}

const wallSegs = room.walls.map(seg);
const minX = Math.min(...wallSegs.flatMap((w) => [w.a[0], w.b[0]]));
const minZ = Math.min(...wallSegs.flatMap((w) => [w.a[1], w.b[1]]));
const P = ([x, z]) => [r1((x - minX) * 1000), r1((z - minZ) * 1000)];

const idOf = new Map();
room.walls.forEach((w, i) => idOf.set(w.identifier, `W${String(i).padStart(2, '0')}`));

const walls = room.walls.map((w, i) => {
  const sg = wallSegs[i];
  return { id: idOf.get(w.identifier), a: P(sg.a), b: P(sg.b), length: r1(sg.w * 1000), height: r1(sg.h * 1000), conf: confOf(w) };
});

function onWall(e, prefix, i) {
  const sg = seg(e);
  const wid = idOf.get(e.parentIdentifier) ?? null;
  const out = {
    id: `${prefix}${String(i).padStart(2, '0')}`,
    kind: catOf(e),
    wall: wid,
    width: r1(sg.w * 1000),
    height: r1(sg.h * 1000),
    bottom: r1((sg.yc - sg.h / 2 - floorY) * 1000),
    a: P(sg.a),
    b: P(sg.b),
    conf: confOf(e),
  };
  if (wid) {
    const w = walls.find((x) => x.id === wid);
    const dx = w.b[0] - w.a[0];
    const dz = w.b[1] - w.a[1];
    const L = Math.hypot(dx, dz);
    const proj = (p) => ((p[0] - w.a[0]) * dx + (p[1] - w.a[1]) * dz) / L;
    out.offset = r1(Math.min(proj(out.a), proj(out.b)));
  }
  return out;
}

const openings = [
  ...(room.doors ?? []).map((e, i) => onWall(e, 'D', i)),
  ...(room.openings ?? []).map((e, i) => onWall(e, 'O', i)),
  ...(room.windows ?? []).map((e, i) => onWall(e, 'A', i)),
];

const objects = (room.objects ?? []).map((e, i) => {
  const f = frame(e);
  return {
    id: `T${String(i).padStart(2, '0')}`,
    kind: catOf(e),
    center: P(R([f.t[0], f.t[2]])),
    size: f.dims.map((v) => r1(v * 1000)),
    conf: confOf(e),
  };
});

const out = {
  name,
  source: path.basename(input),
  importedAt: new Date().toISOString().slice(0, 10),
  note: 'RoomPlan-szkennelés (S). A falak vastagság nélküli síkok; a mindkét oldalról szkennelt falak síkja a fal belsejébe esik.',
  rotationDeg: Number(((rot * 180) / Math.PI).toFixed(2)),
  walls,
  openings,
  objects,
};
fs.mkdirSync(OUT_DIR, { recursive: true });
fs.writeFileSync(path.join(OUT_DIR, `${name}.json`), JSON.stringify(out, null, 2) + '\n');
console.log(`Mentve: src/data/scans/${name}.json — ${walls.length} fal, ${openings.length} nyílás/ajtó, ${objects.length} tárgy, forgatás ${out.rotationDeg}°`);
console.log('\nFalak (mm):');
for (const w of walls) console.log(`  ${w.id}  ${String(w.length).padStart(5)}  (${w.a.join(', ')}) → (${w.b.join(', ')})  [${w.conf}]`);
console.log('\nNyílások (mm):');
for (const o of openings) console.log(`  ${o.id}  ${o.kind.padEnd(8)} ${o.wall ?? '-'}  szél. ${o.width}  mag. ${o.height}  alja ${o.bottom}  falon ${o.offset ?? '-'} mm-től  [${o.conf}]`);

// 2) Kontrollmérések
const ctrlFile = path.join(OUT_DIR, `${name}.controls.json`);
if (fs.existsSync(ctrlFile)) {
  const ctrl = JSON.parse(fs.readFileSync(ctrlFile, 'utf8'));
  const W = (id) => walls.find((w) => w.id === id);
  const O = (id) => openings.find((o) => o.id === id);
  const lineDist = (p, w) => {
    const dx = w.b[0] - w.a[0];
    const dz = w.b[1] - w.a[1];
    return Math.abs((p[0] - w.a[0]) * dz - (p[1] - w.a[1]) * dx) / Math.hypot(dx, dz);
  };
  const mid = (w) => [(w.a[0] + w.b[0]) / 2, (w.a[1] + w.b[1]) / 2];
  const measure = (k) => {
    switch (k.type) {
      case 'between': return lineDist(mid(W(k.from)), W(k.to));
      case 'wallLength': return W(k.wall).length;
      case 'wallHeight': return W(k.wall).height;
      case 'openingWidth': return O(k.opening).width;
      case 'openingHeight': return O(k.opening).height;
      case 'openingFromWall': {
        const o = O(k.opening);
        return Math.min(lineDist(o.a, W(k.wall)), lineDist(o.b, W(k.wall)));
      }
      default: throw new Error(`Ismeretlen kontrolltípus: ${k.type}`);
    }
  };
  console.log('\nKontrollmérések (szkennelés − lézer):');
  for (const k of ctrl.checks) {
    const v = r1(measure(k));
    const laser = k.laser;
    const diff = v - laser[0];
    const flag = Math.abs(diff) <= (k.tol ?? 30) ? 'OK ' : 'ELT';
    console.log(`  ${flag} ${k.label.padEnd(46)} szken ${String(v).padStart(5)}  lézer ${laser.join('/').padStart(9)}  Δ ${diff > 0 ? '+' : ''}${diff}  (${k.ref})${k.note ? ' – ' + k.note : ''}`);
  }
}
