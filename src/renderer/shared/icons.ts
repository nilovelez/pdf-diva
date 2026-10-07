// Phosphor icons (MIT, see resources/icons/LICENSE-phosphor.txt). They are inlined into the JS
// at build time, so the CSP does not need to allow anything else.
import arrowCounterClockwise from '../../../resources/icons/arrow-counter-clockwise.svg';
import caretLeft from '../../../resources/icons/caret-left.svg';
import caretRight from '../../../resources/icons/caret-right.svg';
import eyeSlash from '../../../resources/icons/eye-slash.svg';
import filePdf from '../../../resources/icons/file-pdf.svg';
import folderOpen from '../../../resources/icons/folder-open.svg';
import gearSix from '../../../resources/icons/gear-six.svg';
import lockKey from '../../../resources/icons/lock-key.svg';
import monitor from '../../../resources/icons/monitor.svg';
import pause from '../../../resources/icons/pause.svg';
import play from '../../../resources/icons/play.svg';
import presentationChart from '../../../resources/icons/presentation-chart.svg';
import timer from '../../../resources/icons/timer.svg';
import x from '../../../resources/icons/x.svg';

const ICONS = {
  'arrow-counter-clockwise': arrowCounterClockwise,
  'caret-left': caretLeft,
  'caret-right': caretRight,
  'eye-slash': eyeSlash,
  'file-pdf': filePdf,
  'folder-open': folderOpen,
  'gear-six': gearSix,
  'lock-key': lockKey,
  monitor,
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

/** Fills every `<span class="icon" data-icon="name">` with its SVG. */
export function paintIcons(root: ParentNode = document): void {
  root.querySelectorAll<HTMLElement>('[data-icon]').forEach((el) => {
    setIcon(el, el.dataset.icon as IconName);
  });
}
