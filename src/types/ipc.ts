// Contrato IPC compartido entre main, preload y renderers.
// Se irá ampliando con las acciones (next, prev, goto, exit) y el estado.
export interface PresenterApi {
  ping(): Promise<string>;
}
