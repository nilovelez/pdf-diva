# PDF Presenter

Aplicación de escritorio para presentar PDFs como en el modo presentador de PowerPoint: el público ve la diapositiva a pantalla completa en el proyector y tú ves en tu pantalla la diapositiva actual, la siguiente y los controles.

No necesita Acrobat ni ningún otro programa instalado: el PDF se muestra con un visor integrado.

## Estado

**Versión 0.2.0: visor básico.** Ya puedes abrir un PDF y recorrerlo con el teclado o con un presentador, en una sola ventana.

Todavía **no** está el modo presentación con dos pantallas (ventana del público y ventana del orador). Llegará en las próximas versiones. Consulta el [registro de cambios](CHANGELOG.md) para ver qué incluye cada versión.

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

1. Pulsa **Abrir PDF…** y elige el archivo.
2. Se muestra la primera página. En la barra superior verás el nombre del archivo y «Página X de Y».
3. Avanza y retrocede con el teclado o con tu presentador:

| Acción | Teclas |
|---|---|
| Página siguiente | `AvPág`, `→`, `↓`, `Espacio`, `Intro` |
| Página anterior | `RePág`, `←`, `↑`, `Retroceso` |
| Primera página | `Inicio` |
| Última página | `Fin` |

Los presentadores (mandos para pasar diapositivas) envían estas mismas teclas, así que funcionan sin configurar nada.

## Problemas habituales

**`npm install` falla al descargar Electron.** En algunos equipos falta el *Microsoft Visual C++ Redistributable* (x64). Descárgalo de la web de Microsoft, instálalo y vuelve a ejecutar `npm install`. Solo es necesario para la versión de desarrollo.

**El PDF no se abre y aparece un aviso.** El archivo está dañado o protegido con contraseña. Los PDF con contraseña todavía no se pueden abrir: quita la protección con el programa con el que lo creaste y vuelve a intentarlo.
