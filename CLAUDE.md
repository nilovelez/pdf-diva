# PDF Presenter

Aplicación de escritorio para presentar PDFs, con un funcionamiento parecido al modo presentador de PowerPoint. Prioridad: **Windows**. Mac y Linux son deseables, pero no prioritarios.

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
 ├─ Estado: ruta del PDF, página actual, total de páginas, modo presentación
 ├─ Gestión de ventanas y monitores (módulo `screen` de Electron)
 └─ IPC: recibe órdenes (siguiente, anterior, ir a página, salir) y emite el estado a las ventanas

Ventana principal (launcher)
 └─ Abrir PDF (diálogo o arrastrar y soltar) y botón "Presentar"

Ventana del público (audience)
 └─ Sin marco, pantalla completa, monitor secundario. Canvas con la página actual ajustada a la pantalla.

Ventana del orador (presenter)
 └─ Monitor principal. Página actual, página siguiente, "Página X de Y", controles, cronómetro (opcional).
```

### Sincronización

- El **proceso principal es la única fuente de verdad** del estado (página actual).
- Las ventanas envían acciones por IPC (`next`, `prev`, `goto`, `exit`) y reciben el estado actualizado; cada una renderiza lo que le toca.
- Usar `contextIsolation: true`, `nodeIntegration: false` y un `preload` con `contextBridge` para exponer solo la API IPC necesaria.

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

## Estructura de carpetas sugerida

```
pdf-presenter/
├─ CLAUDE.md
├─ package.json
├─ tsconfig.json
├─ electron-builder.yml
├─ src/
│  ├─ main/            # proceso principal: ventanas, monitores, IPC, estado
│  ├─ preload/         # contextBridge con la API IPC
│  ├─ renderer/
│  │  ├─ launcher/     # ventana principal
│  │  ├─ audience/     # ventana del público
│  │  ├─ presenter/    # ventana del orador
│  │  └─ shared/       # utilidades comunes (carga y render con PDF.js, manejo de teclas)
│  └─ types/           # tipos compartidos (mensajes IPC, estado)
└─ resources/          # iconos
```

## Convenciones de código

- TypeScript estricto; evitar `any`.
- Tipar los mensajes IPC en un único archivo compartido (`src/types`).
- Funciones pequeñas y nombres claros. Comentarios solo donde el "porqué" no sea obvio.
- Texto de interfaz en **español** (preparar las cadenas para poder traducirlas más adelante).
- Sin dependencias nuevas sin comentarlo primero.

## Comandos (ajustar al crear el proyecto)

```bash
npm install
npm run dev        # arrancar en modo desarrollo
npm run build      # compilar
npm run dist       # generar instalador con electron-builder
npm run lint
npm run typecheck
```

## Plan por hitos

1. **Esqueleto**: proyecto Electron + TypeScript que abre una ventana.
2. **Visor básico**: abrir un PDF y renderizar una página con PDF.js; navegar con teclado.
3. **Modo presentación**: dos ventanas (público y orador) en monitores distintos, sincronizadas por IPC.
4. **Vista del orador completa**: página siguiente, "Página X de Y", controles y cronómetro.
5. **Robustez**: un solo monitor, cambios de monitores, selector de monitor, errores de PDF.
6. **Empaquetado**: instalador de Windows con electron-builder.
7. **Extra (baja prioridad)**: builds de Mac y Linux.

## Fuera de alcance (por ahora)

- Edición o anotación de PDFs.
- Conversión desde PowerPoint u otros formatos.
- Notas del orador (el formato PDF no las incluye de forma estándar).
- Sincronización en la nube o funciones de red.

## Notas para Claude Code

- Antes de implementar algo grande, proponer el plan en pocas líneas.
- Probar siempre el flujo completo con dos monitores y también con uno solo.
- Mantener el proceso principal lo más fino posible; la lógica de render va en los renderers.
- Si hay que elegir entre una solución "lista" y una "sencilla de mantener", elegir la sencilla.
- **Commits modulares**: uno por paso lógico (`chore:`, `feat:`, `fix:`, `docs:`), pequeños y, cuando sea posible, de forma que cada uno compile por sí solo. Nada de un único commit gigante. No hacer push salvo petición expresa.
- **Una etiqueta por hito**: al cerrar un hito, tag anotado (`git tag -a v0.2.0 -m "Hito 2: ..."`) y `package.json` a la misma versión. Hito 1 = v0.1.0, hito 2 = v0.2.0, etc.; v1.0.0 cuando el instalador de Windows (hito 6) esté listo.
- **Documentación para el usuario final** (`CHANGELOG.md`, README, guías): la escribe la sesión "Coordinador", en su worktree y rama `docs/...`, en español, corta y solo con lo relevante para un usuario (el CHANGELOG sigue Keep a Changelog: Añadido / Cambiado / Corregido). Flujo al cerrar un hito: yo le paso un resumen corto de lo que cambia para el usuario (funciones, teclas, requisitos, limitaciones), ella escribe la entrada y actualiza el README, yo hago merge a `main`, subo la versión en `package.json` y pongo el tag. La documentación técnica (este archivo, comentarios en el código) es mía.
- **Flujo por hito**: al terminar un hito (con documentación, versión y tag) hacer push de `main` con sus tags y PARAR. No empezar el hito siguiente hasta que el usuario haya probado la app en otro equipo y se pasen sus indicaciones (vía el Coordinador). Así se detectan los problemas pronto y no se gasta trabajo en algo sin aprobar.
- BOB es el equipo dedicado a los agentes. Solo se modifican archivos en BOB; en otros equipos desde los que el usuario abra sesiones, solo lectura salvo petición expresa. Los cambios llegan a otros equipos por git.
