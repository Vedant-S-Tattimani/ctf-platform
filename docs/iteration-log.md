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


---

## Phase 4 — challenge board

Files to touch (manifest, before the first edit):
`frontend/src/pages/Challenges.tsx`, `features/challenges/ChallengeFilters.tsx`,
`features/challenges/ChallengePanel.tsx`, `features/challenges/FlagSubmitForm.tsx`,
`frontend/src/components/ui/SectionHeader.tsx` and `components/ui/Badge.tsx` if the board needs
them, plus `frontend/src/styles/globals.css` for any new reveal/scroll rule.
No file under `backend/`, no change to the submission contract: a wrong flag stays
`200 {correct:false}` and a repeat stays `409 {correct:true, duplicate:true}`.

### Manifest amendment

Two shared primitives joined the list because the fixes belong to them, not to the board:
`components/ui/PageHeader.tsx` (a `titleClassName` escape hatch) and `components/ui/Reveal.tsx`
(a `role` prop, so a Tailwind-reset `<ul>` can keep its list semantics while staggering).

### p4-01 / p4-02 — baseline, and the harness had no way in (`docs/shots/p4-01/`, `p4-02/`)

Before judging the board the harness needed two things it lacked: `--login=email:password` (the
session cookie is set through `page.request.post`, so the context jar carries it into every capture,
and authenticated files gain an `-in` marker) and a `submit` state action. The first authenticated
run silently skipped `submit` — the challenge picked was already solved, so `FlagSubmitForm` never
mounts. Re-shot against "Cookie Jar" (2 flags, neither solved by this account), which is the only
kind of row that shows Targets, progress and the form at once.

Baseline score **30/45** — Motion 2, and three concrete gaps:

1. **Motion 2 → the board and panel are inert.** Rows and panel sections appear with no transition.
   Fix: `Reveal stagger` on the board list, a keyed `motion.div` fade-up around the panel body, and a
   `group-hover:scale-150` on the category dot.
2. **Polish → the board lied.** `flagsSolved/flagsTotal` was printed as personal progress, but
   `challenges.service.ts:117` sets `flagsSolved: challenge.solves.length` — solve rows across all
   users. "Crackme Junior" rendered `2/1 flags`. Fix in the frontend: print `flagsTotal` targets and
   leave personal state to the check icon; the misleading field is written up in ui-followups.
3. **Shape/Color → everything was flat and everything shouted.** Every row's points figure was
   accent-violet, and Targets/Files/Hints were borderless strips. Fix: ink numbers with accent only on
   the selected row, `rounded-lg` + `shadow-soft` cards for Targets/Files/Hints, `shadow-card` for the
   submission panel, and `rounded-lg` on the feedback chip.

### p4-03 / p4-04 — cards, then the rhythm they broke (`docs/shots/p4-04/`)

Wrapping the panel body in `motion.div` silently removed the `gap-8`: the fragment's children became
plain block children of a non-flex div, so the brief sat on top of Targets and Targets on top of the
submit card. The wrapper now carries `flex flex-col gap-8` itself. The submit state also needed
`scrollIntoViewIfNeeded()` in the harness — the feedback chip is below the fold on a full-page shot,
so the capture looked like nothing had happened.

### p4-05 … p4-09 — hierarchy, pinned board, column control (`docs/shots/p4-09/`)

* **Hierarchy**: with a challenge open, the section title "Challenges" was still the largest text on
  the page. `PageHeader` now takes `titleClassName`, the board passes `type-h2` when a row is
  selected, and the challenge title steps up to `type-h1` on desktop.
* **Pinned board**: `lg:sticky lg:top-16 lg:self-start` on the list column. An earlier version also
  had `max-h-[calc(100vh-4rem)] overflow-y-auto`; that clipped the list to one pane and — because the
  board is the taller column with 12 challenges — never actually stuck. Dropped.
* **Column control**: the Targets, Hints, Files and submission blocks now cap at `max-w-3xl`, so a
  984px detail column does not stretch the flag input to 500px.
* **Solved rows** recede to `text-secondary`; the all-solved state is a compact success band instead
  of a full-height card with one line in it.
* The brief is 17px/`leading-relaxed`, the panel header closes on a hairline, and the flag field is
  `h-12 px-4` at mono `text-base`.

