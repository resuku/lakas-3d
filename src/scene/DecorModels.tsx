import * as THREE from 'three';
import { useEffect, useMemo, useRef, type ReactNode } from 'react';
import { useFrame, type ThreeEvent } from '@react-three/fiber';
import { findDecorType, type DecorType } from '../data/decor';
import { findFurniture } from '../data/products';
import { infoUrl } from '../lib/inspect';
import { mm, wallFrames } from '../lib/geom';
import type { DecorItem, Room } from '../model/types';
import { useStore } from '../store';
import { Box } from './Box';
import { startDrag } from './placement';

// Dekorelemek jelzésszerű modelljei. Helyi rendszer: padlón / bútoron álló elemnél a talppont az origó (y = 0 az alap);
// falra kerülő elemnél a hátlap a z = 0 síkon, az eleje +z felé, az alsó él y = 0, vízszintesen középre igazítva.

const LEAF = '#5f7a4a';
const LEAF2 = '#7c9461';
const ART = ['#c9a27e', '#a65a3f', '#e7dccb', '#9da58e', '#6b4a33', '#d8b26e', '#4e5d58', '#efe6d6', '#b58b6b'];

const hash = (s: string) => [...s].reduce((a, c) => (a * 31 + c.charCodeAt(0)) >>> 0, 7);

/** Generált absztrakt kép (szerzői jog nélkül): sávok, körök, ívek vagy vonalak meleg színekből. */
function useArtTexture(seed: string, aspect: number) {
  const tex = useMemo(() => {
    let r = hash(seed);
    const rnd = () => ((r = (r * 1664525 + 1013904223) >>> 0) / 4294967296);
    const W = 256;
    const H = Math.round(256 / aspect);
    const cv = document.createElement('canvas');
    cv.width = W;
    cv.height = H;
    const g = cv.getContext('2d')!;
    const pick = () => ART[Math.floor(rnd() * ART.length)];
    g.fillStyle = pick();
    g.fillRect(0, 0, W, H);
    const style = Math.floor(rnd() * 4);
    for (let i = 0; i < 5; i++) {
      g.fillStyle = pick();
      g.strokeStyle = pick();
      if (style === 0) g.fillRect(0, H * rnd(), W, H * (0.1 + rnd() * 0.3));
      else if (style === 1) {
        g.beginPath();
        g.arc(W * rnd(), H * rnd(), Math.min(W, H) * (0.15 + rnd() * 0.3), 0, Math.PI * 2);
        g.fill();
      } else if (style === 2) {
        g.beginPath();
        g.arc(W * rnd(), H * (0.6 + rnd() * 0.6), W * (0.3 + rnd() * 0.4), Math.PI, 2 * Math.PI);
        g.fill();
      } else {
        g.lineWidth = 3 + rnd() * 6;
        g.beginPath();
        g.moveTo(W * rnd(), H * rnd());
        g.bezierCurveTo(W * rnd(), H * rnd(), W * rnd(), H * rnd(), W * rnd(), H * rnd());
        g.stroke();
      }
    }
    const t = new THREE.CanvasTexture(cv);
    t.colorSpace = THREE.SRGBColorSpace;
    return t;
  }, [seed, aspect]);
  useEffect(() => () => tex.dispose(), [tex]);
  return tex;
}

function Pot({ r, h, color }: { r: number; h: number; color: string }) {
  return (
    <mesh position={[0, h / 2, 0]} castShadow receiveShadow>
      <cylinderGeometry args={[r, r * 0.8, h, 20]} />
      <meshStandardMaterial color={color} roughness={0.7} />
    </mesh>
  );
}

function Blob({ p, s, color }: { p: [number, number, number]; s: [number, number, number]; color: string }) {
  return (
    <mesh position={p} scale={s} castShadow>
      <sphereGeometry args={[1, 12, 10]} />
      <meshStandardMaterial color={color} roughness={0.85} />
    </mesh>
  );
}

