import type { DecorItem, FurnColor } from '../model/types';
import { DEFAULT_VARIANTS } from './variants';

// Aljavaslatok: a kiemelt J-javaslatokhoz (most J1–J3) öt-öt változat, amely megtartja a fő szín- és anyagirányt
// (falak, padló, ajtók, függöny), de más bútorlehetőséget, terméket és dekort ad. A termék a változat saját rangsorából
// jön (lib/furnitureSets.ts – rankSlot: 0 = a legjobban illő, 1–3 = alternatívák), a dekor színváltozata 'auto' esetén a
// változat bútor-színvilágához legjobban illő. Javaslatok, nem döntések.

export interface SubTheme {
  letter: string;
  title: string;
  note: string;
  /** A bútorlehetőségek (data/choices.ts); a többi bútorcsoport az alapértékén. */
  choices: Record<string, string>;
  /** Termékhelyenként: szám = a rangsor helye, szöveg = termékazonosító. A többi a javaslat alapbútora. */
  picks?: Record<string, number | string>;
  /** Helyőrző bútor színszerepe (spec id → szerep), ha eltér az alapértéktől. */
  colors?: Record<string, FurnColor>;
  /**
   * Előre elrendezett dekor (a helyiség saját rendszerében, mm); variant: 'auto' = a színvilághoz legjobban illő.
   * `prefer`: kedvelt színváltozatok sorrendben – az első, amely a változathoz jól megy (vagy elmegy); különben 'auto'.
   */
  decor: (Omit<DecorItem, 'id' | 'origin'> & { prefer?: string[] })[];
}

export interface SubVariant extends SubTheme {
  id: string;
  parent: string;
  name: string;
}

