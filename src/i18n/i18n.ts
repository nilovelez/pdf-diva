// UI text. Each language is a flat JSON file in locales/ (see docs/translating.md), bundled into
// the app at build time. English is the reference: it has every key, and any key missing from
// another language falls back to it, so an incomplete translation never breaks the app.
import en from '../../locales/en.json';
import es from '../../locales/es.json';

export type MessageKey = Exclude<keyof typeof en, '_language'>;
type Catalog = { _language: string } & Partial<Record<MessageKey, string>>;

const CATALOGS = { en, es } satisfies Record<string, Catalog>;

export type Language = keyof typeof CATALOGS;
export const LANGUAGES = Object.keys(CATALOGS) as Language[];
export const DEFAULT_LANGUAGE: Language = 'en';

export function isLanguage(value: unknown): value is Language {
  return typeof value === 'string' && (LANGUAGES as string[]).includes(value);
}

/** The language's name in that same language, for the language selector. */
export function languageName(language: Language): string {
  return CATALOGS[language]._language;
}

/**
 * The first language in `preferred` (BCP 47 tags, most preferred first, e.g. the system's
 * languages) that the app has, matched by base language ("es-MX" → "es"); English otherwise.
 */
export function resolveLanguage(preferred: readonly string[]): Language {
  for (const tag of preferred) {
    const base = tag.toLowerCase().split(/[-_]/)[0];
    if (isLanguage(base)) return base;
  }
  return DEFAULT_LANGUAGE;
}

export type MessageVars = Record<string, string | number>;

/** The text for `key` in `language`, with `{name}` placeholders replaced by `vars`. */
export function translate(language: Language, key: MessageKey, vars: MessageVars = {}): string {
  const catalog: Catalog = CATALOGS[language];
  const text = catalog[key] ?? en[key];
  return text.replace(/\{(\w+)\}/g, (match, name: string) =>
    name in vars ? String(vars[name]) : match,
  );
}