function Plant({ t, h, color }: { t: DecorType; h: number; color: string }) {
  const potH = Math.min(0.4, h * 0.25);
  const potR = mm(t.w) * 0.25;
  switch (t.id) {
    case 'noveny-anyosnyelv':
      return (
        <group>
          <Pot r={potR} h={potH} color={color} />
          {[0, 1, 2, 3, 4, 5, 6].map((i) => {
            const a = (i / 7) * Math.PI * 2;
            return (
              <mesh key={i} position={[Math.cos(a) * 0.05, potH + (h - potH) / 2, Math.sin(a) * 0.05]} rotation={[Math.sin(a) * 0.12, a, Math.cos(a) * 0.12]} castShadow>
                <boxGeometry args={[0.06, (h - potH) * (0.75 + 0.25 * ((i * 7) % 3) / 2), 0.012]} />
                <meshStandardMaterial color={i % 2 ? LEAF : LEAF2} roughness={0.8} />
              </mesh>
            );
          })}
        </group>
      );
    case 'noveny-olajfa':
    case 'noveny-fikusz': {
      const olive = t.id === 'noveny-olajfa';
      return (
        <group>
          <Pot r={potR} h={potH} color={color} />
          <Box x={[-0.015, 0.015]} y={[potH, h * 0.7]} z={[-0.015, 0.015]} color="#6b5440" rough={0.9} />
          {[
            [0, h * 0.8, 0, 0.22],
            [0.12, h * 0.7, 0.05, 0.16],
            [-0.1, h * 0.72, -0.06, 0.17],
            [0.02, h * 0.92, -0.04, 0.14],
          ].map(([x, y, z, s], i) => (
            <Blob key={i} p={[x, y, z]} s={[s, s * (olive ? 0.7 : 0.9), s]} color={olive ? '#8a9a78' : LEAF} />
          ))}
        </group>
      );
    }
    case 'noveny-futo':
      return (
        <group>
          <Pot r={potR} h={potH} color={color} />
          <Blob p={[0, potH + 0.06, 0]} s={[0.12, 0.08, 0.12]} color={LEAF2} />
          {[0, 1, 2, 3].map((i) => {
            const a = (i / 4) * Math.PI * 2 + 0.4;
            return <Box key={i} x={[Math.cos(a) * 0.12 - 0.01, Math.cos(a) * 0.12 + 0.01]} y={[potH - (0.2 + i * 0.05), potH + 0.04]} z={[Math.sin(a) * 0.12 - 0.01, Math.sin(a) * 0.12 + 0.01]} color={LEAF} rough={0.8} />;
          })}
        </group>
      );
    default:
      // nagy levelű és asztali növény: levélfürt
      return (
        <group>
          <Pot r={potR} h={potH} color={color} />
          {[0, 1, 2, 3, 4, 5].map((i) => {
            const a = (i / 6) * Math.PI * 2;
            const rr = mm(t.w) * 0.28;
            const y = potH + (h - potH) * (0.45 + 0.4 * ((i % 3) / 2));
            return <Blob key={i} p={[Math.cos(a) * rr, y, Math.sin(a) * rr]} s={[mm(t.w) * 0.2, 0.025 + mm(t.w) * 0.02, mm(t.w) * 0.14]} color={i % 2 ? LEAF : LEAF2} />;
          })}
          <Blob p={[0, potH + (h - potH) * 0.55, 0]} s={[mm(t.w) * 0.15, (h - potH) * 0.3, mm(t.w) * 0.15]} color={LEAF} />
        </group>
      );
  }
}

function Picture({ item, t, w, h, frame }: { item: DecorItem; t: DecorType; w: number; h: number; frame: string }) {
  const d = mm(t.d);
  const art = useArtTexture(item.id, w / h);
  if (t.id === 'tukor-kerek')
    return (
      <group position={[0, h / 2, 0]}>
        <mesh rotation={[Math.PI / 2, 0, 0]} position={[0, 0, d / 2]}>
          <cylinderGeometry args={[w / 2, w / 2, d, 40]} />
          <meshStandardMaterial color={frame} roughness={0.5} />
        </mesh>
        <mesh position={[0, 0, d + 0.001]}>
          <circleGeometry args={[w / 2 - 0.025, 40]} />
          <meshStandardMaterial color="#dfe5e8" roughness={0.12} metalness={0.25} />
        </mesh>
      </group>
    );
  if (t.id === 'kepfal-3') {
    const pw = 0.3;
    return (
      <group>
        {[-1, 0, 1].map((i) => (
          <group key={i} position={[i * (pw + 0.08), 0, 0]}>
            <FramedArt seed={`${item.id}-${i}`} w={pw} h={h} d={d} frame={frame} />
          </group>
        ))}
      </group>
    );
  }
  return <FramedArtTex tex={art} w={w} h={h} d={d} frame={frame} />;
}

