import type { TimerState } from '../../types/ipc';
import { createDisplaysDialog } from '../shared/displays-dialog';
import { setRichText, t, translatePage } from '../shared/i18n';
import { paintIcons, setIcon } from '../shared/icons';
import { keepFocusOffButtons, onKeyAction } from '../shared/keys';
import { createPageRenderer } from '../shared/pageview';
import { connectToPresentation } from '../shared/session';

function byId<T extends HTMLElement>(id: string): T {
  const el = document.getElementById(id);
  if (!el) throw new Error(`Missing #${id}`);
  return el as T;
}

translatePage();

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

const displaysDialog = createDisplaysDialog();
const configureButton = byId('configure-displays');
configureButton.addEventListener('click', () => void displaysDialog.open());

// While "Configure displays" is open, keys belong to it: Esc closes it instead of ending the show.
onKeyAction((type) => {
  if (!displaysDialog.isOpen()) window.presenter.sendAction({ type });
  else if (type === 'exit') displaysDialog.close();
});

byId('prev').addEventListener('click', () => window.presenter.sendAction({ type: 'prev' }));
byId('forward').addEventListener('click', () => window.presenter.sendAction({ type: 'next' }));
blackButton.addEventListener('click', () => window.presenter.sendAction({ type: 'toggleBlack' }));
byId('exit').addEventListener('click', () => window.presenter.sendAction({ type: 'exit' }));
// On the last page the preview shows "End of presentation" and clicking it does nothing.
next.addEventListener('click', () => {
  if (!next.classList.contains('is-end')) window.presenter.sendAction({ type: 'next' });
});

// Timer: kept by the main process, so every speaker view shows the same time.
let timer: TimerState | null = null;
const pad = (n: number): string => String(n).padStart(2, '0');

function showTimer(next: TimerState): void {
  timer = next;
  top.classList.toggle('paused', !next.running);
  pausedTag.hidden = next.running;
  pauseLabel.textContent = t(next.running ? 'presenter.pause' : 'presenter.resume');
  setIcon(pauseIcon, next.running ? 'pause' : 'play');
  tick();
}

function tick(): void {
  if (!timer) return;
  const elapsedMs = timer.elapsedMs + (timer.running ? Date.now() - timer.since : 0);
  const s = Math.max(0, Math.floor(elapsedMs / 1000));
  clock.textContent = `${pad(Math.floor(s / 3600))}:${pad(Math.floor(s / 60) % 60)}:${pad(s % 60)}`;
}

byId('pause').addEventListener('click', () => window.presenter.sendAction({ type: 'toggleTimer' }));
byId('reset').addEventListener('click', () => window.presenter.sendAction({ type: 'resetTimer' }));
window.setInterval(tick, 250);

connectToPresentation((doc, state) => {
  setRichText(count, t('presenter.pageOf', { page: state.page, total: state.total }));
  current.classList.toggle('black', state.blank);
  badge.hidden = !state.blank;
  blackButton.setAttribute('aria-pressed', String(state.blank));
  // With a single display there is nothing to configure.
  configureButton.hidden = state.displayCount < 2;
  showTimer(state.timer);
  drawCurrent(doc, state.page).catch(logError);

  const hasNext = state.page < state.total;
  next.classList.toggle('is-end', !hasNext);
  nextCanvas.hidden = !hasNext;
  end.hidden = hasNext;
  if (hasNext) drawNext(doc, state.page + 1).catch(logError);
}).catch(() => {
  count.textContent = t('presentation.loadError');
});
