import type { PresentationState } from '../../types/ipc';
import { loadPdf, type PDFDocumentProxy } from './pdf';

/**
 * Joins the running presentation: downloads the PDF once and calls `render`
 * on every state change (and when the window is resized).
 */
export async function connectToPresentation(
  render: (doc: PDFDocumentProxy, state: PresentationState) => void,
): Promise<void> {
  let doc: PDFDocumentProxy | null = null;
  let state: PresentationState | null = null;
  const update = (): void => {
    if (doc && state) render(doc, state);
  };

  // Subscribe before asking for the session so no change is lost while the PDF loads.
  window.presenter.onState((next) => {
    state = next;
    update();
  });
  window.addEventListener('resize', update);

  const session = await window.presenter.getSession();
  if (!session) throw new Error('No hay presentación en curso');
  state = session.state;
  doc = await loadPdf(session.data, session.password);
  update();
}
