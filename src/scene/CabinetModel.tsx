import * as THREE from 'three';
import type { ReactElement } from 'react';
import type { CabinetForm, FrontKind } from '../model/types';
import { cellH, cellKind, formColor } from '../lib/cabinetForm';
import type { WoodTex } from '../lib/localTextures';
import { Box } from './Box';

// Dobozbútor a formaleírás (CabinetForm) szerint: talp, keret (tető, fenék, oldalak, hátlap), válaszfalak, polcok,
// frontok és fogantyúk. Méret a befoglaló dobozból; a forma csak arányokat és típusokat ad.

export interface CabinetColors {
  body: string;
  front: string;
  metal: string;
  /** Adatbiztonság-színezés: minden egy színben, a forma színei nem számítanak. */
  tinted?: boolean;
  /** Helyi fotótextúra (a termék színével megegyező felületeken: test és front, ha a forma nem ad külön színt). */
  wood?: WoodTex;
}

type R = [number, number];

const shade = (hex: string, k: number) => '#' + new THREE.Color(hex).multiplyScalar(k).getHexString();
const CLOSED: FrontKind[] = ['door', 'drawer', 'flap', 'glass'];

/** Láb a test alján (felső pont: x, top, z), lefelé; a kúpos láb kifelé dől (sx, sz: a sarok iránya). */
function Leg({ x, z, top, len, style, color, sx, sz }: { x: number; z: number; top: number; len: number; style: CabinetForm['leg']; color: string; sx: number; sz: number }) {
  if (style === 'square' || !style)
    return <Box x={[x - 0.012, x + 0.012]} y={[top - len, top]} z={[z - 0.012, z + 0.012]} color={color} rough={0.5} />;
  const th = style === 'tapered' ? 0.12 : 0;
  // kifelé dőlés: a láb alja a sarok irányába mozdul (forgatás z körül +sx·θ, x körül −sz·θ)
  const L = len / Math.cos(th);
  return (
    <group position={[x, top, z]} rotation={[-sz * th, 0, sx * th]}>
      <mesh position={[0, -L / 2, 0]} castShadow receiveShadow>
        <cylinderGeometry args={style === 'tapered' ? [0.02, 0.011, L, 16] : [0.019, 0.019, L, 16]} />
        <meshStandardMaterial color={color} roughness={0.55} />
      </mesh>
    </group>
  );
}

/**
 * Dobozbútor a megadott befoglaló dobozban (m, helyi rendszer, az eleje +z felé): x: [x0, x1], y: [y0, y1] a talppal
 * együtt (falra szerelt elemnél a doboz már a helyén lebeg), z: [z0 hát, z1 eleje].
 */
