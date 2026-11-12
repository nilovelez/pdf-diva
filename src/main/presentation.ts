import { type BrowserWindow, type Display, type WebContents, screen } from 'electron';
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
    win.once('ready-to-show', () => {
      if (isMac) {
        placeFullScreen(win, display);
      } else {
        win.show();
        checkPlacement(win, display);
      }
    });
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
  checkPlacement(win, display);
}

const isLinux = process.platform === 'linux';
/** Delays before each check of where a window landed; one more placement after each miss. */
const PLACEMENT_CHECKS_MS = [500, 1000, 2000];
/** PDF_DIVA_DEBUG_DISPLAYS=1 logs every check, for testing on a new desktop. */
const debugDisplays = process.env.PDF_DIVA_DEBUG_DISPLAYS === '1';

/** Time for the compositor to take a window out of full screen before it is moved. */
const LEAVE_FULL_SCREEN_MS = 300;
/** The pending check of each window: a new placement replaces it. */
const placementTimers = new WeakMap<BrowserWindow, NodeJS.Timeout>();

/**
 * Whether a full-screen window is on `display`. On Wayland the window's origin is always 0,0, so
 * only its size tells: a window the size of another display is on that one; one the size of
 * `display` is taken as right, since with two displays of the same size there is no telling.
 */
function onDisplay(win: BrowserWindow, display: Display): boolean {
  if (!isFullScreen(win)) return false;
  const bounds = win.getBounds();
  if (bounds.width === display.bounds.width && bounds.height === display.bounds.height) return true;
  return screen.getDisplayMatching(bounds).id === display.id;
}

/**
 * On Wayland an app cannot place a window: it can only ask for full screen, and the compositor
 * picks the display Chromium believes the window is on, which right after creating it is
 * sometimes the first one. So on Linux, check where each window ended up and place it again if it
 * missed. Only while the window still belongs on that display. A window that is full screen on
 * the wrong display must leave full screen first, and that takes the compositor a moment: moving
 * it at once leaves it where it was.
 */
function checkPlacement(win: BrowserWindow, display: Display, attempt = 0): void {
  if (!isLinux) return;
  clearTimeout(placementTimers.get(win));
  if (attempt >= PLACEMENT_CHECKS_MS.length) return;
  const timer = setTimeout(() => {
    const p = current;
    if (!p || win.isDestroyed()) return;
    if (p.speakers.get(display.id) !== win && p.audiences.get(display.id) !== win) return;
    const right = onDisplay(win, display);
    if (debugDisplays) {
      console.log(
        `PDF Diva: check ${attempt + 1}: wanted display ${display.id}, ` +
          `bounds ${JSON.stringify(win.getBounds())}, full screen ${isFullScreen(win)}, right ${right}`,
      );
    }
    if (right) return;
    console.log(`PDF Diva: window meant for display ${display.id} missed it; placing it again`);
    const move = (): void => {
      if (win.isDestroyed()) return;
      win.setBounds(display.bounds);
      setFullScreen(win, true);
      checkPlacement(win, display, attempt + 1);
    };
    if (isFullScreen(win)) {
      setFullScreen(win, false);
      placementTimers.set(win, setTimeout(move, LEAVE_FULL_SCREEN_MS));
    } else {
      move();
    }
  }, PLACEMENT_CHECKS_MS[attempt]);
  placementTimers.set(win, timer);
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
