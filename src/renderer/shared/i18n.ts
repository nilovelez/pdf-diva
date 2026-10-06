// Translation for the windows. Static text in the HTML is marked with attributes:
//   data-i18n="key"        text content (the only markup allowed is **bold**)
//   data-i18n-title="key"  title attribute (tooltip)
//   data-i18n-label="key"  aria-label attribute
// Text built in TypeScript uses t().
import { translate, type Language, type MessageKey, type MessageVars } from '../../i18n/i18n';

let language: Language = window.presenter.language;

export function t(key: MessageKey, vars?: MessageVars): string {
  return translate(language, key, vars);
}

/** Sets text where **double asterisks** mark bold, without ever parsing it as HTML. */
export function setRichText(el: Element, text: string): void {
  el.replaceChildren(
    ...text.split('**').map((part, i) => {
      if (i % 2 === 0) return document.createTextNode(part);
      const bold = document.createElement('b');
      bold.textContent = part;
      return bold;
    }),
  );
}

/** Translates every marked element of the page. */
export function translatePage(): void {
  document.documentElement.lang = language;
  document.querySelectorAll<HTMLElement>('[data-i18n]').forEach((el) => {
    setRichText(el, t(el.dataset.i18n as MessageKey));
  });
  document.querySelectorAll<HTMLElement>('[data-i18n-title]').forEach((el) => {
    el.title = t(el.dataset.i18nTitle as MessageKey);
  });
  document.querySelectorAll<HTMLElement>('[data-i18n-label]').forEach((el) => {
    el.setAttribute('aria-label', t(el.dataset.i18nLabel as MessageKey));
  });
}

/** Switches this window to another language and retranslates the static text. */
export function setLanguage(next: Language): void {
  language = next;
  translatePage();
}
