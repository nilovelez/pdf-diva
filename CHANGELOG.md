# Cambios

Todos los cambios relevantes para el usuario se anotan aquí.
Formato basado en [Keep a Changelog](https://keepachangelog.com/es-ES/1.1.0/).

## [Sin publicar]

## [0.3.0] - 2026-10-04

### Añadido
- **Modo presentación.** El botón **Presentar** abre dos ventanas: la del público, a pantalla completa y sin controles en el monitor secundario, y la del orador en el monitor principal, con la página actual y «Página X de Y».
- Pantalla en negro: `B` o `.` oscurecen la pantalla del público y la vuelven a encender. La vista del orador avisa mientras está en negro.
- `Esc` termina la presentación y vuelve al lector en la última página mostrada.
- Las teclas funcionan en las dos ventanas, también después de hacer clic en la del público.
- Con un solo monitor, **Presentar** abre solo la vista del orador en una ventana normal.
- Nuevo lector: pantalla inicial donde puedes hacer clic o arrastrar un PDF, barra superior con **Abrir** y **Presentar**, miniaturas de las páginas en un lateral (haz clic en una para ir a ella) y la ruta del archivo en la barra inferior.

### Cambiado
- Se ha quitado el menú en inglés (File, Edit, View, Window) de todas las ventanas.

## [0.2.0] - 2026-10-04

### Añadido
- Botón **Abrir PDF…** para elegir un archivo y verlo en la ventana principal, con el nombre del archivo y la indicación «Página X de Y».
- Navegación con el teclado, compatible con los presentadores (mandos) habituales: avanzar con `AvPág`, `→`, `↓`, `Espacio` o `Intro`; retroceder con `RePág`, `←`, `↑` o `Retroceso`; `Inicio` y `Fin` para ir a la primera y a la última página.
- Cada página se ajusta a la ventana sin deformarse, sobre fondo negro, aunque el PDF mezcle páginas de distintos tamaños. Se ve nítida en pantallas de alta resolución.
- Si el PDF está dañado o protegido con contraseña, la aplicación muestra un aviso en lugar de cerrarse.

## [0.1.0] - 2026-10-04

### Añadido
- Primera versión: la aplicación abre una ventana inicial (esqueleto del proyecto).
