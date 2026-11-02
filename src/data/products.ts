import type { ColorSource, CurtainProduct, DoorProduct, DoorStyle, FloorProduct, FurnitureProduct, PaintFamily, PaintProduct, Variant } from '../model/types';
import paints from './products/paints.json';
import floors from './products/floors.json';
import doors from './products/doors.json';
import curtains from './products/curtains.json';
import panels from './products/panels.json';
import furniture from './products/furniture.json';

// Valós termékek a magyar kínálatból (lásd products/*.json `meta` mezője: forrás és ellenőrzés dátuma).
// A képernyőszín közelítés marad: végső döntés előtt fizikai minta kell.

export const PAINT_PRODUCTS = paints.items as PaintProduct[];
export const FLOOR_PRODUCTS = floors.items as FloorProduct[];
/** Fa falpanelek kiemelt falra (festékként kezelve: szín, kód, ár). */
export const WALL_PANELS = panels.items as PaintProduct[];
export const DOOR_PRODUCTS = doors.items as DoorProduct[];
export const CURTAIN_PRODUCTS = curtains.items as CurtainProduct[];
export const FURNITURE_PRODUCTS = furniture.items as FurnitureProduct[];
export const CATALOG_CHECKED = { paints: paints.meta.checkedAt, floors: floors.meta.checkedAt, doors: doors.meta.checkedAt, curtains: curtains.meta.checkedAt, furniture: furniture.meta.checkedAt };

export const PAINT_FAMILIES: { id: PaintFamily; label: string }[] = [
  { id: 'warmWhite', label: 'Meleg fehérek' },
  { id: 'greige', label: 'Greige, taupe' },
  { id: 'sand', label: 'Homok, bézs' },
  { id: 'ochre', label: 'Okker, mustár' },
  { id: 'terracotta', label: 'Barack, agyag, terrakotta' },
  { id: 'brown', label: 'Karamell, barna' },
  { id: 'green', label: 'Zsálya, olíva' },
  { id: 'blueGrey', label: 'Kékesszürke' },
  { id: 'deep', label: 'Mély akcentus' },
];

export const COLOR_SOURCE_LABEL: Record<ColorSource, string> = {
  official: 'gyártói színkód',
  'swatch-image': 'gyártói színmintából',
  'third-party': 'színadatbázisból',
  'photo-sample': 'termékfotóból',
  'color-name': 'színnév alapján',
};

export const DOOR_STYLE_LABEL: Record<DoorStyle, string> = { flat: 'sima', groove: 'vízszintes marás', glass: 'üvegbetétes' };
export const CURTAIN_TYPE_LABEL: Record<CurtainProduct['type'], string> = { blackout: 'sötétítő', dimout: 'fényszűrő', sheer: 'áttetsző' };

export function findPaint(id: string | undefined) {
  return id ? (PAINT_PRODUCTS.find((p) => p.id === id) ?? WALL_PANELS.find((p) => p.id === id)) : undefined;
}

export function findFloor(id: string | undefined) {
  return id ? FLOOR_PRODUCTS.find((p) => p.id === id) : undefined;
}

export function findDoor(id: string | undefined) {
  return id ? DOOR_PRODUCTS.find((p) => p.id === id) : undefined;
}

export function findFurniture(id: string | undefined) {
  return id ? FURNITURE_PRODUCTS.find((p) => p.id === id) : undefined;
}

export function findCurtain(id: string | undefined) {
  return id ? CURTAIN_PRODUCTS.find((p) => p.id === id) : undefined;
}

export interface UsedProduct {
  slot: string;
  label: string;
  paint?: PaintProduct;
  floor?: FloorProduct;
  door?: DoorProduct;
  curtain?: CurtainProduct;
}

/** A változatban hozzárendelt katalógustermékek, felületenként. */
export function usedProducts(v: Variant, roomNames: Record<string, { name: string; walls: Record<string, { name: string }> }>): UsedProduct[] {
  const out: UsedProduct[] = [];
  for (const [slot, id] of Object.entries(v.products ?? {})) {
    let label = slot;
    if (slot === 'wall') label = 'Falszín (lakásszintű)';
    else if (slot === 'ceiling') label = 'Mennyezet';
    else if (slot === 'floor') label = 'Padló';
    else if (slot === 'door') label = 'Beltéri ajtók';
    else if (slot === 'curtain') label = 'Függöny';
    else if (slot === 'sheer') label = 'Függöny – áttetsző réteg';
    else if (slot.startsWith('accent:')) {
      const [roomId, wallId] = slot.slice(7).split('.');
      const r = roomNames[roomId];
      label = `Kiemelt fal – ${r ? `${r.name}, ${r.walls[wallId]?.name ?? wallId}` : slot.slice(7)}`;
    }
    if (slot === 'floor') out.push({ slot, label, floor: findFloor(id) });
    else if (slot === 'door') out.push({ slot, label, door: findDoor(id) });
    else if (slot === 'curtain' || slot === 'sheer') out.push({ slot, label, curtain: findCurtain(id) });
    else out.push({ slot, label, paint: findPaint(id) });
  }
  return out;
}
