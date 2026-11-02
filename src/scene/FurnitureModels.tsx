import * as THREE from 'three';
import { useEffect, useMemo } from 'react';
import type { FurnitureProduct, FurnPart, FurnSpec } from '../model/types';
import { mm } from '../lib/geom';
import { Box } from './Box';

// Paraméteres bútormodellek a befoglaló méretből, jelzésszerű formával. Helyi rendszer: középpont az origóban,
// szélesség x mentén, az eleje +z felé, a padló y = 0 (a FurnSpec.rot és a pozíció a hívó csoportjában).

export interface FurnColors {
  main: string;
  metal: string;
}

const shade = (hex: string, k: number) => '#' + new THREE.Color(hex).multiplyScalar(k).getHexString();

function Sofa({ f, c }: { f: FurnSpec; c: FurnColors }) {
  const w = mm(f.w) / 2;
  const d = mm(f.d) / 2;
  const h = mm(f.h);
  const arm = 0.16;
  const leg = 0.06;
  const seatY = 0.44;
  const back = 0.2;
  const ch = f.chaise;
  // a chaise oldala (ülve nézve jobb = helyi −x) és a mélysége
  const chSide = ch ? (ch.side === 'right' ? -1 : 1) : 0;
  const chW = ch ? mm(ch.w) : 0;
  const chD = ch ? mm(ch.d) : 0;
  const inner = 2 * w - 2 * arm;
  // ülőpárnák: a chaise saját párnát kap, a többi szélesség egyenlően osztva (kb. 70 cm-enként)
  const rest = ch ? inner - (chW - arm) : inner;
  const n = Math.max(1, Math.round(rest / 0.7));
  const cushions: { x: [number, number]; long: boolean }[] = [];
  const restStart = ch && chSide < 0 ? -w + chW : -w + arm;
  for (let i = 0; i < n; i++) cushions.push({ x: [restStart + (rest * i) / n + 0.005, restStart + (rest * (i + 1)) / n - 0.005], long: false });
  if (ch) cushions.push({ x: chSide < 0 ? [-w + arm + 0.005, -w + chW - 0.005] : [w - chW + 0.005, w - arm - 0.005], long: true });
  const dark = shade(c.main, 0.82);
  return (
    <group>
      {/* lábak */}
      {[-1, 1].map((sx) =>
        [-1, 1].map((sz) => (
          <Box key={`${sx}${sz}`} x={[sx * (w - 0.06) - 0.02, sx * (w - 0.06) + 0.02]} y={[0, leg]} z={[sz * (d - 0.06) - 0.02, sz * (d - 0.06) + 0.02]} color={c.metal} rough={0.5} />
        )),
      )}
      {/* test */}
      <Box x={[-w, w]} y={[leg, 0.3]} z={[-d, d - 0.01]} color={dark} rough={0.9} />
      {ch && <Box x={chSide < 0 ? [-w, -w + chW] : [w - chW, w]} y={[leg, 0.3]} z={[d - 0.02, -d + chD]} color={dark} rough={0.9} />}
      {/* háttámla */}
      <Box x={[-w, w]} y={[0.3, h - 0.05]} z={[-d, -d + 0.12]} color={dark} rough={0.9} />
      {cushions.map((p, i) => (
        <group key={i}>
          <Box x={p.x} y={[0.3, seatY]} z={[-d + 0.12, p.long ? -d + chD : d]} color={c.main} rough={0.95} />
          <Box x={p.x} y={[seatY, h]} z={[-d + 0.12, -d + 0.12 + back]} color={c.main} rough={0.95} />
        </group>
      ))}
      {/* sarokkanapé: a rövid ág külső oldalán is háttámla */}
      {ch?.corner && (
        <Box x={chSide < 0 ? [-w, -w + 0.2] : [w - 0.2, w]} y={[0.3, h - 0.05]} z={[-d + 0.12, -d + chD]} color={dark} rough={0.9} />
      )}
      {/* karfák (a chaise oldalán a chaise teljes mélységében) */}
      {[-1, 1].map((sx) => (
        <Box
          key={sx}
          x={sx < 0 ? [-w, -w + arm] : [w - arm, w]}
          y={[leg, 0.62]}
          z={[-d, ch && sx === chSide ? -d + chD : d]}
          color={c.main}
          rough={0.95}
        />
      ))}
    </group>
  );
}

