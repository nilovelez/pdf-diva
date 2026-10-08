import { BrowserWindow, nativeTheme } from 'electron';
import path from 'node:path';
import { LANGUAGE_SWITCH } from '../types/ipc';
import { uiLanguage } from './settings';

export const isMac = process.platform === 'darwin';

/**
 * Full screen for the presentation windows. On macOS the native kind moves each window to a Space
 * of its own, with an animation and asynchronously; the simple kind covers the display in place
 * and at once, as on Windows.
 */
export function setFullScreen(win: BrowserWindow, on: boolean): void {
  if (isMac) win.setSimpleFullScreen(on);
  else win.setFullScreen(on);
}

export function isFullScreen(win: BrowserWindow): boolean {
  return isMac ? win.isSimpleFullScreen() : win.isFullScreen();
}

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
      // No spellcheck: Chromium may download dictionaries, and the app must stay offline.
      spellcheck: false,
      // Passed this way so the page can be translated before it is first painted.
      additionalArguments: [`${LANGUAGE_SWITCH}${uiLanguage()}`],
    },
  });
  // The app never navigates away or opens new windows by itself; links go through IPC.
  win.webContents.setWindowOpenHandler(() => ({ action: 'deny' }));
  win.webContents.on('will-navigate', (event) => event.preventDefault());
  void win.loadFile(path.join(__dirname, 'renderer', name, 'index.html'));
  return win;
}
