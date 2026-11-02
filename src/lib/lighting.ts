// Fényjelenet-számítás fizikai közelítő mértékegységekben:
// napfény lux, égbolt- és ablakfény luminancia (cd/m²), lámpák lumen → kandela.
// A valós idejű megjelenítés nem számol többszörös visszaverődést; a szórt fényt
// egy félgömbfény pótolja. A jelenetek egymáshoz viszonyítva összevethetők,
// abszolút fényerőként nem.

import * as THREE from 'three';
import type { LightSettings, Room } from '../model/types';
import { kelvinColor } from './color';
import { compass, mm, roomDims } from './geom';
import { sunPosition } from './sun';

const YEAR = 2026;
/** Az ablak felületi fényének aránya az égbolt-luminanciához (üveg, keret, takarás). */
export const WINDOW_FACTOR = 0.6;

export interface LightingResult {
  sunAlt: number;
  sunAz: number;
  sunDir: THREE.Vector3;
  sunLux: number;
  sunColor: THREE.Color;
  sunInFront: boolean;
  skyL: number;
  windowColor: THREE.Color;
  zenith: THREE.Color;
  horizon: THREE.Color;
  ground: THREE.Color;
  hemiI: number;
  eDay: number;
  eLamps: number;
  exposure: number;
}

function clamp01(x: number) {
  return Math.min(Math.max(x, 0), 1);
}

/** @param lampLm a helyiség bekapcsolt lámpáinak pillanatnyi összes fényárama (lm), lásd roomLampLm */
export function computeLighting(room: Room, ls: LightSettings, lampLm: number): LightingResult {
  const { W, L, H } = roomDims(room);
  const floorArea = W * L;
  const { alt, az } = sunPosition(YEAR, ls.month, ls.day, ls.hour);
  const { N, E } = compass(room);
  const ar = (alt * Math.PI) / 180;
  const zr = (az * Math.PI) / 180;
  const sunDir = N.clone()
    .multiplyScalar(Math.cos(zr) * Math.cos(ar))
    .add(E.clone().multiplyScalar(Math.sin(zr) * Math.cos(ar)))
    .add(new THREE.Vector3(0, Math.sin(ar), 0))
    .normalize();
  const sinAlt = Math.max(Math.sin(ar), 0);

  // Direkt napfény (derült égbolt, légtömeg szerinti csillapítás)
  let sunLux = 0;
  if (ls.sky === 'clear' && alt > 0) sunLux = 128000 * Math.exp(-0.21 / Math.max(sinAlt, 0.01));
  // Ablaktalan helyiségbe (előszoba, közlekedő) nem süt be a nap: a szomszéd helyiségek
  // nincsenek modellezve, így a nyílásokon át tévesen bejutna.
  const hasWindow = room.openings.some((o) => o.kind === 'window');
  if (!hasWindow) sunLux = 0;
  const sunColor = kelvinColor(1900 + 3600 * (1 - Math.exp(-Math.max(alt, 0) / 12)));

  // Égbolt-luminancia az ablak felől (szürkület: −6°…0°)
  const day0 = ls.sky === 'clear' ? 1500 : 600;
  const dayK = ls.sky === 'clear' ? 6000 : 5000;
  let skyL: number;
  if (alt > 0) skyL = day0 + dayK * sinAlt;
  else if (alt > -6) skyL = Math.max(day0 * Math.pow((alt + 6) / 6, 2.2), 0.3);
  else skyL = 0.3; // városi égbolt éjjel

  const twilight = clamp01((alt + 4) / 14);
  const windowK = ls.sky === 'clear' ? 3600 + (9000 - 3600) * twilight : 4800 + (6800 - 4800) * twilight;
  const windowColor = kelvinColor(windowK);

  const zenith = (ls.sky === 'clear' ? new THREE.Color('#5d8fd6') : new THREE.Color('#c5cad0')).multiplyScalar(skyL * 0.8);
  const horizon = (ls.sky === 'clear'
    ? new THREE.Color('#c9dcf0').lerp(new THREE.Color('#f2b27c'), 1 - twilight)
    : new THREE.Color('#dfe2e5')
  ).multiplyScalar(skyL * 1.1);
  if (alt <= -6) {
    zenith.set('#0b1630').multiplyScalar(0.05);
    horizon.set('#3a2d2a').multiplyScalar(0.3);
  }
  const ground = new THREE.Color('#6b6a63').multiplyScalar((skyL + sunLux / Math.PI * 0.08) * 0.25);

  // Átlagos megvilágítás: az ablakon belépő fényáram (π·L·A) elosztva a belső felületeken.
  const surfaces = 2 * floorArea + 2 * (W + L) * H;
  const winArea = room.openings
    .filter((o) => o.kind === 'window' || o.borrowLight)
    .reduce((a, o) => a + mm(o.width.v) * mm(o.height.v) * (o.kind === 'window' ? 1 : (o.borrowLight ?? 0)), 0);
  const eDay = (Math.PI * skyL * WINDOW_FACTOR * winArea * 1.3) / surfaces;

  const eLamps = (lampLm * 0.5) / floorArea;

  // Expozíció az átlagos megvilágításhoz; 300 lux alatt csak részleges adaptáció,
  // így az esti, tompított jelenet sötétebb is marad.
  const eRef = Math.max(eDay + eLamps, 3);
  const exposure = (1.8 / eRef) * Math.min(1, Math.pow(eRef / 300, 0.25)) * Math.pow(2, ls.ev);

  const sunInFront =
    sunLux > 0 &&
    room.openings.some((o) => {
      if (o.kind !== 'window') return false;
      const out = { z0: new THREE.Vector3(0, 0, -1), z1: new THREE.Vector3(0, 0, 1), x0: new THREE.Vector3(-1, 0, 0), x1: new THREE.Vector3(1, 0, 0) }[o.wall];
      return sunDir.dot(out) > 0.05;
    });

  return {
    sunAlt: alt,
    sunAz: az,
    sunDir,
    sunLux,
    sunColor,
    sunInFront,
    skyL,
    windowColor,
    zenith,
    horizon,
    ground,
    // ablaktalan helyiségben a beszűrődő fény csak szórt fényként jelenik meg, ezért ott ez viszi a teljes részt
    hemiI: eDay * (hasWindow ? 0.6 : 1.8) + eLamps * 0.35,
    eDay,
    eLamps,
    exposure,
  };
}

export function formatHour(h: number) {
  const hh = Math.floor(h);
  const m = Math.round((h - hh) * 60);
  return `${String(hh).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
}
