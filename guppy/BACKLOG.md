# Backlog

PDF Diva to-dos, from the nearest to the least urgent. Whatever gets published leaves this list and goes into the CHANGELOG.

## Known and untested risks

- **Linux on Wayland (1.5.2, on `feat/wayland`)**: native Wayland instead of XWayland, and a check that puts back a presentation window that landed on the wrong display. To test from the test `.deb` on Ubuntu 26.04 from USB (two displays, several presentations), and on an X11 session (Linux Mint) to check nothing changed there.
- **Mac**: tested by Nilo on an Apple silicon MacBook with an external monitor, all fine first time (2026-10-10). Untested: an Intel Mac. Three displays on a Mac won't be tested (decided 2026-11-12): Apple silicon Macs rarely drive three, the usual setup is two outputs (the projector, and the technician's and speaker's monitors fed the same picture through a splitter or USB-C adapter), and a window in the wrong place can always be moved with Configure displays.
