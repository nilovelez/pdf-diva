# PDF Presenter

A desktop app to present PDFs like PowerPoint's presenter view: the audience sees the slide full screen on the projector, and you see the current slide, the next one, a timer and the controls on your own screen.

It doesn't need Acrobat or any other installed program: PDFs are rendered with a built-in viewer.

## Status

**Version 0.4.0: complete speaker view.** You can present with a speaker view (current slide, next slide and timer) or duplicate the slide on every screen. The app follows the Windows light or dark theme.

You can't choose the projection monitor yet, and there is no installer. Both are coming in the next versions. See the [changelog](CHANGELOG.md) for what each version includes.

The interface is currently in Spanish. Button names below are quoted as they appear on screen, with a translation the first time. More languages are planned.

## Requirements

- Windows 10 or 11 (Mac and Linux later).
- There is no installer yet: the app runs from the source code (see below).

## Running it (development version)

1. Install [Node.js](https://nodejs.org/) (LTS version) and [Git](https://git-scm.com/).
2. Get the project and install its dependencies:

   ```bash
   git clone https://github.com/nilovelez/pdf-presenter.git
   cd pdf-presenter
   npm install
   ```

3. Start the app:

   ```bash
   npm run dev
   ```

To update to a new version: `git pull`, `npm install` and `npm run dev`.

## Usage

### Opening a PDF

When the app starts you'll see an area with a dashed border. Click it or **Abrir archivo...** (Open file), or drag a PDF from File Explorer.

With a PDF open you have:

- at the top, the **Abrir** (Open) button for another PDF, the presentation buttons and, on the right, the page arrows and "Página X de Y" (Page X of Y);
- on the side, page thumbnails: click one to go to it;
- in the center, the current page;
- at the bottom, the file path.

### Presenting

Connect the projector or external screen and set Windows to **Extend** mode (`Windows + P`). The toolbar then offers two ways to present:

- **Con vista del orador** (With speaker view): the audience sees the slide full screen on the external screen, and you see the speaker view on your main monitor.
- **Duplicar pantalla** (Duplicate screen): the slide full screen on every screen, without the speaker view.

Move through the slides with the keyboard or your presentation remote, and press `Esc` to finish.

With only one screen, the toolbar shows a single **Presentar** (Present) button, which opens the speaker view in a normal window. The toolbar updates by itself when you connect or disconnect a screen.

### Speaker view

- **At the top**, the timer. It starts when the presentation starts. **Pausar** (Pause) stops it and changes to **Reanudar** (Resume); **Reiniciar** (Restart) sets it back to zero.
- **In the center**, the current slide with "1 de 40" (1 of 40) below it, and the next slide on the right.
- **At the bottom**, the **Anterior** (Previous) and **Siguiente** (Next) buttons, **Pantalla en negro** (Black screen, stays orange while active) and **Salir** (Exit).

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

### Light and dark theme

The app uses the same theme as Windows (*Settings > Personalization > Colors*). The audience screen is always black and PDF pages keep their original colors.

## Troubleshooting

**The slides appear on the wrong screen.** For now the audience window always goes to the screen that is not the main one. Check which screen is marked as main in *Settings > System > Display*. You'll be able to choose it from the app in a later version.

**I connected the projector after starting the presentation.** Windows aren't moved during a presentation yet. Press `Esc` and present again.

**`npm install` fails while downloading Electron.** Some computers are missing the *Microsoft Visual C++ Redistributable* (x64). Download it from Microsoft's website, install it and run `npm install` again. This is only needed for the development version.

**The PDF doesn't open and a message appears.** The file is damaged or password-protected. Password-protected PDFs can't be opened yet: remove the protection with the program you created it with and try again.

## Credits

Icons by [Phosphor Icons](https://phosphoricons.com), MIT license.
