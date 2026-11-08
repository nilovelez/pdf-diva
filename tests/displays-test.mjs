// m9: "Configure displays" and display roles, on Marcianito's 3 displays (1 = 1280x800 main,
// 2 and 3 = 4K dummies at 150 %). Dialog rules, two speaker views with a shared timer, applying
// during a presentation, losing/regaining displays, mirroring, starting on one display, 1.2.0
// settings. Always restores DisplaySwitch /extend.
import { ELECTRON, FIXTURES, LAUNCHERS, WORK } from './paths.mjs';
import { spawn, execFileSync } from 'node:child_process';
import { mkdirSync, rmSync, writeFileSync, readFileSync } from 'node:fs';

const SP = WORK;
const PDF = `${FIXTURES}\\test.pdf`;
const LANGS = process.argv[2] ?? 'en-US';
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
let failures = 0;
const check = (name, cond, extra = '') => {
  if (!cond) failures++;
  console.log(`${cond ? 'OK  ' : 'FAIL'} ${name}${extra ? ' — ' + extra : ''}`);
};
const displaySwitch = (mode) => execFileSync('DisplaySwitch.exe', [`/${mode}`]);

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
    send,
    eval: async (e) => {
      const r = await send('Runtime.evaluate', { expression: e, awaitPromise: true, returnByValue: true });
      if (r.result?.exceptionDetails) return `EXCEPTION: ${r.result.exceptionDetails.exception?.description}`;
      return r.result?.result?.value;
    },
    key: async (key, code = key, keyCode = 0) => {
      await send('Input.dispatchKeyEvent', { type: 'keyDown', key, code, windowsVirtualKeyCode: keyCode });
      await send('Input.dispatchKeyEvent', { type: 'keyUp', key, code, windowsVirtualKeyCode: keyCode });
    },
    close: () => ws.close(),
  };
}

async function targets() {
  try { return await (await fetch('http://127.0.0.1:9333/json')).json(); } catch { return []; }
}
const pages = async (name) => (await targets()).filter((x) => x.type === 'page' && x.url.includes(`/${name}/`));

async function waitFor(name, ms = 20000) {
  const end = Date.now() + ms;
  while (Date.now() < end) {
    const t = (await pages(name))[0];
    if (t) return connect(t);
    await sleep(300);
  }
  throw new Error(`no ${name} window`);
}

const GEOM = `({ x: screenX, w: innerWidth, h: innerHeight, ow: outerWidth, oh: outerHeight,
  sw: screen.width, sh: screen.height, visible: document.visibilityState })`;
const near = (a, b) => Math.abs(a - b) <= 1;
const full = (g) => g.visible === 'visible' && near(g.w, g.sw) && near(g.h, g.sh) && near(g.ow, g.w) && near(g.oh, g.h);

/** Visible windows of a kind, with their x (display 1 = 0, 2 = 1280, 3 = 3841). */
async function shown(name) {
  const out = [];
  for (const t of await pages(name)) {
    const c = await connect(t);
    const g = await c.eval(GEOM);
    c.close();
    if (g?.visible === 'visible') out.push(g);
  }
  return out.sort((a, b) => a.x - b.x);
}
const xs = (list) => list.map((g) => g.x).join(',');
const allFull = (list) => list.every(full);

const UD = `${SP}\\ud-displays`;

async function launch(langs = LANGS) {
  kill();
  await sleep(500);
  spawn(ELECTRON, [`${LAUNCHERS}\\test-main.cjs`, '--remote-debugging-port=9333'], {
    env: { ...process.env, TEST_USERDATA: UD, TEST_LANGS: langs, TEST_PDF: PDF },
    stdio: 'ignore',
  });
  const L = await waitFor('launcher');
  await L.eval(`new Promise(r => document.readyState === 'complete' ? r() : addEventListener('load', r))`);
  await L.eval(`document.querySelector('#open-welcome').click()`);
  await sleep(2500);
  return L;
}

// Dialog helpers, valid in any window that has the dialog.
const DLG = `document.querySelector('.displays-dialog')`;
const dialogState = `(() => { const d = ${DLG}; const o = d.closest('.overlay');
  return { open: !o.hidden, tiles: d.querySelectorAll('.display-tile').length,
    roles: [...d.querySelectorAll('select')].map(s => s.value),
    names: [...d.querySelectorAll('.name')].map(n => n.textContent),
    res: [...d.querySelectorAll('.resolution')].map(n => n.textContent),
    main: [...d.querySelectorAll('.display-tile')].map(t => !!t.querySelector('.main')),
    changed: d.querySelectorAll('.display-tile.changed').length,
    warning: !d.querySelector('.displays-warning').hidden,
    apply: !d.querySelector('.btn.primary').disabled,
    title: d.querySelector('h2').textContent }; })()`;
const setRole = (i, role) => `(() => { const s = ${DLG}.querySelectorAll('select')[${i}]; s.value = '${role}'; s.dispatchEvent(new Event('change')); })()`;
const clickApply = `${DLG}.querySelector('.btn.primary').click()`;
const clickCancel = `${DLG}.querySelector('.actions .btn:not(.primary)').click()`;

