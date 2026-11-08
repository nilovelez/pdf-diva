// m9: the speaker view scales with its window (--k). Puts the speaker view on each display in turn
// (through the display roles) and checks sizes, overflow and sharpness, and the "Configure
// displays" dialog in the speaker view (scaled, fits on screen).
import { ELECTRON, FIXTURES, LAUNCHERS, WORK } from './paths.mjs';
import { spawn, execFileSync } from 'node:child_process';
import { mkdirSync, rmSync } from 'node:fs';

const SP = WORK;
const PDF = `${FIXTURES}\\test.pdf`;
const LANGS = process.argv[2] ?? 'en-US';
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

const UD = `${SP}\\ud-scale`;
rmSync(UD, { recursive: true, force: true });
mkdirSync(UD, { recursive: true });

// Everything measured in the speaker view in one go.
const MEASURE = `(() => {
  const r = (s) => document.querySelector(s).getBoundingClientRect();
  const inside = (b) => b.top >= 0 && b.left >= 0 && b.bottom <= innerHeight + 0.5 && b.right <= innerWidth + 0.5;
  const k = parseFloat(getComputedStyle(document.querySelector('#clock')).fontSize) / 34;
  const canvas = document.querySelector('#canvas');
  const top = document.querySelector('#top');
  return {
    w: innerWidth, h: innerHeight, dpr: devicePixelRatio, k,
    expected: Math.min(Math.max(Math.min(innerWidth / 1280, innerHeight / 720), 1), 3),
    clockPx: parseFloat(getComputedStyle(document.querySelector('#clock')).fontSize),
    countPx: parseFloat(getComputedStyle(document.querySelector('#count')).fontSize),
    btnPx: parseFloat(getComputedStyle(document.querySelector('#exit')).fontSize),
    clockIn: inside(r('#clock')), countIn: inside(r('#count')),
    rowIn: inside(r('#forward')) && inside(r('#prev')), exitIn: inside(r('#exit')),
    noScroll: document.documentElement.scrollHeight <= innerHeight && document.documentElement.scrollWidth <= innerWidth,
    topFits: top.scrollWidth <= top.clientWidth,
    exitOneLine: r('#exit').height < 2.2 * parseFloat(getComputedStyle(document.querySelector('#exit')).fontSize) + 20 * k,
    sharp: canvas.width > 0 && Math.abs(canvas.width - parseFloat(canvas.style.width) * devicePixelRatio) <= 2,
    canvasCss: canvas.style.width,
  };
})()`;

try {
  kill();
  await sleep(500);
  spawn(ELECTRON, [`${LAUNCHERS}\\test-main.cjs`, '--remote-debugging-port=9333'], {
    env: { ...process.env, TEST_USERDATA: UD, TEST_LANGS: LANGS, TEST_PDF: PDF },
    stdio: 'ignore',
  });
  const L = await waitFor('launcher');
  await L.eval(`new Promise(r => document.readyState === 'complete' ? r() : addEventListener('load', r))`);
  await L.eval(`document.querySelector('#open-welcome').click()`);
  await sleep(2500);
  const displays = await L.eval('window.presenter.getDisplays()');
  console.log('displays:', JSON.stringify(displays));

  for (const d of displays) {
    // Speaker view on this display only, audience on the others.
    const roles = displays.map((x) => ({ id: x.id, role: x.id === d.id ? 'speaker' : 'audience' }));
    await L.eval(`window.presenter.setDisplayRoles(${JSON.stringify(roles)})`);
    await L.eval(`document.querySelector('#present').click()`);
    const P = await waitFor('presenter');
    await sleep(3000);
    const m = await P.eval(MEASURE);
    const tag = `display ${d.index} (${d.width}x${d.height})`;
    console.log(tag, JSON.stringify(m));
    check(`${tag}: k as expected`, Math.abs(m.k - m.expected) < 0.01, `k=${m.k.toFixed(3)} expected=${m.expected.toFixed(3)}`);
    check(`${tag}: count scales with clock`, Math.abs(m.countPx - m.clockPx) < 0.01);
    check(`${tag}: buttons scale`, Math.abs(m.btnPx - 14 * m.k) < 0.05, `${m.btnPx}`);
    check(`${tag}: clock and count on screen`, m.clockIn && m.countIn);
    check(`${tag}: nav buttons and exit on screen`, m.rowIn && m.exitIn);
    check(`${tag}: no scrollbars`, m.noScroll);
    check(`${tag}: top bar fits`, m.topFits);
    check(`${tag}: slide sharp`, m.sharp, m.canvasCss);
    await P.eval(`document.querySelector('#configure-displays').click()`);
    await sleep(500);
    const dlg = await P.eval(`(() => { const d = document.querySelector('.displays-dialog'); const b = d.getBoundingClientRect();
      return { inside: b.top >= 0 && b.left >= 0 && b.bottom <= innerHeight && b.right <= innerWidth,
        titlePx: parseFloat(getComputedStyle(d.querySelector('h2')).fontSize),
        tilesOneRow: new Set([...d.querySelectorAll('.display-tile')].map(t => Math.round(t.getBoundingClientRect().top))).size === 1,
        selectsFit: [...d.querySelectorAll('select')].every(s => s.scrollWidth <= s.clientWidth + 1) }; })()`);
    check(`${tag}: displays dialog fits and scales`, dlg.inside && Math.abs(dlg.titlePx - 20 * m.k) < 0.05 && dlg.tilesOneRow && dlg.selectsFit, JSON.stringify(dlg));
    await P.key?.('Escape');
    await P.eval(`document.querySelector('.displays-dialog').closest('.overlay').hidden = true`);
    await P.eval(`window.presenter.sendAction({ type: 'exit' })`);
    P.close();
    await sleep(1500);
  }
  L.close();
} catch (err) {
  failures++;
  console.log('FAIL', err.message);
} finally {
  kill();
}
console.log(failures ? `${failures} FAILED` : 'ALL OK');
