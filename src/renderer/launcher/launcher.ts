import type { PresenterApi } from '../../types/ipc';
import { onKeyAction } from '../shared/keys';
import { describeLoadError, loadPdf, renderPage, type PDFDocumentProxy } from '../shared/pdf';
import type { RenderTask } from 'pdfjs-dist';

declare global {
  interface Window {
    presenter: PresenterApi;
  }
}

function byId<T extends HTMLElement>(id: string): T {
  const el = document.getElementById(id);
  if (!el) throw new Error(`Falta #${id}`);
  return el as T;
}

const openButton = byId<HTMLButtonElement>('open');
const title = byId('title');
const pageLabel = byId('page');
const stage = byId('stage');
const message = byId('message');
const canvas = byId<HTMLCanvasElement>('canvas');

let doc: PDFDocumentProxy | null = null;
let current = 1;
let task: RenderTask | null = null;

function showMessage(text: string): void {
  message.textContent = text;
  message.hidden = false;
  canvas.hidden = true;
}

async function show(page: number): Promise<void> {
  if (!doc) return;
  current = Math.min(Math.max(page, 1), doc.numPages);
  pageLabel.textContent = `Página ${current} de ${doc.numPages}`;
  task?.cancel();
  try {
    task = await renderPage(doc, current, canvas, {
      width: stage.clientWidth,
      height: stage.clientHeight,
    });
    message.hidden = true;
    canvas.hidden = false;
    await task.promise;
  } catch (err) {
    // Cancelar un render en curso al cambiar de página es normal, no un error.
    if (err instanceof Error && err.name === 'RenderingCancelledException') return;
    showMessage('No se ha podido dibujar la página.');
  }
}

async function open(): Promise<void> {
  const file = await window.presenter.openPdf();
  if (!file) return;
  try {
    const next = await loadPdf(file.data);
    await doc?.loadingTask.destroy();
    doc = next;
    title.textContent = file.name;
    await show(1);
  } catch (err) {
    showMessage(describeLoadError(err));
  }
}

openButton.addEventListener('click', () => void open());
window.addEventListener('resize', () => void show(current));

onKeyAction((action) => {
  if (!doc) return;
  if (action === 'next') void show(current + 1);
  else if (action === 'prev') void show(current - 1);
  else if (action === 'first') void show(1);
  else if (action === 'last') void show(doc.numPages);
});
