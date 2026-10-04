import type { RenderTask } from 'pdfjs-dist';
import { renderPage, type Box, type PDFDocumentProxy } from './pdf';

/** Tamaño disponible dentro de `el`, sin su relleno (padding). */
export function contentBox(el: HTMLElement): Box {
  const style = getComputedStyle(el);
  return {
    width: el.clientWidth - parseFloat(style.paddingLeft) - parseFloat(style.paddingRight),
    height: el.clientHeight - parseFloat(style.paddingTop) - parseFloat(style.paddingBottom),
  };
}

interface Prerendered {
  canvas: HTMLCanvasElement;
  box: Box;
}

const isCancelled = (err: unknown): boolean =>
  err instanceof Error && err.name === 'RenderingCancelledException';

const sameBox = (a: Box, b: Box): boolean => a.width === b.width && a.height === b.height;

/**
 * Devuelve una función que dibuja una página en `canvas` ajustada a `container`.
 * Los dibujos se encadenan de uno en uno (PDF.js no admite dos sobre el mismo canvas)
 * y uno nuevo cancela el anterior, así que al pasar páginas rápido solo se acaba la última.
 * Tras dibujar, pre-renderiza la página siguiente fuera de pantalla para que el cambio
 * sea instantáneo.
 */
export function createPageRenderer(
  canvas: HTMLCanvasElement,
  container: HTMLElement,
  options: { prefetch?: boolean } = {},
): (doc: PDFDocumentProxy, page: number) => Promise<void> {
  const prefetch = options.prefetch ?? true;
  let latest = 0;
  let task: RenderTask | null = null;
  let chain: Promise<void> = Promise.resolve();
  let cachedDoc: PDFDocumentProxy | null = null;
  const prerendered = new Map<number, Prerendered>();

  /** Devuelve false si el dibujo se canceló o ya hay uno más reciente. */
  async function renderTo(
    target: HTMLCanvasElement,
    doc: PDFDocumentProxy,
    page: number,
    box: Box,
    mine: number,
  ): Promise<boolean> {
    try {
      const started = await renderPage(doc, page, target, box);
      task = started;
      if (mine !== latest) started.cancel();
      await started.promise;
      return mine === latest;
    } catch (err) {
      if (isCancelled(err)) return false;
      throw err;
    }
  }

  function copyToVisible(from: HTMLCanvasElement): void {
    canvas.width = from.width;
    canvas.height = from.height;
    canvas.style.width = from.style.width;
    canvas.style.height = from.style.height;
    canvas.getContext('2d')?.drawImage(from, 0, 0);
  }

  async function job(doc: PDFDocumentProxy, page: number, mine: number): Promise<void> {
    if (mine !== latest) return;
    const box = contentBox(container);
    if (box.width <= 0 || box.height <= 0) return;
    if (cachedDoc !== doc) {
      prerendered.clear();
      cachedDoc = doc;
    }

    const hit = prerendered.get(page);
    if (hit && sameBox(hit.box, box)) copyToVisible(hit.canvas);
    else if (!(await renderTo(canvas, doc, page, box, mine))) return;

    const next = page + 1;
    for (const key of [...prerendered.keys()]) if (key !== next) prerendered.delete(key);
    if (!prefetch || next > doc.numPages || mine !== latest) return;
    const ready = prerendered.get(next);
    if (ready && sameBox(ready.box, box)) return;
    const off = document.createElement('canvas');
    if (await renderTo(off, doc, next, box, mine)) prerendered.set(next, { canvas: off, box });
  }

  return (doc, page) => {
    const mine = ++latest;
    task?.cancel();
    const result = chain.then(() => job(doc, page, mine));
    chain = result.catch(() => undefined);
    return result;
  };
}
