import type { PresentationState } from '../../types/ipc';
import { loadPdf, type PDFDocumentProxy } from './pdf';

/**
 * Se une a la presentación en curso: descarga el PDF una vez y llama a `render`
 * con cada cambio de estado (y al cambiar el tamaño de la ventana).
 */
export async function connectToPresentation(
  render: (doc: PDFDocumentProxy, state: PresentationState) => void,
): Promise<void> {
  let doc: PDFDocumentProxy | null = null;
  let state: PresentationState | null = null;
  const update = (): void => {
    if (doc && state) render(doc, state);
  };

  // Suscribirse antes de pedir la sesión: no se pierde ningún cambio mientras se carga el PDF.
  window.presenter.onState((next) => {
    state = next;
    update();
  });
  window.addEventListener('resize', update);

  const session = await window.presenter.getSession();
  if (!session) throw new Error('No hay presentación en curso');
  state = session.state;
  doc = await loadPdf(session.data);
  update();
}
