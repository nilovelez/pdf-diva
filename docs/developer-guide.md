# Developer guide

Everything a new developer (or agent) needs that is not obvious from the code. Project rules and conventions are in [`CLAUDE.md`](../CLAUDE.md); user-facing text is in the README and CHANGELOG; the website is covered in [`website.md`](website.md).

State at the time of writing: **v1.3.0 is published**. Milestone 7 (multi-language: English and Spanish) is v1.1.0, milestone 8 (opening PDFs from the system, "Open with…") is v1.2.0, milestone 9 (multi-monitor and UI improvements) is v1.3.0; milestone 10 (Mac and Linux; Linux means Debian and Ubuntu only) is in progress, Mac first.

## Architecture

PDF Diva is an Electron app written in strict TypeScript, with no UI framework. PDFs are rendered with PDF.js (`pdfjs-dist`). Everything is bundled into `dist/` by esbuild (`esbuild.mjs`).

```
src/
  main/            Main process. Kept thin: windows, displays, IPC, state.
    main.ts          App lifecycle, IPC handlers, "last PDF that opened fine", offline guard
    presentation.ts  The single source of truth of a presentation + window layout engine
    windows.ts       createWindow(): shared preload, navigation locked down; full screen per platform
    menu.ts          Application menu: none on Windows/Linux, a minimal one on macOS
    displays.ts      Display ordering (main first, then left to right), roles, DisplayInfo
    settings.ts      settings.json in userData (display roles, theme, language), nativeTheme
  preload/         contextBridge API (typed by src/types/ipc.ts)
  renderer/
    launcher/        Start screen + reader (thumbnails, dialogs for settings and password)
    presenter/       Speaker view (timer, current + next slide, controls)
    audience/        Full-screen slide on black
    shared/          pdf.ts (PDF.js), pageview.ts (render queue + cache), session.ts, keys.ts,
                     icons.ts (SVG inlined at build time), theme.css (design tokens),
                     displays-dialog.ts + dialog.css ("Configure displays", reader and speaker view)
  types/           ipc.ts: every IPC channel and message type lives here
  i18n/            i18n.ts: language list, system language matching, translate()
locales/           UI text, one JSON file per language (en.json is the reference)
resources/icons/     Phosphor UI icons (MIT) ; resources/icons/app/ = app icon set (icon.ico, appx/ tiles)
resources/displays/  Our own drawings for the "Configure displays" tiles (laptop/monitor, speaker/audience)
electron-builder.yml Packaging (NSIS + MSIX on Windows, dmg on macOS)
site/                The website (see website.md); scripts/build-privacy.mjs builds its privacy page
```

### Presentation model

- The main process owns the state: `{ page, total, blank, displayCount, timer }` plus the PDF bytes and password (memory only). Windows send actions (`next`, `prev`, `first`, `last`, `goto`, `toggleBlack`, `toggleTimer`, `resetTimer`, `exit`) and receive the new state. Only presentation windows may read or control it (sender is checked). The timer is `{ running, elapsedMs, since }` (`since` is a `Date.now()`), so every speaker view shows the same time.
- Every window loads the PDF itself with PDF.js (the bytes come through IPC once). Rendering lives in the renderers, never in main.
- **Display roles**: each display shows the speaker view or the audience view (`displayRoles()` in `displays.ts`). With one display: audience only. Otherwise a display keeps the role saved in "Configure displays" and the others get the default (audience on the last display, speaker view on the rest; displays ordered main first, then left to right). There is always an audience: if none is left (its display was unplugged), the last display without a saved role becomes it, else the defaults apply. All displays as audience = mirroring.
- `applyLayout()` in `presentation.ts` gives each display its window (`reconcile()` reuses windows where it can). It runs at start, on `display-added/removed/metrics-changed` (debounced) and when the roles change (`setDisplayRoles`, applied at once). Every presentation window is frameless and full screen; speaker views are placed only after they have painted (`readyWindows`). A presentation that loses its last speaker view keeps the timer in main, so a returning speaker view shows the right time.
- The reader (launcher) window is **hidden** during a presentation, not closed (closing it ends the presentation and quits): `hideLauncherWhenShown()` hides it once the first presentation window is shown, and `endPresentation()` shows it again with its PDF and page.
- **PDFs from the system** (`main.ts`): one instance only (`requestSingleInstanceLock`). A PDF on the command line (first start) or in a second launch's `argv` (`second-instance`) ends any presentation, brings the launcher forward and is sent to it (`systemOpen`), which opens it like a dropped file. `file://` URIs are accepted for Linux file managers. macOS sends files with `app.on('open-file')` instead, also the one that launches the app, before the reader has loaded: it waits in `startupPdf` until `did-finish-load`.
- The "last PDF that opened fine" is tracked in main with an id: the launcher calls `pdfOpened(id)` only after PDF.js loaded it, so a corrupt or cancelled-password file can never be what gets presented.

### Rendering (`shared/pageview.ts`)

One render at a time per canvas, new requests cancel the old one, pages are rendered off screen and copied when complete (the visible page never blanks), and the neighbours (next, then previous) are pre-rendered into a small cache keyed by page and box size. Thumbnails render lazily with an `IntersectionObserver`. PDF.js needs its worker plus `wasm/`, `cmaps/`, `standard_fonts/`, `iccs/` next to the renderers; `esbuild.mjs` copies them to `dist/renderer/shared/`.

