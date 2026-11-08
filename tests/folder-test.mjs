// m9: the Open dialog starts in the folder of the last PDF opened (any source), kept across
// restarts, ignored if gone; a PDF that fails to open is not remembered. Also the speaker view's
// icon-only timer buttons. Uses test-main.cjs's dialog-default.txt (the dialog's defaultPath).
import { ELECTRON, FIXTURES, LAUNCHERS, WORK } from './paths.mjs';
import { spawn, execFileSync } from 'node:child_process';
import { copyFileSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import path from 'node:path';

const SP = WORK;
const PDF = `${FIXTURES}\\test.pdf`;
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
let failures = 0;
const check = (name, cond, extra = '') => {
  if (!cond) failures++;
  console.log(`${cond ? 'OK  ' : 'FAIL'} ${name}${extra ? ' — ' + extra : ''}`);
};

function kill() {
  try {
    execFileSync('powershell.exe', ['-NoProfile', '-Command',
      `Get-Process electron -ErrorAction SilentlyContinue | Where-Object { $_.Path -eq '${ELECTRON}' } | Stop-Process -Force; exit 0`]);
  } catch { /* nothing running */ }
}

async function connect(target) {
  const ws = new WebSocket(target.webSocketDebuggerUrl);
  await new Promise((r) => (ws.onopen = r));
  let id = 0;
  const pending = new Map();
  ws.onmessage = (m) => { const msg = JSON.parse(m.data); if (msg.id && pending.has(msg.id)) pending.get(msg.id)(msg); };
  const send = (method, params = {}) => new Promise((res) => { const i = ++id; pending.set(i, res); ws.send(JSON.stringify({ id: i, method, params })); setTimeout(() => res({ timeout: true }), 15000); });
  return {
    eval: async (e) => {
      const r = await send('Runtime.evaluate', { expression: e, awaitPromise: true, returnByValue: true });
      if (r.result?.exceptionDetails) return `EXCEPTION: ${r.result.exceptionDetails.exception?.description}`;
      return r.result?.result?.value;
    },
    close: () => ws.close(),
  };
}

async function waitFor(name, ms = 20000) {
  const end = Date.now() + ms;
  while (Date.now() < end) {
    try {
      const list = await (await fetch('http://127.0.0.1:9333/json')).json();
      const t = list.find((x) => x.type === 'page' && x.url.includes(`/${name}/`));
      if (t) return connect(t);
    } catch { /* starting */ }
    await sleep(300);
  }
  throw new Error(`no ${name} window`);
}

const UD = `${SP}\\ud-folder`;
const OTHER = `${SP}\\other-folder`;
const settings = () => JSON.parse(readFileSync(`${UD}\\settings.json`, 'utf8'));
const dialogDefault = () => readFileSync(`${UD}\\dialog-default.txt`, 'utf8');

async function launch(args = []) {
  kill();
  await sleep(500);
  spawn(ELECTRON, [`${LAUNCHERS}\\test-main.cjs`, '--remote-debugging-port=9333', ...args], {
    env: { ...process.env, TEST_USERDATA: UD, TEST_LANGS: 'en-US', TEST_PDF: PDF },
    stdio: 'ignore',
  });
  const L = await waitFor('launcher');
  await L.eval(`new Promise(r => document.readyState === 'complete' ? r() : addEventListener('load', r))`);
  return L;
}

async function openWithDialog(L, button) {
  rmSync(`${UD}\\dialog-default.txt`, { force: true });
  await L.eval(`document.querySelector('${button}').click()`);
  await sleep(2500);
}

try {
  rmSync(UD, { recursive: true, force: true });
  mkdirSync(UD, { recursive: true });
  rmSync(OTHER, { recursive: true, force: true });
  mkdirSync(OTHER, { recursive: true });
  copyFileSync(PDF, `${OTHER}\\copy.pdf`);
  writeFileSync(`${OTHER}\\bad.pdf`, 'this is not a pdf');

  // 1. First open: no folder yet; then the dialog starts in the PDF's folder.
  let L = await launch();
  await openWithDialog(L, '#open-welcome');
  check('first Open: default folder', dialogDefault() === 'undefined', dialogDefault());
  check('folder saved after opening', settings().lastFolder === path.dirname(PDF), settings().lastFolder);
  await openWithDialog(L, '#open');
  check('second Open: starts in the last folder', dialogDefault() === path.dirname(PDF), dialogDefault());

  // 2. Timer buttons in the speaker view: icon only, with tooltips.
  await L.eval(`document.querySelector('#present').click()`);
  const P = await waitFor('presenter');
  await sleep(3000);
  const btn = await P.eval(`(() => { const p = document.querySelector('#pause'), r = document.querySelector('#reset'), b = document.querySelector('#black');
    return { pauseText: p.textContent.trim(), resetText: r.textContent.trim(), pauseTitle: p.title, pauseLabel: p.getAttribute('aria-label'),
      resetTitle: r.title, resetLabel: r.getAttribute('aria-label'), pauseH: p.getBoundingClientRect().height, blackH: b.getBoundingClientRect().height,
      pauseW: p.getBoundingClientRect().width }; })()`);
  check('timer buttons: no text', btn.pauseText === '' && btn.resetText === '', JSON.stringify(btn));
  check('timer buttons: tooltips and labels', btn.pauseTitle === 'Pause' && btn.pauseLabel === 'Pause' && btn.resetTitle === 'Reset' && btn.resetLabel === 'Reset');
  check('timer buttons: same height as the others, square-ish', Math.abs(btn.pauseH - btn.blackH) < 0.5 && Math.abs(btn.pauseW - btn.pauseH) < 0.5, `${btn.pauseW}x${btn.pauseH} vs ${btn.blackH}`);
  await P.eval(`document.querySelector('#pause').click()`);
  await sleep(500);
  check('timer buttons: pause tooltip becomes Resume', (await P.eval(`document.querySelector('#pause').title`)) === 'Resume');
  await P.eval(`window.presenter.sendAction({ type: 'exit' })`);
  P.close();
  L.close();

  // 3. Kept across restarts.
  L = await launch();
  await openWithDialog(L, '#open-welcome');
  check('after restart: starts in the last folder', dialogDefault() === path.dirname(PDF), dialogDefault());
  L.close();

  // 4. A PDF opened from the system ("Open with") is remembered too; a broken one is not.
  L = await launch([`${OTHER}\\bad.pdf`]);
  await sleep(2500);
  check('broken PDF: folder not remembered', settings().lastFolder === path.dirname(PDF), settings().lastFolder);
  L.close();
  L = await launch([`${OTHER}\\copy.pdf`]);
  await sleep(3000);
  check('PDF from the system: its folder is remembered', settings().lastFolder === OTHER, settings().lastFolder);
  L.close();

  // 5. Folder gone: default folder.
  kill();
  await sleep(500);
  rmSync(OTHER, { recursive: true, force: true });
  L = await launch();
  await openWithDialog(L, '#open-welcome');
  check('folder deleted: default folder', dialogDefault() === 'undefined', dialogDefault());
  L.close();
} catch (err) {
  failures++;
  console.log('FAIL', err.message);
} finally {
  kill();
  rmSync(OTHER, { recursive: true, force: true });
}
console.log(failures ? `${failures} FAILED` : 'ALL OK');
