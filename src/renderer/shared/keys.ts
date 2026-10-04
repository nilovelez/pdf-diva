export type KeyAction = 'next' | 'prev' | 'first' | 'last' | 'black' | 'exit';

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
  b: 'black',
  B: 'black',
  '.': 'black',
  Escape: 'exit',
};

/** Traduce una tecla a su acción según la tabla de CLAUDE.md. */
export function onKeyAction(handler: (action: KeyAction) => void): void {
  window.addEventListener('keydown', (event) => {
    const action = KEY_ACTIONS[event.key];
    if (!action) return;
    event.preventDefault();
    handler(action);
  });
}
