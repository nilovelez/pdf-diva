import { ELECTRON, FIXTURES, LAUNCHERS, WORK } from './paths.mjs';
import { spawn, execFileSync } from 'node:child_process';
const SP = WORK;
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
let failures = 0;
const check = (n, c, x = '') => { if (!c) failures++; console.log(`${c ? 'OK  ' : 'FAIL'} ${n}${x ? ' — ' + x : ''}`); };
const kill = () => { try { execFileSync('powershell.exe', ['-NoProfile', '-Command', `Get-Process electron -ErrorAction SilentlyContinue | Where-Object { $_.Path -eq '${ELECTRON}' } | Stop-Process -Force; exit 0`]); } catch { /* */ } };

kill();
spawn(ELECTRON, [`${LAUNCHERS}\\site-main.cjs`, '--remote-debugging-port=9334'], { env: { ...process.env, SITE_SCHEME: process.argv[2] ?? 'dark', TEST_USERDATA: `${WORK}\\ud-site` }, stdio: 'ignore' });
let t;
for (let i = 0; i < 60 && !t; i++) { await sleep(300); try { t = (await (await fetch('http://127.0.0.1:9334/json')).json()).find((x) => x.url.includes('index.html')); } catch { /* */ } }
const ws = new WebSocket(t.webSocketDebuggerUrl);
await new Promise((r) => (ws.onopen = r));
let id = 0;
const ev = (expression) => new Promise((res) => { const i = ++id; ws.onmessage = (m) => { const d = JSON.parse(m.data); if (d.id === i) res(d.result?.result?.value); }; ws.send(JSON.stringify({ id: i, method: 'Runtime.evaluate', params: { expression, returnByValue: true, awaitPromise: true } })); });
await sleep(1500);
await ev(`localStorage.clear()`);
const state = () => ev(`JSON.stringify({
  forced: document.documentElement.dataset.theme ?? null,
  header: [...document.querySelectorAll('.site-header [data-set-theme]')].filter(b => b.getAttribute('aria-pressed') === 'true').map(b => b.dataset.setTheme),
  shot: [...document.querySelectorAll('.shot [data-set-theme]')].filter(b => b.getAttribute('aria-pressed') === 'true').map(b => b.dataset.setTheme),
  img: [...document.querySelectorAll('.shot img')].filter(i => getComputedStyle(i).display !== 'none').map(i => i.className),
  bg: getComputedStyle(document.body).backgroundColor,
})`);
const s0 = JSON.parse(await state());
check('start (system dark): Dark Theme active in both', s0.header[0] === 'dark' && s0.shot[0] === 'dark' && s0.img[0] === 'only-dark', JSON.stringify(s0));
await ev(`document.querySelector('.shot [data-set-theme="light"]').click()`);
await sleep(600);
const s1 = JSON.parse(await state());
check('click Light Theme: whole page light, header synced', s1.forced === 'light' && s1.header[0] === 'light' && s1.shot[0] === 'light' && s1.img[0] === 'only-light', JSON.stringify(s1));
await ev(`document.querySelector('.site-header [data-set-theme="dark"]').click()`);
const s2 = JSON.parse(await state());
check('header moon: shot buttons follow', s2.header[0] === 'dark' && s2.shot[0] === 'dark' && s2.img[0] === 'only-dark', JSON.stringify(s2));
check('one pressed button per group', s2.header.length === 1 && s2.shot.length === 1);
const widths = await ev(`JSON.stringify([...document.querySelectorAll('.shot [data-set-theme]')].map(b => Math.round(b.getBoundingClientRect().width) + 'x' + Math.round(b.getBoundingClientRect().height)))`);
console.log('button sizes:', widths);
const badges = async () => ev(`JSON.stringify([...document.querySelectorAll('.store-badge')].map(a => { const img = [...a.querySelectorAll('img')].find(i => getComputedStyle(i).display !== 'none'); const r = img.getBoundingClientRect(); const btn = a.parentElement.querySelector('.btn-secondary').getBoundingClientRect(); return img.src.split('/').pop() + ' ' + Math.round(r.width) + 'x' + Math.round(r.height) + ' loaded=' + (img.naturalWidth > 0) + ' btnH=' + Math.round(btn.height) + ' sameRow=' + (Math.abs(r.top - btn.top) < 2); }))`);
console.log('badges (dark):', await badges());
check('2 Store badges, no old Store button', (await ev(`document.querySelectorAll('.store-badge').length`)) === 2 && (await ev(`[...document.querySelectorAll('a')].some(a => a.textContent.includes('Get it from Microsoft Store'))`)) === false);
await ev(`document.querySelector('.shot [data-set-theme="light"]').click()`);
console.log('badges (light):', await badges());
await ev(`localStorage.clear()`);
ws.close();
kill();
console.log(failures ? `${failures} FAILED` : 'ALL OK');
