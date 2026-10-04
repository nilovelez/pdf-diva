import * as pdfjs from 'pdfjs-dist';
import type { PDFDocumentProxy, RenderTask } from 'pdfjs-dist';

// Ruta relativa a cada renderer (dist/renderer/<ventana>/); esbuild.mjs copia el worker aquí.
pdfjs.GlobalWorkerOptions.workerSrc = new URL(
  '../shared/pdf.worker.min.mjs',
  location.href,
).href;

export type { PDFDocumentProxy };

export async function loadPdf(data: Uint8Array): Promise<PDFDocumentProxy> {
  return pdfjs.getDocument({ data }).promise;
}

export function describeLoadError(err: unknown): string {
  const name = err instanceof Error ? err.name : '';
  if (name === 'PasswordException') return 'El PDF está protegido con contraseña y no se puede abrir.';
  if (name === 'InvalidPDFException') return 'El archivo está dañado o no es un PDF válido.';
  return 'No se ha podido leer el PDF.';
}

export interface Box {
  width: number;
  height: number;
}

/**
 * Dibuja una página ajustada a `box` (mantiene la proporción) con la resolución real
 * de la pantalla. La escala se calcula por página, por si el PDF mezcla tamaños.
 */
export async function renderPage(
  doc: PDFDocumentProxy,
  pageNumber: number,
  canvas: HTMLCanvasElement,
  box: Box,
): Promise<RenderTask> {
  const page = await doc.getPage(pageNumber);
  const base = page.getViewport({ scale: 1 });
  const fit = Math.min(box.width / base.width, box.height / base.height);
  const ratio = window.devicePixelRatio || 1;
  const viewport = page.getViewport({ scale: fit * ratio });
  canvas.width = Math.floor(viewport.width);
  canvas.height = Math.floor(viewport.height);
  canvas.style.width = `${canvas.width / ratio}px`;
  canvas.style.height = `${canvas.height / ratio}px`;
  return page.render({ canvas, viewport });
}
