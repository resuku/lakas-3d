import type { CabinetForm, FrontCell, FrontKind, FurnKind, FurnPart } from '../model/types';

// Dobozbútor-forma (model/types.ts – CabinetForm): alapformák termékadat nélkül, a cellák egységes alakja és rövid
// leírás a gyorsinfóhoz. A rajzolás a scene/CabinetModel.tsx-ben.

/** Termékforma nélküli alapforma bútortípusonként (a korábbi jelzésszerű modell megjelenése). */
export function defaultCabinetForm(kind: FurnKind, hMm: number): CabinetForm {
  const base: CabinetForm = { base: 'legs', baseH: Math.min(100, hMm * 0.2), leg: 'square', baseColor: 'metal', handle: 'none', src: 'page' };
  const body = hMm - (base.baseH ?? 0);
  switch (kind) {
    case 'nightstand':
      return { ...base, cols: [[{ k: 'drawer', h: 160 }, { k: 'door', h: Math.max(body - 160, 1) }]] };
    case 'shoeCabinet':
      return { ...base, cols: [['flap', 'flap']] };
    case 'sideboard':
      return { ...base, cols: [['door'], ['door'], ['door']] };
    default:
      return { ...base, cols: [['door'], ['door'], ['door'], ['door']] };
  }
}

/** TV-fal elemének alapformája: az alsó elem fém lábazaton, két ajtóval (50 cm felett); a polc nyitott. */
export function defaultPartForm(kind: FurnPart['kind'], wM: number, onFloor: boolean): CabinetForm {
  const doors: FrontCell[][] = wM > 0.5 ? [['door'], ['door']] : [['door']];
  if (kind === 'shelf') return { base: 'none', cols: [['open']], src: 'page' };
  if (kind === 'low' && onFloor) return { base: 'plinth', baseH: 60, setback: 30, baseColor: 'metal', cols: doors, handle: 'none', src: 'page' };
  return { base: 'none', cols: doors, handle: 'none', src: 'page' };
}

export const cellKind = (c: FrontCell): FrontKind => (typeof c === 'string' ? c : c.k);
export const cellH = (c: FrontCell): number => (typeof c === 'string' ? 1 : c.h);

const NAMED: Record<string, string> = { black: '#1d1d1f', brass: '#b08d57', steel: '#c4c6c8', white: '#f2f2f0' };

/** Színnév vagy hex feloldása; 'body' és hiány esetén a test színe, 'metal' a változat fémszíne. */
export function formColor(v: string | undefined, body: string, metal: string): string {
  if (!v || v === 'body') return body;
  if (v === 'metal') return metal;
  return NAMED[v] ?? v;
}

const BASE_LABEL: Record<CabinetForm['base'], string> = { legs: 'lábakon', plinth: 'lábazaton', frame: 'keretes alvázon', wall: 'falra szerelve', none: 'a padlón álló test' };
const KIND_LABEL: Record<FrontKind, [string, string]> = {
  door: ['ajtó', 'ajtó'],
  drawer: ['fiók', 'fiók'],
  flap: ['billenőajtó', 'billenőajtó'],
  open: ['nyitott rekesz', 'nyitott rekesz'],
  glass: ['üvegajtó', 'üvegajtó'],
  slats: ['lamellás betét', 'lamellás betét'],
};
const HANDLE_LABEL: Record<NonNullable<CabinetForm['handle']>, string> = { none: 'fogantyú nélkül', knob: 'gombbal', bar: 'rúdfogantyúval', grip: 'fogóbemetszéssel', slot: 'fogóvájattal' };
const SRC_LABEL: Record<CabinetForm['src'], string> = { photo: 'a termékfotó alapján', page: 'a termékoldal alapján', 'photo+page': 'a termékfotó és -oldal alapján' };

/** Rövid leírás, pl. „lábazaton, 2 tolóajtó, fogóvájattal (a termékfotó alapján)”. */
export function formLabel(f: CabinetForm): string {
  const counts = new Map<FrontKind, number>();
  for (const c of (f.cols ?? []).flat()) counts.set(cellKind(c), (counts.get(cellKind(c)) ?? 0) + 1);
  const fronts = f.sliding ? [`${f.sliding} tolóajtó`] : [...counts].map(([k, n]) => `${n} ${KIND_LABEL[k][n > 1 ? 1 : 0]}`);
  const parts = [BASE_LABEL[f.base], ...fronts, f.handle ? HANDLE_LABEL[f.handle] : '', f.lowerShelf ? 'alsó polccal' : ''].filter(Boolean);
  return `${parts.join(', ')} (${SRC_LABEL[f.src]})`;
}
