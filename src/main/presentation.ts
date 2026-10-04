import type { BrowserWindow, Display, WebContents } from 'electron';
import {
  IPC,
  type PdfFile,
  type PresentAction,
  type PresentationMode,
  type PresentationSession,
  type PresentationState,
} from '../types/ipc';
import { sortedDisplays } from './displays';
import { savedSpeakerDisplay } from './settings';
import { createWindow } from './windows';

interface Presentation {
  pdf: PdfFile;
  /** Kept in memory only; sent to the windows so they can open a protected PDF. */
  password: string | undefined;
  state: PresentationState;
  launcher: BrowserWindow;
  mode: PresentationMode;
  /** Speaker view window (presenter mode). It is hidden, never closed, while only one display is left. */
  presenter: BrowserWindow | null;
  /** Audience windows by the id of the display they are on (one in presenter mode, one per display in mirror mode). */
  audiences: Map<number, BrowserWindow>;
  /** Displays assigned to the speaker view and the audience; they change only when swapping. */
  speakerId: number | null;
  audienceId: number | null;
  /** Whether two displays were available at some point: with one left the audience takes over. */
  dualSeen: boolean;
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
  'swapScreens',
  'exit',
  'goto',
]);

export function isPresentAction(value: unknown): value is PresentAction {
  if (typeof value !== 'object' || value === null) return false;
  const { type, page } = value as { type?: unknown; page?: unknown };
  if (typeof type !== 'string' || !ACTIONS.has(type)) return false;
  return type !== 'goto' || (typeof page === 'number' && Number.isFinite(page));
}

export function isPresentationMode(value: unknown): value is PresentationMode {
  return value === 'presenter' || value === 'mirror';
}

function clamp(page: number, total: number): number {
  return Math.min(Math.max(Math.trunc(page), 1), total);
}

function reduce(state: PresentationState, action: PresentAction): PresentationState {
  switch (action.type) {
    case 'exit':
    case 'swapScreens':
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
  }
}

