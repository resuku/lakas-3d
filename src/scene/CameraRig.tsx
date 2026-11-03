import * as THREE from 'three';
import { useEffect, useMemo, useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import type { OrbitControls as OrbitControlsImpl } from 'three-stdlib';
import type { Room } from '../model/types';
import { mm, roomDims } from '../lib/geom';
import { ROOMS } from '../data/rooms';
import { boundsOf, roomMatrix, worldRect } from '../data/layout';
import { walkAreas } from '../lib/walk';
import { type CamPose, useStore } from '../store';
import { EYE, WalkControls } from './WalkControls';

export function poseFor(room: Room, key: string): CamPose {
  const { W, L, H } = roomDims(room);
  if (key === 'overview') {
    return { pos: [W * 0.5 - W * 1.1, H * 2.4, L * 0.5 - L * 1.25], target: [W / 2, 0.4, L / 2] };
  }
  if (key === 'top') {
    return { pos: [W / 2, Math.max(W, L) * 1.9, L / 2 + 0.001], target: [W / 2, 0, L / 2] };
  }
  const p = room.cameras[Number(key)] ?? room.cameras[0];
  return { pos: p.pos.map(mm) as CamPose['pos'], target: p.target.map(mm) as CamPose['target'] };
}

/** Teljes lakás nézetben: a helyiség nézőpontjai a helyére téve; áttekintő és felülnézet a teljes lakásra. */
export function wholePoseFor(room: Room, key: string): CamPose {
  if (key === 'overview' || key === 'top') {
    const b = boundsOf(ROOMS.map((r) => worldRect(r)));
    const cx = (b.x0 + b.x1) / 2;
    const cz = (b.z0 + b.z1) / 2;
    const span = Math.max(b.x1 - b.x0, b.z1 - b.z0);
    // déli irányból, az erkély felől
    if (key === 'overview') return { pos: [cx + span * 0.15, span * 1.05, b.z0 - span * 0.45], target: [cx, 0, cz] };
    // észak (+z) a kép tetején
    return { pos: [cx, span * 1.55, cz - 0.001], target: [cx, 0, cz] };
  }
  const p = poseFor(room, key);
  const m = roomMatrix(room.id);
  return {
    pos: new THREE.Vector3(...p.pos).applyMatrix4(m).toArray() as CamPose['pos'],
    target: new THREE.Vector3(...p.target).applyMatrix4(m).toArray() as CamPose['target'],
  };
}

export function CameraRig({ room, viewId }: { room: Room; viewId: string }) {
  const controls = useRef<OrbitControlsImpl>(null);
  const camera = useThree((s) => s.camera);
  const req = useStore((s) => s.camRequest);
  const publish = useStore((s) => s.publishCamera);
  const walk = useStore((s) => s.walk);
  const whole = useStore((s) => s.whole);
  // M nyomva: a dekor mozgatása egérrel, a kamera ilyenkor nem forog
  const moveKey = useStore((s) => s.moveKey);
  const areas = useMemo(() => walkAreas(whole ? ROOMS : [room], whole), [whole, room]);
  const driving = useRef(false);
  const lastSync = useRef(0);

  const apply = (pose: CamPose) => {
    camera.position.set(...pose.pos);
    camera.lookAt(...pose.target);
    controls.current?.target.set(...pose.target);
    controls.current?.update();
  };

  useEffect(() => {
    const pose = whole ? wholePoseFor(room, req.key) : poseFor(room, req.key);
    // bejárásban a nézőpont szemmagasságba kerül, a nézési irány marad
    if (walk) pose.pos[1] = pose.target[1] = EYE;
    apply(pose);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [req.n, room.id, whole]);

  // A bejárásból kilépve a keringés a nézési irányban, 1,5 m-re lévő pont körül folytatódik
  useEffect(() => {
    if (walk || !controls.current) return;
    const dir = new THREE.Vector3();
    camera.getWorldDirection(dir);
    controls.current.target.copy(camera.position).addScaledVector(dir, 1.5);
    controls.current.update();
  }, [walk, camera]);

  useFrame(() => {
    if (walk) return;
    const s = useStore.getState().camSync;
    if (s.n !== lastSync.current) {
      lastSync.current = s.n;
      if (s.from !== viewId) apply(s);
    }
  });

  const onChange = () => {
    if (!driving.current || !controls.current) return;
    const t = controls.current.target as THREE.Vector3;
    publish({ pos: camera.position.toArray() as CamPose['pos'], target: t.toArray() as CamPose['target'] }, viewId);
  };

  if (walk) return <WalkControls key={`${room.id}-${req.n}-${whole}`} areas={areas} viewId={viewId} />;

  return (
    <OrbitControls
      ref={controls}
      makeDefault
      enabled={!moveKey}
      enableDamping={false}
      rotateSpeed={0.5}
      zoomSpeed={0.8}
      minDistance={0.2}
      maxDistance={60}
      onStart={() => (driving.current = true)}
      onEnd={() => (driving.current = false)}
      onChange={onChange}
    />
  );
}