function Ottoman({ f, c }: { f: FurnSpec; c: FurnColors }) {
  const w = mm(f.w) / 2;
  const d = mm(f.d) / 2;
  const h = mm(f.h);
  return (
    <group>
      {[-1, 1].map((sx) =>
        [-1, 1].map((sz) => <Box key={`${sx}${sz}`} x={[sx * (w - 0.05) - 0.015, sx * (w - 0.05) + 0.015]} y={[0, 0.05]} z={[sz * (d - 0.05) - 0.015, sz * (d - 0.05) + 0.015]} color={c.metal} rough={0.5} />),
      )}
      <Box x={[-w, w]} y={[0.05, h - 0.07]} z={[-d, d]} color={shade(c.main, 0.9)} rough={0.95} />
      <Box x={[-w + 0.01, w - 0.01]} y={[h - 0.07, h]} z={[-d + 0.01, d - 0.01]} color={c.main} rough={0.95} />
    </group>
  );
}

/** Alacsony szekrény: lábakon álló test, négy ajtó/fiók osztással; az éjjeliszekrény egy fiókkal. */
function Cabinet({ f, c, doors }: { f: FurnSpec; c: FurnColors; doors: number }) {
  const w = mm(f.w) / 2;
  const d = mm(f.d) / 2;
  const h = mm(f.h);
  const leg = Math.min(0.1, h * 0.2);
  const groove = shade(c.main, 0.6);
  return (
    <group>
      {[-1, 1].map((sx) =>
        [-1, 1].map((sz) => <Box key={`${sx}${sz}`} x={[sx * (w - 0.04) - 0.012, sx * (w - 0.04) + 0.012]} y={[0, leg]} z={[sz * (d - 0.04) - 0.012, sz * (d - 0.04) + 0.012]} color={c.metal} rough={0.5} />),
      )}
      <Box x={[-w, w]} y={[leg, h]} z={[-d, d]} color={c.main} rough={0.55} />
      {Array.from({ length: doors - 1 }, (_, i) => -w + ((i + 1) * 2 * w) / doors).map((x) => (
        <Box key={x} x={[x - 0.002, x + 0.002]} y={[leg + 0.01, h - 0.01]} z={[d, d + 0.002]} color={groove} rough={0.6} noShadow />
      ))}
      {doors === 1 && <Box x={[-w + 0.01, w - 0.01]} y={[h - 0.16, h - 0.156]} z={[d, d + 0.002]} color={groove} rough={0.6} noShadow />}
    </group>
  );
}

function Tv({ f }: { f: FurnSpec }) {
  const w = mm(f.w) / 2;
  const d = mm(f.d) / 2;
  const h = mm(f.h);
  return (
    <group>
      <Box x={[-w, w]} y={[0, h]} z={[-d, d]} color="#1a1b1d" rough={0.5} />
      <Box x={[-w + 0.006, w - 0.006]} y={[0.012, h - 0.006]} z={[d, d + 0.002]} color="#060708" rough={0.12} metal={0.3} noShadow />
    </group>
  );
}

