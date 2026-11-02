import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  // relatív útvonalak: a kész oldal bármilyen alútvonalon (pl. GitHub Pages /lakas-3d/) működik
  base: './',
  plugins: [react()],
  server: {
    host: true,
    port: 5173,
    // a képernyőkép-konténer (scripts/shot.mjs) innen éri el a szervert
    allowedHosts: ['host.docker.internal'],
    // Windows bind mount alatt a fájlfigyeléshez polling kell
    watch: { usePolling: true, interval: 300 },
  },
});
