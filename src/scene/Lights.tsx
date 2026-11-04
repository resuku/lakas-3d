import * as THREE from 'three';
import { useEffect, useLayoutEffect, useMemo, useRef, type RefObject } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { RectAreaLightUniformsLib } from 'three/examples/jsm/lights/RectAreaLightUniformsLib.js';
import type { LightSettings, Room } from '../model/types';
import { lampKey, roomFixtures } from '../lib/fixtures';
import { mm, roomDims, toRoom, wallFrames } from '../lib/geom';
import { WINDOW_FACTOR, type LightingResult } from '../lib/lighting';
import { useActivePlan, useStore } from '../store';
import { FixtureMesh } from './Fixtures';

RectAreaLightUniformsLib.init();

/**
 * A termékhű nézet tónusleképezése: a three.js Neutral (Khronos PBR Neutral) pontos mása, de a sötét színekből
 * levont „fényes visszaverődés” 0,04 helyett `STUDIO_SPEC`. A Khronos-képlet egyenletes fehér környezetet feltételez,
 * amelyben minden felület kb. 4 % fényes visszaverődést kap; a stúdiófényben a matt felületeken mérve kb. 2 %
 * (lib/colorProbe.ts), ezért a 0,04-es levonással a sötét színek sötétebbek és telítettebbek lennének.
 */
const STUDIO_SPEC = 0.02;
THREE.ShaderChunk.tonemapping_pars_fragment = THREE.ShaderChunk.tonemapping_pars_fragment.replace(
  'vec3 CustomToneMapping( vec3 color ) { return color; }',
  `vec3 CustomToneMapping( vec3 color ) {
	const float F0 = ${STUDIO_SPEC.toFixed(4)};
	const float StartCompression = 0.8 - 0.04;
	const float Desaturation = 0.15;
	color *= toneMappingExposure;
	float x = min( color.r, min( color.g, color.b ) );
	float offset = x < 2.0 * F0 ? x - x * x / ( 4.0 * F0 ) : F0;
	color -= offset;
	float peak = max( color.r, max( color.g, color.b ) );
	if ( peak < StartCompression ) return color;
	float d = 1. - StartCompression;
	float newPeak = 1. - d * d / ( peak + d - StartCompression );
	color *= newPeak / peak;
	float g = 1. - 1. / ( Desaturation * ( peak - newPeak ) + 1. );
	return mix( color, vec3( newPeak ), g );
}`,
);

/** Égbolt-kupola: a színek luminanciaként (cd/m²) értendők, így ugyanaz az expozíció érvényes rájuk. */
export function SkyDome({ lr, center }: { lr: LightingResult; center: THREE.Vector3 }) {
  const geom = useMemo(() => new THREE.SphereGeometry(60, 32, 16), []);
  useEffect(() => {
    const pos = geom.attributes.position as THREE.BufferAttribute;
    const colors = new Float32Array(pos.count * 3);
    const c = new THREE.Color();
    for (let i = 0; i < pos.count; i++) {
      const y = pos.getY(i) / 60;
      if (y >= 0) c.copy(lr.horizon).lerp(lr.zenith, Math.pow(y, 0.5));
      else c.copy(lr.ground);
      colors.set([c.r, c.g, c.b], i * 3);
    }
    geom.setAttribute('color', new THREE.BufferAttribute(colors, 3));
  }, [geom, lr]);
  return (
    <mesh geometry={geom} position={center} renderOrder={-1}>
      <meshBasicMaterial vertexColors side={THREE.BackSide} depthWrite={false} />
    </mesh>
  );
}

/**
 * Helyiségváltáskor az árnyékkamera határai (shadow-camera-left/right/top/bottom) és a térkép mérete (shadow-mapSize)
 * is változik, de az R3F a vetítési mátrixot csak létrehozáskor számolja, a three.js pedig a már meglévő
 * árnyéktérképet nem méretezi át. Enélkül a kezdő helyiség (háló) kerete és 2048-as térképe maradna érvényben, és a
 * nap árnyéka a nagyobb helyiségben hibás lenne (pl. a nappaliban nem sütött be az erkélyablakon).
 */
