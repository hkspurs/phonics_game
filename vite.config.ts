import { defineConfig } from 'vite';

const now = new Date();
const pad = (n: number) => n.toString().padStart(2, '0');
const yyyy = now.getFullYear();
const mm = pad(now.getMonth() + 1);
const dd = pad(now.getDate());
const hh = pad(now.getHours());
const ii = pad(now.getMinutes());
const versionString = `ver 1.${yyyy}${mm}${dd}${hh}${ii}`;

export default defineConfig({
  base: './',
  define: {
    __APP_VERSION__: JSON.stringify(versionString),
  },
  build: {
    target: 'esnext',
    outDir: 'dist',
    assetsDir: 'assets',
    sourcemap: true,
  },
  server: {
    port: 3000,
    open: false,
  },
});

