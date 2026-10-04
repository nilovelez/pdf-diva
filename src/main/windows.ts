import { BrowserWindow } from 'electron';
import path from 'node:path';

/** Crea una ventana con la página de `src/renderer/<name>` y el preload común. */
export function createWindow(
  name: 'launcher' | 'audience' | 'presenter',
  options: Electron.BrowserWindowConstructorOptions = {},
): BrowserWindow {
  const win = new BrowserWindow({
    ...options,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
    },
  });
  void win.loadFile(path.join(__dirname, 'renderer', name, 'index.html'));
  return win;
}
