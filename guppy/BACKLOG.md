# Backlog

PDF Diva to-dos, from the nearest to the least urgent. Whatever gets published leaves this list and goes into the CHANGELOG.

## Known and untested risks

- **Linux with Wayland + XWayland on real hardware**: untested. On Ubuntu 24.04 in VirtualBox the window isn't painted (`dri_gbm.so … Permission denied`, `XGetWindowAttributes failed`), probably because of the virtual graphics; on native Wayland (`--ozone-platform=wayland`) it opens, but doesn't spread the windows across displays. The README recommends "Ubuntu on Xorg" if the window doesn't appear. Tested and fine with X11: Linux Mint 22.3 MATE (two displays) and Ubuntu 24.04 from USB, both on real hardware.
- **Mac**: tested by Nilo on an Apple silicon MacBook with an external monitor, all fine first time (2026-10-10). Untested: an Intel Mac. Three displays on a Mac won't be tested (decided 2026-11-12): Apple silicon Macs rarely drive three, the usual setup is two outputs (the projector, and the technician's and speaker's monitors fed the same picture through a splitter or USB-C adapter), and a window in the wrong place can always be moved with Configure displays.
