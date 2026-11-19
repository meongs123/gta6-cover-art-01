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

Built 19–20 Nov 2026 in a recorded session. The app is complete: 4 layouts,
4 OKLCH grades + Poster Ink, face-center auto-crop, 3 export sizes, 4
screenshots. Validation (5 adversarial photos × 3 sizes, thumbnail
readability, export timings) is in the build log
`~/workspace/makefun/cover-art-concept/build-log.md`.

Round 3 (20 Nov 2026): the hero is now a real couple photo — a free-stock
couple photo under the Pexels License (`app/samples/couple-neon.jpg`,
photographer Toàn Văn) with a crop that excludes the "Baozi" neon sign, and
a rainy-Kyoto couple photo (`app/samples/couple-kyoto.jpg`, photographer
Michael Dupuis) as a vignette in the 5-panel grid shot — zoomed 2.0× onto
the couple under the umbrella so both faces read at small size. Honest note: the
neon couple is Vietnamese, not the Japanese couple from the brief — both are
demo input to the app, not a claim that the brief's couple was photographed. No free-stock photo
matching the full brief (young Japanese couple, big faces, sunset) exists;
the procedural demo-art hero remains the fallback.

## How it works

- Load your own photo(s) from your machine (up to 6), or use the built-in
  samples. Each photo is analysed locally (FaceDetector when available,
  centre-weighted saliency fallback) and auto-cropped face-centre into its
  panel; click a panel and drag the anchor to override the focus, zoom
  0.8–2.0×.
- One bold one-line title, "VICE KEY" (Anton, self-hosted, SIL OFL), 84%
  width across the middle band of the cover, with a thick dark outline.
- Layouts: Key Art hero (8 panels), 5-panel grid, single-scene portrait,
  3-panel strip. Grades: Sunset (default, unifying), Neon Nights, Teal Heat,
  Mono Ink — OKLCH grade + 5-tone posterize + Bayer halftone + Sobel edge ink.
- Export as PNG in 1080 x 1350 (4:5), 1080 x 1080 (1:1), 1920 x 1080 (16:9).
- Fully offline: every script, font, and image the app loads is a file
  under `app/` — no network request.

## Layout

- `main.ts` — the entry program (Node 22): copies `app/` and `screenshots/`
  to `/output` and writes `/output/dossier.json` via `vendor/makefun-app.ts`.
- `app/` — the web app as static files (`index.html` + scripts + fonts).
- `screenshots/` — 3 or 4 screenshots; the first by name is the cover.
- `vendor/makefun-app.ts` — the kit's copy, unchanged.
