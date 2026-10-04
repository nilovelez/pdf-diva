import { onKeyAction } from '../shared/keys';
import { createPageRenderer } from '../shared/pageview';
import { connectToPresentation } from '../shared/session';

const stage = document.getElementById('stage') as HTMLElement;
const canvas = document.getElementById('canvas') as HTMLCanvasElement;
const pageLabel = document.getElementById('page') as HTMLElement;
const blankTag = document.getElementById('blank') as HTMLElement;
const draw = createPageRenderer(canvas, stage);

onKeyAction((type) => window.presenter.sendAction({ type }));

connectToPresentation((doc, state) => {
  pageLabel.textContent = `Página ${state.page} de ${state.total}`;
  blankTag.hidden = !state.blank;
  void draw(doc, state.page);
}).catch(() => {
  pageLabel.textContent = 'No se ha podido cargar la presentación.';
});
