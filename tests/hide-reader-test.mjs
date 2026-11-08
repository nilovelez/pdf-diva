// The reader window is hidden during a presentation and comes back as it was.
import { ELECTRON, FIXTURES, LAUNCHERS, WORK } from './paths.mjs';
import { spawn, execFileSync } from 'node:child_process';
import { mkdirSync, rmSync } from 'node:fs';

const SP = WORK;
const PRUEBAS = FIXTURES;
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

async function run(label, fake2, button) {
  const UD = `${SP}\\ud-hide-${label}`;
  rmSync(UD, { recursive: true, force: true }); mkdirSync(UD, { recursive: true });
  kill(); await sleep(500);
  const env = { ...process.env, TEST_USERDATA: UD, TEST_LANGS: 'en-US', TEST_PDF: `${PRUEBAS}\\test.pdf`, ...(fake2 ? { TEST_FAKE2: '1' } : {}) };
  spawn(ELECTRON, [`${LAUNCHERS}\\test-main.cjs`, '--remote-debugging-port=9333'], { env, stdio: 'ignore' });
  const L = await waitFor('launcher');
  await sleep(1000);
  await L.eval(`document.querySelector('#open-welcome').click()`);
  await sleep(2000);
  await L.eval(`document.querySelector('#next').click()`);
  await sleep(500);
  console.log(`[${label}] before:`, visibleTitles());
  await L.eval(`document.querySelector('${button}').click()`);
  const W = await waitFor(button === '#present-mirror' ? 'audience' : 'presenter');
  await sleep(2500);
  const during = visibleTitles();
  check(`[${label}] reader hidden while presenting`, !during.includes('PDF Diva - C:') && (await L.eval('document.visibilityState')) === 'hidden', during);
  await W.eval(`window.presenter.sendAction({ type: 'next' })`);
  await sleep(500);
  await W.eval(`window.presenter.sendAction({ type: 'exit' })`);
  await waitFor('presenter', true);
  await waitFor('audience', true);
  await sleep(1500);
  const after = visibleTitles();
  check(`[${label}] reader back after exit, on the last slide`, after.includes('PDF Diva - C:') && (await L.eval(`document.querySelector('#page').textContent`)) === 'Page 3 of 3', `${after} ${await L.eval(`document.querySelector('#page').textContent`)}`);
  return { L, UD, env };
}

try {
  await run('single display, speaker view', false, '#present');
  await run('2 displays, speaker view', true, '#present-presenter');
  await run('2 displays, mirror', true, '#present-mirror');

  // Opening a PDF from Windows during a presentation still brings the reader back with it.
  const { L, env } = await run('open-with during show', false, '#present');
  await L.eval(`document.querySelector('#present').click()`);
  await waitFor('presenter');
  await sleep(2500);
  spawn(ELECTRON, [`${LAUNCHERS}\\test-main.cjs`, `${PRUEBAS}\\The Gold Hour.pdf`], { env, stdio: 'ignore' });
  await waitFor('presenter', true);
  await sleep(2500);
  check('open-with during a show: reader visible with the new PDF', visibleTitles().includes('PDF Diva - C:') && (await L.eval('document.title')).endsWith('The Gold Hour.pdf'), visibleTitles());
} catch (e) {
  failures++; console.log('ERROR', e.message);
} finally {
  kill();
}
console.log(failures ? `${failures} FAILED` : 'ALL OK');