function FramedArt({ seed, w, h, d, frame }: { seed: string; w: number; h: number; d: number; frame: string }) {
  const tex = useArtTexture(seed, w / h);
  return <FramedArtTex tex={tex} w={w} h={h} d={d} frame={frame} />;
}

function FramedArtTex({ tex, w, h, d, frame }: { tex: THREE.Texture; w: number; h: number; d: number; frame: string }) {
  const b = 0.025;
  return (
    <group>
      <Box x={[-w / 2, w / 2]} y={[0, h]} z={[0, d]} color={frame} rough={0.5} />
      <mesh position={[0, h / 2, d + 0.001]}>
        <planeGeometry args={[w - 2 * b, h - 2 * b]} />
        <meshStandardMaterial map={tex} roughness={0.8} />
      </mesh>
    </group>
  );
}

/** Lamellás akusztikus panel: fekete filc hátlap, rajta lécek (kb. 27 mm léc, 13 mm köz). */
function AcousticSlats({ w, h, color }: { w: number; h: number; color: string }) {
  const slat = 0.027;
  const pitch = 0.04;
  const n = Math.max(1, Math.floor((w - slat) / pitch) + 1);
  const x0 = -((n - 1) * pitch) / 2;
  return (
    <group>
      <Box x={[-w / 2, w / 2]} y={[0, h]} z={[0, 0.009]} color="#1d1c1b" rough={1} />
      {Array.from({ length: n }, (_, i) => (
        <Box key={i} x={[x0 + i * pitch - slat / 2, x0 + i * pitch + slat / 2]} y={[0, h]} z={[0.009, 0.022]} color={color} rough={0.6} />
      ))}
    </group>
  );
}

/** Hatszög elemek méhsejtszerű csoportban, a megadott befoglaló méretben. */
function AcousticHex({ w, h, color }: { w: number; h: number; color: string }) {
  const r = 0.13;
  const cells: [number, number][] = [];
  const dx = r * Math.sqrt(3);
  for (let row = 0; row * r * 1.5 + 2 * r <= h + 1e-6; row++)
    for (let col = 0; col * dx + dx <= w + 1e-6; col++) {
      if ((row + col) % 4 === 3) continue;
      cells.push([-w / 2 + dx / 2 + col * dx + (row % 2 ? dx / 2 : 0), r + row * r * 1.5]);
    }
  return (
    <group>
      {cells.filter(([x]) => x + dx / 2 <= w / 2 + 1e-6).map(([x, y], i) => (
        <mesh key={i} position={[x, y, 0.0075]} rotation={[Math.PI / 2, 0, 0]} castShadow>
          <cylinderGeometry args={[r - 0.004, r - 0.004, 0.015, 6]} />
          <meshStandardMaterial color={i % 3 === 0 ? new THREE.Color(color).multiplyScalar(0.85).getStyle() : color} roughness={0.95} />
        </mesh>
      ))}
    </group>
  );
}

