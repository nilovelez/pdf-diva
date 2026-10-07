// "Configure displays": what each display shows while presenting. Used by the reader and the
// speaker view. Changes apply only with Apply, and a change of displays closes it without applying.
import laptopAudience from '../../../resources/displays/laptop-audience.svg';
import laptopSpeaker from '../../../resources/displays/laptop-speaker.svg';
import monitorAudience from '../../../resources/displays/monitor-audience.svg';
import monitorSpeaker from '../../../resources/displays/monitor-speaker.svg';
import type { DisplayInfo, DisplayRole } from '../../types/ipc';
import { t } from './i18n';
import { setIcon } from './icons';

const ART: Record<'laptop' | 'monitor', Record<DisplayRole, string>> = {
  laptop: { speaker: laptopSpeaker, audience: laptopAudience },
  monitor: { speaker: monitorSpeaker, audience: monitorAudience },
};

function el<K extends keyof HTMLElementTagNameMap>(
  tag: K,
  className = '',
  text = '',
): HTMLElementTagNameMap[K] {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text) node.textContent = text;
  return node;
}

function displayName(display: DisplayInfo): string {
  if (display.internal) return t('displays.builtIn');
  return display.label || t('displays.unnamed', { index: display.index });
}

export interface DisplaysDialog {
  open(): Promise<void>;
  close(): void;
  isOpen(): boolean;
}

export function createDisplaysDialog(): DisplaysDialog {
  const overlay = el('div', 'overlay');
  overlay.hidden = true;
  const dialog = el('div', 'dialog displays-dialog');
  dialog.setAttribute('role', 'dialog');
  dialog.setAttribute('aria-modal', 'true');
  dialog.setAttribute('aria-labelledby', 'displays-title');

  const header = el('header');
  const icon = el('span', 'icon');
  setIcon(icon, 'monitor');
  const title = el('h2');
  title.id = 'displays-title';
  const closeButton = el('button', 'close');
  closeButton.type = 'button';
  setIcon(closeButton, 'x');
  header.append(icon, title, closeButton);

  const tiles = el('div', 'display-tiles');
  const warning = el('p', 'displays-warning');
  const actions = el('div', 'actions');
  const cancelButton = el('button', 'btn');
  cancelButton.type = 'button';
  const applyButton = el('button', 'btn primary');
  applyButton.type = 'button';
  actions.append(cancelButton, applyButton);
  dialog.append(header, tiles, warning, actions);
  overlay.append(dialog);
  document.body.append(overlay);

  let displays: DisplayInfo[] = [];
  let roles: DisplayRole[] = [];

  function update(): void {
    const changed = roles.some((role, i) => role !== displays[i]!.role);
    const hasAudience = roles.includes('audience');
    tiles.querySelectorAll('.display-tile').forEach((tile, i) => {
      tile.classList.toggle('changed', roles[i] !== displays[i]!.role);
      const kind = displays[i]!.internal ? 'laptop' : 'monitor';
      tile.querySelector('.art')!.innerHTML = ART[kind][roles[i]!];
    });
    warning.hidden = hasAudience;
    applyButton.disabled = !changed || !hasAudience;
  }

  function tile(display: DisplayInfo, i: number): HTMLElement {
    const screen = el('div', 'display-screen');
    screen.append(
      el('span', 'number', String(display.index)),
      el('span', 'art'),
      el('span', 'resolution', t('displays.resolution', {
        width: display.width,
        height: display.height,
        scale: display.scale,
      })),
    );
    if (display.primary) screen.append(el('span', 'main', t('displays.main')));
    const select = el('select');
    select.setAttribute('aria-label', t('displays.role', { index: display.index }));
    select.append(
      new Option(t('displays.speaker'), 'speaker'),
      new Option(t('displays.audience'), 'audience'),
    );
    select.value = roles[i]!;
    select.addEventListener('change', () => {
      roles[i] = select.value as DisplayRole;
      update();
    });
    const box = el('div', 'display-tile');
    box.append(screen, el('div', 'name', displayName(display)), select);
    return box;
  }

  function close(): void {
    overlay.hidden = true;
  }

  async function open(): Promise<void> {
    displays = await window.presenter.getDisplays();
    roles = displays.map((d) => d.role);
    // Texts are set on every open, so they follow a language change.
    title.textContent = t('displays.title');
    closeButton.title = t('dialog.close');
    closeButton.setAttribute('aria-label', t('dialog.close'));
    cancelButton.textContent = t('dialog.cancel');
    applyButton.textContent = t('dialog.apply');
    warning.textContent = t('displays.needAudience');
    tiles.replaceChildren(...displays.map(tile));
    update();
    overlay.hidden = false;
    tiles.querySelector('select')?.focus();
  }

  closeButton.addEventListener('click', close);
  cancelButton.addEventListener('click', close);
  applyButton.addEventListener('click', () => {
    const choices = displays.map((d, i) => ({ id: d.id, role: roles[i]! }));
    close();
    void window.presenter.setDisplayRoles(choices);
  });
  // What is shown may no longer exist: close without applying.
  window.presenter.onDisplaysChanged(close);

  return { open, close, isOpen: () => !overlay.hidden };
}
