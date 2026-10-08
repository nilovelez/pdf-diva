import { type BrowserWindow, type Display, type WebContents } from 'electron';
import {
  IPC,
  type PdfFile,
  type PresentAction,
  type PresentationSession,
  type PresentationState,
  type TimerState,
} from '../types/ipc';
import { displayRoles, sortedDisplays } from './displays';
import { t } from './settings';
import { createWindow, isFullScreen, isMac, setFullScreen } from './windows';

interface Presentation {
  pdf: PdfFile;
  /** Kept in memory only; sent to the windows so they can open a protected PDF. */
  password: string | undefined;
  state: PresentationState;
  launcher: BrowserWindow;
  /** Speaker view and audience windows by the id of the display they are on. */
  speakers: Map<number, BrowserWindow>;
  audiences: Map<number, BrowserWindow>;
  /** Windows closed on purpose, which must not end the presentation. */
  quiet: Set<BrowserWindow>;
}

let current: Presentation | null = null;
let relayoutTimer: NodeJS.Timeout | undefined;

const ACTIONS = new Set([
  'next',
  'prev',
  'first',
  'last',
  'toggleBlack',
  'toggleTimer',
  'resetTimer',
  'exit',
  'goto',
]);

export function isPresentAction(value: unknown): value is PresentAction {
  if (typeof value !== 'object' || value === null) return false;
  const { type, page } = value as { type?: unknown; page?: unknown };
  if (typeof type !== 'string' || !ACTIONS.has(type)) return false;
  return type !== 'goto' || (typeof page === 'number' && Number.isFinite(page));
}

function clamp(page: number, total: number): number {
  return Math.min(Math.max(Math.trunc(page), 1), total);
}

const startTimer = (): TimerState => ({ running: true, elapsedMs: 0, since: Date.now() });

function toggleTimer(timer: TimerState): TimerState {
  const now = Date.now();
  return timer.running
    ? { running: false, elapsedMs: timer.elapsedMs + now - timer.since, since: now }
    : { running: true, elapsedMs: timer.elapsedMs, since: now };
}

function reduce(state: PresentationState, action: PresentAction): PresentationState {
  switch (action.type) {
    case 'exit':
      return state;
    case 'next':
      return { ...state, page: clamp(state.page + 1, state.total) };
    case 'prev':
      return { ...state, page: clamp(state.page - 1, state.total) };
    case 'first':
      return { ...state, page: 1 };
    case 'last':
      return { ...state, page: state.total };
    case 'goto':
      return { ...state, page: clamp(action.page, state.total) };
    case 'toggleBlack':
      return { ...state, blank: !state.blank };
    case 'toggleTimer':
      return { ...state, timer: toggleTimer(state.timer) };
    case 'resetTimer':
      return { ...state, timer: startTimer() };
  }
}

function windows(p: Presentation): BrowserWindow[] {
  return [...p.speakers.values(), ...p.audiences.values()].filter((w) => !w.isDestroyed());
}

function broadcast(p: Presentation): void {
  for (const w of windows(p)) w.webContents.send(IPC.state, p.state);
}

/** Only the presentation windows may read or control the presentation. */
export function isPresentationSender(sender: WebContents): boolean {
  return current !== null && windows(current).some((w) => w.webContents === sender);
}

function closeQuietly(p: Presentation, win: BrowserWindow): void {
  p.quiet.add(win);
  if (!win.isDestroyed()) win.close();
}

function sameBounds(a: Electron.Rectangle, b: Electron.Rectangle): boolean {
  return a.x === b.x && a.y === b.y && a.width === b.width && a.height === b.height;
}

// ---- Windows ----

/**
 * The reader is hidden while presenting (out of Alt+Tab and the taskbar), so the only windows are
 * the presentation's; endPresentation() shows it again as it was. It is hidden once the first
 * presentation window is on screen, so there is never a moment with no window at all.
 */
function hideLauncherWhenShown(p: Presentation, win: BrowserWindow): void {
  win.once('show', () => {
    if (current === p && !p.launcher.isDestroyed()) p.launcher.hide();
  });
}

/**
 * Speaker views that have painted their page. Until then they are not placed or shown
 * (setFullScreen() would show them too), so no blank window flashes; the layout runs again on
 * 'ready-to-show'.
 */
const readyWindows = new WeakSet<BrowserWindow>();

