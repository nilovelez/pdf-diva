import { BrowserWindow, nativeTheme } from 'electron';
import path from 'node:path';

/** Creates a window showing the page in `src/renderer/<name>` with the shared preload. */
export function createWindow(
  name: 'launcher' | 'audience' | 'presenter',
  options: Electron.BrowserWindowConstructorOptions = {},
): BrowserWindow {
  const win = new BrowserWindow({
    // Avoids a white flash when opening in the dark theme.
    backgroundColor: nativeTheme.shouldUseDarkColors ? '#1c1e23' : '#ffffff',
    ...options,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
    },
  });
  // The app never navigates away or opens new windows by itself; links go through IPC.
  win.webContents.setWindowOpenHandler(() => ({ action: 'deny' }));
  win.webContents.on('will-navigate', (event) => event.preventDefault());
  void win.loadFile(path.join(__dirname, 'renderer', name, 'index.html'));
  return win;
}
