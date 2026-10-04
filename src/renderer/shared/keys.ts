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
 * Maps a key to its action using the table in CLAUDE.md.
 * Keys typed into a text field or a select are left alone (except Escape).
 * With `buttonsKeepKeys`, Space and Enter activate the focused button instead of turning the page
 * (useful in the reader; during a presentation they always turn the page, because a clicker sends Space).
 */
export function onKeyAction(
  handler: (action: KeyAction) => void,
  options: { buttonsKeepKeys?: boolean } = {},
): void {
  window.addEventListener('keydown', (event) => {
    const action = KEY_ACTIONS[event.key];
    if (!action) return;
    const target = event.target instanceof Element ? event.target : null;
    if (action !== 'exit' && target?.closest('input, select, textarea')) return;
    const onButton = target?.closest('button') != null;
    if (options.buttonsKeepKeys && onButton && (event.key === ' ' || event.key === 'Enter')) return;
    event.preventDefault();
    handler(action);
  });
}

/** A click must not leave the focus on a button: otherwise a clicker's Space/Enter would press it again. */
export function keepFocusOffButtons(): void {
  document.addEventListener('mousedown', (event) => {
    if (event.target instanceof Element && event.target.closest('button')) event.preventDefault();
  });
}
