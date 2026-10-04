import type { PresenterApi } from '../../types/ipc';

declare global {
  interface Window {
    presenter: PresenterApi;
  }
}

const status = document.getElementById('status');

window.presenter.ping().then((reply) => {
  if (status) status.textContent = `Listo (IPC: ${reply})`;
});
