import * as THREE from 'three';

// Színhűség-mérés (fejlesztői eszköz): a megjelenített kép képpontjai az anyag (katalógus) színéhez mérve.
// A képernyő egy rácsán sugárral megkeresi a látható felületet, kiolvassa a képpontot (3 × 3 átlag), és felületenként
// (címke + anyagszín) összesít. Csak a nézőre nagyjából merőleges felületet veszi (`minFacing`), mert a termékfotó is
// szemből mutatja a terméket. Eredmény: CIEDE2000 színkülönbség és a világosság (L*) eltérése.

type Lab = [number, number, number];

const toLin = (c: number) => (c <= 0.04045 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4));
const toSrgb = (c: number) => (c <= 0.0031308 ? c * 12.92 : 1.055 * Math.pow(c, 1 / 2.4) - 0.055);

/** Lineáris RGB (0–1) → CIE Lab (D65). */
export function linToLab([r, g, b]: [number, number, number]): Lab {
  const X = (0.4124564 * r + 0.3575761 * g + 0.1804375 * b) / 0.95047;
  const Y = 0.2126729 * r + 0.7151522 * g + 0.072175 * b;
  const Z = (0.0193339 * r + 0.119192 * g + 0.9503041 * b) / 1.08883;
  const e = Math.pow(6 / 29, 3);
  const f = (t: number) => (t > e ? Math.cbrt(t) : t / (3 * Math.pow(6 / 29, 2)) + 4 / 29);
  return [116 * f(Y) - 16, 500 * (f(X) - f(Y)), 200 * (f(Y) - f(Z))];
}

export function hexToLin(hex: string): [number, number, number] {
  const n = parseInt(hex.replace('#', ''), 16);
  return [toLin(((n >> 16) & 255) / 255), toLin(((n >> 8) & 255) / 255), toLin((n & 255) / 255)];
}

export function linToHex([r, g, b]: [number, number, number]): string {
  const c = (x: number) => Math.round(Math.min(Math.max(toSrgb(x), 0), 1) * 255);
  return '#' + ((c(r) << 16) | (c(g) << 8) | c(b)).toString(16).padStart(6, '0');
}

const rad = (d: number) => (d * Math.PI) / 180;
const deg = (r: number) => (r * 180) / Math.PI;

/** CIEDE2000 színkülönbség (Sharma–Wu–Dalal 2005). Kb. 1 alatt nem látszik, 2–3 közvetlenül egymás mellett látszik. */
export function deltaE2000([L1, a1, b1]: Lab, [L2, a2, b2]: Lab): number {
  const C1 = Math.hypot(a1, b1);
  const C2 = Math.hypot(a2, b2);
  const Cb7 = Math.pow((C1 + C2) / 2, 7);
  const G = 0.5 * (1 - Math.sqrt(Cb7 / (Cb7 + Math.pow(25, 7))));
  const a1p = (1 + G) * a1;
  const a2p = (1 + G) * a2;
  const C1p = Math.hypot(a1p, b1);
  const C2p = Math.hypot(a2p, b2);
  const hue = (b: number, a: number) => (b === 0 && a === 0 ? 0 : (deg(Math.atan2(b, a)) + 360) % 360);
  const h1p = hue(b1, a1p);
  const h2p = hue(b2, a2p);
  const dLp = L2 - L1;
  const dCp = C2p - C1p;
  let dhp = 0;
  if (C1p * C2p !== 0) {
    dhp = h2p - h1p;
    if (dhp > 180) dhp -= 360;
    else if (dhp < -180) dhp += 360;
  }
  const dHp = 2 * Math.sqrt(C1p * C2p) * Math.sin(rad(dhp / 2));
  const Lbp = (L1 + L2) / 2;
  const Cbp = (C1p + C2p) / 2;
  let hbp = h1p + h2p;
  if (C1p * C2p !== 0) {
    if (Math.abs(h1p - h2p) <= 180) hbp = (h1p + h2p) / 2;
    else hbp = h1p + h2p < 360 ? (h1p + h2p + 360) / 2 : (h1p + h2p - 360) / 2;
  }
  const T = 1 - 0.17 * Math.cos(rad(hbp - 30)) + 0.24 * Math.cos(rad(2 * hbp)) + 0.32 * Math.cos(rad(3 * hbp + 6)) - 0.2 * Math.cos(rad(4 * hbp - 63));
  const dTheta = 30 * Math.exp(-Math.pow((hbp - 275) / 25, 2));
  const Cbp7 = Math.pow(Cbp, 7);
  const Rc = 2 * Math.sqrt(Cbp7 / (Cbp7 + Math.pow(25, 7)));
  const Sl = 1 + (0.015 * Math.pow(Lbp - 50, 2)) / Math.sqrt(20 + Math.pow(Lbp - 50, 2));
  const Sc = 1 + 0.045 * Cbp;
  const Sh = 1 + 0.015 * Cbp * T;
  const Rt = -Math.sin(rad(2 * dTheta)) * Rc;
  return Math.sqrt(Math.pow(dLp / Sl, 2) + Math.pow(dCp / Sc, 2) + Math.pow(dHp / Sh, 2) + Rt * (dCp / Sc) * (dHp / Sh));
}

