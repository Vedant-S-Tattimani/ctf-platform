# Iteration log — Antigravity-inspired re-skin

Rules: one entry per build→shoot→look→score pass. Scores are read off the PNGs in
`docs/shots/<iteration>/` next to `docs/reference/antigravity/`, never off the code. Self-prompt
= the three biggest gaps with a concrete fix, executed before the next pass.
Rubric and pass bar: [similarity-rubric.md](similarity-rubric.md).

---

## Phase 0 — recon and setup (2026-11-01)

Done: branch `antigravity-reskin`; Playwright `1.64.1` added as a frontend devDependency with
chromium; `frontend/scripts/shoot.mjs` writes full-page shots at 1440×900 and 390×844 in light
and dark plus a console-error/overflow `report.json`; rubric, plan and this log created;
`docs/reference/antigravity/` captured from the live site.

Measured from the live page (details in the rubric file): white canvas, ink `rgb(18,19,23)`,
off-white `#F8F9FC`, cool tint `rgba(183,191,217,.09)`, dark blocks `rgb(32,32,36)`;
`Google Sans Flex` at weight **450** for headings with ≈−0.01em tracking; radii 4/6/9/16/36/999;
shadows diffuse at 4–15% black; nine long sections, ~9177px tall at 518px width.

Decisions: single open family **Outfit** (variable) + existing JetBrains Mono; light default with
`[data-theme]` dark override; semantic token **names kept** and values inverted so the ~650
existing utility call sites carry the re-skin instead of being rewritten; primary CTA becomes an
ink pill with white text; `--shadow-glow` deleted (zero call sites).

Blockers: none. The in-app browser could not take a full-page shot (hidden surface), so reference
capture runs through Playwright instead — same output the loop expects.

---

## Phase 1 — tokens, theme, base kit

### p1-01 — first light build (`docs/shots/p1-01/`)

Score 26/45. Mood 4 · Type 3 · Color 3 · Shape 4 · Hero 1 · Nav 3 · Motion 2 · Layout 3 · Polish 3.

What worked: inverting the semantic tokens flipped 87 files to light without touching call sites;
pills, 24px cards, hairlines and soft shadows all landed; no console errors, no horizontal
overflow at 1440 or 390; dark theme renders from the same role names.

Three biggest gaps, and the prompt I gave myself:
1. **Display type is still bold, not medium.** `Hero.tsx:74` carried `font-bold` and
   `-0.04em`, and `UserMenu.tsx:81` built its own violet `rounded-sm bg-accent` CTA instead of
   using the pill. → set `font-medium` + `-0.035em`, route the nav CTA through
   `buttonVariants('primary','sm')`.
2. **Hero is a violet wash, not a light stage.** `Aurora` and the inline `oklch()` bloom were
   authored for the dark world; on white they read as a heavy gradient slab. → replace with the
   particle field in Phase 3; until then, mute it.
3. **No scroll motion and no hide-on-scroll bar.** The reference's airiness comes from reveals
   and a header that gets out of the way. → `.reveal` utilities exist now; wire `<Reveal>` and the
   header behaviour in Phase 2.

### p1-02 — after the type and CTA fixes (`docs/shots/p1-02/`)

Score 30/45. Mood 4 · Type 4 · Color 3 · Shape 5 · Hero 2 · Nav 3 · Motion 2 · Layout 3 · Polish 4.

Outfit is confirmed loading (geometric, friendly, matches the reference register); the nav CTA is
now an ink pill; the theme toggle sits in the bar and persists; `/__kit` gained a
Light/Dark/System preview control.

Remaining sub-3 criteria (Hero 2, Motion 2) are exactly the Phase 2 and Phase 3 deliverables, so
looping the kit further would score the same gaps again. Recording that rather than burning
iterations: the kit group re-scores at the Phase 7 whole-site pass.


---

## Phase 2 — shell and navigation

Files touched (manifest, written as the phase started):
`frontend/src/hooks/useHideOnScroll.ts` (new), `components/layout/MobileMenu.tsx` (new),
`components/layout/Navbar.tsx`, `components/layout/RootLayout.tsx`,
`components/layout/Footer.tsx`, `components/layout/MobileTabBar.tsx`,
`components/layout/CommandPalette.tsx`, `components/layout/UserMenu.tsx`,
`components/layout/SkipLink.tsx`, `components/errors/RouteErrorBoundary.tsx`,
`pages/NotFound.tsx`, `styles/globals.css`, `lib/icons.tsx`,
`frontend/scripts/shoot.mjs` (added `--states=menu,palette`).

