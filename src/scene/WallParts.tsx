import * as THREE from 'three';
import { useMemo } from 'react';
import type { DoorStyle, HandleFinish, Opening, PipeRun, Radiator, WallUnit } from '../model/types';
import { mm } from '../lib/geom';
import type { WoodTex } from '../lib/localTextures';
import { Box } from './Box';

// Minden elem a fal helyi rendszerében: x a fal mentén, y fel, z a helyiség felé (m).

const FRAME_WHITE = '#f1f0ec';
const HANDLE_COLOR: Record<HandleFinish, string> = { steel: '#9a9a9a', black: '#1d1d1d', brass: '#b08d57' };

/** Szín sötétítése (marások árnyéka). */
function shade(hex: string, k: number) {
  return '#' + new THREE.Color(hex).multiplyScalar(k).getHexString();
}

/** Egy- vagy többmezős ablak (függőleges és vízszintes osztásokkal), opcionális erkélyajtó-szárnnyal. */
export function WindowUnit({ o, t, tint, zones }: { o: Opening; t: number; tint: string | null; zones: boolean }) {
  const x0 = mm(o.offset.v);
  const x1 = x0 + mm(o.width.v);
  const y0 = mm(o.bottom.v);
  const y1 = y0 + mm(o.height.v);
  const f = 0.065;
  const zc = -Math.min(t * 0.6, 0.14);
  const zf: [number, number] = [zc - 0.035, zc + 0.035];
  const frame = tint ?? FRAME_WHITE;
  const splits = (o.splits ?? []).map((s) => y0 + mm(s.at));
  const vsplits = (o.vsplits ?? []).map((s) => x0 + mm(s.at));
  const spans = (lo: number, hi: number, cuts: number[]) => {
    const b = [lo, ...cuts, hi];
    const out: [number, number][] = [];
    for (let i = 0; i < b.length - 1; i++) out.push([b[i] + (i > 0 ? 0.03 : 0), b[i + 1] - (i < b.length - 2 ? 0.03 : 0)]);
    return out;
  };
  const rows = spans(y0 + f, y1 - f, splits);
  const cols = spans(x0 + f, x1 - f, vsplits);
  const sash = 0.05;
  const sz: [number, number] = [zc - 0.01, zc + 0.045];
  const dp = o.doorPane;
  const door = dp ? cols[dp.index] : null;
  // Kilincs a szárny szabad élén
  const handleX = door && dp ? (dp.hinge === 'start' ? door[1] - sash - 0.02 : door[0] + sash + 0.02) : 0;
  return (
    <group>
      <Box x={[x0, x0 + f]} y={[y0, y1]} z={zf} color={frame} rough={0.4} />
      <Box x={[x1 - f, x1]} y={[y0, y1]} z={zf} color={frame} rough={0.4} />
      <Box x={[x0, x1]} y={[y1 - f, y1]} z={zf} color={frame} rough={0.4} />
      <Box x={[x0, x1]} y={[y0, y0 + f]} z={zf} color={frame} rough={0.4} />
      {splits.map((s, i) => (
        <Box key={`h${i}`} x={[x0, x1]} y={[s - 0.03, s + 0.03]} z={zf} color={frame} rough={0.4} />
      ))}
      {vsplits.map((s, i) => (
        <Box key={`v${i}`} x={[s - 0.03, s + 0.03]} y={[y0, y1]} z={zf} color={frame} rough={0.4} />
      ))}
      {cols.flatMap(([c0, c1], ci) =>
        rows.map(([p0, p1], i) => {
          const lower = i === 0 && o.lowerTint && rows.length > 1;
          return (
            <group key={`${ci}-${i}`}>
              {/* szárnykeret */}
              <Box x={[c0, c0 + sash]} y={[p0, p1]} z={sz} color={frame} rough={0.4} />
              <Box x={[c1 - sash, c1]} y={[p0, p1]} z={sz} color={frame} rough={0.4} />
              <Box x={[c0, c1]} y={[p0, p0 + sash]} z={sz} color={frame} rough={0.4} />
              <Box x={[c0, c1]} y={[p1 - sash, p1]} z={sz} color={frame} rough={0.4} />
              <mesh position={[(c0 + c1) / 2, (p0 + p1) / 2, zc]} userData={{ glass: true }}>
                <planeGeometry args={[c1 - c0 - 2 * sash, p1 - p0 - 2 * sash]} />
                <meshStandardMaterial
                  color={lower ? o.lowerTint : '#d6e6ee'}
                  transparent
                  opacity={lower ? 0.72 : 0.08}
                  roughness={lower ? 0.6 : 0.05}
                  depthWrite={false}
                  side={THREE.DoubleSide}
                  emissive={lower ? o.lowerTint : '#000000'}
                  emissiveIntensity={lower ? 0.15 : 0}
                />
              </mesh>
            </group>
          );
        }),
      )}
      {door && (
        <Box x={[handleX - 0.012, handleX + 0.012]} y={[1.0, 1.14]} z={[zc + 0.045, zc + 0.085]} color="#e8e8e4" rough={0.4} />
      )}
      {/* Erkélyajtó: kifelé nyíló szárnynál a belső megközelítési sáv, befelé nyílónál a nyitási ív */}
      {zones && door && dp && (dp.outward ? (
        <Box x={door} y={[0.002, 0.006]} z={[0, 0.9]} color="#e65100" opacity={0.22} noShadow />
      ) : (
        <mesh position={[dp.hinge === 'start' ? door[0] : door[1], 0.004, 0]} rotation={[Math.PI / 2, 0, 0]}>
          <circleGeometry args={[mm(dp.leaf.v), 32, dp.hinge === 'start' ? 0 : Math.PI / 2, Math.PI / 2]} />
          <meshBasicMaterial color="#e65100" transparent opacity={0.25} side={THREE.DoubleSide} depthWrite={false} />
        </mesh>
      ))}
      {o.sill && (
        <Box x={[x0 - 0.03, x1 + 0.03]} y={[y0 - 0.025, y0]} z={[0.03 - mm(o.sill.depth.v), 0.03]} color={tint ?? '#ecebe6'} rough={0.35} />
      )}
    </group>
  );
}