**Score 38/45. Mood 4 · Type 4 · Color 4 · Shape 4 · Hero 4 · Nav 4 · Motion 4 · Layout 4 · Polish 5.**

Passes the gate at the iteration cap (6 loops after the baseline). Why nothing is a 5 except Polish:
**Type** — the board row's `category · difficulty · n flags` sub-line is 12px muted next to display
type two steps up; it wants 13px. **Color** — the difficulty chips (amber/green) still sit on flat
tints rather than the reference's blended surfaces. **Motion** — filtering the board swaps rows with
no transition; a keyed re-stagger was tried and rejected as jarring while typing in the search field.
**Hero/Layout** — the detail column still runs short of the fold on a 900px viewport for briefs with
no files or hints; filling it needs data the API does not expose (recent solvers, first-blood holder).

Checks: `npm run typecheck` clean, `npm run build` clean, `cd backend && npm test` 78/78,
`git diff --stat backend/` empty. Wrong-flag submission verified from the UI: `200 {correct:false}`,
danger chip, board unchanged.


---

## Phase 5 — standings, identity and access

Files to touch (manifest, before the first edit):
`frontend/src/pages/Scoreboard.tsx`, `pages/Teams.tsx`, `pages/Profile.tsx`, `pages/Account.tsx`,
`pages/Login.tsx`, `pages/Register.tsx`, `pages/ResetPassword.tsx` and `pages/NotFound.tsx` if the
sweep reaches them, plus the `features/scoreboard`, `features/teams` and `features/auth` modules and
`components/ui/DataTable.tsx` / `Stat.tsx` / `Tabs.tsx` where those pages lean on them.
Shared primitives change only when the fix belongs to the primitive (as with `PageHeader` in Phase 4).
No file under `backend/`. The session contract is unchanged: httpOnly cookie, `credentials: 'include'`,
no token in localStorage, and no flag material anywhere in the client bundle.

### p5-01 … p5-03 — card language, then the defect it exposed (`docs/shots/p5-01/`…`p5-03/`)

The standings group had no shared surface: the podium was a bordered block, the chart sat on a
bottom rule, the table floated on the canvas and the team panel mixed two radii. All of it now uses
one card — `rounded-lg border border-hairline bg-surface p-6 shadow-card sm:p-8` — with rows inside a
card at `rounded-md`, `bg-elevated` on hover and `bg-accent-faint` for the viewer's own row.

Writing that language surfaced a real rendering bug rather than a taste problem: `bg-accent-faint/40`,
`border-accent/30`, `border-success/50` and `hover:bg-elevated/60` were already in the tree and
**emit no CSS at all**. The Tailwind colours are plain `var()` strings with no `<alpha-value>`, so the
slash modifier is dropped — proved by grepping `dist/assets/*.css`, which contains
`.bg-accent-faint{background-color:var(--accent-faint)}` and no alpha variant anywhere. The visible
consequence: the "your row" highlight on the scoreboard, the teams list and the challenge board had
been silently invisible. Nine files moved to the dedicated faint/border tokens; a follow-up grep for
`-(faint|hairline|accent|success|danger|elevated)/[0-9]` now returns nothing.

Also: `--accent-faint` is already a ~0.09 alpha tint, so the correct pairing is the token alone.

### p5-03g … p5-04 — honest standings, and the auth fields (`docs/shots/p5-03g/`, `p5-04/`)

* Profile, TeamDetail, TeamPanel and Teams now read the same cached query —
  `['scoreboard','list','teams'|'users']` at `limit: 100` — so rank, points and solves appear on the
  identity pages without deriving anything client-side, and the board is fetched once per session
  rather than four times.
* Seat counts were printed twice on two surfaces (header stat + progress hint). Each page keeps one.
* The podium's leader column gained the only number that makes rank 1 mean anything: the margin over
  second, with a separate tie branch (`Level with X on points — tie-break decides the order.`).
* `PasswordInput` existed and was used nowhere. All three real auth flows now use it; the show/hide
  button is in the a11y tree as `button "Show password"`.
* Both not-found branches became cards with `buttonVariants` actions instead of a sentence on the
  canvas.

The guest pass is separate because `--login` shares the cookie jar: `/login`, `/register` and
`/forgot-password` redirect a signed-in session to `/account`, so the earlier auth shots were
account pages wearing an auth URL.

