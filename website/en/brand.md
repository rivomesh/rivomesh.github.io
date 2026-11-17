---
kind: page
locale: en
title: Brand and media assets
description: The RivoMesh Continuity R identity, three original vector directions, light/dark and monochrome marks, small-size previews and production downloads.
---

# RivoMesh brand and media

<p class="landing-lead">A clear input, a continuous path and an independent branch: an identity shaped around data movement and recovery.</p>

<BrandShowcase />

## Why Continuity R

Direction B retains the original R and input connection, replacing two fine lines with one clear channel. A filled silhouette, open counter and outgoing branch work in one color and on both light and dark surfaces. The mark does not depend on gradients or miniature nodes.

Selection reflects geometric simplicity, small-size legibility and continuity with the existing identity; it is not a trademark-clearance claim. The horizontal wordmark uses original geometric vector paths, with no embedded font files or third-party brand artwork.

## Production assets

| Use | Download |
| --- | --- |
| Square mark / avatar | [Square SVG](/brand/logo-square.svg) · [512px PNG](/brand/avatar-512.png) |
| Transparent mark | [Standard](/brand/logo.svg) · [Light surface](/brand/logo-on-light.svg) · [Dark surface](/brand/logo-light.svg) |
| Monochrome | [Ink](/brand/logo-monochrome.svg) · [White](/brand/logo-monochrome-light.svg) |
| Horizontal lockup | [Light surface](/brand/wordmark.svg) · [Dark surface](/brand/wordmark-light.svg) · [Monochrome](/brand/wordmark-monochrome.svg) |
| Browser icons | [SVG favicon](/brand/favicon.svg) · <a href="/favicon.ico" download>ICO: 16 / 32 / 48px</a> |
| Touch / app icons | [Apple Touch 180px](/brand/apple-touch-icon.png) · [Avatar / app icon 512px](/brand/avatar-512.png) |
| Social sharing | [English PNG](/brand/social-card-en.png) · [Chinese PNG](/brand/social-card.png) · [English SVG](/brand/social-card-en.svg) · [Chinese SVG](/brand/social-card-zh.svg) |
| Design exploration | [Direction A](/brand/concepts/a.svg) · [Direction B](/brand/concepts/b.svg) · [Direction C](/brand/concepts/c.svg) · [Static review sheet](/brand/identity-review.png) |

## Use the identity consistently

- Keep clear space of at least one eighth of the mark's height. Do not stretch, rotate or fill the counter.
- Prefer the favicon below 24px. Use the standard mark at 24px or larger, and the horizontal lockup at 128px wide or larger.
- Use blue or ink on light surfaces, and pale blue or white on dark surfaces.
- Flow blue `#2859a6` is the primary color. Signal teal `#247f7c` is a restrained secondary accent. Functional states always include text.

## Reproducible generation

`npm run brand:generate` builds the identity assets using Node and sharp. It does not invoke FFmpeg, macOS say or the video workflow. Normal website builds use committed assets.

The [English product tour](/en/tour.html) has independent English narration, workflow illustrations, captions and a transcript. Original Chinese-language development screenshots remain in the separate screenshot gallery; they are not altered to simulate an English console.
