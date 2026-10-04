import { paintIcons, setIcon } from '../shared/icons';
import { keepFocusOffButtons, onKeyAction } from '../shared/keys';
import { createPageRenderer } from '../shared/pageview';
import { connectToPresentation } from '../shared/session';

function byId<T extends HTMLElement>(id: string): T {
  const el = document.getElementById(id);
  if (!el) throw new Error(`Falta #${id}`);
  return el as T;
}

const top = byId('top');
const clock = byId('clock');
const pauseIcon = byId('pause-icon');
const pauseLabel = byId('pause-label');
const pausedTag = byId('paused');
const current = byId('current');
const badge = byId('badge');
const count = byId('count');
const next = byId('next');
const nextCanvas = byId<HTMLCanvasElement>('next-canvas');
const end = byId('end');
const blackButton = byId('black');

const drawCurrent = createPageRenderer(byId<HTMLCanvasElement>('canvas'), current);
// The preview does not prefetch: the next page is already rendered in full by drawCurrent.
const drawNext = createPageRenderer(nextCanvas, next, { prefetch: false });

const logError = (err: unknown): void => console.error(err);

paintIcons();
keepFocusOffButtons();
onKeyAction((type) => window.presenter.sendAction({ type }));

byId('prev').addEventListener('click', () => window.presenter.sendAction({ type: 'prev' }));
byId('forward').addEventListener('click', () => window.presenter.sendAction({ type: 'next' }));
blackButton.addEventListener('click', () => window.presenter.sendAction({ type: 'toggleBlack' }));
byId('exit').addEventListener('click', () => window.presenter.sendAction({ type: 'exit' }));
const swapButton = byId('swap');
swapButton.addEventListener('click', () => window.presenter.sendAction({ type: 'swapScreens' }));
// On the last page the preview shows "Fin de la presentación" and clicking it does nothing.
next.addEventListener('click', () => {
  if (!next.classList.contains('is-end')) window.presenter.sendAction({ type: 'next' });
});

// Timer: starts when the window opens; paused time does not count.
let elapsedMs = 0;
let lastTick = performance.now();
let running = true;
const pad = (n: number): string => String(n).padStart(2, '0');

function showPaused(): void {
  top.classList.toggle('paused', !running);
  pausedTag.hidden = running;
  pauseLabel.textContent = running ? 'Pausar' : 'Reanudar';
  setIcon(pauseIcon, running ? 'pause' : 'play');
}

function tick(): void {
  const now = performance.now();
  if (running) elapsedMs += now - lastTick;
  lastTick = now;
  const s = Math.floor(elapsedMs / 1000);
  clock.textContent = `${pad(Math.floor(s / 3600))}:${pad(Math.floor(s / 60) % 60)}:${pad(s % 60)}`;
}

byId('pause').addEventListener('click', () => {
  tick();
  running = !running;
  showPaused();
});
byId('reset').addEventListener('click', () => {
  elapsedMs = 0;
  running = true;
  lastTick = performance.now();
  showPaused();
  tick();
});
window.setInterval(tick, 250);

connectToPresentation((doc, state) => {
  count.innerHTML = `<b>${state.page}</b> de ${state.total}`;
  current.classList.toggle('black', state.blank);
  badge.hidden = !state.blank;
  blackButton.setAttribute('aria-pressed', String(state.blank));
  // There is nothing to swap with a single display.
  swapButton.hidden = state.displayCount < 2;
  drawCurrent(doc, state.page).catch(logError);

  const hasNext = state.page < state.total;
  next.classList.toggle('is-end', !hasNext);
  nextCanvas.hidden = !hasNext;
  end.hidden = hasNext;
  if (hasNext) drawNext(doc, state.page + 1).catch(logError);
}).catch(() => {
  count.textContent = 'No se ha podido cargar la presentación.';
});
