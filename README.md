# PDF Presenter

Aplicación de escritorio para presentar PDFs como en el modo presentador de PowerPoint: el público ve la diapositiva a pantalla completa en el proyector y tú ves en tu pantalla la diapositiva actual, la siguiente y los controles.

No necesita Acrobat ni ningún otro programa instalado: el PDF se muestra con un visor integrado.

## Estado

**Versión 0.3.0: primer modo presentación.** Ya puedes abrir un PDF, recorrerlo en el lector y presentarlo con dos pantallas: el público ve la diapositiva y tú ves la página actual en tu monitor.

Aún faltan la página siguiente, los botones y el cronómetro en la vista del orador, elegir en qué monitor se proyecta y el tema claro y oscuro. Llegarán en las próximas versiones. Consulta el [registro de cambios](CHANGELOG.md) para ver qué incluye cada versión.

## Requisitos

- Windows 10 u 11 (Mac y Linux, más adelante).
- De momento no hay instalador: la aplicación se ejecuta desde el código fuente (ver abajo).

## Cómo ejecutarla (versión de desarrollo)

1. Instala [Node.js](https://nodejs.org/) (versión LTS) y [Git](https://git-scm.com/).
2. Descarga el proyecto y prepara las dependencias:

   ```bash
   git clone https://github.com/nilovelez/pdf-presenter.git
   cd pdf-presenter
   npm install
   ```

3. Arranca la aplicación:

   ```bash
   npm run dev
   ```

## Uso

### Abrir un PDF

Al arrancar verás una zona con borde punteado. Haz clic en ella o en **Abrir archivo...**, o arrastra un PDF desde el Explorador de Windows.

Con el PDF abierto tienes:

- arriba, los botones **Abrir** (otro PDF) y **Presentar**;
- a un lado, las miniaturas de las páginas: haz clic en una para ir a ella;
- en el centro, la página actual;
- abajo, la ruta del archivo.

### Presentar

1. Conecta el proyector o la pantalla externa y configura Windows en modo **Extender** (`Windows + P`).
2. Pulsa **Presentar**. El público verá la diapositiva a pantalla completa en la pantalla externa y tú verás la vista del orador en tu monitor principal.
3. Pasa las diapositivas con el teclado o con tu presentador.
4. Pulsa `Esc` para terminar.

Si solo tienes una pantalla, **Presentar** abre la vista del orador en una ventana normal.

### Teclas

Las de navegación funcionan en el lector y en las dos ventanas de la presentación. La pantalla en negro y `Esc` solo tienen efecto durante la presentación.

| Acción | Teclas |
|---|---|
| Página siguiente | `AvPág`, `→`, `↓`, `Espacio`, `Intro` |
| Página anterior | `RePág`, `←`, `↑`, `Retroceso` |
| Primera página | `Inicio` |
| Última página | `Fin` |
| Pantalla del público en negro (activar o quitar) | `B`, `.` |
| Terminar la presentación | `Esc` |

Los presentadores (mandos para pasar diapositivas) envían estas mismas teclas, así que funcionan sin configurar nada.

## Problemas habituales

**El público se proyecta en la pantalla equivocada.** Por ahora la diapositiva va siempre a la pantalla que no es la principal. Comprueba en *Configuración > Sistema > Pantalla* cuál está marcada como principal. Más adelante podrás elegirla desde la aplicación.

**`npm install` falla al descargar Electron.** En algunos equipos falta el *Microsoft Visual C++ Redistributable* (x64). Descárgalo de la web de Microsoft, instálalo y vuelve a ejecutar `npm install`. Solo es necesario para la versión de desarrollo.

**El PDF no se abre y aparece un aviso.** El archivo está dañado o protegido con contraseña. Los PDF con contraseña todavía no se pueden abrir: quita la protección con el programa con el que lo creaste y vuelve a intentarlo.
