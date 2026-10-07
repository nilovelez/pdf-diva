# Developer guide

Everything a new developer (or agent) needs that is not obvious from the code. Project rules and conventions are in [`CLAUDE.md`](../CLAUDE.md); user-facing text is in the README and CHANGELOG; the website is covered in [`website.md`](website.md).

State at the time of writing: **v1.0.0 is published** (GitHub release + Microsoft Store listing). Milestone 7 (multi-language: English and Spanish) is v1.1.0, milestone 8 (opening PDFs from the system, "Open with…") is v1.2.0; next is milestone 9 (multi-monitor and UI improvements), then milestone 10 (Mac and Linux; Linux means Debian and Ubuntu only).

## Architecture

PDF Diva is an Electron app written in strict TypeScript, with no UI framework. PDFs are rendered with PDF.js (`pdfjs-dist`). Everything is bundled into `dist/` by esbuild (`esbuild.mjs`).

```
src/
  main/            Main process. Kept thin: windows, displays, IPC, state.
    main.ts          App lifecycle, IPC handlers, "last PDF that opened fine", offline guard
    presentation.ts  The single source of truth of a presentation + window layout engine
    windows.ts       createWindow(): shared preload, navigation locked down
    displays.ts      Display ordering (main first, then left to right) and DisplayInfo
    settings.ts      settings.json in userData (speaker monitor, theme), nativeTheme
  preload/         contextBridge API (typed by src/types/ipc.ts)
  renderer/
    launcher/        Start screen + reader (thumbnails, dialogs for settings and password)
    presenter/       Speaker view (timer, current + next slide, controls)
    audience/        Full-screen slide on black
    shared/          pdf.ts (PDF.js), pageview.ts (render queue + cache), session.ts, keys.ts,
                     icons.ts (SVG inlined at build time), theme.css (design tokens)
  types/           ipc.ts: every IPC channel and message type lives here
  i18n/            i18n.ts: language list, system language matching, translate()
locales/           UI text, one JSON file per language (en.json is the reference)
resources/icons/     Phosphor UI icons (MIT) ; resources/icons/app/ = app icon set (icon.ico, appx/ tiles)
electron-builder.yml Packaging (NSIS + MSIX)
site/                The website (see website.md); scripts/build-privacy.mjs builds its privacy page
```

### Presentation model

- The main process owns the state: `{ page, total, blank, displayCount }` plus the PDF bytes and password (memory only). Windows send actions (`next`, `prev`, `first`, `last`, `goto`, `toggleBlack`, `swapScreens`, `exit`) and receive the new state. Only presentation windows may read or control it (sender is checked).
- Every window loads the PDF itself with PDF.js (the bytes come through IPC once). Rendering lives in the renderers, never in main.
- Two modes: `presenter` (speaker view on the chosen/main display + audience on another) and `mirror` (an audience window on every display, no speaker view).
- `applyLayout()` in `presentation.ts` places windows for the displays connected right now. It runs at start and on `display-added/removed/metrics-changed` (debounced). Behaviour: with one display left the speaker window is **hidden, not closed** (so the timer survives) and the audience takes the remaining display; when a display returns, the speaker view comes back with the same slide and timer. "Swap screens" swaps roles (2 displays) or rotates the audience (3+), and saves the result (`rememberRoles()` in `settings.ts`: speaker display + audience display) so the next presentation, even after a restart, starts that way. Roles are resolved in `resolveRoles()`: this presentation's choice, then the saved displays, then the defaults (main display for the speaker, any other for the audience). Started with one display: speaker view only, in a normal window.
- The reader (launcher) window is **hidden** during a presentation, not closed (closing it ends the presentation and quits): `hideLauncherWhenShown()` hides it once the first presentation window is shown, and `endPresentation()` shows it again with its PDF and page.
- **PDFs from the system** (`main.ts`): one instance only (`requestSingleInstanceLock`). A PDF on the command line (first start) or in a second launch's `argv` (`second-instance`) ends any presentation, brings the launcher forward and is sent to it (`systemOpen`), which opens it like a dropped file. `file://` URIs are accepted for Linux file managers. Mac will need `app.on('open-file')` (milestone 10).
- The "last PDF that opened fine" is tracked in main with an id: the launcher calls `pdfOpened(id)` only after PDF.js loaded it, so a corrupt or cancelled-password file can never be what gets presented.

