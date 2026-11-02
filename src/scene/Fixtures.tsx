import * as THREE from 'three';
import { useMemo, useState } from 'react';
import type { ThreeEvent } from '@react-three/fiber';
import type { Fixture, LightSettings, Room } from '../model/types';
import { kelvinColor } from '../lib/color';
import { fixtureOutput, fixtureSpec, type FixtureSpec } from '../lib/fixtures';
import { mm, roomDims } from '../lib/geom';
import { Box } from './Box';
import { lampInfo } from '../lib/inspect';
import { activeFurnishing, standTop } from '../lib/furnish';
import { useStore } from '../store';

// Lámpák egyszerűsített, jelzésszerű formában. Kattintásra az adott lámpa ki- és bekapcsol.

const SPOT_D = 0.055;
const SPOT_H = 0.09;

/** Kúpos fénysugár (spot) intenzitása kandelában a fényáramból és a teljes nyílásszögből. */
const spotCd = (lm: number, beamDeg: number) => lm / (2 * Math.PI * (1 - Math.cos(((beamDeg / 2) * Math.PI) / 180)));

function DownSpot({ position, lm, color, angleDeg, shadow, aim = [0, -1, 0] }: { position: [number, number, number]; lm: number; color: THREE.Color; angleDeg: number; shadow?: boolean; aim?: [number, number, number] }) {
  const [px, py, pz] = position;
  const [ax, ay, az] = aim;
  const target = useMemo(() => {
    const o = new THREE.Object3D();
    o.position.set(px + ax, py + ay, pz + az);
    return o;
  }, [px, py, pz, ax, ay, az]);
  if (lm <= 0) return null;
  const angle = Math.min(((angleDeg / 2) * Math.PI) / 180 + 0.12, 1.45);
  return (
    <>
      <primitive object={target} />
      <spotLight
        position={position}
        target={target}
        angle={angle}
        penumbra={0.6}
        intensity={spotCd(lm, angleDeg)}
        color={color}
        decay={2}
        castShadow={shadow}
        shadow-mapSize={[1024, 1024]}
        shadow-bias={-0.002}
      />
    </>
  );
}

/** A látható berendezés felső síkja egy pont fölött (m), vagy null. */
function useFurnishTop(roomId: string, x: number, z: number) {
  const on = useStore((s) => s.layers.furniture);
  const choices = useStore((s) => s.choices);
  const picks = useStore((s) => s.furniturePicks);
  return useMemo(() => (on ? standTop(activeFurnishing(roomId, choices, picks), x, z) : null), [on, roomId, choices, picks, x, z]);
}

