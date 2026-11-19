# VICE KEY

[![make.fun](https://make.fun/badge/gta6-cover-art-01.svg)](https://make.fun/bounty/gta6-cover-art-01)
[![rank](https://make.fun/badge/gta6-cover-art-01/meongs123/gta6-cover-art-01/rank.svg)](https://make.fun/bounty/gta6-cover-art-01)
[![reward](https://make.fun/badge/gta6-cover-art-01/meongs123/gta6-cover-art-01/reward.svg)](https://make.fun/bounty/gta6-cover-art-01)

An original cover-art maker for the make.fun **Make GTA 6 Cover Art** bounty
(`gta6-cover-art-01`): turn your own photo and a caption into a multi-panel
poster-style cover with bold lettering and a sunset / neon colour grade,
exported as a PNG to share. Everything here is original — no artwork, logo,
or font taken from any commercial game. The title font is Anton (SIL Open
Font License), self-hosted under `app/`.

## Status

Skeleton only — the app is built in a recorded session on the morning of
20 Nov 2026; this commit holds the structure, the kit's unchanged
`vendor/makefun-app.ts`, and an empty `app/` waiting for the build.

## How it will work

- Load your own photo(s) from your machine, crop and position each one
  across the cover's panels, write and edit the caption.
- One bold one-line title, "VICE KEY", across the middle band of the cover.
- Export as PNG in the common post sizes: 1080 x 1080, 1080 x 1350,
  1920 x 1080.
- Fully offline: every script, font, and image the app loads is a file
  under `app/` — no network request.

## Layout

- `main.ts` — the entry program (Node 22): copies `app/` and `screenshots/`
  to `/output` and writes `/output/dossier.json` via `vendor/makefun-app.ts`.
- `app/` — the web app as static files (`index.html` + scripts + fonts).
- `screenshots/` — 3 or 4 screenshots; the first by name is the cover.
- `vendor/makefun-app.ts` — the kit's copy, unchanged.
