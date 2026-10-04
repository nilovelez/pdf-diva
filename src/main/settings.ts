import { app, nativeTheme, type Display } from 'electron';
import { readFileSync } from 'node:fs';
import { writeFile } from 'node:fs/promises';
import path from 'node:path';
import type { Settings, ThemeSetting } from '../types/ipc';
import { sortedDisplays } from './displays';

/** What identifies a display across runs: its id, with label and geometry as a fallback. */
interface StoredMonitor {
  id: number;
  label: string;
  width: number;
  height: number;
  x: number;
  y: number;
}

interface StoredSettings {
  speakerMonitor: StoredMonitor | null;
  theme: ThemeSetting;
}

const THEMES: readonly ThemeSetting[] = ['system', 'light', 'dark'];
let stored: StoredSettings = { speakerMonitor: null, theme: 'system' };

const file = (): string => path.join(app.getPath('userData'), 'settings.json');

function isStoredMonitor(value: unknown): value is StoredMonitor {
  if (typeof value !== 'object' || value === null) return false;
  const m = value as Record<string, unknown>;
  return (
    typeof m.id === 'number' &&
    typeof m.label === 'string' &&
    typeof m.width === 'number' &&
    typeof m.height === 'number' &&
    typeof m.x === 'number' &&
    typeof m.y === 'number'
  );
}

/** Reads the settings file (a missing or damaged file just means the defaults). */
export function loadSettings(): void {
  try {
    const raw: unknown = JSON.parse(readFileSync(file(), 'utf8'));
    if (typeof raw !== 'object' || raw === null) return;
    const { speakerMonitor, theme } = raw as Record<string, unknown>;
    stored = {
      speakerMonitor: isStoredMonitor(speakerMonitor) ? speakerMonitor : null,
      theme: THEMES.includes(theme as ThemeSetting) ? (theme as ThemeSetting) : 'system',
    };
  } catch {
    /* defaults */
  }
}

export function applyTheme(): void {
  nativeTheme.themeSource = stored.theme;
}

function describe(display: Display): StoredMonitor {
  return {
    id: display.id,
    label: display.label,
    width: display.size.width,
    height: display.size.height,
    x: display.bounds.x,
    y: display.bounds.y,
  };
}

/** The saved speaker display if it is connected right now, otherwise null (= automatic). */
export function savedSpeakerDisplay(): Display | null {
  const saved = stored.speakerMonitor;
  if (!saved) return null;
  const displays = sortedDisplays();
  return (
    displays.find((d) => d.id === saved.id) ??
    displays.find(
      (d) =>
        saved.label !== '' &&
        d.label === saved.label &&
        d.size.width === saved.width &&
        d.size.height === saved.height,
    ) ??
    null
  );
}

export function getSettings(): Settings {
  return { speakerMonitorId: savedSpeakerDisplay()?.id ?? null, theme: stored.theme };
}

/** Applies a change and writes it to disk straight away (there is no "save" button). */
export function updateSettings(patch: Partial<Settings>): Settings {
  if (patch.speakerMonitorId !== undefined) {
    const chosen = sortedDisplays().find((d) => d.id === patch.speakerMonitorId);
    stored.speakerMonitor = chosen ? describe(chosen) : null;
  }
  if (patch.theme !== undefined && THEMES.includes(patch.theme)) {
    stored.theme = patch.theme;
    applyTheme();
  }
  void writeFile(file(), JSON.stringify(stored, null, 2)).catch(() => {
    /* not being able to save a preference must never break the app */
  });
  return getSettings();
}
