// Dekorelemek: jelzésszerű, nem termékhű formák „mutatóba” (növények, képek, dekortárgyak, akusztikus panelek).
// A méret mm-ben (szélesség × mélység × magasság). `mount`: wall = falra; floor = padlóra; surface = bútor tetejére
// (asztal, polc, szekrény) – a padlóra is letehető. Az akusztikus panelekhez katalógustermék rendelhető (products/furniture.json).

export type DecorGroup = 'plant' | 'picture' | 'object' | 'acoustic';

export interface DecorType {
  id: string;
  label: string;
  group: DecorGroup;
  mount: 'wall' | 'floor' | 'surface';
  w: number;
  d: number;
  h: number;
  /** Szín- vagy mintaváltozatok (az első az alapértelmezett). */
  variants?: { id: string; label: string; hex: string }[];
  /** Méretezhető (akusztikus panel): szélesség és magasság lépései (mm). */
  sizes?: { w: number[]; h: number[] };
  note?: string;
  /** A színváltozat melyik bútor-színvilág listával vetendő össze (színfigyelmeztetés): fa / keret, textil / kerámia, fém. */
  fit?: 'wood' | 'sofa' | 'metal';
}

export const DECOR_GROUPS: { id: DecorGroup; label: string }[] = [
  { id: 'plant', label: 'Növények' },
  { id: 'picture', label: 'Képek, tükrök' },
  { id: 'object', label: 'Dekortárgyak' },
  { id: 'acoustic', label: 'Akusztikus falpanelek' },
];

const FRAME = [
  { id: 'fekete', label: 'fekete keret', hex: '#262524' },
  { id: 'tolgy', label: 'tölgy keret', hex: '#b8915f' },
  { id: 'feher', label: 'fehér keret', hex: '#f2f0eb' },
];
const WOOD = [
  { id: 'vtolgy', label: 'világos tölgy', hex: '#c9a77c' },
  { id: 'dio', label: 'dió', hex: '#6b4a33' },
  { id: 'teak', label: 'teak', hex: '#9a6b42' },
  { id: 'fekete', label: 'fekete', hex: '#2b2a28' },
];
const FELT = [
  { id: 'homok', label: 'homok', hex: '#cdbb9c' },
  { id: 'zsalya', label: 'zsálya', hex: '#9da58e' },
  { id: 'terrakotta', label: 'terrakotta', hex: '#a65a3f' },
  { id: 'meleg-szurke', label: 'meleg szürke', hex: '#8f8880' },
];
const CERAMIC = [
  { id: 'krem', label: 'krém', hex: '#ece4d4' },
  { id: 'terrakotta', label: 'terrakotta', hex: '#b5694b' },
  { id: 'zsalya', label: 'zsálya', hex: '#9da58e' },
  { id: 'fekete', label: 'fekete', hex: '#2b2a28' },
];

