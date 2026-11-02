import * as THREE from 'three';
import { useEffect, useMemo, useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { Html } from '@react-three/drei';
import type { Bed as BedT, Room, Variant } from '../model/types';
import type { Layers } from '../store';
import { makeFloorTexture } from '../lib/floorTexture';
import { mm, roomDims } from '../lib/geom';
import { STATUS_INFO, worst } from '../lib/status';
import { Box } from './Box';
import { setGhost } from './ghost';
import { ceilingInfo, floorInfo, info } from '../lib/inspect';

export function FloorAndCeiling({ room, variant }: { room: Room; variant: Variant }) {
  const { W, L, H } = roomDims(room);
  // Eltérő padló (pl. járólap), ha a változat padlója kifejezetten nem terjed ki a helyiségre
  const own = room.floor && variant.floorAll === false ? room.floor : null;
  const { pattern, tone, plank } = own ?? variant.floor;
  const dir = variant.floor.dir;
  const pl = plank?.l;
  const pw = plank?.w;
  const tex = useMemo(
    () => makeFloorTexture(pattern, tone, dir, W, L, pl && pw ? { l: pl, w: pw } : undefined),
    [pattern, tone, dir, W, L, pl, pw],
  );
  useEffect(() => () => tex.dispose(), [tex]);
  const ceiling = useRef<THREE.Mesh>(null);
  const camera = useThree((s) => s.camera);
  useFrame(() => {
    if (ceiling.current) setGhost(ceiling.current, camera.position.y > H - 0.01);
  });
  return (
    <>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[W / 2, 0, L / 2]} receiveShadow userData={floorInfo(room, variant)}>
        <planeGeometry args={[W, L]} />
        <meshStandardMaterial map={tex} roughness={pattern === 'tile' ? 0.35 : 0.55} />
      </mesh>
      {/* A mennyezet árnyékot is vet, különben a nap felülről besütne. */}
      <mesh ref={ceiling} rotation={[Math.PI / 2, 0, 0]} position={[W / 2, H, L / 2]} castShadow receiveShadow userData={ceilingInfo(room, variant)}>
        <planeGeometry args={[W + 0.6, L + 0.6]} />
        <meshStandardMaterial color={variant.ceiling} roughness={0.95} shadowSide={THREE.DoubleSide} />
      </mesh>
    </>
  );
}

export function Bed({ b, textile, tint }: { b: BedT; textile: string; tint: string | null }) {
  const x0 = mm(b.x0.v);
  const z0 = mm(b.z0.v);
  const x1 = x0 + mm(b.sx.v);
  const z1 = z0 + mm(b.sz.v);
  const h = mm(b.h.v);
  const mh = mm(b.mattressH.v);
  const frame = tint ?? b.frameColor;
  return (
    <group>
      <Box x={[x0 + 0.05, x1]} y={[0.02, h]} z={[z0, z1]} color={frame} rough={0.6} />
      <Box x={[x0, x0 + 0.05]} y={[0, mm(b.headH.v)]} z={[z0, z1]} color={frame} rough={0.6} />
      <Box x={[x0 + 0.06, x1 - 0.02]} y={[h, h + mh]} z={[z0 + 0.05, z1 - 0.05]} color={tint ?? '#f2f0ea'} rough={0.9} />
      {/* ágytakaró: a matrac alsó kétharmadát borítja */}
      <Box x={[x0 + 0.75, x1 + 0.015]} y={[h + 0.05, h + mh + 0.03]} z={[z0 + 0.035, z1 - 0.035]} color={tint ?? textile} rough={0.95} />
      {[0.25, 0.75].map((f) => {
        const zc = z0 + (z1 - z0) * f;
        return <Box key={f} x={[x0 + 0.1, x0 + 0.45]} y={[h + mh, h + mh + 0.12]} z={[zc - 0.36, zc + 0.36]} color={tint ?? '#ece9e1'} rough={0.95} />;
      })}
    </group>
  );
}

/** Éjjeliszekrény semleges színben (a meglévő darabok cseréje valószínű, 10 Háló). */
const NIGHTSTAND = '#cfc8bd';

export function Furniture({ room, variant, layers }: { room: Room; variant: Variant; layers: Layers }) {
  const { W } = roomDims(room);
  return (
    <>
      {(room.furniture ?? []).map((n) => (
        <group key={n.id} userData={info(`${room.name} – ${n.label}`, `${n.sx} × ${n.sz} × ${n.h} mm (${n.s})`, n.note)}>
        <Box
          x={[mm(n.x0), mm(n.x0 + n.sx)]}
          y={[0, mm(n.h)]}
          z={[mm(n.z0), mm(n.z0 + n.sz)]}
          color={layers.status ? STATUS_INFO[n.s].color : NIGHTSTAND}
          rough={0.6}
        />
        </group>
      ))}
      {room.beds.map((b) => (
        <group key={b.id} userData={info(`${room.name} – ${b.label}`, `${b.sz.v} × ${b.sx.v} mm, magasság ${b.h.v} mm`, b.note)}>
        <Bed
          b={b}
          textile={variant.textile}
          tint={layers.status ? STATUS_INFO[worst(b.x0, b.z0, b.sx, b.sz, b.h, b.mattressH, b.headH)].color : null}
        />
        </group>
      ))}
      {layers.dims &&
        room.wardrobe?.wall === 'x1' &&
        room.beds.map((b) => {
          const xb = mm(b.x0.v + b.sx.v);
          const xw = W - mm(room.wardrobe!.depth.v);
          const zc = mm(b.z0.v + b.sz.v / 2);
          return (
            <group key={`gap-${b.id}`}>
              <Box x={[xb, xw]} y={[0.005, 0.012]} z={[zc - 0.01, zc + 0.01]} color="#1565c0" noShadow />
              <Html position={[(xb + xw) / 2, 0.06, zc]} center distanceFactor={6}>
                <div className="dim-label">
                  közlekedősáv ~{Math.round((xw - xb) * 1000)} mm<span>{worst(room.size.x, room.wardrobe!.depth, b.x0, b.sx)}</span>
                </div>
              </Html>
            </group>
          );
        })}
    </>
  );
}
