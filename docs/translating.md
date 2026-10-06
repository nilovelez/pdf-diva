# Translating PDF Diva

PDF Diva's interface text lives in [`locales/`](../locales), one JSON file per language. Adding or improving a language only takes a text editor.

## Improve an existing translation

Edit the language's file (for example `locales/es.json`) and open a pull request. Change only the text on the right of each line, never the key on the left.

## Add a new language

1. Copy `locales/en.json` to `locales/<code>.json`, where `<code>` is the two-letter [ISO 639-1 code](https://en.wikipedia.org/wiki/List_of_ISO_639-1_codes) of the language (`fr`, `de`, `pt`…). PDF Diva matches languages by this base code, so one file serves every regional variant (`pt` covers both `pt-PT` and `pt-BR`).
2. Set `_language` to the language's name written in that language (`Français`, `Deutsch`, `Português`). That is how it appears in the settings, so people can find it whatever language the app is showing.
3. Translate every value.
4. Register the file in [`src/i18n/i18n.ts`](../src/i18n/i18n.ts): import it next to the others and add it to `CATALOGS`. That is the only code change.
5. Open a pull request. If you can, run the app (`npm install`, then `npm run dev`), choose the language in Settings and look at every screen: the start screen, the reader, the settings and password dialogs, and the speaker view.

If a key is missing from a language file, the app shows the English text for it, so a partial translation never breaks anything.

## Rules for the text

- **Keep the placeholders.** Words in braces, like `{page}` or `{name}`, are replaced by numbers or file names. Keep them exactly as they are (you can move them within the sentence).
- **Keep the `**bold**` marks** where the English has them (only a few lines use them).
- **Short and sober.** PDF Diva is used by technicians in a hurry, often in a dark room. Buttons should be one to three words. Error messages say what happened, plainly, without jokes.
- **Same words as Windows** for things Windows already names in your language (settings, display, theme, dark, light).
- **Quotation marks** follow your language's typography (“ ” in English, « » in Spanish and French, „ “ in German).
- The keys group the text by screen: `welcome.*` (start screen), `reader.*` (the PDF reader), `settings.*`, `password.*`, `presenter.*` (the speaker view), `audience.*` (the window the audience sees: only its title), `open.*` and `presentation.*` (error messages).

Thank you for helping.
