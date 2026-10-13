# Backlog

Pendientes de PDF Diva, del más próximo al menos urgente. Lo que ya está publicado sale de aquí y queda en el CHANGELOG.

## Hito 11: refinamiento (v1.5.0)

Hecho y etiquetado (v1.5.0, 2026-10-13); esta sección sale de aquí cuando la release esté publicada.

- [x] **Vista del orador: borde no uniforme.** El 16:9 se aplica ahora al hueco interior (`content-box` en `#current` y `#next`).
- [x] **Ajustes: selector de tema más visual.** Tres tarjetas con una vista del orador en miniatura en cada tema (Sistema partida en diagonal), según `docs/design/mockup-theme-picker.html`.
- [x] **Lector: fondo de la miniatura desplazado.** La columna de miniaturas toma el ancho que necesita, con el hueco de la barra de desplazamiento reservado.

- [x] **Nombres de archivo más claros en las descargas**: `PDF-Diva-Windows-<versión>.exe`, `PDF-Diva-macOS-<versión>.dmg` y `PDF-Diva-Linux-x64-<versión>.deb`. En la 1.5.0, Nilo renombra a mano los archivos de la release (ya compilados con los nombres antiguos); desde la siguiente versión salen así de `electron-builder.yml`. El `.appx` se queda como está.

## Tras la v1.4.0

- [ ] **Runner de Linux**: `ubuntu-latest` pasa a Ubuntu 26 desde el 19 de octubre de 2026; comprobar que el build sigue bien o fijar `ubuntu-24.04`.

## Riesgos conocidos y sin probar

- **Linux con Wayland + XWayland en un equipo real**: sin probar. En Ubuntu 24.04 en VirtualBox la ventana no se pinta (`dri_gbm.so … Permission denied`, `XGetWindowAttributes failed`), probablemente por el gráfico virtual; en Wayland nativo (`--ozone-platform=wayland`) abre, pero no reparte las ventanas entre monitores. El README recomienda «Ubuntu on Xorg» si la ventana no aparece. Probado y bien con X11: Linux Mint 22.3 MATE (dos pantallas) y Ubuntu 24.04 desde USB, ambos en equipos reales.
- **Prueba de humo en Linux**: fallo intermitente visto una vez (run 37924875024): tras flecha derecha + Esc, el lector no volvió en la página 2. La prueba distingue ahora si se pierde la pulsación o la vuelta al lector, y espera 1 s antes de pasar página; si se repite, investigar (un pasador no puede perder pulsaciones).
- **Mac**: probado por Nilo en un MacBook con Apple silicon y un monitor externo, todo bien a la primera (2026-10-10). Sin probar: un Mac Intel y tres monitores.
