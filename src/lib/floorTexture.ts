import * as THREE from 'three';
import type { FloorPattern } from '../model/types';
import { hexToHsl, hslCss } from './color';

// Eljárásos padlótextúra a teljes padlófelületre (nem ismétlődő, így nem kell csempézhetőnek lennie).

function rng(seed: number) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

type Ctx = CanvasRenderingContext2D;

function woodBlock(ctx: Ctx, r: () => number, base: { h: number; s: number; l: number }, x: number, y: number, len: number, wid: number, alongX: boolean, px: number, vary = 1) {
  const l = base.l + (r() - 0.5) * 0.09 * vary;
  const s = base.s + (r() - 0.5) * 0.06 * vary;
  const h = base.h + (r() - 0.5) * 0.012 * vary;
  ctx.fillStyle = hslCss(h, s, l);
  if (alongX) ctx.fillRect(x, y, len, wid);
  else ctx.fillRect(x, y, wid, len);
  // erezet
  const lines = 7 + Math.floor(r() * 6);
  for (let i = 0; i < lines; i++) {
    const o = r() * wid;
    const amp = wid * 0.06 * r();
    const ph = r() * 6.28;
    const dark = r() < 0.6;
    ctx.strokeStyle = dark ? `rgba(70,40,15,${0.05 + r() * 0.09})` : `rgba(255,240,215,${0.04 + r() * 0.06})`;
    ctx.lineWidth = px * (0.6 + r() * 1.4);
    ctx.beginPath();
    const steps = 8;
    for (let k = 0; k <= steps; k++) {
      const t = (k / steps) * len;
      const off = Math.min(Math.max(o + Math.sin(ph + (t / len) * 4) * amp, 0), wid);
      const px_ = alongX ? x + t : x + off;
      const py_ = alongX ? y + off : y + t;
      if (k === 0) ctx.moveTo(px_, py_);
      else ctx.lineTo(px_, py_);
    }
    ctx.stroke();
  }
  ctx.strokeStyle = 'rgba(45,28,12,0.38)';
  ctx.lineWidth = px;
  if (alongX) ctx.strokeRect(x, y, len, wid);
  else ctx.strokeRect(x, y, wid, len);
}

/**
 * @param W a padló x mérete (m)
 * @param L a padló z mérete (m)
 * @param dir a hosszanti illesztés iránya
 * @param plank lapméret mm-ben (katalógustermékből); hiányában az alapértelmezett méretek
 * @param aligned a lapok nem eltolva, egy vonalban indulnak (falpanel)
 */
export function makeFloorTexture(
  pattern: FloorPattern,
  tone: string,
  dir: 'x' | 'z',
  W: number,
  L: number,
  plank?: { l: number; w: number },
  aligned = false,
): THREE.CanvasTexture {
  const ppm = Math.min(600, 4096 / Math.max(W, L));
  const cw = Math.round(W * ppm);
  const ch = Math.round(L * ppm);
  const canvas = document.createElement('canvas');
  canvas.width = cw;
  canvas.height = ch;
  const ctx = canvas.getContext('2d')!;
  const r = rng(pattern.length * 977 + Math.round(W * 1000) + Math.round(L * 7));
  const base = hexToHsl(tone);
  const px = 1 / ppm;

  ctx.scale(ppm, ppm); // innentől méterben rajzolunk
  // Helyi rendszer: a "hossz" iránya mindig a helyi x.
  let A = W;
  let B = L;
  if (dir === 'z') {
    ctx.translate(W, 0);
    ctx.rotate(Math.PI / 2);
    A = L;
    B = W;
  }

  if (pattern === 'plank') {
    const pw = plank ? plank.w / 1000 : 0.193;
    const rows = Math.ceil(B / pw);
    for (let i = 0; i < rows; i++) {
      const pl = plank ? plank.l / 1000 : 1.285;
      let x = aligned ? 0 : -r() * pl;
      while (x < A) {
        const len = aligned ? pl : pl * (0.85 + r() * 0.15);
        // falpanelnél egy dekor: a lapok között csak kis eltérés
        woodBlock(ctx, r, base, x, i * pw, len, pw, true, px, aligned ? 0.25 : 1);
        x += len;
      }
    }
  } else if (pattern === 'herringbone') {
    // Halszálka (alapértelmezés 600 × 100 mm); rács: t1 = (w, −w), t2 = (Lb, Lb), majd −45° forgatás.
    const w = plank ? plank.w / 1000 : 0.1;
    const Lb = plank ? plank.l / 1000 : 0.6;
    const R = Math.hypot(A, B) + 1;
    const ni = Math.ceil(R / (w * Math.SQRT2)) + 2;
    const nj = Math.ceil(R / (Lb * Math.SQRT2)) + 2;
    ctx.save();
    ctx.translate(0, B / 2);
    ctx.rotate(-Math.PI / 4);
    for (let i = -ni; i <= ni; i++) {
      for (let j = -nj; j <= nj; j++) {
        const ox = i * w + j * Lb;
        const oy = -i * w + j * Lb;
        woodBlock(ctx, r, base, ox, oy, Lb, w, true, px);
        woodBlock(ctx, r, base, ox + Lb - w, oy + w, Lb, w, false, px);
      }
    }
    ctx.restore();
  } else {
    const ts = plank ? plank.l / 1000 : 0.6;
    const grout = 0.003;
    ctx.fillStyle = hslCss(base.h, base.s * 0.6, Math.min(base.l + 0.08, 0.95));
    ctx.fillRect(0, 0, A, B);
    for (let x = 0; x < A; x += ts) {
      for (let y = 0; y < B; y += ts) {
        ctx.fillStyle = hslCss(base.h, base.s, base.l + (r() - 0.5) * 0.03);
        ctx.fillRect(x + grout, y + grout, ts - grout * 2, ts - grout * 2);
        for (let k = 0; k < 60; k++) {
          ctx.fillStyle = r() < 0.5 ? 'rgba(0,0,0,0.05)' : 'rgba(255,255,255,0.05)';
          ctx.fillRect(x + r() * ts, y + r() * ts, px * 3, px * 3);
        }
      }
    }
  }

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 8;
  return tex;
}
