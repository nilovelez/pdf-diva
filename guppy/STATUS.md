# Status

Version 1.4.0 (milestone 10, the last feature milestone) is published on GitHub and the website links the downloads for all three systems; the Microsoft Store approved it on October 11. It includes: Windows builds (NSIS installer and MSIX for the Store), Mac (universal `.dmg` with ad hoc signing, tested by Nilo on an Apple silicon MacBook with an external monitor) and Linux (`.deb` for Debian and Ubuntu, tested on Linux Mint 22.3 and Ubuntu 24.04 with X11), and seven new languages (Catalan, German, French, Italian, Dutch, Portuguese and Andalusian EPA, the last one only by manual choice). Known risk: Linux with Wayland and XWayland on real hardware, untested.

Version 1.5.0 (milestone 11, minor polish) is published on GitHub since October 13, with clearer file names (`PDF-Diva-Windows/macOS/Linux-x64-<version>`), and the website links it; the Store approved it on October 14. From here on, promotion and maintenance; no more feature milestones are planned.

Version 1.5.1 (maintenance asked for by the friends who sign the Mac build: Electron 45.2.3 and Electron fuses) is published on GitHub since November 9, 2026, with the first Mac `.dmg` signed and notarized by Desafío Digital (checked by Nilo on Bender with `spctl` and `stapler`); the website links it. Submitted to the Store on November 9, in certification.

Mac signing (changed on November 8, 2026): the friends (Desafío Digital) sign and notarize in their own private GitHub repository, so the credentials never leave them. Their system checks this repo for new tags twice a day (07:23 and 19:23, Spanish time), they approve each version by hand for now, and the signed `.dmg` is published in https://github.com/desafiodigital/pdf-diva-releases; Nilo gets an e-mail with the link and adds it to the release. The first signed version is 1.5.1; the README, press texts and developer guide no longer mention "Open Anyway". Our own Mac build stays ad hoc signed, for testing only. Pending: `CLAUDE.md` milestone 10 still says "firma ad hoc" (needs Nilo's OK to change).

Machines: Windows builds (NSIS, MSIX) and multi-monitor tests run on Marcianito (Windows, no longer on all the time); content work (docs, website, promotion, status) can be done from any machine with the repo, such as Bender.

Next steps: promotion is paused on purpose: Nilo shows the app in person (word of mouth) and will later write an article on his website. When it resumes: Uptodown and communities. Maintenance continues.

## Log

Newest entries first. One per work session, brief.

- 2026-11-09: v1.5.1 published on GitHub with the first Mac `.dmg` signed and notarized by Desafío Digital, and submitted to the Store. Website, README, CHANGELOG, press texts and developer guide updated. `feat/mac-signing` (the abandoned first signing plan) deleted locally; the remote branch is left for Nilo to delete.
- 2026-11-08: v1.5.1 tagged: Electron 45.2.3 and Electron fuses. The end-to-end tests and test PDFs moved into the repo (`tests/`) and were brought up to date; electron-builder's current Windows toolset replaces the hand-swapped SDK tools, so nothing in scratch is needed any more. The Mac signers now sign in their own repository.

- 2026-11-04: Nilo's new always-on agent machine is Bender (Mac mini M1); PDF Diva stays on Marcianito for builds, Bender for content and Mac tests. Rules, decisions and status that lived only in the agent's local memory moved into the repo (CLAUDE.md, developer guide, `press/`, this file). Temporary files now go in `scratch/pdf-diva/`. The `development` branch is gone: work goes straight to `main`.
- 2026-10-25: Guppy section of CLAUDE.md updated to the current onboarding template (status dates now refresh every session). Nilo explained the signing to the friends who lend it (October 24) and e-mailed them the instructions (October 25); still waiting for the certificate and the key.
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