function ObjectModel({ t, w, h, color }: { t: DecorType; w: number; h: number; color: string }) {
  const d = mm(t.d);
  switch (t.id) {
    case 'vaza-pampa':
      return (
        <group>
          <mesh position={[0, 0.25, 0]} castShadow>
            <cylinderGeometry args={[0.08, 0.13, 0.5, 20]} />
            <meshStandardMaterial color={color} roughness={0.6} />
          </mesh>
          {[-0.08, 0, 0.08].map((x, i) => (
            <group key={i} rotation={[0, 0, x * 2]}>
              <Box x={[x - 0.004, x + 0.004]} y={[0.5, h - 0.25]} z={[-0.004, 0.004]} color="#b9a27e" rough={0.9} />
              <mesh position={[x * 1.6, h - 0.15, 0]} castShadow>
                <coneGeometry args={[0.05, 0.3, 10]} />
                <meshStandardMaterial color="#e2d3b4" roughness={1} />
              </mesh>
            </group>
          ))}
        </group>
      );
    case 'kosar':
      return (
        <mesh position={[0, h / 2, 0]} castShadow receiveShadow>
          <cylinderGeometry args={[w / 2, w / 2.3, h, 24, 1, true]} />
          <meshStandardMaterial color="#b89a6a" roughness={1} side={THREE.DoubleSide} />
        </mesh>
      );
    case 'tukor-allo':
      return (
        <group rotation={[-0.08, 0, 0]}>
          <Box x={[-w / 2, w / 2]} y={[0, h]} z={[-0.02, 0.01]} color={color} rough={0.5} />
          <Box x={[-w / 2 + 0.03, w / 2 - 0.03]} y={[0.03, h - 0.03]} z={[0.01, 0.014]} color="#dfe5e8" rough={0.12} metal={0.25} />
        </group>
      );
    case 'lerakoasztal':
      return (
        <group>
          <mesh position={[0, h - 0.015, 0]} castShadow receiveShadow>
            <cylinderGeometry args={[w / 2, w / 2, 0.03, 28]} />
            <meshStandardMaterial color={color} roughness={0.5} />
          </mesh>
          <Box x={[-0.02, 0.02]} y={[0, h - 0.03]} z={[-0.02, 0.02]} color="#2b2a28" rough={0.5} />
          <mesh position={[0, 0.01, 0]}>
            <cylinderGeometry args={[0.14, 0.14, 0.02, 20]} />
            <meshStandardMaterial color="#2b2a28" roughness={0.5} />
          </mesh>
        </group>
      );
    case 'lampas':
      return (
        <group>
          <Box x={[-w / 2, w / 2]} y={[0, 0.02]} z={[-w / 2, w / 2]} color={color} rough={0.4} metal={0.5} />
          <Box x={[-w / 2 + 0.01, w / 2 - 0.01]} y={[0.02, h - 0.06]} z={[-w / 2 + 0.01, w / 2 - 0.01]} color="#e8eef0" rough={0.1} opacity={0.35} />
          <Box x={[-w / 2, w / 2]} y={[h - 0.06, h - 0.03]} z={[-w / 2, w / 2]} color={color} rough={0.4} metal={0.5} />
          <Box x={[-0.035, 0.035]} y={[0.02, 0.16]} z={[-0.035, 0.035]} color="#f3ead8" rough={0.9} emissive="#ffb35c" emissiveIntensity={0.4} />
        </group>
      );
    case 'vaza-virag':
      return (
        <group>
          <mesh position={[0, 0.12, 0]} castShadow>
            <cylinderGeometry args={[0.05, 0.07, 0.24, 16]} />
            <meshStandardMaterial color={color} roughness={0.5} />
          </mesh>
          {[0, 1, 2, 3, 4].map((i) => {
            const a = (i / 5) * Math.PI * 2;
            return <Blob key={i} p={[Math.cos(a) * 0.05, h - 0.08 + (i % 2) * 0.04, Math.sin(a) * 0.05]} s={[0.035, 0.035, 0.035]} color={['#e9d6c8', '#d79a86', '#f2ead6', '#c9a27e', '#b5694b'][i]} />;
          })}
        </group>
      );
    case 'konyvek':
      return (
        <group>
          {['#6b4a33', '#a65a3f', '#e7dccb', '#4e5d58', '#c9a27e'].map((c, i) => (
            <Box key={i} x={[-w / 2 + i * 0.008, w / 2 - i * 0.012]} y={[i * 0.03, i * 0.03 + 0.028]} z={[-d / 2, d / 2 - i * 0.01]} color={c} rough={0.8} />
          ))}
        </group>
      );
    case 'gyertyak':
      return (
        <group>
          {[
            [-0.08, 0.2],
            [0, 0.14],
            [0.08, 0.1],
          ].map(([x, hh], i) => (
            <mesh key={i} position={[x, hh / 2, 0]} castShadow>
              <cylinderGeometry args={[0.03, 0.03, hh, 16]} />
              <meshStandardMaterial color="#f1ebdf" roughness={0.9} emissive="#ffb35c" emissiveIntensity={0.05} />
            </mesh>
          ))}
        </group>
      );
    case 'tal':
      return (
        <mesh position={[0, h / 2, 0]} castShadow>
          <cylinderGeometry args={[w / 2, w / 4, h, 24, 1, true]} />
          <meshStandardMaterial color={color} roughness={0.5} side={THREE.DoubleSide} />
        </mesh>
      );
    case 'parnak':
      return (
        <group>
          {[-0.22, 0.22].map((x, i) => (
            <mesh key={x} position={[x, 0.2, 0]} rotation={[-0.25, 0, 0]} scale={[0.21, 0.2, 0.07]} castShadow>
              <sphereGeometry args={[1, 14, 10]} />
              <meshStandardMaterial color={i ? new THREE.Color(color).multiplyScalar(0.85).getStyle() : color} roughness={1} />
            </mesh>
          ))}
        </group>
      );
    case 'pled':
      return <Box x={[-w / 2, w / 2]} y={[0, h]} z={[-d / 2, d / 2]} color={color} rough={1} />;
    case 'falilora':
      return (
        <group position={[0, h / 2, 0]}>
          <mesh rotation={[Math.PI / 2, 0, 0]} position={[0, 0, d / 2]}>
            <cylinderGeometry args={[w / 2, w / 2, d, 40]} />
            <meshStandardMaterial color={color} roughness={0.5} />
          </mesh>
          <Box x={[-0.004, 0.004]} y={[0, w * 0.32]} z={[d, d + 0.006]} color="#262524" noShadow />
          <Box x={[0, w * 0.22]} y={[-0.004, 0.004]} z={[d, d + 0.006]} color="#262524" noShadow />
        </group>
      );
    case 'falipolc':
      return (
        <group>
          <Box x={[-w / 2, w / 2]} y={[0, 0.025]} z={[0, d]} color={color} rough={0.6} />
          <Box x={[-w / 2 + 0.05, -w / 2 + 0.25]} y={[0.025, 0.2]} z={[0.03, 0.17]} color="#e7dccb" rough={0.8} />
          <mesh position={[0.1, 0.11, d / 2]} castShadow>
            <cylinderGeometry args={[0.05, 0.06, 0.17, 14]} />
            <meshStandardMaterial color="#b5694b" roughness={0.6} />
          </mesh>
          <Blob p={[w / 2 - 0.12, 0.09, d / 2]} s={[0.08, 0.06, 0.07]} color={LEAF2} />
        </group>
      );
    case 'textil-falikep':
      return (
        <group>
          <Box x={[-w / 2 - 0.03, w / 2 + 0.03]} y={[h - 0.02, h]} z={[0, 0.02]} color="#b8915f" rough={0.6} />
          <Box x={[-w / 2, w / 2]} y={[h * 0.15, h - 0.02]} z={[0.005, 0.012]} color="#e8dcc6" rough={1} />
          {[-0.18, -0.06, 0.06, 0.18].map((x) => (
            <Box key={x} x={[x * (w / 0.5) - 0.006, x * (w / 0.5) + 0.006]} y={[0, h * 0.2]} z={[0.006, 0.012]} color="#e8dcc6" rough={1} />
          ))}
        </group>
      );
    case 'futoszonyeg':
      return <Box x={[-w / 2, w / 2]} y={[0.001, h]} z={[-d / 2, d / 2]} color={color} rough={1} noShadow />;
    default:
      return <Box x={[-w / 2, w / 2]} y={[0, h]} z={[-d / 2, d / 2]} color={color} rough={0.8} />;
  }
}

