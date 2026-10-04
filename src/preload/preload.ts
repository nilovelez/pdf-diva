import { contextBridge, ipcRenderer } from 'electron';
import type { PresenterApi } from '../types/ipc';

const api: PresenterApi = {
  ping: () => ipcRenderer.invoke('ping'),
};

contextBridge.exposeInMainWorld('presenter', api);
