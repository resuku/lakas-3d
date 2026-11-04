import * as THREE from 'three';
import { useEffect, useMemo, useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { Html } from '@react-three/drei';
import type { Bed as BedT, FurnColor, FurnSpec, Room, Val, Variant } from '../model/types';
import { COLOR_SOURCE_LABEL } from '../data/products';
import { useStore, type Layers } from '../store';
import { makeFloorTexture } from '../lib/floorTexture';
import { formLabel } from '../lib/cabinetForm';
import { useLocalTextures } from '../lib/localTextures';
import { activeFurnishing, furnishGaps, replacedIds, type ResolvedSpec } from '../lib/furnish';
import { furnitureFit, furniturePalette, type FurniturePalette } from '../lib/furnitureFit';
import { mm, roomDims } from '../lib/geom';
import { STATUS_INFO, worst } from '../lib/status';
import { Box } from './Box';
import { FurnitureModel } from './FurnitureModels';
import { setGhost } from './ghost';
import { useStudio } from './studio';
import { ceilingInfo, floorInfo, info, infoUrl } from '../lib/inspect';
import { CLASH_PREFIX, colorClashes } from '../lib/colorClash';
import { findSubVariant } from '../data/subVariants';

export function FloorAndCeiling({ room, variant }: { room: Room; variant: Variant }) {
  const { W, L, H } = roomDims(room);
  // Eltérő padló (pl. járólap), ha a változat padlója kifejezetten nem terjed ki a helyiségre
  const own = room.floor && variant.floorAll === false ? room.floor : null;
  const { pattern, tone, plank } = own ?? variant.floor;
  const dir = variant.floor.dir;
  const pl = plank?.l;
  const pw = plank?.w;
  // helyi fotótextúra a változat padlótermékéhez (a helyiség saját burkolatához nem)
  const local = useLocalTextures();
  const photo = own ? null : (local?.floors[variant.products?.floor ?? ''] ?? null);
  const tex = useMemo(
    () => makeFloorTexture(pattern, tone, dir, W, L, pl && pw ? { l: pl, w: pw } : undefined, false, photo),
    [pattern, tone, dir, W, L, pl, pw, photo],
  );
  useEffect(() => () => tex.dispose(), [tex]);
  const ceiling = useRef<THREE.Mesh>(null);
  const camera = useThree((s) => s.camera);
  const studio = useStudio();
  useFrame(() => {
    if (ceiling.current) setGhost(ceiling.current, camera.position.y > H - 0.01);
  });
  return (
    <>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[W / 2, 0, L / 2]} receiveShadow userData={floorInfo(room, variant)}>
        <planeGeometry args={[W, L]} />
        <meshStandardMaterial map={tex} roughness={pattern === 'tile' ? 0.35 : 0.55} />
      </mesh>
      {/* A mennyezet árnyékot is vet, különben a nap felülről besütne; termékhű nézetben nem, mert a stúdió felülfénye a
          bútorok alá vet árnyékot. */}
      <mesh ref={ceiling} rotation={[Math.PI / 2, 0, 0]} position={[W / 2, H, L / 2]} castShadow={!studio} receiveShadow userData={ceilingInfo(room, variant)}>
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

const COLOR_ROLE: Record<FurnColor, keyof FurniturePalette | null> = {
  upholstery: 'upholstery',
  upholstery2: 'upholstery2',
  wood: 'wood',
  body: 'body',
  rug: 'rug',
  black: null,
};

/** A berendezési javaslat bútorai (data/furnishing.ts); a szín a változat bútor-színvilágából. */
function Furnishing({ room, specs, variant, layers }: { room: Room; specs: ResolvedSpec[]; variant: Variant; layers: Layers }) {
  const pal = useMemo(() => furniturePalette(furnitureFit(variant)), [variant]);
  const choices = useStore((s) => s.choices);
  const picks = useStore((s) => s.furniturePicks);
  const clash = useMemo(() => new Map(colorClashes(variant, choices, picks, [], [room.id]).map((c) => [c.id, c])), [variant, choices, picks, room.id]);
  // az aljavaslat (csak a saját J-javaslatánál) a helyőrző színszerepét is megadhatja
  const sub = useStore((s) => findSubVariant(s.activeSubId));
  const colors = sub?.parent === variant.id ? sub.colors : undefined;
  const gaps = useMemo(() => (layers.dims ? furnishGaps(room.id, specs) : []), [layers.dims, room.id, specs]);
  const local = useLocalTextures();
  return (
    <>
      {specs.map((f) => {
        const role = COLOR_ROLE[colors?.[f.id] ?? f.color];
        const cl = clash.get(f.slot ?? f.id);
        const warn = cl && `${CLASH_PREFIX} (legközelebbi minta: ${cl.fit.label})`;
        const item = role ? pal[role] : null;
        const p = f.product;
        const tint = layers.status ? STATUS_INFO[f.s].color : null;
        const wood = !tint && p ? local?.woods[p.id] : undefined;
        const c = { main: tint ?? p?.hex ?? item?.hex ?? '#1a1b1d', metal: tint ?? pal.metal.hex, tinted: !!tint, wood };
        const partForms = p?.parts?.some((x) => x.form);
        const ud = p
          ? infoUrl(
              p.url,
              `${room.name} – ${f.label}`,
              `${p.store}: ${p.brand ? `${p.brand} ` : ''}${p.name}${p.price ? ` · ${p.price}` : ''}`,
              `${f.w} × ${f.d} × ${f.h} mm (a termékoldal szerint; ami ott nincs, a helyőrzőé)${p.form?.base === 'wall' && f.kind !== 'tvWall' ? `, falra szerelve, alsó éle ${p.form.baseH ?? 0} mm (feltételezés)` : ''}`,
              `Szín: ${p.colorName ?? p.hex} (${COLOR_SOURCE_LABEL[p.hexSource]})`,
              p.form ? `Forma: ${formLabel(p.form)}` : partForms ? 'Forma: elemenként, a termékfotó alapján' : 'Forma: jelzésszerű (nincs termékforma)',
              p.form?.note,
              wood && 'Felület: a termékfotóból (helyi fotótextúra, nem kerül a kirakott oldalra)',
              warn,
              p.note,
            )
          : info(
              `${room.name} – ${f.label}`,
              `${f.w} × ${f.d} × ${f.h} mm, befoglaló méret (${f.s} – ${STATUS_INFO[f.s].label.toLowerCase()})`,
              !!item && `Szín: ${item.label} – a változat bútor-színvilágából, helyőrző${f.kind === 'table' || f.kind === 'chair' || f.kind === 'tvUnit' ? `; fém: ${pal.metal.label}` : ''}`,
              warn,
              f.basis,
              f.note,
            );
        if (f.kind === 'bed')
          return (
            <group key={f.id} userData={ud}>
              <Bed b={bedFromSpec(f, c.main)} textile={variant.textile} tint={tint} />
            </group>
          );
        return (
          <group key={f.id} position={[mm(f.x), mm(f.y ?? 0), mm(f.z)]} rotation={[0, ((f.rot ?? 0) * Math.PI) / 180, 0]} userData={ud}>
            <FurnitureModel f={f} c={c} />
          </group>
        );
      })}
      {gaps.map((g) => {
        const [x0, z0] = g.from;
        const [x1, z1] = g.to;
        const along = Math.abs(x1 - x0) > Math.abs(z1 - z0);
        return (
          <group key={`gap-${g.a}-${g.b}`}>
            <Box x={along ? [x0, x1] : [x0 - 0.01, x0 + 0.01]} y={[0.02, 0.027]} z={along ? [z0 - 0.01, z0 + 0.01] : [z0, z1]} color={g.gap * 1000 < g.min ? '#c62828' : '#1565c0'} noShadow />
            <Html position={[(x0 + x1) / 2, 0.08, (z0 + z1) / 2]} center distanceFactor={6}>
              <div className="dim-label" title={g.label}>
                köz ~{Math.round(g.gap * 1000)} mm<span>A</span>
              </div>
            </Html>
          </group>
        );
      })}
    </>
  );
}

/** Az új ágy a meglévő ágy modelljével: fej a −x oldalon (rot = 90), keret 30, matrac 22 cm (feltételezés). */
function bedFromSpec(f: FurnSpec, color: string): BedT {
  const a = (v: number): Val => ({ v, s: f.s });
  return {
    id: f.id,
    label: f.label,
    keep: false,
    x0: a(f.x - f.d / 2),
    z0: a(f.z - f.w / 2),
    sx: a(f.d),
    sz: a(f.w),
    h: a(300),
    mattressH: a(220),
    headH: a(f.h),
    frameColor: color,
  };
}

export function Furniture({ room, variant, layers }: { room: Room; variant: Variant; layers: Layers }) {
  const { W } = roomDims(room);
  const choices = useStore((s) => s.choices);
  const picks = useStore((s) => s.furniturePicks);
  const specs = useMemo(() => (layers.furniture ? activeFurnishing(room.id, choices, picks) : []), [layers.furniture, room.id, choices, picks]);
  const hidden = useMemo(() => replacedIds(specs), [specs]);
  return (
    <>
      <Furnishing room={room} specs={specs} variant={variant} layers={layers} />
      {(room.furniture ?? []).filter((n) => !hidden.has(n.id)).map((n) => (
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
      {room.beds.filter((b) => !hidden.has(b.id)).map((b) => (
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
        room.beds.filter((b) => !hidden.has(b.id)).map((b) => {
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
