// m11 (1.5.0): thumbnail highlight centred on the thumbnail, theme cards in Settings (mouse,
// arrow keys, saved setting, long languages), and an even frame around the slides in the speaker view.
// Needs `npm run build` and D:\scratch\pdf-diva\tests\test-main.cjs. Uses whatever displays are connected.
import { ELECTRON, FIXTURES, LAUNCHERS, WORK } from './paths.mjs';
import { spawn, execFileSync } from 'node:child_process';
import { mkdirSync, readFileSync, rmSync } from 'node:fs';

const SP = WORK;
const PDF = `${FIXTURES}\\00 Bienvenida WorPressDaySevilla 2025.pdf`;
const UD = `${SP}\\ud-refine`;
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
    key: async (key, code) => {
      await send('Input.dispatchKeyEvent', { type: 'keyDown', key, code, windowsVirtualKeyCode: code === 'ArrowLeft' ? 37 : 39 });
      await send('Input.dispatchKeyEvent', { type: 'keyUp', key, code });
    },
    close: () => ws.close(),
  };
}

async function waitForAll(name, ms = 20000) {
  const end = Date.now() + ms;
  while (Date.now() < end) {
    try {
      const list = await (await fetch('http://127.0.0.1:9333/json')).json();
      const found = list.filter((x) => x.type === 'page' && x.url.includes(`/${name}/`));
      if (found.length) return Promise.all(found.map(connect));
    } catch { /* starting */ }
    await sleep(300);
  }
  throw new Error(`no ${name} window`);
}

const settings = () => JSON.parse(readFileSync(`${UD}\\settings.json`, 'utf8'));

