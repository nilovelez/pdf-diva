// Opens the website in a plain window, to drive it over CDP (site-test.mjs).
const { app, BrowserWindow, nativeTheme } = require('electron');
const path = require('node:path');
if (process.env.TEST_USERDATA) app.setPath('userData', process.env.TEST_USERDATA);
app.whenReady().then(() => {
  nativeTheme.themeSource = process.env.SITE_SCHEME || 'dark';
  const win = new BrowserWindow({ width: 1280, height: 900 });
  win.loadFile(path.join(__dirname, '..', '..', 'site', 'index.html'));
});
