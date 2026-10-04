import { build } from 'esbuild';
import { cpSync } from 'node:fs';

const common = { bundle: true, sourcemap: true, logLevel: 'info' };

// main and preload run in Node/Electron; the runtime provides "electron".
await build({
  ...common,
  entryPoints: { main: 'src/main/main.ts', preload: 'src/preload/preload.ts' },
  outdir: 'dist',
  platform: 'node',
  format: 'cjs',
  target: 'node22',
  external: ['electron'],
});

// The renderers run in Chromium.
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

// Shared by every renderer: the PDF.js worker (loaded as a separate file), the design tokens
// and the data PDF.js fetches on demand (image decoders, CMaps, standard fonts, CMYK profile).
cpSync(
  'node_modules/pdfjs-dist/build/pdf.worker.min.mjs',
  'dist/renderer/shared/pdf.worker.min.mjs',
);
for (const dir of ['wasm', 'cmaps', 'standard_fonts', 'iccs']) {
  cpSync(`node_modules/pdfjs-dist/${dir}`, `dist/renderer/shared/pdfjs/${dir}`, { recursive: true });
}
cpSync('src/renderer/shared/theme.css', 'dist/renderer/shared/theme.css');

for (const r of renderers) {
  cpSync(`src/renderer/${r}`, `dist/renderer/${r}`, {
    recursive: true,
    filter: (src) => !src.endsWith('.ts'),
  });
}
