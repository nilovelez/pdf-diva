# Microsoft Store listing

Text and settings for the PDF Diva listing in Partner Center. Keep this file in sync with what is published.

The app interface is in Spanish only until milestone 8, so the main listing is Spanish (matches the package) and the English listing is an additional language that says so.

## Product setup

| Field | Value |
|---|---|
| Reserved name | PDF Diva |
| Category | Productivity |
| Price | Free, no in-app purchases |
| Markets | All |
| Age rating (IARC questionnaire) | No violence, no user interaction, no data sharing, no purchases → expected: 3+ / Everyone |
| Privacy policy URL | https://nilovelez.github.io/pdf-diva/privacy.html (generated from `PRIVACY.md` on every website deploy) |
| Website | https://nilovelez.github.io/pdf-diva/ |
| Support contact | https://github.com/nilovelez/pdf-diva/issues |
| Copyright | © 2026 PDF Diva contributors |
| Additional license terms | GNU General Public License v3.0 or later: https://www.gnu.org/licenses/gpl-3.0.html |
| Restricted capability `runFullTrust` (justification) | PDF Diva is a desktop app built with Electron and packaged as MSIX. It needs full trust to run as a regular desktop app and to place its windows on different monitors. It makes no network connections. |

## Listing: Spanish (es-ES)

**Short description** (max. 270 characters shown)

> Una vista del orador para cualquier PDF. Proyecta la diapositiva a pantalla completa en el monitor del público y ve en el tuyo la página actual, la siguiente y el cronómetro. Sin cuenta, sin conexión, gratis y de código abierto.

**Description**

> PDF Diva presenta cualquier PDF como una presentación de diapositivas, con vista del orador.
>
> Pensada para técnicos de sala y operadores de vídeo: la herramienta que tienes instalada para cuando el ponente llega con un PDF en un pendrive. Abres el archivo, pulsas F5 y listo.
>
> En el monitor del público, la diapositiva a pantalla completa sobre fondo negro, sin controles ni marcos. En el tuyo, la página actual en grande, la siguiente, el número de página y un cronómetro, legibles de un vistazo.
>
> Funciona con cualquier mando de diapositivas estándar, porque usa las mismas teclas que los programas de presentaciones habituales. Si se desconecta un monitor durante la presentación, sigue en la pantalla que quede, en la misma diapositiva.
>
> Sin cuenta, sin telemetría y sin conexión a internet: no recoge ningún dato. Todo funciona sin red.
>
> PDF Diva es software libre (GPL v3) y gratuito.
>
> La interfaz está en español; la versión en inglés llegará más adelante.

**Product features** (one per line, no bullets, max. 200 characters each)

```
Vista del orador con la página actual, la siguiente, "X de Y" y cronómetro
Diapositiva a pantalla completa en el monitor del público, centrada sobre negro
Compatible con mandos de diapositivas: avanzar, retroceder, pantalla en negro, salir
F5 para empezar desde el principio y Mayús+F5 desde la página actual
Elige el monitor de proyección o alterna las pantallas sin parar la presentación
Duplicar pantalla: la diapositiva en todos los monitores a la vez
Sigue funcionando si se conecta o desconecta un monitor durante la presentación
Páginas nítidas en pantallas 4K y cambio de diapositiva instantáneo
Abre PDFs protegidos con contraseña, escaneados y con texto en chino, japonés o coreano
Tema claro y oscuro según Windows
Sin cuenta, sin telemetría y sin conexión a internet
Gratis y de código abierto (GPL v3)
```

**Additional system requirements**

- Minimum hardware: `Un monitor (con dos, el público ve la diapositiva y tú la vista del orador)`

**Search terms** (up to 7, max. 21 characters each)

```
vista del orador
presentar pdf
pdf pantalla completa
presentacion pdf
cronómetro
diapositivas
mando presentador
```

**What's new in this version**

> Primera versión en la Microsoft Store.

## Listing: English (en-US, additional language)

**Short description**

> A presenter view for any PDF. Show the slide full screen on the audience monitor and see the current page, the next one and a timer on yours. No account, works offline, free and open source. Interface currently in Spanish.

**Description**

> PDF Diva presents any PDF as a slideshow, with a presenter view.
>
> Made for AV technicians and video operators: the tool you keep installed for when a speaker shows up with a PDF on a USB stick. Open the file, press F5 and you're live.
>
> The audience monitor shows the slide full screen on black, with no controls or borders. Your monitor shows the current page large, the next one, the page number and a timer, readable at a glance.
>
> It works with any standard presentation remote, because it uses the same keys as the usual presentation software. If a monitor is disconnected during the show, it carries on on the remaining screen, on the same slide.
>
> No account, no telemetry and no internet connection: it collects no data. Everything works offline.
>
> PDF Diva is free and open-source software (GPL v3).
>
> The interface is currently in Spanish. English is planned.

**Product features**

```
Presenter view with the current page, the next one, "X of Y" and a timer
Full-screen slide on the audience monitor, centered on black
Works with presentation remotes: next, previous, black screen, exit
F5 starts from the beginning, Shift+F5 from the current page
Choose the projection monitor, or swap screens without stopping the show
Duplicate screen: the slide on every monitor at once
Keeps going when a monitor is connected or disconnected mid-show
Sharp pages on 4K screens and instant slide changes
Opens password-protected, scanned and Chinese, Japanese or Korean PDFs
Light and dark theme following Windows
No account, no telemetry, no internet connection
Free and open source (GPL v3)
```

**Additional system requirements**

- Minimum hardware: `One monitor (with two, the audience sees the slide and you see the presenter view)`

**Search terms**

```
presenter view
pdf presenter
pdf slideshow
pdf full screen
presentation timer
slides
clicker
```

**What's new in this version**

> First release on the Microsoft Store.

## Images still needed

- **Screenshots**: at least 1, ideally 4. PNG, 1366×768 or larger (1920×1080 recommended), no text overlays required. Suggested: reader with a PDF open; presenter view; audience screen; settings with the monitor selector. Use a sample PDF we own, not a third-party deck.
- **Package logos** (inside the MSIX, from the design work): Square44x44, Square150x150, Wide310x150, StoreLogo (50×50), with scaled versions.
- **Store logos** (optional): 1:1 300×300 and 2:3 poster, if the design agent has them.