/** Asztal: kör, ovális (bővített) vagy téglalap lap 1,8 cm vastagon, jelzésszerű négy lábbal. */
function Table({ f, c }: { f: FurnSpec; c: FurnColors }) {
  const w = mm(f.w);
  const d = mm(f.d);
  const h = mm(f.h);
  const t = 0.018;
  const rect = f.shape === 'rect';
  const geo = useMemo(() => {
    const s = new THREE.Shape();
    if (rect) {
      s.moveTo(-w / 2, -d / 2);
      s.lineTo(w / 2, -d / 2);
      s.lineTo(w / 2, d / 2);
      s.lineTo(-w / 2, d / 2);
    } else {
      const r = w / 2;
      const half = (d - w) / 2;
      s.absarc(0, half, r, 0, Math.PI, false);
      s.absarc(0, -half, r, Math.PI, 2 * Math.PI, false);
    }
    s.closePath();
    return new THREE.ExtrudeGeometry(s, { depth: t, bevelEnabled: false, curveSegments: 32 });
  }, [w, d, rect]);
  useEffect(() => () => geo.dispose(), [geo]);
  const lx = w / 2 - (rect ? 0.06 : 0.2);
  const lz = rect ? d / 2 - 0.06 : d / 2 - 0.2 - (d - w) / 4;
  return (
    <group>
      <mesh geometry={geo} rotation={[-Math.PI / 2, 0, 0]} position={[0, h - t, 0]} castShadow receiveShadow>
        <meshStandardMaterial color={c.main} roughness={0.45} />
      </mesh>
      <Box x={[-w / 2 + 0.12, w / 2 - 0.12]} y={[h - t - 0.05, h - t]} z={[-0.03, 0.03]} color={c.metal} rough={0.5} />
      {[-1, 1].map((sx) =>
        [-1, 1].map((sz) => <Box key={`${sx}${sz}`} x={[sx * lx - 0.02, sx * lx + 0.02]} y={[0, h - t]} z={[sz * lz - 0.02, sz * lz + 0.02]} color={c.metal} rough={0.45} metal={0.3} />),
      )}
    </group>
  );
}

/** Kárpitozott szék forgó talpon (ülésmagasság 48 cm). */
function Chair({ f, c }: { f: FurnSpec; c: FurnColors }) {
  const w = mm(f.w) / 2;
  const d = mm(f.d) / 2;
  const h = mm(f.h);
  const seat = 0.48;
  return (
    <group>
      <mesh position={[0, 0.006, 0]} castShadow receiveShadow>
        <cylinderGeometry args={[0.22, 0.24, 0.012, 24]} />
        <meshStandardMaterial color={c.metal} roughness={0.45} metalness={0.3} />
      </mesh>
      <Box x={[-0.025, 0.025]} y={[0.012, seat - 0.07]} z={[-0.025, 0.025]} color={c.metal} rough={0.45} metal={0.3} />
      <Box x={[-w + 0.03, w - 0.03]} y={[seat - 0.07, seat]} z={[-d + 0.08, d - 0.04]} color={c.main} rough={0.7} />
      <Box x={[-w + 0.05, w - 0.05]} y={[seat - 0.02, h]} z={[-d + 0.03, -d + 0.1]} color={c.main} rough={0.7} />
    </group>
  );
}

/** Lamellás térelválasztó: 3 × 7 cm-es függőleges elemek 5 cm-es közzel, alul-felül vízszintes elemmel. */
function Divider({ f, c }: { f: FurnSpec; c: FurnColors }) {
  const w = mm(f.w);
  const d = mm(f.d) / 2;
  const h = mm(f.h);
  const slat = 0.03;
  const gap = 0.05;
  const n = Math.max(2, Math.round((w + gap) / (slat + gap)));
  const pitch = (w - slat) / (n - 1);
  return (
    <group>
      <Box x={[-w / 2, w / 2]} y={[0, 0.03]} z={[-d, d]} color={c.main} rough={0.6} />
      <Box x={[-w / 2, w / 2]} y={[h - 0.03, h]} z={[-d, d]} color={c.main} rough={0.6} />
      {Array.from({ length: n }, (_, i) => -w / 2 + i * pitch).map((x) => (
        <Box key={x} x={[x, x + slat]} y={[0.03, h - 0.03]} z={[-d, d]} color={c.main} rough={0.6} />
      ))}
    </group>
  );
}

/** Nyitott hátú polc térelválasztóként: két oldallap és polcok kb. 35 cm-enként. */
function Shelf({ f, c }: { f: FurnSpec; c: FurnColors }) {
  const w = mm(f.w) / 2;
  const d = mm(f.d) / 2;
  const h = mm(f.h);
  const t = 0.02;
  const n = Math.max(2, Math.round(h / 0.35));
  return (
    <group>
      <Box x={[-w, -w + t]} y={[0, h]} z={[-d, d]} color={c.main} rough={0.6} />
      <Box x={[w - t, w]} y={[0, h]} z={[-d, d]} color={c.main} rough={0.6} />
      {Array.from({ length: n + 1 }, (_, i) => (i * (h - t)) / n).map((y) => (
        <Box key={y} x={[-w + t, w - t]} y={[y, y + t]} z={[-d, d]} color={c.main} rough={0.6} />
      ))}
    </group>
  );
}