### p2-01 — first shell build (`docs/shots/p2-01/`)

Score 29/45. Mood 4 · Type 4 · Color 3 · Shape 4 · Hero 1 · Nav 4 · Motion 3 · Layout 3 · Polish 3.

Hide-on-scroll works (the header is gone by step 4 of the home walk), the mobile sheet opens with
focus on its close button and Escape/backdrop/route-change all dismiss it, the palette and account
dropdown read as floating `bg-overlay` sheets with `shadow-float`, and the 404 gained a mono
eyebrow plus display-scale headline. No console errors, no horizontal overflow at 1440 or 390.

Three biggest gaps:
1. **Nav links were dead-centre in the bar.** The measured reference puts them immediately right of
   the logo (`pl-3`/`pl-6`), not centred across the container. → left-align, and fix the rubric row
   that said "centered links".
2. **Footer wordmark was a 9%-alpha ghost inside the container.** The reference wordmark is solid
   ink and runs edge to edge. → full-bleed `text-primary` at `clamp(4rem,25vw,20rem)`, clipped by
   `overflow-hidden` so it can never create overflow.
3. **Mobile sheet had a dead band above Appearance.** → event status line plus the same wordmark
   treatment, sized to the small screen.

### p2-02 / p2-03 — after the nav, footer and sheet fixes (`docs/shots/p2-02/`, `p2-03/`)

Score 32/45. Mood 4 · Type 4 · Color 3 · Shape 5 · Hero 2 · Nav 4 · Motion 3 · Layout 3 · Polish 4.

Header rhythm now matches the reference (logo → links → status/search/theme/CTA), the footer closes
with a full-bleed ink wordmark, the mobile sheet fills its screen, and `p2-03` re-ran the whole
shell in dark too: same role tokens, no overflow, no console errors in either theme.

What is holding the group below the 38 pass line is **Hero 2** — the landing hero is still the
violet `Aurora` wash, which is precisely the Phase 3 deliverable (particle field, CountUp chips,
carousel, FAQ). Looping the shell further would re-score the same gap. Recording that and moving
on; the shell is re-judged at the Phase 7 whole-site pass.

Checks: `npm run typecheck` clean, `npm run build` clean, `cd backend && npm test` 78/78,
`git diff --stat backend/` empty.


---

## Phase 3 — landing showpiece

Files touched (manifest, written as the phase started):
`frontend/src/components/reactbits/ParticleField.tsx` (new),
`components/ui/Reveal.tsx` (new), `components/ui/Carousel.tsx` (new),
`features/landing/Hero.tsx`, `features/landing/BelowFold.tsx`,
`features/landing/ChallengeRail.tsx` (new, replaces the deleted `FeaturedChallenge.tsx`),
`features/landing/StickyFeature.tsx` (new), `features/landing/Faq.tsx` (new),
`features/landing/CtaBand.tsx`, `features/landing/StatsBand.tsx`,
`components/layout/RootLayout.tsx` (section-keyed `page-enter`), `styles/globals.css`
(`.band-ink`, `.no-scrollbar`, `.stagger`, `sibling-index()` guard),
`frontend/scripts/shoot.mjs` (dynamic stepped walk).

### p3-01 — interrupted

Not a usable capture. The first walk of `/` produced only three steps because the step count was
computed before the deferred `BelowFold` mounted, so the rail, sticky panel, FAQ and CTA band were
never on screen. Fixed the harness to re-read `document.body.scrollHeight` at every position; the
attempted `docs/shots/p3-01/` directory is empty and left in place (Windows held a lock on it).

### p3-02 — first full showpiece (`docs/shots/p3-02/`)

Score 36/45. Mood 4 · Type 4 · Color 3 · Shape 5 · Hero 4 · Nav 4 · Motion 4 · Layout 4 · Polish 4.

Six steps at 1440 and eight at 390, light theme, `0 page/theme combinations with failures, console
errors or horizontal overflow`. The confetti field, the challenge rail bleeding off-edge with round
controls, the sticky "submission returns" panel, the count-up stats band, the FAQ and the dark
starfield CTA band with the full-bleed wordmark all render as intended.