### Offline and hardening

The app must make **no network connections** (PRIVACY.md depends on it): CSP `default-src 'self'`, spellcheck disabled (Chromium downloads dictionaries), every `http(s)/ws(s)/ftp` request cancelled in the default session, windows cannot navigate or open new windows, and the only outbound action is `shell.openExternal` with one fixed URL (the website). Keep it that way when adding features.

### Settings

`app.getPath('userData')/settings.json`: `displayRoles` (a list of `{ monitor, role }`, where `monitor` is the display id plus label/size/position for a fallback match by label and size; roles of displays not connected are kept, up to 32; up to 1.2.0 the file had `speakerMonitor`/`audienceMonitor`, read as roles), `lastFolder` (folder of the last PDF that opened fine, however it was opened; the Open dialog starts there if it still exists; not shown in Settings, mentioned in PRIVACY.md), `theme` (`system|light|dark`, applied with `nativeTheme.themeSource`) and `language` (`system` or a language code). The folder is named after `productName` (`%APPDATA%\PDF Diva`; MSIX virtualizes it into the package's `LocalCache`). Renaming the product resets users' settings.

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
| `npm run dist:mac` | macOS only: universal dmg, `release/PDF-Diva-<version>.dmg` (normally built by GitHub Actions) |

There are no automated tests apart from `scripts/smoke-test.mjs` (`node scripts/smoke-test.mjs <app executable>`), a short end-to-end run that the Mac build runs in CI and that also works on Windows. Behaviour is checked by running the real app and driving it through the Chromium DevTools protocol (see "Testing" below).

## Packaging

- `electron-builder.yml` is the single configuration. `directories.buildResources` is `resources/icons/app`. `files` ships only `dist/` (PDF.js and everything else is already bundled). Licenses are copied into `resources/licenses/` of the app (`extraResources`); Electron adds `LICENSE.electron.txt` and `LICENSES.chromium.html` itself.
- NSIS: per-user, no admin rights, desktop + Start menu shortcuts, `deleteAppDataOnUninstall: true` (updates keep settings, a real uninstall removes them). Unsigned, so SmartScreen warns; this is documented in the README.
- **"Open with…" for PDFs, never the default** (milestone 8): PDF Diva registers as one more app that can open PDFs; the user makes it the default if they want ("Open with > Always"). The installer must never claim the default. That is why electron-builder's `fileAssociations` is **not** used: its NSIS macro also sets the `.pdf` key's default value. Instead:
  - NSIS: `resources/installer.nsh` (`nsis.include`), per user (HKCU): ProgID `PDFDiva.pdf` (open command `"PDF Diva.exe" "%1"`) plus a value in `.pdf\OpenWithProgids`. Uninstalling deletes exactly those. Verified on Windows 11: the user's default (`UserChoice`) and the machine's `.pdf` default are unchanged, `SHAssocEnumHandlers` lists PDF Diva, and the registry is back to its previous state after uninstalling.
  - MSIX: `resources/appx-extensions.xml` (`appx.customExtensionsPath`), a `uap:FileTypeAssociation` for `.pdf`. Packaged apps cannot make themselves the default.
  - Mac and Linux (milestone 10): `mac.fileAssociations` with `rank: Alternate`, and `linux.mimeTypes: [application/pdf]` in the `.deb` (Debian/Ubuntu only).
- **macOS** (milestone 10): built by GitHub Actions (`.github/workflows/build-mac.yml`, on a `macos-latest` runner) for every `v*` tag and on demand; the dmg is a run artifact, and the user adds it to the GitHub release. One universal dmg (Apple silicon + Intel). **Ad-hoc signed** (`identity: "-"`): no Apple account and no notarization (no paid certificates, as on Windows), so Gatekeeper asks once and the user clicks "Open Anyway" (README). Apple silicon refuses to run an app with no signature at all ("damaged"). `hardenedRuntime: false`, because hardened runtime rejects Electron's frameworks under an ad-hoc signature. The workflow checks the architectures (`lipo`), the signature (`codesign --verify`) and the PDF document type, then runs `scripts/smoke-test.mjs` on the packaged app (PDF from the command line, F5, full screen, a page forward, Esc, a PDF from Finder via `open -a`). The runner has one display, so multi-monitor behaviour is untested on the Mac. A failed run puts the end of its log in an annotation, readable without signing in (`/repos/nilovelez/pdf-diva/check-runs/<job id>/annotations` in the GitHub API). `electronDist` is only passed to the Windows scripts: on the Mac, electron-builder downloads Electron for both architectures. Electron 44 needs macOS 13 or later.
- **macOS behaviour**: presentation windows use **simple full screen** (`setSimpleFullScreen`, see `windows.ts`): native full screen moves each window to its own Space, animated and asynchronous, which breaks `placeFullScreen()` (exit, move, enter). The app menu exists only on macOS, for Cmd+Q/Cmd+H and copy/paste in the password field; its labels are translated (`menu.*`) and it is rebuilt when the language changes. Closing the last window quits the app, as on Windows.
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

## Backlog

The backlog lives in [`guppy/BACKLOG.md`](../guppy/BACKLOG.md), next to the project status.
