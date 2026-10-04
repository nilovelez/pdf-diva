// Contrato IPC compartido entre main, preload y renderers.

export const IPC = {
  openPdf: 'open-pdf',
  readPdf: 'read-pdf',
  startPresentation: 'start-presentation',
  getSession: 'get-session',
  action: 'action',
  state: 'state',
  presentationEnded: 'presentation-ended',
} as const;

export interface PdfFile {
  path: string;
  name: string;
  data: Uint8Array;
}

export interface PresentationState {
  page: number;
  total: number;
  /** Pantalla del público en negro. */
  blank: boolean;
}

export interface PresentationSession {
  name: string;
  data: Uint8Array;
  state: PresentationState;
}

export type PresentAction =
  | { type: 'next' | 'prev' | 'first' | 'last' | 'toggleBlack' | 'exit' }
  | { type: 'goto'; page: number };

export interface PresenterApi {
  /** Abre el diálogo de selección; devuelve null si el usuario cancela. */
  openPdf(): Promise<PdfFile | null>;
  /** Lee un PDF por ruta (arrastrar y soltar). Rechaza si no es un PDF o no se puede leer. */
  readPdf(path: string): Promise<PdfFile>;
  /** Ruta real de un archivo soltado en la ventana. */
  pathForFile(file: File): string;
  /** Inicia la presentación del último PDF abierto, desde la página `page`. */
  startPresentation(total: number, page: number): Promise<void>;
  getSession(): Promise<PresentationSession>;
  sendAction(action: PresentAction): void;
  onState(callback: (state: PresentationState) => void): void;
  /** Se llama con la última página mostrada cuando termina la presentación. */
  onPresentationEnded(callback: (page: number) => void): void;
}
