// Tervezési színminták. Képernyős közelítések, nem gyártói festék- vagy termékkódok.

export interface Swatch {
  name: string;
  hex: string;
}

export const COLOR_NOTE = 'A színek képernyős közelítések, nem gyártói kódok. Végső döntés előtt fizikai színminta kell.';

export const PAINTS: Swatch[] = [
  { name: 'Hófehér', hex: '#F7F6F2' },
  { name: 'Tört fehér', hex: '#EFEBE3' },
  { name: 'Meleg fehér', hex: '#ECE4D6' },
  { name: 'Vászon', hex: '#E3D9C8' },
  { name: 'Homok', hex: '#D8C8AE' },
  { name: 'Greige', hex: '#C9BFB1' },
  { name: 'Kavics', hex: '#B5ADA2' },
  { name: 'Galambszürke', hex: '#A9ABA8' },
  { name: 'Púder', hex: '#DCC3BA' },
  { name: 'Agyag', hex: '#C49A80' },
  { name: 'Terrakotta', hex: '#B2715A' },
  { name: 'Zsálya', hex: '#B4BBA4' },
  { name: 'Eukaliptusz', hex: '#93A08F' },
  { name: 'Olíva', hex: '#7E7D5E' },
  { name: 'Ködkék', hex: '#B9C4CB' },
  { name: 'Éjkék', hex: '#3E4B5C' },
  { name: 'Grafit', hex: '#4A4A48' },
];

export const WOOD_TONES: Swatch[] = [
  { name: 'Fehérített tölgy', hex: '#E2D6C4' },
  { name: 'Világos tölgy', hex: '#D9BE96' },
  { name: 'Natúr tölgy', hex: '#C49A6C' },
  { name: 'Mézes tölgy', hex: '#B07D4F' },
  { name: 'Szürkés tölgy', hex: '#A99B8B' },
  { name: 'Sötét dió', hex: '#6B4A33' },
];

export const TILE_TONES: Swatch[] = [
  { name: 'Világos beton', hex: '#C8C4BC' },
  { name: 'Homokkő', hex: '#D6CCBB' },
  { name: 'Középszürke', hex: '#8E8B85' },
  { name: 'Grafit', hex: '#55534F' },
];

export const FABRICS: Swatch[] = [
  { name: 'Fehér voile', hex: '#F4F1EA' },
  { name: 'Len natúr', hex: '#D8CCB8' },
  { name: 'Homok', hex: '#C9B79C' },
  { name: 'Zsálya', hex: '#A9B29B' },
  { name: 'Agyag', hex: '#B98C72' },
  { name: 'Mustár', hex: '#C9A040' },
  { name: 'Éjkék', hex: '#3D4A5E' },
  { name: 'Antracit', hex: '#4C4D4F' },
];

export const DOOR_COLORS: Swatch[] = [
  { name: 'Fehér', hex: '#F3F1EC' },
  { name: 'Tört fehér', hex: '#E9E4DA' },
  { name: 'Greige', hex: '#C2B8AA' },
  { name: 'Világos tölgy', hex: '#CFAE84' },
  { name: 'Natúr tölgy', hex: '#B98F62' },
  { name: 'Grafit', hex: '#4A4A48' },
];