function useShadowFrustum(light: RefObject<THREE.DirectionalLight | null>, radius: number) {
  useLayoutEffect(() => {
    const sh = light.current?.shadow;
    if (!sh) return;
    sh.camera.updateProjectionMatrix();
    if (sh.map && (sh.map.width !== sh.mapSize.x || sh.map.height !== sh.mapSize.y)) {
      sh.map.dispose();
      sh.map = null;
    }
  }, [light, radius]);
}

function Sun({ lr, center, radius }: { lr: LightingResult; center: THREE.Vector3; radius: number }) {
  const light = useRef<THREE.DirectionalLight>(null);
  const target = useMemo(() => new THREE.Object3D(), []);
  useLayoutEffect(() => {
    target.position.copy(center);
    target.updateMatrixWorld();
    if (light.current) light.current.target = target;
  }, [center, target]);
  useShadowFrustum(light, radius);
  const pos = center.clone().add(lr.sunDir.clone().multiplyScalar(20));
  return (
    <>
      <primitive object={target} />
      <directionalLight
        ref={light}
        position={pos}
        intensity={lr.sunLux}
        color={lr.sunColor}
        castShadow
        shadow-mapSize={radius > 5 ? [4096, 4096] : [2048, 2048]}
        shadow-bias={-0.0004}
        shadow-normalBias={0.02}
        shadow-camera-left={-radius}
        shadow-camera-right={radius}
        shadow-camera-top={radius}
        shadow-camera-bottom={-radius}
        shadow-camera-near={1}
        shadow-camera-far={45}
      />
    </>
  );
}

function WindowLight({ position, target, width, height, intensity, color }: { position: THREE.Vector3; target: THREE.Vector3; width: number; height: number; intensity: number; color: THREE.Color }) {
  const ref = useRef<THREE.RectAreaLight>(null);
  useLayoutEffect(() => {
    ref.current?.lookAt(target);
  }, [target, position]);
  return <rectAreaLight ref={ref} position={position} width={width} height={height} intensity={intensity} color={color} />;
}

/**
 * Helyiségenkénti fények a helyiség saját rendszerében: ablakfény és az aktív világítási terv lámpái.
 * @param shadows a lámpák árnyékot vetnek (teljes lakás nézetben a sok fényforrás miatt kikapcsolva)
 */
export function RoomLights({ room, ls, lr, shadows = true, studio = false }: { room: Room; ls: LightSettings; lr: LightingResult; shadows?: boolean; studio?: boolean }) {
  const plan = useActivePlan();
  const lampsOff = useStore((s) => s.lampsOff);
  const toggleLamp = useStore((s) => s.toggleLamp);
  const fixtures = roomFixtures(plan, room);
  const frames = useMemo(() => wallFrames(room), [room]);
  const windows = useMemo(
    () =>
      room.openings
        .filter((o) => o.kind === 'window')
        .map((o) => {
          const f = frames[o.wall];
          const cx = mm(o.offset.v + o.width.v / 2);
          const cy = mm(o.bottom.v + o.height.v / 2);
          return {
            id: o.id,
            position: toRoom(f, cx, cy, 0.01),
            target: toRoom(f, cx, cy, 1),
            width: mm(o.width.v),
            height: mm(o.height.v),
          };
        }),
    [room, frames],
  );
  return (
    <>
      {!studio &&
        lr.skyL > 0.5 &&
        windows.map((w) => (
          <WindowLight key={w.id} position={w.position} target={w.target} width={w.width} height={w.height} intensity={lr.skyL * WINDOW_FACTOR} color={lr.windowColor} />
        ))}
      {fixtures.map((f) => {
        const key = lampKey(room.id, f);
        // termékhű nézetben a lámpák csak tárgyként látszanak, fényt nem adnak
        return <FixtureMesh key={f.id} f={f} room={room} ls={ls} off={studio || !!lampsOff[key]} shadows={shadows} onToggle={() => toggleLamp(key)} />;
      })}
    </>
  );
}