### p5-05 … p5-07 — motion, the sparse team page, and measured contrast

* **Motion**: the group had only the route fade. `ScoreChart` and the full board are now `<Reveal>`
  sections and the Top teams rows carry `<Reveal stagger as="ol">`, matching what the landing and
  board already do. Reduced motion neutralises both in CSS, not in JS.
* **TeamDetail was two cards and a field of white.** The main column now carries
  *Around rank N* — the ranked teams either side of this one with the points gap against this roster,
  this team highlighted in place of a link. It comes from the standings list the page already
  fetches, so no new endpoint and nothing invented.
* **Account → Team** was a sentence and a button. It now shows rank and points in the card header
  from the same cached board query.
* **Contrast, measured not asserted.** `--text-muted` resolved to `oklch(0.58 0.015 265)`, which is
  **4.10:1** on `--bg-surface` and **3.63:1** over the violet row highlight — under AA for the 12px
  labels that carry the metadata on every page in this group. `--ink-400` moved to 0.545 (4.75:1 on
  surface, 4.61:1 on elevated) and a `.band-tint` helper — the same local-role-override trick
  `.band-ink` already uses — resolves `--text-muted` to the secondary step inside tinted surfaces
  (4.67:1 light, 7.09:1 dark). Applied to the highlighted table row and mobile card, the "your
  position" band, the selected challenge row, the highlighted top-team row and the *around rank*
  row. Remaining pairs in the group were computed too: danger 5.58/6.09, success 5.21/9.42,
  accent-strong on faint 6.14.
* Verified by hand rather than assumed: sign-in through the real form, the Team tab of `/account`,
  and `/scoreboard?scope=users` — the players podium, position band and full board all render; the
  scope is not on the harness page list, which is why it needed a browser pass.

**Score 38/45. Mood 4 · Type 4 · Color 4 · Shape 5 · Hero 4 · Nav 4 · Motion 4 · Layout 4 · Polish 5.**

Passes at the iteration cap. Why nothing else is a 5: **Type** — the `type-small text-muted` meta
lines are 12px against display type three steps up; they clear AA now but still read as fine print.
**Color** — the invite card is a large flat violet field at 390 where the reference blends tints into
the surface. **Motion** — switching Teams/Players swaps the whole board with no transition; a keyed
re-stagger was tried in Phase 4 for the same reason and rejected as jarring. **Layout** — with three
members the roster column still ends above the fold on a tall desktop viewport.

Checks: `npm run typecheck` clean, `npm run build` clean, `cd backend && npm test` 78/78,
`git diff --stat backend/` empty. p5-07: 24 shots, 0 page/theme combinations with failures, console
errors or horizontal overflow.


---

## Phase 6 — admin

Files to touch (manifest, before the first edit):
`frontend/src/pages/Admin.tsx` (shell + sidebar), `features/admin/AdminOverview.tsx`,
`AdminChallenges.tsx`, `AdminCategories.tsx`, `AdminEvents.tsx`, `AdminListings.tsx`,
`AdminChallengeEditor.tsx` and `features/admin/queries.ts` if a key needs aligning. Shared
primitives only where the fix belongs to the primitive. No file under `backend/`; the admin
endpoints already return everything these pages show, and no admin response carries flag material.

Baseline `docs/shots/p6-01/` (20 shots, 0 failures/console errors/overflow) shows what the group is
missing after Phase 5: the public pages got a card language — `rounded-lg border-hairline bg-surface
shadow-card`, rows at `rounded-md` with `bg-elevated` hover — and the admin area did not. Four
specific gaps, in order of how much they cost the area:

1. **Nothing is contained.** The stat strip, the recent-submissions list, the challenge table and the
   aside blocks all sit directly on the canvas, separated by rules. Beside the public scoreboard the
   same data in cards, admin reads as an unfinished view of the same product.
2. **The sidebar's active item is a full-bleed tinted block** with square corners, which is the
   loudest thing on every admin page and matches nothing else in the design system.
3. **The filter row on /admin/challenges** puts a narrow search field and a segmented control on one
   line with a count floating between them; the field's width has no relationship to the table under
   it.
4. **Tinted surfaces still use the muted role at 3.6–4.2:1** in a few places — Phase 5's `.band-tint`
   helper has to be applied here as the cards get their highlight rows.

### p6-02 — the card language arrives

