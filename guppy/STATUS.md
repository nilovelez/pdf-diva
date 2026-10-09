---
estado: bloqueado
siguiente_paso: Probar el .dmg del Mac en un Mac real y corregir lo que salga; después, Linux (Debian y Ubuntu).
bloqueo: "Nilo: resultado de la prueba del .dmg en un Mac real."
actualizado: 2026-10-09
---

# Estado

La v1.3.0 (hito 9) está publicada en GitHub y en la Microsoft Store (aprobada el 2026-10-09). El hito 10 (builds de Mac y Linux) está en curso en la rama `feat/mac`: GitHub Actions compila un `.dmg` universal con firma ad hoc que pasa la prueba de humo. Falta probarlo en un Mac real; Linux aún no ha empezado.

Aparte, hay seis idiomas nuevos preparados en `locales/` (francés, alemán, italiano, neerlandés, portugués, catalán y andaluz EPA), pero aún no están registrados en la app (`src/i18n/i18n.ts`).

## Diario

- 2026-10-09: el andaluz pasa a `es-x-andaluh.json` (etiqueta BCP 47 válida; nunca automático, se elige a mano).
- 2026-10-09: andaluz (Andalûh, EPA) en `locales/es-an.json`, sin registrar; backlog al día.
- 2026-10-09: traducciones fr, de, it, nl, pt (de Portugal) y ca en `locales/`, sin registrar todavía en la app.
- 2026-10-09: la Store aprueba la 1.3.0; vuelve el botón de la Store a la web.
- 2026-10-08: backlog movido de docs/developer-guide.md a guppy/BACKLOG.md y puesto al día.
- 2026-10-08: guppy/STATUS.md creado.
