import type { LightSettings } from '../model/types';

export interface SceneDef {
  id: string;
  name: string;
  hint: string;
  settings: LightSettings;
}

const off = { on: false, lm: 2000, K: 3000, dim: 1 };
const accentOff = { on: false, lm: 400, K: 2700, dim: 0.8 };

export const SCENES: SceneDef[] = [
  {
    id: 'day-clear',
    name: 'Nappal – derült',
    hint: 'Október közepe, 13:00. Északi ablaknál nincs direkt nap, csak égboltfény.',
    settings: { sky: 'clear', month: 10, day: 15, hour: 13, ceiling: off, accent: accentOff, ev: 0 },
  },
  {
    id: 'day-overcast',
    name: 'Nappal – borult',
    hint: 'November, déli borult ég: lágy, hideg, árnyékmentes fény.',
    settings: { sky: 'overcast', month: 11, day: 15, hour: 12, ceiling: off, accent: accentOff, ev: 0 },
  },
  {
    id: 'summer-evening',
    name: 'Nyári este',
    hint: 'Június 21., 19:45 – az alacsony nap északnyugat felől besüthet az északi ablakon.',
    settings: { sky: 'clear', month: 6, day: 21, hour: 19.75, ceiling: off, accent: accentOff, ev: 0 },
  },
  {
    id: 'winter-afternoon',
    name: 'Téli délután + lámpa',
    hint: 'December, 15:45, borult: kevés természetes fény, mennyezeti lámpa felkapcsolva.',
    settings: { sky: 'overcast', month: 12, day: 15, hour: 15.75, ceiling: { on: true, lm: 2000, K: 3000, dim: 1 }, accent: accentOff, ev: 0 },
  },
  {
    id: 'evening',
    name: 'Este – általános fény',
    hint: 'Sötét, csak a mennyezeti lámpa (2000 lm, 3000 K).',
    settings: { sky: 'clear', month: 10, day: 15, hour: 21, ceiling: { on: true, lm: 2000, K: 3000, dim: 1 }, accent: accentOff, ev: 0 },
  },
  {
    id: 'mood',
    name: 'Este – hangulatfény',
    hint: 'Mennyezeti lámpa 20%-ra tompítva, meleg kiegészítő lámpák.',
    settings: { sky: 'clear', month: 10, day: 15, hour: 21.5, ceiling: { on: true, lm: 2000, K: 2700, dim: 0.2 }, accent: { on: true, lm: 400, K: 2700, dim: 0.8 }, ev: 0 },
  },
];
