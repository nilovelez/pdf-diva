// m9 screenshots: 1920x1080 as a laptop at 150 %, English and Spanish, with launchers/shots-main.cjs.. Light = The Fuchsia Hour, dark = The Gold Hour.
// Usage: node shots-m9.mjs <outDir> [page]
import { ELECTRON, FIXTURES, LAUNCHERS, WORK } from './paths.mjs';
import { spawn, execFileSync } from 'node:child_process';
import { mkdirSync, rmSync, writeFileSync } from 'node:fs';

const SP = WORK;
const PRUEBAS = FIXTURES;
const LIGHT_PDF = `${PRUEBAS}\\The Fuchsia Hour.pdf`;
const DARK_PDF = `${PRUEBAS}\\The Gold Hour.pdf`;
const OUT = process.argv[2] ?? `${SP}\\shots`;
const PAGE = Number(process.argv[3] ?? 2);
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

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
  const send = (method, params = {}) => new Promise((res) => { const i = ++id; pending.set(i, res); ws.send(JSON.stringify({ id: i, method, params })); setTimeout(() => res({ timeout: true }), 30000); });
  return {
    send,
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

async function shot(c, file) {
  // No caret, no hover: move the (virtual) mouse out of the page.
  await c.send('Input.dispatchMouseEvent', { type: 'mouseMoved', x: -10, y: -10 });
  await sleep(600);
  const size = await c.eval('[innerWidth, innerHeight, devicePixelRatio].join("x")');
  const r = await c.send('Page.captureScreenshot', { format: 'png' });
  writeFileSync(file, Buffer.from(r.result.data, 'base64'));
  console.log('saved', file, size);
}

async function launch(lang, theme, pdf) {
  kill();
  await sleep(800);
  const ud = `${SP}\\ud-shots`;
  rmSync(ud, { recursive: true, force: true });
  mkdirSync(ud, { recursive: true });
  writeFileSync(`${ud}\\settings.json`, JSON.stringify({ theme, language: lang }));
  spawn(ELECTRON, [`${LAUNCHERS}\\shots-main.cjs`, '--remote-debugging-port=9333'], {
    env: { ...process.env, TEST_USERDATA: ud, TEST_PDF: pdf, SHOT_CLOCK_MS: String((7 * 60 + 42) * 1000) },
    stdio: 'ignore',
  });
  const L = await waitFor('launcher');
  await L.eval(`new Promise(r => document.readyState === 'complete' ? r() : addEventListener('load', r))`);
  // The framed reader window can't be made exactly 1280x720 at 150 %: emulate that viewport.
  await L.send('Emulation.setDeviceMetricsOverride', { width: 1280, height: 720, deviceScaleFactor: 1.5, mobile: false });
  await sleep(1500);
  return L;
}

async function openAndGo(L) {
  await L.eval(`document.querySelector('#open-welcome').click()`);
  await sleep(3000);
  for (let i = 1; i < PAGE; i++) await L.eval(`document.querySelector('#next').click()`);
  await sleep(2000);
}

async function present(L) {
  await L.eval(`document.querySelector('#present').click()`);
  // Shift+F5 behaviour: start from the page shown in the reader.
  const P = await waitFor('presenter');
  await sleep(4000);
  return P;
}

try {
  for (const lang of ['en', 'es']) {
    const dir = `${OUT}\\${lang}`;
    mkdirSync(dir, { recursive: true });

    // Light: welcome, reader, speaker view, speaker view + Configure displays.
    let L = await launch(lang, 'light', LIGHT_PDF);
    await shot(L, `${dir}\\1-welcome-light.png`);
    await openAndGo(L);
    await shot(L, `${dir}\\2-reader-light.png`);
    let P = await present(L);
    await P.eval(`window.presenter.sendAction({ type: 'goto', page: ${PAGE} })`);
    await sleep(2500);
    await shot(P, `${dir}\\3-speaker-light.png`);
    await P.eval(`document.querySelector('#configure-displays').click()`);
    await sleep(1200);
    await P.eval(`document.activeElement?.blur()`);
    await shot(P, `${dir}\\4-speaker-displays-light.png`);
    P.close();
    L.close();

    // Dark: speaker view.
    L = await launch(lang, 'dark', DARK_PDF);
    await openAndGo(L);
    P = await present(L);
    await P.eval(`window.presenter.sendAction({ type: 'goto', page: ${PAGE} })`);
    await sleep(2500);
    await shot(P, `${dir}\\5-speaker-dark.png`);
    P.close();
    L.close();
  }
} catch (err) {
  console.log('FAIL', err.message);
} finally {
  kill();
}