function windows(p: Presentation): BrowserWindow[] {
  return [p.presenter, ...p.audiences.values()].filter(
    (w): w is BrowserWindow => w !== null && !w.isDestroyed(),
  );
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

// ---- Window placement ----

function createAudienceWindow(p: Presentation, display: Display): BrowserWindow {
  const win = createWindow('audience', {
    ...display.bounds,
    frame: false,
    fullscreen: true,
    backgroundColor: '#000000',
    show: false,
    title: 'PDF Diva - Público',
  });
  win.once('ready-to-show', () => win.show());
  win.on('closed', () => {
    if (!p.quiet.has(win)) endPresentation();
  });
  return win;
}

function placeAudience(win: BrowserWindow, display: Display): void {
  if (win.isDestroyed()) return;
  if (win.isFullScreen() && sameBounds(win.getBounds(), display.bounds)) return;
  if (win.isFullScreen()) win.setFullScreen(false);
  win.setBounds(display.bounds);
  win.setFullScreen(true);
  win.show();
}

function placeSpeaker(win: BrowserWindow, display: Display): void {
  if (win.isDestroyed()) return;
  if (win.isMaximized() && sameBounds(win.getBounds(), display.workArea) && win.isVisible()) return;
  if (win.isMaximized()) win.unmaximize();
  win.setBounds(display.workArea);
  win.maximize();
  win.show();
}

/** Makes `wanted` exactly the set of displays with an audience window, reusing windows where possible. */
function reconcileAudiences(p: Presentation, wanted: Display[]): void {
  const wantedIds = new Set(wanted.map((d) => d.id));
  const spare: BrowserWindow[] = [];
  for (const [id, win] of p.audiences) {
    if (wantedIds.has(id)) continue;
    p.audiences.delete(id);
    spare.push(win);
  }
  for (const display of wanted) {
    const existing = p.audiences.get(display.id);
    if (existing) {
      placeAudience(existing, display);
      continue;
    }
    const reused = spare.pop();
    if (reused) placeAudience(reused, display);
    p.audiences.set(display.id, reused ?? createAudienceWindow(p, display));
  }
  for (const win of spare) closeQuietly(p, win);
}

/** Which display holds the speaker view and which one the audience, given the connected displays. */
function resolveRoles(p: Presentation, displays: Display[]): { speaker: Display; audience: Display } {
  const speaker =
    displays.find((d) => d.id === p.speakerId) ?? savedSpeakerDisplay() ?? displays[0]!;
  const audience =
    displays.find((d) => d.id === p.audienceId && d.id !== speaker.id) ??
    displays.find((d) => d.id !== speaker.id) ??
    speaker;
  return { speaker, audience };
}

function layoutSpeakerMode(p: Presentation, displays: Display[]): void {
  const presenter = p.presenter;
  if (!presenter) return;
  if (displays.length >= 2) {
    p.dualSeen = true;
    const { speaker, audience } = resolveRoles(p, displays);
    placeSpeaker(presenter, speaker);
    reconcileAudiences(p, [audience]);
    presenter.focus();
  } else if (p.dualSeen) {
    // A display was lost: keep going at the same slide, full screen on the one left.
    presenter.hide();
    reconcileAudiences(p, displays);
    p.audiences.values().next().value?.focus();
  } else {
    // Started with a single display: only the speaker view, in a normal window.
    reconcileAudiences(p, []);
    presenter.show();
  }
}

function layoutMirrorMode(p: Presentation, displays: Display[]): void {
  reconcileAudiences(p, displays);
}

/** Puts every window where it belongs for the displays connected right now. */
function applyLayout(p: Presentation): void {
  const displays = sortedDisplays();
  p.state = { ...p.state, displayCount: displays.length };
  if (p.mode === 'mirror') layoutMirrorMode(p, displays);
  else layoutSpeakerMode(p, displays);
  broadcast(p);
}

/** Call when displays are added, removed or changed; waits a moment because Windows fires several events. */
export function onDisplaysChanged(): void {
  clearTimeout(relayoutTimer);
  relayoutTimer = setTimeout(() => {
    if (current) applyLayout(current);
  }, 300);
}

function swapScreens(p: Presentation): void {
  const displays = sortedDisplays();
  if (p.mode !== 'presenter' || displays.length < 2) return;
  const { speaker, audience } = resolveRoles(p, displays);
  if (displays.length === 2) {
    p.speakerId = audience.id;
    p.audienceId = speaker.id;
  } else {
    // 3+ displays: the audience moves on to the next display that is not the speaker's.
    const others = displays.filter((d) => d.id !== speaker.id);
    const at = others.findIndex((d) => d.id === audience.id);
    p.speakerId = speaker.id;
    p.audienceId = others[(at + 1) % others.length]!.id;
  }
  applyLayout(p);
}

// ---- Public API ----

export function startPresentation(
  launcher: BrowserWindow,
  pdf: PdfFile,
  total: number,
  page: number,
  mode: PresentationMode,
  password: string | undefined,
): void {
  if (current) {
    (current.presenter ?? current.audiences.values().next().value)?.focus();
    return;
  }
  const displays = sortedDisplays();
  const presentation: Presentation = {
    pdf,
    password,
    state: { page: clamp(page, total), total, blank: false, displayCount: displays.length },
    launcher,
    mode,
    presenter: null,
    audiences: new Map(),
    speakerId: null,
    audienceId: null,
    dualSeen: false,
    quiet: new Set(),
  };
  if (mode === 'presenter') {
    const presenter = createWindow('presenter', {
      width: 1100,
      height: 700,
      show: false,
      title: 'PDF Diva - Orador',
    });
    presenter.on('closed', () => {
      if (!presentation.quiet.has(presenter)) endPresentation();
    });
    presentation.presenter = presenter;
    const { speaker, audience } = displays.length >= 2
      ? resolveRoles(presentation, displays)
      : { speaker: displays[0]!, audience: displays[0]! };
    presentation.speakerId = speaker.id;
    presentation.audienceId = displays.length >= 2 ? audience.id : null;
  }
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
  if (action.type === 'swapScreens') {
    swapScreens(current);
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
