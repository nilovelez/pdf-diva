# Website maintenance

The PDF Diva website is a static site published with GitHub Pages: <https://nilovelez.github.io/pdf-diva/>. It has no framework, no build step and no dependencies. This file is what you need to keep it running.

## Rules

- **No analytics, no cookies, no third-party resources.** No external fonts, CDNs, scripts or embeds. The site must stay consistent with `PRIVACY.md`. The only thing stored is the theme choice, in the visitor's own `localStorage`.
- No frameworks and no build tools. Plain HTML, CSS and a small JS file.
- Colors come from the app's palette (`src/renderer/shared/theme.css`); do not invent new ones. Accent: fuchsia `#C2185B` in light, gold `#E8BA30` in dark.
- UI icons are Phosphor Regular, inlined as SVG (credited in `THIRD-PARTY-NOTICES.md`).
- Everything in the repo is in English.
- The agent session writes to `main`; manual edits by the user go on the `development` branch and are merged from there (see the release flow in `docs/developer-guide.md`).

## Structure

```
site/
  index.html              The landing page (single page, English)
  privacy.html            Generated at deploy time, not in git (see below)
  assets/css/site.css     Light and dark palettes, layout, sticky header
  assets/js/theme.js      Sun/moon switch; stores the choice in localStorage
  assets/img/             Icons, favicon, og.png and the two screenshots
.github/workflows/pages.yml   Publishes site/ to GitHub Pages
scripts/build-privacy.mjs     Builds site/privacy.html from PRIVACY.md
```

Theme: it follows the system by default (`prefers-color-scheme`) and can be forced with `data-theme="light|dark"` on `<html>`. A small inline script in `<head>` applies the saved choice before first paint. The screenshots alternate with the theme through the `.only-light` and `.only-dark` classes.

The header is sticky, so the theme switch stays visible while scrolling. Under the screenshot, "Dark Theme" / "Light Theme" buttons do the same: `theme.js` handles every `[data-set-theme]` button on the page, so both switches stay in sync.

## Privacy page

`site/privacy.html` is generated from `PRIVACY.md` by `scripts/build-privacy.mjs`, so the page at the stable URL always matches the repository file. It is listed in `.gitignore`; do not commit it. The script handles only the Markdown that `PRIVACY.md` uses (headings, paragraphs, bullet lists, links, bold, italics). If `PRIVACY.md` starts using something else, extend the script.

The script also appends a "This website" section (no cookies or third-party resources; GitHub Pages logs visitors' IP addresses). That text lives in the script, not in `PRIVACY.md`.

To preview locally:

```
node scripts/build-privacy.mjs
npx serve site
```

The privacy URL `https://nilovelez.github.io/pdf-diva/privacy.html` is used in the Microsoft Store listing. Do not rename it.

## Deployment

`.github/workflows/pages.yml` runs on every push to `main` that touches `site/`, `PRIVACY.md`, `scripts/build-privacy.mjs` or the workflow itself (and manually with "Run workflow"). It runs the privacy script and uploads `site/`. GitHub Pages is set to Source = GitHub Actions in the repository settings.

## Images

- **Icons**: the masters live in `resources/icons/app/` (used by the app, the installer and the Store; do not move them). The web copies are `favicon.ico`, `icon-256.png` and `icon_64.png` (as `icon-64.png`).
- **`apple-touch-icon.png` (180) and `og.png` (1200×630)**: `og.png` is the dark background `#1D1C1B`, the rounded icon, "PDF Diva" and the tagline. They keep their current design on purpose.
- **`star-icon.png`**: the small star next to "PDF Diva" in the header.
- **`ms-store-badge-light.svg` / `ms-store-badge-dark.svg`**: Microsoft's official "Download from the Microsoft Store" badge (en-US), in the hero and the closing section, one per theme (`.only-light` / `.only-dark`), as tall as the buttons next to it. Microsoft's asset, used under its badge guidelines (see `THIRD-PARTY-NOTICES.md`): don't edit it.
- **Screenshots**: `screenshot-light.webp` and `screenshot-dark.webp` are the presenter view at 1920×1080 (150% scaling), same content in each theme. The originals are in OneDrive, `BOB Shared\PDF Presenter\`: `capturas-150/` (150% scaling, the ones used, files `light-3-presenter.png` and `dark-3-presenter.png`) and `capturas/` (100% scaling). They were converted to WebP at full resolution, quality 92, using the canvas of the project's own Electron (`canvas.toDataURL('image/webp', 0.92)`); any WebP encoder works. Keep the `width` and `height` attributes in `index.html` in sync with the files.

## Releasing a new version

1. In `site/index.html`, change the version in the `meta` line under the hero buttons.
2. Update the two "Download installer" links (hero and closing section). They point to the exact file, `https://github.com/nilovelez/pdf-diva/releases/download/vX.Y.Z/PDF-Diva-Setup-X.Y.Z.exe`.
3. Check that the file exists on the GitHub release before pushing these changes (the user creates the release, so this push comes after it).

The Microsoft Store badges (hero and closing section) link to the live listing, `https://apps.microsoft.com/detail/9nh5x0qbmhq1`. They need no change per release.

## Pending

- Text says "Mac and Linux coming soon" in the hero and the closing section; update it if that changes.
- The Store listing texts are in `docs/store-listing.md` (not published on the site).
