import { screen, type Display } from 'electron';
import type { DisplayInfo, DisplayRole } from '../types/ipc';
import { savedRole } from './settings';

/** Connected displays in a stable order: the main one first, then left to right, top to bottom. */
export function sortedDisplays(): Display[] {
  const mainId = screen.getPrimaryDisplay().id;
  return [...screen.getAllDisplays()].sort((a, b) => {
    if (a.id === mainId) return -1;
    if (b.id === mainId) return 1;
    return a.bounds.x - b.bounds.x || a.bounds.y - b.bounds.y;
  });
}

/** Default roles: the audience on the last display, a speaker view on every other one. */
function defaultRole(index: number, count: number): DisplayRole {
  return index === count - 1 ? 'audience' : 'speaker';
}

/**
 * The role of each display (same order as `displays`). With one display there is only the
 * audience. Otherwise each display keeps its saved role and the others get the default; there
 * must always be an audience, so if none is left (for instance, its display was unplugged) the
 * last display not saved as a speaker view becomes it, or failing that the defaults apply.
 */
export function displayRoles(displays: Display[]): DisplayRole[] {
  if (displays.length === 1) return ['audience'];
  const saved = displays.map(savedRole);
  const roles = saved.map((role, i) => role ?? defaultRole(i, displays.length));
  if (roles.includes('audience')) return roles;
  const free = saved.lastIndexOf(null);
  if (free >= 0) {
    roles[free] = 'audience';
    return roles;
  }
  return displays.map((_d, i) => defaultRole(i, displays.length));
}

/** Resolution in physical pixels, as Windows shows it. */
function physicalSize(display: Display): { width: number; height: number } {
  if (process.platform === 'win32') {
    const { width, height } = screen.dipToScreenRect(null, display.bounds);
    return { width, height };
  }
  return {
    width: Math.round(display.size.width * display.scaleFactor),
    height: Math.round(display.size.height * display.scaleFactor),
  };
}

export function displayInfos(): DisplayInfo[] {
  const displays = sortedDisplays();
  const roles = displayRoles(displays);
  const mainId = screen.getPrimaryDisplay().id;
  return displays.map((display, i) => ({
    id: display.id,
    index: i + 1,
    ...physicalSize(display),
    scale: Math.round(display.scaleFactor * 100),
    primary: display.id === mainId,
    internal: display.internal,
    label: display.label,
    role: roles[i]!,
  }));
}
