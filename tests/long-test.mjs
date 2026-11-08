// Pseudo-locale check: every translated text 40% longer, then look for overflow.
import { ELECTRON, FIXTURES, LAUNCHERS, WORK } from './paths.mjs';
import { spawn, execFileSync } from 'node:child_process';
import { mkdirSync, rmSync } from 'node:fs';

const SP = WORK;
const PDF = `${FIXTURES}\\test.pdf`;
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const LANG = process.argv[2] ?? 'es-ES';

function kill() {
  try {
    execFileSync('powershell.exe', ['-NoProfile', '-Command',
      `Get-Process electron -ErrorAction SilentlyContinue | Where-Object { $_.Path -eq '${ELECTRON}' } | Stop-Process -Force; exit 0`]);
  } catch { /* none */ }
}
async function connect(target) {
  const ws = new WebSocket(target.webSocketDebuggerUrl);
  await new Promise((r) => (ws.onopen = r));
  let id = 0; const pending = new Map();
  ws.onmessage = (m) => { const msg = JSON.parse(m.data); if (msg.id && pending.has(msg.id)) pending.get(msg.id)(msg); };
  const send = (method, params = {}) => new Promise((res) => { const i = ++id; pending.set(i, res); ws.send(JSON.stringify({ id: i, method, params })); });
  return {
    send,
    eval: async (e) => {
      const r = await send('Runtime.evaluate', { expression: e, awaitPromise: true, returnByValue: true });
      if (r.result?.exceptionDetails) return `EXCEPTION: ${r.result.exceptionDetails.exception?.description}`;
      return r.result?.result?.value;
    },
  };
}
async function waitFor(name) {
  for (let i = 0; i < 60; i++) {
    try {
      const t = (await (await fetch('http://127.0.0.1:9333/json')).json()).find((x) => x.type === 'page' && x.url.includes(`/${name}/`));
      if (t) return connect(t);
    } catch { /* starting */ }
    await sleep(300);
  }
  throw new Error(`no ${name}`);
}

// Lengthens every marked text and reports elements whose content no longer fits.
const STRETCH = `(() => {
  const longer = (s) => s + ' ' + 'x'.repeat(Math.ceil(s.length * 0.4));
  document.querySelectorAll('[data-i18n], #page, #count, #password-text, option, .displays-dialog h2, .displays-dialog .btn, .displays-dialog .name, .displays-dialog .main, .displays-warning').forEach((el) => {
    if (el.children.length === 0 && !el.dataset.stretched) {
      el.textContent = longer(el.textContent);
      el.dataset.stretched = '1';
    }
  });
})()`;
const REPORT = `(() => {
  const out = [];
  if (document.documentElement.scrollWidth > innerWidth + 1) out.push('page scrolls horizontally: ' + document.documentElement.scrollWidth + ' > ' + innerWidth);
  for (const el of document.querySelectorAll('button, .btn, #toolbar, #top, #row, #count, .dialog, .field, #drop, #appinfo, h2, h3, #badge, #end')) {
    if (el.closest('[hidden]') || el.offsetParent === null) continue;
    const name = el.id ? '#' + el.id : el.className ? el.tagName.toLowerCase() + '.' + String(el.className).split(' ')[0] : el.tagName;
    if (el.scrollWidth > el.clientWidth + 1) out.push('overflow-x ' + name + ' ' + el.scrollWidth + '>' + el.clientWidth);
    const r = el.getBoundingClientRect();
    if (r.right > innerWidth + 1 || r.left < -1) out.push('off-screen ' + name + ' right=' + Math.round(r.right));
  }
  for (const el of document.querySelectorAll('button, .btn, #page, #count, #paused, #badge, #end, h2, h3, .group-label, option')) {
    if (el.closest('[hidden]') || el.offsetParent === null) continue;
    const tops = new Set();
    const walker = document.createTreeWalker(el, NodeFilter.SHOW_TEXT);
    for (let n = walker.nextNode(); n; n = walker.nextNode()) {
      if (!n.textContent.trim() || n.parentElement.closest('svg')) continue;
      const range = document.createRange();
      range.selectNodeContents(n);
      for (const r of range.getClientRects()) if (r.width > 0) tops.add(Math.round(r.top / 4));
    }
    if (tops.size > 1) out.push('wraps (' + tops.size + ' lines): ' + (el.id ? '#' + el.id : el.tagName.toLowerCase()) + ' "' + el.textContent.trim().slice(0, 40) + '"');
  }
  return out.length ? out.join('\\n') : 'no overflow, nothing wraps';
})()`;

const UD = `${SP}\\ud-long`;
rmSync(UD, { recursive: true, force: true });
mkdirSync(UD, { recursive: true });
kill();
spawn(ELECTRON, [`${LAUNCHERS}\\test-main.cjs`, '--remote-debugging-port=9333'], {
  env: { ...process.env, TEST_USERDATA: UD, TEST_LANGS: LANG, TEST_PDF: PDF }, stdio: 'ignore',
});
try {
  const L = await waitFor('launcher');
  await sleep(1500);
  await L.eval(STRETCH);
  console.log(`[${LANG}] welcome:\n` + (await L.eval(REPORT)));
  await L.eval(`document.querySelector('#open-welcome').click()`);
  await sleep(2500);
  await L.eval(`document.body.classList.add('multi')`);
  await L.eval(STRETCH);
  console.log('reader, 2-display toolbar (' + (await L.eval('innerWidth')) + 'px):\n' + (await L.eval(REPORT)));
  console.log('toolbar natural width: ' + (await L.eval(`[...document.querySelector('#toolbar').children].filter(e => e.offsetParent).reduce((s, e) => s + e.getBoundingClientRect().width, 0) | 0`)));
  console.log('toolbar height: ' + (await L.eval(`document.querySelector('#toolbar').getBoundingClientRect().height | 0`)));
  console.log('pager: ' + (await L.eval(`(() => { const p = document.querySelector('#page'); const r = p.getBoundingClientRect(); return JSON.stringify({ text: p.textContent, w: r.width | 0, h: r.height | 0, lh: getComputedStyle(p).lineHeight }); })()`)));
  await L.eval(`document.body.classList.remove('multi')`);
  await L.eval(`document.querySelector('#settings-open').click()`);
  await sleep(500);
  await L.eval(STRETCH);
  console.log('settings:\n' + (await L.eval(REPORT)));
  await L.eval(`document.querySelector('#settings [data-close]').click()`);
  // "Configure displays" (needs 2+ real displays), with the warning shown.
  await L.eval(`document.body.classList.add('multi')`);
  await L.eval(`document.querySelector('#configure-displays').click()`);
  await sleep(800);
  await L.eval(`(() => { const s = [...document.querySelectorAll('.displays-dialog select')]; s.forEach(x => { x.value = 'speaker'; x.dispatchEvent(new Event('change')); }); })()`);
  await L.eval(STRETCH);
  console.log('configure displays (' + (await L.eval('innerWidth + "x" + innerHeight')) + '):\n' + (await L.eval(REPORT)));
  await L.eval(`document.querySelector('.displays-dialog .actions .btn').click()`);
  await L.eval(`document.querySelector('#present').click()`);
  const P = await waitFor('presenter');
  await sleep(3000);
  await P.eval(STRETCH);
  console.log('presenter (window size ' + (await P.eval('innerWidth + "x" + innerHeight')) + '):\n' + (await P.eval(REPORT)));
} finally {
  kill();
}
