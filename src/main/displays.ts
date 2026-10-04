import { screen, type Display } from 'electron';
import type { DisplayInfo } from '../types/ipc';

/** Connected displays in a stable order: the main one first, then left to right, top to bottom. */
export function sortedDisplays(): Display[] {
  const mainId = screen.getPrimaryDisplay().id;
  return [...screen.getAllDisplays()].sort((a, b) => {
    if (a.id === mainId) return -1;
    if (b.id === mainId) return 1;
    return a.bounds.x - b.bounds.x || a.bounds.y - b.bounds.y;
  });
}

export function toDisplayInfo(display: Display, index: number): DisplayInfo {
  return {
    id: display.id,
    index: index + 1,
    // Physical pixels, which is what the Windows display settings show.
    width: Math.round(display.size.width * display.scaleFactor),
    height: Math.round(display.size.height * display.scaleFactor),
    primary: display.id === screen.getPrimaryDisplay().id,
  };
}

export function displayInfos(): DisplayInfo[] {
  return sortedDisplays().map(toDisplayInfo);
}