export interface ProbeOpts {
  /** rácsosztás képpontban (rajzpuffer) */
  step?: number;
  /** a felület normálisa és a nézési irány koszinusza legalább ennyi */
  minFacing?: number;
}

export interface ProbeRow {
  label: string;
  /** az anyag színe (textúránál a textúra átlagszíne × anyagszín) */
  ref: string;
  /** a megjelenített képpontok átlaga */
  got: string;
  dE: number;
  /** világosság-eltérés (L*, + = világosabb a katalógusnál) */
  dL: number;
  /** telítettség-eltérés (C*, + = telítettebb) */
  dC: number;
  /** átlagos szemből-látás (koszinusz) */
  facing: number;
  n: number;
}

const texMeans = new Map<string, [number, number, number] | null>();
/** Textúra átlagszíne lineáris térben (a padló generált textúrája vásznon van). */
function textureMean(t: THREE.Texture): [number, number, number] | null {
  if (texMeans.has(t.uuid)) return texMeans.get(t.uuid)!;
  let out: [number, number, number] | null = null;
  try {
    const img = t.image as CanvasImageSource & { width: number; height: number };
    const c = document.createElement('canvas');
    c.width = c.height = 128;
    const ctx = c.getContext('2d')!;
    ctx.drawImage(img, 0, 0, 128, 128);
    const d = ctx.getImageData(0, 0, 128, 128).data;
    const s = [0, 0, 0];
    for (let i = 0; i < d.length; i += 4) for (let k = 0; k < 3; k++) s[k] += toLin(d[i + k] / 255);
    const n = d.length / 4;
    out = [s[0] / n, s[1] / n, s[2] / n];
  } catch {
    out = null;
  }
  texMeans.set(t.uuid, out);
  return out;
}

function shown(o: THREE.Object3D | null): boolean {
  for (; o; o = o.parent) if (!o.visible) return false;
  return true;
}

function labelOf(o: THREE.Object3D | null): string {
  for (; o; o = o.parent) {
    const t = (o.userData as { inspect?: { title: string } }).inspect?.title;
    if (t) return t;
  }
  return '(névtelen)';
}

/** Az anyag színe lineáris térben; null, ha a felület nem mérhető (fém, világít, átlátszó, nem PBR-anyag). */
function materialRef(m: THREE.Material): [number, number, number] | null {
  const sm = m as THREE.MeshStandardMaterial;
  if (!sm.isMeshStandardMaterial || !m.colorWrite || (m.transparent && m.opacity < 1)) return null;
  if (sm.metalness > 0.5) return null;
  if (sm.emissiveIntensity > 0 && (sm.emissive.r + sm.emissive.g + sm.emissive.b) > 0) return null;
  const c: [number, number, number] = [sm.color.r, sm.color.g, sm.color.b];
  if (!sm.map) return c;
  const t = textureMean(sm.map);
  return t ? [t[0] * c[0], t[1] * c[1], t[2] * c[2]] : null;
}

