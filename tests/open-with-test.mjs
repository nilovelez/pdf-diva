// Milestone 8: PDFs arriving from the system (command line, second instance, during a presentation).
import { ELECTRON, FIXTURES, LAUNCHERS, WORK } from './paths.mjs';
import { spawn, execFileSync } from 'node:child_process';
import { copyFileSync, mkdirSync, rmSync, writeFileSync } from 'node:fs';

const SP = WORK;
const PRUEBAS = FIXTURES;
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
let failures = 0;
const check = (n, c, x = '') => { if (!c) failures++; console.log(`${c ? 'OK  ' : 'FAIL'} ${n}${x ? ' — ' + x : ''}`); };
const kill = () => { try { execFileSync('powershell.exe', ['-NoProfile', '-Command', `Get-Process electron -ErrorAction SilentlyContinue | Where-Object { $_.Path -eq '${ELECTRON}' } | Stop-Process -Force; exit 0`]); } catch { /* */ } };
const count = () => Number(execFileSync('powershell.exe', ['-NoProfile', '-Command', `@(Get-Process electron -ErrorAction SilentlyContinue | Where-Object { $_.Path -eq '${ELECTRON}' -and $_.MainWindowHandle -ne 0 }).Count`]).toString().trim());

async function connect(t) {
  const ws = new WebSocket(t.webSocketDebuggerUrl);
  await new Promise((r) => (ws.onopen = r));
  let id = 0; const pending = new Map();
  ws.onmessage = (m) => { const d = JSON.parse(m.data); if (d.id && pending.has(d.id)) pending.get(d.id)(d); };
  const send = (method, params = {}) => new Promise((res) => { const i = ++id; pending.set(i, res); ws.send(JSON.stringify({ id: i, method, params })); setTimeout(() => res({}), 10000); });
  return { eval: async (e) => (await send('Runtime.evaluate', { expression: e, awaitPromise: true, returnByValue: true })).result?.result?.value };
}
async function find(name) {
  try { const t = (await (await fetch('http://127.0.0.1:9333/json')).json()).find((x) => x.type === 'page' && x.url.includes(`/${name}/`)); return t ? connect(t) : null; } catch { return null; }
}
async function waitFor(name, gone = false) {
  for (let i = 0; i < 60; i++) { const w = await find(name); if (gone ? !w : w) return w; await sleep(300); }
  throw new Error(`${name} ${gone ? 'still open' : 'missing'}`);
}
const env = (ud) => ({ ...process.env, TEST_USERDATA: ud, TEST_LANGS: 'en-US', TEST_PDF: `${PRUEBAS}\\test.pdf` });
// Second launch, as Windows does for "Open with…": same app, the file as the last argument.
const openWith = (ud, file) => spawn(ELECTRON, [`${LAUNCHERS}\\test-main.cjs`, file], { env: env(ud), stdio: 'ignore' });
const reader = (L) => L.eval(`JSON.stringify({ reader: !document.querySelector('#reader').hidden, page: document.querySelector('#page').textContent, title: document.title, notice: document.querySelector('#notice').hidden ? '' : document.querySelector('#notice').textContent })`).then(JSON.parse);

const UD = `${SP}\\ud-open`;
rmSync(UD, { recursive: true, force: true });
mkdirSync(UD, { recursive: true });
// Paths with spaces and non-ASCII characters, as real files have.
const DIR = `${SP}\\open with ñ`;
mkdirSync(DIR, { recursive: true });
const A = `${DIR}\\Charla final.pdf`;
copyFileSync(`${PRUEBAS}\\test.pdf`, A);
const B = `${DIR}\\Otra charla.PDF`;
copyFileSync(`${PRUEBAS}\\The Gold Hour.pdf`, B);
const BAD = `${DIR}\\roto.pdf`;
writeFileSync(BAD, 'not a pdf');

kill();
try {
  // 1. Started by Windows with a PDF.
  spawn(ELECTRON, [`${LAUNCHERS}\\test-main.cjs`, '--remote-debugging-port=9333', A], { env: env(UD), stdio: 'ignore' });
  let L = await waitFor('launcher');
  await sleep(2500);
  let r = await reader(L);
  check('start with a PDF: opens in the reader', r.reader && r.title.endsWith('Charla final.pdf'), JSON.stringify(r));

  // 2. Second "Open with…" while running: same window, new file, no second app.
  openWith(UD, B);
  await sleep(3500);
  r = await reader(L);
  check('second instance: file opened in the running app', r.title.endsWith('Otra charla.PDF'), JSON.stringify(r));
  check('only one app window process', count() === 1, String(count()));

  // 3. During a presentation: presentation ends, new PDF in the reader.
  await L.eval(`document.querySelector('#present:not([hidden])')?.click() ?? document.querySelector('#present-presenter').click()`);
  const P = await waitFor('presenter');
  check('presentation running', !!P);
  openWith(UD, A);
  await waitFor('presenter', true);
  await sleep(2500);
  r = await reader(L);
  check('during a presentation: it ends and the new PDF is in the reader', r.reader && r.title.endsWith('Charla final.pdf'), JSON.stringify(r));
  check('launcher is focused', (await L.eval('document.hasFocus()')) === true);

  // 4. Corrupt file: clear message, previous PDF stays.
  openWith(UD, BAD);
  await sleep(3000);
  r = await reader(L);
  check('corrupt PDF: notice, previous PDF kept', r.notice !== '' && r.title.endsWith('Charla final.pdf'), JSON.stringify(r));

  // 5. Missing file.
  openWith(UD, `${DIR}\\no existe.pdf`);
  await sleep(3000);
  r = await reader(L);
  check('missing file: "could not be read"', r.notice === 'The file could not be read.', JSON.stringify(r));

  // 6. Settings dialog open when a file arrives: it closes and the file opens.
  await L.eval(`document.querySelector('#settings-open').click()`);
  openWith(UD, B);
  await sleep(3000);
  r = await reader(L);
  check('settings closed, file opened', (await L.eval(`document.querySelector('#settings').hidden`)) === true && r.title.endsWith('Otra charla.PDF'), JSON.stringify(r));

  // 7. Second launch without a file just brings the window forward.
  openWith(UD, '--some-switch');
  await sleep(2500);
  check('plain second launch: still one app, same PDF', count() === 1 && (await reader(L)).title.endsWith('Otra charla.PDF'));
} catch (e) {
  failures++; console.log('ERROR', e.message);
} finally {
  kill();
}
console.log(failures ? `${failures} FAILED` : 'ALL OK');