/** Both kinds of window are frameless and full screen: while presenting there is nothing else. */
function createPresentationWindow(
  p: Presentation,
  kind: 'audience' | 'presenter',
  display: Display,
): BrowserWindow {
  const win = createWindow(kind, {
    ...display.bounds,
    frame: false,
    show: false,
    title: t(kind === 'audience' ? 'audience.windowTitle' : 'presenter.windowTitle'),
    // On macOS the window is created normal and goes full screen when shown (see setFullScreen).
    ...(kind === 'audience' ? { fullscreen: !isMac, backgroundColor: '#000000' } : {}),
  });
  if (kind === 'audience') {
    win.once('ready-to-show', () => (isMac ? placeFullScreen(win, display) : win.show()));
  } else {
    win.once('ready-to-show', () => {
      readyWindows.add(win);
      if (current === p) applyLayout(p);
    });
  }
  hideLauncherWhenShown(p, win);
  win.on('closed', () => {
    if (!p.quiet.has(win)) endPresentation();
  });
  return win;
}

function placeFullScreen(win: BrowserWindow, display: Display): void {
  if (win.isDestroyed()) return;
  if (isFullScreen(win) && sameBounds(win.getBounds(), display.bounds)) return;
  if (isFullScreen(win)) setFullScreen(win, false);
  win.setBounds(display.bounds);
  setFullScreen(win, true);
  win.show();
}

function placeSpeaker(win: BrowserWindow, display: Display): void {
  if (!win.isDestroyed() && readyWindows.has(win)) placeFullScreen(win, display);
}

/**
 * Makes `wanted` exactly the set of displays with a window in `byDisplay`, reusing windows where
 * possible (a reused speaker view keeps its rendered pages).
 */
function reconcile(
  p: Presentation,
  byDisplay: Map<number, BrowserWindow>,
  wanted: Display[],
  kind: 'audience' | 'presenter',
): void {
  const place = kind === 'audience' ? placeFullScreen : placeSpeaker;
  const wantedIds = new Set(wanted.map((d) => d.id));
  const spare: BrowserWindow[] = [];
  for (const [id, win] of byDisplay) {
    if (wantedIds.has(id)) continue;
    byDisplay.delete(id);
    spare.push(win);
  }
  for (const display of wanted) {
    const existing = byDisplay.get(display.id);
    if (existing) {
      place(existing, display);
      continue;
    }
    const reused = spare.pop();
    if (reused) place(reused, display);
    byDisplay.set(display.id, reused ?? createPresentationWindow(p, kind, display));
  }
  for (const win of spare) closeQuietly(p, win);
}

/** Puts every window where it belongs for the displays connected right now and their roles. */
function applyLayout(p: Presentation): void {
  const displays = sortedDisplays();
  const roles = displayRoles(displays);
  p.state = { ...p.state, displayCount: displays.length };
  reconcile(p, p.speakers, displays.filter((_d, i) => roles[i] === 'speaker'), 'presenter');
  reconcile(p, p.audiences, displays.filter((_d, i) => roles[i] === 'audience'), 'audience');
  broadcast(p);
  // Keys must reach the presentation: focus a speaker view, else an audience window, unless one
  // of them already has the focus.
  const visible = windows(p).filter((w) => w.isVisible());
  if (!visible.some((w) => w.isFocused())) {
    const speaker = [...p.speakers.values()].find((w) => !w.isDestroyed() && w.isVisible());
    (speaker ?? visible[0])?.focus();
  }
}

/** Call when displays are added, removed or changed; waits a moment because Windows fires several events. */
export function onDisplaysChanged(): void {
  clearTimeout(relayoutTimer);
  relayoutTimer = setTimeout(() => {
    if (current) applyLayout(current);
  }, 300);
}

/** Call when the display roles change: the windows move right away. */
export function onRolesChanged(): void {
  if (current) applyLayout(current);
}

// ---- Public API ----

export function startPresentation(
  launcher: BrowserWindow,
  pdf: PdfFile,
  total: number,
  page: number,
  password: string | undefined,
): void {
  if (current) {
    windows(current)[0]?.focus();
    return;
  }
  const presentation: Presentation = {
    pdf,
    password,
    state: {
      page: clamp(page, total),
      total,
      blank: false,
      displayCount: sortedDisplays().length,
      timer: startTimer(),
    },
    launcher,
    speakers: new Map(),
    audiences: new Map(),
    quiet: new Set(),
  };
  current = presentation;
  applyLayout(presentation);
}

export function getSession(): PresentationSession | null {
  if (!current) return null;
  return {
    name: current.pdf.name,
    data: current.pdf.data,
    password: current.password,
    state: current.state,
  };
}

export function handleAction(action: PresentAction): void {
  if (!current) return;
  if (action.type === 'exit') {
    endPresentation();
    return;
  }
  current.state = reduce(current.state, action);
  broadcast(current);
}

export function endPresentation(): void {
  const ended = current;
  if (!ended) return;
  current = null;
  clearTimeout(relayoutTimer);
  for (const w of windows(ended)) {
    ended.quiet.add(w);
    w.close();
  }
  if (!ended.launcher.isDestroyed()) {
    ended.launcher.webContents.send(IPC.presentationEnded, ended.state.page);
    ended.launcher.show();
    ended.launcher.focus();
  }
}