/**
 * Közös fények: égbolt, félgömbfény, nap és expozíció. `lr` a nézőpont helyiségéé (expozíció, szórt fény),
 * `sunLr` egy ablakos, el nem forgatott helyiségé (napirány és égbolt a közös rendszerben).
 */
export function GlobalLights({ lr, sunLr, center, radius, hemiScale = 1 }: { lr: LightingResult; sunLr: LightingResult; center: THREE.Vector3; radius: number; hemiScale?: number }) {
  const gl = useThree((s) => s.gl);
  useEffect(() => {
    // a termékhű nézet Neutralra állítja; visszakapcsoláskor ismét az R3F alapértelmezése
    gl.toneMapping = THREE.ACESFilmicToneMapping;
    gl.toneMappingExposure = lr.exposure;
  }, [gl, lr.exposure]);
  const hemiSky = useMemo(() => new THREE.Color('#ffffff').lerp(lr.windowColor, 0.35), [lr.windowColor]);
  const hemiGround = useMemo(() => new THREE.Color('#d9cbb8'), []);
  return (
    <>
      <SkyDome lr={sunLr} center={center} />
      <hemisphereLight args={[hemiSky, hemiGround, lr.hemiI * hemiScale]} />
      {sunLr.sunLux > 0 && <Sun lr={sunLr} center={center} radius={radius} />}
    </>
  );
}

/**
 * Termékhű nézet fényereje, a „fehér kemence” egységében: 1 = a felület sugárzása épp az anyag színe.
 * - `env`: az egyenletes környezet (égbolt-fele) sugárzása, `ground` a padló felőli fele ehhez képest;
 *   a függőleges felület (1 + ground)/2 · env diffúz fényt kap;
 * - `cam`: a kamerából előre világító fény (diffúz felületen L = E·ρ/π, ezért a three.js-erőssége π-szeres);
 * - `top`: halvány, meredek felülfény az árnyékokhoz; `sky`: az ablakon át látszó háttér.
 * Kalibrálás: a szemből látott függőleges felület (1 + ground)/2 · env + cam ≈ 1 (lib/colorProbe.ts mérése).
 */
export const STUDIO = { env: 0.85, ground: 0.9, cam: 0.2, top: 0.05, sky: 0.9 };

/**
 * Egyenletes környezet (égbolt fele 1, padló fele `ground`, sima átmenettel) – a diffúz fény mellett a fényes
 * visszaverődést is adja (dielektrikumon kb. 4 %), amivel a Neutral tónusleképezés számol: a sötét színekből ennyit
 * levon, ezért környezet nélkül a sötét felület sötétebbnek és telítettebbnek látszana.
 */
function studioEnvironment(gl: THREE.WebGLRenderer) {
  const w = 64;
  const h = 32;
  const data = new Float32Array(w * h * 4);
  // az equirect textúra első sora a „lent” (v = 0 → −90°)
  for (let y = 0; y < h; y++) {
    const elev = ((y + 0.5) / h - 0.5) * 180;
    const t = Math.min(Math.max((elev + 10) / 20, 0), 1);
    const v = STUDIO.ground + (1 - STUDIO.ground) * t * t * (3 - 2 * t);
    for (let x = 0; x < w; x++) data.set([v, v, v, 1], (y * w + x) * 4);
  }
  const eq = new THREE.DataTexture(data, w, h, THREE.RGBAFormat, THREE.FloatType);
  eq.mapping = THREE.EquirectangularReflectionMapping;
  eq.needsUpdate = true;
  const pmrem = new THREE.PMREMGenerator(gl);
  const rt = pmrem.fromEquirectangular(eq);
  pmrem.dispose();
  eq.dispose();
  return rt;
}

