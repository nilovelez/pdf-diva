# Backlog

Pendientes de PDF Diva, del más próximo al menos urgente. Lo que ya está publicado sale de aquí y queda en el CHANGELOG.

## Hito 10: builds de Mac y Linux (en curso)

- [ ] **Mac**: probar el `.dmg` (rama `feat/mac`) en un Mac real y corregir lo que salga. Esperando a Nilo.
  - Sin probar todavía: pantalla completa simple con varios monitores y que la barra de menús vuelva al terminar de presentar.
- [ ] **Antes de fusionar `feat/mac`**: quitar de `.github/workflows/build-mac.yml` el disparador de push a `feat/mac` (que quede solo el de las etiquetas `v*`).
- [ ] **Acciones de GitHub**: pasar `actions/checkout`, `actions/setup-node` y `actions/upload-artifact` (v4) a las versiones con Node 24. Ahora solo dan un aviso de obsolescencia.
- [ ] **Linux** (solo Debian y Ubuntu): paquete `.deb`, aparecer en «Abrir con…» para PDFs. Sin empezar.

## Idiomas

- [ ] **Registrar los idiomas nuevos** en `src/i18n/i18n.ts`: fr, de, it, nl, pt, ca y es-x-andaluh (Andalûh), ya preparados en `locales/`. El andaluz nunca se elige automáticamente (ningún sistema tiene ese locale y `es-*` acaba en `es`), pero se puede escoger en Ajustes; su etiqueta es de uso privado (`es-x-andaluh`, válida en BCP 47), así que la clave en `CATALOGS` va entre comillas y `docs/translating.md` debe explicar la excepción a la regla de las dos letras. Revisar que los textos largos caben en la vista del orador.
