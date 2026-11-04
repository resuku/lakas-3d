import * as THREE from 'three';
import { useEffect, useMemo, useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { Html } from '@react-three/drei';
import type { Room, Variant, WallId } from '../model/types';
import type { Layers } from '../store';
import { curtainLayouts } from '../lib/curtain';
import { makeFloorTexture } from '../lib/floorTexture';
import { mm, roomDims, WALL_IDS, wallFrames, type WallFrame } from '../lib/geom';
import { STATUS_INFO, worst } from '../lib/status';
import { AcUnit, DoorUnit, PipeUnit, RadiatorUnit, Skirting, WindowUnit } from './WallParts';
import { Curtain, Panel } from './Curtain';
import { DEFAULT_CHOICES } from '../data/choices';
import { useStore } from '../store';
import { curtainInfo, doorInfo, info, wallInfo, windowInfo } from '../lib/inspect';
import { Wardrobe } from './Wardrobe';
import { Box } from './Box';
import { setGhost } from './ghost';
import { useLocalTextures } from '../lib/localTextures';

const FLOOR_OPENING = 0.001;

type Rect = { x0: number; x1: number; y0: number; y1: number };

function segmentShape(left: number, right: number, H: number, openings: Rect[]) {
  const s = new THREE.Shape();
  s.moveTo(left, 0);
  // Padlóig érő nyílások a kontúr bemetszéseként (lyukként a háromszögelés hibás lenne)
  for (const o of openings.filter((o) => o.y0 < FLOOR_OPENING).sort((a, b) => a.x0 - b.x0)) {
    s.lineTo(o.x0, 0);
    s.lineTo(o.x0, o.y1);
    s.lineTo(o.x1, o.y1);
    s.lineTo(o.x1, 0);
  }
  s.lineTo(right, 0);
  s.lineTo(right, H);
  s.lineTo(left, H);
  s.closePath();
  for (const o of openings.filter((o) => o.y0 >= FLOOR_OPENING)) {
    const p = new THREE.Path();
    p.moveTo(o.x0, o.y0);
    p.lineTo(o.x0, o.y1);
    p.lineTo(o.x1, o.y1);
    p.lineTo(o.x1, o.y0);
    p.closePath();
    s.holes.push(p);
  }
  return s;
}

/** A fal teste; a teljes magasságú átjárók a falat külön szakaszokra bontják. */
function wallGeometry(f: WallFrame, H: number, openings: Rect[]) {
  const full = openings.filter((o) => o.y1 >= H - 1e-3).sort((a, b) => a.x0 - b.x0);
  const rest = openings.filter((o) => o.y1 < H - 1e-3);
  const segs: [number, number][] = [];
  let a = -f.startExt;
  for (const g of full) {
    if (g.x0 > a + 1e-3) segs.push([a, g.x0]);
    a = Math.max(a, g.x1);
  }
  const right = f.length + f.endExt;
  if (right > a + 1e-3) segs.push([a, right]);
  const shapes = segs.map(([l, r]) => segmentShape(l, r, H, rest.filter((o) => o.x0 >= l && o.x1 <= r)));
  return new THREE.ExtrudeGeometry(shapes, { depth: f.t, bevelEnabled: false });
}

function Label({ position, text, sub }: { position: [number, number, number]; text: string; sub?: string }) {
  return (
    <Html position={position} center distanceFactor={6} zIndexRange={[20, 0]}>
      <div className="dim-label">
        {text}
        {sub && <span>{sub}</span>}
      </div>
    </Html>
  );
}

/** Szürke helyőrző a nem megjelenített szomszéd helyiség helyén (ajtó- és átjárónyílás mögött). */
const NEIGHBOR = '#8c8882';

/** Választható nyílástakarás (pl. tároló): függöny a tok előtt, vagy falon futó tolólap. */
function OpeningCover({ r, kind, variant }: { r: { x0: number; x1: number; y0: number; y1: number }; kind: string; variant: Variant }) {
  if (kind === 'curtain') {
    return (
      <group>
        <Box x={[r.x0 - 0.04, r.x1 + 0.04]} y={[r.y1 + 0.02, r.y1 + 0.035]} z={[0.03, 0.045]} color="#3a3938" metal={0.5} rough={0.4} noShadow />
        <Panel a={r.x0 - 0.03} b={r.x1 + 0.03} bottom={0.015} top={r.y1 + 0.02} z={0.04} closed color={variant.curtain.color} sheer={false} />
      </group>
    );
  }
  if (kind === 'panel') {
    const w = r.x1 - r.x0 + 0.1;
    // a lap a nyílás előtt; a sín a bejárat felé (kisebb x) a lap kétszeres hosszán fut
    return (
      <group>
        <Box x={[r.x1 + 0.05 - 2 * w, r.x1 + 0.05]} y={[r.y1 + 0.06, r.y1 + 0.09]} z={[0.012, 0.04]} color="#2b2a28" metal={0.5} rough={0.4} noShadow />
        <Box x={[r.x0 - 0.05, r.x1 + 0.05]} y={[0.01, r.y1 + 0.06]} z={[0.045, 0.065]} color={variant.door} rough={0.45} />
        <Box x={[r.x0 - 0.01, r.x0 + 0.01]} y={[0.9, 1.15]} z={[0.065, 0.085]} color="#2b2a28" metal={0.5} rough={0.4} noShadow />
      </group>
    );
  }
  return null;
}

function WallContent({ room, f, variant, layers, connected }: { room: Room; f: WallFrame; variant: Variant; layers: Layers; connected: Set<string> }) {
  const { H } = roomDims(room);
  const choices = useStore((s) => s.choices);
  const choiceOf = (g: string) => choices[g] ?? DEFAULT_CHOICES[g];
  // helyi fotótextúra a változat ajtótermékéhez (a fix lapokhoz – bejárati, tároló – nem)
  const doorTex = useLocalTextures()?.woods[variant.products?.door ?? ''];
  const id = f.id;
  const openings = room.openings.filter((o) => o.wall === id);
  const rects = openings.map((o) => ({
    x0: mm(o.offset.v),
    x1: mm(o.offset.v + o.width.v),
    y0: mm(o.bottom.v),
    y1: mm(o.bottom.v + o.height.v),
  }));
  const geomKey = JSON.stringify(rects) + f.length + f.t + H;
  const geom = useMemo(() => wallGeometry(f, H, rects), [geomKey]);
  useEffect(() => () => geom.dispose(), [geom]);

  const lengthVal = id === 'z0' || id === 'z1' ? room.size.x : room.size.z;
  const st = layers.status;
  const tintOf = (...vals: Parameters<typeof worst>) => (st ? STATUS_INFO[worst(...vals)].color : null);
  const paint = variant.accents[`${room.id}.${id}`] ?? variant.wall;
  const wallColor = tintOf(lengthVal, room.size.h) ?? paint;
  const rough = variant.wallFinish === 'matt' ? 0.95 : 0.6;
  // Fa falpanel: 650 mm széles függőleges lapok; a fal UV-ja méterben fut a -startExt ponttól
  const wood = !layers.status && !!variant.accentWood?.includes(`${room.id}.${id}`);
  const woodTex = useMemo(() => {
    if (!wood) return null;
    const Wt = f.length + f.startExt + f.endExt;
    const t = makeFloorTexture('plank', paint, 'z', Wt, H, { l: 2750, w: 650 }, true);
    t.wrapS = t.wrapT = THREE.RepeatWrapping;
    t.repeat.set(1 / Wt, 1 / H);
    t.offset.set(f.startExt / Wt, 0);
    return t;
  }, [wood, paint, f.length, f.startExt, f.endExt, H]);
  useEffect(() => () => woodTex?.dispose(), [woodTex]);

  const skH = mm(variant.skirting.h);
  const skColor = variant.skirting.mode === 'wall' ? paint : variant.skirting.mode === 'door' ? variant.door : '#f3f2ee';
  const cuts = openings
    .map((o, i) => ({ trim: o.trim ? 0.06 : 0, r: rects[i] }))
    .filter(({ r }) => r.y0 < skH)
    .map(({ trim, r }) => [r.x0 - trim, r.x1 + trim] as [number, number]);
  const curtains = curtainLayouts(room, variant, choices).filter((c) => c.wall === id);

  return (
    <>
      <mesh geometry={geom} position={[0, 0, -f.t]} castShadow receiveShadow userData={{ ...wallInfo(room, id, variant), wallId: id }}>
        {woodTex ? <meshStandardMaterial key="wood" map={woodTex} roughness={0.85} /> : <meshStandardMaterial key="paint" color={wallColor} roughness={rough} />}
      </mesh>
      {openings.map((o) =>
        o.kind === 'passage' ? null : o.kind === 'window' ? (
          <group key={o.id} userData={windowInfo(room, o)}>
            <WindowUnit o={o} t={f.t} tint={tintOf(o.offset, o.width, o.height, o.bottom)} zones={layers.zones} />
          </group>
        ) : (
          <group key={o.id} userData={doorInfo(room, o, variant, !!o.leaf && (o.leaf.existing || (!!o.leaf.optional && variant.doorLeafOptional)))}>
          <DoorUnit
            o={o}
            t={f.t}
            color={o.leaf?.fixed?.color ?? variant.door}
            tint={tintOf(o.offset, o.width, o.height, o.bottom)}
            showLeaf={!!o.leaf && (o.leaf.existing || (!!o.leaf.optional && variant.doorLeafOptional))}
            open={layers.doorsOpen}
            zones={layers.zones}
            style={o.leaf?.fixed ? o.leaf.fixed.style : variant.doorStyle}
            handle={o.leaf?.fixed ? 'steel' : variant.handle}
            tex={o.leaf?.fixed ? undefined : doorTex}
          />
          </group>
        ),
      )}
      {openings
        .filter((o) => o.kind !== 'window' && !connected.has(o.id))
        .map((o, i) => {
          const r = rects[openings.indexOf(o)];
          return (
            <group key={`nb${i}`} userData={info(`${o.label} mögött`, 'Nem modellezett helyiség (szürke helyőrző)')}>
              <Box x={[r.x0 - 0.05, r.x1 + 0.05]} y={[0, Math.min(r.y1 + 0.05, H)]} z={[-f.t - 0.8, -f.t - 0.01]} color={NEIGHBOR} rough={1} noShadow />
            </group>
          );
        })}
      {room.radiators
        .filter((r) => r.wall === id)
        .map((r) => (
          <group key={r.id} userData={info(`${room.name} – ${r.label} (${r.id})`, `${r.width.v} × ${r.height.v} mm, alja ${r.bottom.v} mm`, `Faltól ${r.gap.v} mm, mélység ${r.depth.v} mm`)}>
            <RadiatorUnit r={r} tint={tintOf(r.offset, r.width, r.height, r.bottom, r.gap, r.depth)} zones={layers.zones} />
          </group>
        ))}
      {openings
        .filter((o) => o.coverGroup)
        .map((o) => (
          <group key={`cv-${o.id}`} userData={info(`${o.label} – takarás`, { curtain: 'Textil függöny (a változat függönyszíne)', panel: 'Falon futó tolólap (ajtószínű)', open: 'Nyitott' }[choiceOf(o.coverGroup!)] ?? '', 'Nyitott lehetőség, nem döntés')}>
            <OpeningCover r={rects[openings.indexOf(o)]} kind={choiceOf(o.coverGroup!)} variant={variant} />
          </group>
        ))}
      {(room.units ?? [])
        .filter((u) => u.wall === id && (!u.choice || choiceOf(u.choice.group) === u.choice.option))
        .map((u) => (
          <group key={u.id} userData={info(`${room.name} – ${u.label}`, `${u.width.v} × ${u.height.v} × ${u.depth.v} mm, alja ${u.bottom.v} mm`, u.note)}>
            <AcUnit u={u} tint={tintOf(u.offset, u.width, u.height, u.bottom, u.depth)} zones={layers.zones} />
          </group>
        ))}
      {room.pipes
        .filter((p) => p.wall === id)
        .map((p) => (
          <group key={p.id} userData={info(`${room.name} – ${p.label} (${p.id})`, `Ø ${p.d} mm`, p.note)}>
            <PipeUnit p={p} tint={st ? STATUS_INFO[p.s].color : null} />
          </group>
        ))}
      {skH > 0 && (
        <group userData={info('Szegélyléc', `${variant.skirting.h} mm, ${{ wall: 'falszínű', door: 'ajtószínű', white: 'fehér' }[variant.skirting.mode]}`)}>
          <Skirting length={f.length} cuts={cuts} h={skH} color={st ? '#9e9e9e' : skColor} />
        </group>
      )}
      {curtains.map((c) => (
        <group key={c.wall} userData={curtainInfo(room, variant)}>
          <Curtain layout={c} color={variant.curtain.color} sheer={variant.curtain.sheer} closed={variant.curtain.closed} sheerLayer={variant.curtain.sheerLayer} />
        </group>
      ))}
      {room.wardrobe && room.wardrobe.wall === id && (
        <group userData={info(`${room.name} – ${room.wardrobe.label}`, `Front: ${{ mirror: 'tükör', mirrorWood: 'tükör + fa', wood: 'fa', white: 'fehér' }[variant.wardrobeFront]}`, room.wardrobe.note)}>
        <Wardrobe
          w={room.wardrobe}
          front={variant.wardrobeFront}
          woodTone="#c9a47a"
          tint={st ? STATUS_INFO[worst(room.wardrobe.from, room.wardrobe.to, room.wardrobe.depth, room.wardrobe.height)].color : null}
        />
        </group>
      )}
      {layers.dims && (
        <>
          <Label position={[f.length / 2, 0.08, 0.35]} text={`${room.walls[id].name}: ${Math.round(lengthVal.v)} mm`} sub={lengthVal.s} />
          {openings.map((o) => (
            <Label
              key={o.id}
              position={[mm(o.offset.v + o.width.v / 2), mm(o.bottom.v + o.height.v) + 0.12, 0.05]}
              text={`${o.id}: ${o.width.v} × ${o.height.v} · ${o.offset.v} mm-től`}
              sub={worst(o.offset, o.width, o.height, o.bottom)}
            />
          ))}
        </>
      )}
    </>
  );
}

const NONE = new Set<string>();

/**
 * @param connected azok a nyílások, amelyek mögött egy megjelenített helyiség van (teljes lakás nézet);
 * a többi ajtó- és átjárónyílás mögé szürke helyőrző kerül.
 */
export function Walls({ room, variant, layers, connected = NONE }: { room: Room; variant: Variant; layers: Layers; connected?: Set<string> }) {
  const frames = useMemo(() => wallFrames(room), [room]);
  const root = useRef<THREE.Group>(null);
  const groups = useRef<Partial<Record<WallId, THREE.Group | null>>>({});
  const camera = useThree((s) => s.camera);
  const tmp = useMemo(() => new THREE.Vector3(), []);
  const inv = useMemo(() => new THREE.Matrix4(), []);

  // Ha a kamera egy fal mögött (kívül) van, a falat elrejtjük – "babaház" nézet.
  // A kamera a helyiség saját rendszerébe számolva (teljes lakás nézetben a helyiség el van helyezve).
  useFrame(() => {
    if (!root.current) return;
    inv.copy(root.current.matrixWorld).invert();
    const cam = tmp.copy(camera.position).applyMatrix4(inv);
    for (const id of WALL_IDS) {
      const g = groups.current[id];
      if (!g) continue;
      const f = frames[id];
      setGhost(g, cam.clone().sub(f.origin).dot(f.n) < -0.02);
    }
  });

  return (
    <group ref={root}>
      {WALL_IDS.map((id) => (
        <group key={id} ref={(el) => void (groups.current[id] = el)} matrix={frames[id].matrix} matrixAutoUpdate={false}>
          <WallContent room={room} f={frames[id]} variant={variant} layers={layers} connected={connected} />
        </group>
      ))}
    </group>
  );
}
