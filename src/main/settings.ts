import { app, nativeTheme, type Display } from 'electron';
import { readFileSync } from 'node:fs';
import { writeFile } from 'node:fs/promises';
import path from 'node:path';
import { isLanguage, resolveLanguage, translate, type Language, type MessageKey } from '../i18n/i18n';
import type { LanguageSetting, Settings, SettingsPatch, ThemeSetting } from '../types/ipc';
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
  /** Where the audience went the last time the screens were swapped; null = any other display. */
  audienceMonitor: StoredMonitor | null;
  theme: ThemeSetting;
  language: LanguageSetting;
}

const THEMES: readonly ThemeSetting[] = ['system', 'light', 'dark'];
let stored: StoredSettings = {
  speakerMonitor: null,
  audienceMonitor: null,
  theme: 'system',
  language: 'system',
};

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

export function isThemeSetting(value: unknown): value is ThemeSetting {
  return THEMES.includes(value as ThemeSetting);
}

export function isLanguageSetting(value: unknown): value is LanguageSetting {
  return value === 'system' || isLanguage(value);
}

/** Reads the settings file (a missing or damaged file just means the defaults). */
export function loadSettings(): void {
  try {
    const raw: unknown = JSON.parse(readFileSync(file(), 'utf8'));
    if (typeof raw !== 'object' || raw === null) return;
    const { speakerMonitor, audienceMonitor, theme, language } = raw as Record<string, unknown>;
    stored = {
      speakerMonitor: isStoredMonitor(speakerMonitor) ? speakerMonitor : null,
      audienceMonitor: isStoredMonitor(audienceMonitor) ? audienceMonitor : null,
      theme: isThemeSetting(theme) ? theme : 'system',
      language: isLanguageSetting(language) ? language : 'system',
    };
  } catch {
    /* defaults */
  }
}

export function applyTheme(): void {
  nativeTheme.themeSource = stored.theme;
}

/** The language the UI uses: the saved choice, or the system's when it is "system". */
export function uiLanguage(): Language {
  return stored.language === 'system'
    ? resolveLanguage(app.getPreferredSystemLanguages())
    : stored.language;
}

/** UI text for the main process (dialogs, window titles). */
export function t(key: MessageKey): string {
  return translate(uiLanguage(), key);
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

/** The saved display if it is connected right now, otherwise null. */
function findDisplay(saved: StoredMonitor | null): Display | null {
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

/** The saved speaker display if it is connected right now, otherwise null (= automatic). */
export function savedSpeakerDisplay(): Display | null {
  return findDisplay(stored.speakerMonitor);
}

/** The display the audience was last swapped to, if it is connected right now. */
export function savedAudienceDisplay(): Display | null {
  return findDisplay(stored.audienceMonitor);
}

function save(): void {
  void writeFile(file(), JSON.stringify(stored, null, 2)).catch(() => {
    /* not being able to save a preference must never break the app */
  });
}

/**
 * Remembers the roles chosen with "Swap screens", so the next presentation starts that way.
 * The speaker display is the same setting the settings dialog shows.
 */
export function rememberRoles(speaker: Display, audience: Display): void {
  stored.speakerMonitor = describe(speaker);
  stored.audienceMonitor = describe(audience);
  save();
}

export function getSettings(): Settings {
  return {
    speakerMonitorId: savedSpeakerDisplay()?.id ?? null,
    theme: stored.theme,
    language: stored.language,
    uiLanguage: uiLanguage(),
  };
}

/** Applies a change and writes it to disk straight away (there is no "save" button). */
export function updateSettings(patch: SettingsPatch): Settings {
  if (patch.speakerMonitorId !== undefined) {
    const chosen = sortedDisplays().find((d) => d.id === patch.speakerMonitorId);
    stored.speakerMonitor = chosen ? describe(chosen) : null;
    // A speaker display picked by hand replaces whatever the last swap left.
    stored.audienceMonitor = null;
  }
  if (patch.theme !== undefined && isThemeSetting(patch.theme)) {
    stored.theme = patch.theme;
    applyTheme();
  }
  if (patch.language !== undefined && isLanguageSetting(patch.language)) {
    stored.language = patch.language;
  }
  save();
  return getSettings();
}
