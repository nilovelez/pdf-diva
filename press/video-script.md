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

Everything is filmed with a camera, in a real working space: no screen recordings. The screens are seen the way a technician sees them.

Two possible locations:

- **Auditorium booth (preferred).** Laptop on the booth desk, the hall's screen or projection visible through the booth window, a presentation remote, the laptop's video cable reachable.
- **Simulated booth.** Laptop, a production case and a monitor that stands in for the projector (the audience output). Dim light, tidy cables, nothing that dates the shot or shows a brand prominently.

In both cases the laptop's external output must be **a cable plugged into the laptop** that can be pulled out for shot 7. If the signal goes through a switcher or converter, pull the cable at the laptop end: some converters keep reporting a display to Windows when their other side is unplugged, and then nothing would happen.

Camera: on a tripod, fixed, horizontal. A mobile phone is fine (1080p or 4K). Settings for filming screens:

- Manual exposure, exposed for the screens (the room can go dark; that's the real look).
- Shutter at 1/50 (in Europe; 1/60 with 60 Hz lighting) to avoid flicker and rolling bands on screens and projections.
- Locked focus and white balance. If a screen shows moiré (wavy patterns), change the angle slightly or move back and zoom in.

Before recording:

- [ ] PDF Diva 1.4.0, interface in **English**, dark theme.
- [ ] Windows: projection mode **Extend** (Win+P), Do Not Disturb on, desktop without icons, clean taskbar.
- [ ] A demo PDF of your own (see below), named something believable, e.g. `night-skies-talk.pdf`, on a USB stick and copied to the desktop.
- [ ] Laptop screen brightness high, so it reads on camera next to the projection.
- [ ] Rehearse shot 7 (cable) twice: check how long Windows takes to bring the display back and that the presentation recovers as expected.

**Demo PDF**: 6–8 slides, 16:9, readable from a distance, no third-party logos, photos or brands. A neutral, believable talk (for example, "Night skies: a beginner's guide"). Slide 1 is the title, so the "next slide" in the speaker view already shows content.

## Shot list

"Audience screen" means the hall's projection in the booth, or the monitor in the simulated booth.

| # | Time | Shot | What happens | Caption |
|---|---|---|---|---|
| 1 | 0:00–0:04 | Close-up | A hand puts a USB stick on the booth desk, next to the laptop. | *Sooner or later, a speaker hands you a PDF.* |
| 2 | 0:04–0:09 | Over the shoulder, on the laptop screen | Right-click the PDF → **Open with** → **PDF Diva**. The reader opens with its thumbnails. | — |
| 3 | 0:09–0:12 | Close-up, hand and screen | Click **Present**. | — |
| 4 | 0:12–0:18 | Wide | The slide fills the audience screen; the laptop shows the speaker view in the foreground. Hold still for a moment. | *The slide on the projector.* |
| 5 | 0:18–0:25 | Close-up on the laptop, remote in hand in the foreground | The technician advances two slides with the remote. The timer runs; "Page 2 of 8", "Page 3 of 8". | *Next slide and timer for the speaker.* |
| 6 | 0:25–0:29 | Medium, audience screen | Press **B**: the audience screen goes black. Press it again: the slide is back. | *Black screen with one key.* |
| 7 | 0:29–0:36 | Medium, laptop and audience screen in frame | Pull the video cable out of the laptop, wait a second, plug it back in. The slide returns to the audience screen and the presentation carries on from the same page. | *A cable comes loose. It carries on.* |
| 8 | 0:36–0:40 | End card (made in the edit) | App icon, **PDF Diva**, *A presenter view for any PDF.*, `pdfdiva.nilovelez.com`, *Free and open source*. | — |

Notes per shot:

- **2–3**: if Open with is slow or cluttered, drag the PDF onto the window instead; both are real ways in. Move the pointer slowly so it can be followed on camera.
- **4**: this is the shot that explains the product: audience screen and speaker view in the same frame. In the booth, shoot through the window with the laptop in the foreground; in the simulated booth, laptop in front and monitor behind, both readable.
- **5**: the remote should be visible but not hide the timer or the page count.
- **7**: while the cable is out, the laptop is the only display, so it shows the slide fullscreen (the audience view) instead of the speaker view; when the cable is back, each screen returns to its role. Keep both in frame so this is visible. Show it as it happens, without speeding it up. If Windows takes more than 3–4 s to bring the display back, cut the wait with a short dissolve rather than hiding it.

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
