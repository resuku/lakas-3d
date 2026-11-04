import * as THREE from 'three';
import { useEffect, useState } from 'react';
import { useStore } from '../store';

// Helyi fotótextúrák (scripts/textures/prep_textures.py → public/textures-local/): termékfotókból, csak helyi
// használatra – gitignore-olt, a kirakott oldalon nincs, ott a sima színek maradnak. A néző kikapcsolhatja
// (store.photoTextures). Padló: valódi lapok a dekorképből (lib/floorTexture.ts); fa: ismétlődő minta valós méretben
// (Box `map` + `mapSize`), ajtón és dobozbútoron.

export interface FloorEntry {
  kind: 'floor';
  file: string;
  /** lapok a dekorképen (x, y, w, h képpont), az erezet a kép x irányában */
  planks: [number, number, number, number][];
  meanHex: string;
}
export interface WoodEntry {
  kind: 'wood';
  file: string;
  /** a minta valós mérete (m) */
  size: [number, number];
  /** az erezet iránya a mintán (tájékoztató) */
  grain: 'x' | 'y';
  meanHex: string;
}
type Entry = FloorEntry | WoodEntry;

export interface FloorPhoto {
  img: HTMLImageElement;
  planks: [number, number, number, number][];
}
export interface WoodTex {
  tex: THREE.Texture;
  /** egy ismétlés valós mérete (m), u (vízszintes) és v (függőleges) irányban */
  size: [number, number];
}
export interface LocalTextures {
  floors: Record<string, FloorPhoto>;
  woods: Record<string, WoodTex>;
}

const BASE = `${import.meta.env.BASE_URL}textures-local/`;
let loading: Promise<LocalTextures | null> | null = null;
let loaded: LocalTextures | null = null;

const loadImage = (file: string) =>
  new Promise<HTMLImageElement>((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = BASE + file;
  });

async function loadAll(): Promise<LocalTextures | null> {
  try {
    const r = await fetch(BASE + 'index.json');
    // a fejlesztői szerver hiányzó fájlra az index.html-t adja
    if (!r.ok || !(r.headers.get('content-type') ?? '').includes('json')) return null;
    const items = ((await r.json()) as { items?: Record<string, Entry> }).items ?? {};
    const out: LocalTextures = { floors: {}, woods: {} };
    await Promise.all(
      Object.entries(items).map(async ([id, e]) => {
        const img = await loadImage(e.file).catch(() => null);
        if (!img) return;
        if (e.kind === 'floor') out.floors[id] = { img, planks: e.planks };
        else {
          const tex = new THREE.Texture(img);
          tex.colorSpace = THREE.SRGBColorSpace;
          tex.wrapS = tex.wrapT = THREE.MirroredRepeatWrapping;
          tex.anisotropy = 8;
          tex.needsUpdate = true;
          // a minta úgy kerül a felületre, ahogy a képen áll (u: vízszintes, v: függőleges): a bútorfront mintája
          // vízszintes, az ajtóé függőleges erezetű
          out.woods[id] = { tex, size: e.size };
        }
      }),
    );
    return Object.keys(out.floors).length || Object.keys(out.woods).length ? out : null;
  } catch {
    return null;
  }
}

/** A betöltött helyi textúrák (null: nincsenek, vagy a néző kikapcsolta). */
export function useLocalTextures(): LocalTextures | null {
  const on = useStore((s) => s.photoTextures);
  const [tx, setTx] = useState<LocalTextures | null>(loaded);
  useEffect(() => {
    let live = true;
    loading ??= loadAll().then((t) => (loaded = t));
    loading.then((t) => live && setTx(t));
    return () => {
      live = false;
    };
  }, []);
  return on ? tx : null;
}

/** Van-e helyi textúra (a kapcsoló megjelenítéséhez, a néző beállításától függetlenül) és hány termékhez. */
export function useLocalTextureCount(): number {
  const [n, setN] = useState(loaded ? Object.keys(loaded.floors).length + Object.keys(loaded.woods).length : 0);
  useEffect(() => {
    let live = true;
    loading ??= loadAll().then((t) => (loaded = t));
    loading.then((t) => live && setN(t ? Object.keys(t.floors).length + Object.keys(t.woods).length : 0));
    return () => {
      live = false;
    };
  }, []);
  return n;
}
