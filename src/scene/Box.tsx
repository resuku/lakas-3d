import * as THREE from 'three';
import { useEffect, useMemo, type ReactNode } from 'react';

export interface BoxProps {
  x: [number, number];
  y: [number, number];
  z: [number, number];
  color: string;
  rough?: number;
  metal?: number;
  opacity?: number;
  emissive?: string;
  emissiveIntensity?: number;
  noShadow?: boolean;
  /** Felületminta (pl. helyi fotótextúra); a szín ilyenkor szorzó (fehér = a minta színe). */
  map?: THREE.Texture | null;
  /** Egy mintaismétlés valós mérete (m): u a lap vízszintes, v a függőleges iránya (felül: u = x, v = z). */
  mapSize?: [number, number];
  children?: ReactNode;
}

/**
 * Doboz valós méretű UV-vel: a BoxGeometry lapjain (sorrend: +x, −x, +y, −y, +z, −z) az UV 0..1 helyett méterben /
 * mintaméretben, a doboz helyéből számolt eltolással, hogy a szomszédos panelek mintája ne ismétlődjön egyformán.
 */
function texturedBox(sx: number, sy: number, sz: number, size: [number, number], seed: number) {
  const g = new THREE.BoxGeometry(sx, sy, sz);
  const uv = g.attributes.uv as THREE.BufferAttribute;
  const faces: [number, number][] = [
    [sz, sy],
    [sz, sy],
    [sx, sz],
    [sx, sz],
    [sx, sy],
    [sx, sy],
  ];
  const rnd = (k: number) => {
    const s = Math.sin(seed * 12.9898 + k * 78.233) * 43758.5453;
    return s - Math.floor(s);
  };
  for (let f = 0; f < 6; f++) {
    // a mintánál kisebb lap egy ismétlésen belül marad (nincs rajta tükörvonal); legfeljebb 25 %-kal nagyobb lapra a minta
    // nyújtva kerül, a még nagyobb véletlen eltolással ismétlődik
    const fit = (r: number) => (r > 1 && r <= 1.25 ? 1 : r);
    const ru = fit(faces[f][0] / size[0]);
    const rv = fit(faces[f][1] / size[1]);
    const ou = ru <= 1 ? rnd(2 * f) * (1 - ru) : rnd(2 * f);
    const ov = rv <= 1 ? rnd(2 * f + 1) * (1 - rv) : rnd(2 * f + 1);
    for (let i = 0; i < 4; i++) {
      const k = f * 4 + i;
      uv.setXY(k, uv.getX(k) * ru + ou, uv.getY(k) * rv + ov);
    }
  }
  uv.needsUpdate = true;
  return g;
}

/** Tengelyre igazított doboz, a sarokkoordinátáival megadva (m). */
export function Box({ x, y, z, color, rough = 0.8, metal = 0, opacity, emissive, emissiveIntensity, noShadow, map, mapSize }: BoxProps) {
  const transparent = opacity !== undefined && opacity < 1;
  const sx = Math.max(x[1] - x[0], 1e-4);
  const sy = Math.max(y[1] - y[0], 1e-4);
  const sz = Math.max(z[1] - z[0], 1e-4);
  const seed = x[0] * 7.1 + y[0] * 3.3 + z[0] * 5.7;
  const su = mapSize?.[0] ?? 1;
  const sv = mapSize?.[1] ?? 1;
  const geom = useMemo(() => (map ? texturedBox(sx, sy, sz, [su, sv], seed) : null), [map, sx, sy, sz, su, sv, seed]);
  useEffect(() => () => geom?.dispose(), [geom]);
  return (
    <mesh
      key={geom ? 'tex' : 'plain'}
      position={[(x[0] + x[1]) / 2, (y[0] + y[1]) / 2, (z[0] + z[1]) / 2]}
      castShadow={!noShadow && !transparent}
      receiveShadow={!transparent}
      geometry={geom ?? undefined}
    >
      {!geom && <boxGeometry args={[sx, sy, sz]} />}
      {/* a mintás és a sima anyag külön kulcsot kap: helyben cserélve a shader USE_MAP nélkül maradna (fekete) */}
      <meshStandardMaterial
        key={map ? `tex-${map.uuid}` : 'plain'}
        color={color}
        map={map ?? null}
        roughness={rough}
        metalness={metal}
        transparent={transparent}
        opacity={opacity ?? 1}
        depthWrite={!transparent}
        emissive={emissive ?? '#000000'}
        emissiveIntensity={emissiveIntensity ?? 0}
      />
    </mesh>
  );
}
