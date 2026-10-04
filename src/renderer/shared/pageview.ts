import type { RenderTask } from 'pdfjs-dist';
import { renderPage, type Box, type PDFDocumentProxy } from './pdf';

/** Space available inside `el`, without its padding. */
export function contentBox(el: HTMLElement): Box {
  const style = getComputedStyle(el);
  return {
    width: el.clientWidth - parseFloat(style.paddingLeft) - parseFloat(style.paddingRight),
    height: el.clientHeight - parseFloat(style.paddingTop) - parseFloat(style.paddingBottom),
  };
}

interface Rendered {
  canvas: HTMLCanvasElement;
  box: Box;
}

const isCancelled = (err: unknown): boolean =>
  err instanceof Error && err.name === 'RenderingCancelledException';

const sameBox = (a: Box, b: Box): boolean => a.width === b.width && a.height === b.height;

/** Frees a canvas's pixels right away instead of waiting for the garbage collector (4K is ~33 MB). */
function release(canvas: HTMLCanvasElement): void {
  canvas.width = 0;
  canvas.height = 0;
}

/**
 * Returns a function that draws a page in `canvas`, fitted to `container`.
 * Pages are drawn off screen and copied to `canvas` only when complete, so the visible page
 * is never blanked or half drawn. Draws run one at a time and a new one cancels the previous
 * one, so when paging fast only the last page is finished.
 * With `prefetch`, the next and previous pages are rendered ahead so moving either way is instant.
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
  const cache = new Map<number, Rendered>();

  function drop(page: number): void {
    const entry = cache.get(page);
    if (entry) release(entry.canvas);
    cache.delete(page);
  }

  /** Renders `page` off screen and caches it; resolves to false if cancelled or overtaken. */
  async function renderToCache(
    doc: PDFDocumentProxy,
    page: number,
    box: Box,
    mine: number,
  ): Promise<boolean> {
    const off = document.createElement('canvas');
    try {
      const started = await renderPage(doc, page, off, box);
      task = started;
      if (mine !== latest) started.cancel();
      await started.promise;
    } catch (err) {
      release(off);
      if (isCancelled(err)) return false;
      throw err;
    }
    drop(page);
    cache.set(page, { canvas: off, box });
    return mine === latest;
  }

  function show(from: HTMLCanvasElement): void {
    canvas.width = from.width;
    canvas.height = from.height;
    canvas.style.width = from.style.width;
    canvas.style.height = from.style.height;
    canvas.getContext('2d')?.drawImage(from, 0, 0);
  }

  const fresh = (page: number, box: Box): boolean => {
    const entry = cache.get(page);
    return entry !== undefined && sameBox(entry.box, box);
  };

  async function job(doc: PDFDocumentProxy, page: number, mine: number): Promise<void> {
    if (mine !== latest) return;
    const box = contentBox(container);
    if (box.width <= 0 || box.height <= 0) return;
    if (cachedDoc !== doc) {
      for (const key of [...cache.keys()]) drop(key);
      cachedDoc = doc;
    }

    if (!fresh(page, box) && !(await renderToCache(doc, page, box, mine))) return;
    show(cache.get(page)!.canvas);

    // Keep only this page and its neighbours, then render the neighbours ahead (next first).
    const neighbours = prefetch ? [page + 1, page - 1].filter((p) => p >= 1 && p <= doc.numPages) : [];
    for (const key of [...cache.keys()]) if (key !== page && !neighbours.includes(key)) drop(key);
    for (const neighbour of neighbours) {
      if (mine !== latest) return;
      if (!fresh(neighbour, box) && !(await renderToCache(doc, neighbour, box, mine))) return;
    }
  }

  return (doc, page) => {
    const mine = ++latest;
    task?.cancel();
    const result = chain.then(() => job(doc, page, mine));
    chain = result.catch(() => undefined);
    return result;
  };
}
