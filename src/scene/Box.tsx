import type { ReactNode } from 'react';

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
  children?: ReactNode;
}

/** Tengelyre igazított doboz, a sarokkoordinátáival megadva (m). */
export function Box({ x, y, z, color, rough = 0.8, metal = 0, opacity, emissive, emissiveIntensity, noShadow }: BoxProps) {
  const transparent = opacity !== undefined && opacity < 1;
  return (
    <mesh
      position={[(x[0] + x[1]) / 2, (y[0] + y[1]) / 2, (z[0] + z[1]) / 2]}
      castShadow={!noShadow && !transparent}
      receiveShadow={!transparent}
    >
      <boxGeometry args={[Math.max(x[1] - x[0], 1e-4), Math.max(y[1] - y[0], 1e-4), Math.max(z[1] - z[0], 1e-4)]} />
      <meshStandardMaterial
        color={color}
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