export const DECOR_TYPES: DecorType[] = [
  // Növények
  { id: 'noveny-nagy', label: 'Nagy levelű szobanövény (monstera)', group: 'plant', mount: 'floor', w: 800, d: 800, h: 1500, variants: CERAMIC },
  { id: 'noveny-fikusz', label: 'Fikusz / hegedűlevelű fa', group: 'plant', mount: 'floor', w: 600, d: 600, h: 1700, variants: CERAMIC },
  { id: 'noveny-olajfa', label: 'Olajfa cserépben', group: 'plant', mount: 'floor', w: 600, d: 600, h: 1400, variants: CERAMIC },
  { id: 'noveny-anyosnyelv', label: 'Anyósnyelv', group: 'plant', mount: 'floor', w: 400, d: 400, h: 900, variants: CERAMIC },
  { id: 'noveny-asztali', label: 'Kis asztali növény', group: 'plant', mount: 'surface', w: 250, d: 250, h: 350, variants: CERAMIC },
  { id: 'noveny-futo', label: 'Futónövény polcra', group: 'plant', mount: 'surface', w: 300, d: 300, h: 450, variants: CERAMIC },
  // Képek, tükrök
  { id: 'kep-50x70', label: 'Kép keretben, 50 × 70', group: 'picture', mount: 'wall', w: 500, d: 25, h: 700, variants: FRAME },
  { id: 'kep-70x100', label: 'Kép keretben, 70 × 100', group: 'picture', mount: 'wall', w: 700, d: 25, h: 1000, variants: FRAME },
  { id: 'kep-negyzet', label: 'Négyzetes kép, 60 × 60', group: 'picture', mount: 'wall', w: 600, d: 25, h: 600, variants: FRAME },
  { id: 'kep-panorama', label: 'Panorámakép, 120 × 40', group: 'picture', mount: 'wall', w: 1200, d: 25, h: 400, variants: FRAME },
  { id: 'kepfal-3', label: 'Képfal, 3 × 30 × 40', group: 'picture', mount: 'wall', w: 1060, d: 20, h: 400, variants: FRAME },
  { id: 'tukor-kerek', label: 'Kerek tükör, ø60', group: 'picture', mount: 'wall', w: 600, d: 25, h: 600, variants: FRAME },
  { id: 'tukor-fali', label: 'Fali tükör, 50 × 120', group: 'picture', mount: 'wall', w: 500, d: 25, h: 1200, variants: FRAME },
  // Dekortárgyak
  { id: 'vaza-pampa', label: 'Padlóváza pampafűvel', group: 'object', mount: 'floor', w: 350, d: 350, h: 1200, variants: CERAMIC },
  { id: 'kosar', label: 'Fonott tárolókosár', group: 'object', mount: 'floor', w: 450, d: 450, h: 450 },
  { id: 'tukor-allo', label: 'Álló tükör (falnak döntve)', group: 'object', mount: 'floor', w: 600, d: 60, h: 1700, variants: FRAME },
  { id: 'lerakoasztal', label: 'Kis lerakóasztal', group: 'object', mount: 'floor', w: 450, d: 450, h: 500, variants: WOOD },
  { id: 'lampas', label: 'Lámpás gyertyával', group: 'object', mount: 'surface', w: 250, d: 250, h: 450, variants: [{ id: 'fekete', label: 'fekete', hex: '#2b2a28' }, { id: 'rez', label: 'sárgaréz', hex: '#b08d57' }] },
  { id: 'vaza-virag', label: 'Váza virággal', group: 'object', mount: 'surface', w: 200, d: 200, h: 450, variants: CERAMIC },
  { id: 'konyvek', label: 'Könyvkupac', group: 'object', mount: 'surface', w: 260, d: 200, h: 150 },
  { id: 'gyertyak', label: 'Gyertyák', group: 'object', mount: 'surface', w: 260, d: 100, h: 220 },
  { id: 'tal', label: 'Asztaldísz-tál', group: 'object', mount: 'surface', w: 350, d: 350, h: 100, variants: CERAMIC },
  { id: 'parnak', label: 'Díszpárnák (kanapéra)', group: 'object', mount: 'surface', w: 900, d: 200, h: 450, variants: FELT },
  { id: 'pled', label: 'Pléd, összehajtva', group: 'object', mount: 'surface', w: 600, d: 400, h: 80, variants: FELT },
  { id: 'falilora', label: 'Falióra', group: 'object', mount: 'wall', w: 400, d: 40, h: 400, variants: [{ id: 'feher', label: 'fehér', hex: '#f2f0eb' }, { id: 'tolgy', label: 'tölgy', hex: '#b8915f' }, { id: 'fekete', label: 'fekete', hex: '#262524' }] },
  { id: 'falipolc', label: 'Falipolc tárgyakkal', group: 'object', mount: 'wall', w: 800, d: 200, h: 250, variants: WOOD },
  { id: 'textil-falikep', label: 'Textil falikép (makramé)', group: 'object', mount: 'wall', w: 500, d: 20, h: 800 },
  { id: 'fogas', label: 'Fogasléc (kabátakasztó)', group: 'object', mount: 'wall', w: 600, d: 60, h: 100, variants: WOOD },
  { id: 'parafatabla', label: 'Parafatábla kerettel', group: 'object', mount: 'wall', w: 900, d: 25, h: 600, variants: FRAME },
  { id: 'labtorlo', label: 'Lábtörlő, 60 × 90', group: 'object', mount: 'floor', w: 900, d: 600, h: 8, variants: [{ id: 'szurkebarna', label: 'szürkésbarna', hex: '#7d7064' }, ...FELT], note: 'Alacsony (legfeljebb 8–10 mm), hogy az ajtó átférjen fölötte.' },
  { id: 'futoszonyeg', label: 'Futószőnyeg, 80 × 200', group: 'object', mount: 'floor', w: 2000, d: 800, h: 8, variants: FELT },
  // Akusztikus falpanelek (méretezhetők; katalógustermék rendelhető hozzájuk)
  {
    id: 'akusztik-lamella',
    label: 'Lamellás akusztikus panel',
    group: 'acoustic',
    mount: 'wall',
    w: 1200,
    d: 22,
    h: 2400,
    variants: WOOD,
    sizes: { w: [600, 1200, 1800, 2400, 3000], h: [2400, 2600, 2750] },
    note: 'MDF lécek fekete PET-filcen, 60 cm-es lapokból; a falszakasz szélességéhez több lap tehető egymás mellé.',
  },
  {
    id: 'akusztik-hatszog',
    label: 'Hatszög akusztikus elemek',
    group: 'acoustic',
    mount: 'wall',
    w: 1000,
    d: 15,
    h: 700,
    variants: [...FELT, { id: 'tolgy', label: 'tölgy', hex: '#b8915f' }],
    sizes: { w: [600, 1000, 1400], h: [500, 700, 1000] },
  },
  {
    id: 'akusztik-filc',
    label: 'Filc akusztikus panel',
    group: 'acoustic',
    mount: 'wall',
    w: 600,
    d: 30,
    h: 1200,
    variants: FELT,
    sizes: { w: [600, 1200, 1800], h: [600, 900, 1200] },
  },
];

for (const t of DECOR_TYPES)
  t.fit = t.variants === FRAME || t.variants === WOOD || t.id === 'falilora' ? 'wood' : t.id === 'lampas' ? 'metal' : t.variants ? 'sofa' : undefined;

export const findDecorType = (id: string) => DECOR_TYPES.find((t) => t.id === id);
