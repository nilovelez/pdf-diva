import * as pdfjs from 'pdfjs-dist';
import type { PDFDocumentProxy, RenderTask } from 'pdfjs-dist';

// Relative to each renderer (dist/renderer/<window>/); esbuild.mjs copies the worker next to it.
pdfjs.GlobalWorkerOptions.workerSrc = new URL(
  '../shared/pdf.worker.min.mjs',
  location.href,
).href;

// Data PDF.js loads only when a PDF needs it; without it, JBIG2 and JPEG 2000 images
// (common in scans) and text using built-in CMaps (CJK) come out blank.
const assets = (dir: string): string => new URL(`../shared/pdfjs/${dir}/`, location.href).href;
const ASSET_URLS = {
  wasmUrl: assets('wasm'),
  cMapUrl: assets('cmaps'),
  standardFontDataUrl: assets('standard_fonts'),
  iccUrl: assets('iccs'),
};

export type { PDFDocumentProxy };

export async function loadPdf(data: Uint8Array, password?: string): Promise<PDFDocumentProxy> {
  // PDF.js takes ownership of the buffer it is given, so every attempt gets its own copy.
  return pdfjs.getDocument({ data: data.slice(), password, ...ASSET_URLS }).promise;
}

/** The PDF is encrypted: a password is needed (or the one given was wrong). */
export function isPasswordError(err: unknown): boolean {
  return err instanceof Error && err.name === 'PasswordException';
}

export function isWrongPassword(err: unknown): boolean {
  const code = (err as { code?: number } | null)?.code;
  return isPasswordError(err) && code === pdfjs.PasswordResponses.INCORRECT_PASSWORD;
}

export function describeLoadError(err: unknown): string {
  const name = err instanceof Error ? err.name : '';
  if (name === 'InvalidPDFException') return 'El archivo está dañado o no es un PDF válido.';
  return 'No se ha podido leer el PDF.';
}

export interface Box {
  width: number;
  height: number;
}

/**
 * Draws a page fitted to `box` (keeping its proportions) at the real resolution of the
 * screen. The scale is computed per page, in case the PDF mixes page sizes.
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
