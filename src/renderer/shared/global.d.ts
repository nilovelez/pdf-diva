import type { PresenterApi } from '../../types/ipc';

declare global {
  interface Window {
    /** The preload API (contextBridge). */
    presenter: PresenterApi;
  }
}
