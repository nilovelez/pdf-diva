# PDF Presenter

Aplicación de escritorio para presentar PDFs como en el modo presentador de PowerPoint: el público ve la diapositiva a pantalla completa en el proyector y tú ves en tu pantalla la diapositiva actual, la siguiente, el cronómetro y los controles.

No necesita Acrobat ni ningún otro programa instalado: el PDF se muestra con un visor integrado.

## Estado

**Versión 0.4.0: vista del orador completa.** Ya puedes presentar con vista del orador (diapositiva actual, siguiente y cronómetro) o duplicar la diapositiva en todas las pantallas. La aplicación sigue el tema claro u oscuro de Windows.

Todavía no puedes elegir en qué monitor se proyecta, ni hay instalador. Llegarán en las próximas versiones. Consulta el [registro de cambios](CHANGELOG.md) para ver qué incluye cada versión.

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

Para actualizar a una versión nueva: `git pull`, `npm install` y `npm run dev`.

## Uso

### Abrir un PDF

Al arrancar verás una zona con borde punteado. Haz clic en ella o en **Abrir archivo...**, o arrastra un PDF desde el Explorador de Windows.

Con el PDF abierto tienes:

- arriba, el botón **Abrir** (otro PDF), los botones para presentar y, a la derecha, las flechas y «Página X de Y»;
- a un lado, las miniaturas de las páginas: haz clic en una para ir a ella;
- en el centro, la página actual;
- abajo, la ruta del archivo.

### Presentar

Conecta el proyector o la pantalla externa y configura Windows en modo **Extender** (`Windows + P`). La barra superior muestra dos formas de presentar:

- **Con vista del orador**: el público ve la diapositiva a pantalla completa en la pantalla externa y tú ves la vista del orador en tu monitor principal.
- **Duplicar pantalla**: la diapositiva a pantalla completa en todas las pantallas, sin vista del orador.

Pasa las diapositivas con el teclado o con tu presentador, y pulsa `Esc` para terminar.

Si solo hay una pantalla, la barra muestra un único botón, **Presentar**, que abre la vista del orador en una ventana normal. La barra se actualiza sola al conectar o desconectar una pantalla.

### Vista del orador

- **Arriba**, el cronómetro. Empieza a contar al iniciar la presentación. **Pausar** lo detiene (y pasa a **Reanudar**) y **Reiniciar** lo pone a cero.
- **En el centro**, la diapositiva actual con «1 de 40» debajo, y a la derecha la siguiente.
- **Abajo**, los botones **Anterior** y **Siguiente**, **Pantalla en negro** (se queda en naranja mientras está activa) y **Salir**.

### Teclas

Las de navegación funcionan en el lector y en todas las ventanas de la presentación. La pantalla en negro y `Esc` solo tienen efecto durante la presentación.

| Acción | Teclas |
|---|---|
| Página siguiente | `AvPág`, `→`, `↓`, `Espacio`, `Intro` |
| Página anterior | `RePág`, `←`, `↑`, `Retroceso` |
| Primera página | `Inicio` |
| Última página | `Fin` |
| Pantalla del público en negro (activar o quitar) | `B`, `.` |
| Terminar la presentación | `Esc` |

Los presentadores (mandos para pasar diapositivas) envían estas mismas teclas, así que funcionan sin configurar nada.

### Tema claro y oscuro

La aplicación usa el mismo tema que Windows (*Configuración > Personalización > Colores*). La pantalla del público es siempre negra y las páginas del PDF se ven con sus colores originales.

## Problemas habituales

**El público se proyecta en la pantalla equivocada.** Por ahora la diapositiva va siempre a la pantalla que no es la principal. Comprueba en *Configuración > Sistema > Pantalla* cuál está marcada como principal. Más adelante podrás elegirla desde la aplicación.

**Conecté el proyector con la presentación ya empezada.** Todavía no se recolocan las ventanas en mitad de una presentación. Pulsa `Esc` y vuelve a presentar.

**`npm install` falla al descargar Electron.** En algunos equipos falta el *Microsoft Visual C++ Redistributable* (x64). Descárgalo de la web de Microsoft, instálalo y vuelve a ejecutar `npm install`. Solo es necesario para la versión de desarrollo.

**El PDF no se abre y aparece un aviso.** El archivo está dañado o protegido con contraseña. Los PDF con contraseña todavía no se pueden abrir: quita la protección con el programa con el que lo creaste y vuelve a intentarlo.

## Créditos

Iconos de [Phosphor Icons](https://phosphoricons.com), con licencia MIT.
