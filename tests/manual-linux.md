# Manual test on Linux

The checklist used to test the `.deb` on real machines (Debian, Ubuntu and derivatives such as Linux Mint, 64-bit). Note for each machine the distribution and version, and whether the session is X11 or Wayland (`echo $XDG_SESSION_TYPE`). You need a PDF with several pages, and a second display for step 3. A screenshot of any error helps.

1. **Install**
   - Double-click `PDF-Diva-Linux-x64-<version>.deb`, or in a terminal in its folder: `sudo apt install ./PDF-Diva-Linux-x64-<version>.deb`.
   - PDF Diva appears in the applications menu (Office) with its icon.
   - It starts. If not, run `"/opt/PDF Diva/pdf-diva"` in a terminal and copy the output.
2. **Reader**
   - Open a PDF with "Open file…" and by dragging it onto the window.
   - Thumbnails and page are sharp.
   - Settings: change the theme (System, Light, Dark) and the language. With "System", the theme follows the desktop's light or dark mode.
3. **Presenting** (the most important part)
   - One display: "Present" (or F5) shows the slide full screen, with no desktop panels on top.
   - Turn slides with the arrow keys, the space bar and a presentation remote if available.
   - B or . = black screen; Esc = exit. The reader comes back on the last page.
   - Two displays (extended): audience on one, speaker view on the other. Try "Configure displays" and "Apply" during the presentation, and unplug and replug the display.
   - Note what each screen shows, and anything on the wrong screen, cut off or under a desktop panel.
   - On Wayland (Ubuntu 26.04 and later) the desktop, not PDF Diva, picks each view's screen, so a view on the wrong screen is expected now and then: check that Super+Shift+← or → moves it to the other screen.
4. **Opening PDFs from the desktop**
   - Right-click a PDF in the file manager > Open with: PDF Diva is listed and opens it.
   - Installing it did NOT make it the default PDF app (double-clicking a PDF still opens the usual viewer).
   - With PDF Diva open, "Open with" on another PDF opens it in the same window.
5. **Uninstall**
   - `sudo apt remove pdf-diva` (or the software manager). It disappears from the menu.
