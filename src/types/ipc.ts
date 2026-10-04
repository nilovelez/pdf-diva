// Contrato IPC compartido entre main, preload y renderers.
// Se irá ampliando con las acciones (next, prev, goto, exit) y el estado.
export interface OpenedPdf {
  name: string;
  data: Uint8Array;
}

export interface PresenterApi {
  ping(): Promise<string>;
  /** Abre el diálogo de selección; devuelve null si el usuario cancela. */
  openPdf(): Promise<OpenedPdf | null>;
}
