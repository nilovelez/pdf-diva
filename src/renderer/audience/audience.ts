import { onKeyAction } from '../shared/keys';
import { createPageRenderer } from '../shared/pageview';
import { connectToPresentation } from '../shared/session';

const stage = document.getElementById('stage') as HTMLElement;
const canvas = document.getElementById('canvas') as HTMLCanvasElement;
const draw = createPageRenderer(canvas, stage);

onKeyAction((type) => window.presenter.sendAction({ type }));

connectToPresentation((doc, state) => {
  // La página se sigue dibujando en negro para que al reanudar el cambio sea instantáneo.
  canvas.classList.toggle('blank', state.blank);
  void draw(doc, state.page);
}).catch(() => {
  document.body.textContent = 'No se ha podido cargar la presentación.';
});