export function CabinetBody({ x, y, z, form, c }: { x: R; y: R; z: R; form: CabinetForm; c: CabinetColors }) {
  const [x0, x1] = x;
  const [y0, y1] = y;
  const [z0, z1] = z;
  const body = c.tinted ? c.body : (form.bodyHex ?? c.body);
  const front = c.tinted ? c.body : (form.frontHex ?? c.front);
  const baseCol = c.tinted ? c.body : formColor(form.baseColor, body, c.metal);
  const handleCol = c.tinted ? c.body : formColor(form.handleColor ?? 'steel', body, c.metal);
  const inner = shade(body, 0.78);
  const W = x1 - x0;
  const t = Math.min((form.panel ?? 18) / 1000, W / 6, (y1 - y0) / 6);
  const tf = 0.018;
  const frontRough = form.gloss ? 0.15 : 0.55;
  const els: ReactElement[] = [];
  const box = (bx: R, by: R, bz: R, color: string, rough = 0.55, extra: { opacity?: number; noShadow?: boolean; metal?: number } = {}) =>
    els.push(<Box key={els.length} x={bx} y={by} z={bz} color={color} rough={rough} {...extra} />);
  // test / front / belső felület: a fotótextúra csak a termék saját színű felületére kerül (kéttónusú bútornál a
  // külön megadott szín marad sima); a belső hátlap a mintával, sötétítve
  const wood = c.tinted ? undefined : c.wood;
  const woodOn = form.woodOn ?? (form.bodyHex && form.frontHex ? 'none' : form.bodyHex ? 'front' : form.frontHex ? 'body' : 'all');
  const surf = (s: 'body' | 'front' | 'inner') => {
    const role = s === 'front' ? 'front' : 'body';
    const m = woodOn === 'all' || woodOn === role ? wood : undefined;
    if (m) return { color: s === 'inner' ? '#c7c7c7' : '#ffffff', map: m.tex, mapSize: m.size };
    return { color: s === 'front' ? front : s === 'inner' ? inner : body };
  };
  const sbox = (bx: R, by: R, bz: R, s: 'body' | 'front' | 'inner', rough = 0.55) => els.push(<Box key={els.length} x={bx} y={by} z={bz} rough={rough} {...surf(s)} />);

  // --- talp ---
  const hasBase = form.base === 'legs' || form.base === 'frame' || form.base === 'plinth';
  const baseH = hasBase ? Math.min((form.baseH ?? 0) / 1000, (y1 - y0) * 0.8) : 0;
  const yb = y0 + baseH;
  const sliding = !!form.sliding;
  const overlay = !form.inset && !sliding;
  // a keret eleje: ráütött frontnál a front mögött
  const zc1 = overlay ? z1 - tf : z1;
  if ((form.base === 'legs' || form.base === 'frame') && baseH > 0) {
    const style = form.leg ?? 'square';
    const inset = style === 'tapered' ? 0.05 : form.base === 'frame' ? 0.09 : style === 'round' ? 0.022 : 0.03;
    const xs = [x0 + inset, x1 - inset];
    if (W > 1.5 && form.base === 'legs') xs.splice(1, 0, (x0 + x1) / 2);
    const zs = [z0 + inset, zc1 - inset];
    const legLen = form.base === 'frame' ? baseH - 0.035 : baseH;
    xs.forEach((lx, i) =>
      zs.forEach((lz, j) =>
        els.push(
          <Leg key={`leg${i}${j}`} x={lx} z={lz} top={y0 + legLen} len={legLen} style={style} color={baseCol} sx={i === 0 ? -1 : i === xs.length - 1 ? 1 : 0} sz={j === 0 ? -1 : 1} />,
        ),
      ),
    );
    if (form.base === 'frame') {
      // összekötő keret közvetlenül a test alatt, a lábak vonalában
      const ry: R = [yb - 0.035, yb];
      box([xs[0] - 0.015, xs[xs.length - 1] + 0.015], ry, [zs[0] - 0.012, zs[0] + 0.012], baseCol);
      box([xs[0] - 0.015, xs[xs.length - 1] + 0.015], ry, [zs[1] - 0.012, zs[1] + 0.012], baseCol);
      box([xs[0] - 0.012, xs[0] + 0.012], ry, [zs[0], zs[1]], baseCol);
      box([xs[xs.length - 1] - 0.012, xs[xs.length - 1] + 0.012], ry, [zs[0], zs[1]], baseCol);
    }
    if (form.lowerShelf) {
      const ls = y0 + form.lowerShelf / 1000;
      sbox([x0 + inset, x1 - inset], [ls - 0.016, ls], [z0 + inset, zc1 - inset], 'body');
    }
  }
  if (form.base === 'plinth' && baseH > 0) {
    const sb = (form.setback ?? 25) / 1000;
    if (!form.baseColor || form.baseColor === 'body') sbox([x0 + sb, x1 - sb], [y0, yb], [z0 + 0.01, zc1 - sb], 'body', 0.6);
    else box([x0 + sb, x1 - sb], [y0, yb], [z0 + 0.01, zc1 - sb], baseCol, 0.6);
  }

  // --- keret ---
  sbox([x0, x1], [y1 - t, y1], [z0, zc1], 'body');
  sbox([x0, x1], [yb, yb + t], [z0, zc1], 'body');
  sbox([x0, x0 + t], [yb + t, y1 - t], [z0, zc1], 'body');
  sbox([x1 - t, x1], [yb + t, y1 - t], [z0, zc1], 'body');
  sbox([x0 + t, x1 - t], [yb + t, y1 - t], [z0, z0 + 0.008], 'inner', 0.7);

  // a frontok tartománya: ráütve a teljes elejét takarják, süllyesztve a kereten belül vannak
  const fx: R = overlay ? [x0, x1] : [x0 + t, x1 - t];
  const fy: R = overlay ? [yb, y1] : [yb + t, y1 - t];
  const zf: R = overlay ? [z1 - tf, z1] : [z1 - 0.004 - tf, z1 - 0.004];
  const g = 0.0015;
  const hk = form.handle ?? 'none';

  const handleAt = (hx: number, hy: number, vertical: boolean, len: number, zc: number, plate: string) => {
    if (hk === 'bar') box(vertical ? [hx - 0.006, hx + 0.006] : [hx - len / 2, hx + len / 2], vertical ? [hy - len / 2, hy + len / 2] : [hy - 0.006, hy + 0.006], [zc, zc + 0.025], handleCol, 0.35, { metal: 0.4 });
    if (hk === 'knob') box([hx - 0.012, hx + 0.012], [hy - 0.012, hy + 0.012], [zc, zc + 0.022], handleCol, 0.35, { metal: 0.4 });
    if (hk === 'slot') box([hx - 0.007, hx + 0.007], [hy - 0.04, hy + 0.04], [zc - 0.0005, zc + 0.0006], shade(plate, 0.4), 0.8, { noShadow: true });
  };

  if (sliding) {
    // tolóajtók két síkon, középen átfedéssel (a páratlan sorszámú elöl); fogóvájat a külső szélen
    const n = Math.max(1, form.sliding!);
    const ov = 0.02;
    const pw = (fx[1] - fx[0] + (n - 1) * ov) / n;
    for (let i = 0; i < n; i++) {
      const px0 = fx[0] + i * (pw - ov);
      const back = i % 2 === 0 && n > 1;
      const zz: R = back ? [z1 - 0.024 - 2 * tf, z1 - 0.024 - tf] : [z1 - 0.02 - tf, z1 - 0.02];
      sbox([px0 + 0.001, px0 + pw - 0.001], [fy[0] + 0.002, fy[1] - 0.002], zz, 'front', frontRough);
      const hx = i === 0 ? px0 + 0.04 : i === n - 1 ? px0 + pw - 0.04 : px0 + pw / 2;
      handleAt(hx, fy[1] - (fy[1] - fy[0]) * 0.4, true, 0.12, zz[1], front);
    }
    return <group>{els}</group>;
  }

  const cols = form.cols?.length ? form.cols : [['door' as const]];
  const cw = form.colW?.length === cols.length ? form.colW : cols.map(() => 1);
  const cwSum = cw.reduce((a, b) => a + b, 0);
  let cx = fx[0];
  cols.forEach((col, ci) => {
    const cx0 = cx;
    const cx1 = ci === cols.length - 1 ? fx[1] : cx + ((fx[1] - fx[0]) * cw[ci]) / cwSum;
    cx = cx1;
    // belső vízszintes tartomány (oldallapok, válaszfalak között)
    const ix0 = Math.max(cx0, x0 + t) + (ci > 0 ? t / 2 : 0);
    const ix1 = Math.min(cx1, x1 - t) - (ci < cols.length - 1 ? t / 2 : 0);
    if (ci < cols.length - 1) sbox([cx1 - t / 2, cx1 + t / 2], [yb + t, y1 - t], [z0 + 0.008, zc1 - 0.001], 'body');
    const hs = col.map(cellH);
    const hSum = hs.reduce((a, b) => a + b, 0);
    let top = fy[1];
    col.forEach((cell, ri) => {
      const kind = cellKind(cell);
      const cy1 = top;
      const cy0 = ri === col.length - 1 ? fy[0] : top - ((fy[1] - fy[0]) * hs[ri]) / hSum;
      top = cy0;
      // polc a cellák között, ha valamelyik oldala nyitott vagy üveges
      const next = col[ri + 1] ? cellKind(col[ri + 1]) : null;
      const see = (k: FrontKind | null) => k === 'open' || k === 'glass';
      if (next && (see(kind) || see(next))) sbox([ix0, ix1], [cy0 - t / 2, cy0 + t / 2], [z0 + 0.008, zc1 - 0.001], 'body');
      const fx0 = cx0 + g;
      const fx1 = cx1 - g;
      const fy0 = cy0 + g;
      const fy1 = cy1 - g;
      if (kind === 'door' || kind === 'drawer' || kind === 'flap') sbox([fx0, fx1], [fy0, fy1], zf, 'front', frontRough);
      if (kind === 'glass') {
        const b = Math.min(0.04, (fx1 - fx0) / 5);
        sbox([fx0, fx1], [fy1 - b, fy1], zf, 'front', frontRough);
        sbox([fx0, fx1], [fy0, fy0 + b], zf, 'front', frontRough);
        sbox([fx0, fx0 + b], [fy0 + b, fy1 - b], zf, 'front', frontRough);
        sbox([fx1 - b, fx1], [fy0 + b, fy1 - b], zf, 'front', frontRough);
        box([fx0 + b, fx1 - b], [fy0 + b, fy1 - b], [zf[0] + 0.006, zf[0] + 0.01], '#dfe9ea', 0.05, { opacity: 0.25 });
        sbox([ix0, ix1], [(cy0 + cy1) / 2 - 0.004, (cy0 + cy1) / 2 + 0.004], [z0 + 0.008, zc1 - 0.01], 'body');
      }
      if (kind === 'slats') {
        box([fx0, fx1], [fy0, fy1], [zf[0], zf[0] + 0.006], shade(body, 0.55), 0.7);
        const pitch = 0.022;
        const n = Math.max(1, Math.floor((fx1 - fx0) / pitch));
        const off = (fx1 - fx0 - n * pitch) / 2;
        for (let s = 0; s < n; s++) {
          const sx0 = fx0 + off + s * pitch + 0.005;
          sbox([sx0, sx0 + 0.012], [fy0, fy1], [zf[0], zf[1]], 'body');
        }
      }
      if (hk === 'none' || !CLOSED.includes(kind)) return;
      const cellHgt = fy1 - fy0;
      const zc = zf[1];
      if (hk === 'grip') {
        const mx = (fx0 + fx1) / 2;
        box([mx - 0.03, mx + 0.03], [fy1 - 0.014, fy1], [zc - 0.002, zc + 0.0005], shade(front, 0.35), 0.8, { noShadow: true });
        return;
      }
      if (kind === 'door' || kind === 'glass') {
        // a fogantyú a szomszéd ajtó felőli szélen (páros ajtóknál középen), egyedül álló ajtónál jobb oldalt
        const mid = (cols.length - 1) / 2;
        const right = cols.length === 1 || ci <= mid;
        const hx = right ? fx1 - 0.035 : fx0 + 0.035;
        const len = Math.min(0.16, cellHgt * 0.5);
        // alacsony ajtón a teteje közelében, magas ajtón kb. 1 m-en (a bútor saját rendszerében)
        const hy = cellHgt < 0.5 ? fy1 - 0.05 - len / 2 : Math.min(fy1 - len, Math.max(fy0 + len, 1.0));
        handleAt(hx, hy, true, len, zc, front);
      } else {
        const len = Math.min(0.16, (fx1 - fx0) * 0.5);
        const hy = kind === 'flap' ? fy1 - Math.min(0.05, cellHgt / 3) : cellHgt > 0.3 ? fy1 - 0.08 : (fy0 + fy1) / 2;
        handleAt((fx0 + fx1) / 2, hy, false, len, zc, front);
      }
    });
  });
  return <group>{els}</group>;
}