Three biggest gaps:
1. **The hero headline put four of six words in violet.** The rubric wants accents as
   glows/chips/tints, and the reference keeps display text in ink. → accent exactly one word.
2. **The particle field was denser and heavier than the reference's sparse scatter**
   (`density 105`, marks 4–11px, α 0.35–0.80, 1.75px strokes, cap 260). → fewer, thinner, fainter.
3. **The carousel header was instructional noise** ("Drag, scroll or use the arrows"). → a mono
   position readout that tracks the scroll, which is also the reference's numeric-chip rhythm.

### p3-03 — accent restraint, sparse field, carousel readout (`docs/shots/p3-03/`)

Applied the three gaps from p3-02: the hero headline keeps ink everywhere except the final word
(`Every flag moves the <accent>board.</accent>`), the field dropped to 9 marks per 100k px² capped
at 130 with 3–8px marks at α 0.26–0.60 and 1.5px strokes, and the carousel header's instruction
line became a mono `01 / 06` position readout that tracks the scroll and dims the end it is at.
Captured light **and** dark this time: 28 steps, `0 page/theme combinations with failures, console
errors or horizontal overflow`.

Two things only showed up once the field was thin: the footer wordmark stopped 17% short of the
viewport edge at 1440 (`25vw` with a `20rem` cap), and the mobile sheet's links were rendering in
`text-secondary` at display size, which is weaker than the reference's ink nav.

### p3-04 / p3-05 — full-bleed wordmark, ink sheet links (`docs/shots/p3-04/`, `p3-05/`)

The footer wordmark is now `clamp(3.5rem, 29vw, 40rem)` — 29vw is the measured ratio at which
"YourCTF" spans the viewport at the −0.05em tracking, so it bleeds edge to edge at every width
instead of only at the cap — with `leading-[0.85]` and a `0.04em` bottom pad so the glyphs are no
longer cropped by the clip box. The sheet uses the same ratio at 24vw (its container is padded).
Its links are `text-primary` with the arrow in the accent for the current section.
`correct:false` / `duplicate:true` in the sticky panel moved into `nums` spans.

### p3-06 — final landing capture (`docs/shots/p3-06/`)

**Score 41/45. Mood 4 · Type 5 · Color 4 · Shape 5 · Hero 5 · Nav 5 · Motion 5 · Layout 4 · Polish 4.**

Passes the gate: total ≥ 38, no criterion below 3, typecheck and build clean, and the report shows
zero console errors and zero horizontal overflow at 1440 and 390 in both themes.

Why not higher: **Color 4** — one screen still carries a violet radial tint, a violet headline word
and violet standings numbers. **Layout 4** — 768 px was not re-shot this phase (Phase 8 covers it).
**Polish 4** — the new landing primitives (mono readout, FAQ plus control) have not been contrast
checked in both themes; that is Phase 8's AA sweep.

### Phase 3 performance gate — measured, not certified

`frontend/scripts/perf.mjs` (new) runs the Playwright chromium already in the dependency set against
the preview build, cold cache, with Lighthouse's mobile emulation (4x CPU, slow-4G), and records
FCP/LCP/TBT/CLS plus weight. Desktop is inside every good band (FCP 148ms, LCP 308ms, TBT 0ms,
CLS 0.0047); mobile is not (FCP 1828ms, LCP 2412ms, TBT 346ms, CLS 0) because the landing is
client-rendered: 161 KB gz of JS is on the wire before anything paints. The font-preload plugin in
`vite.config.ts` fixed the swap shift; the remaining gap needs either a real Lighthouse run (a
package outside the allowed list) or a prerendered hero shell. Both are written up in
[ui-followups.md](ui-followups.md) rather than claimed as a pass.

Checks: `npm run typecheck` clean, `npm run build` clean, `cd backend && npm test` 78/78,
`git diff --stat backend/` empty.

### Kit coverage

`/__kit` gained a "Landing primitives" section showing the carousel, the staggered reveal and the
particle field side by side. Shooting it at 390 caught a real bug the landing never showed: inside a
grid column the carousel pushed the document 17px wide, because an `auto` grid column sizes to its
item's min-content. Fixed with `min-w-0` on the carousel root and an explicit `grid-cols-1` on the
kit row; `p3-kit2` re-shot light and dark with zero overflow and zero console errors.
