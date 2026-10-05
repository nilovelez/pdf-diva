# Developer guide

Everything a new developer (or agent) needs that is not obvious from the code. Project rules and conventions are in [`CLAUDE.md`](../CLAUDE.md); user-facing text is in the README and CHANGELOG; the website is covered in [`website.md`](website.md).

State at the time of writing: **v1.0.0 is published** (GitHub release + Microsoft Store listing). The next planned work is milestone 7 (multi-language, English first).

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
resources/icons/     Phosphor UI icons (MIT) ; resources/icons/app/ = app icon set (icon.ico, appx/ tiles)
electron-builder.yml Packaging (NSIS + MSIX)
site/                The website (see website.md); scripts/build-privacy.mjs builds its privacy page
```

### Presentation model

- The main process owns the state: `{ page, total, blank, displayCount }` plus the PDF bytes and password (memory only). Windows send actions (`next`, `prev`, `first`, `last`, `goto`, `toggleBlack`, `swapScreens`, `exit`) and receive the new state. Only presentation windows may read or control it (sender is checked).
- Every window loads the PDF itself with PDF.js (the bytes come through IPC once). Rendering lives in the renderers, never in main.
- Two modes: `presenter` (speaker view on the chosen/main display + audience on another) and `mirror` (an audience window on every display, no speaker view).
- `applyLayout()` in `presentation.ts` places windows for the displays connected right now. It runs at start and on `display-added/removed/metrics-changed` (debounced). Behaviour: with one display left the speaker window is **hidden, not closed** (so the timer survives) and the audience takes the remaining display; when a display returns, the speaker view comes back with the same slide and timer. "Alternar pantallas" swaps roles (2 displays) or rotates the audience (3+). Started with one display: speaker view only, in a normal window.
- The "last PDF that opened fine" is tracked in main with an id: the launcher calls `pdfOpened(id)` only after PDF.js loaded it, so a corrupt or cancelled-password file can never be what gets presented.

### Rendering (`shared/pageview.ts`)

One render at a time per canvas, new requests cancel the old one, pages are rendered off screen and copied when complete (the visible page never blanks), and the neighbours (next, then previous) are pre-rendered into a small cache keyed by page and box size. Thumbnails render lazily with an `IntersectionObserver`. PDF.js needs its worker plus `wasm/`, `cmaps/`, `standard_fonts/`, `iccs/` next to the renderers; `esbuild.mjs` copies them to `dist/renderer/shared/`.

### Offline and hardening

The app must make **no network connections** (PRIVACY.md depends on it): CSP `default-src 'self'`, spellcheck disabled (Chromium downloads dictionaries), every `http(s)/ws(s)/ftp` request cancelled in the default session, windows cannot navigate or open new windows, and the only outbound action is `shell.openExternal` with one fixed URL (the website). Keep it that way when adding features.

### Settings

`app.getPath('userData')/settings.json`: `speakerMonitor` (id + label/size/position as a fallback match) and `theme` (`system|light|dark`, applied with `nativeTheme.themeSource`). The folder is named after `productName` (`%APPDATA%\PDF Diva`; MSIX virtualizes it into the package's `LocalCache`). Renaming the product resets users' settings.

### UI text and translation

All UI strings are Spanish and live inline in the HTML files and renderer TypeScript. There is no i18n layer yet: building one (and the English strings) is milestone 7.

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
- MSIX (`appx` target): `runFullTrust` (Electron needs it). Identity values come from Partner Center and are in `electron-builder.yml` (`4095RedViral.PDFDiva`, publisher `CN=140CA302-E9F8-47D7-BC52-9FEFCB98772E`, display name "Nilo Vélez"); the version in the manifest is `<version>.0`. The Store requires a first version number of 1 or more.
- Building the MSIX needs `makeappx.exe` and, because the tiles come in several scales, `makepri.exe`, from the Windows SDK. electron-builder bundles old copies that **do not start on current Windows 11**; the fix is to put working ones where electron-builder looks (its cache, `winCodeSign-*/…/windows-10/x64`). The BOB-specific details are in the project memory (`bob-build-machine`).
- Do **not** try to sideload the unsigned MSIX: Windows refuses unsigned packages that run an `.exe`. A package signed with a self-signed test certificate (subject = the manifest Publisher) did not install on the user's test machine either ("the publisher's certificate can't be verified", even with the certificate imported and developer mode on). Registering the unpacked folder with `Add-AppxPackage -Register AppxManifest.xml` in developer mode (publisher without the unsigned-namespace OID) is what worked for testing MSIX behaviour (settings virtualization, offline, drag and drop, displays). Test installer behaviour with the NSIS build.

## Release flow

1. Work in small commits (English, `feat:`/`fix:`/`chore:`/`docs:`), `typecheck` and `lint` green. The developer is the only one who writes to `main`.
2. The coordinator writes CHANGELOG/README on a `docs/...` branch (and the website on `web/...`); review and merge them.
3. At a milestone close, **wait for the coordinator's go**: bump the version (`npm version X.Y.Z --no-git-tag-version`, commit), annotated tag (`git tag -a vX.Y.Z -m "Milestone N: …"`), `git push origin main` and `git push origin vX.Y.Z` as separate plain commands, then stop.
4. The **user** creates the GitHub release from the web (there is no `gh` on the build machine) with the installer attached; the release text is the CHANGELOG entry plus the SmartScreen note. The user also uploads the `.appx` to Partner Center. After the Store certifies the app, put the Store link in the README and tell the website owner.
5. Pushing `site/` or `PRIVACY.md` redeploys the website (GitHub Actions).

## Testing

Launch the app with `electron . --remote-debugging-port=9333` (or a packaged `.exe` with the same flag), connect to `http://127.0.0.1:9333/json`, and use the DevTools protocol over WebSocket: `Runtime.evaluate` to read/click, `Input.dispatchKeyEvent` for keys, `Input.dispatchDragEvent` with `files: [path]` for real drag and drop. Settings can be isolated with `app.setPath('userData', …)` from a small launcher script. A password-protected PDF can be generated with a few lines of Node (RC4 40-bit, standard security handler). Multi-monitor behaviour is tested by toggling a display (`DisplaySwitch.exe /internal` and `/extend`) while a presentation runs.

## Backlog (user feedback, not scheduled)

- Speaker view that adapts better to large resolutions (at 1280×720 CSS it leaves empty space around the slides).
- More than two monitors: two speaker views (technician + speaker) and one audience output.
- "Alternar pantallas" should persist for the next presentation.
- Register PDF Diva as a PDF handler ("Open with…" and default app), in NSIS and MSIX: study first, then decide.
- Milestone 7: multi-language (English first). Milestone 8: Mac and Linux builds.
