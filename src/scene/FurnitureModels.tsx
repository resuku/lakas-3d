import * as THREE from 'three';
import { useEffect, useMemo } from 'react';
import type { FurnitureProduct, FurnSpec } from '../model/types';
import { mm } from '../lib/geom';
import { layoutTvWall, tvWallParts } from '../lib/tvWall';
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
function Cabinet({ f, c, doors, flaps = 0 }: { f: FurnSpec; c: FurnColors; doors: number; flaps?: number }) {
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
      {/* billenő fiókok (cipősszekrény): vízszintes osztás */}
      {Array.from({ length: Math.max(0, flaps - 1) }, (_, i) => leg + ((i + 1) * (h - leg)) / flaps).map((y) => (
        <Box key={y} x={[-w + 0.01, w - 0.01]} y={[y - 0.002, y + 0.002]} z={[d, d + 0.002]} color={groove} rough={0.6} noShadow />
      ))}
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

/** TV-fal: az elemek `layoutTvWall` (lib/tvWall.ts) szerint; elemlista hiányában a teljes szélességű alacsony pad. */
function TvWall({ f, c }: { f: FurnSpec; c: FurnColors }) {
  const back = -mm(f.d) / 2;
  const boxes = useMemo(() => layoutTvWall(tvWallParts(f), mm(f.w)).boxes, [f]);
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

const BOOK = ['#6b4a33', '#a65a3f', '#e7dccb', '#4e5d58', '#c9a27e', '#2f3e57', '#d8b26e'];

/** Nyitott polc (könyvespolc, társasjáték-polc): oldalak, polcok kb. 35 cm-enként, rajta jelzésszerű könyv- és dobozsorok. */
function Bookcase({ f, c }: { f: FurnSpec; c: FurnColors }) {
  const w = mm(f.w) / 2;
  const d = mm(f.d) / 2;
  const h = mm(f.h);
  const t = 0.02;
  const n = Math.max(2, Math.round(h / 0.36));
  const cols = w * 2 > 0.7 && h < 1.6 ? 2 : 1;
  const rows = Array.from({ length: n }, (_, i) => t + (i * (h - 2 * t)) / n);
  return (
    <group>
      <Box x={[-w, -w + t]} y={[0, h]} z={[-d, d]} color={c.main} rough={0.6} />
      <Box x={[w - t, w]} y={[0, h]} z={[-d, d]} color={c.main} rough={0.6} />
      {cols === 2 && <Box x={[-t / 2, t / 2]} y={[0, h]} z={[-d, d]} color={c.main} rough={0.6} />}
      <Box x={[-w + t, w - t]} y={[h - t, h]} z={[-d, d]} color={c.main} rough={0.6} />
      {rows.map((y) => (
        <Box key={y} x={[-w + t, w - t]} y={[y - t, y]} z={[-d, d]} color={c.main} rough={0.6} />
      ))}
      {rows.flatMap((y, ri) =>
        Array.from({ length: cols }, (_, ci) => {
          const x0 = cols === 2 ? (ci === 0 ? -w + t : t / 2) : -w + t;
          const x1 = cols === 2 ? (ci === 0 ? -t / 2 : w - t) : w - t;
          const k = (ri * 3 + ci * 5) % 7;
          if (k === 3) return null;
          const fill = 0.45 + (k % 3) * 0.2;
          const bh = Math.min(0.3, (h - 2 * t) / n - 0.04) * (0.75 + (k % 2) * 0.2);
          return <Box key={`${ri}-${ci}`} x={[x0 + 0.01, x0 + 0.01 + (x1 - x0 - 0.02) * fill]} y={[y, y + bh]} z={[-d + 0.03, d - 0.04]} color={BOOK[k]} rough={0.8} />;
        }),
      )}
    </group>
  );
}

/** Pad: deszka lábakon; az előszobai ülőpadnál alsó cipőtartó polccal és tömör oldalakkal. */
function Bench({ f, c }: { f: FurnSpec; c: FurnColors }) {
  const w = mm(f.w) / 2;
  const d = mm(f.d) / 2;
  const h = mm(f.h);
  const shoe = f.id.startsWith('eloszoba');
  if (shoe)
    return (
      <group>
        <Box x={[-w, -w + 0.025]} y={[0, h - 0.03]} z={[-d, d]} color={c.main} rough={0.6} />
        <Box x={[w - 0.025, w]} y={[0, h - 0.03]} z={[-d, d]} color={c.main} rough={0.6} />
        <Box x={[-w, w]} y={[h - 0.03, h]} z={[-d, d]} color={c.main} rough={0.6} />
        <Box x={[-w + 0.025, w - 0.025]} y={[0.1, 0.12]} z={[-d, d]} color={c.main} rough={0.6} />
        <Box x={[-w + 0.05, -w + 0.33]} y={[0.12, 0.22]} z={[-d + 0.05, d - 0.03]} color="#4e4038" rough={0.7} />
        <Box x={[-0.05, 0.25]} y={[0.12, 0.2]} z={[-d + 0.06, d - 0.04]} color="#c9b9a0" rough={0.7} />
      </group>
    );
  return (
    <group>
      <Box x={[-w, w]} y={[h - 0.04, h]} z={[-d, d]} color={c.main} rough={0.6} />
      {[-1, 1].map((sx) =>
        [-1, 1].map((sz) => <Box key={`${sx}${sz}`} x={[sx * (w - 0.06) - 0.02, sx * (w - 0.06) + 0.02]} y={[0, h - 0.04]} z={[sz * (d - 0.05) - 0.02, sz * (d - 0.05) + 0.02]} color={c.metal} rough={0.5} />),
      )}
    </group>
  );
}

/** Zsúrkocsi: két tálcaszint fém vázon, kerekekkel. */
function Cart({ f, c }: { f: FurnSpec; c: FurnColors }) {
  const w = mm(f.w) / 2;
  const d = mm(f.d) / 2;
  const h = mm(f.h);
  return (
    <group>
      {[0.18, h - 0.03].map((y) => (
        <group key={y}>
          <Box x={[-w, w]} y={[y, y + 0.02]} z={[-d, d]} color={c.main} rough={0.6} />
          <Box x={[-w, w]} y={[y + 0.02, y + 0.05]} z={[-d, -d + 0.01]} color={c.main} rough={0.6} />
          <Box x={[-w, w]} y={[y + 0.02, y + 0.05]} z={[d - 0.01, d]} color={c.main} rough={0.6} />
        </group>
      ))}
      {[-1, 1].map((sx) =>
        [-1, 1].map((sz) => (
          <group key={`${sx}${sz}`}>
            <Box x={[sx * w - 0.01, sx * w + 0.01]} y={[0.05, h]} z={[sz * d - 0.01, sz * d + 0.01]} color={c.metal} rough={0.4} metal={0.4} />
            <mesh position={[sx * w, 0.03, sz * d]} rotation={[0, 0, Math.PI / 2]}>
              <cylinderGeometry args={[0.03, 0.03, 0.02, 12]} />
              <meshStandardMaterial color="#2b2a28" roughness={0.6} />
            </mesh>
          </group>
        )),
      )}
      <Box x={[-w + 0.05, -w + 0.15]} y={[h - 0.01, h + 0.18]} z={[-0.04, 0.04]} color="#e8e2d6" rough={0.3} />
      <mesh position={[0.08, h + 0.03, 0]} castShadow>
        <cylinderGeometry args={[0.1, 0.06, 0.06, 16, 1, true]} />
        <meshStandardMaterial color="#b5694b" roughness={0.5} side={THREE.DoubleSide} />
      </mesh>
    </group>
  );
}

/** Keskeny konzolasztal: lap, négy vékony láb, alsó polc. */
function Console({ f, c }: { f: FurnSpec; c: FurnColors }) {
  const w = mm(f.w) / 2;
  const d = mm(f.d) / 2;
  const h = mm(f.h);
  return (
    <group>
      <Box x={[-w, w]} y={[h - 0.025, h]} z={[-d, d]} color={c.main} rough={0.55} />
      <Box x={[-w + 0.02, w - 0.02]} y={[0.22, 0.24]} z={[-d + 0.02, d - 0.02]} color={c.main} rough={0.55} />
      {[-1, 1].map((sx) =>
        [-1, 1].map((sz) => <Box key={`${sx}${sz}`} x={[sx * (w - 0.02) - 0.012, sx * (w - 0.02) + 0.012]} y={[0, h - 0.025]} z={[sz * (d - 0.02) - 0.012, sz * (d - 0.02) + 0.012]} color={c.metal} rough={0.45} metal={0.3} />),
      )}
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
    case 'sideboard':
      return <Cabinet f={f} c={c} doors={3} />;
    case 'shoeCabinet':
      return <Cabinet f={f} c={c} doors={1} flaps={2} />;
    case 'bookcase':
      return <Bookcase f={f} c={c} />;
    case 'bench':
      return <Bench f={f} c={c} />;
    case 'cart':
      return <Cart f={f} c={c} />;
    case 'console':
      return <Console f={f} c={c} />;
    case 'armchair':
      return <Sofa f={f} c={c} />;
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
