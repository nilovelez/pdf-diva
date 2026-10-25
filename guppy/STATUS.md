# Status

Version 1.4.0 (milestone 10, the last feature milestone) is published on GitHub and the website links the downloads for all three systems; the Microsoft Store approved it on October 11. It includes: Windows builds (NSIS installer and MSIX for the Store), Mac (universal `.dmg` with ad hoc signing, tested by Nilo on an Apple silicon MacBook with an external monitor) and Linux (`.deb` for Debian and Ubuntu, tested on Linux Mint 22.3 and Ubuntu 24.04 with X11), and seven new languages (Catalan, German, French, Italian, Dutch, Portuguese and Andalusian EPA, the last one only by manual choice). Known risk: Linux with Wayland and XWayland on real hardware, untested.

Version 1.5.0 (milestone 11, minor polish) is published on GitHub since October 13, with clearer file names (`PDF-Diva-Windows/macOS/Linux-x64-<version>`), and the website links it; the Store approved it on October 14. From here on, promotion and maintenance; no more feature milestones are planned.

In progress: signing the Mac `.dmg` with a Developer ID and notarizing it, so macOS opens it without the "Open Anyway" step. Trusted friends with an Apple Developer account lend their signature; the build changes are on the `feat/mac-signing` branch (GitHub Actions reads the certificate and the App Store Connect API key from repository secrets, and falls back to the ad hoc signature without them). Blocked until they send the certificate and the key and Nilo adds the secrets. Then Nilo tests the signed `.dmg` and, if it works, replaces the one in the v1.5.0 release (no new version).

Next steps: promotion is paused on purpose: Nilo shows the app in person (word of mouth) and will later write an article on his website. When it resumes: Uptodown and communities. Maintenance continues. After October 19, 2026, check that the Linux build still works on Ubuntu 26 (or pin `ubuntu-24.04`).

## Log

Newest entries first. One per work session, brief.

- 2026-10-25: Guppy section of CLAUDE.md updated to the current onboarding template (status dates now refresh every session). Still waiting for the Mac signing certificate.
- 2026-10-18: Mac signing and notarization prepared on `feat/mac-signing`; waiting for the certificate and the API key. Guppy icon set (October 16).
- 2026-10-16: migrated to the new Guppy format (STATUS.json).
- 2026-10-14: Softpedia dropped (it doesn't accept apps with AI-written code). Promotion paused: now it's time to show it in person.
- 2026-10-14: submission e-mail sent to MajorGeeks.
- 2026-10-14: PDF Diva submitted to AlternativeTo; in the review queue.
- 2026-10-14: the Store approves the new listing (URLs, screenshots and trailer); winget already shows the new URLs.
- 2026-10-14: Store listing updated by Nilo (1.5.0 screenshots, new privacy and website URLs, video as trailer, in English and Spanish), without changing the package; in certification.
- 2026-10-14: the Store approves 1.5.0. Promo video (YouTube, in English and Spanish) and its thumbnail in `press/videos/`; Open Graph image with the website address; website screenshots retaken with 1.5.0; winget install in the README and the website; texts for software directories in `press/listings.md`.
- 2026-10-13: Nilo publishes the v1.5.0 release on GitHub and submits it to the Store; the website links 1.5.0.
- 2026-10-13: v1.5.0 (milestone 11) approved by Nilo after testing the installer, with the new sidebar image in the Windows installer; tag v1.5.0.
- 2026-10-13: milestone 11 done on the `feat/refinement` branch (v1.5.0): uniform frame in the speaker view, theme picker with cards and centered reader thumbnails. Windows installer for Nilo to test.
- 2026-10-13: the idea behind the name (the PDF is the star) comes back as an occasional nod: website closing line "Let the PDF be the star.", a note in the BrandScript and in the press texts.
- 2026-10-12: milestone 11, refinement, opens: three minor changes noted in `BACKLOG.md`. They will be done when there is more real user feedback.
- 2026-10-12: promotion starts: press texts and BrandScript (StoryBrand) in `press/`, and the website home page rewritten following that story.
- 2026-10-11: the website moves to pdfdiva.nilovelez.com (the old addresses redirect).
- 2026-10-11: tested on Linux that PDF Diva appears in "Open with…" without becoming the default PDF viewer.
- 2026-10-11: the Store approves 1.4.0.
- 2026-10-10: Nilo publishes the v1.4.0 release on GitHub and submits 1.4.0 to the Store; the website links the Windows, Mac and Linux downloads.
- 2026-10-10: languages are listed alphabetically in Settings; the v1.4.0 tag moves to that fix (the release wasn't published yet).
- 2026-10-10: the .dmg works first time on an Apple silicon MacBook with an external monitor. feat/mac and feat/linux merged into main, new languages registered, v1.4.0 tagged; waiting for Nilo to publish the release.
- 2026-10-09: session closed; paused until Nilo can test the .dmg on a Mac.
- 2026-10-09: the .deb works on Ubuntu 24.04 from USB on a real laptop (X11 session); Nilo considers the Linux tests done.
- 2026-10-09: the .deb passes all tests on Linux Mint 22.3 MATE (real laptop); on Ubuntu 24.04 (VirtualBox, Wayland) the window doesn't open, under investigation.
- 2026-10-09: first Linux .deb (`feat/linux` branch), built and with the smoke test green; in Nilo's hands for testing.
- 2026-10-09: Andalusian moves to `es-x-andaluh.json` (valid BCP 47 tag; never automatic, chosen by hand).
- 2026-10-09: Andalusian (Andalûh, EPA) in `locales/es-an.json`, not registered; backlog up to date.
- 2026-10-09: fr, de, it, nl, pt (Portugal) and ca translations in `locales/`, not yet registered in the app.
- 2026-10-09: the Store approves 1.3.0; the Store button returns to the website.
- 2026-10-08: backlog moved from docs/developer-guide.md to guppy/BACKLOG.md and brought up to date.
- 2026-10-08: guppy/STATUS.md created.