### Rendering (`shared/pageview.ts`)

One render at a time per canvas, new requests cancel the old one, pages are rendered off screen and copied when complete (the visible page never blanks), and the neighbours (next, then previous) are pre-rendered into a small cache keyed by page and box size. Thumbnails render lazily with an `IntersectionObserver`. PDF.js needs its worker plus `wasm/`, `cmaps/`, `standard_fonts/`, `iccs/` next to the renderers; `esbuild.mjs` copies them to `dist/renderer/shared/`.

### Offline and hardening

The app must make **no network connections** (PRIVACY.md depends on it): CSP `default-src 'self'`, spellcheck disabled (Chromium downloads dictionaries), every `http(s)/ws(s)/ftp` request cancelled in the default session, windows cannot navigate or open new windows, and the only outbound action is `shell.openExternal` with one fixed URL (the website). Keep it that way when adding features.

### Settings

`app.getPath('userData')/settings.json`: `speakerMonitor` (id + label/size/position as a fallback match), `audienceMonitor` (same format; set only by "Swap screens", cleared when the speaker display is chosen in the settings), `theme` (`system|light|dark`, applied with `nativeTheme.themeSource`) and `language` (`system` or a language code). The folder is named after `productName` (`%APPDATA%\PDF Diva`; MSIX virtualizes it into the package's `LocalCache`). Renaming the product resets users' settings.

### UI text and translation

All UI text is in `locales/<code>.json`: flat keys grouped by screen (`reader.pageOf`), `{name}` placeholders, and `**bold**` as the only markup. `en.json` is the reference: `MessageKey` is derived from it, so `typecheck` rejects an unknown key, and a key missing from another language falls back to English. The files are bundled by esbuild (nothing is loaded at run time). How to add a language: [`translating.md`](translating.md).

- **Choosing the language** (main, `settings.ts`): the `language` setting, or with `system` the first of `app.getPreferredSystemLanguages()` whose base code (`es-MX` → `es`) the app has; English otherwise.
- **Getting it to a window**: `createWindow()` adds `--pdfdiva-language=<code>` to the renderer's command line (`additionalArguments`); the preload reads it and exposes `window.presenter.language`. It is synchronous, so each page translates itself before it is first painted.
- **In the pages** (`renderer/shared/i18n.ts`): static text is marked in the HTML with `data-i18n="key"` (text), `data-i18n-title` and `data-i18n-label` (`aria-label`), and `translatePage()` fills them; text built in code uses `t(key, vars)`. `setRichText()` turns `**bold**` into `<b>` without ever parsing HTML, so a translation file cannot inject markup.
- **Changing it**: only the launcher has settings. `setSettings` returns the resolved `uiLanguage`; the launcher calls `setLanguage()` and refreshes its dynamic text (page label, settings lists), so the open PDF stays open. Presentation windows get the language when they are created. The main process's own text (open dialog, initial window titles) uses `t()` from `settings.ts`.
- **Layout**: labels must survive longer languages. A pseudo-locale check (every text 40% longer) passes at the default window sizes; the two-display reader toolbar is the tightest place. Keep one-line labels on one line (`white-space: nowrap`), as the reader's page label does.

## Commands

| Command | What it does |
|---|---|
| `npm install` | Install dependencies. npm 11 blocks install scripts unless approved; the approved ones are pinned in `package.json` (`allowScripts`, currently esbuild only; do not approve `electron-winstaller`, Squirrel is not used) |
| `npm run dev` | Build and start the app |
| `npm run build` | esbuild bundles into `dist/` |
| `npm run typecheck` / `npm run lint` | `tsc --noEmit` / ESLint (must pass before every commit) |
| `npm run pack` | Unpacked packaged app in `release/win-unpacked/` (quick check) |
| `npm run dist` | NSIS installer: `release/PDF-Diva-Setup-<version>.exe` |
| `npm run dist:store` | MSIX package: `release/PDF-Diva-<version>.appx` (unsigned: the Store signs it) |

There are no automated tests. Behaviour is checked by running the real app and driving it through the Chromium DevTools protocol (see "Testing" below).

## Packaging

- `electron-builder.yml` is the single configuration. `directories.buildResources` is `resources/icons/app`. `files` ships only `dist/` (PDF.js and everything else is already bundled). Licenses are copied into `resources/licenses/` of the app (`extraResources`); Electron adds `LICENSE.electron.txt` and `LICENSES.chromium.html` itself.
- NSIS: per-user, no admin rights, desktop + Start menu shortcuts, `deleteAppDataOnUninstall: true` (updates keep settings, a real uninstall removes them). Unsigned, so SmartScreen warns; this is documented in the README.
- **"Open with…" for PDFs, never the default** (milestone 8): PDF Diva registers as one more app that can open PDFs; the user makes it the default if they want ("Open with > Always"). The installer must never claim the default. That is why electron-builder's `fileAssociations` is **not** used: its NSIS macro also sets the `.pdf` key's default value. Instead:
  - NSIS: `resources/installer.nsh` (`nsis.include`), per user (HKCU): ProgID `PDFDiva.pdf` (open command `"PDF Diva.exe" "%1"`) plus a value in `.pdf\OpenWithProgids`. Uninstalling deletes exactly those. Verified on Windows 11: the user's default (`UserChoice`) and the machine's `.pdf` default are unchanged, `SHAssocEnumHandlers` lists PDF Diva, and the registry is back to its previous state after uninstalling.
  - MSIX: `resources/appx-extensions.xml` (`appx.customExtensionsPath`), a `uap:FileTypeAssociation` for `.pdf`. Packaged apps cannot make themselves the default.
  - Mac and Linux (milestone 10): `mac.fileAssociations` with `rank: Alternate`, and `linux.mimeTypes: [application/pdf]` in the `.deb` (Debian/Ubuntu only).
- MSIX (`appx` target): `runFullTrust` (Electron needs it). Identity values come from Partner Center and are in `electron-builder.yml` (`4095RedViral.PDFDiva`, publisher `CN=140CA302-E9F8-47D7-BC52-9FEFCB98772E`, display name "Nilo Vélez"); the version in the manifest is `<version>.0`. The Store requires a first version number of 1 or more.
- Building the MSIX needs `makeappx.exe` and, because the tiles come in several scales, `makepri.exe`, from the Windows SDK. electron-builder bundles old copies that **do not start on current Windows 11**; the fix is to put working ones where electron-builder looks (its cache, `winCodeSign-*/…/windows-10/x64`). The details for the build machine are in the project memory (`marcianito-machine`).
- Do **not** try to sideload the unsigned MSIX: Windows refuses unsigned packages that run an `.exe`. A package signed with a self-signed test certificate (subject = the manifest Publisher) did not install on the user's test machine either ("the publisher's certificate can't be verified", even with the certificate imported and developer mode on). Registering the unpacked folder with `Add-AppxPackage -Register AppxManifest.xml` in developer mode (publisher without the unsigned-namespace OID) is what worked for testing MSIX behaviour (settings virtualization, offline, drag and drop, displays). Test installer behaviour with the NSIS build.

## Release flow

1. Work in small commits (English, `feat:`/`fix:`/`chore:`/`docs:`), `typecheck` and `lint` green. A single agent session writes to `main`; unfinished milestone work goes on a pushed `feat/...` branch so another session can pick it up.
2. The `development` branch belongs to the user, for manual edits. Before pushing, fetch it; if it has new commits, review them, merge them into `main` (merge commit, no rebase), check `typecheck` and `lint`, push `main`, then fast-forward `development` to `main` and push it.
3. At a milestone close: CHANGELOG entry and README, bump the version (`npm version X.Y.Z --no-git-tag-version`, commit), annotated tag (`git tag -a vX.Y.Z -m "Milestone N: …"`), `git push origin main` and `git push origin vX.Y.Z` as separate plain commands, then stop until the user has tested it.
4. The **user** creates the GitHub release from the web (there is no `gh` on the build machine) with the installer attached, and uploads the `.appx` to Partner Center. The agent prepares the release text (the CHANGELOG entry plus the SmartScreen note) and leaves the installer and `.appx` in the shared folder.
5. Pushing `site/` or `PRIVACY.md` redeploys the website (GitHub Actions).

## Testing

Launch the app with `electron . --remote-debugging-port=9333` (or a packaged `.exe` with the same flag), connect to `http://127.0.0.1:9333/json`, and use the DevTools protocol over WebSocket: `Runtime.evaluate` to read/click, `Input.dispatchKeyEvent` for keys, `Input.dispatchDragEvent` with `files: [path]` for real drag and drop. Settings can be isolated with `app.setPath('userData', …)` from a small launcher script. A password-protected PDF can be generated with a few lines of Node (RC4 40-bit, standard security handler). Multi-monitor behaviour is tested by toggling a display (`DisplaySwitch.exe /internal` and `/extend`) while a presentation runs.

## Backlog (not scheduled)

Milestone 9 (multi-monitor and UI improvements, from user feedback). First, adapt the UI to different resolutions and pixel densities; then change the behaviour with three monitors:

- Speaker view that adapts better to large resolutions (at 1280×720 CSS it leaves empty space around the slides).
- More than two monitors: two speaker views (technician + speaker) and one audience output.

Agreed design for the displays (mockup: `docs/design/mockup-displays.html`, open it in a browser):

- **One display:** the reader shows only **Present**. It opens the audience view full screen, with no buttons and no speaker view, like any PDF viewer in full screen; the speaker uses the keyboard shortcuts or a slide clicker (Esc and B included). This replaces today's behaviour (speaker view in a normal window); CLAUDE.md already describes the new one.
- **Two or more displays:** the reader shows **Configure displays** and **Present**. Present is the main action (accent colour). The "With speaker view" and "Mirror screens" buttons go away: mirroring is every display set to Audience View. F5 and Shift+F5 do the same as Present.
- **Configure displays** is its own dialog: the displays drawn at scale, placed as in the Windows arrangement, and one row per display (number, system name with a "Main" tag, resolution and scale, selector "Speaker View" / "Audience View"). The built-in display of a laptop (`display.internal`) is called "Built-in display", translated; check what name Windows gives each display. Changes apply only with **Apply** (enabled when something changed), with **Cancel** next to it. Apply is disabled with the message "At least one display must be the Audience View." when no display is left as audience. If a display is connected or disconnected while the dialog is open, it closes without applying.
- **Settings** (gear) keeps only theme and language, applied instantly as today.
- **Defaults:** 2 displays = main display speaker view, the other audience; 3 displays = two speaker views (technician and speaker) and the audience on the last display (displays ordered main first, then left to right). 4 or more: not decided yet, ask the user.
- **Speaker view:** "Swap screens" is replaced by "Configure displays" (only with two or more displays). It opens the same dialog over the speaker view; Apply moves the windows without stopping the presentation. The timer is shared by every speaker view (today each window has its own); black screen is already shared state.
- **Hot plug:** a presentation started on one display switches to the saved configuration when a second display is connected (as today it switches to the speaker view).
- Displays are recognised between runs as today (id, then name and size).

Milestone 10: Mac and Linux builds (Linux: Debian and Ubuntu only).
