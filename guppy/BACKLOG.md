# Backlog

Pendientes de PDF Diva, del más próximo al menos urgente. Lo que ya está publicado sale de aquí y queda en el CHANGELOG.

## Hito 10: builds de Mac y Linux (en curso)

- [ ] **Mac**: probar el `.dmg` (rama `feat/mac`) en un Mac real y corregir lo que salga. Esperando a Nilo.
  - Sin probar todavía: pantalla completa simple con varios monitores y que la barra de menús vuelva al terminar de presentar.
- [ ] **Antes de fusionar `feat/mac`**: quitar de `.github/workflows/build-mac.yml` el disparador de push a `feat/mac` (que quede solo el de las etiquetas `v*`).
- [ ] **Acciones de GitHub**: pasar `actions/checkout`, `actions/setup-node` y `actions/upload-artifact` (v4) a las versiones con Node 24. Ahora solo dan un aviso de obsolescencia.
- [ ] **Linux** (solo Debian y Ubuntu): paquete `.deb`, aparecer en «Abrir con…» para PDFs. Sin empezar.

## Idiomas

- [ ] **Registrar los idiomas nuevos** en `src/i18n/i18n.ts`: fr, de, it, nl, pt, ca y es-an (Andalûh), ya preparados en `locales/`. `es-an` no es un código de dos letras: `resolveLanguage` lo tiene que saber manejar (que el sistema no lo elija solo, salvo que Windows lo pida) y hay que actualizar `docs/translating.md`. Revisar que los textos largos caben en la vista del orador.
