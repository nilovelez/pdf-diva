// Test launcher: isolated settings, stubbed open dialog, simulated system languages.
// Started as `electron tests/launchers/test-main.cjs`; it runs the built app (dist/main.js).
const { app, dialog } = require('electron');
const fs = require('node:fs');
const path = require('node:path');
if (process.env.TEST_USERDATA) app.setPath('userData', process.env.TEST_USERDATA);
if (process.env.TEST_LANGS) app.getPreferredSystemLanguages = () => process.env.TEST_LANGS.split(',');
dialog.showOpenDialog = async (_w, o) => {
  global.lastDialogTitle = (o ?? _w).title;
  fs.writeFileSync(process.env.TEST_USERDATA + '/dialog-title.txt', String((o ?? _w).title));
  fs.writeFileSync(process.env.TEST_USERDATA + '/dialog-default.txt', String((o ?? _w).defaultPath));
  return { canceled: false, filePaths: [process.env.TEST_PDF] };
};
if (process.env.TEST_FAKE2) {
  // A pretend second display to the right of the real one (only the roles logic is tested).
  app.whenReady().then(() => {
    const { screen } = require('electron');
    const real = screen.getAllDisplays.bind(screen);
    screen.getAllDisplays = () => {
      const list = real();
      const first = list[0];
      const x = first.bounds.x + first.bounds.width;
      const fake = { ...first, id: 4242, label: 'Fake', internal: false,
        bounds: { x, y: 0, width: 1920, height: 1080 }, workArea: { x, y: 0, width: 1920, height: 1040 },
        size: { width: 1920, height: 1080 }, workAreaSize: { width: 1920, height: 1040 }, scaleFactor: 1 };
      return [...list, fake];
    };
  });
  // Windows will not really move a window onto a display that does not exist, so record where
  // the app asks each window to go instead.
  const { BrowserWindow } = require('electron');
  // Audience windows get their display in the constructor options: wrap createWindow's target.
  const Original = BrowserWindow;
  const Wrapped = function (options = {}) {
    const win = new Original(options);
    if (options.fullscreen && options.x !== undefined) {
      fs.writeFileSync(`${process.env.TEST_USERDATA}/bounds-audience.json`, JSON.stringify({ x: options.x, y: options.y }));
    }
    return win;
  };
  Wrapped.prototype = Original.prototype;
  Object.setPrototypeOf(Wrapped, Original);
  require('electron').BrowserWindow = Wrapped;
  const setBounds = BrowserWindow.prototype.setBounds;
  BrowserWindow.prototype.setBounds = function (bounds, ...rest) {
    const name = (this.webContents.getURL().match(/renderer\/(\w+)\//) ?? [])[1] ?? 'unknown';
    fs.writeFileSync(`${process.env.TEST_USERDATA}/bounds-${name}.json`, JSON.stringify(bounds));
    return setBounds.call(this, bounds, ...rest);
  };
}
require(path.join(__dirname, '..', '..', 'dist', 'main.js'));