export function DoorUnit({
  o,
  t,
  color,
  tint,
  showLeaf,
  open,
  zones,
  style = 'flat',
  handle = 'steel',
  tex,
}: {
  o: Opening;
  t: number;
  color: string;
  tint: string | null;
  showLeaf: boolean;
  open: boolean;
  zones: boolean;
  style?: DoorStyle;
  handle?: HandleFinish;
  /** Helyi fotótextúra az ajtó dekorjából (tok, takaróléc, ajtólap); a szín ilyenkor a minta. */
  tex?: WoodTex;
}) {
  const x0 = mm(o.offset.v);
  const x1 = x0 + mm(o.width.v);
  const y1 = mm(o.bottom.v + o.height.v);
  const w = tint ? undefined : tex;
  const c = tint ?? (w ? '#ffffff' : color);
  // a mintás felületek (a marás és a kilincs színe a dekor átlagszínéből)
  const deco = w ? { map: w.tex, mapSize: w.size } : {};
  const lineColor = tint ?? color;
  const j = 0.03;
  const a = 0.06;
  const leaf = o.leaf;
  const lw = leaf ? mm(leaf.width.v) : 0;
  const lh = leaf ? mm(leaf.height.v) : 0;
  const hingeEnd = leaf?.hinge === 'end';
  const hx = hingeEnd ? x1 - j : x0 + j;
  // A túloldalról nyíló lap a fal túlsó síkján ül, és attól elfelé fordul
  const away = !!leaf?.away;
  const angle = open ? (hingeEnd ? 1 : -1) * (away ? -1 : 1) * (Math.PI / 2) * 0.95 : 0;
  const dirX = hingeEnd ? -1 : 1;
  const span = (u0: number, u1: number): [number, number] => (dirX > 0 ? [u0, u1] : [-u1, -u0]);
  const hc = HANDLE_COLOR[handle];
  return (
    <group>
      {/* tok a kávában */}
      <Box x={[x0, x0 + j]} y={[0, y1]} z={[-t, 0]} color={c} rough={0.5} {...deco} />
      <Box x={[x1 - j, x1]} y={[0, y1]} z={[-t, 0]} color={c} rough={0.5} {...deco} />
      <Box x={[x0, x1]} y={[y1 - j, y1]} z={[-t, 0]} color={c} rough={0.5} {...deco} />
      {o.trim && (
        <>
          <Box x={[x0 - a, x0]} y={[0, y1 + a]} z={[0, 0.012]} color={c} rough={0.5} {...deco} />
          <Box x={[x1, x1 + a]} y={[0, y1 + a]} z={[0, 0.012]} color={c} rough={0.5} {...deco} />
          <Box x={[x0 - a, x1 + a]} y={[y1, y1 + a]} z={[0, 0.012]} color={c} rough={0.5} {...deco} />
        </>
      )}
      {o.transom && (
        <Box x={[x0, x1]} y={[y1 + a, mm(o.transom.top.v)]} z={[-0.015, 0.006]} color={c} rough={0.6} {...deco} />
      )}
      {showLeaf && leaf && (
        <group position={[hx, 0, away ? -t + 0.045 : -0.045]} rotation={[0, angle, 0]}>
          {style === 'glass' ? (
            <>
              {/* keret és szatinált üvegbetét */}
              <Box x={span(0, 0.14)} y={[0.008, lh]} z={[-0.02, 0.02]} color={c} rough={0.45} {...deco} />
              <Box x={span(lw - 0.14, lw)} y={[0.008, lh]} z={[-0.02, 0.02]} color={c} rough={0.45} {...deco} />
              <Box x={span(0.14, lw - 0.14)} y={[0.008, 0.3]} z={[-0.02, 0.02]} color={c} rough={0.45} {...deco} />
              <Box x={span(0.14, lw - 0.14)} y={[lh - 0.16, lh]} z={[-0.02, 0.02]} color={c} rough={0.45} {...deco} />
              <Box x={span(0.14, lw - 0.14)} y={[0.3, lh - 0.16]} z={[-0.004, 0.004]} color="#e9ece9" rough={0.15} opacity={0.6} noShadow />
            </>
          ) : (
            <Box x={span(0, lw)} y={[0.008, lh]} z={[-0.02, 0.02]} color={c} rough={0.45} {...deco} />
          )}
          {/* vízszintes marások mindkét oldalon */}
          {style === 'groove' &&
            [0.42, 0.84, 1.26, 1.68].map((y) =>
              [-1, 1].map((side) => (
                <Box key={`${y}${side}`} x={span(0.07, lw - 0.07)} y={[y, y + 0.006]} z={side > 0 ? [0.02, 0.0215] : [-0.0215, -0.02]} color={shade(lineColor, 0.7)} rough={0.6} noShadow />
              )),
            )}
          {/* kilincs */}
          <Box x={span(lw - 0.13, lw - 0.06)} y={[1.04, 1.06]} z={[0.02, 0.07]} color={hc} metal={handle === 'black' ? 0.3 : 0.8} rough={0.3} />
          <Box x={span(lw - 0.13, lw - 0.06)} y={[1.04, 1.06]} z={[-0.07, -0.02]} color={hc} metal={handle === 'black' ? 0.3 : 0.8} rough={0.3} />
        </group>
      )}
      {zones && leaf && showLeaf && !away && (
        <mesh position={[hx, 0.004, 0]} rotation={[Math.PI / 2, 0, 0]}>
          <circleGeometry args={[lw, 32, hingeEnd ? Math.PI / 2 : 0, Math.PI / 2]} />
          <meshBasicMaterial color="#e65100" transparent opacity={0.25} side={THREE.DoubleSide} depthWrite={false} />
        </mesh>
      )}
    </group>
  );
}

