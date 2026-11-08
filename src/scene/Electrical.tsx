import * as THREE from 'three';
import { Html } from '@react-three/drei';
import type { ElecPoint, Room, WallId } from '../model/types';
import { ELEC_KIND_LABEL as KIND_LABEL, ELEC_STATE_LABEL as STATE_LABEL, elecColor as colorOf } from '../lib/electrical';
import { mm, roomDims } from '../lib/geom';
import { info } from '../lib/inspect';
import { STATUS_INFO } from '../lib/status';
import { Box } from './Box';

// Villamosság réteg: a dugaljak, kapcsolók és kiállások jelzése (room.electrical). Jelzés, nem termékmodell: a
// szerelvény valós méretű, körülötte színes keret, hogy messziről is látsszon. A lámpák ettől függetlenül megmaradnak.

/** A falmenti távolság kezdősarka: az x-falakon a z0, a z-falakon az x0 fal felőli sarok. */
const START_WALL: Record<WallId, WallId> = { x0: 'z0', x1: 'z0', z0: 'x0', z1: 'x0' };

function elecInfo(room: Room, p: ElecPoint) {
  const kind = `${KIND_LABEL[p.kind]}${p.gang && p.gang > 1 ? ` (${p.gang} szerelvény)` : ''} · ${STATE_LABEL[p.state]}`;
  let where: string;
  if (p.light) {
    const l = room.ceilingLights.find((c) => c.id === p.light);
    where = l ? `Mennyezet: x ${l.x.v} mm (${l.x.s}), z ${l.z.v} mm (${l.z.s}) – a lámpahelyőrző (${l.id}) pontján` : 'Mennyezet';
  } else {
    const st = (s: keyof typeof STATUS_INFO) => STATUS_INFO[s].label.toLowerCase();
    where = `${room.walls[p.wall!].name}: a közép ${p.a!.v} mm a(z) „${room.walls[START_WALL[p.wall!]].name}” felőli saroktól (${st(p.a!.s)}), ${p.y!.v} mm magasan${p.yTo === 'bottom' ? ' (alsó éle)' : ''} (${st(p.y!.s)})`;
  }
  const ref = p.ref && `Mért távolság: ${p.ref.v.v} mm ${p.ref.from} (a szerelvény szélétől)`;
  return info(`${room.name} – ${p.label} (${p.id})`, kind, where, ref, p.note, p.photos?.length ? `Fotó: ${p.photos.join(', ')}` : undefined);
}

const PLATE = '#f4f3ee';
const INSERT = '#dddcd5';
const DARK = '#2d2d2d';

/** Két átlós léc (X) a helyi xy síkban, z mélységben. */
function Cross({ len, w, z, color }: { len: number; w: number; z: number; color: string }) {
  return (
    <>
      {[Math.PI / 4, -Math.PI / 4].map((r) => (
        <mesh key={r} rotation={[0, 0, r]} position={[0, 0, z]}>
          <boxGeometry args={[len, w, 0.004]} />
          <SignalMaterial color={color} />
        </mesh>
      ))}
    </>
  );
}

/**
 * A jelzés színes részei fénytől függetlenek (és tónusleképezés nélküliek): minden fényjelenetben ugyanolyan színűek,
 * és a mellettük ülő lámpa fényforrása sem égeti ki őket fehérre.
 */
function SignalMaterial({ color }: { color: string }) {
  return <meshBasicMaterial color={color} toneMapped={false} side={THREE.DoubleSide} />;
}

/** Színes jelzőkeret (doboz) a sarokkoordinátáival (m). */
function SignalBox({ x, y, z, color }: { x: [number, number]; y: [number, number]; z: [number, number]; color: string }) {
  return (
    <mesh position={[(x[0] + x[1]) / 2, (y[0] + y[1]) / 2, (z[0] + z[1]) / 2]}>
      <boxGeometry args={[x[1] - x[0], y[1] - y[0], z[1] - z[0]]} />
      <SignalMaterial color={color} />
    </mesh>
  );
}

/** Kerek dugaljbetét két lyukkal, a helyi rendszer (0, 0) pontjában, z = a lap síkja. */
function SocketInsert({ z }: { z: number }) {
  return (
    <group>
      <mesh rotation={[Math.PI / 2, 0, 0]} position={[0, 0, z + 0.003]}>
        <cylinderGeometry args={[0.026, 0.026, 0.006, 24]} />
        <meshStandardMaterial color={INSERT} roughness={0.5} />
      </mesh>
      {[-0.0095, 0.0095].map((x) => (
        <mesh key={x} rotation={[Math.PI / 2, 0, 0]} position={[x, 0, z + 0.0062]}>
          <cylinderGeometry args={[0.0042, 0.0042, 0.001, 12]} />
          <meshStandardMaterial color={DARK} roughness={0.8} />
        </mesh>
      ))}
    </group>
  );
}

