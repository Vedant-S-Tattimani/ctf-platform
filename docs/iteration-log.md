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