function Rug({ f, c }: { f: FurnSpec; c: FurnColors }) {
  const w = mm(f.w) / 2;
  const d = mm(f.d) / 2;
  const h = mm(f.h);
  const b = 0.06;
  const edge = shade(c.main, 0.82);
  return (
    <group>
      <Box x={[-w + b, w - b]} y={[0.001, h]} z={[-d + b, d - b]} color={c.main} rough={1} noShadow />
      <Box x={[-w, w]} y={[0.001, h - 0.002]} z={[-d, -d + b]} color={edge} rough={1} noShadow />
      <Box x={[-w, w]} y={[0.001, h - 0.002]} z={[d - b, d]} color={edge} rough={1} noShadow />
      <Box x={[-w, -w + b]} y={[0.001, h - 0.002]} z={[-d + b, d - b]} color={edge} rough={1} noShadow />
      <Box x={[w - b, w]} y={[0.001, h - 0.002]} z={[-d + b, d - b]} color={edge} rough={1} noShadow />
    </group>
  );
}

/** Íróasztal (L alakúnál a rövid ág is), jelzésszerű monitorokkal (27 col) és laptoppal. */
function Desk({ f, c }: { f: FurnSpec; c: FurnColors }) {
  const w = mm(f.w) / 2;
  const d = mm(f.d) / 2;
  const h = mm(f.h);
  const t = 0.025;
  const ch = f.chaise;
  const side = ch?.side === 'right' ? -1 : 1;
  const legW = ch ? mm(ch.w) : 0;
  const legL = ch ? mm(ch.d) : 0;
  const legX: [number, number] = side < 0 ? [-w, -w + legW] : [w - legW, w];
  const mon = 0.612;
  const n = f.monitors ?? 0;
  // egyenes asztalon egy sorban középen; sarokasztalon a belső sarok köré (középső 45°-ban, egy-egy a két ágon)
  const screens: { x: number; z: number; r: number }[] = [];
  let laptop: [number, number] = [0, 0];
  if (ch) {
    const sx = side < 0 ? -w : w;
    const cand = [
      { x: sx - side * 0.42, z: -d + 0.42, r: -side * (Math.PI / 4) },
      { x: sx - side * (0.42 + 0.66), z: -d + 0.18, r: 0 },
      { x: sx - side * 0.18, z: -d + 0.42 + 0.66, r: -side * (Math.PI / 2) },
    ];
    screens.push(...cand.slice(0, n));
    laptop = [sx - side * (0.42 + 0.66 + 0.55) - 0.17, -d + 0.35];
  } else {
    for (let i = 0; i < n; i++) screens.push({ x: (i - (n - 1) / 2) * (mon + 0.02), z: -d + 0.18, r: 0 });
    laptop = [(n / 2) * (mon + 0.02) + 0.05, -d + 0.4];
  }
  const leg = (x: number, z: number) => <Box key={`${x}${z}`} x={[x - 0.025, x + 0.025]} y={[0, h - t]} z={[z - 0.025, z + 0.025]} color={c.metal} rough={0.5} />;
  return (
    <group>
      <Box x={[-w, w]} y={[h - t, h]} z={[-d, d]} color={c.main} rough={0.5} />
      {ch && <Box x={legX} y={[h - t, h]} z={[d, -d + legL]} color={c.main} rough={0.5} />}
      {leg(-w + 0.05, -d + 0.05)}
      {leg(w - 0.05, -d + 0.05)}
      {leg(-w + 0.05, d - 0.05)}
      {leg(w - 0.05, d - 0.05)}
      {ch && leg(legX[0] + 0.05, -d + legL - 0.05)}
      {ch && leg(legX[1] - 0.05, -d + legL - 0.05)}
      {screens.map((m, i) => (
        <group key={i} position={[m.x, h, m.z]} rotation={[0, m.r, 0]}>
          <Box x={[-0.1, 0.1]} y={[0, 0.012]} z={[-0.08, 0.08]} color="#2a2b2d" rough={0.5} />
          <Box x={[-0.02, 0.02]} y={[0.012, 0.18]} z={[-0.04, -0.01]} color="#2a2b2d" rough={0.5} />
          <Box x={[-mon / 2, mon / 2]} y={[0.12, 0.48]} z={[-0.01, 0.015]} color="#111214" rough={0.3} />
        </group>
      ))}
      {n > 0 && (
        <group position={[laptop[0], h, laptop[1]]}>
          <Box x={[0, 0.34]} y={[0, 0.015]} z={[0, 0.24]} color="#b9bcbf" rough={0.4} metal={0.4} />
          <Box x={[0, 0.34]} y={[0.015, 0.24]} z={[-0.005, 0.005]} color="#b9bcbf" rough={0.4} metal={0.4} />
        </group>
      )}
    </group>
  );
}

