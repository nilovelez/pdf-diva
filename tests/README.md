# End-to-end tests

Scripts that drive the real app through the Chromium DevTools protocol (CDP), on Windows. They are not a test framework: each one starts the app, checks what a user would see, and prints `OK`/`FAIL` lines and `ALL OK` (or `N FAILED`) at the end. Node 24 (global `WebSocket` and `fetch`) and PowerShell 7.

Before running them: `npm install`, `node node_modules/electron/install.js` (npm 12 blocks Electron's install script), and `npm run build`, because the tests run `dist/main.js` through `launchers/test-main.cjs`. `fuses-test.ps1` needs `npm run pack` instead, and `scripts/smoke-test.mjs` takes any packaged executable.

Throwaway files (isolated settings folders, copies, screenshots) go to `scratch/pdf-diva/test-work` next to the folder that holds the repo, or to `PDF_DIVA_TEST_WORK` if set. Deleting that folder is always safe.

| Script | What it checks | Displays |
|---|---|---|
| `displays-test.mjs [langs]` | "Configure displays" (Apply, Cancel, Esc, warning), two speaker views with a shared timer, applying during a presentation, losing and regaining displays, mirroring, starting on one display, 1.2.0 settings. Toggles displays with `DisplaySwitch` and always restores `/extend`. Run with `en-US`. | 3 |
| `scale-test.mjs [langs]` | The speaker view on each display: sizes, nothing off screen, no scrollbars, sharp slide. | 3 |
| `refine-test.mjs` | Thumbnail highlight, theme cards (click, arrow keys, saved, 8 languages fit), even frame in every speaker view. | any |
| `folder-test.mjs` | The Open dialog starts in the last folder (restart, "Open with", broken PDF not remembered, deleted folder), icon-only timer buttons. | any |
| `open-with-test.mjs` | PDF on the command line, a second launch, a PDF arriving during a presentation, corrupt or missing file, settings open. | any |
| `long-test.mjs [langs]` | Every text 40 % longer: overflow and wrapped labels. It prints a report per screen instead of OK/FAIL; every line should say "no overflow, nothing wraps". | any |
| `i18n-test.mjs` | Language from the system, live switch, saved language, speaker view text, password prompt. **Outdated**: 7 FAILs from texts and controls changed in milestones 9–11 (to be updated). | any |
| `hide-reader-test.mjs` | The reader leaves the window list (Alt+Tab) while presenting and comes back on the last slide. **Outdated**: uses the "Present" buttons removed in milestone 9, 2 FAILs (to be updated). | any |
| `site-test.mjs [dark\|light]` | The website (`site/index.html`) with a forced system theme: theme switch and Store badges. | any |
| `fuses-test.ps1` | Packaged app: `ELECTRON_RUN_AS_NODE` and `--inspect` ignored, a changed `app.asar` refuses to start. | any |
| `screenshots.mjs <outDir> [page]` | Not a test: the website and Store screenshots, 1920×1080 as a laptop at 150 % with a projector (`launchers/shots-main.cjs`), English and Spanish, light (*The Fuchsia Hour*) and dark (*The Gold Hour*). Needs a 4K display at 150 %. | 3 |
| `assoc.ps1 [-OpenFile x.pdf]` | Not a test: what Windows offers for `.pdf` ("Open with"), and opening a file through the `PDFDiva.pdf` ProgID as Explorer does. Use it with an installed build. | any |

"3" means the Windows test machine's three displays (a 1280×800 main display and two 4K dummies at 150 %). Never kill Electron by name (the Claude desktop app is Electron too): the scripts close only the repo's own `electron.exe`.

## Fixtures

`fixtures/` holds the test PDFs (a copy of the shared test folder): `test.pdf` (3 pages of mixed sizes), `bad.pdf` (corrupt), `password.pdf`, `cmap-japanese.pdf`, `jbig2_file_header.pdf`, a real 10-page talk (`00 Bienvenida…`), and the two designed decks used for screenshots.