/**
 * Termékhű nézet: semleges (fehér) stúdiófény a fényjelenet helyett, Neutral tónusleképezéssel és rögzített
 * expozícióval. Három rész: egyenletes környezet, a kamerából előre világító fény (a néző felé forduló felület
 * teljes fényt kap, mint a termékfotón), és egy halvány, meredek felülfény, amely a bútorok alá árnyékot vet.
 */
export function StudioLights({ center, radius }: { center: THREE.Vector3; radius: number }) {
  const gl = useThree((s) => s.gl);
  const scene = useThree((s) => s.scene);
  const camera = useThree((s) => s.camera);
  useEffect(() => {
    // Neutral, a stúdiófényhez illesztett levonással (lásd STUDIO_SPEC)
    gl.toneMapping = THREE.CustomToneMapping;
    gl.toneMappingExposure = 1;
    const rt = studioEnvironment(gl);
    scene.environment = rt.texture;
    scene.environmentIntensity = STUDIO.env;
    return () => {
      scene.environment = null;
      scene.environmentIntensity = 1;
      rt.dispose();
    };
  }, [gl, scene]);
  const cam = useRef<THREE.DirectionalLight>(null);
  const top = useRef<THREE.DirectionalLight>(null);
  const camTarget = useMemo(() => new THREE.Object3D(), []);
  const topTarget = useMemo(() => new THREE.Object3D(), []);
  const fwd = useMemo(() => new THREE.Vector3(), []);
  useLayoutEffect(() => {
    if (cam.current) cam.current.target = camTarget;
    topTarget.position.copy(center);
    topTarget.updateMatrixWorld();
    if (top.current) top.current.target = topTarget;
  }, [camTarget, topTarget, center]);
  useShadowFrustum(top, radius);
  useFrame(() => {
    if (!cam.current) return;
    camera.getWorldDirection(fwd);
    cam.current.position.copy(camera.position);
    camTarget.position.copy(camera.position).add(fwd);
    camTarget.updateMatrixWorld();
  });
  const topPos = useMemo(() => center.clone().add(new THREE.Vector3(0.12, 1, 0.18).normalize().multiplyScalar(20)), [center]);
  const white = useMemo(() => new THREE.Color('#ffffff'), []);
  const sky = useMemo(() => new THREE.Color('#ffffff').multiplyScalar(STUDIO.sky), []);
  return (
    <>
      <mesh position={center} renderOrder={-1}>
        <sphereGeometry args={[60, 16, 8]} />
        <meshBasicMaterial color={sky} side={THREE.BackSide} depthWrite={false} />
      </mesh>
      <directionalLight ref={cam} intensity={Math.PI * STUDIO.cam} color={white} />
      <directionalLight
        ref={top}
        position={topPos}
        intensity={Math.PI * STUDIO.top}
        color={white}
        castShadow
        shadow-mapSize={radius > 5 ? [4096, 4096] : [2048, 2048]}
        shadow-bias={-0.0004}
        shadow-normalBias={0.02}
        shadow-camera-left={-radius}
        shadow-camera-right={radius}
        shadow-camera-top={radius}
        shadow-camera-bottom={-radius}
        shadow-camera-near={1}
        shadow-camera-far={45}
      />
    </>
  );
}

export function Lights({ room, ls, lr, studio = false }: { room: Room; ls: LightSettings; lr: LightingResult; studio?: boolean }) {
  const { W, L, H } = roomDims(room);
  const center = useMemo(() => new THREE.Vector3(W / 2, H / 2, L / 2), [W, L, H]);
  const radius = Math.hypot(W, L, H) / 2 + 0.5;
  return (
    <>
      {studio ? <StudioLights center={center} radius={radius} /> : <GlobalLights lr={lr} sunLr={lr} center={center} radius={radius} />}
      <RoomLights room={room} ls={ls} lr={lr} studio={studio} />
    </>
  );
}
