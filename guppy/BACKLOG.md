# Backlog

Pendientes de PDF Diva, del más próximo al menos urgente. Lo que ya está publicado sale de aquí y queda en el CHANGELOG.

## Hito 11: refinamiento (v1.5.0)

Cambios menores sin prisa; no bloquean la promoción ni el mantenimiento. Los tres primeros están hechos en la rama `feat/refinement` (2026-10-13), pendientes de que Nilo pruebe el instalador.

- [x] **Vista del orador: borde no uniforme.** El 16:9 se aplica ahora al hueco interior (`content-box` en `#current` y `#next`).
- [x] **Ajustes: selector de tema más visual.** Tres tarjetas con una vista del orador en miniatura en cada tema (Sistema partida en diagonal), según `docs/design/mockup-theme-picker.html`.
- [x] **Lector: fondo de la miniatura desplazado.** La columna de miniaturas toma el ancho que necesita, con el hueco de la barra de desplazamiento reservado.

## Siguiente versión

- [ ] **Nombres de archivo más claros en las descargas.** Ahora son `PDF-Diva-Setup-1.5.0.exe`, `PDF-Diva-1.5.0.dmg` y `PDF-Diva-1.5.0-amd64.deb`, y a quien no es técnico no le dicen para qué sistema son. Propuesta de Nilo: `PDF-Diva-Windows-1.5.0.exe`, `PDF-Diva-MacOs-1.5.0.dmg` y `PDF-Diva-Linux-amd64-1.5.0.deb`; el formato final está por decidir. Se cambia el `artifactName` de `nsis`, `mac`/`dmg` y `linux`/`deb` en `electron-builder.yml`, y los nombres que citan el README, la web (enlaces de descarga) y las notas de la release. Los workflows usan comodines (`release/*.dmg`, `release/*.deb`), así que no cambian. El `.appx` no lo ve el usuario (va a la Store) y se queda como está.

## Tras la v1.4.0

- [ ] **Runner de Linux**: `ubuntu-latest` pasa a Ubuntu 26 desde el 19 de octubre de 2026; comprobar que el build sigue bien o fijar `ubuntu-24.04`.

## Riesgos conocidos y sin probar

- **Linux con Wayland + XWayland en un equipo real**: sin probar. En Ubuntu 24.04 en VirtualBox la ventana no se pinta (`dri_gbm.so … Permission denied`, `XGetWindowAttributes failed`), probablemente por el gráfico virtual; en Wayland nativo (`--ozone-platform=wayland`) abre, pero no reparte las ventanas entre monitores. El README recomienda «Ubuntu on Xorg» si la ventana no aparece. Probado y bien con X11: Linux Mint 22.3 MATE (dos pantallas) y Ubuntu 24.04 desde USB, ambos en equipos reales.
- **Prueba de humo en Linux**: fallo intermitente visto una vez (run 37924875024): tras flecha derecha + Esc, el lector no volvió en la página 2. La prueba distingue ahora si se pierde la pulsación o la vuelta al lector, y espera 1 s antes de pasar página; si se repite, investigar (un pasador no puede perder pulsaciones).
- **Mac**: probado por Nilo en un MacBook con Apple silicon y un monitor externo, todo bien a la primera (2026-10-10). Sin probar: un Mac Intel y tres monitores.
