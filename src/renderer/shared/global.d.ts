import type { PresenterApi } from '../../types/ipc';

declare global {
  interface Window {
    /** API del preload (contextBridge). */
    presenter: PresenterApi;
  }
}
