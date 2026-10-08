# PDF Diva

**A presenter view for any PDF.** · [Website](https://nilovelez.github.io/pdf-diva/)

A desktop app to present PDFs like PowerPoint's presenter view: the audience sees the slide full screen on the projector, and you see the current slide, the next one, a timer and the controls on your own screen.

It's made for the people who run the room: venue technicians, streaming and video operators. It's the tool you keep installed for when a speaker shows up with a PDF on a USB stick. It starts fast, needs no setup, works offline and has no account or telemetry.

It doesn't need Acrobat or any other installed program: PDFs are rendered with a built-in viewer.

## Status

**Version 1.3.0.** You present with a speaker view (current slide, next slide and timer), choose what each monitor shows (several speaker views, or the slide mirrored on every screen), change it on the fly and keep going if a cable comes loose. Password-protected PDFs open too. See the [changelog](CHANGELOG.md) for what each version includes.

The interface is in **English and Spanish**. It uses the system language when PDF Diva has it, and English otherwise; you can change it in the settings. Want PDF Diva in your language? See [Translating PDF Diva](docs/translating.md).

## Requirements

- Windows 10 or 11, 64-bit (x64). It also runs on Windows 11 on ARM, through Windows' built-in emulation.
- macOS 13 Ventura or later, on Apple silicon or Intel (preview: see [On a Mac](#on-a-mac-preview)).
- Linux is planned.
- No administrator rights, internet connection or other programs needed.

## Installing

On Windows there are two ways to install PDF Diva. Both are free and install the same app.

### From the Microsoft Store (recommended)

[**Get PDF Diva from the Microsoft Store**](https://apps.microsoft.com/detail/9nh5x0qbmhq1), or search for **PDF Diva** in the Store app and click **Get**. The Store keeps the app up to date.

### From GitHub

Use this if the Microsoft Store is blocked on your computer.

1. Download `PDF-Diva-Setup-<version>.exe` from the [latest release](https://github.com/nilovelez/pdf-diva/releases/latest).
2. Run it. The app installs for your user only and doesn't ask for administrator rights.
3. Windows may show **Windows protected your PC** (*Windows protegió su PC*), because the installer isn't digitally signed. Click **More info** (*Más información*) and then **Run anyway** (*Ejecutar de todas formas*).

The first start after installing can take a minute on a slow computer, while the antivirus checks the app. Later starts are fast.

To update, download and run the new installer: your settings are kept.

### On a Mac (preview)

1. Download `PDF-Diva-<version>.dmg` from the [latest release](https://github.com/nilovelez/pdf-diva/releases/latest), open it and drag **PDF Diva** to **Applications**.
2. Open PDF Diva from Applications. The first time, macOS says it can't verify the developer, because the app isn't notarized by Apple. Click **Done** (or **Cancel**).
3. Open *System Settings > Privacy & Security*, scroll down to the message about PDF Diva and click **Open Anyway**. Confirm with your password. On macOS 13 and 14 you can instead Control-click the app in Applications and choose **Open**.

macOS only asks once. To update, replace the app in Applications with the new one: your settings are kept.

### Uninstalling

On Windows, go to *Settings > Apps > Installed apps*, find **PDF Diva** and choose **Uninstall**. Your settings are removed too.

On a Mac, drag **PDF Diva** from Applications to the Trash. Your settings stay in `~/Library/Application Support/PDF Diva`; delete that folder to remove them.

## Running from source (for developers)

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

When the app starts you'll see an area with a dashed border. Click it or **Open file...**, or drag a PDF from File Explorer. If the PDF is password-protected, the app asks for the password. The Open dialog starts in the folder of the last PDF you opened.

With a PDF open you have:

- at the top, the **Open** button for another PDF, **Configure displays** (with two or more monitors), **Present** and, on the right, the page arrows, "Page X of Y" and the settings button (gear);
- on the side, page thumbnails: click one to go to it;
- in the center, the current page.

The window title shows the path of the open file.

### Opening PDFs from File Explorer

PDF Diva appears in **Open with** when you right-click a PDF in File Explorer. Installing it doesn't change your default PDF viewer. To open every PDF with PDF Diva, right-click a PDF, choose **Open with > Choose another app**, select **PDF Diva** and click **Always** (on Windows 10, tick **Always use this app to open .pdf files**).

On a Mac, PDF Diva appears in Finder's **Open With** menu. To open every PDF with it, select a PDF, choose *File > Get Info*, pick **PDF Diva** under **Open with** and click **Change All**.

PDF Diva opens one window only: a PDF opened from File Explorer or Finder while the app is running replaces the one in the reader. If a presentation is running, it ends and the new PDF opens in the reader.

### Presenting

Connect the projector or external screen and set Windows to **Extend** mode (`Windows + P`); on a Mac, make sure the displays aren't mirrored (*System Settings > Displays*). Click **Present**, or press `F5` to start from the first page or `Shift+F5` to start from the page you're on.

Every monitor shows either the **speaker view** or the slide for the **audience**, full screen. By default the audience is on the last monitor and the speaker view on the others: with a laptop and a projector, you see the speaker view on the laptop; with three monitors, there are two speaker views (for example, the technician's and the speaker's) and the audience. With only one monitor, **Present** shows the slide full screen, without the speaker view.

To change it, click **Configure displays** in the reader or in the speaker view. Each monitor shows its number, name and resolution, and a list to choose **Speaker View** or **Audience View**. Click **Apply** to save it; during a presentation the windows move without stopping it. At least one monitor must show the audience. Set every monitor to **Audience View** to mirror the slide on all of them. PDF Diva remembers each monitor's choice for next time.

Move through the slides with the keyboard or your presentation remote, and press `Esc` to finish. While you present, the reader window is hidden; it comes back when the presentation ends, on the last slide shown.

If a monitor is disconnected during the presentation, it goes on with the ones left; when the monitor is back, it shows what it showed before.

### Speaker view

- **At the top left**, the timer. It starts when the presentation starts and is the same in every speaker view. The pause button stops it (press it again to resume) and the reset button sets it back to zero.
- **At the top right**, **Configure displays** (with two or more monitors), **Black screen** (stays orange while active) and **Exit**.
- **In the center**, the current slide and, on the right, the next one. Click the next slide to advance.
- **Below the current slide**, the **Previous** and **Next** buttons with "1 of 40" between them.

### Keys

Navigation keys work in the reader and in every presentation window. `F5` and `Shift+F5` only work in the reader; black screen and `Esc` only during a presentation.

| Action | Keys |
|---|---|
| Start presenting from the first page | `F5` |
| Start presenting from the current page | `Shift+F5` |
| Next page | `PageDown`, `→`, `↓`, `Space`, `Enter` |
| Previous page | `PageUp`, `←`, `↑`, `Backspace` |
| First page | `Home` |
| Last page | `End` |
| Black audience screen (on or off) | `B`, `.` |
| End the presentation | `Esc` |

Presentation remotes send these same keys, so they work without any setup. On remotes with a "play" button, it usually sends `F5` to start and `Esc` to end.

### Settings

The gear button on the right of the reader toolbar opens **Settings**. Changes are saved automatically.

- **Theme**: **System** follows Windows (*Settings > Personalization > Colors*) or macOS (*System Settings > Appearance*); you can also force **Light** or **Dark**. The audience screen is always black and PDF pages keep their original colors.
- **Language**: **System** uses the system language if PDF Diva has it, and English otherwise; you can also pick a language. Each language is listed by its own name (English, Español). The change applies straight away; a presentation that is running keeps its language until it ends.

## Troubleshooting

**The slides appear on the wrong screen.** Click **Configure displays** in the speaker view, choose what each monitor shows and click **Apply**. PDF Diva remembers it for next time.

**Windows warns that the installer is unsafe.** The GitHub installer isn't digitally signed, so Windows SmartScreen shows a warning the first time. Click **More info** and then **Run anyway**. The Microsoft Store version doesn't show this warning.

**`npm install` fails while downloading Electron.** Some computers are missing the *Microsoft Visual C++ Redistributable* (x64). Download it from Microsoft's website, install it and run `npm install` again. This is only needed for the development version.

**The PDF doesn't open and a message appears.** The file is damaged. Try exporting it again from the program you created it with.

## Privacy

PDF Diva collects no data and never connects to the internet. See the [privacy policy](https://nilovelez.github.io/pdf-diva/privacy.html).

## License

Copyright © 2026 Nilo Vélez.

PDF Diva is free software: you can redistribute it and/or modify it under the terms of the [GNU General Public License](LICENSE) as published by the Free Software Foundation, either version 3 of the License, or (at your option) any later version.

## Credits

PDF Diva is built with [PDF.js](https://github.com/mozilla/pdf.js) (Apache 2.0), [Electron](https://www.electronjs.org) (MIT) and icons by [Phosphor Icons](https://phosphoricons.com) (MIT). See [THIRD-PARTY-NOTICES.md](THIRD-PARTY-NOTICES.md) for the full list and their licenses.
