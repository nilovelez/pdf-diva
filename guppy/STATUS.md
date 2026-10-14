---
estado: activo
siguiente_paso: Promoción (directorios de software con los textos de press/listings.md, luego comunidades) y mantenimiento. Después del 19 de octubre, comprobar que el build de Linux sigue bien con Ubuntu 26 (o fijar ubuntu-24.04).
bloqueo: ""
actualizado: 2026-10-14
---

# Estado

La v1.4.0 (hito 10, el último de funciones) está publicada en GitHub y la web enlaza las descargas de los tres sistemas; la Store la aprobó el 11 de octubre. Incluye: builds de Windows (instalador NSIS y MSIX para la Store), Mac (`.dmg` universal con firma ad hoc, probado por Nilo en un MacBook con Apple silicon y un monitor externo) y Linux (`.deb` para Debian y Ubuntu, probado en Linux Mint 22.3 y Ubuntu 24.04 con X11), y siete idiomas nuevos (catalán, alemán, francés, italiano, neerlandés, portugués y andaluz EPA, este solo a mano). Riesgo conocido: Linux con Wayland y XWayland en equipos reales, sin probar.

La v1.5.0 (hito 11, cambios menores de pulido) está publicada en GitHub desde el 13 de octubre, con nombres de archivo más claros (`PDF-Diva-Windows/macOS/Linux-x64-<versión>`), y la web la enlaza; la Store la aprobó el 14 de octubre. A partir de aquí, promoción y mantenimiento; no hay más hitos de funciones previstos.

## Diario

- 2026-10-14: ficha de la Store actualizada por Nilo (capturas de la 1.5.0, URL nuevas de privacidad y web, vídeo como tráiler, en inglés y español), sin cambiar el paquete; en certificación.
- 2026-10-14: la Store aprueba la 1.5.0. Vídeo de promoción (YouTube, en inglés y español) y su miniatura en `press/videos/`; imagen de Open Graph con la dirección de la web; capturas de la web rehechas con la 1.5.0; instalación con winget en el README y la web; textos para directorios de software en `press/listings.md`.
- 2026-10-13: Nilo publica la release v1.5.0 en GitHub y la envía a la Store; la web enlaza la 1.5.0.
- 2026-10-13: v1.5.0 (hito 11) aprobada por Nilo tras probar el instalador, con la imagen lateral nueva del instalador de Windows; tag v1.5.0.
- 2026-10-13: hito 11 hecho en la rama `feat/refinement` (v1.5.0): marco uniforme en la vista del orador, selector de tema con tarjetas y miniaturas del lector centradas. Instalador de Windows para que Nilo lo pruebe.
- 2026-10-13: se recupera la idea del nombre (el PDF es la estrella) como guiño puntual: cierre de la web «Let the PDF be the star.», nota en el BrandScript y en los textos de prensa.
- 2026-10-12: se abre el hito 11, refinamiento: tres cambios menores apuntados en `BACKLOG.md`. Se harán cuando haya más opiniones reales de usuarios.
- 2026-10-12: empieza la promoción: textos de prensa y BrandScript (StoryBrand) en `press/`, y la portada de la web reescrita siguiendo esa historia.
- 2026-10-11: la web pasa a pdfdiva.nilovelez.com (las direcciones antiguas redirigen).
- 2026-10-11: probado en Linux que PDF Diva sale en «Abrir con…» sin hacerse visor predeterminado de PDF.
- 2026-10-11: la Store aprueba la 1.4.0.

- 2026-10-10: Nilo publica la release v1.4.0 en GitHub y envía la 1.4.0 a la Store; la web enlaza las descargas de Windows, Mac y Linux.

- 2026-10-10: los idiomas salen por orden alfabético en Ajustes; el tag v1.4.0 se mueve a ese arreglo (la release aún no estaba publicada).

- 2026-10-10: el .dmg funciona a la primera en un MacBook con Apple silicon y monitor externo. feat/mac y feat/linux fusionadas en main, idiomas nuevos registrados, v1.4.0 etiquetada; esperando a que Nilo publique la release.

- 2026-10-09: sesión cerrada; en pausa hasta que Nilo pueda probar el .dmg en un Mac.
- 2026-10-09: el .deb funciona en Ubuntu 24.04 desde USB en un portátil real (sesión X11); Nilo da por terminadas las pruebas de Linux.
- 2026-10-09: el .deb pasa todas las pruebas en Linux Mint 22.3 MATE (portátil real); en Ubuntu 24.04 (VirtualBox, Wayland) no abre la ventana, en estudio.
- 2026-10-09: primer .deb de Linux (rama `feat/linux`), compilado y con la prueba de humo en verde; en manos de Nilo para probarlo.
- 2026-10-09: el andaluz pasa a `es-x-andaluh.json` (etiqueta BCP 47 válida; nunca automático, se elige a mano).
- 2026-10-09: andaluz (Andalûh, EPA) en `locales/es-an.json`, sin registrar; backlog al día.
- 2026-10-09: traducciones fr, de, it, nl, pt (de Portugal) y ca en `locales/`, sin registrar todavía en la app.
- 2026-10-09: la Store aprueba la 1.3.0; vuelve el botón de la Store a la web.
- 2026-10-08: backlog movido de docs/developer-guide.md a guppy/BACKLOG.md y puesto al día.
- 2026-10-08: guppy/STATUS.md creado.
