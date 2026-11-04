import { useEffect } from 'react';
import { useThree } from '@react-three/fiber';
import { probeColors, type ProbeOpts } from '../lib/colorProbe';

/**
 * Fejlesztői mód: `window.__lakas.probe(opts?)` – színhűség-mérés a vásznon (lib/colorProbe.ts); a két nézetes módban
 * a jobb oldali (termékhű) vásznon `probeB`. A `three` / `threeB` az R3F-állapot (gl, scene, camera) hibakereséshez.
 */
export function DevProbe({ name = 'probe' }: { name?: string }) {
  const get = useThree((s) => s.get);
  useEffect(() => {
    const w = window as unknown as { __lakas?: Record<string, unknown> };
    const l = (w.__lakas = w.__lakas ?? {});
    const suffix = name.slice('probe'.length);
    l[name] = (o?: ProbeOpts) => {
      const st = get();
      return probeColors(st.gl, st.scene, st.camera, o);
    };
    l[`three${suffix}`] = get;
    return () => {
      if (l[`three${suffix}`] === get) {
        delete l[name];
        delete l[`three${suffix}`];
      }
    };
  }, [get, name]);
  return null;
}
