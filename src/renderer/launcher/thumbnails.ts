import { renderPage, type PDFDocumentProxy } from '../shared/pdf';

export interface Thumbnails {
  load(doc: PDFDocumentProxy): void;
  /** Resalta la miniatura de `page` y la mantiene visible. */
  select(page: number): void;
}

// Miniaturas de 144 px de ancho y, como máximo, 81 de alto (16:9), como en la maqueta.
const BOX = { width: 144, height: 81 };

/** Barra de miniaturas: cada una se dibuja solo cuando entra en pantalla. */
export function createThumbnails(
  container: HTMLElement,
  onSelect: (page: number) => void,
): Thumbnails {
  let observer: IntersectionObserver | null = null;
  let doc: PDFDocumentProxy | null = null;
  let items: HTMLElement[] = [];
  let selected: HTMLElement | null = null;

  async function paint(item: HTMLElement): Promise<void> {
    const canvas = item.querySelector('canvas');
    if (!doc || !canvas) return;
    try {
      await renderPage(doc, Number(item.dataset.page), canvas, BOX);
      item.classList.add('ready');
    } catch {
      // El documento se cerró mientras se dibujaba: no hay nada que mostrar.
    }
  }

  function createItem(page: number): HTMLElement {
    const item = document.createElement('div');
    item.className = 'thumb';
    item.dataset.page = String(page);
    const label = document.createElement('small');
    label.textContent = String(page);
    item.append(document.createElement('canvas'), label);
    item.addEventListener('click', () => onSelect(page));
    return item;
  }

  return {
    load(next) {
      observer?.disconnect();
      container.replaceChildren();
      selected = null;
      doc = next;
      const io = new IntersectionObserver(
        (entries) => {
          for (const entry of entries) {
            if (!entry.isIntersecting) continue;
            io.unobserve(entry.target);
            void paint(entry.target as HTMLElement);
          }
        },
        { root: container, rootMargin: '300px' },
      );
      observer = io;
      items = Array.from({ length: next.numPages }, (_, i) => createItem(i + 1));
      container.append(...items);
      items.forEach((item) => io.observe(item));
    },
    select(page) {
      selected?.classList.remove('current');
      selected = items[page - 1] ?? null;
      selected?.classList.add('current');
      selected?.scrollIntoView({ block: 'nearest' });
    },
  };
}
