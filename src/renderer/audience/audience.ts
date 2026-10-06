import { t, translatePage } from '../shared/i18n';
import { onKeyAction } from '../shared/keys';
import { createPageRenderer } from '../shared/pageview';
import { connectToPresentation } from '../shared/session';

translatePage();

const stage = document.getElementById('stage') as HTMLElement;
const canvas = document.getElementById('canvas') as HTMLCanvasElement;
const draw = createPageRenderer(canvas, stage);

onKeyAction((type) => window.presenter.sendAction({ type }));

connectToPresentation((doc, state) => {
  // The page is still drawn while blacked out, so going back to it is instant.
  canvas.classList.toggle('blank', state.blank);
  void draw(doc, state.page);
}).catch(() => {
  document.body.textContent = t('presentation.loadError');
});
