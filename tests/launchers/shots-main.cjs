// Screenshot launcher (m9): the real app, staged as a laptop (1920x1080 at 150 %) with a projector.
// - The app sees two displays: a built-in laptop screen and a 1920x1080 projector.
// - Every window is put at 1280x720 DIP on a real 4K display at 150 % (dpr 1.5), so a CDP capture
//   of a window is exactly 1920x1080 and looks like that laptop full screen. Nothing goes full screen.
// - SHOT_CLOCK_MS: the timer starts that far in the past, so it doesn't read 00:00:03.
const { app, screen, dialog } = require('electron');
const electron = require('electron');
const fs = require('node:fs');
const path = require('node:path');
const REPO = path.join(__dirname, '..', '..');
if (process.env.TEST_USERDATA) app.setPath('userData', process.env.TEST_USERDATA);
dialog.showOpenDialog = async () => ({ canceled: false, filePaths: [process.env.TEST_PDF] });
// Unpackaged, app.getVersion() is Electron's; the installed app reports package.json's.
const version = JSON.parse(fs.readFileSync(path.join(REPO, 'package.json'), 'utf8')).version;
app.getVersion = () => version;

const offset = Number(process.env.SHOT_CLOCK_MS || 0);
if (offset) {
  const realNow = Date.now;
  Date.now = () => realNow() - offset;
}

// Real 4K displays (x > 0): speaker/launcher on the first, audience on the second.
let stage = { x: 1400, y: 100 };
let audienceStage = { x: 4000, y: 100 };
app.whenReady().then(() => {
  const big = screen.getAllDisplays().filter((d) => d.bounds.x > 0).sort((a, b) => a.bounds.x - b.bounds.x);
  if (big[0]) stage = { x: big[0].bounds.x + 100, y: big[0].bounds.y + 100 };
  if (big[1]) audienceStage = { x: big[1].bounds.x + 100, y: big[1].bounds.y + 100 };
  const realAll = screen.getAllDisplays.bind(screen);
  const primary = screen.getPrimaryDisplay();
  screen.getAllDisplays = () => {
    const real = realAll();
    const second = real.find((d) => d.id !== primary.id) ?? real[0];
    return [
      { ...primary, label: '', internal: true, scaleFactor: 1.5,
        bounds: { x: 0, y: 0, width: 1280, height: 720 }, workArea: { x: 0, y: 0, width: 1280, height: 672 },
        size: { width: 1280, height: 720 }, workAreaSize: { width: 1280, height: 672 } },
      { ...second, label: 'Projector', internal: false, scaleFactor: 1,
        bounds: { x: 1280, y: 0, width: 1920, height: 1080 }, workArea: { x: 1280, y: 0, width: 1920, height: 1080 },
        size: { width: 1920, height: 1080 }, workAreaSize: { width: 1920, height: 1080 } },
    ];
  };
});

const kindOf = (win) => (win.webContents.getURL().match(/renderer\/(\w+)\//) ?? [])[1] ?? '';
const rectFor = (win) => ({ ...(kindOf(win) === 'audience' ? audienceStage : stage), width: 1280, height: 720 });

// Moving a window to a display with another scale factor resizes it wrongly the first time
// (Electron/Windows), so every placement is done twice.
const Proto = electron.BrowserWindow.prototype;
const setBounds = Proto.setBounds;
const setContentBounds = Proto.setContentBounds;
Proto.setFullScreen = function () {};
Proto.setBounds = function () {
  setBounds.call(this, rectFor(this));
  setBounds.call(this, rectFor(this));
};
app.on('browser-window-created', (_event, win) => {
  win.webContents.on('did-finish-load', () => {
    if (kindOf(win) === 'launcher') {
      setContentBounds.call(win, rectFor(win));
      setContentBounds.call(win, rectFor(win));
      // The frame rounds the content size at 150 %: correct until the page is exactly 1280x720.
      const fix = async (tries) => {
        const [w, h] = await win.webContents.executeJavaScript('[innerWidth, innerHeight]');
        if ((w === 1280 && h === 720) || tries === 0) return;
        const [cw, ch] = win.getContentSize();
        win.setContentSize(cw + 1280 - w, ch + 720 - h);
        setTimeout(() => void fix(tries - 1), 200);
      };
      setTimeout(() => void fix(5), 300);
    }
  });
});

require(path.join(REPO, 'dist', 'main.js'));