try {
  rmSync(UD, { recursive: true, force: true });
  mkdirSync(UD, { recursive: true });
  let L = await launch();

  // 1. Reader toolbar and defaults.
  check('reader: Present is the primary button', await L.eval(`document.querySelector('#present').classList.contains('primary') && getComputedStyle(document.querySelector('#present')).display !== 'none'`));
  check('reader: Configure displays shown with 3 displays', await L.eval(`getComputedStyle(document.querySelector('#configure-displays')).display !== 'none'`));
  check('reader: no mirror/speaker-view buttons', await L.eval(`!document.querySelector('#present-mirror') && !document.querySelector('#present-presenter')`));
  check('settings: no speaker display field', await L.eval(`!document.querySelector('#speaker-monitor')`));
  const infos = await L.eval('window.presenter.getDisplays()');
  console.log('displays:', JSON.stringify(infos));
  check('defaults: speaker, speaker, audience (last)', infos.map((d) => d.role).join() === 'speaker,speaker,audience');
  check('4K reported as 3840x2160 at 150 %', infos[1].width === 3840 && infos[1].height === 2160 && infos[1].scale === 150, `${infos[1].width}x${infos[1].height} ${infos[1].scale}`);

  // 2. Dialog rules (then Cancel).
  await L.eval(`document.querySelector('#configure-displays').click()`);
  await sleep(500);
  let s = await L.eval(dialogState);
  console.log('dialog:', JSON.stringify(s));
  check('dialog: 3 tiles, defaults, Apply disabled, no warning', s.open && s.tiles === 3 && s.roles.join() === 'speaker,speaker,audience' && !s.apply && !s.warning);
  check('dialog: main badge only on display 1', s.main.join() === 'true,false,false');
  check('dialog: unnamed main display gets a name', s.names[0] === 'Display 1', s.names.join(' | '));
  await L.eval(setRole(2, 'speaker'));
  s = await L.eval(dialogState);
  check('dialog: no audience → warning, Apply disabled', s.warning && !s.apply && s.changed === 1);
  await L.eval(setRole(0, 'audience'));
  s = await L.eval(dialogState);
  check('dialog: valid change → Apply enabled, 2 tiles highlighted', !s.warning && s.apply && s.changed === 2);
  await L.eval(clickCancel);
  await sleep(300);
  check('dialog: Cancel closes without saving', !(await L.eval(dialogState)).open && (await L.eval('window.presenter.getDisplays()')).map((d) => d.role).join() === 'speaker,speaker,audience');

  // Esc closes the dialog in the reader.
  await L.eval(`document.querySelector('#configure-displays').click()`);
  await sleep(300);
  await L.key('Escape', 'Escape', 27);
  await sleep(300);
  check('reader: Esc closes the dialog', !(await L.eval(dialogState)).open);

  // 3. Present with the defaults: two speaker views, audience on the last display.
  await L.eval(`document.querySelector('#present').click()`);
  await waitFor('presenter');
  await sleep(4000);
  let sp = await shown('presenter');
  let au = await shown('audience');
  check('present: speaker views on displays 1 and 2', xs(sp) === '0,1280' && allFull(sp), JSON.stringify(sp));
  check('present: audience on display 3', xs(au) === '3841' && allFull(au), JSON.stringify(au));

  // 4. Shared timer.
  const [P1t, P2t] = (await pages('presenter'));
  const P1 = await connect(P1t);
  const P2 = await connect(P2t);
  await P1.eval(`document.querySelector('#pause').click()`);
  await sleep(1500);
  const c1 = await P1.eval(`document.querySelector('#clock').textContent + '|' + document.querySelector('#pause').title`);
  const c2 = await P2.eval(`document.querySelector('#clock').textContent + '|' + document.querySelector('#pause').title`);
  check('timer: pausing in one speaker view pauses both, same time', c1 === c2 && c1.endsWith('|Resume'), `${c1} / ${c2}`);
  await P2.eval(`document.querySelector('#reset').click()`);
  await sleep(1200);
  const r1 = await P1.eval(`document.querySelector('#clock').textContent + '|' + document.querySelector('#pause').title`);
  check('timer: reset in the other view resets both and runs', r1.startsWith('00:00:0') && r1.endsWith('|Pause'), r1);
  check('speaker view: Configure displays shown, no Swap screens', await P1.eval(`!document.querySelector('#configure-displays').hidden && !document.querySelector('#swap')`));

  // 5. Dialog in the speaker view: Esc closes it and does not end the presentation.
  const page0 = await P1.eval(`document.querySelector('#count').textContent`);
  await P1.eval(`document.querySelector('#configure-displays').click()`);
  await sleep(500);
  check('speaker view: dialog opens with the current roles', (await P1.eval(dialogState)).roles.join() === 'speaker,speaker,audience');
  await P1.key('ArrowRight', 'ArrowRight', 39);
  await sleep(300);
  check('speaker view: keys do not turn pages while the dialog is open', (await P1.eval(`document.querySelector('#count').textContent`)) === page0);
  await P1.key('Escape', 'Escape', 27);
  await sleep(800);
  check('speaker view: Esc closes the dialog, presentation goes on', !(await P1.eval(dialogState)).open && (await pages('presenter')).length === 2);

  // 6. Apply during the presentation: display 2 becomes audience.
  await P1.eval(`document.querySelector('#configure-displays').click()`);
  await sleep(500);
  await P1.eval(setRole(1, 'audience'));
  await P1.eval(clickApply);
  P1.close(); P2.close();
  await sleep(4000);
  sp = await shown('presenter');
  au = await shown('audience');
  check('apply while presenting: speaker view on display 1 only', xs(sp) === '0' && allFull(sp), JSON.stringify(sp));
  check('apply while presenting: audience on displays 2 and 3', xs(au) === '1280,3841' && allFull(au), JSON.stringify(au));

  // 7. Lose the external displays, then get them back.
  displaySwitch('internal');
  await sleep(7000);
  sp = await shown('presenter');
  au = await shown('audience');
  check('one display left: only the audience, full screen', sp.length === 0 && xs(au) === '0' && allFull(au), JSON.stringify({ sp, au }));
  displaySwitch('extend');
  await sleep(9000);
  sp = await shown('presenter');
  au = await shown('audience');
  check('displays back: saved roles again', xs(sp) === '0' && xs(au) === '1280,3841' && allFull(sp) && allFull(au), JSON.stringify({ sp, au }));
  const P = await waitFor('presenter');
  const clock = await P.eval(`document.querySelector('#clock').textContent`);
  check('displays back: the timer kept running', clock !== '00:00:00', clock);
  await P.eval(`window.presenter.sendAction({ type: 'exit' })`);
  P.close();
  await sleep(1500);

  // 8. Mirror: every display shows the audience.
  await L.eval(`document.querySelector('#configure-displays').click()`);
  await sleep(500);
  check('reader dialog shows the saved roles', (await L.eval(dialogState)).roles.join() === 'speaker,audience,audience');
  await L.eval(setRole(0, 'audience'));
  await L.eval(clickApply);
  await sleep(500);
  await L.eval(`document.querySelector('#present').click()`);
  await sleep(4000);
  sp = await shown('presenter');
  au = await shown('audience');
  check('mirror: audience on all 3 displays, no speaker view', sp.length === 0 && xs(au) === '0,1280,3841' && allFull(au), JSON.stringify({ sp, au }));
  const A = await waitFor('audience');
  await A.key('Escape', 'Escape', 27);
  A.close();
  await sleep(1500);
  check('mirror: Esc in an audience window ends it', (await pages('audience')).length === 0);

  // 9. Start with one display: audience only; then the others come back.
  await L.eval(`window.presenter.setDisplayRoles([])`).catch(() => {});
  displaySwitch('internal');
  await sleep(7000);
  check('one display: Configure displays hidden', await L.eval(`getComputedStyle(document.querySelector('#configure-displays')).display === 'none'`));
  await L.eval(`document.querySelector('#present').click()`);
  await sleep(4000);
  sp = await shown('presenter');
  au = await shown('audience');
  check('one display: only the audience, full screen', sp.length === 0 && xs(au) === '0' && allFull(au), JSON.stringify({ sp, au }));
  displaySwitch('extend');
  await sleep(9000);
  au = await shown('audience');
  check('displays connected: saved roles applied (mirror)', xs(au) === '0,1280,3841' && allFull(au), JSON.stringify(au));
  const A2 = await waitFor('audience');
  await A2.eval(`window.presenter.sendAction({ type: 'exit' })`);
  A2.close();
  L.close();
  await sleep(1000);

  // 10. Settings from 1.2.0: speaker display = display 2.
  kill();
  await sleep(500);
  const settingsFile = `${UD}\\settings.json`;
  const ids = infos.map((d) => d.id);
  writeFileSync(settingsFile, JSON.stringify({
    speakerMonitor: { id: ids[1], label: 'DOONJIEY', width: 2561, height: 1440, x: 1280, y: 0 },
    audienceMonitor: null, theme: 'system', language: 'system',
  }));
  L = await launch();
  const migrated = (await L.eval('window.presenter.getDisplays()')).map((d) => d.role).join();
  // Display 3 is identical to display 2 (same name and size): it must not take display 2's role.
  check('1.2.0 settings: display 2 stays speaker, the twin keeps its default', migrated === 'speaker,speaker,audience', migrated);
  L.close();
  kill();
  await sleep(500);
  // Opening the PDF saved the last folder, so the file is now in the new format.
  const saved = JSON.parse(readFileSync(settingsFile, 'utf8'));
  const role2 = saved.displayRoles?.find((r) => r.monitor.id === ids[1])?.role;
  check('1.2.0 settings rewritten in the new format, display 2 still speaker',
    !('speakerMonitor' in saved) && role2 === 'speaker' && typeof saved.lastFolder === 'string', JSON.stringify(saved).slice(0, 200));
} catch (err) {
  failures++;
  console.log('FAIL', err.message);
} finally {
  try { displaySwitch('extend'); } catch { /* best effort */ }
  kill();
}
console.log(failures ? `${failures} FAILED` : 'ALL OK');