/** Egy dekorelem modellje a helyi rendszerében. */
export function DecorModel({ item }: { item: DecorItem }) {
  const t = findDecorType(item.type);
  if (!t) return null;
  const v = t.variants?.find((x) => x.id === item.variant) ?? t.variants?.[0];
  const p = findFurniture(item.productId);
  const color = p?.hex ?? v?.hex ?? '#c9b9a0';
  const w = mm(item.w ?? t.w);
  const h = mm(item.h ?? t.h);
  if (t.group === 'plant') return <Plant t={t} h={h} color={color} />;
  if (t.group === 'picture') return <Picture item={item} t={t} w={w} h={h} frame={color} />;
  if (t.id === 'akusztik-lamella') return <AcousticSlats w={w} h={h} color={color} />;
  if (t.id === 'akusztik-hatszog') return <AcousticHex w={w} h={h} color={color} />;
  if (t.id === 'akusztik-filc') return <Box x={[-w / 2, w / 2]} y={[0, h]} z={[0, mm(t.d)]} color={color} rough={1} />;
  return <ObjectModel t={t} w={w} h={h} color={color} />;
}

/** Elhelyezés a helyiség rendszerében (m): falra kerülő elemnél a fal síkjára, kifelé fordítva. */
export function decorPose(room: Room, item: DecorItem): { pos: [number, number, number]; rotY: number } {
  if (item.wall) {
    const f = wallFrames(room)[item.wall];
    const p = f.origin.clone().addScaledVector(f.u, mm(item.a ?? 0)).addScaledVector(f.n, 0.002);
    return { pos: [p.x, mm(item.y), p.z], rotY: Math.atan2(f.n.x, f.n.z) };
  }
  return { pos: [mm(item.x ?? 0), mm(item.y), mm(item.z ?? 0)], rotY: ((item.rot ?? 0) * Math.PI) / 180 };
}

