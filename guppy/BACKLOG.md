# Backlog

PDF Diva to-dos, from the nearest to the least urgent. Whatever gets published leaves this list and goes into the CHANGELOG.

## Ideas for later

- **A PR to Electron**: let `setFullScreen` (or a new option) take a target display, passing it to Chromium's `Widget::SetFullscreen(bool, target_display_id)`, which on Wayland already becomes `xdg_toplevel.set_fullscreen(output)`. Electron would welcome it (electron/electron#30249, closed as not planned on 2025-05-28: "If you'd like to make a PR for this request we would welcome that"). It would replace the placement checks for Wayland in `presentation.ts`.

## Known and untested risks

- **Linux on Wayland (1.5.2, on `feat/wayland`)**: native Wayland instead of XWayland, and a check that puts back a presentation window that landed on the wrong display. To test from the test `.deb` on Ubuntu 26.04 from USB (two displays, several presentations), and on an X11 session (Linux Mint) to check nothing changed there.
- **Mac**: tested by Nilo on an Apple silicon MacBook with an external monitor, all fine first time (2026-10-10). Untested: an Intel Mac. Three displays on a Mac won't be tested (decided 2026-11-12): Apple silicon Macs rarely drive three, the usual setup is two outputs (the projector, and the technician's and speaker's monitors fed the same picture through a splitter or USB-C adapter), and a window in the wrong place can always be moved with Configure displays.
