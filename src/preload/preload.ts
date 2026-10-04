import { contextBridge, ipcRenderer } from 'electron';
import type { PresenterApi } from '../types/ipc';

const api: PresenterApi = {
  ping: () => ipcRenderer.invoke('ping'),
  openPdf: () => ipcRenderer.invoke('open-pdf'),
};

contextBridge.exposeInMainWorld('presenter', api);
