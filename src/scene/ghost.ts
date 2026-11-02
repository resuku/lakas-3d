import * as THREE from 'three';

/**
 * Elrejti az objektumot a kamera elől, de az árnyékvetése megmarad
 * (a visible = false az árnyéktérképből is kivenné, és a nap "átsütne").
 */
export function setGhost(root: THREE.Object3D, ghost: boolean) {
  root.traverse((o) => {
    const m = (o as THREE.Mesh).material as THREE.Material | THREE.Material[] | undefined;
    if (!m) return;
    for (const mat of Array.isArray(m) ? m : [m]) {
      if (mat.userData.ghost === ghost) continue;
      if (mat.userData.depthWrite === undefined) mat.userData.depthWrite = mat.depthWrite;
      mat.colorWrite = !ghost;
      mat.depthWrite = ghost ? false : mat.userData.depthWrite;
      mat.userData.ghost = ghost;
    }
    if ((o as THREE.Object3D & { isReflector?: boolean }).isReflector) o.visible = !ghost;
  });
}
