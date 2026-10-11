# PDF Diva: demo video, technical script

A short demo for the website, the README, the Store listing and community posts. It tells the same story as the website: a speaker brings a PDF, it gets presented like any slide deck, and nothing goes wrong.

## Summary

| | |
|---|---|
| Length | 40 seconds (35–45) |
| Voice | None. It must work muted: social feeds and the website play video without sound. |
| Music | None. If you add some later, it must be royalty-free and credited. |
| Captions | Burned in, in English, short (7 words at most), at least 2.5 s on screen |
| Master format | 1920×1080, 30 fps, H.264 MP4 |
| Other cuts | GIF/WebP loop for the README (8–10 s); optional 1080×1080 square for social media |

## Recording setup

The video mixes two kinds of shots:

- **Camera shots (C)**: a real room. Laptop on a table, projector or large TV, a presentation remote in hand, an HDMI cable you can unplug. They prove it's real, and the cable shot can only be done this way.
- **Screen captures (S)**: OBS recording the laptop screen at 1920×1080, 60 fps (exported at 30). Clean close-ups of the reader and the speaker view.

Camera: on a tripod, fixed, horizontal. Mobile phone is fine (1080p or 4K, 30 fps, locked exposure and focus). A dim room: the projector reads better and it's the real working condition (speaker view legible in low light).

Before recording:

- [ ] PDF Diva 1.4.0, interface in **English**, dark theme.
- [ ] Windows: projection mode **Extend** (Win+P), Do Not Disturb on, desktop without icons, clean taskbar.
- [ ] A demo PDF of your own (see below), named something believable, e.g. `night-skies-talk.pdf`, on a USB stick and on the desktop.
- [ ] Rehearse shot 7 (cable) twice: check how long Windows takes to bring the display back and that the presentation recovers as expected.
- [ ] Mouse cursor away from the screen in the speaker view shots.

**Demo PDF**: 6–8 slides, 16:9, readable from a distance, no third-party logos, photos or brands. A neutral, believable talk (for example, "Night skies: a beginner's guide"). Slide 1 is the title, so the "next slide" in the speaker view already shows content.

## Shot list

| # | Time | Type | What happens | Caption |
|---|---|---|---|---|
| 1 | 0:00–0:04 | C, close-up | A hand puts a USB stick on the table next to the laptop. | *Sooner or later, a speaker hands you a PDF.* |
| 2 | 0:04–0:09 | S | File Explorer: right-click the PDF → **Open with** → **PDF Diva**. The reader opens with its thumbnails. | — |
| 3 | 0:09–0:12 | S | Click **Present** (cursor visible, slow movement). | — |
| 4 | 0:12–0:18 | C, wide | The room: the slide fills the projector; the laptop shows the speaker view. Hold still for a moment. | *The slide on the projector.* |
| 5 | 0:18–0:25 | S | Speaker view: the speaker advances two slides with the remote. The timer runs; "Page 2 of 8", "Page 3 of 8". | *Next slide and timer for the speaker.* |
| 6 | 0:25–0:29 | C, medium | Press **B**: the projector goes black. Press it again: the slide is back. | *Black screen with one key.* |
| 7 | 0:29–0:36 | C, medium | Pull the HDMI cable out of the laptop, wait a second, plug it back in. The slide returns to the projector and the presentation carries on from the same page. | *A cable comes loose. It carries on.* |
| 8 | 0:36–0:40 | End card | App icon, **PDF Diva**, *A presenter view for any PDF.*, `pdfdiva.nilovelez.com`, *Free and open source*. | — |

Notes per shot:

- **2–3**: if right-click → Open with is slow or cluttered, drag the PDF onto the window instead; both are real ways in.
- **4**: this is the shot that explains the product. Frame the projected slide and the laptop together.
- **5**: optionally, a small inset (picture-in-picture) of the hand on the remote, from the camera.
- **7**: while the cable is out, the laptop is the only display, so it shows the slide fullscreen (the audience view) instead of the speaker view; when the projector comes back, each screen returns to its role. Frame the laptop too, so this is visible. Show it as it happens, without speeding it up. If Windows takes more than 3–4 s to bring the display back, cut the wait with a short dissolve rather than hiding it.

## Captions and end card

- Font: Segoe UI Semibold (the app's font), white on a dark translucent bar, lower third, centred.
- Calm tone, as on the website: describe what happens, no slogans.
- End card on the app's dark background (`#1D1C1B`), with the gold accent (`#E8BA30`) only on the icon; it holds for at least 3 s.

## Edit and export

- Straight cuts; one dissolve at most (shot 7, if needed).
- Master: 1920×1080, 30 fps, H.264, about 6–8 Mbit/s (around 30–40 MB). Keep the raw footage.
- Website: self-hosted MP4 (no YouTube or Vimeo embeds: the site has no third-party resources), shorter bit rate, under 10 MB, with a poster image.
- README loop: shots 4–5 (8–10 s), 960 px wide, 12–15 fps, WebP or GIF under 10 MB. Send me the master and I'll make it with ffmpeg.
- Square cut (optional): shots 4, 5, 7 and the end card, reframed to 1080×1080.

## Where it goes

Website (hero or under the screenshot), README (the loop), Microsoft Store listing (trailer), community posts and directories (AlternativeTo, etc.), and the press kit.
