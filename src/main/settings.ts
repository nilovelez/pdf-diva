import { app, nativeTheme, type Display } from 'electron';
import { readFileSync } from 'node:fs';
import { writeFile } from 'node:fs/promises';
import path from 'node:path';
import { isLanguage, resolveLanguage, translate, type Language, type MessageKey } from '../i18n/i18n';
import type {
  DisplayRole,
  LanguageSetting,
  Settings,
  SettingsPatch,
  ThemeSetting,
} from '../types/ipc';

/** What identifies a display across runs: its id, with label and geometry as a fallback. */
interface StoredMonitor {
  id: number;
  label: string;
  width: number;
  height: number;
  x: number;
  y: number;
}

interface StoredRole {
  monitor: StoredMonitor;
  role: DisplayRole;
}

interface StoredSettings {
  /** Roles chosen in "Configure displays", including displays not connected right now. */
  displayRoles: StoredRole[];
  theme: ThemeSetting;
  language: LanguageSetting;
}

/** Enough for every display a laptop meets in its life; the oldest are forgotten first. */
const MAX_STORED_ROLES = 32;
const THEMES: readonly ThemeSetting[] = ['system', 'light', 'dark'];
let stored: StoredSettings = {
  displayRoles: [],
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

function isStoredRole(value: unknown): value is StoredRole {
  if (typeof value !== 'object' || value === null) return false;
  const { monitor, role } = value as Record<string, unknown>;
  return isStoredMonitor(monitor) && (role === 'speaker' || role === 'audience');
}

export function isThemeSetting(value: unknown): value is ThemeSetting {
  return THEMES.includes(value as ThemeSetting);
}

export function isLanguageSetting(value: unknown): value is LanguageSetting {
  return value === 'system' || isLanguage(value);
}

/**
 * Display roles from the file. Up to 1.2.0 the file had the speaker display and the display the
 * audience was last swapped to; they become the same roles.
 */
function readRoles(raw: Record<string, unknown>): StoredRole[] {
  if (Array.isArray(raw.displayRoles)) return raw.displayRoles.filter(isStoredRole);
  const roles: StoredRole[] = [];
  if (isStoredMonitor(raw.speakerMonitor)) roles.push({ monitor: raw.speakerMonitor, role: 'speaker' });
  if (isStoredMonitor(raw.audienceMonitor)) roles.push({ monitor: raw.audienceMonitor, role: 'audience' });
  return roles;
}

/** Reads the settings file (a missing or damaged file just means the defaults). */
export function loadSettings(): void {
  try {
    const raw: unknown = JSON.parse(readFileSync(file(), 'utf8'));
    if (typeof raw !== 'object' || raw === null) return;
    const values = raw as Record<string, unknown>;
    stored = {
      displayRoles: readRoles(values),
      theme: isThemeSetting(values.theme) ? values.theme : 'system',
      language: isLanguageSetting(values.language) ? values.language : 'system',
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

const sameMonitor = (saved: StoredMonitor, display: Display): boolean =>
  saved.label !== '' &&
  saved.label === display.label &&
  saved.width === display.size.width &&
  saved.height === display.size.height;

/** The role saved for a connected display (matched by id, else by name and size), or null. */
export function savedRole(display: Display): DisplayRole | null {
  const entry =
    stored.displayRoles.find((r) => r.monitor.id === display.id) ??
    stored.displayRoles.find((r) => sameMonitor(r.monitor, display));
  return entry?.role ?? null;
}

function save(): void {
  void writeFile(file(), JSON.stringify(stored, null, 2)).catch(() => {
    /* not being able to save a preference must never break the app */
  });
}

/** Remembers the role of each of these displays; roles of other displays are kept. */
export function saveRoles(roles: { display: Display; role: DisplayRole }[]): void {
  const fresh = roles.map(({ display, role }) => ({ monitor: describe(display), role }));
  const others = stored.displayRoles.filter(
    (r) => !roles.some(({ display }) => r.monitor.id === display.id || sameMonitor(r.monitor, display)),
  );
  stored.displayRoles = [...fresh, ...others].slice(0, MAX_STORED_ROLES);
  save();
}

export function getSettings(): Settings {
  return {
    theme: stored.theme,
    language: stored.language,
    uiLanguage: uiLanguage(),
  };
}

/** Applies a change and writes it to disk straight away (there is no "save" button). */
export function updateSettings(patch: SettingsPatch): Settings {
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
