import { BrowserWindow, nativeTheme } from 'electron';
import path from 'node:path';

/** Crea una ventana con la página de `src/renderer/<name>` y el preload común. */
export function createWindow(
  name: 'launcher' | 'audience' | 'presenter',
  options: Electron.BrowserWindowConstructorOptions = {},
): BrowserWindow {
  const win = new BrowserWindow({
    // Evita el destello blanco al abrir en tema oscuro.
    backgroundColor: nativeTheme.shouldUseDarkColors ? '#1c1e23' : '#ffffff',
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
