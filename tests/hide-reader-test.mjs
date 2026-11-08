// The reader window is hidden during a presentation (it leaves the window list, as Alt+Tab shows
// it) and comes back as it was, on the last slide. Uses the real displays: the default roles with
// 2+ displays, every display as audience (mirror), and one display (DisplaySwitch /internal; it
// always restores /extend).
import { ELECTRON, FIXTURES, LAUNCHERS, WORK } from './paths.mjs';
import { spawn, execFileSync } from 'node:child_process';
import { mkdirSync, rmSync } from 'node:fs';

const SP = WORK;
const PRUEBAS = FIXTURES;
// The reader's window title is "PDF Diva - <path of the PDF>"; visibleTitles() cuts titles at 40.
const READER = `PDF Diva - ${FIXTURES}`.slice(0, 40);
const displaySwitch = (mode) => execFileSync('DisplaySwitch.exe', [`/${mode}`]);
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
let failures = 0;
const check = (n, c, x = '') => { if (!c) failures++; console.log(`${c ? 'OK  ' : 'FAIL'} ${n}${x ? ' — ' + x : ''}`); };
const kill = () => { try { execFileSync('powershell.exe', ['-NoProfile', '-Command', `Get-Process electron -ErrorAction SilentlyContinue | Where-Object { $_.Path -eq '${ELECTRON}' } | Stop-Process -Force; exit 0`]); } catch { /* */ } };
// Visible top-level windows of this app, as Alt+Tab would list them (titles).
const visibleTitles = () => execFileSync('powershell.exe', ['-NoProfile', '-Command', `
Add-Type @'
using System; using System.Text; using System.Runtime.InteropServices;
public static class W {
  public delegate bool P(IntPtr h, IntPtr l);
  [DllImport("user32.dll")] public static extern bool EnumWindows(P p, IntPtr l);
  [DllImport("user32.dll")] public static extern bool IsWindowVisible(IntPtr h);
  [DllImport("user32.dll", CharSet=CharSet.Unicode)] public static extern int GetWindowText(IntPtr h, StringBuilder s, int n);
  public static string List() { var sb = new StringBuilder(); EnumWindows((h, l) => { if (IsWindowVisible(h)) { var t = new StringBuilder(512); GetWindowText(h, t, 512); var s = t.ToString(); if (s.StartsWith("PDF Diva")) sb.Append(s.Length > 40 ? s.Substring(0, 40) : s).Append(" | "); } return true; }, IntPtr.Zero); return sb.ToString(); }
}
'@
[W]::List()`]).toString().trim();

async function connect(t) {
  const ws = new WebSocket(t.webSocketDebuggerUrl);
  await new Promise((r) => (ws.onopen = r));
  let id = 0; const pending = new Map();
  ws.onmessage = (m) => { const d = JSON.parse(m.data); if (d.id && pending.has(d.id)) pending.get(d.id)(d); };
  const send = (method, params = {}) => new Promise((res) => { const i = ++id; pending.set(i, res); ws.send(JSON.stringify({ id: i, method, params })); setTimeout(() => res({}), 10000); });
  return { eval: async (e) => (await send('Runtime.evaluate', { expression: e, awaitPromise: true, returnByValue: true })).result?.result?.value };
}
async function waitFor(name, gone = false) {
  for (let i = 0; i < 60; i++) {
    let w = null;
    try { const t = (await (await fetch('http://127.0.0.1:9333/json')).json()).find((x) => x.type === 'page' && x.url.includes(`/${name}/`)); w = t ? await connect(t) : null; } catch { /* */ }
    if (gone ? !w : w) return w;
    await sleep(300);
  }
  throw new Error(`${name} ${gone ? 'still open' : 'missing'}`);
}

// Every display shows the audience view ("Configure displays" in the reader, then Apply).
const MIRROR = `(async () => {
  document.querySelector('#configure-displays').click();
  await new Promise((r) => setTimeout(r, 800));
  for (const s of document.querySelectorAll('.displays-dialog select')) { s.value = 'audience'; s.dispatchEvent(new Event('change')); }
  document.querySelector('.displays-dialog .btn.primary').click();
})()`;

async function run(label, { setup, window = 'presenter' } = {}) {
  const UD = `${SP}\\ud-hide-${label.replace(/\W+/g, '-')}`;
  rmSync(UD, { recursive: true, force: true }); mkdirSync(UD, { recursive: true });
  kill(); await sleep(500);
  const env = { ...process.env, TEST_USERDATA: UD, TEST_LANGS: 'en-US', TEST_PDF: `${PRUEBAS}\\test.pdf` };
  spawn(ELECTRON, [`${LAUNCHERS}\\test-main.cjs`, '--remote-debugging-port=9333'], { env, stdio: 'ignore' });
  const L = await waitFor('launcher');
  await sleep(1000);
  await L.eval(`document.querySelector('#open-welcome').click()`);
  await sleep(2000);
  await L.eval(`document.querySelector('#next').click()`);
  await sleep(500);
  if (setup) { await L.eval(setup); await sleep(1000); }
  check(`[${label}] reader listed before presenting`, visibleTitles().includes(READER), visibleTitles());
  await L.eval(`document.querySelector('#present').click()`);
  const W = await waitFor(window);
  await sleep(2500);
  const during = visibleTitles();
  check(`[${label}] reader hidden while presenting`, !during.includes(READER) && (await L.eval('document.visibilityState')) === 'hidden', during);
  if (window === 'audience') check(`[${label}] no speaker view`, !during.includes('Speaker view'), during);
  await W.eval(`window.presenter.sendAction({ type: 'next' })`);
  await sleep(500);
  await W.eval(`window.presenter.sendAction({ type: 'exit' })`);
  await waitFor('presenter', true);
  await waitFor('audience', true);
  await sleep(1500);
  const after = visibleTitles();
  const page = await L.eval(`document.querySelector('#page').textContent`);
  check(`[${label}] reader back after exit, on the last slide`, after.includes(READER) && page === 'Page 3 of 3', `${after} ${page}`);
  return { L, env };
}

try {
  await run('default roles, speaker view');
  await run('mirror, every display audience', { setup: MIRROR, window: 'audience' });

  // Opening a PDF from Windows during a presentation still brings the reader back with it.
  const { L, env } = await run('open-with during show');
  await L.eval(`document.querySelector('#present').click()`);
  await waitFor('presenter');
  await sleep(2500);
  spawn(ELECTRON, [`${LAUNCHERS}\\test-main.cjs`, `${PRUEBAS}\\The Gold Hour.pdf`], { env, stdio: 'ignore' });
  await waitFor('presenter', true);
  await sleep(2500);
  check('open-with during a show: reader visible with the new PDF', visibleTitles().includes(READER) && (await L.eval('document.title')).endsWith('The Gold Hour.pdf'), visibleTitles());

  // One display: audience only, no speaker view.
  kill();
  displaySwitch('internal');
  await sleep(9000);
  await run('one display, audience only', { window: 'audience' });
} catch (e) {
  failures++; console.log('ERROR', e.message);
} finally {
  kill();
  displaySwitch('extend');
  await sleep(9000);
}
console.log(failures ? `${failures} FAILED` : 'ALL OK');
