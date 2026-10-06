import { LANGUAGES, languageName } from '../../i18n/i18n';
import type {
  DisplayInfo,
  LanguageSetting,
  PdfFile,
  PresentationMode,
  Settings,
  ThemeSetting,
} from '../../types/ipc';
import { setLanguage, t, translatePage } from '../shared/i18n';
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
  if (!el) throw new Error(`Missing #${id}`);
  return el as T;
}

// Before anything else, so the page is never painted untranslated.
translatePage();

const welcome = byId('welcome');
const reader = byId('reader');
const pageLabel = byId('page');
const stage = byId('stage');
const notice = byId('notice');
const settingsDialog = byId('settings');
const speakerSelect = byId<HTMLSelectElement>('speaker-monitor');
const languageSelect = byId<HTMLSelectElement>('language');
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

function showPageLabel(): void {
  if (doc) pageLabel.textContent = t('reader.pageOf', { page: current, total: doc.numPages });
}

async function show(page: number): Promise<void> {
  if (!doc) return;
  current = Math.min(Math.max(page, 1), doc.numPages);
  showPageLabel();
  thumbnails.select(current);
  try {
    await draw(doc, current);
  } catch {
    showNotice(t('reader.drawError'));
  }
}

// ---- Password dialog ----

let cancelPassword: (() => void) | null = null;

/** Asks for the password of `file` until it works; resolves to null if the user cancels. */
function askPassword(file: PdfFile): Promise<{ doc: PDFDocumentProxy; password: string } | null> {
  byId('password-text').textContent = t('password.prompt', { name: file.name });
  passwordInput.value = '';
  passwordError.hidden = true;
  passwordDialog.hidden = false;
  passwordInput.focus();

  return new Promise((resolve) => {
    let settled = false;
    const finish = (value: { doc: PDFDocumentProxy; password: string } | null): void => {
      // A check still running after a cancel must not close the dialog of the next file.
      if (settled) {
        if (value) void value.doc.loadingTask.destroy();
        return;
      }
      settled = true;
      passwordDialog.hidden = true;
      // Do not leave the typed password sitting in the field.
      passwordInput.value = '';
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

/** Counts calls to openFile: only the newest one may finish, older ones are dropped. */
let openSeq = 0;

async function openFile(file: PdfFile): Promise<void> {
  const seq = ++openSeq;
  // A new file replaces one still waiting for its password.
  cancelPassword?.();
  let next: PDFDocumentProxy;
  let password: string | undefined;
  try {
    next = await loadPdf(file.data);
  } catch (err) {
    if (seq !== openSeq) return;
    if (!isPasswordError(err)) {
      showNotice(describeLoadError(err));
      return;
    }
    const unlocked = await askPassword(file);
    if (!unlocked) return;
    next = unlocked.doc;
    password = unlocked.password;
  }
  if (seq !== openSeq) {
    void next.loadingTask.destroy();
    return;
  }
  const previous = doc;
  doc = next;
  docPassword = password;
  window.presenter.pdfOpened(file.id);
  notice.hidden = true;
  // The window title carries the full path of the open PDF (there is no status bar).
  document.title = `PDF Diva - ${file.path}`;
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
    showNotice(t('open.onlyPdf'));
    return;
  }
  try {
    await openFile(await window.presenter.readPdf(window.presenter.pathForFile(dropped)));
  } catch {
    showNotice(t('open.readError'));
  }
}

function present(mode: PresentationMode, page = current): void {
  if (doc) void window.presenter.startPresentation(doc.numPages, page, mode, docPassword);
}

// F5 presents from the first page and Shift+F5 from the current one, as in PowerPoint
// (many clickers have a "play" button that sends F5). It uses the default mode: speaker view
// plus audience, or the single-display presentation when there is only one display.
window.addEventListener('keydown', (event) => {
  if (event.key !== 'F5' || event.ctrlKey || event.altKey || event.metaKey) return;
  event.preventDefault();
  if (!doc || !passwordDialog.hidden || !settingsDialog.hidden) return;
  present('presenter', event.shiftKey ? current : 1);
});

// ---- Settings dialog ----

const monitorLabel = (d: DisplayInfo): string =>
  t(d.primary ? 'settings.speakerMonitor.optionMain' : 'settings.speakerMonitor.option', {
    index: d.index,
    width: d.width,
    height: d.height,
  });

function fillSettings(settings: Settings): void {
  speakerSelect.replaceChildren(
    new Option(t('settings.speakerMonitor.auto'), 'auto'),
    ...displays.map((d) => new Option(monitorLabel(d), String(d.id))),
  );
  speakerSelect.value = settings.speakerMonitorId === null ? 'auto' : String(settings.speakerMonitorId);
  settingsDialog.querySelectorAll<HTMLButtonElement>('[data-theme]').forEach((button) => {
    button.setAttribute('aria-pressed', String(button.dataset.theme === settings.theme));
  });
  // Each language is listed by its own name, so it can be found whatever the UI language is.
  languageSelect.replaceChildren(
    new Option(t('settings.language.system'), 'system'),
    ...LANGUAGES.map((language) => new Option(languageName(language), language)),
  );
  languageSelect.value = settings.language;
}

/** Retranslates this window after the language changed (the open PDF stays as it is). */
function applyLanguage(settings: Settings): void {
  setLanguage(settings.uiLanguage);
  showPageLabel();
  fillSettings(settings);
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
languageSelect.addEventListener('change', () => {
  void window.presenter
    .setSettings({ language: languageSelect.value as LanguageSetting })
    .then(applyLanguage);
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
byId('website').addEventListener('click', (event) => {
  event.preventDefault();
  window.presenter.openWebsite();
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
