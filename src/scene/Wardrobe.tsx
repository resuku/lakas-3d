import * as THREE from 'three';
import { useEffect, useMemo } from 'react';
import { Reflector } from 'three/examples/jsm/objects/Reflector.js';
import type { Wardrobe as WardrobeT, WardrobeFront } from '../model/types';
import { mm } from '../lib/geom';
import { Box } from './Box';

// A gardrób a saját falának helyi rendszerében: x a fal mentén (from–to), z a helyiség felé (0–mélység).

const SIDE_WOOD = '#b98b5c';
const ALU = '#b9bdc0';

/**
 * Valódi síktükör (three.js Reflector): a tükörképet közvetlenül, megvilágítás nélkül
 * jeleníti meg, így a HDR fényviszonyok mellett is helyes a fényereje.
 */
function Mirror({ x, y, z }: { x: [number, number]; y: [number, number]; z: number }) {
  const w = x[1] - x[0];
  const h = y[1] - y[0];
  const reflector = useMemo(
    () => new Reflector(new THREE.PlaneGeometry(w, h), { clipBias: 0.003, textureWidth: 1024, textureHeight: Math.round((1024 * h) / w), color: 0xb4b8ba }),
    [w, h],
  );
  useEffect(() => () => reflector.dispose(), [reflector]);
  return <primitive object={reflector} position={[(x[0] + x[1]) / 2, (y[0] + y[1]) / 2, z]} />;
}

export function Wardrobe({ w, front, woodTone, tint }: { w: WardrobeT; front: WardrobeFront; woodTone: string; tint: string | null }) {
  const a = mm(w.from.v);
  const b = mm(w.to.v);
  const d = mm(w.depth.v);
  const h = mm(w.height.v) - 0.003;
  const side = 0.022;
  const n = w.doors;
  const overlap = 0.03;
  const inner = b - a - 2 * side;
  const dw = (inner + (n - 1) * overlap) / n;
  const y0 = 0.025;
  const y1 = h - 0.085;
  const doors = Array.from({ length: n }, (_, i) => {
    const x0 = a + side + i * (dw - overlap);
    return { x0, x1: x0 + dw, z: i % 2 === 1 ? d - 0.04 : d - 0.012 };
  });
  const isMirror = (i: number) => front === 'mirror' || (front === 'mirrorWood' && i === Math.floor(n / 2));
  const faceColor = (i: number) => (front === 'white' ? '#f2f1ed' : isMirror(i) ? '#7f8589' : woodTone);
  return (
    <group>
      <Box x={[a, a + side]} y={[0, h]} z={[0, d]} color={tint ?? SIDE_WOOD} rough={0.6} />
      <Box x={[b - side, b]} y={[0, h]} z={[0, d]} color={tint ?? SIDE_WOOD} rough={0.6} />
      <Box x={[a + side, b - side]} y={[h - 0.085, h]} z={[d - 0.06, d]} color={tint ?? SIDE_WOOD} rough={0.6} />
      {/* sötét belső tér a tolóajtók mögött */}
      <Box x={[a + side, b - side]} y={[0, h - 0.085]} z={[0, d - 0.07]} color="#2a2724" rough={1} noShadow />
      {doors.map((dr, i) => (
        <group key={i}>
          <Box x={[dr.x0, dr.x1]} y={[y0, y1]} z={[dr.z - 0.02, dr.z]} color={tint ?? faceColor(i)} rough={front === 'white' ? 0.5 : 0.55} />
          <Box x={[dr.x0, dr.x0 + 0.02]} y={[y0, y1]} z={[dr.z - 0.022, dr.z + 0.004]} color={ALU} metal={0.7} rough={0.35} />
          <Box x={[dr.x1 - 0.02, dr.x1]} y={[y0, y1]} z={[dr.z - 0.022, dr.z + 0.004]} color={ALU} metal={0.7} rough={0.35} />
          {!tint && isMirror(i) && <Mirror x={[dr.x0 + 0.02, dr.x1 - 0.02]} y={[y0 + 0.01, y1 - 0.01]} z={dr.z + 0.001} />}
        </group>
      ))}
      <Box x={[a + side, b - side]} y={[0, 0.012]} z={[d - 0.06, d]} color={ALU} metal={0.7} rough={0.35} />
    </group>
  );
}
