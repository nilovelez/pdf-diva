import { contextBridge, ipcRenderer, webUtils } from 'electron';
import { IPC, type PresenterApi } from '../types/ipc';

const api: PresenterApi = {
  openPdf: () => ipcRenderer.invoke(IPC.openPdf),
  readPdf: (path) => ipcRenderer.invoke(IPC.readPdf, path),
  pathForFile: (file) => webUtils.getPathForFile(file),
  startPresentation: (total, page) => ipcRenderer.invoke(IPC.startPresentation, total, page),
  getSession: () => ipcRenderer.invoke(IPC.getSession),
  sendAction: (action) => ipcRenderer.send(IPC.action, action),
  onState: (callback) => {
    ipcRenderer.on(IPC.state, (_event, state) => callback(state));
  },
  onPresentationEnded: (callback) => {
    ipcRenderer.on(IPC.presentationEnded, (_event, page) => callback(page));
  },
};

contextBridge.exposeInMainWorld('presenter', api);
