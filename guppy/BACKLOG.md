# Backlog

Pendientes de PDF Diva, del más próximo al menos urgente. Lo que ya está publicado sale de aquí y queda en el CHANGELOG.

## Hito 10: builds de Mac y Linux (en curso)

- [ ] **Mac**: probar el `.dmg` (rama `feat/mac`) en un Mac real y corregir lo que salga. Esperando a Nilo.
  - Sin probar todavía: pantalla completa simple con varios monitores y que la barra de menús vuelva al terminar de presentar.
- [ ] **Antes de fusionar `feat/mac`**: quitar de `.github/workflows/build-mac.yml` el disparador de push a `feat/mac` (que quede solo el de las etiquetas `v*`).
- [ ] **Acciones de GitHub**: pasar `actions/checkout`, `actions/setup-node` y `actions/upload-artifact` (v4) a las versiones con Node 24. Ahora solo dan un aviso de obsolescencia.
- [ ] **Linux** (solo Debian y Ubuntu): probar el `.deb` (rama `feat/linux`) en Linux Mint y Ubuntu 22.04 y corregir lo que salga. Esperando a Nilo.
  - Sin probar todavía: varios monitores, Wayland (la app fuerza X11/XWayland), que no se haga visor predeterminado de PDF.
  - Pendiente: README, guía técnica y web para Linux; `PRIVACY.md` dice que desinstalar borra los ajustes, y `apt remove` no toca `~/.config/PDF Diva`.
- [ ] **Antes de fusionar `feat/linux`**: fusionar antes `feat/mac` y quitar de `.github/workflows/build-linux.yml` el disparador de push a `feat/linux`.
- [ ] **Runner de Linux**: `ubuntu-latest` pasa a Ubuntu 26 desde el 19 de octubre de 2026; comprobar que el build sigue bien o fijar `ubuntu-24.04`.

## Idiomas

- [ ] **Registrar los idiomas nuevos** en `src/i18n/i18n.ts`: fr, de, it, nl, pt, ca y es-x-andaluh (Andalûh), ya preparados en `locales/`. El andaluz nunca se elige automáticamente (ningún sistema tiene ese locale y `es-*` acaba en `es`), pero se puede escoger en Ajustes; su etiqueta es de uso privado (`es-x-andaluh`, válida en BCP 47), así que la clave en `CATALOGS` va entre comillas y `docs/translating.md` debe explicar la excepción a la regla de las dos letras. Revisar que los textos largos caben en la vista del orador.