/** A szerelvény fél szélessége, fél magassága és mélysége (m); a dupla dugalj két szerelvénye egymás fölött. */
function markSize(p: ElecPoint): [number, number, number] {
  if (p.kind === 'panel') return [0.13, 0.13, 0.09];
  if (p.kind === 'intercom') return [0.045, 0.105, 0.05];
  if (p.kind === 'wallLight') return [0.07, 0.07, 0.012];
  return [0.04, 0.04 * (p.gang ?? 1), 0.012];
}

/** A szerelvény közepének magassága (m): az `y` a közép, vagy `yTo: 'bottom'` esetén az alsó él. */
function centerY(p: ElecPoint) {
  return mm(p.y!.v) + (p.yTo === 'bottom' ? markSize(p)[1] : 0);
}

const DIM = '#263238';

/**
 * Felirat a szerelvény mellett (nem takarja): a bal felső sarka a horgonypontnál, a `side` felé eltolva, függőlegesen
 * középre igazítva. Soronként szöveg és státusz.
 */
function DimLabel({ position, side, lines }: { position: [number, number, number]; side: 'left' | 'right'; lines: [string, string][] }) {
  const shift = side === 'right' ? 'translate(8px, -50%)' : 'translate(calc(-100% - 8px), -50%)';
  return (
    <Html position={position} distanceFactor={4.5} zIndexRange={[20, 0]}>
      <div className="dim-label elec-label" style={{ transform: shift }}>
        {lines.map(([text, s]) => (
          <div key={text}>
            {text}
            <span>{s}</span>
          </div>
        ))}
      </div>
    </Html>
  );
}

/**
 * Méretek (a Méretek és a Villamosság réteg együtt): a padlótól mért magasság – ameddig a napló mért (közép vagy alsó él) –,
 * és ha a napló rögzít ilyet, a vízszintes távolság a legközelebbi tárgytól (`ref`), a szerelvény szélétől. Csak dugaljra
 * és kapcsolóra; ismeretlen (U) magasságnál nincs méret.
 */
export function ElecWallDims({ p }: { p: ElecPoint }) {
  if (!p.wall || !p.a || !p.y || (p.kind !== 'socket' && p.kind !== 'switch') || p.y.s === 'U') return null;
  const a = mm(p.a.v);
  const [hw, hh] = markSize(p);
  const yc = centerY(p);
  const yEnd = p.yTo === 'bottom' ? yc - hh : yc;
  const t = 0.006; // vonalvastagság
  const tick = 0.03;
  const r = p.ref;
  const edge = r ? (r.side === 'start' ? a - hw : a + hw) : 0;
  const far = r ? edge + (r.side === 'start' ? -1 : 1) * mm(r.v.v) : 0;
  const [h0, h1] = [Math.min(edge, far), Math.max(edge, far)];
  const kb = (s: string) => (s === 'A' ? 'kb. ' : '');
  const lines: [string, string][] = [[`${p.id} ↕ ${kb(p.y.s)}${p.y.v} mm${p.yTo === 'bottom' ? ' (alsó éle)' : ''}`, p.y.s]];
  if (r) lines.push([`↔ ${kb(r.v.s)}${r.v.v} mm ${r.from}`, r.v.s]);
  // a felirat a méretvonallal ellentétes oldalra kerül, vonal nélkül a helyiségből nézve jobbra; a tükrözött
  // falkereteken (z1, x0) a fal helyi +x iránya a helyiségből nézve balra esik, ezért ott a képernyős eltolás fordított
  const mirrored = p.wall === 'z1' || p.wall === 'x0';
  const plus = r ? r.side === 'start' : !mirrored;
  return (
    <group>
      {/* magasság: a padlótól a mért pontig (a szerelvény mögött fut) */}
      <SignalBox x={[a - t / 2, a + t / 2]} y={[0, yEnd]} z={[0.001, 0.003]} color={DIM} />
      <SignalBox x={[a - tick, a + tick]} y={[yEnd - t / 2, yEnd + t / 2]} z={[0.001, 0.003]} color={DIM} />
      {r && (
        <>
          <SignalBox x={[h0, h1]} y={[yc - t / 2, yc + t / 2]} z={[0.005, 0.007]} color={DIM} />
          <SignalBox x={[h0 - t / 2, h0 + t / 2]} y={[yc - tick, yc + tick]} z={[0.005, 0.007]} color={DIM} />
          <SignalBox x={[h1 - t / 2, h1 + t / 2]} y={[yc - tick, yc + tick]} z={[0.005, 0.007]} color={DIM} />
        </>
      )}
      <DimLabel position={[plus ? a + hw + 0.03 : a - hw - 0.03, yc, 0.02]} side={plus !== mirrored ? 'right' : 'left'} lines={lines} />
    </group>
  );
}