export const SUB_THEMES: SubTheme[] = [
  {
    letter: 'A',
    title: 'Klasszikus étkező',
    note: 'Egyenes kanapé puffal, alacsony TV-szekrény, kör asztal négy székkel; a dolgozó ajtaja mellett tálaló, fölötte kerek tükör, rajta kis növény. A dolgozó felőli fal végén nagy kép (a nappali hosszú nézetének végpontja). A dolgozóban akusztikus lamella a szék mögött és keskeny könyvespolc az ablaknál; az előszobában cipősszekrény kerek tükörrel, szemközt fogasléc, a bejárat előtt lábtörlő, a közlekedőben képsor.',
    choices: { 'nappali-etkezo-tarolo': 'talalo', 'dolgozo-sarok': 'konyvespolc', 'eloszoba-tarolo': 'cipos' },
    picks: { 'nappali.szek': 1, 'nappali.szonyeg': 1 },
    decor: [
      { type: 'tukor-kerek', roomId: 'nappali', wall: 'z0', a: 620, y: 1000, variant: 'auto', prefer: ['tolgy'] },
      { type: 'noveny-asztali', roomId: 'nappali', x: 1000, z: 200, y: 800, variant: 'auto', prefer: ['zsalya'] },
      { type: 'kep-70x100', roomId: 'nappali', wall: 'z0', a: 2770, y: 1050, variant: 'auto' },
      { type: 'vaza-virag', roomId: 'nappali', x: 1720, z: 2050, y: 760, variant: 'auto' },
      { type: 'akusztik-lamella', roomId: 'dolgozo', wall: 'x0', a: 1500, y: 0, w: 1800, h: 2400, variant: 'auto' },
      { type: 'tukor-kerek', roomId: 'eloszoba', wall: 'z0', a: 500, y: 1150, variant: 'auto', prefer: ['tolgy'] },
      { type: 'fogas', roomId: 'eloszoba', wall: 'z1', a: 480, y: 1700, variant: 'auto' },
      { type: 'labtorlo', roomId: 'eloszoba', x: 340, z: 800, y: 0, rot: 90, variant: 'auto' },
      { type: 'kepfal-3', roomId: 'kozlekedo', wall: 'x1', a: 950, y: 1350, variant: 'auto' },
    ],
  },
  {
    letter: 'B',
    title: 'Társasjáték-est',
    note: 'Az étkező felé forduló L kanapé (térelválasztó nélkül), TV-fal; bővített asztal pad + két szék, a sarokban társasjáték-polc, a térelválasztó helyén zsúrkocsi. Az étkező hosszú falán, a pad mögött képsor. A dolgozóban félsziget sarokasztal, parafatábla és falipolc; az előszobában ülőpad, fölötte fogasléc, szemközt fali tükör.',
    choices: {
      'nappali-kanape': 'chaise-etk',
      'nappali-tv': 'tvfal',
      'nappali-asztal': 'bovitett',
      'nappali-terelvalaszto': 'none',
      'nappali-etkezo-tarolo': 'polc',
      'nappali-etkezo-ules': 'pad',
      'nappali-zsurkocsi': 'van',
      'dolgozo-asztal': 'sziget',
      'eloszoba-tarolo': 'pad',
    },
    picks: { 'nappali.kanape-chaise': 1, 'nappali.tvfal': 1, 'nappali.szek': 3, 'dolgozo.asztal-sziget': 1 },
    decor: [
      { type: 'kepfal-3', roomId: 'nappali', wall: 'x0', a: 2050, y: 1250, variant: 'auto' },
      { type: 'noveny-futo', roomId: 'nappali', x: 405, z: 195, y: 1470, variant: 'auto', prefer: ['terrakotta'] },
      { type: 'gyertyak', roomId: 'nappali', x: 220, z: 3550, y: 800 },
      { type: 'tal', roomId: 'nappali', x: 1720, z: 2050, y: 760, variant: 'auto', prefer: ['terrakotta', 'fekete'] },
      { type: 'parafatabla', roomId: 'dolgozo', wall: 'x0', a: 1400, y: 1100, variant: 'auto', prefer: ['tolgy'] },
      { type: 'falipolc', roomId: 'dolgozo', wall: 'x0', a: 2600, y: 1500, variant: 'auto' },
      { type: 'fogas', roomId: 'eloszoba', wall: 'z0', a: 500, y: 1550, variant: 'auto' },
      { type: 'tukor-fali', roomId: 'eloszoba', wall: 'z1', a: 480, y: 600, variant: 'auto' },
      { type: 'labtorlo', roomId: 'eloszoba', x: 340, z: 800, y: 0, rot: 90, variant: 'auto' },
    ],
  },
  {
    letter: 'C',
    title: 'Zöld nappali',
    note: 'Erkély felé forduló chaise, alacsony TV-szekrény, kör asztal; fa tálaló, fölötte négyzetes kép. Növények: nagy levelű a térelválasztó étkező felőli oldalán (árnyéktűrő fajta kell), olajfa az erkélyajtó melletti fix ablakrésznél. A dolgozóban olvasófotel lerakóasztallal, két filc akusztikus panel a szék mögött; az előszobában konzolasztal képpel.',
    choices: { 'nappali-kanape': 'chaise', 'nappali-etkezo-tarolo': 'talalo', 'dolgozo-sarok': 'fotel', 'eloszoba-konzol': 'van' },
    picks: { 'nappali.kanape-chaise': 2, 'nappali.tvszekreny': 2, 'nappali.szonyeg': 2, 'nappali.szek': 2 },
    colors: { talalo: 'wood' },
    decor: [
      { type: 'kep-negyzet', roomId: 'nappali', wall: 'z0', a: 620, y: 1050, variant: 'auto', prefer: ['tolgy'] },
      { type: 'noveny-nagy', roomId: 'nappali', x: 500, z: 3500, y: 0, variant: 'auto', prefer: ['terrakotta', 'zsalya'] },
      { type: 'noveny-olajfa', roomId: 'nappali', x: 1150, z: 7450, y: 0, variant: 'auto', prefer: ['terrakotta', 'zsalya'] },
      { type: 'noveny-futo', roomId: 'nappali', x: 250, z: 200, y: 800, variant: 'auto', prefer: ['zsalya', 'terrakotta'] },
      { type: 'vaza-virag', roomId: 'nappali', x: 1720, z: 2050, y: 760, variant: 'auto' },
      { type: 'lerakoasztal', roomId: 'dolgozo', x: 330, z: 2350, y: 0, variant: 'auto', prefer: ['teak', 'vtolgy'] },
      { type: 'noveny-asztali', roomId: 'dolgozo', x: 1900, z: 2800, y: 750, variant: 'auto', prefer: ['terrakotta'] },
      { type: 'akusztik-filc', roomId: 'dolgozo', wall: 'x0', a: 1100, y: 900, variant: 'auto', prefer: ['zsalya'] },
      { type: 'akusztik-filc', roomId: 'dolgozo', wall: 'x0', a: 1750, y: 900, variant: 'auto', prefer: ['zsalya'] },
      { type: 'kep-50x70', roomId: 'eloszoba', wall: 'z0', a: 2190, y: 1100, variant: 'auto', prefer: ['tolgy'] },
      { type: 'labtorlo', roomId: 'eloszoba', x: 340, z: 800, y: 0, rot: 90, variant: 'auto' },
    ],
  },
  {
    letter: 'D',
    title: 'Galéria',
    note: 'Egyenes kanapé, TV-fal, kör asztal, zsúrkocsi; a képek viszik a hangulatot: képsor az étkező hosszú falán, panorámakép a közlekedő felőli falon, nagy kép a dolgozó felőli falon. A dolgozóban falipolc és nagy kép, az előszobában cipősszekrény, kerek tükör és konzolasztal képpel, a közlekedőben panorámakép.',
    choices: { 'nappali-tv': 'tvfal', 'nappali-zsurkocsi': 'van', 'eloszoba-tarolo': 'cipos', 'eloszoba-konzol': 'van' },
    picks: { 'nappali.kanape': 1, 'nappali.tvfal': 2, 'nappali.szonyeg': 3 },
    decor: [
      { type: 'kepfal-3', roomId: 'nappali', wall: 'x0', a: 1500, y: 1300, variant: 'auto' },
      { type: 'kep-panorama', roomId: 'nappali', wall: 'x1', a: 2360, y: 1450, variant: 'auto' },
      { type: 'kep-70x100', roomId: 'nappali', wall: 'z0', a: 650, y: 1000, variant: 'auto' },
      { type: 'lampas', roomId: 'nappali', x: 220, z: 3550, y: 800, variant: 'auto' },
      { type: 'falipolc', roomId: 'dolgozo', wall: 'x0', a: 1500, y: 1500, variant: 'auto' },
      { type: 'kep-70x100', roomId: 'dolgozo', wall: 'x0', a: 2600, y: 1000, variant: 'auto' },
      { type: 'tukor-kerek', roomId: 'eloszoba', wall: 'z0', a: 500, y: 1150, variant: 'auto' },
      { type: 'kep-50x70', roomId: 'eloszoba', wall: 'z0', a: 2190, y: 1100, variant: 'auto' },
      { type: 'kep-panorama', roomId: 'kozlekedo', wall: 'x1', a: 950, y: 1400, variant: 'auto' },
    ],
  },
  {
    letter: 'E',
    title: 'Letisztult',
    note: 'Kevés, nagyobb elem: egyenes kanapé, alacsony TV-szekrény, kör asztal, tálaló fali tükörrel, egy nagy növény a térelválasztó nappali felőli oldalán. A dolgozóban sarokasztal az ajtó mellett, könyvespolc az ablaknál és két filcpanel; az előszobában csak cipősszekrény tükörrel.',
    choices: { 'nappali-etkezo-tarolo': 'talalo', 'dolgozo-asztal': 'sarok', 'dolgozo-sarok': 'konyvespolc', 'eloszoba-tarolo': 'cipos' },
    picks: { 'nappali.tvszekreny': 1, 'dolgozo.asztal': 1 },
    decor: [
      { type: 'tukor-fali', roomId: 'nappali', wall: 'z0', a: 620, y: 900, variant: 'auto' },
      { type: 'noveny-anyosnyelv', roomId: 'nappali', x: 1300, z: 4200, y: 0, variant: 'auto' },
      { type: 'akusztik-filc', roomId: 'dolgozo', wall: 'x0', a: 1200, y: 1000, variant: 'auto', prefer: ['meleg-szurke'] },
      { type: 'akusztik-filc', roomId: 'dolgozo', wall: 'x0', a: 1850, y: 1000, variant: 'auto', prefer: ['meleg-szurke'] },
      { type: 'tukor-fali', roomId: 'eloszoba', wall: 'z0', a: 500, y: 1050, variant: 'auto' },
    ],
  },
];