/** Irodai szék: csillagtalp, ülés, magas háttámla (az eleje +z felé). */
function OfficeChair({ f, c }: { f: FurnSpec; c: FurnColors }) {
  const w = mm(f.w) / 2;
  const d = mm(f.d) / 2;
  const h = mm(f.h);
  return (
    <group>
      {[0, 1, 2, 3, 4].map((i) => {
        const a = (i * 2 * Math.PI) / 5;
        return (
          <group key={i} rotation={[0, a, 0]}>
            <Box x={[-0.02, 0.02]} y={[0.04, 0.08]} z={[0, w * 0.9]} color="#2a2b2d" rough={0.5} />
          </group>
        );
      })}
      <Box x={[-0.03, 0.03]} y={[0.06, 0.45]} z={[-0.03, 0.03]} color="#2a2b2d" rough={0.4} metal={0.3} />
      <Box x={[-w * 0.75, w * 0.75]} y={[0.45, 0.53]} z={[-d * 0.7, d * 0.8]} color={c.main} rough={0.8} />
      <Box x={[-w * 0.7, w * 0.7]} y={[0.55, h]} z={[-d * 0.8, -d * 0.62]} color={c.main} rough={0.8} />
    </group>
  );
}

/**
 * TV-fal elemeinek elrendezése (m, helyi x a fal mentén, a TV középen). A termékoldalak ritkán adják meg az elemek helyét,
 * ezért jelzésszerű szabály: a magas elemek a két szélre, az alacsony pad(ok) középre a padlóra (ami nem fér el, ráépül),
 * a TV-nél szélesebb falra szerelt elem és a polc a TV fölé, a keskenyebbek a TV mellé, egymás fölé.
 */
export function layoutTvWall(parts: FurnPart[], width: number) {
  const W = width / 2;
  const tvHalf = 0.614 + 0.05;
  const tvTop = 1.43 + 0.12;
  const out: { x0: number; x1: number; y0: number; y1: number; d: number; kind: FurnPart['kind'] }[] = [];
  const units = parts.flatMap((p) => Array.from({ length: p.qty ?? 1 }, () => ({ ...p, w: mm(p.w), d: mm(p.d || 300), h: mm(p.h), y: p.y !== undefined ? mm(p.y) : undefined })));
  let left = -W;
  let right = W;
  let tallN = 0;
  for (const u of units.filter((u) => u.kind === 'tall')) {
    const atLeft = u.side === 'left' || (u.side !== 'right' && tallN++ % 2 === 0);
    if (atLeft) {
      out.push({ x0: left, x1: left + u.w, y0: 0, y1: u.h, d: u.d, kind: u.kind });
      left += u.w;
    } else {
      out.push({ x0: right - u.w, x1: right, y0: 0, y1: u.h, d: u.d, kind: u.kind });
      right -= u.w;
    }
  }
  // alacsony padok középen; ami nem fér el egymás mellett, a sor tetejére kerül
  let rowY = 0;
  let row: typeof units = [];
  const flush = () => {
    const tw = row.reduce((a, u) => a + u.w, 0);
    let x = (left + right) / 2 - tw / 2;
    for (const u of row) {
      out.push({ x0: x, x1: x + u.w, y0: rowY, y1: rowY + u.h, d: u.d, kind: u.kind });
      x += u.w;
    }
    rowY += Math.max(0, ...row.map((u) => u.h));
    row = [];
  };
  for (const u of units.filter((u) => u.kind === 'low')) {
    if (row.reduce((a, v) => a + v.w, 0) + u.w > right - left + 1e-6) flush();
    row.push(u);
  }
  if (row.length) flush();
  // TV fölötti sáv és a TV melletti oszlopok
  let topY = Math.max(tvTop, rowY);
  const side = { l: 0.72, r: 0.72 };
  let sideN = 0;
  for (const u of units.filter((u) => u.kind === 'wall' || u.kind === 'shelf')) {
    if (u.w >= 1.1 || u.kind === 'shelf' && u.w >= 0.7) {
      const y0 = Math.max(u.y ?? topY, topY);
      out.push({ x0: -u.w / 2, x1: u.w / 2, y0, y1: y0 + u.h, d: u.d, kind: u.kind });
      topY = y0 + u.h + 0.02;
      continue;
    }
    const atLeft = u.side === 'left' || (u.side !== 'right' && sideN++ % 2 === 0);
    const k = atLeft ? 'l' : 'r';
    const y0 = u.y !== undefined ? u.y : Math.max(side[k], rowY + 0.3);
    const x0 = atLeft ? Math.max(left, -tvHalf - u.w) : Math.min(right - u.w, tvHalf);
    out.push({ x0, x1: x0 + u.w, y0, y1: y0 + u.h, d: u.d, kind: u.kind });
    side[k] = y0 + u.h + 0.02;
  }
  return out;
}

