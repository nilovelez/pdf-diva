import { ELECTRON, FIXTURES, LAUNCHERS, WORK } from './paths.mjs';
import { spawn, execFileSync } from 'node:child_process';
import { mkdirSync, readFileSync, rmSync, existsSync } from 'node:fs';

const SP = WORK;
const PDF = `${FIXTURES}\\test.pdf`;
const PWPDF = `${FIXTURES}\\password.pdf`;
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

async function launch(userData, langs, pdf = PDF) {
  kill();
  await sleep(500);
  spawn(ELECTRON, [`${LAUNCHERS}\\test-main.cjs`, '--remote-debugging-port=9333'], {
    env: { ...process.env, TEST_USERDATA: userData, TEST_LANGS: langs, TEST_PDF: pdf },
    stdio: 'ignore',
  });
  const L = await waitFor('launcher');
  await L.eval(`new Promise(r => document.readyState === 'complete' ? r() : addEventListener('load', r))`);
  return L;
}

const text = (sel) => `document.querySelector(${JSON.stringify(sel)})?.textContent.trim()`;

const UD = `${SP}\\ud`;
rmSync(UD, { recursive: true, force: true });
mkdirSync(UD, { recursive: true });

try {
  // 1. Spanish system (regional variant) → Spanish
  let L = await launch(UD, 'es-MX,en-US');
  check('es-MX system → Spanish', (await L.eval(text('#drop p'))) === 'Haz clic o arrastra un fichero pdf para abrirlo', await L.eval(text('#drop p')));
  check('html lang = es', (await L.eval('document.documentElement.lang')) === 'es');
  check('no empty data-i18n', (await L.eval(`[...document.querySelectorAll('[data-i18n]')].filter(e => !e.textContent.trim()).length`)) === 0);
  check('settings button title', (await L.eval(`document.querySelector('#settings-open').title + '|' + document.querySelector('#settings-open').getAttribute('aria-label')`)) === 'Ajustes|Ajustes');
  check('hint has bold', (await L.eval(`document.querySelector('[data-i18n="settings.speakerMonitor.hint"] b')?.textContent`)) === 'Alternar pantallas');

  // 2. Unknown languages → English
  L = await launch(UD, 'fr-FR,de-DE');
  check('fr/de system → English', (await L.eval(text('#drop p'))) === 'Click or drop a PDF file to open it', await L.eval(text('#drop p')));

  // 3. First supported language wins
  L = await launch(UD, 'fr-FR,es-ES,en-US');
  check('fr,es,en → Spanish', (await L.eval('document.documentElement.lang')) === 'es');

  // 4. Open a PDF, change the language live
  L = await launch(UD, 'es-ES');
  await L.eval(`document.querySelector('#open-welcome').click()`);
  await sleep(2500);
  check('open dialog title in Spanish', readFileSync(`${UD}\\dialog-title.txt`, 'utf8') === 'Abrir PDF');
  check('page label es', (await L.eval(text('#page'))) === 'Página 1 de 3', await L.eval(text('#page')));
  await L.eval(`document.querySelector('#settings-open').click()`);
  await sleep(500);
  check('language options', (await L.eval(`[...document.querySelectorAll('#language option')].map(o => o.value + '=' + o.textContent).join(',')`)) === 'system=Sistema,en=English,es=Español', await L.eval(`[...document.querySelectorAll('#language option')].map(o => o.value + '=' + o.textContent).join(',')`));
  check('language select = system', (await L.eval(`document.querySelector('#language').value`)) === 'system');
  await L.eval(`(() => { const s = document.querySelector('#language'); s.value = 'en'; s.dispatchEvent(new Event('change')); })()`);
  await sleep(800);
  check('live: settings title en', (await L.eval(text('#settings-title'))) === 'Settings');
  check('live: page label en', (await L.eval(text('#page'))) === 'Page 1 of 3', await L.eval(text('#page')));
  check('live: monitor auto option en', (await L.eval(`document.querySelector('#speaker-monitor option').textContent`)) === 'Automatic (the main display)');
  check('live: select keeps en', (await L.eval(`document.querySelector('#language').value`)) === 'en');
  check('live: html lang en', (await L.eval('document.documentElement.lang')) === 'en');
  check('live: PDF still open', (await L.eval(`!document.querySelector('#reader').hidden`)) === true);
  await sleep(500);
  const saved = JSON.parse(readFileSync(`${UD}\\settings.json`, 'utf8'));
  check('saved language en', saved.language === 'en', JSON.stringify(saved));

  // 5. Presentation windows use the new language
  await L.eval(`document.querySelector('#settings [data-close]').click()`);
  await L.eval(`(document.querySelector('#present:not([hidden])') ?? document.querySelector('#present-presenter')).click()`);
  const P = await waitFor('presenter');
  await sleep(2000);
  check('presenter: exit en', (await P.eval(text('#exit'))) === 'Exit');
  check('presenter: pause label en', (await P.eval(text('#pause-label'))) === 'Pause');
  check('presenter: count', (await P.eval(`document.querySelector('#count').innerHTML`)) === '<b>1</b> of 3', await P.eval(`document.querySelector('#count').innerHTML`));
  check('presenter: title', (await P.eval('document.title')) === 'PDF Diva - Speaker view');
  check('presenter: next tooltip', (await P.eval(`document.querySelector('#next').title`)) === 'Go to the next slide');
  check('presenter: no empty data-i18n', (await P.eval(`[...document.querySelectorAll('[data-i18n]')].filter(e => !e.textContent.trim()).length`)) === 0);
  await P.eval(`document.querySelector('#pause').click()`);
  check('presenter: resume label', (await P.eval(text('#pause-label'))) === 'Resume');
  await P.eval(`document.querySelector('#exit').click()`);
  await sleep(800);

  // 6. Restart: the saved choice beats the system language
  L = await launch(UD, 'es-ES');
  check('restart: saved en beats es system', (await L.eval('document.documentElement.lang')) === 'en');
  await L.eval(`document.querySelector('#open-welcome').click()`);
  await sleep(2000);
  check('dialog title en', readFileSync(`${UD}\\dialog-title.txt`, 'utf8') === 'Open PDF');

  // 7. Back to system → Spanish live
  await L.eval(`document.querySelector('#settings-open').click()`);
  await L.eval(`(() => { const s = document.querySelector('#language'); s.value = 'system'; s.dispatchEvent(new Event('change')); })()`);
  await sleep(800);
  check('system again → es live', (await L.eval(text('#page'))) === 'Página 1 de 3', await L.eval(text('#page')));

  // 8. Password prompt
  if (existsSync(PWPDF)) {
    L = await launch(UD, 'es-ES', PWPDF);
    await L.eval(`document.querySelector('#open-welcome').click()`);
    await sleep(2000);
    check('password prompt es', /^Escribe la contraseña para abrir «password\.pdf»\.$/.test(await L.eval(text('#password-text'))), await L.eval(text('#password-text')));
  }
} catch (e) {
  failures++;
  console.log('ERROR', e.message);
} finally {
  kill();
}
console.log(failures ? `${failures} FAILED` : 'ALL OK');
