# PDF Diva

**A presenter view for any PDF.**

A desktop app to present PDFs like PowerPoint's presenter view: the audience sees the slide full screen on the projector, and you see the current slide, the next one, a timer and the controls on your own screen.

It's made for the people who run the room: venue technicians, streaming and video operators. It's the tool you keep installed for when a speaker shows up with a PDF on a USB stick. It starts fast, needs no setup, works offline and has no account or telemetry.

It doesn't need Acrobat or any other installed program: PDFs are rendered with a built-in viewer.

## Status

**Version 0.5.1: ready for real presentations.** You can present with a speaker view (current slide, next slide and timer) or duplicate the slide on every screen, choose which monitor is yours, swap screens on the fly and keep going if a cable comes loose. Password-protected PDFs open too.

There is no installer yet; it's coming in the next version. See the [changelog](CHANGELOG.md) for what each version includes.

The interface is currently in Spanish. Button names below are quoted as they appear on screen, with a translation the first time. More languages are planned.

## Requirements

- Windows 10 or 11 (Mac and Linux later).
- There is no installer yet: the app runs from the source code (see below).

## Running it (development version)

1. Install [Node.js](https://nodejs.org/) (LTS version) and [Git](https://git-scm.com/).
2. Get the project and install its dependencies:

   ```bash
   git clone https://github.com/nilovelez/pdf-diva.git
   cd pdf-diva
   npm install
   ```

3. Start the app:

   ```bash
   npm run dev
   ```

To update to a new version: `git pull`, `npm install` and `npm run dev`.

## Usage

### Opening a PDF

When the app starts you'll see an area with a dashed border. Click it or **Abrir archivo...** (Open file), or drag a PDF from File Explorer. If the PDF is password-protected, the app asks for the password.

With a PDF open you have:

- at the top, the **Abrir** (Open) button for another PDF, the presentation buttons and, on the right, the page arrows, "Página X de Y" (Page X of Y) and the settings button (gear);
- on the side, page thumbnails: click one to go to it;
- in the center, the current page.

The window title shows the path of the open file.

### Presenting

Connect the projector or external screen and set Windows to **Extend** mode (`Windows + P`). The toolbar then offers two ways to present:

- **Con vista del orador** (With speaker view): the audience sees the slide full screen on the external screen, and you see the speaker view on your main monitor.
- **Duplicar pantalla** (Duplicate screen): the slide full screen on every screen, without the speaker view.

Move through the slides with the keyboard or your presentation remote, and press `Esc` to finish.

With only one screen, the toolbar shows a single **Presentar** (Present) button, which opens the speaker view in a normal window. The toolbar updates by itself when you connect or disconnect a screen.

If the slides end up on the wrong screen, press **Alternar pantallas** (Swap screens) in the speaker view. If a screen is disconnected during the presentation, it goes on full screen on the remaining one; when the screen is back, the speaker view returns.

### Speaker view

- **At the top left**, the timer. It starts when the presentation starts. **Pausar** (Pause) stops it and changes to **Reanudar** (Resume); **Reiniciar** (Restart) sets it back to zero.
- **At the top right**, **Alternar pantallas** (Swap screens, with two or more monitors), **Pantalla en negro** (Black screen, stays orange while active) and **Salir** (Exit).
- **In the center**, the current slide and, on the right, the next one. Click the next slide to advance.
- **Below the current slide**, the **Anterior** (Previous) and **Siguiente** (Next) buttons with "1 de 40" (1 of 40) between them.

### Keys

Navigation keys work in the reader and in every presentation window. Black screen and `Esc` only work during a presentation.

| Action | Keys |
|---|---|
| Next page | `PageDown`, `→`, `↓`, `Space`, `Enter` |
| Previous page | `PageUp`, `←`, `↑`, `Backspace` |
| First page | `Home` |
| Last page | `End` |
| Black audience screen (on or off) | `B`, `.` |
| End the presentation | `Esc` |

Presentation remotes send these same keys, so they work without any setup.

### Settings

The gear button on the right of the reader toolbar opens **Ajustes** (Settings). Changes are saved automatically.

- **Monitor del orador** (Speaker monitor): **Automático** (Automatic) uses the Windows main monitor for the speaker view, or pick a specific monitor. The slides go to another monitor.
- **Tema** (Theme): **Sistema** (System) follows Windows (*Settings > Personalization > Colors*); you can also force **Claro** (Light) or **Oscuro** (Dark). The audience screen is always black and PDF pages keep their original colors.

## Troubleshooting

**The slides appear on the wrong screen.** Press **Alternar pantallas** in the speaker view to swap them. To fix it for next time, choose your monitor in **Ajustes > Monitor del orador**.

**`npm install` fails while downloading Electron.** Some computers are missing the *Microsoft Visual C++ Redistributable* (x64). Download it from Microsoft's website, install it and run `npm install` again. This is only needed for the development version.

**The PDF doesn't open and a message appears.** The file is damaged. Try exporting it again from the program you created it with.

## License

PDF Diva is free software: you can redistribute it and/or modify it under the terms of the [GNU General Public License](LICENSE) as published by the Free Software Foundation, either version 3 of the License, or (at your option) any later version.

## Credits

PDF Diva is built with [PDF.js](https://github.com/mozilla/pdf.js) (Apache 2.0), [Electron](https://www.electronjs.org) (MIT) and icons by [Phosphor Icons](https://phosphoricons.com) (MIT). See [THIRD-PARTY-NOTICES.md](THIRD-PARTY-NOTICES.md) for the full list and their licenses.
