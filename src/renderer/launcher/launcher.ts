import type { DisplayInfo, PdfFile, PresentationMode, Settings, ThemeSetting } from '../../types/ipc';
import { paintIcons } from '../shared/icons';
import { keepFocusOffButtons, onKeyAction } from '../shared/keys';
import { createPageRenderer } from '../shared/pageview';
import {
  describeLoadError,
  isPasswordError,
  isWrongPassword,
  loadPdf,
  type PDFDocumentProxy,
} from '../shared/pdf';
import { createThumbnails } from './thumbnails';

function byId<T extends HTMLElement>(id: string): T {
  const el = document.getElementById(id);
  if (!el) throw new Error(`Falta #${id}`);
  return el as T;
}

const welcome = byId('welcome');
const reader = byId('reader');
const pageLabel = byId('page');
const stage = byId('stage');
const notice = byId('notice');
const settingsDialog = byId('settings');
const speakerSelect = byId<HTMLSelectElement>('speaker-monitor');
const passwordDialog = byId('password');
const passwordForm = byId<HTMLFormElement>('password-form');
const passwordInput = byId<HTMLInputElement>('password-input');
const passwordError = byId('password-error');

const draw = createPageRenderer(byId<HTMLCanvasElement>('canvas'), stage);
const thumbnails = createThumbnails(byId('thumbs'), (page) => void show(page));

let doc: PDFDocumentProxy | null = null;
/** Password of the open PDF, if it needed one; handed to the presentation windows. */
let docPassword: string | undefined;
let current = 1;
let noticeTimer: number | undefined;
let displays: DisplayInfo[] = [];

function showNotice(text: string): void {
  notice.textContent = text;
  notice.hidden = false;
  window.clearTimeout(noticeTimer);
  noticeTimer = window.setTimeout(() => (notice.hidden = true), 6000);
}

async function show(page: number): Promise<void> {
  if (!doc) return;
  current = Math.min(Math.max(page, 1), doc.numPages);
  pageLabel.textContent = `Página ${current} de ${doc.numPages}`;
  thumbnails.select(current);
  try {
    await draw(doc, current);
  } catch {
    showNotice('No se ha podido dibujar la página.');
  }
}

// ---- Password dialog ----

let cancelPassword: (() => void) | null = null;

/** Asks for the password of `file` until it works; resolves to null if the user cancels. */
function askPassword(file: PdfFile): Promise<{ doc: PDFDocumentProxy; password: string } | null> {
  byId('password-text').textContent = `Escribe la contraseña para abrir «${file.name}».`;
  passwordInput.value = '';
  passwordError.hidden = true;
  passwordDialog.hidden = false;
  passwordInput.focus();

  return new Promise((resolve) => {
    const finish = (value: { doc: PDFDocumentProxy; password: string } | null): void => {
      passwordDialog.hidden = true;
      passwordForm.onsubmit = null;
      cancelPassword = null;
      resolve(value);
    };
    cancelPassword = () => finish(null);
    passwordForm.onsubmit = (event) => {
      event.preventDefault();
      const password = passwordInput.value;
      loadPdf(file.data, password).then(
        (opened) => finish({ doc: opened, password }),
        (err: unknown) => {
          if (isWrongPassword(err) || isPasswordError(err)) {
            passwordError.hidden = false;
            passwordInput.select();
          } else {
            finish(null);
            showNotice(describeLoadError(err));
          }
        },
      );
    };
  });
}

// ---- Opening files ----

async function openFile(file: PdfFile): Promise<void> {
  let next: PDFDocumentProxy;
  let password: string | undefined;
  try {
    next = await loadPdf(file.data);
  } catch (err) {
    if (!isPasswordError(err)) {
      showNotice(describeLoadError(err));
      return;
    }
    const unlocked = await askPassword(file);
    if (!unlocked) return;
    next = unlocked.doc;
    password = unlocked.password;
  }
  const previous = doc;
  doc = next;
  docPassword = password;
  window.presenter.pdfOpened();
  notice.hidden = true;
  // The window title carries the full path of the open PDF (there is no status bar).
  document.title = `PDF Presenter - ${file.path}`;
  welcome.hidden = true;
  reader.hidden = false;
  thumbnails.load(next);
  await show(1);
  // Destroyed last: the previous thumbnails and page no longer use it.
  void previous?.loadingTask.destroy();
}

async function pickFile(): Promise<void> {
  const file = await window.presenter.openPdf();
  if (file) await openFile(file);
}

