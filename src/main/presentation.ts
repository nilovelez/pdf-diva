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
  const move = (): void => {
    if (win.isDestroyed()) return;
    win.setBounds(display.bounds);
    setFullScreen(win, true);
    win.show();
    checkPlacement(win, display);
  };
  if (!isFullScreen(win)) {
    move();
  } else if (isLinux) {
    // A window already on its display is left alone: on Wayland every move is a gamble. And one
    // moved while it is still leaving full screen stays where it was.
    void isOnDisplay(win, display).then((right) => {
      if (!right && !win.isDestroyed()) afterLeavingFullScreen(win, move);
    });
  } else if (!sameBounds(win.getBounds(), display.bounds)) {
    setFullScreen(win, false);
    move();
  }
}

const isLinux = process.platform === 'linux';
/** PDF_DIVA_DEBUG_DISPLAYS=1 logs every check, for testing on a new desktop. */
const debugDisplays = process.env.PDF_DIVA_DEBUG_DISPLAYS === '1';
/** How long a window may take to go full screen before it is taken as misplaced. */
const PLACEMENT_CHECKS_MS = [500, 1000, 2000];
/** How many times a misplaced window is replaced by a new one. */
const MAX_REPLACEMENTS = 3;
/** Longest wait for the compositor to confirm a window left full screen. */
const LEAVE_FULL_SCREEN_TIMEOUT_MS = 1000;
/** The pending check of each window: a new placement replaces it. */
const placementTimers = new WeakMap<BrowserWindow, NodeJS.Timeout>();
/** How many windows came before this one on its display, each replaced for landing elsewhere. */
const replacements = new WeakMap<BrowserWindow, number>();

/** Takes `win` out of full screen and runs `then` once the compositor has done it. */
function afterLeavingFullScreen(win: BrowserWindow, then: () => void): void {
  let done = false;
  const go = (): void => {
    if (done) return;
    done = true;
    clearTimeout(fallback);
    then();
  };
  const fallback = setTimeout(go, LEAVE_FULL_SCREEN_TIMEOUT_MS);
  win.once('leave-full-screen', go);
  setFullScreen(win, false);
}

/**
 * Puts a new window on `display` in place of `win`, which landed on another one. On Wayland a new
 * window lands where it was asked far more often than a window that is moved.
 */
function replaceWindow(p: Presentation, win: BrowserWindow, display: Display): void {
  const kind = p.audiences.get(display.id) === win ? 'audience' : 'presenter';
  const byDisplay = kind === 'audience' ? p.audiences : p.speakers;
  const focused = win.isFocused();
  const next = createPresentationWindow(p, kind, display);
  replacements.set(next, (replacements.get(win) ?? 0) + 1);
  if (focused) next.once('show', () => next.focus());
  byDisplay.set(display.id, next);
  closeQuietly(p, win);
}

/** Asks the page which screen its window is on (Window Management API). */
const CURRENT_SCREEN_JS =
  'getScreenDetails().then((d) => [d.currentScreen.left, d.currentScreen.top])';

/**
 * The display a window is on. On Wayland the window's own bounds always start at 0,0, but
 * Chromium knows the display from the compositor, and the page can tell through
 * getScreenDetails(): its current screen has the same origin as one of Electron's displays.
 */
async function displayOf(win: BrowserWindow): Promise<Display | undefined> {
  try {
    const [left, top] = (await win.webContents.executeJavaScript(CURRENT_SCREEN_JS)) as [number, number];
    return screen.getAllDisplays().find((d) => d.bounds.x === left && d.bounds.y === top);
  } catch {
    return undefined;
  }
}

/**
 * Whether a window is full screen on `display`. If the page can't say which screen it is on, the
 * window's size has to do (one the size of another display is on that one); with two displays
 * of the same size that can't tell, and the window is then taken as right.
 */
async function isOnDisplay(win: BrowserWindow, display: Display): Promise<boolean> {
  if (!isFullScreen(win)) return false;
  const on = await displayOf(win);
  if (win.isDestroyed()) return false;
  if (on) return on.id === display.id;
  const bounds = win.getBounds();
  if (bounds.width === display.bounds.width && bounds.height === display.bounds.height) return true;
  return screen.getDisplayMatching(bounds).id === display.id;
}

/**
 * On Wayland an app cannot place a window: it can only ask for full screen, and the compositor
 * picks the display Chromium believes the window is on, which is sometimes the first one. So on
 * Linux, check where each window ended up. A window that is full screen elsewhere, or not full
 * screen after the last check, is replaced by a new one on its display (moving it fails more
 * often). Only while the window still belongs on that display.
 */
function checkPlacement(win: BrowserWindow, display: Display, check = 0): void {
  if (!isLinux) return;
  clearTimeout(placementTimers.get(win));
  const timer = setTimeout(async () => {
    const belongs = (p: Presentation | null): p is Presentation =>
      p !== null && !win.isDestroyed() && (p.speakers.get(display.id) === win || p.audiences.get(display.id) === win);
    if (!belongs(current)) return;
    const right = await isOnDisplay(win, display);
    const p = current;
    if (!belongs(p)) return;
    const replaced = replacements.get(win) ?? 0;
    if (debugDisplays) {
      const on = await displayOf(win);
      console.log(
        `PDF Diva: window ${replaced + 1}, check ${check + 1}: wanted display ${display.id}, ` +
          `page says ${on?.id ?? 'unknown'}, bounds ${JSON.stringify(win.getBounds())}, ` +
          `full screen ${isFullScreen(win)}, right ${right}`,
      );
    }
    if (right) return;
    const lastCheck = check + 1 >= PLACEMENT_CHECKS_MS.length;
    if (!isFullScreen(win) && !lastCheck) {
      checkPlacement(win, display, check + 1); // still on its way to full screen
      return;
    }
    if (replaced >= MAX_REPLACEMENTS) return;
    console.log(`PDF Diva: window meant for display ${display.id} landed elsewhere; replacing it`);
    replaceWindow(p, win, display);
  }, PLACEMENT_CHECKS_MS[check]);
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
