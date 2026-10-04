import { screen, type BrowserWindow, type WebContents } from 'electron';
import {
  IPC,
  type PdfFile,
  type PresentAction,
  type PresentationMode,
  type PresentationSession,
  type PresentationState,
} from '../types/ipc';
import { createWindow } from './windows';

interface Presentation {
  pdf: PdfFile;
  state: PresentationState;
  launcher: BrowserWindow;
  presenter: BrowserWindow | null;
  audiences: BrowserWindow[];
}

let current: Presentation | null = null;

const ACTIONS = new Set(['next', 'prev', 'first', 'last', 'toggleBlack', 'exit', 'goto']);

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
  return [p.presenter, ...p.audiences].filter(
    (w): w is BrowserWindow => w !== null && !w.isDestroyed(),
  );
}

/** Solo las ventanas de la presentación pueden consultarla o controlarla. */
export function isPresentationSender(sender: WebContents): boolean {
  return current !== null && windows(current).some((w) => w.webContents === sender);
}

function createAudienceWindow(display: Electron.Display): BrowserWindow {
  const win = createWindow('audience', {
    ...display.bounds,
    frame: false,
    fullscreen: true,
    backgroundColor: '#000000',
    show: false,
    title: 'PDF Presenter - Público',
  });
  win.once('ready-to-show', () => win.show());
  return win;
}

export function startPresentation(
  launcher: BrowserWindow,
  pdf: PdfFile,
  total: number,
  page: number,
  mode: PresentationMode,
): void {
  if (current) {
    (current.presenter ?? current.audiences[0])?.focus();
    return;
  }
  const primary = screen.getPrimaryDisplay();
  const secondary = screen.getAllDisplays().find((d) => d.id !== primary.id);

  let presenter: BrowserWindow | null = null;
  let audiences: BrowserWindow[];
  if (mode === 'mirror') {
    audiences = screen.getAllDisplays().map(createAudienceWindow);
  } else {
    // Con un solo monitor solo se abre la vista del orador, en ventana normal.
    presenter = secondary
      ? createWindow('presenter', { ...primary.workArea, title: 'PDF Presenter - Orador' })
      : createWindow('presenter', { width: 1100, height: 700, title: 'PDF Presenter - Orador' });
    if (secondary) presenter.maximize();
    audiences = secondary ? [createAudienceWindow(secondary)] : [];
  }

  const presentation: Presentation = {
    pdf,
    state: { page: clamp(page, total), total, blank: false },
    launcher,
    presenter,
    audiences,
  };
  current = presentation;
  for (const w of windows(presentation)) w.on('closed', endPresentation);
  (presenter ?? audiences[0])?.focus();
}

export function getSession(): PresentationSession | null {
  if (!current) return null;
  return { name: current.pdf.name, data: current.pdf.data, state: current.state };
}

export function handleAction(action: PresentAction): void {
  if (!current) return;
  if (action.type === 'exit') {
    endPresentation();
    return;
  }
  current.state = reduce(current.state, action);
  for (const w of windows(current)) w.webContents.send(IPC.state, current.state);
}

export function endPresentation(): void {
  const ended = current;
  if (!ended) return;
  current = null;
  for (const w of windows(ended)) w.close();
  if (!ended.launcher.isDestroyed()) {
    ended.launcher.webContents.send(IPC.presentationEnded, ended.state.page);
    ended.launcher.show();
    ended.launcher.focus();
  }
}
