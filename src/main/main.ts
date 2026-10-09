import { app, BrowserWindow, dialog, ipcMain, screen, session, shell } from 'electron';
import { readFile, stat } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { IPC, type DisplayRoleChoice, type PdfFile, type SettingsPatch } from '../types/ipc';
import { displayInfos, sortedDisplays } from './displays';
import { setAppMenu } from './menu';
import {
  endPresentation,
  getSession,
  handleAction,
  isPresentAction,
  isPresentationSender,
  onDisplaysChanged,
  onRolesChanged,
  startPresentation,
} from './presentation';
import {
  applyTheme,
  getSettings,
  isLanguageSetting,
  isThemeSetting,
  lastFolder,
  loadSettings,
  rememberFolder,
  saveRoles,
  t,
  updateSettings,
} from './settings';
import { createWindow } from './windows';

const WEBSITE_URL = 'https://nilovelez.github.io/pdf-diva/';

// The PDF to present is the last one that opened fine; `pending` is the last one read, which may
// still fail. The launcher reports the id it opened, so a slow open can never swap in another file.
let openedPdf: PdfFile | null = null;
let pendingPdf: PdfFile | null = null;
let lastReadId = 0;
let launcherWindow: BrowserWindow | null = null;
/** Until the reader has loaded, a PDF from the system waits here (macOS sends it before that). */
let launcherLoaded = false;
let startupPdf: string | null = null;

async function readPdf(file: string): Promise<PdfFile> {
  if (!/\.pdf$/i.test(file)) throw new Error('Not a PDF file');
  const data = await readFile(file);
  pendingPdf = { id: ++lastReadId, path: file, name: path.basename(file), data };
  return pendingPdf;
}

/** The folder of the last PDF opened, if it still exists (a pendrive may be gone). */
async function startFolder(): Promise<string | undefined> {
  const folder = lastFolder();
  if (!folder) return undefined;
  try {
    return (await stat(folder)).isDirectory() ? folder : undefined;
  } catch {
    return undefined;
  }
}

async function pickPdf(event: Electron.IpcMainInvokeEvent): Promise<PdfFile | null> {
  const parent = BrowserWindow.fromWebContents(event.sender) ?? undefined;
  const options: Electron.OpenDialogOptions = {
    title: t('open.dialogTitle'),
    defaultPath: await startFolder(),
    properties: ['openFile'],
    filters: [{ name: 'PDF', extensions: ['pdf'] }],
  };
  const result = parent
    ? await dialog.showOpenDialog(parent, options)
    : await dialog.showOpenDialog(options);
  const file = result.filePaths[0];
  if (result.canceled || !file) return null;
  return readPdf(file);
}

/**
 * The PDF passed on the command line: Windows does this for "Open with…" and when PDF Diva is the
 * default app. Linux file managers may pass a file:// URI instead of a path.
 */
function pdfFromArgs(argv: readonly string[], workingDirectory: string): string | null {
  for (const arg of argv.slice(1).reverse()) {
    if (arg.startsWith('-')) continue;
    let file = arg;
    if (/^file:\/\//i.test(arg)) {
      try {
        file = fileURLToPath(arg);
      } catch {
        continue;
      }
    }
    if (/\.pdf$/i.test(file)) return path.resolve(workingDirectory, file);
  }
  return null;
}

function bringLauncherToFront(): BrowserWindow | null {
  const win = launcherWindow;
  if (!win || win.isDestroyed()) return null;
  if (win.isMinimized()) win.restore();
  win.show();
  win.focus();
  return win;
}

/**
 * Opens a PDF that came from the system in the reader. A running presentation ends first: the
 * user asked for that file, so showing it is the predictable thing to do.
 */
async function openFromSystem(file: string): Promise<void> {
  endPresentation();
  const win = bringLauncherToFront();
  if (!win) return;
  let pdf: PdfFile | null = null;
  try {
    pdf = await readPdf(file);
  } catch {
    /* the launcher says it could not be read */
  }
  if (!win.isDestroyed()) win.webContents.send(IPC.systemOpen, pdf);
}

function createLauncherWindow(): void {
  const win = createWindow('launcher', { width: 1000, height: 680, title: 'PDF Diva' });
  win.on('closed', endPresentation);
  launcherWindow = win;
  startupPdf ??= pdfFromArgs(process.argv, process.cwd());
  win.webContents.once('did-finish-load', () => {
    launcherLoaded = true;
    if (startupPdf) void openFromSystem(startupPdf);
    startupPdf = null;
  });
}

/** Every window shows the displays (the reader's toolbar, "Configure displays" anywhere). */
function notifyDisplays(): void {
  const displays = displayInfos();
  for (const win of BrowserWindow.getAllWindows()) win.webContents.send(IPC.displaysChanged, displays);
}

function displaysChanged(): void {
  notifyDisplays();
  onDisplaysChanged();
}

function isSettingsPatch(value: unknown): value is SettingsPatch {
  if (typeof value !== 'object' || value === null) return false;
  const { theme, language } = value as Record<string, unknown>;
  const themeOk = theme === undefined || isThemeSetting(theme);
  const languageOk = language === undefined || isLanguageSetting(language);
  return themeOk && languageOk;
}

