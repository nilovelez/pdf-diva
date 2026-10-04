import type { RenderTask } from 'pdfjs-dist';
import { renderPage, type PDFDocumentProxy } from './pdf';

/**
 * Devuelve una función que dibuja una página en `canvas` ajustada a `container`.
 * Los dibujos se encadenan de uno en uno (PDF.js no admite dos sobre el mismo canvas)
 * y uno nuevo cancela el anterior, así que al pasar páginas rápido solo se acaba la última.
 */
export function createPageRenderer(
  canvas: HTMLCanvasElement,
  container: HTMLElement,
): (doc: PDFDocumentProxy, page: number) => Promise<void> {
  let latest = 0;
  let task: RenderTask | null = null;
  let chain: Promise<void> = Promise.resolve();

  return (doc, page) => {
    const mine = ++latest;
    task?.cancel();
    const result = chain.then(async () => {
      if (mine !== latest) return;
      try {
        const started = await renderPage(doc, page, canvas, {
          width: container.clientWidth,
          height: container.clientHeight,
        });
        task = started;
        if (mine !== latest) started.cancel();
        await started.promise;
      } catch (err) {
        if (!(err instanceof Error && err.name === 'RenderingCancelledException')) throw err;
      }
    });
    chain = result.catch(() => undefined);
    return result;
  };
}