/**
 * Falon lévő pont a fal helyi rendszerében (Walls.tsx – WallContent): x a fal mentén, y fel, z a helyiség felé (m).
 * A tükrözött falkereteken (z1, x1) is szimmetrikus, ezért ott is helyes.
 */
export function ElecWallMark({ room, p }: { room: Room; p: ElecPoint }) {
  if (!p.wall || !p.a || !p.y) return null;
  const a = mm(p.a.v);
  const y = centerY(p);
  const c = colorOf(p);
  const gang = p.gang ?? 1;
  const [hw, hh, d] = markSize(p);
  const m = 0.03; // a színes keret szélessége a szerelvény körül
  const plate = p.state === 'disused' ? '#b9b9b4' : PLATE;
  return (
    <group userData={elecInfo(room, p)}>
      <SignalBox x={[a - hw - m, a + hw + m]} y={[y - hh - m, y + hh + m]} z={[0, 0.004]} color={c} />
      <Box x={[a - hw, a + hw]} y={[y - hh, y + hh]} z={[0.004, 0.004 + d]} color={plate} rough={0.5} noShadow />
      <group position={[a, y, 0]}>
        {p.kind === 'socket' &&
          Array.from({ length: gang }, (_, i) => (
            <group key={i} position={[0, (i - (gang - 1) / 2) * 0.08, 0]}>
              <SocketInsert z={0.004 + d} />
            </group>
          ))}
        {p.kind === 'switch' && <Box x={[-0.022, 0.022]} y={[-0.028, 0.028]} z={[0.004 + d, 0.012 + d]} color="#e9e8e2" rough={0.45} noShadow />}
        {p.kind === 'data' && <Box x={[-0.012, 0.012]} y={[-0.009, 0.009]} z={[0.004 + d, 0.006 + d]} color={DARK} rough={0.8} noShadow />}
        {p.kind === 'wallLight' && <Cross len={0.17} w={0.016} z={0.006 + d} color={c} />}
        {p.kind === 'intercom' && <Box x={[-0.03, 0.03]} y={[0.02, 0.08]} z={[0.004 + d, 0.008 + d]} color="#d8d7d0" rough={0.5} noShadow />}
        {p.kind === 'panel' && <Box x={[-0.11, 0.11]} y={[0.06, 0.1]} z={[0.004 + d, 0.006 + d]} color="#d9d3c2" rough={0.6} noShadow />}
        {p.state === 'disused' && <Cross len={2.2 * hh + 0.03} w={0.01} z={0.008 + d} color="#c92a2a" />}
      </group>
    </group>
  );
}

/** Mennyezeti kiállások jelzése a helyiség rendszerében: kör kereszttel, közvetlenül a mennyezet alatt (alulról és felülnézetből is). */
export function ElectricalCeiling({ room }: { room: Room }) {
  const { H } = roomDims(room);
  return (
    <>
      {(room.electrical ?? [])
        .filter((p) => p.kind === 'ceiling' && p.light)
        .map((p) => {
          const l = room.ceilingLights.find((c) => c.id === p.light);
          if (!l) return null;
          const c = colorOf(p);
          return (
            <group key={p.id} position={[mm(l.x.v), H - 0.004, mm(l.z.v)]} rotation={[Math.PI / 2, 0, 0]} userData={elecInfo(room, p)}>
              <mesh>
                <ringGeometry args={[0.3, 0.345, 48]} />
                <SignalMaterial color={c} />
              </mesh>
              <mesh>
                <circleGeometry args={[0.06, 24]} />
                <SignalMaterial color={c} />
              </mesh>
              <Cross len={0.66} w={0.03} z={0} color={c} />
            </group>
          );
        })}
    </>
  );
}