async function openDropped(dropped: File): Promise<void> {
  if (!/\.pdf$/i.test(dropped.name)) {
    showNotice('Solo se pueden abrir archivos PDF.');
    return;
  }
  try {
    await openFile(await window.presenter.readPdf(window.presenter.pathForFile(dropped)));
  } catch {
    showNotice('No se ha podido leer el archivo.');
  }
}

function present(mode: PresentationMode): void {
  if (doc) void window.presenter.startPresentation(doc.numPages, current, mode, docPassword);
}

// ---- Settings dialog ----

const monitorLabel = (d: DisplayInfo): string =>
  `Monitor ${d.index} · ${d.width}×${d.height}${d.primary ? ' · principal' : ''}`;

function fillSettings(settings: Settings): void {
  speakerSelect.replaceChildren(
    new Option('Automático (el principal)', 'auto'),
    ...displays.map((d) => new Option(monitorLabel(d), String(d.id))),
  );
  speakerSelect.value = settings.speakerMonitorId === null ? 'auto' : String(settings.speakerMonitorId);
  settingsDialog.querySelectorAll<HTMLButtonElement>('[data-theme]').forEach((button) => {
    button.setAttribute('aria-pressed', String(button.dataset.theme === settings.theme));
  });
}

async function openSettings(): Promise<void> {
  fillSettings(await window.presenter.getSettings());
  settingsDialog.hidden = false;
  speakerSelect.focus();
}

speakerSelect.addEventListener('change', () => {
  const id = speakerSelect.value === 'auto' ? null : Number(speakerSelect.value);
  void window.presenter.setSettings({ speakerMonitorId: id });
});
settingsDialog.querySelectorAll<HTMLButtonElement>('[data-theme]').forEach((button) => {
  button.addEventListener('click', () => {
    void window.presenter
      .setSettings({ theme: button.dataset.theme as ThemeSetting })
      .then(fillSettings);
  });
});
settingsDialog.querySelectorAll('[data-close]').forEach((button) => {
  button.addEventListener('click', () => (settingsDialog.hidden = true));
});

// ---- Wiring ----

paintIcons();
keepFocusOffButtons();

byId('drop').addEventListener('click', () => void pickFile());
byId('open').addEventListener('click', () => void pickFile());
byId('present').addEventListener('click', () => present('presenter'));
byId('present-presenter').addEventListener('click', () => present('presenter'));
byId('present-mirror').addEventListener('click', () => present('mirror'));
byId('prev').addEventListener('click', () => void show(current - 1));
byId('next').addEventListener('click', () => void show(current + 1));
byId('settings-open').addEventListener('click', () => void openSettings());
byId('password-cancel').addEventListener('click', () => cancelPassword?.());

// The version comes from the main process; the link opens in the external browser.
void window.presenter.getAppInfo().then((info) => (byId('version').textContent = info.version));
byId('repo').addEventListener('click', (event) => {
  event.preventDefault();
  window.presenter.openRepository();
});

document.addEventListener('dragover', (event) => {
  event.preventDefault();
  document.body.classList.add('dragging');
});
document.addEventListener('dragleave', (event) => {
  if (event.relatedTarget === null) document.body.classList.remove('dragging');
});
document.addEventListener('drop', (event) => {
  event.preventDefault();
  document.body.classList.remove('dragging');
  const dropped = event.dataTransfer?.files[0];
  if (dropped) void openDropped(dropped);
});

window.addEventListener('resize', () => void show(current));
window.presenter.onPresentationEnded((page) => void show(page));

// With 2+ displays both ways of presenting are offered; updated when a display is plugged/unplugged.
const showDisplays = (list: DisplayInfo[]): void => {
  displays = list;
  document.body.classList.toggle('multi', list.length >= 2);
  if (!settingsDialog.hidden) void window.presenter.getSettings().then(fillSettings);
};
void window.presenter.getDisplays().then(showDisplays);
window.presenter.onDisplaysChanged(showDisplays);

onKeyAction(
  (action) => {
    if (!passwordDialog.hidden) {
      if (action === 'exit') cancelPassword?.();
      return;
    }
    if (!settingsDialog.hidden) {
      if (action === 'exit') settingsDialog.hidden = true;
      return;
    }
    if (!doc) return;
    if (action === 'next') void show(current + 1);
    else if (action === 'prev') void show(current - 1);
    else if (action === 'first') void show(1);
    else if (action === 'last') void show(doc.numPages);
  },
  { buttonsKeepKeys: true },
);