/** A lámpa megjelenítése; a fény a lámpa saját helyén. */
export function FixtureMesh({ f, room, ls, off, shadows, onToggle }: { f: Fixture; room: Room; ls: LightSettings; off: boolean; shadows: boolean; onToggle: () => void }) {
  // asztali lámpa alatti bútor (pl. éjjeliszekrény), ha van
  const stand = (room.furniture ?? []).find((n) => f.x >= n.x0 && f.x <= n.x0 + n.sx && f.z >= n.z0 && f.z <= n.z0 + n.sz);
  // a berendezési javaslat bútora (asztal, éjjeliszekrény), ha látszik
  const furnTop = useFurnishTop(room.id, f.x, f.z);
  const { H } = roomDims(room);
  const spec: FixtureSpec = fixtureSpec(f, ls);
  const out = fixtureOutput(f, spec, ls, off);
  const on = out.lm > 0;
  const light = kelvinColor(out.K);
  const [hover, setHover] = useState(false);
  const x = mm(f.x);
  const z = mm(f.z);
  const glowFor = (area: number) => (on ? (out.lm / Math.max(area, 0.01)) * 0.08 : 0);
  const events = {
    userData: lampInfo(room, f, ls, off),
    onClick: (e: ThreeEvent<MouseEvent>) => {
      // dekor elhelyezésekor a kattintás a helyiségé
      if (useStore.getState().placing) return;
      e.stopPropagation();
      // forgatás / körbenézés közbeni egérhúzás nem kapcsol
      if (e.delta > 4) return;
      onToggle();
    },
    onPointerOver: (e: ThreeEvent<PointerEvent>) => {
      e.stopPropagation();
      setHover(true);
      document.body.style.cursor = 'pointer';
    },
    onPointerOut: () => {
      setHover(false);
      document.body.style.cursor = '';
    },
  };
  // kijelölt (egér alatti) lámpa: borostyán árnyalat
  const housing = hover ? `#${new THREE.Color(spec.color).lerp(new THREE.Color('#e0a030'), 0.45).getHexString()}` : spec.color;

  if (f.type === 'pendant') {
    const bottom = mm(f.y ?? 1700);
    const top = bottom + spec.h;
    const r = spec.d / 2;
    const opaque = spec.emit === 'down';
    const shade =
      spec.shape === 'globe' ? (
        <sphereGeometry args={[r, 32, 16]} />
      ) : (
        <cylinderGeometry args={[spec.shape === 'dome' || spec.shape === 'cone' ? r * 0.22 : r, r, spec.h, 40, 1, true]} />
      );
    const cy = spec.shape === 'globe' ? bottom + r : bottom + spec.h / 2;
    return (
      <group {...events}>
        <Box x={[x - 0.004, x + 0.004]} y={[spec.shape === 'globe' ? bottom + 2 * r : top, H]} z={[z - 0.004, z + 0.004]} color="#222" noShadow />
        <Box x={[x - 0.05, x + 0.05]} y={[H - 0.02, H]} z={[z - 0.05, z + 0.05]} color={spec.color} noShadow />
        <mesh position={[x, cy, z]} castShadow={false}>
          {shade}
          <meshStandardMaterial
            color={housing}
            side={THREE.DoubleSide}
            roughness={0.7}
            emissive={light}
            emissiveIntensity={opaque ? 0 : glowFor(Math.PI * spec.d * spec.h)}
            transparent={!opaque}
            opacity={opaque ? 1 : 0.92}
          />
        </mesh>
        {/* izzó fénye a bura alján */}
        <mesh position={[x, bottom + 0.02, z]} rotation={[Math.PI / 2, 0, 0]}>
          <circleGeometry args={[r * 0.6, 24]} />
          <meshStandardMaterial color="#fff8ec" emissive={light} emissiveIntensity={glowFor(Math.PI * r * r * 0.36) * 1.5} side={THREE.DoubleSide} />
        </mesh>
        {on &&
          (opaque ? (
            <>
              <DownSpot position={[x, bottom + 0.03, z]} lm={out.lm * 0.85} color={light} angleDeg={110} shadow={shadows} />
              <pointLight position={[x, bottom + spec.h * 0.5, z]} intensity={(out.lm * 0.15) / (4 * Math.PI)} color={light} decay={2} />
            </>
          ) : (
            <pointLight position={[x, cy, z]} intensity={out.lm / (4 * Math.PI)} color={light} decay={2} castShadow={shadows} shadow-mapSize={[1024, 1024]} shadow-bias={-0.002} shadow-camera-near={0.05} />
          ))}
      </group>
    );
  }

  if (f.type === 'ceiling') {
    const r = spec.d / 2;
    return (
      <group {...events}>
        <mesh position={[x, H - spec.h / 2, z]}>
          <cylinderGeometry args={[r, r * 0.94, spec.h, 40]} />
          <meshStandardMaterial color={housing} emissive={light} emissiveIntensity={glowFor(Math.PI * r * r)} roughness={0.85} />
        </mesh>
        {on && (
          <pointLight
            position={[x, H - spec.h - 0.08, z]}
            intensity={(out.lm / (4 * Math.PI)) * 1.5}
            color={light}
            decay={2}
            castShadow={shadows}
            shadow-mapSize={[1024, 1024]}
            shadow-bias={-0.002}
            shadow-camera-near={0.05}
          />
        )}
      </group>
    );
  }

  if (f.type === 'track') {
    const along = (f.rot ?? 0) === 90;
    const half = spec.l / 2;
    const n = Math.max(spec.heads, 1);
    const heads = Array.from({ length: n }, (_, i) => (n === 1 ? 0 : -half + 0.12 + ((spec.l - 0.24) * i) / (n - 1)));
    const lmHead = out.lm / n;
    return (
      <group {...events}>
        <Box
          x={along ? [x - 0.017, x + 0.017] : [x - half, x + half]}
          y={[H - 0.035, H]}
          z={along ? [z - half, z + half] : [z - 0.017, z + 0.017]}
          color={housing}
          rough={0.5}
          noShadow
        />
        {heads.map((t, i) => {
          const hx = along ? x : x + t;
          const hz = along ? z + t : z;
          return (
            <group key={i}>
              <Box x={[hx - 0.006, hx + 0.006]} y={[H - 0.08, H - 0.035]} z={[hz - 0.006, hz + 0.006]} color={housing} noShadow />
              <mesh position={[hx, H - 0.08 - SPOT_H / 2, hz]}>
                <cylinderGeometry args={[SPOT_D / 2, SPOT_D / 2, SPOT_H, 20]} />
                <meshStandardMaterial color={housing} roughness={0.5} />
              </mesh>
              <mesh position={[hx, H - 0.08 - SPOT_H - 0.001, hz]} rotation={[Math.PI / 2, 0, 0]}>
                <circleGeometry args={[SPOT_D / 2 - 0.006, 16]} />
                <meshStandardMaterial color="#fff8ec" emissive={light} emissiveIntensity={glowFor(0.002) * 0.3} side={THREE.DoubleSide} />
              </mesh>
              {on && <DownSpot position={[hx, H - 0.08 - SPOT_H - 0.01, hz]} lm={lmHead} color={light} angleDeg={spec.beamDeg} />}
            </group>
          );
        })}
      </group>
    );
  }

  if (f.type === 'wall') {
    // a legközelebbi falra szerelve, a lámpafej a fal elé nyúlik
    const { W, L } = roomDims(room);
    const d = [
      { k: 'x0', dist: x, n: [1, 0] },
      { k: 'x1', dist: W - x, n: [-1, 0] },
      { k: 'z0', dist: z, n: [0, 1] },
      { k: 'z1', dist: L - z, n: [0, -1] },
    ].sort((a, b) => a.dist - b.dist)[0];
    const wx = d.k === 'x0' ? 0 : d.k === 'x1' ? W : x;
    const wz = d.k === 'z0' ? 0 : d.k === 'z1' ? L : z;
    const y = mm(f.y ?? 1150);
    const hx = wx + d.n[0] * spec.proj;
    const hz = wz + d.n[1] * spec.proj;
    const ax: [number, number] = [Math.min(wx, hx) - 0.008, Math.max(wx, hx) + 0.008];
    const az: [number, number] = [Math.min(wz, hz) - 0.008, Math.max(wz, hz) + 0.008];
    return (
      <group {...events}>
        <Box x={[wx - 0.04 + d.n[0] * 0.04, wx + 0.04 + d.n[0] * 0.04]} y={[y - 0.06, y + 0.06]} z={[wz - 0.04 + d.n[1] * 0.04, wz + 0.04 + d.n[1] * 0.04]} color={housing} noShadow />
        <Box x={ax} y={[y + 0.04, y + 0.056]} z={az} color={housing} noShadow />
        <mesh position={[hx, y, hz]}>
          <cylinderGeometry args={[spec.d / 4, spec.d / 2, spec.h * 0.6, 24, 1, true]} />
          <meshStandardMaterial color={housing} side={THREE.DoubleSide} roughness={0.6} />
        </mesh>
        <mesh position={[hx, y - spec.h * 0.3 + 0.002, hz]} rotation={[Math.PI / 2, 0, 0]}>
          <circleGeometry args={[spec.d / 2 - 0.005, 20]} />
          <meshStandardMaterial color="#fff8ec" emissive={light} emissiveIntensity={glowFor(0.01) * 0.3} side={THREE.DoubleSide} />
        </mesh>
        {on && <DownSpot position={[hx, y - spec.h * 0.3, hz]} lm={out.lm} color={light} angleDeg={70} aim={[d.n[0] * 0.35, -1, d.n[1] * 0.35]} />}
      </group>
    );
  }

  // állólámpa és asztali lámpa
  const table = f.type === 'table';
  const baseY = table ? (furnTop ?? (stand ? mm(stand.h) : 0.5)) : 0;
  // íves és gémes lámpák egyenes állólámpaként, legfeljebb 1,85 m-es burával
  const total = table ? spec.h : Math.min(Math.max(spec.h, 0.6), 1.85);
  const shadeH = Math.min(spec.d * 0.65, 0.3);
  const shadeY = baseY + total - shadeH / 2;
  const r = spec.d / 2;
  const directional = spec.emit === 'spot';
  const up = spec.emit === 'up';
  return (
    <group {...events}>
      {table && !stand && furnTop === null && <Box x={[x - 0.2, x + 0.2]} y={[0, 0.5]} z={[z - 0.18, z + 0.18]} color="#d3cec5" rough={0.8} />}
      <Box x={[x - 0.008, x + 0.008]} y={[baseY, shadeY - shadeH / 2 + 0.02]} z={[z - 0.008, z + 0.008]} color={directional || up ? housing : '#3c3a37'} metal={0.4} rough={0.5} />
      <mesh position={[x, baseY + 0.01, z]}>
        <cylinderGeometry args={[table ? 0.07 : 0.14, table ? 0.08 : 0.15, 0.02, 24]} />
        <meshStandardMaterial color={directional || up ? housing : '#3c3a37'} metalness={0.4} roughness={0.5} />
      </mesh>
      <mesh position={[x, shadeY, z]}>
        <cylinderGeometry args={directional ? [r * 0.35, r, shadeH, 28, 1, true] : up ? [r, r * 0.35, shadeH, 28, 1, true] : [r * 0.85, r, shadeH, 32, 1, true]} />
        <meshStandardMaterial
          color={housing}
          side={THREE.DoubleSide}
          emissive={light}
          emissiveIntensity={directional || up ? 0 : glowFor(2 * Math.PI * r * shadeH)}
          roughness={0.9}
        />
      </mesh>
      {on &&
        (directional ? (
          <DownSpot position={[x, shadeY - shadeH / 2, z]} lm={out.lm} color={light} angleDeg={60} />
        ) : up ? (
          <DownSpot position={[x, shadeY + shadeH / 2, z]} lm={out.lm} color={light} angleDeg={120} aim={[0, 1, 0]} />
        ) : (
          <pointLight position={[x, shadeY, z]} intensity={out.lm / (4 * Math.PI)} color={light} decay={2} />
        ))}
    </group>
  );
}
