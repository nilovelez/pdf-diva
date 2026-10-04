import { app, BrowserWindow, ipcMain } from 'electron';
import path from 'node:path';

function createLauncherWindow(): void {
  const win = new BrowserWindow({
    width: 640,
    height: 420,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
    },
  });
  void win.loadFile(path.join(__dirname, 'renderer', 'launcher', 'index.html'));
}

ipcMain.handle('ping', () => 'pong');

app.whenReady().then(createLauncherWindow);

app.on('window-all-closed', () => {
  app.quit();
});
