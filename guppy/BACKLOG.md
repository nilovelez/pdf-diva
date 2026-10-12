# Backlog

Pendientes de PDF Diva, del más próximo al menos urgente. Lo que ya está publicado sale de aquí y queda en el CHANGELOG.

## Hito 11: refinamiento (v1.5.0)

Cambios menores sin prisa; no bloquean la promoción ni el mantenimiento.

- [ ] **Vista del orador: borde no uniforme.** El marco de la diapositiva actual y la siguiente es más ancho por los lados que arriba y abajo. Causa: `aspect-ratio: 16 / 9` se aplica con el relleno incluido (`box-sizing: border-box` en `#current` y `#next`), así que el hueco interior es más ancho que 16:9. Arreglo: que el 16:9 sea del contenido (`content-box`).
- [ ] **Ajustes: selector de tema más visual.** El control segmentado (Sistema / Claro / Oscuro) se ve poco y la opción elegida apenas se distingue. Propuesta: tres tarjetas con una miniatura de ventana dibujada en CSS con los colores de cada tema (Sistema = mitad clara y mitad oscura), con el nombre debajo; la elegida, con borde de acento y marca. Ahora que «Configurar monitores» va en su propia ventana, el diálogo de ajustes tiene sitio.

## Tras la v1.4.0

- [ ] **Runner de Linux**: `ubuntu-latest` pasa a Ubuntu 26 desde el 19 de octubre de 2026; comprobar que el build sigue bien o fijar `ubuntu-24.04`.

## Riesgos conocidos y sin probar

- **Linux con Wayland + XWayland en un equipo real**: sin probar. En Ubuntu 24.04 en VirtualBox la ventana no se pinta (`dri_gbm.so … Permission denied`, `XGetWindowAttributes failed`), probablemente por el gráfico virtual; en Wayland nativo (`--ozone-platform=wayland`) abre, pero no reparte las ventanas entre monitores. El README recomienda «Ubuntu on Xorg» si la ventana no aparece. Probado y bien con X11: Linux Mint 22.3 MATE (dos pantallas) y Ubuntu 24.04 desde USB, ambos en equipos reales.
- **Prueba de humo en Linux**: fallo intermitente visto una vez (run 37924875024): tras flecha derecha + Esc, el lector no volvió en la página 2. La prueba distingue ahora si se pierde la pulsación o la vuelta al lector, y espera 1 s antes de pasar página; si se repite, investigar (un pasador no puede perder pulsaciones).
- **Mac**: probado por Nilo en un MacBook con Apple silicon y un monitor externo, todo bien a la primera (2026-10-10). Sin probar: un Mac Intel y tres monitores.
