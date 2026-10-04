import type { PdfFile } from '../../types/ipc';
import { onKeyAction } from '../shared/keys';
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
const status = byId('status');
const stage = byId('stage');
const notice = byId('notice');
const canvas = byId<HTMLCanvasElement>('canvas');

const draw = createPageRenderer(canvas, stage);
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
  status.textContent = file.path;
  welcome.hidden = true;
  reader.hidden = false;
  thumbnails.load(next);
  await show(1);
  // Se destruye al final: las miniaturas y la página anteriores ya no lo usan.
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

welcome.addEventListener('click', () => void pickFile());
byId('open').addEventListener('click', () => void pickFile());
byId('present').addEventListener('click', () => {
  if (doc) void window.presenter.startPresentation(doc.numPages, current);
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

onKeyAction((action) => {
  if (!doc) return;
  if (action === 'next') void show(current + 1);
  else if (action === 'prev') void show(current - 1);
  else if (action === 'first') void show(1);
  else if (action === 'last') void show(doc.numPages);
});