/** Halvány, áttetsző szürke előnézet: a sugár átmegy rajta, árnyékot nem vet (elhelyezés közben). */
function Ghost({ children }: { children: ReactNode }) {
  const ref = useRef<THREE.Group>(null);
  useFrame(() => {
    ref.current?.traverse((o) => {
      const m = o as THREE.Mesh;
      if (!m.isMesh) return;
      m.raycast = () => {};
      m.castShadow = false;
      for (const mat of ([] as THREE.Material[]).concat(m.material)) {
        mat.transparent = true;
        mat.opacity = 0.38;
        mat.depthWrite = false;
        (mat as THREE.MeshStandardMaterial).color?.set('#9a9a9a');
      }
    });
  });
  return (
    <group ref={ref} userData={{ decorPreview: true }}>
      {children}
    </group>
  );
}

/** A helyiség dekorelemei; kattintásra kijelölés, a kijelölt elem körül keret; M + húzás: mozgatás; elhelyezés közben előnézet. */
export function DecorLayer({ room }: { room: Room }) {
  const items = useStore((s) => s.decor);
  const on = useStore((s) => s.layers.decor);
  const selected = useStore((s) => s.selectedDecor);
  const select = useStore((s) => s.selectDecor);
  const preview = useStore((s) => (s.decorPreview?.roomId === room.id ? s.decorPreview.item : null));
  if (!on) return null;
  const pv = preview && decorPose(room, preview);
  return (
    <>
      {preview && pv && (
        <group position={pv.pos} rotation={[0, pv.rotY, 0]}>
          <Ghost>
            <DecorModel item={preview} />
          </Ghost>
        </group>
      )}
      {items
        .filter((d) => d.roomId === room.id)
        .map((d) => {
          const t = findDecorType(d.type);
          if (!t) return null;
          const { pos, rotY } = decorPose(room, d);
          const w = mm(d.w ?? t.w);
          const h = mm(d.h ?? t.h);
          const dd = mm(t.d);
          const p = findFurniture(d.productId);
          return (
            <group
              key={d.id}
              position={pos}
              rotation={[0, rotY, 0]}
              userData={{ ...infoUrl(p?.url, `${room.name} – ${t.label}`, `${Math.round(w * 1000)} × ${Math.round(h * 1000)} mm (jelzésszerű)`, p ? `${p.store}: ${p.name}${p.price ? ` · ${p.price}` : ''}` : t.note, 'Kattintás: kijelölés (Anyagok → Dekor) · M nyomva + húzás: mozgatás'), decorId: d.id }}
              onPointerDown={(e: ThreeEvent<PointerEvent>) => {
                const st = useStore.getState();
                if (!st.moveKey || st.placing || st.walk || e.nativeEvent.button !== 0) return;
                e.stopPropagation();
                select(d.id);
                startDrag(room, e, d);
              }}
              onClick={(e: ThreeEvent<MouseEvent>) => {
                if (useStore.getState().placing || e.delta > 4 || e.nativeEvent.ctrlKey || e.nativeEvent.metaKey) return;
                e.stopPropagation();
                select(d.id);
                useStore.getState().setViewer({ sidebarTab: 'materials' });
              }}
            >
              <DecorModel item={d} />
              {selected === d.id && (
                <mesh position={[0, h / 2, t.mount === 'wall' ? dd / 2 : 0]}>
                  <boxGeometry args={[w + 0.04, h + 0.04, (t.mount === 'wall' ? dd : mm(t.d)) + 0.04]} />
                  <meshBasicMaterial color="#1565c0" wireframe />
                </mesh>
              )}
            </group>
          );
        })}
    </>
  );
}
