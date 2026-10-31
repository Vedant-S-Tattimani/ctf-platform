# Similarity rubric — Antigravity-inspired re-skin

Scored 0–5 per criterion from screenshots (never from code reading alone). Max 45, pass 38+,
and no single criterion may sit below 3. Scores and one-line reasons go in
[iteration-log.md](iteration-log.md) per page group per iteration.

| # | Criterion | 0 | 3 | 5 |
|---|---|---|---|---|
| 1 | **Overall mood** — light, airy, calm, spacious | Dark/dense, sections jammed | Mostly light, uneven rhythm | Near-white canvas, generous whitespace, consistent section bands |
| 2 | **Typography** — giant friendly sans, tight tracking, clear scale | Default weights, loose tracking, weak scale | Good sizes, generic weights | Medium-weight (450–500) display at hero scale, tuned tracking, legible body |
| 3 | **Color** — near-white surfaces, ink text, sparse blue/violet/coral/mint | Heavy flat blocks, single accent everywhere | Light but muddy or over-tinted | White/off-white surfaces, true ink text, accents only as glows/chips/tints |
| 4 | **Shape language** — pill buttons, large radii, hairlines, soft shadows | Sharp corners, hard borders, no elevation | Pills present, radii inconsistent | Pill CTAs, 16/24/36px card radii, 1px hairlines, diffuse low-opacity shadows |
| 5 | **Hero** — cursor-reactive particle field, headline treatment, CTA pills | Static image or none | Canvas present, no reaction/fallback | Confetti field reacts softly to cursor, lazy, reduced-motion + mobile fallbacks |
| 6 | **Navigation** — hide-on-scroll bar, logo–links–CTA rhythm, mobile menu, footer | Sticky always, links left, no footer | Bar animates, footer thin | Smooth hide/reveal, logo–links–CTA rhythm, full-screen mobile menu, mega footer |
| 7 | **Motion** — scroll reveals, staggers, hover polish, round-button carousels | None, or janky layout-thrash | Reveals only | Transform/opacity reveals, staggered children, snap carousels, all reduced-motion safe |
| 8 | **Layout craft** — alternating feature sections, sticky panels, carousels, 390/768/1440 | One repeated card grid | Some alternation, rough at 390 | Rhythmic text/media alternation, sticky panel, working carousel at all widths |
| 9 | **Polish** — empty/loading/error states, focus rings, AA both themes, no overflow | Missing states, contrast fails | States exist, gaps in one theme | Every state designed, visible focus rings, AA in light and dark, zero overflow |

## Pass rule

A page group stops looping when **total ≥ 38** AND **every criterion ≥ 3** AND
`typecheck` + `build` pass AND no console errors. Caps: 6 iterations per group, 10 for landing.
Unresolved gaps go to [ui-followups.md](ui-followups.md).

## Measured reference baseline (antigravity.google, 2026-11-01)

Taken from the live page via DevTools, not from memory:

- Ink text `rgb(18,19,23)`; surfaces `#FFFFFF` (dominant), `#F8F9FC`, and a cool tint
  `rgba(183,191,217,0.09)` (≈ `#F9F9FC` blended); dark blocks `rgb(32,32,36)`.
- Font `Google Sans Flex` at **weight 450** for h1/h2 — medium, not bold. H2 28px with
  `-0.28px` tracking (≈ −0.01em). H1 fluid (`clamp`, 37.6px at a 518px viewport).
- Radii in use: `4px`, `6px`, `9px`, `10px`, `16px`, `36px`, `999px`/`9999px` pills, `50%` circles.
- Shadows are diffuse and low-opacity: `0 2px 8px rgba(18,19,23,.04)`,
  `0 4px 12px rgba(0,0,0,.15)`, `0 16px 40px rgba(0,0,0,.12)`.
- Nine `<section>`s, ~9177px tall at 518px width — long, single-column, spacious.
- Top bar: white, logo left, dark circular control right, `EN` pill with globe icon.
  Announcement strip with a dark `NEW` pill chip sits under it.