function isRoleChoice(value: unknown): value is DisplayRoleChoice {
  if (typeof value !== 'object' || value === null) return false;
  const { id, role } = value as Record<string, unknown>;
  return typeof id === 'number' && (role === 'speaker' || role === 'audience');
}

/** Saves the roles chosen in "Configure displays"; there must be an audience among them. */
function setDisplayRoles(choices: unknown): void {
  if (!Array.isArray(choices) || !choices.every(isRoleChoice)) throw new Error('Invalid roles');
  const roles = sortedDisplays().flatMap((display) => {
    const choice = choices.find((c) => c.id === display.id);
    return choice ? [{ display, role: choice.role }] : [];
  });
  if (!roles.some((r) => r.role === 'audience')) throw new Error('No audience display');
  saveRoles(roles);
  notifyDisplays();
  onRolesChanged();
}

ipcMain.handle(IPC.openPdf, pickPdf);
ipcMain.handle(IPC.readPdf, (_event, file: unknown) => {
  if (typeof file !== 'string') throw new Error('Invalid path');
  return readPdf(file);
});
ipcMain.on(IPC.pdfOpened, (_event, id: unknown) => {
  if (!pendingPdf || pendingPdf.id !== id) return;
  openedPdf = pendingPdf;
  // The next Open dialog starts here, however this PDF was opened.
  rememberFolder(path.dirname(openedPdf.path));
});

ipcMain.handle(
  IPC.startPresentation,
  (event, total: unknown, page: unknown, password: unknown) => {
    const launcher = BrowserWindow.fromWebContents(event.sender);
    if (!launcher || !openedPdf) return;
    if (typeof total !== 'number' || typeof page !== 'number' || !(total >= 1)) return;
    if (!Number.isFinite(total) || !Number.isFinite(page)) return;
    const pdfPassword = typeof password === 'string' && password !== '' ? password : undefined;
    startPresentation(launcher, openedPdf, Math.trunc(total), page, pdfPassword);
  },
);

ipcMain.handle(IPC.getSession, (event) => (isPresentationSender(event.sender) ? getSession() : null));
ipcMain.handle(IPC.getDisplays, () => displayInfos());
ipcMain.handle(IPC.setDisplayRoles, (_event, roles: unknown) => setDisplayRoles(roles));
ipcMain.handle(IPC.getSettings, () => getSettings());
ipcMain.handle(IPC.setSettings, (_event, patch: unknown) => {
  if (!isSettingsPatch(patch)) throw new Error('Invalid settings');
  const settings = updateSettings(patch);
  setAppMenu();
  return settings;
});
ipcMain.handle(IPC.getAppInfo, () => ({ version: app.getVersion() }));
// Only the project page can be opened, never a URL the renderer supplies.
ipcMain.on(IPC.openWebsite, () => void shell.openExternal(WEBSITE_URL));

ipcMain.on(IPC.action, (event, action: unknown) => {
  if (isPresentationSender(event.sender) && isPresentAction(action)) handleAction(action);
});

/**
 * PDF Diva works entirely offline and says so in PRIVACY.md. The pages only load local files
 * (the CSP already forbids anything else); this is a second line of defence that also covers
 * Chromium features that could reach the network on their own, such as spellcheck dictionaries.
 */
function keepOffline(): void {
  const { defaultSession } = session;
  defaultSession.setSpellCheckerEnabled(false);
  defaultSession.webRequest.onBeforeRequest(
    { urls: ['http://*/*', 'https://*/*', 'ws://*/*', 'wss://*/*', 'ftp://*/*'] },
    (_details, callback) => callback({ cancel: true }),
  );
}

// On Linux, run through X11 (XWayland on a Wayland desktop): Wayland does not let an app place its
// windows, and each presentation window has to go to a given display. An --ozone-platform typed by
// the user still wins; app.commandLine cannot tell, because Electron adds its own on Wayland.
const userOzone = process.argv.some((arg) => arg.startsWith('--ozone-platform='));
if (process.platform === 'linux' && !userOzone) {
  app.commandLine.appendSwitch('ozone-platform', 'x11');
}

// One instance only: opening a PDF from Windows while PDF Diva runs hands it to the running app.
if (!app.requestSingleInstanceLock()) {
  app.quit();
} else {
  app.on('second-instance', (_event, argv, workingDirectory) => {
    const file = pdfFromArgs(argv, workingDirectory);
    if (file) void openFromSystem(file);
    else bringLauncherToFront();
  });

  // macOS hands PDFs over with this event instead of the command line (Finder, "Open With", the
  // Dock), also the one that launches the app.
  app.on('open-file', (event, file) => {
    event.preventDefault();
    if (launcherLoaded) void openFromSystem(file);
    else startupPdf = file;
  });

  app.whenReady().then(() => {
    keepOffline();
    loadSettings();
    setAppMenu();
    applyTheme();
    screen.on('display-added', displaysChanged);
    screen.on('display-removed', displaysChanged);
    screen.on('display-metrics-changed', displaysChanged);
    createLauncherWindow();
  });
}

app.on('window-all-closed', () => {
  app.quit();
});
