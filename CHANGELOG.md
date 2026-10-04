# Changelog

All notable changes for users are recorded here.
The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/).

The app's interface is currently in Spanish; button names are quoted as they appear on screen.

## [Unreleased]

### Added
- The project is now licensed under the GNU GPL v3.0 or later, with a list of third-party licenses and credits.

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
