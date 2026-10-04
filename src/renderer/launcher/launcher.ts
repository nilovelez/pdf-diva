import type { PdfFile, PresentationMode } from '../../types/ipc';
import { paintIcons } from '../shared/icons';
import { keepFocusOffButtons, onKeyAction } from '../shared/keys';
import { createPageRenderer } from '../shared/pageview';
import { describeLoadError, loadPdf, type PDFDocumentProxy } from '../shared/pdf';
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

const draw = createPageRenderer(byId<HTMLCanvasElement>('canvas'), stage);
const thumbnails = createThumbnails(byId('thumbs'), (page) => void show(page));

let doc: PDFDocumentProxy | null = null;
let current = 1;
let noticeTimer: number | undefined;

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

async function openFile(file: PdfFile): Promise<void> {
  let next: PDFDocumentProxy;
  try {
    next = await loadPdf(file.data);
  } catch (err) {
    showNotice(describeLoadError(err));
    return;
  }
  const previous = doc;
  doc = next;
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
  if (doc) void window.presenter.startPresentation(doc.numPages, current, mode);
}

paintIcons();
keepFocusOffButtons();

byId('drop').addEventListener('click', () => void pickFile());
byId('open').addEventListener('click', () => void pickFile());
byId('present').addEventListener('click', () => present('presenter'));
byId('present-presenter').addEventListener('click', () => present('presenter'));
byId('present-mirror').addEventListener('click', () => present('mirror'));
byId('prev').addEventListener('click', () => void show(current - 1));
byId('next').addEventListener('click', () => void show(current + 1));

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
const showDisplays = (count: number): void => {
  document.body.classList.toggle('multi', count >= 2);
};
void window.presenter.getDisplayCount().then(showDisplays);
window.presenter.onDisplayCount(showDisplays);

onKeyAction(
  (action) => {
    if (!doc) return;
    if (action === 'next') void show(current + 1);
    else if (action === 'prev') void show(current - 1);
    else if (action === 'first') void show(1);
    else if (action === 'last') void show(doc.numPages);
  },
  { buttonsKeepKeys: true },
);
