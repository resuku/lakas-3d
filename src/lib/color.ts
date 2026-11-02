import * as THREE from 'three';

/** Színhőmérséklet (K) → sRGB szín (Tanner Helland közelítés). */
export function kelvinColor(K: number): THREE.Color {
  const t = Math.min(Math.max(K, 1000), 40000) / 100;
  let r: number;
  let g: number;
  let b: number;
  if (t <= 66) {
    r = 255;
    g = 99.4708025861 * Math.log(t) - 161.1195681661;
    b = t <= 19 ? 0 : 138.5177312231 * Math.log(t - 10) - 305.0447927307;
  } else {
    r = 329.698727446 * Math.pow(t - 60, -0.1332047592);
    g = 288.1221695283 * Math.pow(t - 60, -0.0755148492);
    b = 255;
  }
  const c = (x: number) => Math.min(Math.max(x, 0), 255) / 255;
  return new THREE.Color().setRGB(c(r), c(g), c(b), THREE.SRGBColorSpace);
}

export function hexToHsl(hex: string) {
  const c = new THREE.Color(hex);
  const hsl = { h: 0, s: 0, l: 0 };
  c.getHSL(hsl, THREE.SRGBColorSpace);
  return hsl;
}

export function hslCss(h: number, s: number, l: number) {
  const cl = (x: number) => Math.min(Math.max(x, 0), 1);
  return `hsl(${(h * 360).toFixed(1)} ${(cl(s) * 100).toFixed(1)}% ${(cl(l) * 100).toFixed(1)}%)`;
}
