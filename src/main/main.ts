import { app, BrowserWindow, dialog, ipcMain, Menu, nativeTheme, screen } from 'electron';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { IPC, type PdfFile } from '../types/ipc';
import {
  endPresentation,
  getSession,
  handleAction,
  isPresentAction,
  isPresentationMode,
  isPresentationSender,
  startPresentation,
} from './presentation';
import { createWindow } from './windows';

// Último PDF abierto; es el que se presenta.
let openedPdf: PdfFile | null = null;
let launcherWindow: BrowserWindow | null = null;

async function readPdf(file: string): Promise<PdfFile> {
  if (!/\.pdf$/i.test(file)) throw new Error('No es un archivo PDF');
  openedPdf = { path: file, name: path.basename(file), data: await readFile(file) };
  return openedPdf;
}

async function pickPdf(event: Electron.IpcMainInvokeEvent): Promise<PdfFile | null> {
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
  return readPdf(file);
}

function createLauncherWindow(): void {
  const win = createWindow('launcher', { width: 1000, height: 680, title: 'PDF Presenter' });
  win.on('closed', endPresentation);
  launcherWindow = win;
}

function notifyDisplayCount(): void {
  launcherWindow?.webContents.send(IPC.displayCount, screen.getAllDisplays().length);
}

ipcMain.handle(IPC.openPdf, pickPdf);
ipcMain.handle(IPC.readPdf, (_event, file: unknown) => {
  if (typeof file !== 'string') throw new Error('Ruta no válida');
  return readPdf(file);
});

ipcMain.handle(IPC.startPresentation, (event, total: unknown, page: unknown, mode: unknown) => {
  const launcher = BrowserWindow.fromWebContents(event.sender);
  if (!launcher || !openedPdf) return;
  if (typeof total !== 'number' || typeof page !== 'number' || !(total >= 1)) return;
  if (!isPresentationMode(mode)) return;
  startPresentation(launcher, openedPdf, Math.trunc(total), page, mode);
});

ipcMain.handle(IPC.getSession, (event) => (isPresentationSender(event.sender) ? getSession() : null));
ipcMain.handle(IPC.getDisplayCount, () => screen.getAllDisplays().length);

ipcMain.on(IPC.action, (event, action: unknown) => {
  if (isPresentationSender(event.sender) && isPresentAction(action)) handleAction(action);
});

app.whenReady().then(() => {
  Menu.setApplicationMenu(null);
  nativeTheme.themeSource = 'system';
  screen.on('display-added', notifyDisplayCount);
  screen.on('display-removed', notifyDisplayCount);
  createLauncherWindow();
});

app.on('window-all-closed', () => {
  app.quit();
});