Every listing block went into the same shell the public pages use: `rounded-lg border border-hairline
bg-surface … shadow-card`. The stat strip became one card built from `gap-px` over `bg-hairline` so the
dividers are the grid itself; the recent-submissions list, the challenge/category/roster tables and the
events list each got a card, with rows at `rounded-md` and `bg-elevated` on hover. Tables needed an
extra `overflow-hidden` wrapper so the horizontal scroll does not clip the rounded corners, and
`last:border-b-0` so the final row does not draw a rule against the card's own edge. The editor's
`EditorSection` went from a top rule to a card, its sub-item lists became recessed wells
(`bg-canvas` + `rounded-md`), the danger zone took `border-danger bg-danger-faint`, and the aside
columns dropped their `border-l` divider for a 20rem column of cards. Gap 2 and gap 4 were fixed with
the shell: the sidebar's active item is now a `rounded-md bg-accent-faint` pill with `band-tint`, and
every tinted surface carries the helper.

### p6-03 — motion, and two things the screenshots caught

Scored 36/45 against the rubric: the area was contained but static, and the admin group had none of
the reveal language the rest of the site uses. `Reveal` now wraps the overview stats (staggered per
cell), the two-column body, each listing panel (keyed on the tab so switching Users/Teams/Submissions
replays it), the events cards (staggered per card) and both editor columns. Motion stays
transform/opacity only, and `prefers-reduced-motion` neutralises it the same way as everywhere else.

Two real defects came out of looking at the shots rather than the code: the event card's
`30 Oct 2026, 12:26 UTC` wrapped to three lines inside a four-column `dl` (now two columns with
`whitespace-nowrap`), and the handout picker was a raw native `Choose File` button — the one control
in the area that belongs to no design system. `Input` now styles `::file-selector-button` with the
pill, `bg-elevated` and `border-subtle` tokens, so every file field in the product picks it up.

### p6-04 — copy and counting

`1 flags`, `1 solves`, `12 of 12 · 12 live` — three places where the admin area states numbers badly.
`formatCount(n, 'flag')` in `lib/format` now owns the singular, and the challenge counter says either
`12 of 12 live` or `4 of 12 shown` depending on whether a filter is active. The same helper took over
the landing hero's `N flags captured`, which had a hand-rolled plural next to it that was already
correct — both now read from one place.

**Score 38/45. Mood 4 · Type 4 · Color 4 · Shape 5 · Hero 4 · Nav 4 · Motion 4 · Layout 4 · Polish 5.**

Why nothing else is a 5: **Type** — the `type-label` column heads and `type-small` meta lines are the
smallest the token set allows, and a dense table makes them look like footnotes. **Color** — the
difficulty badges are the most saturated elements in the area; they are semantic and shared with the
public board, so they stay. **Motion** — the reveal is the whole vocabulary here; an admin area that
animates more than this stops feeling like a tool. **Layout** — with one event and six categories the
pages are mostly empty canvas, which no amount of card work fixes.

Checks: `npm run typecheck` clean, `npm run build` clean, `cd backend && npm test` 78/78,
`git diff --stat backend/` empty. p6-02/03/04: 24 shots each, 0 page/theme combinations with failures,
console errors or horizontal overflow. `shoot.mjs` gained a `modal` interaction state, so p6-05 proves
the create-event and create-category dialogs still open, scroll inside `max-h-[85vh]` and close on
Escape in both themes at both widths.


---

## Phase 7 — whole-site pass

Files to touch (manifest, before the first edit):
`frontend/scripts/shoot.mjs` (a `--widths` flag, so the intermediate breakpoints can actually be
captured), then only what the sweep proves broken — expected to be layout in `pages/Challenges.tsx`,
`pages/Scoreboard.tsx`, `pages/Teams.tsx`, `features/challenges/*` and `components/ui/*` where a
primitive is at fault, plus `docs/ui-followups.md` for anything that needs a backend change. No file
under `backend/`.

1440 and 390 have been shot on every phase so far. The widths between them — 360, 412, 768, 1024 —
have never been captured, and those are exactly where a two-column layout either collapses early or
refuses to collapse. This phase is the sweep.

### p7-01/02 — the header could not fit its own chip

