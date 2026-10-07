# Microsoft Store listing

Text and settings for the PDF Diva listing in Partner Center. Keep this file in sync with what is published.

Since v1.1.0 the app is in English and Spanish (it follows the Windows language, English otherwise), and both listings say so. The Spanish listing was the first one published; both are full listings now.

## Product setup

| Field | Value |
|---|---|
| Reserved name | PDF Diva |
| Category | Productivity |
| Price | Free, no in-app purchases |
| Markets | All |
| Age rating (IARC questionnaire) | No violence, no user interaction, no data sharing, no purchases → expected: 3+ / Everyone |
| Privacy policy URL | https://nilovelez.github.io/pdf-diva/privacy.html (generated from `PRIVACY.md` on every website deploy) |
| Store listing (live, v1.0.0 approved) | https://apps.microsoft.com/detail/9nh5x0qbmhq1 |
| Website | https://nilovelez.github.io/pdf-diva/ |
| Support contact | https://github.com/nilovelez/pdf-diva/issues |
| Copyright | Nilo Vélez |
| Additional license terms | GNU General Public License v3.0 or later: https://www.gnu.org/licenses/gpl-3.0.html |
| Restricted capability `runFullTrust` (justification; goes in each submission's **Submission options > Restricted capabilities**, the upload warning about it is expected) | PDF Diva is a desktop app built with Electron and packaged as MSIX. It needs full trust to run as a regular desktop app: it opens PDF files the user chooses from any folder (including "Open with" from File Explorer) and places its presentation windows full screen on different monitors. It makes no network connections and collects no data. |

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
> La interfaz está en español y en inglés, y usa el idioma de Windows.

**Product features** (one per line, no bullets, max. 200 characters each)

```
Vista del orador con la página actual, la siguiente, "X de Y" y cronómetro
Diapositiva a pantalla completa en el monitor del público, centrada sobre negro
Compatible con mandos de diapositivas: avanzar, retroceder, pantalla en negro, salir
F5 para empezar desde el principio y Mayús+F5 desde la página actual
Elige qué muestra cada monitor, vista del orador o del público, también durante la presentación
Con tres monitores, dos vistas del orador (técnico y ponente) y el público; o la diapositiva en todos
Sigue funcionando si se conecta o desconecta un monitor durante la presentación
Páginas nítidas en pantallas 4K y cambio de diapositiva instantáneo
Abre PDFs protegidos con contraseña, escaneados y con texto en chino, japonés o coreano
Tema claro y oscuro según Windows
En español y en inglés, según el idioma de Windows
Aparece en «Abrir con» del Explorador; puedes elegirla como visor de PDF predeterminado
Sin cuenta, sin telemetría y sin conexión a internet
Gratis y de código abierto (GPL v3)
```

**Additional system requirements**

- Minimum hardware: `Un monitor (con dos, el público ve la diapositiva y tú la vista del orador)`

**Search terms** (only if Partner Center shows the field; current MSIX documentation no longer lists it)

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

v1.0.0: left blank, as Microsoft asks for a first submission.

v1.1.0:

> La interfaz ya está en inglés además de en español. PDF Diva usa el idioma de Windows (si no lo tiene, el inglés) y puedes elegir otro en Ajustes.

v1.2.0 as published in the Store (submission 2; 1.1.0 never reached the Store, so this covers both):

> La interfaz ya está en español y en inglés, según el idioma de Windows, y puedes elegir otro en Ajustes. «Alternar pantallas» se recuerda para las siguientes presentaciones. PDF Diva aparece en «Abrir con» al hacer clic derecho en un PDF, y puedes elegirla como visor predeterminado con «Siempre»; instalarla no cambia tu visor actual. La ventana del lector se oculta mientras presentas.

v1.2.0 alone (if 1.1.0 had been published):

> PDF Diva aparece en «Abrir con» al hacer clic derecho en un PDF, y puedes elegirla como visor predeterminado con «Siempre». Instalarla no cambia tu visor actual.

v1.3.0:

> Nuevo «Configurar monitores»: elige qué muestra cada monitor, la vista del orador o la del público, también durante la presentación. Con tres monitores, dos vistas del orador y el público. La vista del orador ocupa toda la pantalla y se lee bien en monitores grandes. Con un solo monitor, «Presentar» muestra solo la diapositiva. El diálogo de abrir empieza en la carpeta del último PDF. Nuevo icono.

## Listing: English (en-US)

**Short description**

> A presenter view for any PDF. Show the slide full screen on the audience monitor and see the current page, the next one and a timer on yours. No account, works offline, free and open source.

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
> The interface is in English and Spanish, and follows the Windows language.

**Product features**

```
Presenter view with the current page, the next one, "X of Y" and a timer
Full-screen slide on the audience monitor, centered on black
Works with presentation remotes: next, previous, black screen, exit
F5 starts from the beginning, Shift+F5 from the current page
Choose what each monitor shows, speaker or audience view, even mid-show
With three monitors, two speaker views (technician and speaker) plus the audience; or the slide on all
Keeps going when a monitor is connected or disconnected mid-show
Sharp pages on 4K screens and instant slide changes
Opens password-protected, scanned and Chinese, Japanese or Korean PDFs
Light and dark theme following Windows
In English and Spanish, following the Windows language
Shows up in File Explorer's Open with; you can make it your default PDF viewer
No account, no telemetry, no internet connection
Free and open source (GPL v3)
```

**Additional system requirements**

- Minimum hardware: `One monitor (with two, the audience sees the slide and you see the presenter view)`

**Search terms** (only if the field exists)

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

v1.0.0: left blank (same as the Spanish listing).

v1.1.0:

> The interface is now in English as well as Spanish. PDF Diva uses the Windows language (English if it doesn't have it), and you can pick another one in Settings.

v1.2.0 as published in the Store (submission 2; covers 1.1.0 too):

> The interface is now in English and Spanish, following the Windows language, and you can pick another one in Settings. Swap screens is remembered for the next presentations. PDF Diva shows up in Open with when you right-click a PDF, and you can make it your default PDF viewer with Always; installing it doesn't change your current viewer. The reader window hides while you present.

v1.2.0 alone (if 1.1.0 had been published):

> PDF Diva shows up in Open with when you right-click a PDF, and you can make it your default PDF viewer with Always. Installing it doesn't change your current viewer.

v1.3.0:

> New Configure displays: choose what each monitor shows, the speaker view or the audience view, even during the presentation. With three monitors, two speaker views plus the audience. The speaker view fills the screen and stays readable on large monitors. With a single monitor, Present shows just the slide. The Open dialog starts in the folder of the last PDF. New icon.

## Images still needed

- **Screenshots**: at least 1, ideally 4. PNG, 1366×768 or larger (1920×1080 recommended), no text overlays required. Suggested: reader with a PDF open; presenter view; audience screen; settings with the monitor selector. Use a sample PDF we own, not a third-party deck.
- **Package logos** (inside the MSIX, from the design work): Square44x44, Square150x150, Wide310x150, StoreLogo (50×50), with scaled versions.
- **Store logos** (optional): 1:1 300×300 and 2:3 poster, if the design agent has them.
