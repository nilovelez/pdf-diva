import { build } from 'esbuild';
import { cpSync } from 'node:fs';

const common = { bundle: true, sourcemap: true, logLevel: 'info' };

// main y preload corren en Node/Electron; "electron" lo aporta el runtime.
await build({
  ...common,
  entryPoints: { main: 'src/main/main.ts', preload: 'src/preload/preload.ts' },
  outdir: 'dist',
  platform: 'node',
  format: 'cjs',
  target: 'node22',
  external: ['electron'],
});

// Los renderers corren en Chromium.
const renderers = ['launcher', 'audience', 'presenter'];
await build({
  ...common,
  entryPoints: Object.fromEntries(
    renderers.map((r) => [`renderer/${r}/${r}`, `src/renderer/${r}/${r}.ts`]),
  ),
  outdir: 'dist',
  platform: 'browser',
  format: 'iife',
  target: 'chrome130',
  loader: { '.svg': 'text' },
});

// Recursos compartidos por todos los renderers: el worker de PDF.js (se carga como
// archivo aparte) y las variables de diseño.
cpSync(
  'node_modules/pdfjs-dist/build/pdf.worker.min.mjs',
  'dist/renderer/shared/pdf.worker.min.mjs',
);
cpSync('src/renderer/shared/theme.css', 'dist/renderer/shared/theme.css');

for (const r of renderers) {
  cpSync(`src/renderer/${r}`, `dist/renderer/${r}`, {
    recursive: true,
    filter: (src) => !src.endsWith('.ts'),
  });
}