export function RadiatorUnit({ r, tint, zones }: { r: Radiator; tint: string | null; zones: boolean }) {
  const x0 = mm(r.offset.v);
  const x1 = x0 + mm(r.width.v);
  const y0 = mm(r.bottom.v);
  const y1 = y0 + mm(r.height.v);
  const z0 = mm(r.gap.v);
  const z1 = z0 + mm(r.depth.v);
  const c = tint ?? '#f4f4f1';
  const ribs = useMemo(() => {
    const out: number[] = [];
    for (let x = x0 + 0.02; x < x1 - 0.02; x += 0.034) out.push(x);
    return out;
  }, [x0, x1]);
  return (
    <group>
      <Box x={[x0, x1]} y={[y0, y1]} z={[z0, z1 - 0.012]} color={c} rough={0.35} />
      {ribs.map((x) => (
        <Box key={x} x={[x, x + 0.016]} y={[y0 + 0.01, y1 - 0.01]} z={[z1 - 0.012, z1]} color={c} rough={0.35} />
      ))}
      <Box x={[x0 + 0.03, x0 + 0.05]} y={[0, y0]} z={[z0 + 0.02, z0 + 0.04]} color={c} rough={0.4} />
      <Box x={[x1 - 0.05, x1 - 0.03]} y={[0, y0]} z={[z0 + 0.02, z0 + 0.04]} color={c} rough={0.4} />
      {zones && (
        <Box x={[x0 - 0.05, x1 + 0.05]} y={[0, y1 + 0.1]} z={[z1, z1 + 0.3]} color="#e65100" opacity={0.18} noShadow />
      )}
    </group>
  );
}

