import { contextBridge, ipcRenderer, webUtils } from 'electron';
import { IPC, type PresenterApi } from '../types/ipc';

const api: PresenterApi = {
  openPdf: () => ipcRenderer.invoke(IPC.openPdf),
  readPdf: (path) => ipcRenderer.invoke(IPC.readPdf, path),
  pdfOpened: () => ipcRenderer.send(IPC.pdfOpened),
  pathForFile: (file) => webUtils.getPathForFile(file),
  startPresentation: (total, page, mode, password) =>
    ipcRenderer.invoke(IPC.startPresentation, total, page, mode, password),
  getSession: () => ipcRenderer.invoke(IPC.getSession),
  sendAction: (action) => ipcRenderer.send(IPC.action, action),
  onState: (callback) => {
    ipcRenderer.on(IPC.state, (_event, state) => callback(state));
  },
  onPresentationEnded: (callback) => {
    ipcRenderer.on(IPC.presentationEnded, (_event, page) => callback(page));
  },
  getDisplays: () => ipcRenderer.invoke(IPC.getDisplays),
  onDisplaysChanged: (callback) => {
    ipcRenderer.on(IPC.displaysChanged, (_event, displays) => callback(displays));
  },
  getSettings: () => ipcRenderer.invoke(IPC.getSettings),
  setSettings: (patch) => ipcRenderer.invoke(IPC.setSettings, patch),
  getAppInfo: () => ipcRenderer.invoke(IPC.getAppInfo),
  openRepository: () => ipcRenderer.send(IPC.openRepository),
};

contextBridge.exposeInMainWorld('presenter', api);
