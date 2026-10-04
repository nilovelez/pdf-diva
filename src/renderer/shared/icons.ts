// Iconos Phosphor (MIT, ver resources/icons/LICENSE-phosphor.txt). Se incrustan en el JS
// al compilar, así la CSP no necesita permitir nada más.
import arrowCounterClockwise from '../../../resources/icons/arrow-counter-clockwise.svg';
import caretLeft from '../../../resources/icons/caret-left.svg';
import caretRight from '../../../resources/icons/caret-right.svg';
import copy from '../../../resources/icons/copy.svg';
import eyeSlash from '../../../resources/icons/eye-slash.svg';
import filePdf from '../../../resources/icons/file-pdf.svg';
import folderOpen from '../../../resources/icons/folder-open.svg';
import pause from '../../../resources/icons/pause.svg';
import play from '../../../resources/icons/play.svg';
import presentationChart from '../../../resources/icons/presentation-chart.svg';
import timer from '../../../resources/icons/timer.svg';
import x from '../../../resources/icons/x.svg';

const ICONS = {
  'arrow-counter-clockwise': arrowCounterClockwise,
  'caret-left': caretLeft,
  'caret-right': caretRight,
  copy,
  'eye-slash': eyeSlash,
  'file-pdf': filePdf,
  'folder-open': folderOpen,
  pause,
  play,
  'presentation-chart': presentationChart,
  timer,
  x,
} as const;

export type IconName = keyof typeof ICONS;

export function setIcon(el: Element, name: IconName): void {
  el.innerHTML = ICONS[name];
}

/** Rellena cada `<span class="icon" data-icon="nombre">` con su SVG. */
export function paintIcons(root: ParentNode = document): void {
  root.querySelectorAll<HTMLElement>('[data-icon]').forEach((el) => {
    setIcon(el, el.dataset.icon as IconName);
  });
}