The first five-width pass put 10 px of horizontal scroll on *every* route at 1024. The cause was not
a table or an image: it was the event chip in the navbar. `EventStatus` renders its timing text
("Ends 31 Oct, 12:26 UTC") from `lg:` upward, and at exactly 1024 the logo, four nav links, the chip,
palette, theme and account buttons add up to wider than the container. The timing is the chip's
widest part, so it now appears from `xl:` instead; the chip keeps its state dot, label and (on the
landing) challenge count at 1024 and loses only the timestamp. A probe over the DOM at 1024, 768, 412
and 360 returns no element whose box crosses the viewport edge afterwards.

### p7-03/04 — a grid that refused to collapse

`/teams/:id` at 360 overflowed by 18 px in both themes. The page is a `lg:grid-cols-[minmax(0,1fr)_20rem]`
two-column layout; `minmax()` only constrains the tracks once `lg:` applies. Below it the grid is one
column, every child defaults to `min-width: auto`, and the members' `dl` plus the roster rows push the
column 2 px past the viewport, which the card then inherits. Both grid children now carry `min-w-0`,
which is the same thing the challenges board already does for its master/detail column. The rest of
the `lg:grid-cols-[…]` consumers were checked by reading their children: `Teams`, `Kit`, `Hero`,
`CtaBand`, `Faq`, `HowItWorks` and `StickyFeature` all contain wrapping text or explicitly
`min-w-0`/`shrink-0` children, and the sweep confirms none of them overflow.

### p7-05 — the harness was lying about the authenticated sweep

100 records means 100 logins, and `LOGIN_RATE_LIMIT_MAX` is 100 per 15-minute window. The player
sweep therefore signed in for the first seven routes and got 429 for the last three, capturing
signed-out screens under `-in` filenames. Nothing about the pages was wrong — the measurement was.
`shoot.mjs` now opens one context per theme, logs in once through `context.request`, and changes the
viewport with `setViewportSize` per width: 90 records, 2 logins. A failed login is fatal to the run
instead of silently degrading a theme, which is the only reason this went unnoticed for a phase.

### between sweeps — what reading the error paths turned up

Two screens showed a fabricated state when a request failed. `/teams` treated any non-success on
`teamsApi.me` as "has no team", so a dropped session or a 500 rendered the create-a-team onboarding;
and `TopTeams` fell through to "No team has put a flag on the board yet" whenever the scoreboard query
errored. Both now branch on `isError` and render the shared `ErrorState` with a retry. The landing
challenge rail had the same problem in the other direction: a failed fetch left a section heading over
an empty band, so it returns `null` when its query errors — a decorative rail that is absent reads
better than one that claims the board is empty.

Along the way the count copy was consolidated: `formatCount(n, 'solve')` replaced nine more
hand-rolled `n === 1 ? 'solve' : 'solves'` triples across the podium, board table, scoreboard's own-row
strip, teams page, team panel and detail, challenge panel, board header badge, event chip and hero.
Plurals belong to one helper now, and the sites that still split number from noun (`dd`/`dt` pairs on
the rail cards) are deliberately left alone because the markup, not the grammar, wants them apart.
Only two hand-rolled plurals remain in `src/`: the command palette's result count and that same
number/noun split.

### p7-06/07/08 — the sweep, run properly

Guest (10 routes × 5 widths × 2 themes = 100 records), player (9 × 5 × 2 = 90) and admin (9 × 5 × 2 =
90) each finished with **zero** page/width/theme combinations carrying a console error, a failed
navigation or more than 1 px of horizontal scroll. The admin area — rebuilt in Phase 6 and only ever
shot at 1440 and 390 — needed nothing at 360, 412, 768 or 1024.

768 did produce one defect outside the sweep's own report, because it is a layout that reads badly
rather than one that overflows: the footer's four link columns sit in an `auto` track beside the brand
column, so at tablet width they took their max-content width and squeezed the event line to one word
per row. The nav is two columns until `lg:` now, which is what the 768 re-shoot (p7-09) proves.

### measured, not assumed

Three checks that had been asserted by reading CSS so far were run against the built `dist/`:

- **Contrast.** A probe walks every element that owns a text node, composites the ancestor
  background stack (skipping any element under a filter, where the model breaks down) and applies
  WCAG relative-luminance with the 24 px / 18.66 px-bold large-text threshold. 28 route × theme ×
  width combinations across landing, board, scoreboard, teams, team detail, profile, account, auth,
  404 and five admin screens: **0 AA failures**.