/** Az aljavaslatokkal bővített (a menüben kiemelt) J-javaslatok; a sorrendjük a scripts/gen/numbering.py-ban is ez. */
export const SUB_PARENTS = ['j5-melyzold', 'j17-kontraszt', 'j18-kakao'];

// az azonosító a változat azonosítójának régi számát őrzi (j5-a), a név a megjelenített számot (J1-A)
export const SUB_VARIANTS: SubVariant[] = SUB_PARENTS.flatMap((parent) => {
  const short = DEFAULT_VARIANTS.find((v) => v.id === parent)?.name.split(' – ')[0] ?? parent;
  return SUB_THEMES.map((t) => ({ ...t, id: `${parent.split('-')[0]}-${t.letter.toLowerCase()}`, parent, name: `${short}-${t.letter} – ${t.title}` }));
});

/** Rövid név (J1-A) az azonosítóból vagy a dekor `origin` mezőjéből ('sub:j5-a'). */
export const subShortName = (id: string) => SUB_VARIANTS.find((s) => s.id === id.replace(/^sub:/, ''))?.name.split(' – ')[0] ?? id.replace(/^sub:/, '');

export const subVariantsOf = (variantId: string) => SUB_VARIANTS.filter((s) => s.parent === variantId);
export const findSubVariant = (id: string | null | undefined) => (id ? SUB_VARIANTS.find((s) => s.id === id) : undefined);
