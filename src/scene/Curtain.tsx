import * as THREE from 'three';
import { useMemo } from 'react';
import type { CurtainLayout } from '../lib/curtain';
import { Box } from './Box';

const SHEER_GAP = 0.06;

function foldedPanel(width: number, height: number, amp: number, period: number) {
  const seg = Math.max(8, Math.round((width / period) * 8));
  const g = new THREE.PlaneGeometry(width, height, seg, 1);
  const pos = g.attributes.position as THREE.BufferAttribute;
  for (let i = 0; i < pos.count; i++) {
    const x = pos.getX(i);
    pos.setZ(i, Math.sin(((x + width / 2) / period) * Math.PI * 2) * amp);
  }
  g.computeVertexNormals();
  return g;
}

export function Panel({ a, b, bottom, top, z, closed, color, sheer }: { a: number; b: number; bottom: number; top: number; z: number; closed: boolean; color: string; sheer: boolean }) {
  const w = b - a;
  const h = top - bottom;
  const geom = useMemo(() => foldedPanel(w, h, closed ? 0.018 : 0.03, closed ? 0.17 : 0.11), [w, h, closed]);
  return (
    <mesh geometry={geom} position={[(a + b) / 2, bottom + h / 2, z]} castShadow={!sheer} receiveShadow>
      <meshStandardMaterial color={color} roughness={0.95} side={THREE.DoubleSide} transparent={sheer} opacity={sheer ? 0.55 : 1} depthWrite={!sheer} />
    </mesh>
  );
}

/** Egy- vagy kétrétegű függöny: kétrétegűnél az áttetsző réteg marad a fal felőli sínen (mindig behúzva), a vastag függöny elé kerül. */
export function Curtain({ layout, color, sheer, closed, sheerLayer }: { layout: CurtainLayout; color: string; sheer: boolean; closed: boolean; sheerLayer?: string }) {
  const mid = (layout.a + layout.b) / 2;
  const zs = layout.z;
  const zd = sheerLayer ? layout.z + SHEER_GAP : layout.z;
  return (
    <group>
      <Box x={[layout.a - 0.02, layout.b + 0.02]} y={[layout.top, layout.top + 0.025]} z={[zs - 0.02, zd + 0.02]} color="#e8e7e2" rough={0.4} />
      {sheerLayer &&
        [
          [layout.a, mid],
          [mid, layout.b],
        ].map(([a, b]) => <Panel key={`s${a}`} a={a} b={b} bottom={layout.bottom} top={layout.top} z={zs} closed color={sheerLayer} sheer />)}
      {layout.panels.map(([a, b]) => (
        <Panel key={a} a={a} b={b} bottom={layout.bottom} top={layout.top} z={zd} closed={closed} color={color} sheer={sheer} />
      ))}
    </group>
  );
}
