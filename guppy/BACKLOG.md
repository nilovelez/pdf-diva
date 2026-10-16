# Backlog

PDF Diva to-dos, from the nearest to the least urgent. Whatever gets published leaves this list and goes into the CHANGELOG.

## After v1.4.0

- [ ] **Linux runner**: `ubuntu-latest` becomes Ubuntu 26 from October 19, 2026; check that the build still works or pin `ubuntu-24.04`.

## Known and untested risks

- **Linux with Wayland + XWayland on real hardware**: untested. On Ubuntu 24.04 in VirtualBox the window isn't painted (`dri_gbm.so … Permission denied`, `XGetWindowAttributes failed`), probably because of the virtual graphics; on native Wayland (`--ozone-platform=wayland`) it opens, but doesn't spread the windows across displays. The README recommends "Ubuntu on Xorg" if the window doesn't appear. Tested and fine with X11: Linux Mint 22.3 MATE (two displays) and Ubuntu 24.04 from USB, both on real hardware.
- **Linux smoke test**: intermittent failure seen once (run 37924875024): after right arrow + Esc, the reader didn't come back on page 2. The test now tells apart a lost key press from a failed return to the reader, and waits 1 s before turning the page; if it happens again, investigate (a clicker can't lose key presses).
- **Mac**: tested by Nilo on an Apple silicon MacBook with an external monitor, all fine first time (2026-10-10). Untested: an Intel Mac and three displays.
