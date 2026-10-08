# Backlog

Pendientes de PDF Diva, del más próximo al menos urgente. Lo que ya está publicado sale de aquí y queda en el CHANGELOG.

## Hito 10: builds de Mac y Linux (en curso)

- [ ] **Mac**: probar el `.dmg` (rama `feat/mac`) en un Mac real y corregir lo que salga. Esperando a Nilo.
  - Sin probar todavía: pantalla completa simple con varios monitores y que la barra de menús vuelva al terminar de presentar.
- [ ] **Antes de fusionar `feat/mac`**: quitar de `.github/workflows/build-mac.yml` el disparador de push a `feat/mac` (que quede solo el de las etiquetas `v*`).
- [ ] **Acciones de GitHub**: pasar `actions/checkout`, `actions/setup-node` y `actions/upload-artifact` (v4) a las versiones con Node 24. Ahora solo dan un aviso de obsolescencia.
- [ ] **Linux** (solo Debian y Ubuntu): paquete `.deb`, aparecer en «Abrir con…» para PDFs. Sin empezar.

## Distribución

- [ ] **Web**: volver a poner el botón de la Microsoft Store (y el del instalador como secundario) cuando la Store apruebe la 1.3.0. Esperando a Microsoft.