/** TV-fal: az elemek `layoutTvWall` szerint; elemlista hiányában a teljes szélességű alacsony pad. */
function TvWall({ f, c }: { f: FurnSpec; c: FurnColors }) {
  const back = -mm(f.d) / 2;
  const parts = f.parts?.length ? f.parts : [{ kind: 'low' as const, w: f.w, d: f.d, h: Math.min(f.h, 600) }];
  const boxes = useMemo(() => layoutTvWall(parts, mm(f.w)), [parts, f.w]);
  const groove = shade(c.main, 0.6);
  return (
    <group>
      {boxes.map((b, i) => (
        <group key={i}>
          <Box x={[b.x0 + 0.002, b.x1 - 0.002]} y={[b.y0 + (b.kind === 'low' && b.y0 === 0 ? 0.06 : 0), b.y1]} z={[back, back + b.d]} color={c.main} rough={0.55} />
          {b.kind === 'low' && b.y0 === 0 && <Box x={[b.x0 + 0.03, b.x1 - 0.03]} y={[0, 0.06]} z={[back + 0.03, back + b.d - 0.03]} color={c.metal} rough={0.5} />}
          {b.kind !== 'shelf' && b.x1 - b.x0 > 0.5 && (
            <Box x={[(b.x0 + b.x1) / 2 - 0.002, (b.x0 + b.x1) / 2 + 0.002]} y={[b.y0 + 0.07, b.y1 - 0.01]} z={[back + b.d, back + b.d + 0.002]} color={groove} rough={0.6} noShadow />
          )}
        </group>
      ))}
    </group>
  );
}

/** Egy bútor modellje a helyi rendszerében (az ágyat a hívó rajzolja a meglévő ágy modelljével). */
export function FurnitureModel({ f, c }: { f: FurnSpec & { product?: FurnitureProduct }; c: FurnColors }) {
  switch (f.kind) {
    case 'sofa':
      return <Sofa f={f} c={c} />;
    case 'ottoman':
      return <Ottoman f={f} c={c} />;
    case 'tvUnit':
      return <Cabinet f={f} c={c} doors={4} />;
    case 'tvWall':
      return <TvWall f={f} c={c} />;
    case 'desk':
      return <Desk f={f} c={c} />;
    case 'officeChair':
      return <OfficeChair f={f} c={c} />;
    case 'nightstand':
      return <Cabinet f={f} c={c} doors={1} />;
    case 'tv':
      return <Tv f={f} />;
    case 'table':
      return <Table f={f} c={c} />;
    case 'chair':
      return <Chair f={f} c={c} />;
    case 'divider':
      return f.product?.dividerType === 'shelf' ? <Shelf f={f} c={c} /> : <Divider f={f} c={c} />;
    case 'rug':
      return <Rug f={f} c={c} />;
    default:
      return null;
  }
}