- **Keyboard.** Tab order on the landing and on `/admin/challenges` is skip link → brand → nav →
  event chip → palette → theme → account → admin sidebar, and every stop reports a 2 px accent
  outline. The palette has `aria-activedescendant` with arrow/Enter handling; `Tabs` uses roving
  `tabIndex` with Left/Right.
- **Reduced motion.** With `reducedMotion: reduce`, the landing's canvas count is 0 and all 25 reveal
  elements are visible after a scroll pass (the one at 0.978 was mid opacity-fade, which reduced
  motion permits).

The flag-secrecy invariant was checked on the artifact rather than the source: no built chunk under
`dist/assets` contains a `flag{`-shaped string, and `ChallengeSummary`/`FlagMeta` carry only counts,
labels and algorithms.

**Score 39/45. Mood 4 · Type 4 · Color 4 · Shape 5 · Hero 4 · Nav 4 · Motion 4 · Layout 5 · Polish 5.**

Layout and Polish move to 5 this phase because the rubric's own 5-point tests — "working at
390/768/1440" and "AA in light and dark, zero overflow" — are now measured at five widths instead of
two. The other sevens stay at 4 for the same reasons as Phase 6: the reference's hero is a denser
media/typography collision than this product's, and the type scale is deliberately quieter.

Checks: `npm run typecheck` clean, `npm run build` clean, `cd backend && npm test` 78/78,
`git diff --stat backend/` empty.


---

## Phase 8 — final QA: drive it, don't look at it

Files touched: `README.md` (scripts table, re-skin verification numbers, Design reading order, one new
known gap), `docs/iteration-log.md`, `docs/ui-followups.md`. No `frontend/src` change came out of this
phase — the audit found the app correct and the harness selectors wrong, four times over.

The Phase 4–7 loops are visual. This phase ran the product instead: 15 scripted browser flows against
the built bundle, each asserting an outcome rather than a pixel.

**15/15 pass.** Theme toggle survives a reload (`data-theme` flips and stays flipped). `Ctrl K` →
type → Enter lands on `/scoreboard`. The mobile menu at 390 navigates. An unknown route renders 404
copy rather than a blank shell. An empty sign-in stays on `/login` and explains itself. A guest can
read the board and gets a sign-in prompt instead of a submission form on a challenge. A wrong flag
returns `200 {correct:false}` and the inline `role="status"` panel — the invariant holds in the UI, not
just in the API tests. Profile save writes, reloads, reads back and restores. The scoreboard's refresh
can be paused. A team member sees roster and invite code. Admin creates a category, sees it, deletes it,
sees it gone. The listing switcher moves between Users/Teams/Submissions. And the admin challenge
editor — the one screen that legitimately handles flag records — contains no flag-shaped string
anywhere in the DOM, in inputs or in text.

Four of the initial failures were the audit script's fault, and they are worth recording because two
of them are traps for the next person who writes one:

- Both the mobile card list and the desktop table are in the DOM at every width (one is `md:hidden`),
  so `getByText(name)` finds the invisible copy first. Scope table assertions to `table tr`.
- The two-step delete reads "Confirm" in the table row and "Confirm delete" in the card list. Same
  action, two labels — a real inconsistency in the markup, noted rather than churned for.
- `Promise.all([...waitForResponse, fill, click])` races the click against the fill; start the response
  promise, then act.
- The listing switcher is `Segmented` (`role="group"` + `aria-pressed`), not `Tabs` (`role="tab"`).
  Asserting the wrong role is a test bug, not a product bug.

One check needed a fixture decision rather than a selector fix: the flag-submission flow has to pick a
challenge the account has *not* solved, because a solved challenge renders no form. The audit now reads
`/challenges` and takes the first `solvedByMe === false` row instead of hard-coding an id.

Cleanup: the temporary probes used to measure Phase 7 (overflow, contrast, reduced-motion/keyboard,
feature audit) are deleted once their results are recorded here and in the README; the permanent
harness (`scripts/shoot.mjs`) is the one that stays.

Checks: `npm run typecheck` clean, `npm run build` clean, `cd backend && npm test` 78/78,
`git diff --stat backend/` empty, 15/15 browser flows green, category list back to its original six
rows with no audit leftovers.
