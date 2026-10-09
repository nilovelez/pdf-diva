// Smoke test of a packaged build. CI runs it on the Mac build, because there is no Mac to try
// it on by hand; it works on Windows too. It drives the real app through the DevTools protocol:
// a PDF from the command line, presenting, a page forward, Esc, and a second PDF from the system.
// Usage: node scripts/smoke-test.mjs <path to the app's executable>
import { execFileSync, spawn } from 'node:child_process';
import { mkdtempSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';

const exe = process.argv[2];
if (!exe) throw new Error('Usage: node scripts/smoke-test.mjs <app executable>');
const PORT = 9333;
const isMac = process.platform === 'darwin';

/** A PDF with `pages` plain coloured pages. */
function makePdf(file, pages) {
  const objects = ['<< /Type /Catalog /Pages 2 0 R >>'];
  const kids = Array.from({ length: pages }, (_, i) => `${3 + 2 * i} 0 R`);
  objects.push(`<< /Type /Pages /Kids [${kids.join(' ')}] /Count ${pages} >>`);
  for (let i = 0; i < pages; i++) {
    const content = `${(i / pages).toFixed(2)} 0.5 0.8 rg 0 0 800 600 re f`;
    objects.push(`<< /Type /Page /Parent 2 0 R /MediaBox [0 0 800 600] /Contents ${4 + 2 * i} 0 R >>`);
    objects.push(`<< /Length ${content.length} >>\nstream\n${content}\nendstream`);
  }
  let out = '%PDF-1.4\n';
  const offsets = objects.map((object, i) => {
    const offset = out.length;
    out += `${i + 1} 0 obj\n${object}\nendobj\n`;
    return offset;
  });
  const xref = out.length;
  out += `xref\n0 ${objects.length + 1}\n0000000000 65535 f \n`;
  out += offsets.map((o) => `${String(o).padStart(10, '0')} 00000 n \n`).join('');
  out += `trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xref}\n%%EOF\n`;
  writeFileSync(file, out, 'latin1');
}

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function waitFor(what, check, ms = 30000) {
  const end = Date.now() + ms;
  for (;;) {
    try {
      const value = await check();
      if (value) return value;
    } catch {
      /* not there yet */
    }
    if (Date.now() > end) throw new Error(`Timed out waiting for: ${what}`);
    await sleep(250);
  }
}

async function targets() {
  const response = await fetch(`http://127.0.0.1:${PORT}/json`);
  return (await response.json()).filter((t) => t.type === 'page');
}

const findTarget = async (name) => (await targets()).find((t) => t.url.includes(`/renderer/${name}/`));

/** A DevTools connection to one window. */
async function connect(target) {
  const ws = new WebSocket(target.webSocketDebuggerUrl);
  await new Promise((resolve, reject) => {
    ws.onopen = resolve;
    ws.onerror = reject;
  });
  let nextId = 0;
  const pending = new Map();
  ws.onmessage = (event) => {
    const message = JSON.parse(event.data);
    pending.get(message.id)?.(message);
    pending.delete(message.id);
  };
  // A window closed by the command (Esc) never answers it, hence the time limit.
  const send = (method, params = {}) =>
    new Promise((resolve) => {
      const id = ++nextId;
      pending.set(id, resolve);
      ws.send(JSON.stringify({ id, method, params }));
      setTimeout(() => resolve({}), 5000);
    });
  return {
    async evaluate(expression) {
      const { result } = await send('Runtime.evaluate', { expression, returnByValue: true, awaitPromise: true });
      return result?.result?.value;
    },
    async key(key, code, keyCode) {
      for (const type of ['keyDown', 'keyUp']) {
        await send('Input.dispatchKeyEvent', { type, key, code, windowsVirtualKeyCode: keyCode });
      }
    },
    close: () => ws.close(),
  };
}

const pageLabel = "document.querySelector('#page').textContent";
/** "Page 2 of 3" in any language: the two numbers, in that order. */
const pageIs = (page, total) => (text) =>
  typeof text === 'string' && new RegExp(`\\b${page}\\b.*\\b${total}\\b`).test(text);

function ok(message) {
  console.log(`OK   ${message}`);
}

const dir = mkdtempSync(path.join(tmpdir(), 'pdf-diva-smoke-'));
const first = path.join(dir, 'first.pdf');
const second = path.join(dir, 'second.pdf');
makePdf(first, 3);
makePdf(second, 5);

const app = spawn(exe, [`--remote-debugging-port=${PORT}`, first], { stdio: 'inherit' });
let failed = false;
try {
  // The first start of a freshly built app can be slow (macOS checks it).
  const launcher = await connect(await waitFor('the reader window', () => findTarget('launcher'), 90000));
  const label = await waitFor('the PDF from the command line', async () => {
    const text = await launcher.evaluate(pageLabel);
    return pageIs(1, 3)(text) && text;
  });
  ok(`PDF from the command line opens in the reader: "${label}"`);
  await waitFor('the reader page drawn', () => launcher.evaluate("document.querySelector('#canvas').width > 0"));
  ok('reader page drawn');

  await launcher.key('F5', 'F5', 116);
  const audience = await connect(await waitFor('the audience window', () => findTarget('audience')));
  const size = await waitFor('the audience window full screen with its slide', () =>
    audience.evaluate(
      `(() => { const c = document.querySelector('#canvas');
        // 1 px of slack: scaled displays can round the window size.
        const full = Math.abs(innerWidth - screen.width) <= 1 && Math.abs(innerHeight - screen.height) <= 1;
        return full && c.width > 0 && innerWidth + 'x' + innerHeight; })()`,
    ),
  );
  ok(`F5 presents: audience window full screen (${size}) with the slide drawn`);
  const speaker = await findTarget('presenter');
  ok(speaker ? 'speaker view open too (two or more displays)' : 'one display: audience only, no speaker view');

  const sessionPage = 'window.presenter.getSession().then((s) => s && s.state.page)';
  const before = await audience.evaluate(sessionPage);
  // A person never presses within milliseconds of the slide appearing. On Linux (Xvfb), a key
  // sent that soon was lost twice in a row with the window still settling into full screen.
  await sleep(1000);
  await audience.key('ArrowRight', 'ArrowRight', 39);
  await waitFor(`ArrowRight to turn the page (was ${before})`, async () => (await audience.evaluate(sessionPage)) === before + 1);
  ok(`ArrowRight turns the page (${before} -> ${before + 1})`);
  await audience.key('Escape', 'Escape', 27);
  audience.close();
  await waitFor('the presentation to end', async () => !(await findTarget('audience')));
  let readerLabel = '';
  try {
    await waitFor('the reader back on page 2', async () => pageIs(2, 3)((readerLabel = await launcher.evaluate(pageLabel))));
  } catch (error) {
    throw new Error(`${error instanceof Error ? error.message : String(error)} (the reader shows "${readerLabel}")`);
  }
  ok('Esc: presentation ended, reader back on page 2');

  // A second PDF from the system while the app runs: Finder's way on macOS, a second launch elsewhere.
  if (isMac) {
    const bundle = path.resolve(exe, '..', '..', '..');
    execFileSync('open', ['-a', bundle, second]);
  } else {
    spawn(exe, [second], { stdio: 'ignore' });
  }
  await waitFor('the second PDF in the reader', async () => pageIs(1, 5)(await launcher.evaluate(pageLabel)));
  ok(isMac ? 'PDF opened from the system (open-file) replaces the one in the reader' : 'PDF from a second launch replaces the one in the reader');
  launcher.close();
} catch (error) {
  failed = true;
  console.log(`FAIL ${error instanceof Error ? error.message : String(error)}`);
} finally {
  app.kill();
}
console.log(failed ? 'SMOKE TEST FAILED' : 'ALL OK');
process.exit(failed ? 1 : 0);
