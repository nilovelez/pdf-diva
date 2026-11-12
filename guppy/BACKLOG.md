# Backlog

PDF Diva to-dos, from the nearest to the least urgent. Whatever gets published leaves this list and goes into the CHANGELOG.

## Next

- **A PR to Electron** (to study once 1.5.1 with the Wayland fix is out): let `setFullScreen` (or a new option) take a target display, passing it to Chromium's `Widget::SetFullscreen(bool, target_display_id)`, which on Wayland already becomes `xdg_toplevel.set_fullscreen(output)`. Electron would welcome it (electron/electron#30249, closed as not planned on 2025-05-28: "If you'd like to make a PR for this request we would welcome that"). It is the only way to put each view on its display on Wayland (see "Linux on Wayland" in the developer guide).

## Known and untested risks

- **Linux on Wayland**: the compositor, not the app, picks each window's display (on GNOME, the one under the mouse pointer), so a view can open on the wrong display; the user moves it with Super+Shift+arrow or Configure displays. Seen on Ubuntu 26.04 from USB (Dell laptop plus a 4K display), where the audience window still landed right most times.
- **Super+Shift+arrow on a full-screen window**: GNOME's shortcut to move a window to the next monitor, which the README suggests; not yet checked on a full-screen PDF Diva window.
- **Mac**: tested by Nilo on an Apple silicon MacBook with an external monitor, all fine first time (2026-10-10). Untested: an Intel Mac. Three displays on a Mac won't be tested (decided 2026-11-12): Apple silicon Macs rarely drive three, the usual setup is two outputs (the projector, and the technician's and speaker's monitors fed the same picture through a splitter or USB-C adapter), and a window in the wrong place can always be moved with Configure displays.
