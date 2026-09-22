import { defineConfig, type Plugin } from 'vite';
import { GAME_VERSION } from './src/config';

const now = new Date();
const pad = (n: number) => n.toString().padStart(2, '0');
const yyyy = now.getFullYear();
const mm = pad(now.getMonth() + 1);
const dd = pad(now.getDate());
const hh = pad(now.getHours());
const ii = pad(now.getMinutes());
const versionString = `ver ${GAME_VERSION} (${yyyy}${mm}${dd}${hh}${ii})`;

const buildIdentityPlugin: Plugin = {
  name: 'emit-build-identity',
  generateBundle() {
    this.emitFile({
      type: 'asset',
      fileName: 'build-info.json',
      source: `${JSON.stringify({ sourceSha: process.env.GITHUB_SHA ?? 'local' }, null, 2)}\n`,
    });
  },
};

export default defineConfig({
  plugins: [buildIdentityPlugin],
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
