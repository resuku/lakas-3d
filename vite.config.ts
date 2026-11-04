import { rmSync } from 'node:fs';
import { resolve } from 'node:path';
import { defineConfig, type Plugin } from 'vite';
import react from '@vitejs/plugin-react';

/**
 * A termékfotókból készült helyi textúrák (public/textures-local/, gitignore-olt) nem kerülhetnek a kész oldalra:
 * a Vite a public/ tartalmát a dist/-be másolja, ezért a build végén töröljük (kézi kirakásnál is biztonságos).
 */
const noLocalTextures = (): Plugin => {
  let outDir = 'dist';
  return {
    name: 'no-local-textures',
    apply: 'build',
    configResolved: (c) => {
      outDir = resolve(c.root, c.build.outDir);
    },
    closeBundle: () => rmSync(resolve(outDir, 'textures-local'), { recursive: true, force: true }),
  };
};

export default defineConfig({
  // relatív útvonalak: a kész oldal bármilyen alútvonalon (pl. GitHub Pages /lakas-3d/) működik
  base: './',
  plugins: [react(), noLocalTextures()],
  server: {
    host: true,
    port: 5173,
    // a képernyőkép-konténer (scripts/shot.mjs) innen éri el a szervert
    allowedHosts: ['host.docker.internal'],
    // Windows bind mount alatt a fájlfigyeléshez polling kell
    watch: { usePolling: true, interval: 300 },
  },
});
