# Changelog

All notable changes for users are recorded here.
The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/).

Until version 1.0.0 the interface was in Spanish only; entries up to that version quote the Spanish button names.

## [Unreleased]

## [1.2.0] - 2026-10-06

### Added
- **Open PDFs from File Explorer.** PDF Diva appears in **Open with** for PDF files, and you can choose it as your default PDF viewer with **Always**. Installing it doesn't change your current default.

### Changed
- PDF Diva runs as a single app: opening a PDF from File Explorer while it's running opens it in the same window. If a presentation is running, it ends and the new PDF opens in the reader.
- The reader window hides while you present, so Alt+Tab and the taskbar only show the presentation. It comes back when the presentation ends, on the last slide shown.

## [1.1.0] - 2026-10-06

### Added
- **The interface is in English and Spanish.** PDF Diva uses the Windows language when it has it, and English otherwise.
- **Language** in Settings, to choose a language instead of following Windows. The change applies straight away, without closing the open PDF.
- Anyone can translate PDF Diva into another language: see [Translating PDF Diva](docs/translating.md).

### Changed
- **Swap screens is remembered.** After swapping the screens once, the next presentations start the same way round, even after closing the app. **Settings > Speaker display** shows the monitor in use; choose **Automatic** to go back to the default.
- If your Windows is not in Spanish, PDF Diva now opens in English. To keep using it in Spanish, choose **Español** in **Settings > Language**.

## [1.0.0] - 2026-10-05

### Added
- **Windows installer.** Install PDF Diva from the Microsoft Store, or download the installer from GitHub if the Store is blocked. No administrator rights needed. The GitHub installer isn't digitally signed yet, so Windows shows a warning the first time (see the README).
- `F5` starts the presentation from the first page and `Shift+F5` from the current page, as in PowerPoint. Remotes with a "play" button work too.
- Privacy policy: PDF Diva collects no data.

### Changed
- The app now blocks every internet connection, so it stays fully offline. Spell checking is off, because it downloaded dictionaries.
- Uninstalling removes the saved settings.

## [0.5.3] - 2026-10-05

### Fixed
- Scanned PDFs (with JBIG2 or JPEG 2000 images) and PDFs with Chinese, Japanese or Korean text no longer show blank pages.
- Going back a slide, or moving through slides quickly, no longer flashes black or a half-drawn page on the audience screen.
- The speaker view no longer flickers when the display settings change (for example, the scale of a monitor), and no longer shows up empty for a moment when the presentation starts.
- `Ctrl+B` no longer blacks out the screen; `B` and `.` still do.
- Opening a second PDF while the first one was asking for its password could present the wrong file.

## [0.5.2] - 2026-10-04

### Changed
- New PDF Diva color palette: warm neutrals with a fuchsia accent in the light theme and a gold accent in the dark theme. Warnings stay orange, and errors red.

## [0.5.1] - 2026-10-04

### Changed
- The project is now called **PDF Diva** (formerly PDF Presenter). The repository moved to [github.com/nilovelez/pdf-diva](https://github.com/nilovelez/pdf-diva).
- Because of the new name, saved settings (speaker monitor and theme) are reset once.

## [0.5.0] - 2026-10-04

### Added
- **Password-protected PDFs** can now be opened: the app asks for the password, and it works in the presentation too. The password is never saved.
- **Settings** (gear button on the right of the reader toolbar): choose the speaker monitor and the theme (System, Light or Dark). Changes are saved automatically.
- **Alternar pantallas** (Swap screens) in the speaker view, when two or more monitors are connected: moves the slides to the other monitor without stopping the presentation or the timer.
- If a monitor is disconnected during a presentation, it goes on full screen on the remaining monitor, on the same slide. When the monitor is back, the speaker view returns. Connecting a second monitor during a single-monitor presentation also switches to the speaker view.
- The start screen shows the version, the license and a link to the project.
- The project is now licensed under the GNU GPL v3.0 or later, with a list of third-party licenses and credits.

### Changed
- Speaker view: the next-slide preview is larger (70/30 split instead of 75/25).

### Fixed
- After a damaged PDF failed to open, presenting showed the damaged file instead of the one that was open.

## [0.4.1] - 2026-10-04

### Added
- Click the next-slide preview in the speaker view to advance.

### Changed
- Speaker view layout: **Anterior** and **Siguiente** now sit on the same line as the page counter, aligned with the edges of the current slide; **Pantalla en negro** and **Salir** moved to the top bar, next to the timer. The bottom bar is gone and the slides are centered vertically.
- Reader: the status bar is gone; the path of the open PDF is shown in the window title.
- README and changelog are now written in English.

## [0.4.0] - 2026-10-04

### Added
- **Complete speaker view**: the current page shown large with "1 de 40" (1 of 40) below it, a preview of the next page ("Fin de la presentación" on the last one), large **Anterior** (Previous) and **Siguiente** (Next) buttons, **Pantalla en negro** (Black screen) and **Salir** (Exit).
- **Timer** in the speaker view. It starts when the presentation starts; **Pausar** (Pause) stops it (the button changes to **Reanudar**, Resume) and **Reiniciar** (Restart) sets it back to zero.
- **Duplicar pantalla** (Duplicate screen): the slide full screen on every monitor at once, without the speaker view.
- Automatic **light and dark theme**, following the Windows setting. The audience screen is always black and PDF pages keep their original colors.
- Icons on every button.

### Changed
- Redesigned reader: grey background with the page shown like paper, arrows to change page and a toolbar that adapts to the connected monitors. With two or more it shows **Con vista del orador** (With speaker view) and **Duplicar pantalla**; with one, only **Presentar** (Present).
- Slide changes are instant: the next page is prepared in advance.

## [0.3.0] - 2026-10-04

### Added
- **Presentation mode.** The **Presentar** button opens two windows: the audience window, full screen and without controls on the secondary monitor, and the speaker window on the main monitor, with the current page and "Página X de Y" (Page X of Y).
- Black screen: `B` or `.` blanks the audience screen and turns it back on. The speaker view shows a notice while it is blank.
- `Esc` ends the presentation and returns to the reader on the last page shown.
- Keys work in both windows, even after clicking on the audience window.
- With a single monitor, **Presentar** opens only the speaker view in a normal window.
- New reader: a start screen where you can click or drag a PDF, a toolbar with **Abrir** (Open) and **Presentar**, page thumbnails in a side bar (click one to go to it) and the file path in the bottom bar.

### Changed
- Removed the default menu (File, Edit, View, Window) from all windows.

## [0.2.0] - 2026-10-04

### Added
- **Abrir PDF…** (Open PDF) button to choose a file and view it in the main window, with the file name and "Página X de Y".
- Keyboard navigation, compatible with standard presentation remotes: forward with `PageDown`, `→`, `↓`, `Space` or `Enter`; back with `PageUp`, `←`, `↑` or `Backspace`; `Home` and `End` for the first and last page.
- Each page fits the window without distortion, on a black background, even when the PDF mixes page sizes. Pages stay sharp on high-resolution screens.
- If the PDF is damaged or password-protected, the app shows a message instead of closing.

## [0.1.0] - 2026-10-04

### Added
- First version: the app opens an initial window (project skeleton).
