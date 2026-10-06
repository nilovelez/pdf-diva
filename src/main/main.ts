import { app, BrowserWindow, dialog, ipcMain, Menu, screen, session, shell } from 'electron';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { IPC, type PdfFile, type SettingsPatch } from '../types/ipc';
import { displayInfos } from './displays';
import {
  endPresentation,
  getSession,
  handleAction,
  isPresentAction,
  isPresentationMode,
  isPresentationSender,
  onDisplaysChanged,
  startPresentation,
} from './presentation';
import {
  applyTheme,
  getSettings,
  isLanguageSetting,
  isThemeSetting,
  loadSettings,
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

async function readPdf(file: string): Promise<PdfFile> {
  if (!/\.pdf$/i.test(file)) throw new Error('Not a PDF file');
  const data = await readFile(file);
  pendingPdf = { id: ++lastReadId, path: file, name: path.basename(file), data };
  return pendingPdf;
}

async function pickPdf(event: Electron.IpcMainInvokeEvent): Promise<PdfFile | null> {
  const parent = BrowserWindow.fromWebContents(event.sender) ?? undefined;
  const options: Electron.OpenDialogOptions = {
    title: t('open.dialogTitle'),
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

function createLauncherWindow(): void {
  const win = createWindow('launcher', { width: 1000, height: 680, title: 'PDF Diva' });
  win.on('closed', endPresentation);
  launcherWindow = win;
}

function displaysChanged(): void {
  launcherWindow?.webContents.send(IPC.displaysChanged, displayInfos());
  onDisplaysChanged();
}

function isSettingsPatch(value: unknown): value is SettingsPatch {
  if (typeof value !== 'object' || value === null) return false;
  const { speakerMonitorId, theme, language } = value as Record<string, unknown>;
  const idOk =
    speakerMonitorId === undefined ||
    speakerMonitorId === null ||
    typeof speakerMonitorId === 'number';
  const themeOk = theme === undefined || isThemeSetting(theme);
  const languageOk = language === undefined || isLanguageSetting(language);
  return idOk && themeOk && languageOk;
}

ipcMain.handle(IPC.openPdf, pickPdf);
ipcMain.handle(IPC.readPdf, (_event, file: unknown) => {
  if (typeof file !== 'string') throw new Error('Invalid path');
  return readPdf(file);
});
ipcMain.on(IPC.pdfOpened, (_event, id: unknown) => {
  if (pendingPdf && pendingPdf.id === id) openedPdf = pendingPdf;
});

ipcMain.handle(
  IPC.startPresentation,
  (event, total: unknown, page: unknown, mode: unknown, password: unknown) => {
    const launcher = BrowserWindow.fromWebContents(event.sender);
    if (!launcher || !openedPdf) return;
    if (typeof total !== 'number' || typeof page !== 'number' || !(total >= 1)) return;
    if (!Number.isFinite(total) || !Number.isFinite(page)) return;
    if (!isPresentationMode(mode)) return;
    const pdfPassword = typeof password === 'string' && password !== '' ? password : undefined;
    startPresentation(launcher, openedPdf, Math.trunc(total), page, mode, pdfPassword);
  },
);

ipcMain.handle(IPC.getSession, (event) => (isPresentationSender(event.sender) ? getSession() : null));
ipcMain.handle(IPC.getDisplays, () => displayInfos());
ipcMain.handle(IPC.getSettings, () => getSettings());
ipcMain.handle(IPC.setSettings, (_event, patch: unknown) => {
  if (!isSettingsPatch(patch)) throw new Error('Invalid settings');
  return updateSettings(patch);
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

app.whenReady().then(() => {
  keepOffline();
  Menu.setApplicationMenu(null);
  loadSettings();
  applyTheme();
  screen.on('display-added', displaysChanged);
  screen.on('display-removed', displaysChanged);
  screen.on('display-metrics-changed', displaysChanged);
  createLauncherWindow();
});

app.on('window-all-closed', () => {
  app.quit();
});
