import type { PresentAction } from '../../types/ipc';

export type KeyAction = Exclude<PresentAction, { type: 'goto' }>['type'];

const KEY_ACTIONS: Record<string, KeyAction> = {
  PageDown: 'next',
  ArrowRight: 'next',
  ArrowDown: 'next',
  ' ': 'next',
  Enter: 'next',
  PageUp: 'prev',
  ArrowLeft: 'prev',
  ArrowUp: 'prev',
  Backspace: 'prev',
  Home: 'first',
  End: 'last',
  b: 'toggleBlack',
  B: 'toggleBlack',
  '.': 'toggleBlack',
  Escape: 'exit',
};

/**
 * Traduce una tecla a su acción según la tabla de CLAUDE.md.
 * Con `buttonsKeepKeys`, Espacio e Intro activan el botón enfocado en vez de pasar de página
 * (útil en el lector; en la presentación siempre pasan de página, porque un presenter envía Espacio).
 */
export function onKeyAction(
  handler: (action: KeyAction) => void,
  options: { buttonsKeepKeys?: boolean } = {},
): void {
  window.addEventListener('keydown', (event) => {
    const action = KEY_ACTIONS[event.key];
    if (!action) return;
    const onButton = event.target instanceof Element && event.target.closest('button') !== null;
    if (options.buttonsKeepKeys && onButton && (event.key === ' ' || event.key === 'Enter')) return;
    event.preventDefault();
    handler(action);
  });
}

/** Evita que un clic deje el foco en un botón: así Espacio/Intro de un presenter no lo vuelven a pulsar. */
export function keepFocusOffButtons(): void {
  document.addEventListener('mousedown', (event) => {
    if (event.target instanceof Element && event.target.closest('button')) event.preventDefault();
  });
}