/** Split klíma beltéri egysége; a zónarétegen a lefelé-előre fújt légáram sávja. */
export function AcUnit({ u, tint, zones }: { u: WallUnit; tint: string | null; zones: boolean }) {
  const x0 = mm(u.offset.v);
  const x1 = x0 + mm(u.width.v);
  const y0 = mm(u.bottom.v);
  const y1 = y0 + mm(u.height.v);
  const d = mm(u.depth.v);
  const c = tint ?? '#f6f6f3';
  return (
    <group>
      <Box x={[x0, x1]} y={[y0 + 0.03, y1]} z={[0, d]} color={c} rough={0.3} />
      <Box x={[x0 + 0.01, x1 - 0.01]} y={[y0, y0 + 0.03]} z={[0, d * 0.6]} color={c} rough={0.3} />
      {/* kifúvó nyílás */}
      <Box x={[x0 + 0.04, x1 - 0.04]} y={[y0 + 0.005, y0 + 0.03]} z={[d * 0.6, d - 0.005]} color="#3b3f42" rough={0.6} />
      {zones && (
        <group position={[(x0 + x1) / 2, y0, d]} rotation={[Math.PI / 5, 0, 0]}>
          <Box x={[-(x1 - x0) / 2, (x1 - x0) / 2]} y={[-0.02, 0.02]} z={[0, 1.8]} color="#0288d1" opacity={0.16} noShadow />
        </group>
      )}
    </group>
  );
}

export function PipeUnit({ p, tint }: { p: PipeRun; tint: string | null }) {
  const r = mm(p.d) / 2;
  const z = mm(p.z);
  const c = tint ?? '#ecebe6';
  if (p.kind === 'h') {
    const a = mm(p.from ?? 0);
    const b = mm(p.to ?? 0);
    return (
      <mesh position={[(a + b) / 2, mm(p.y ?? 0), z]} rotation={[0, 0, Math.PI / 2]} castShadow receiveShadow>
        <cylinderGeometry args={[r, r, b - a, 12]} />
        <meshStandardMaterial color={c} roughness={0.4} />
      </mesh>
    );
  }
  const y0 = mm(p.y0 ?? 0);
  const y1 = mm(p.y1 ?? 0);
  return (
    <mesh position={[mm(p.at ?? 0), (y0 + y1) / 2, z]} castShadow receiveShadow>
      <cylinderGeometry args={[r, r, y1 - y0, 12]} />
      <meshStandardMaterial color={c} roughness={0.4} />
    </mesh>
  );
}

/** Szegélyléc a fal mentén, a padlóig érő nyílások kihagyásával. */
export function Skirting({ length, cuts, h, color }: { length: number; cuts: [number, number][]; h: number; color: string }) {
  const segs: [number, number][] = [];
  let x = 0;
  for (const [a, b] of [...cuts].sort((p, q) => p[0] - q[0])) {
    if (a > x) segs.push([x, a]);
    x = Math.max(x, b);
  }
  if (x < length) segs.push([x, length]);
  return (
    <>
      {segs.map(([a, b]) => (
        <Box key={a} x={[a, b]} y={[0, h]} z={[0, 0.014]} color={color} rough={0.5} />
      ))}
    </>
  );
}
