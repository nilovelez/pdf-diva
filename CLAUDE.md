# PDF Diva

Aplicación de escritorio para presentar PDFs, con un funcionamiento parecido al modo presentador de PowerPoint. Prioridad: **Windows**. Mac y Linux son deseables, pero no prioritarios.

## Estado actual

- **v1.0.0 publicada** (2026-10-05): release de GitHub con el instalador NSIS y paquete MSIX publicado en la Microsoft Store (https://apps.microsoft.com/detail/9nh5x0qbmhq1). Hitos 1 a 6 hechos.
- **v1.1.0** (hito 7): interfaz en inglés y español, según el idioma de Windows o el elegido en Ajustes.
- **Siguiente: hito 8** (builds de Mac y Linux). No se empieza sin el visto bueno del usuario.
- Guía técnica (arquitectura, comandos, empaquetado, flujo de publicación, pruebas): [`docs/developer-guide.md`](docs/developer-guide.md). La web se explica en [`docs/website.md`](docs/website.md). Las particularidades del equipo dedicado, Marcianito (compilar MSIX, pruebas con monitores), y el estado del trabajo en curso están en la memoria del proyecto.

## Producto y público (decidido)

- **Nombre**: PDF Diva. **Claim**: "A presenter view for any PDF."
- **Qué es**: una herramienta abierta y gratuita para usar un PDF como si fuera una presentación de PowerPoint, de forma sencilla, sólida y fiable.
- **Público objetivo**: técnicos de sala y operadores de streaming y vídeo; la utilidad que está instalada por si un ponente llega con un PDF en un pendrive. No es para docentes ni para creadores de contenido.
- **Qué implica** (a tener en cuenta en cada decisión):
  - Arranque rápido y cero configuración.
  - Fiabilidad bajo presión por encima de funciones nuevas. La contención es parte del producto: no añadir funciones que lo acerquen a suites de AV con API, mandos o efectos.
  - Sin cuenta, sin telemetría, sin red: todo funciona sin conexión.
  - Vista del orador legible de un vistazo, a distancia y con poca luz.
  - Nada que interrumpa durante una presentación (avisos de actualización, diálogos, etc.).
- **Por qué este nombre**: los técnicos recuerdan las herramientas por un nombre único (HandBrake, OBS) y los nombres descriptivos como "PDF Presenter" chocan siempre con otros proyectos. El nombre aporta carácter y el claim explica lo que hace.
- **Tono**: el humor y el personaje viven en el nombre y la identidad. Los controles, los avisos y los mensajes de error son sobrios y claros.

## Objetivo

Al abrir un PDF, la app ofrece la opción de **presentarlo**:

- **Ventana del público**: pantalla completa, sin controles ni marco, en el monitor secundario. Solo muestra la página actual.
- **Ventana del orador**: en el monitor principal. Muestra la página actual (grande), la página siguiente (pequeña), el número de página ("Página 3 de 30") y controles básicos (anterior, siguiente, salir).
- El paso de diapositivas debe funcionar con las teclas de avanzar/retroceder página, para que sea compatible con cualquier presenter estándar.

## Principios (importan más que cualquier otra cosa)

1. **Sencillo de mantener**: poco código propio, pocas dependencias, sin frameworks de UI innecesarios.
2. **Estable**: preferir soluciones probadas. No añadir dependencias nuevas sin justificarlo.
3. **Autocontenido**: el PDF se renderiza con una librería integrada. La app NO debe depender de Acrobat, OpenOffice ni nada instalado en el equipo.

## Stack

- **Electron** (proceso principal + ventanas de renderizado)
- **TypeScript** (estricto, `"strict": true`)
- **PDF.js** (`pdfjs-dist`) para renderizar a `<canvas>`
- **electron-builder** para empaquetar (NSIS en Windows; `.dmg` y `AppImage`/`.deb` más adelante)
- UI en **HTML + CSS + TypeScript sin framework** (no usar React/Vue salvo que haya una razón clara)
- Bundler sencillo (Vite o esbuild) solo si hace falta; mantener la configuración mínima

## Arquitectura

```
Proceso principal (main)
 ├─ Estado: página, total, pantalla en negro, nº de monitores; PDF y contraseña solo en memoria
 ├─ Gestión de ventanas y monitores (módulo `screen`): colocación al empezar y al cambiar los monitores
 ├─ Ajustes (settings.json en userData: monitor del orador y tema) y bloqueo de red
 └─ IPC: recibe acciones y emite el estado a las ventanas

Ventana principal (launcher)
 └─ Inicio (abrir PDF por diálogo o arrastrando) y lector con miniaturas; ajustes; diálogo de contraseña;
    botones para presentar (con vista del orador, o duplicar pantalla)

Ventana del público (audience)
 └─ Sin marco, pantalla completa. Canvas con la página actual ajustada a la pantalla (negro si se pide).

Ventana del orador (presenter)
 └─ Página actual, siguiente, "N de M", controles, cronómetro, alternar pantallas, pantalla en negro, salir.
```

Modos de presentación: `presenter` (vista del orador + público en otro monitor) y `mirror` (una ventana de público en cada monitor).

### Sincronización

- El **proceso principal es la única fuente de verdad** del estado (página actual).
- Las ventanas envían acciones por IPC (`next`, `prev`, `first`, `last`, `goto`, `toggleBlack`, `swapScreens`, `exit`) y reciben el estado actualizado; cada una renderiza lo que le toca. Solo las ventanas de la presentación pueden consultar o controlarla.
- Usar `contextIsolation: true`, `nodeIntegration: false` y un `preload` con `contextBridge` para exponer solo la API IPC necesaria.
- **Sin red**: la app no hace ninguna conexión (PRIVACY.md lo promete). No añadir nada que la necesite.

## Teclas

Los presenters estándar envían teclas normales. Capturar `keydown` en **ambas** ventanas (público y orador):

| Acción | Teclas |
|---|---|
| Siguiente | `PageDown`, `ArrowRight`, `ArrowDown`, `Space`, `Enter` |
| Anterior | `PageUp`, `ArrowLeft`, `ArrowUp`, `Backspace` |
| Pantalla en negro (alternar) | `B`, `.` |
| Salir de la presentación | `Esc` |
| Primera / última página | `Home` / `End` |

Si la ventana del público tiene el foco (por ejemplo, tras hacer clic en ella), las teclas deben seguir funcionando.

## Requisitos de comportamiento

- **Un solo monitor**: la presentación debe seguir siendo usable (por ejemplo, la vista del orador en ventana normal, o pantalla completa simple).
- **Cambios de monitores en caliente**: escuchar `display-added` y `display-removed` y recolocar las ventanas sin cerrar la presentación.
- **Elegir monitor de proyección**: ofrecer un selector, porque el sistema puede identificar mal cuál es el secundario.
- **Renderizado nítido**: tener en cuenta `devicePixelRatio` y el tamaño real de la pantalla (4K).
- **Pre-renderizar la página siguiente** para que el cambio de diapositiva sea instantáneo.
- **PDFs grandes**: cargar páginas bajo demanda; no renderizar todo el documento al abrir.
- **Ajuste de página**: mantener la proporción y centrar sobre fondo negro (letterboxing).
- **PDFs con páginas de distinto tamaño**: calcular la escala por página.
- **PDF corrupto, protegido con contraseña o ilegible**: mostrar un mensaje claro, sin que la app se cierre.

## Estructura de carpetas

```
pdf-diva/
├─ CLAUDE.md, README.md, CHANGELOG.md, PRIVACY.md, LICENSE, THIRD-PARTY-NOTICES.md
├─ package.json, tsconfig.json, esbuild.mjs, eslint.config.mjs, electron-builder.yml
├─ src/
│  ├─ main/            # proceso principal: main (IPC), presentation (estado y colocación de ventanas),
│  │                   #   windows, displays, settings
│  ├─ preload/         # contextBridge con la API IPC
│  ├─ renderer/
│  │  ├─ launcher/     # inicio + lector (miniaturas, ajustes, contraseña)
│  │  ├─ audience/     # ventana del público
│  │  ├─ presenter/    # ventana del orador
│  │  └─ shared/       # PDF.js, render con caché, sesión, teclas, iconos, i18n (traducir la página), theme.css
│  ├─ i18n/            # idiomas disponibles, elección según el sistema, translate()
│  └─ types/           # tipos compartidos (mensajes IPC en ipc.ts)
├─ locales/            # textos de la interfaz, un JSON por idioma (en.json es la referencia)
├─ resources/icons/    # iconos de la interfaz (Phosphor); app/ = iconos de la aplicación (.ico, baldosas MSIX)
├─ docs/               # developer-guide.md, translating.md, website.md, store-listing.md, maquetas de diseño
├─ site/               # la web (GitHub Pages); scripts/ genera su página de privacidad
└─ .github/workflows/  # despliegue de la web
```

## Convenciones de código

- TypeScript estricto; evitar `any`.
- Tipar los mensajes IPC en un único archivo compartido (`src/types`).
- Funciones pequeñas y nombres claros. Comentarios solo donde el "porqué" no sea obvio.
- **Texto de interfaz**: nunca escrito directamente en el HTML ni en el código; va en `locales/*.json` (marcas `data-i18n` en el HTML y `t()` en TypeScript). Cada texto nuevo se añade a la vez a `en.json` (la referencia) y a `es.json`. Los textos deben aguantar idiomas más largos sin romper la maquetación. Detalles en `docs/developer-guide.md` y `docs/translating.md`.
- **Idioma del proyecto: inglés.** Mensajes de commit, mensajes de los tags, README, CHANGELOG, documentación para usuarios, nombres de archivos y carpetas nuevos y comentarios del código, en **inglés**, aunque la conversación con el usuario sea en español. Los commits anteriores a la v0.4.0 se quedan como están. Los comentarios nuevos van en inglés; los existentes se traducen cuando se toque cada archivo (sin un commit enorme de traducción).
- Sin dependencias nuevas sin comentarlo primero.
- **Licencia y créditos**: el proyecto es GPL-3.0-or-later (`LICENSE`). Al añadir o quitar una dependencia o un recurso (iconos, fuentes, imágenes), actualizar `THIRD-PARTY-NOTICES.md` en el mismo cambio. El instalador (hito 6) debe incluir `LICENSE`, `THIRD-PARTY-NOTICES.md` y los textos de licencia de pdfjs-dist, Electron y Phosphor.

## Comandos

```bash
npm install
npm run dev          # compilar y arrancar la app
npm run build        # compilar con esbuild a dist/
npm run typecheck    # tsc --noEmit (debe pasar antes de cada commit)
npm run lint         # ESLint (debe pasar antes de cada commit)
npm run pack         # app empaquetada sin instalar, en release/win-unpacked/
npm run dist         # instalador NSIS: release/PDF-Diva-Setup-<versión>.exe
npm run dist:store   # paquete MSIX sin firmar: release/PDF-Diva-<versión>.appx
```

En Windows no existe `python3`: para scripts de Python usar `python` o `py`.

No hay tests automáticos: se prueba la app real controlándola por el protocolo de DevTools (ver `docs/developer-guide.md`). Para compilar el MSIX hacen falta ajustes (herramientas del SDK y `ELECTRON_BUILDER_CACHE`): están en la memoria del proyecto.

## Plan por hitos

Hitos 1 a 7 hechos (v0.1.0 a v1.1.0). El siguiente es el 8. Pendientes sin hito (opiniones reales de usuarios): vista del orador que se adapte mejor a resoluciones grandes; más de dos monitores (dos vistas del orador y una salida al público); que «Alternar pantallas» persista entre presentaciones; registrar PDF Diva como aplicación para abrir PDFs («Abrir con…» y predeterminada; primero estudiarlo).

1. **Esqueleto**: proyecto Electron + TypeScript que abre una ventana.
2. **Visor básico**: abrir un PDF y renderizar una página con PDF.js; navegar con teclado.
3. **Modo presentación**: dos ventanas (público y orador) en monitores distintos, sincronizadas por IPC.
4. **Vista del orador completa**: página siguiente, "Página X de Y", controles y cronómetro.
5. **Robustez**: un solo monitor, cambios de monitores, selector de monitor, errores de PDF.
6. **Empaquetado y distribución (Windows)**, dos canales con electron-builder: (1) Microsoft Store con paquete MSIX (target `appx`), que la Store firma gratis y sin aviso de SmartScreen; (2) instalador NSIS sin firmar en GitHub Releases, para equipos con la Store bloqueada (SmartScreen avisará; se explica en el README). Firma: nada de certificados de pago anuales (el instalador de GitHub queda sin firmar); Azure Artifact Signing no está disponible para particulares en España. `appId` com.nilovelez.pdfdiva; la identidad del paquete de la Store (Identity Name, Publisher, nombre reservado) sale de Partner Center. La política de privacidad es `PRIVACY.md`.
7. **Multiidioma**: interfaz traducible, con el español y el inglés como primeros idiomas (el inglés va antes que Mac y Linux).
8. **Extra (baja prioridad)**: builds de Mac y Linux.

## Fuera de alcance (por ahora)

- Edición o anotación de PDFs.
- Conversión desde PowerPoint u otros formatos.
- Notas del orador (el formato PDF no las incluye de forma estándar).
- Sincronización en la nube o funciones de red.

## Notas para Claude Code

- Antes de implementar algo grande, proponer el plan en pocas líneas.
- Probar siempre el flujo completo con dos monitores y también con uno solo.
- **Sin capturas de pantalla** en las pruebas de cada hito: llevan mucho tiempo y el usuario comprueba el aspecto visual cuando prueba la versión. Solo si hace falta para depurar un problema concreto.
- Mantener el proceso principal lo más fino posible; la lógica de render va en los renderers.
- Si hay que elegir entre una solución "lista" y una "sencilla de mantener", elegir la sencilla.
- **Commits modulares**: uno por paso lógico (`chore:`, `feat:`, `fix:`, `docs:`), pequeños y, cuando sea posible, de forma que cada uno compile por sí solo. Nada de un único commit gigante.
- **Una etiqueta por hito**: al cerrar un hito, tag anotado (`git tag -a v0.5.0 -m "Milestone 5: ..."`) y `package.json` a la misma versión. Hito 1 = v0.1.0, hito 2 = v0.2.0, etc.; v1.0.0 cuando el instalador de Windows (hito 6) esté listo.
- **Al empezar una sesión nueva**, renombrarla con el nombre de un personaje de ficción (herramienta `set_session_title` de Remote Control; si no está disponible, decirlo y seguir). No repetir nombres: la lista de los ya usados está en la memoria del proyecto (`workflow`); añadir el nuevo.
- **Una sola sesión** hace todo: código, pruebas, documentación técnica y para usuarios (`CHANGELOG.md`, README, `PRIVACY.md`), la web (`site/`) y los textos de la Store. La documentación para usuarios va en inglés, corta y solo con lo relevante para un usuario (el CHANGELOG sigue Keep a Changelog: Added / Changed / Fixed).
- **Lista para un relevo en cualquier momento**: el usuario puede parar la sesión y abrir otra nueva. Hacer commit en cuanto un paso compile y push a menudo; el trabajo de un hito a medias va en una rama `feat/...` subida al repo; actualizar la nota de estado de la memoria del proyecto tras cada paso lógico (hecho, en curso, siguiente, esperando al usuario). Lo técnico y estable va en el repo (este archivo, `docs/developer-guide.md`), no solo en la memoria.
- **Rama `development`**: es del usuario, para sus cambios a mano. Al empezar cada sesión y antes de cada push, `git fetch origin development`; si trae commits que no están en `main`, revisarlos, fusionarlos en `main` con merge (nunca rebase), pasar typecheck y lint, hacer push de `main` y luego avanzar `development` hasta `main` (fast-forward) y subirla. Nunca force-push.
- **Publicación**: la sesión hace todos los commits y push a `main` (nadie más escribe en `main`). Hay que ejecutar los comandos de git sueltos (`git push origin main`, `git push origin vX.Y.Z`); encadenados o con tuberías los deniega el sistema de permisos. La release de GitHub la crea el **usuario desde la web** (no hay `gh`) y el usuario sube el `.appx` a Partner Center; la sesión le prepara el texto de la release y deja el instalador y el `.appx` en la carpeta compartida.
- **Flujo por hito**: al terminar un hito, CHANGELOG y README, subir la versión en `package.json`, tag anotado, push de `main` con su tag y PARAR. No empezar el hito siguiente hasta que el usuario haya probado la app en otro equipo y dé el visto bueno. Así se detectan los problemas pronto y no se gasta trabajo en algo sin aprobar.
- **Confirmar con el usuario** todo cambio de `CLAUDE.md`, de permisos o de ajustes del sistema (resolución, escala, tema de Windows, registro), las dependencias nuevas y cualquier publicación nueva.
- Marcianito es el equipo dedicado a los agentes. Solo se modifican archivos en Marcianito; en otros equipos desde los que el usuario abra sesiones, solo lectura salvo petición expresa. Los cambios llegan a otros equipos por git.
