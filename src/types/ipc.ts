// IPC contract shared by main, preload and renderers.

export const IPC = {
  openPdf: 'open-pdf',
  readPdf: 'read-pdf',
  pdfOpened: 'pdf-opened',
  startPresentation: 'start-presentation',
  getSession: 'get-session',
  action: 'action',
  state: 'state',
  presentationEnded: 'presentation-ended',
  getDisplays: 'get-displays',
  displaysChanged: 'displays-changed',
  getSettings: 'get-settings',
  setSettings: 'set-settings',
  getAppInfo: 'get-app-info',
  openWebsite: 'open-website',
} as const;

export interface PdfFile {
  /** Identifies this read, so the launcher can say exactly which file it ended up opening. */
  id: number;
  path: string;
  name: string;
  data: Uint8Array;
}

/**
 * presenter: audience on a secondary display and speaker view on the main one.
 * mirror: the same slide full screen on every display, no speaker view.
 */
export type PresentationMode = 'presenter' | 'mirror';

export interface PresentationState {
  page: number;
  total: number;
  /** Audience screen blacked out. */
  blank: boolean;
  /** Connected displays; the speaker view hides its "swap screens" button with fewer than 2. */
  displayCount: number;
}

export interface PresentationSession {
  name: string;
  data: Uint8Array;
  /** Password of the PDF, kept in memory only so every window can open it. */
  password?: string;
  state: PresentationState;
}

export type PresentAction =
  | { type: 'next' | 'prev' | 'first' | 'last' | 'toggleBlack' | 'swapScreens' | 'exit' }
  | { type: 'goto'; page: number };

export interface DisplayInfo {
  id: number;
  /** 1-based position in the list (main display first). */
  index: number;
  width: number;
  height: number;
  primary: boolean;
}

export type ThemeSetting = 'system' | 'light' | 'dark';

export interface Settings {
  /** Display for the speaker view; null means automatic (the main display). */
  speakerMonitorId: number | null;
  theme: ThemeSetting;
}

export interface AppInfo {
  version: string;
}

export interface PresenterApi {
  /** Opens the file dialog; resolves to null if the user cancels. */
  openPdf(): Promise<PdfFile | null>;
  /** Reads a PDF by path (drag and drop). Rejects if it is not a PDF or cannot be read. */
  readPdf(path: string): Promise<PdfFile>;
  /** Tells the main process that the PDF with this id opened fine, so it is the one to present. */
  pdfOpened(id: number): void;
  /** Real path of a file dropped on the window. */
  pathForFile(file: File): string;
  /** Starts presenting the PDF reported by `pdfOpened`, from page `page`. */
  startPresentation(
    total: number,
    page: number,
    mode: PresentationMode,
    password?: string,
  ): Promise<void>;
  getSession(): Promise<PresentationSession>;
  sendAction(action: PresentAction): void;
  onState(callback: (state: PresentationState) => void): void;
  /** Called with the last page shown when the presentation ends. */
  onPresentationEnded(callback: (page: number) => void): void;
  getDisplays(): Promise<DisplayInfo[]>;
  /** Called whenever a display is plugged in, unplugged or changes. */
  onDisplaysChanged(callback: (displays: DisplayInfo[]) => void): void;
  getSettings(): Promise<Settings>;
  /** Saves and applies the given settings; resolves to the resulting settings. */
  setSettings(patch: Partial<Settings>): Promise<Settings>;
  getAppInfo(): Promise<AppInfo>;
  /** Opens the project page in the external browser. */
  openWebsite(): void;
}