/** Az első látható felület a képpontban (szellemfal, rejtett elem és nem háló átugorva). */
function firstHit(ray: THREE.Raycaster, scene: THREE.Scene) {
  for (const h of ray.intersectObject(scene, true)) {
    const mesh = h.object as THREE.Mesh;
    if (!mesh.isMesh || !shown(mesh)) continue;
    const m = (Array.isArray(mesh.material) ? mesh.material[h.face?.materialIndex ?? 0] : mesh.material) as THREE.Material;
    if (!m.colorWrite) continue;
    return { h, mesh, m };
  }
  return null;
}

export function probeColors(gl: THREE.WebGLRenderer, scene: THREE.Scene, camera: THREE.Camera, opts: ProbeOpts = {}): ProbeRow[] {
  const step = opts.step ?? 16;
  const minFacing = opts.minFacing ?? 0.85;
  gl.render(scene, camera);
  const ctx = gl.getContext();
  const W = ctx.drawingBufferWidth;
  const H = ctx.drawingBufferHeight;
  const buf = new Uint8Array(W * H * 4);
  ctx.readPixels(0, 0, W, H, ctx.RGBA, ctx.UNSIGNED_BYTE, buf);
  const px = (x: number, y: number) => {
    const i = ((H - 1 - y) * W + x) * 4;
    return [toLin(buf[i] / 255), toLin(buf[i + 1] / 255), toLin(buf[i + 2] / 255)];
  };
  const ray = new THREE.Raycaster();
  const ndc = new THREE.Vector2();
  const cast = (x: number, y: number) => {
    ndc.set((x / W) * 2 - 1, -((y / H) * 2 - 1));
    ray.setFromCamera(ndc, camera);
    return firstHit(ray, scene);
  };
  const nrm = new THREE.Vector3();
  const groups = new Map<string, { label: string; ref: [number, number, number]; sum: number[]; facing: number; n: number }>();
  for (let y = step / 2; y < H - 2; y += step) {
    for (let x = step / 2; x < W - 2; x += step) {
      const hit = cast(x, y);
      if (!hit || !hit.h.face) continue;
      const ref = materialRef(hit.m);
      if (!ref) continue;
      nrm.copy(hit.h.face.normal).transformDirection(hit.mesh.matrixWorld);
      const facing = Math.abs(nrm.dot(ray.ray.direction));
      if (facing < minFacing) continue;
      // él közelében kevert a képpont: a szomszédos képpontok is ugyanarra a felületre essenek
      if ([[-3, 0], [3, 0], [0, -3], [0, 3]].some(([dx, dy]) => cast(x + dx, y + dy)?.mesh !== hit.mesh)) continue;
      const label = labelOf(hit.mesh);
      const key = `${label}|${ref.map((v) => v.toFixed(4)).join(',')}`;
      const g = groups.get(key) ?? { label, ref, sum: [0, 0, 0], facing: 0, n: 0 };
      for (let dy = -1; dy <= 1; dy++)
        for (let dx = -1; dx <= 1; dx++) {
          const p = px(Math.round(x) + dx, Math.round(y) + dy);
          for (let k = 0; k < 3; k++) g.sum[k] += p[k] / 9;
        }
      g.facing += facing;
      g.n++;
      groups.set(key, g);
    }
  }
  return [...groups.values()]
    .map((g) => {
      const got: [number, number, number] = [g.sum[0] / g.n, g.sum[1] / g.n, g.sum[2] / g.n];
      const a = linToLab(g.ref);
      const b = linToLab(got);
      const r1 = (v: number) => Math.round(v * 10) / 10;
      return {
        label: g.label,
        ref: linToHex(g.ref),
        got: linToHex(got),
        dE: r1(deltaE2000(a, b)),
        dL: r1(b[0] - a[0]),
        dC: r1(Math.hypot(b[1], b[2]) - Math.hypot(a[1], a[2])),
        facing: Math.round((g.facing / g.n) * 100) / 100,
        n: g.n,
      };
    })
    .sort((p, q) => q.n - p.n);
}
