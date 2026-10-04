import { app, BrowserWindow, dialog, ipcMain } from 'electron';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import type { OpenedPdf } from '../types/ipc';

function createLauncherWindow(): void {
  const win = new BrowserWindow({
    width: 960,
    height: 640,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
    },
  });
  void win.loadFile(path.join(__dirname, 'renderer', 'launcher', 'index.html'));
}

async function openPdf(event: Electron.IpcMainInvokeEvent): Promise<OpenedPdf | null> {
  const parent = BrowserWindow.fromWebContents(event.sender) ?? undefined;
  const options: Electron.OpenDialogOptions = {
    title: 'Abrir PDF',
    properties: ['openFile'],
    filters: [{ name: 'PDF', extensions: ['pdf'] }],
  };
  const result = parent
    ? await dialog.showOpenDialog(parent, options)
    : await dialog.showOpenDialog(options);
  const file = result.filePaths[0];
  if (result.canceled || !file) return null;
  return { name: path.basename(file), data: await readFile(file) };
}

ipcMain.handle('ping', () => 'pong');
ipcMain.handle('open-pdf', openPdf);

app.whenReady().then(createLauncherWindow);

app.on('window-all-closed', () => {
  app.quit();
});