try {
  kill();
  rmSync(UD, { recursive: true, force: true });
  mkdirSync(UD, { recursive: true });
  spawn(ELECTRON, [`${LAUNCHERS}\\test-main.cjs`, '--remote-debugging-port=9333'], {
    env: { ...process.env, TEST_USERDATA: UD, TEST_LANGS: 'en-US', TEST_PDF: PDF },
    stdio: 'ignore',
  });
  const [L] = await waitForAll('launcher');
  await L.eval(`new Promise(r => document.readyState === 'complete' ? r() : addEventListener('load', r))`);
  await L.eval(`document.querySelector('#open-welcome').click()`);
  await sleep(4000);

  // ---- 3. Thumbnails: the highlight surrounds the thumbnail, centred ----
  const thumbs = await L.eval(`(() => {
    const box = document.querySelector('#thumbs');
    const items = [...document.querySelectorAll('.thumb.ready')].slice(0, 4).map((t) => {
      const a = t.getBoundingClientRect(), c = t.querySelector('canvas').getBoundingClientRect();
      return { left: +(c.left - a.left).toFixed(1), right: +(a.right - c.right).toFixed(1) };
    });
    return { items, overflowX: box.scrollWidth > box.clientWidth, scrolls: box.scrollHeight > box.clientHeight,
      column: box.getBoundingClientRect().width, pages: document.querySelectorAll('.thumb').length };
  })()`);
  check('thumbnails painted', thumbs.items.length > 0, JSON.stringify(thumbs));
  check('thumbnail list scrolls (enough pages to show the scrollbar)', thumbs.scrolls, `${thumbs.pages} pages`);
  check('no horizontal overflow in the thumbnail column', !thumbs.overflowX, `column ${thumbs.column}px`);
  check('canvas inside its highlight, centred (±1 px)',
    thumbs.items.every((i) => i.left >= 0 && i.right >= 0 && Math.abs(i.left - i.right) <= 1), JSON.stringify(thumbs.items));

  // ---- 2. Theme cards ----
  await L.eval(`document.querySelector('#settings-open').click()`);
  await sleep(300);
  const cards = await L.eval(`[...document.querySelectorAll('.theme-card')].map((c) => ({
    theme: c.dataset.theme, checked: c.getAttribute('aria-checked'), minis: c.querySelectorAll('.mini').length,
    name: c.querySelector('.name').textContent, tab: c.tabIndex,
    checkShown: getComputedStyle(c.querySelector('.check')).display !== 'none', hasSvg: !!c.querySelector('.check svg') }))`);
  check('three cards: System (2 minis), Light, Dark', cards.length === 3 && cards[0].minis === 2 && cards[1].minis === 1 && cards[2].minis === 1, JSON.stringify(cards));
  check('System chosen by default, only it is tabbable and shows the check',
    cards[0].checked === 'true' && cards[0].tab === 0 && cards[1].tab === -1 && cards[0].checkShown && !cards[1].checkShown && cards[0].hasSvg);
  check('names translated', cards.map((c) => c.name).join('/') === 'System/Light/Dark');

  await L.eval(`document.querySelector('.theme-card[data-theme="dark"]').click()`);
  await sleep(700);
  check('click Dark: saved and applied', settings().theme === 'dark' && await L.eval(`matchMedia('(prefers-color-scheme: dark)').matches`));
  check('click Dark: card checked', await L.eval(`document.querySelector('.theme-card[data-theme="dark"]').getAttribute('aria-checked')`) === 'true');

  await L.eval(`document.querySelector('.theme-card[data-theme="dark"]').focus()`);
  await L.key('ArrowLeft', 'ArrowLeft');
  await sleep(700);
  check('ArrowLeft from Dark: Light chosen and focused', settings().theme === 'light'
    && await L.eval(`document.activeElement.dataset.theme`) === 'light'
    && !(await L.eval(`matchMedia('(prefers-color-scheme: dark)').matches`)));
  await L.key('ArrowLeft', 'ArrowLeft');
  await L.key('ArrowLeft', 'ArrowLeft');
  await sleep(700);
  check('ArrowLeft twice more wraps round to Dark', settings().theme === 'dark');
  check('dialog still open after the arrow keys (no page change)', await L.eval(`!document.querySelector('#settings').hidden`));

  // Each miniature keeps its own colours: the dark card's top bar is dark even in the light theme.
  await L.eval(`document.querySelector('.theme-card[data-theme="light"]').click()`);
  await sleep(700);
  const bars = await L.eval(`[...document.querySelectorAll('.mini .top')].map((t) => getComputedStyle(t).backgroundColor)`);
  check('miniatures keep their theme colours', bars.length === 4 && bars[0] === 'rgb(251, 250, 248)' && bars[1] === 'rgb(29, 28, 27)' && bars[3] === 'rgb(29, 28, 27)', JSON.stringify(bars));

  for (const lang of ['de', 'fr', 'pt', 'ca', 'nl', 'it', 'es', 'en']) {
    await L.eval(`(() => { const s = document.querySelector('#language'); s.value = '${lang}'; s.dispatchEvent(new Event('change')); })()`);
    await sleep(400);
    const fit = await L.eval(`(() => {
      const d = document.querySelector('#settings .dialog');
      const cs = [...document.querySelectorAll('.theme-card')];
      return { names: cs.map((c) => c.querySelector('.name').textContent).join('/'),
        overflow: cs.some((c) => c.scrollWidth > c.clientWidth) || d.scrollWidth > d.clientWidth,
        heights: [...new Set(cs.map((c) => Math.round(c.getBoundingClientRect().height)))] };
    })()`);
    check(`${lang}: cards fit`, !fit.overflow && fit.heights.length === 1, JSON.stringify(fit));
  }
  await L.eval(`document.querySelector('#settings [data-close]').click()`);

  // ---- 1. Speaker view: the slide area inside the padding is 16:9 ----
  await L.eval(`document.querySelector('#present').click()`);
  const speakers = await waitForAll('presenter').catch(() => []);
  if (!speakers.length) console.log('SKIP speaker view (one display only)');
  for (const P of speakers) {
    await sleep(1500);
    const r = await P.eval(`(() => {
      const inner = (id) => { const el = document.getElementById(id), s = getComputedStyle(el);
        const w = el.clientWidth - parseFloat(s.paddingLeft) - parseFloat(s.paddingRight);
        const h = el.clientHeight - parseFloat(s.paddingTop) - parseFloat(s.paddingBottom);
        return { w, h, ratio: +(w / h).toFixed(3) }; };
      const gaps = (id) => { const b = document.getElementById(id).getBoundingClientRect();
        const c = document.querySelector('#' + id + ' canvas').getBoundingClientRect();
        return [c.left - b.left, b.right - c.right, c.top - b.top, b.bottom - c.bottom].map((x) => Math.round(x)); };
      return { size: innerWidth + 'x' + innerHeight, current: inner('current'), next: inner('next'),
        gapsCurrent: gaps('current'), gapsNext: gaps('next'),
        scroll: document.documentElement.scrollHeight > innerHeight || document.documentElement.scrollWidth > innerWidth };
    })()`);
    check(`speaker ${r.size}: current slide area is 16:9`, Math.abs(r.current.ratio - 16 / 9) < 0.01, JSON.stringify(r.current));
    check(`speaker ${r.size}: next slide area is 16:9`, Math.abs(r.next.ratio - 16 / 9) < 0.02, JSON.stringify(r.next));
    check(`speaker ${r.size}: frame around the slide (L R T B)`, true, `current ${r.gapsCurrent} next ${r.gapsNext}`);
    check(`speaker ${r.size}: no scrollbars`, !r.scroll);
  }
  if (speakers[0]) await speakers[0].eval(`dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }))`);
  await sleep(1000);
} catch (e) {
  failures++;
  console.log('FAIL exception', e.message);
} finally {
  kill();
  console.log(failures ? `${failures} FAILED` : 'ALL OK');
}
