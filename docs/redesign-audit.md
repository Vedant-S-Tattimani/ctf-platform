# YourCTF redesign audit

Date: 2026-10-31
Scope: every rendered route, authenticated as player and as admin, at desktop and mobile widths.
This is the evidence base for `docs/redesign-plan.md`. No application code was changed in Phase 1.

## Method

- Ran the real stack: backend on `localhost:4000` (seeded SQLite), frontend on `localhost:5173`.
- Audited as a signed-out visitor, a signed-in player, and an admin. Admin sessions were minted
  locally for testing only; no secret, cookie or flag value is recorded in this document.
- Widths: 1440×900, 1024×768, 768×1024, 412×915, 390×844, 360×800.
- Captured full-page screenshots and measured the DOM: horizontal overflow, scroll containers,
  interactive target sizes, heading order, table geometry, and `innerWidth` vs `clientWidth`.
- Emulated `prefers-reduced-motion: reduce` and keyboard-navigated the primary flows.
- Read the source for every page, state and mutation. File:line references point at the cause,
  not at a symptom.
- Limits: no physical iOS/Safari device pass in this phase; screenshots are kept outside the repo;
  Lighthouse values are from the Phase 10 build (desktop 100, mobile 90–91), not re-run here.

Severity: **P0** blocks a core task, **P1** serious usability or accessibility failure, **P2**
notable quality gap, **P3** polish.

## Health score

| Dimension | Score | Rationale |
|---|---:|---|
| Accessibility | 3/4 | Skip link, labels, linked errors, modal focus trap, landmarks and table→card adaptation are in place. Broken by sub-24px targets, border-only input focus, color-only chart, global motion kill. |
| Performance | 4/4 | Desktop 100 / mobile 90–91, CLS 0, heavy canvas lazy and gated. The below-fold deferral is a UX defect, not a perf defect. |
| Theming | 3/4 | Strong OKLCH role tokens and no orphan colors. Weakened by mono/eyebrow costume and repeated identical surfaces. |
| Responsive | 2/4 | Public pages do not overflow at 360. Admin tables, the challenge category rail and several controls fail on mobile. |
| Implementation integrity | 3/4 | Flows are complete and tested (35 backend tests), but a paid hint is free, several error paths are misdiagnosed as 404/empty, and there is no route error boundary. |
| **Total** | **15/20** | **Good — redesign, not rescue.** |

## What already works (preserve)

- Design tokens are role-based and centralized (`frontend/src/styles/tokens.css`); Tailwind maps to
  them. No component-level hex soup.
- Global skip link, landmarks, one `h1` per page, labeled fields with `aria-invalid` and
  `aria-describedby`, `role="alert"` errors, toasts with `role="status"`.
- `Modal` traps focus, closes on Escape, returns focus and locks scroll.
- Core flows have designed loading skeletons, empty states and retryable errors: challenges,
  scoreboard, admin challenges, account.
- Scoreboard table becomes cards on small screens instead of scrolling sideways.
- Public pages have no page-level horizontal overflow at 360.
- Dark world, hairline language and accent scarcity already read as intentional.
- Submission contract is correct and tested: wrong `200 {correct:false}`, duplicate
  `409 {correct:true,duplicate:true}`.

## Systemic findings

### S1 — Admin is unusable on a phone (P1)

Tables declare fixed minimum widths and wrap them in `overflow-x-auto`:

- `frontend/src/features/admin/AdminChallenges.tsx:100` — `min-w-[46rem]` (736px).
- `frontend/src/features/admin/AdminListings.tsx:108,145,180` — 44rem, 40rem, 46rem.
- `frontend/src/features/admin/AdminCategories.tsx:108` — `min-w-[34rem]` (544px).

At 390px the measured `innerWidth` became 689px and the table's right edge sat at 753px. Points,
solves, status and the Edit action are off-screen; the page silently pans instead of adapting.
This is the single worst responsive defect in the product.

### S2 — The category rail hides its own content (P1)

`frontend/src/features/challenges/ChallengeFilters.tsx:88` puts category chips in a 688px-wide
horizontal scroller inside a 332px viewport and removes the scrollbar
(`[scrollbar-width:none] [&::-webkit-scrollbar]:hidden`). There is no edge fade, arrow or count.
Users cannot know more categories exist.

### S3 — The chart excludes people who cannot separate colors (P1)

`frontend/src/features/scoreboard/ScoreChart.tsx:6-12,33` assigns series identity by color only
and offers no table or textual equivalent. A single series renders as a nearly empty box with no
summary. The chart is decorative for screen-reader and color-vision users.

### S4 — Reduced motion is handled with a sledgehammer (P1)

`frontend/src/styles/globals.css:99-106` forces every animation and transition to `0.01ms`.
That violates the project's own rule to keep opacity/color/state feedback while removing spatial
movement, and it neutralizes every animation library indiscriminately. Reduction must be
targeted per effect, not global.

### S5 — Input focus is a border color change (P1)

`Input.tsx:31`, `Select.tsx:31`, `Textarea.tsx:32` and the flag input (`FlagSubmitForm.tsx:100`)
use `focus:outline-none focus-visible:border-accent`, removing the global focus ring. On a dark
field the only cue is a 1px hue shift — below WCAG 2.4.11 focus-appearance expectations.

### S6 — Controls below the target floor (P1)

Measured: toast dismiss is a 12×12 SVG with no padding (`Toast.tsx:76-86`); Segmented options are
~33px; category chips ~35px (`ChallengeFilters.tsx:126`); admin Edit ~36px; desktop nav links
~37px; logo mark 32px. WCAG 2.5.8 requires 24×24 minimum; the project's own floor is 44×44 for
primary touch targets.

### S7 — A hint labeled “Costs N pts” is free (P1)

`ChallengeDialog.tsx:124-143` renders hints in `<details>` and shows `Costs {cost} pts`, but
expands immediately with no unlock call and no deduction. The interface promises a transaction it
does not perform. This is a trust defect and the reason Phase 8 adds an unlock ledger.

### S8 — The eyebrow motif is everywhere (P2)

`YourCTF{capture_the_flag}` (`Hero.tsx:60`), `// disciplines` (`CategoryGrid.tsx`),
`// live standings` (`MiniScoreboard.tsx`), `YourCTF{join}` (`CtaBand.tsx:16`),
`YourCTF{auth}` (`AuthLayout.tsx:18`), `YourCTF{404}` (`NotFound.tsx:9`). An eyebrow above every
heading is an Impeccable-ban and flattens hierarchy: when everything is labeled, nothing leads.

### S9 — Identical card grids and uniform hero copy (P2)

The landing category section is six identical dot + name + count cards; challenge cards are a
uniform grid with the same internal order. Sections repeat the same container, padding and
entrance, so the page scans as a template rather than an authored board.

### S10 — Heading order skips (P2)

`CardTitle` always renders `h3` (`Card.tsx:25`). Combined with `PageShell`'s `h1` this produces
h1→h3 on Account, TeamDetail and Teams, and Teams then jumps back to `h2` for “Top teams”. The
guest card's visual heading is a `<p className="type-h2">` (`Teams.tsx:48`), so it is not a
heading at all.

### S11 — Shell gaps (P2)

No route-level error boundary (a render error blanks the app); no scroll restoration between
routes; no command palette; no mobile bottom navigation; no event status chip; no breadcrumb or
local rail in admin. Navigation is a desktop top bar that collapses into a hamburger menu.

### S12 — Session bootstrap is gated by a localStorage guess (P2)

`frontend/src/hooks/useAuth.ts` gates `/auth/me` behind a `yourctf:session` hint. A stale hint
delays first paint and can turn an outage into a signed-out state; a missing hint skips bootstrap
entirely. Phase 9 replaces this with `GET /auth/session` that always returns 200.

### S13 — Deferred landing is fragile (P2)

`LandingPage.tsx:36-38` reserves `min-h-[110vh]` until below-fold content mounts. Until the
trigger fires, prints, screenshots and slow devices see a blank band. `StatsBand` can render zeros
when mounted off-screen. The content should be deferred in JavaScript, not reserved as emptiness.

### S14 — Network failures masquerade as missing content (P2)

- Landing category and mini-scoreboard queries branch on `isPending` only; a failed request shows
  “Nobody has solved anything yet” or “No challenges are published yet”.
- `TeamDetail.tsx:38` treats `isError || !team` as “Team not found”; an outage claims the team was
  removed and offers no retry.
- `Profile.tsx:39` does the same for a missing player.
- `Teams.tsx` ignores `team.isError` and falls through to onboarding, telling a signed-in member
  to create a team.

### S15 — Event context is missing or ambiguous (P2)

No header chip shows live/upcoming/ended, dates or a countdown. Admin event dates render without
year or timezone (`formatDateTime`), e.g. “Oct 30, 01:14 PM”, so organizers cannot confirm what
timezone they just saved.

### S16 — Secondary pages are shells (P2)

- Team detail is a members list and two meta cards; no rank, points, solve timeline or roster
  table.
- Profile is an identity card plus recent solves for self only; no stats, category breakdown or
  timeline.
- Account has no password change, verification status or session information.
- Admin has no overview dashboard; “Challenges” is the default and only entry point.
- The challenge editor is an 866-line modal with internal 85vh scrolling and no preview.

### S17 — Navigation and filtering are shallower than the data (P2)

Challenges has no sort, progress summary or deep-linkable challenge detail; filters open a dialog
rather than a URL. Scoreboard has no podium, rank movement or pinned “you” row (only a background
highlight), and no search. Admin challenges have no sort, paging, bulk publish or reorder; people
and submissions have no search or sort.

### S18 — Copy drift (P3)

“People & activity” vs “People and activity”; “Seats” vs “Team size cap”; “Hey, admin”;
“Read the brief, work the target, submit the flag” is good but the CTA band repeats a different
metaphor. Dates omit year/timezone. Errors sometimes state what failed but not how to recover.

## Page-by-page

### Landing `/`

- Layout: four stacked container-width sections with the same left-aligned heading and the same
  padded band. The page has no asymmetry, no featured subject and no editorial contrast. The
  category grid is six identical cards.
- Hierarchy: flag eyebrow above the headline, then headline, then two CTAs, then a social-proof
  badge. Below the fold, sections compete at equal weight (categories, stats, top 5, CTA band).
- Navigation: top bar only; no jump to the board; no event status, dates or countdown; no entry
  point that changes when an event is live versus ended.
- States: miniboard and category sections have skeletons and empty copy but no error branch.
  Below-fold content reserves 110vh and appears after a scroll/pointer/key trigger or 12s.
- Mobile: hero holds up, Aurora is disabled on coarse pointers, cards stack. The blank reserve is
  visible in captured full-page shots and prints.
- Copy: the brace motif repeats five times across the app; “The next event is already on the
  board” has no date attached; “one curl away” assumes a terminal workflow.

### Login `/login` and Register `/register`

- Layout: a single `max-w-md` card centered in a full viewport (`AuthLayout.tsx`), leaving most of
  a 1440px screen empty. No brand panel, event context or value statement.
- Hierarchy: flag eyebrow, heading, fields, submit, switch link. Form labels are persistent and
  errors are linked, which works.
- States: field errors and a form-level alert; loading button; rate-limit errors surface through
  `errorMessage`. No password visibility, confirmation, strength guidance, forgot-password or
  verification messaging.
- Mobile: width is fine; the empty desktop composition becomes less noticeable but the page still
  carries no context.
- Copy: generic “Welcome back”/“Create your account” without recovery or next-step expectations.

### Challenges `/challenges`

- Layout: page header with two count badges, filter block, then a 1/2/3-column card grid.
  Every card has the same rhythm: category, difficulty, title, points/solves/flags, solved state.
- Hierarchy: `h1` → filters → card `h2`s. The count badges compete with the title; there is no
  progress summary (solved/total) or focal challenge.
- Navigation: category, difficulty and status live in the URL; search does not. The open challenge
  is local state, so browser Back does not close it and a challenge cannot be linked. The dialog
  has no previous/next and no path back to a filtered subset.
- States: the strongest set in the app — skeleton, error with retry, empty board, filtered-empty
  with “Clear filters”. Dialog: description is `whitespace-pre-line` plain text; hints expand
  free despite a cost badge; files are a download link or a “Copy path” for local references; no
  solver list, attempt history or flag-format hint.
- Mobile: the category rail hides content (S2); filters occupy a tall block; the modal is tall
  with internal scroll; chips and segmented controls are under target size.
- Copy: “12 live” conflates published with event-live; “Costs N pts” is not honored.

### Scoreboard `/scoreboard`

- Layout: page header, scope switch, points chart, table. No podium; the chart is a thin line in a
  large panel; the table is the only dense element.
- Hierarchy: chart and table have equal weight; “Live · refreshes every 15s” is a status line
  styled like metadata.
- Navigation: teams/players scope; no event selector, no search, no jump-to-team, no per-row
  detail beyond links. Chart legend is not interactive.
- States: list skeleton, list error with retry; chart empty copy; history query has no error
  branch, so a failed chart request is indistinguishable from no history.
- Mobile: table becomes cards (good); chart labels get small; the 15s poll can reorder rows under
  the reader without any change cue.
- Copy: “Live” while polling every 15s; updated timestamp lacks timezone context.

### Teams `/teams`

- Layout: for a guest, one CTA card plus “Top teams”; for a member, the team panel plus top teams.
  The page is bottom-heavy and gives no overview of the competition or team options.
- Hierarchy: h1, visual heading rendered as a paragraph (`Teams.tsx:48`), top teams `h2`, and
  `h3` cards inside the panel — two skips.
- Navigation: create/join happens on the same page; no directory of teams, no search, no link to
  one's own team from the top list beyond the highlight.
- States: team skeleton exists; `team.isError` is ignored and falls through to onboarding; the top
  query has no error branch.
- Mobile: cards stack cleanly; invite code entry is usable; the top list is long.
- Copy: “Bring your crew” and “one roster, one score” are good; the page does not explain team
  size limits or ownership rules.

### Team detail `/teams/:id`

- Layout: a two-column grid (content + 320px aside) that is sparse even at 1440. Members list,
  details, invite card. No banner, rank, points, join status or solve history.
- Hierarchy: h1 → h3 cards with no h2. Description fallback is “A team in the competition.”
- Navigation: no links from members to profiles, no rank link, no route from here to the team's
  scoreboard position.
- States: skeleton; any error renders “Team not found” with no retry, misdiagnosing outages.
- Mobile: stacks correctly but the page is still mostly empty.
- Copy: owner/member labels are plain; no explanation of how to join a public team.

### Profile `/users/:id`

- Layout: identity card and, for self only, recent solves. No stats, category split, timeline or
  team context.
- Hierarchy: h1 → h3 card; no section headings for the solve list.
- Navigation: team name links only when present; no path to the scoreboard position or teammate
  profiles.
- States: skeleton; any error becomes “not found”; solves have a skeleton, and there is no
  designed empty statement beyond a line of text.
- Mobile: fine; the page ends quickly.
- Copy: “Member since” is useful; bio fallback is generic.

### Account `/account`

- Layout: profile card, account details card, team card. No security or activity. “Hey, username”
  as the page title.
- Hierarchy: h1 → h3 cards; Bio is a single-line `Input` even though a `Textarea` primitive exists.
- Navigation: links to public profile and team management; no password, email or session controls.
- States: loading skeleton and error state; save toast; avatar URL is a raw text field with no
  preview or validation guidance.
- Mobile: fine; form is short.
- Copy: “Hey, admin” is informal in a security product; “Avatar URL” is technical; no explanation
  that email is never shown publicly.

### Admin `/admin`

- Layout: page header plus a segmented control and a table. “Challenges” is the default; there is
  no dashboard, no rail, no event summary.
- Hierarchy: h1 → tab strip → table; the tab strip is a button group with `aria-pressed`, not a
  semantic tablist. Tables have their own header row.
- Navigation: tab lives in `?tab=`; no deep link to an edit form; no overview to jump to a problem
  area; no breadcrumb.
- States: challenges have skeleton/error/empty; forms use inline errors and toasts; destructive
  actions confirm inline. Categories and events lack search; listings lack sort.
- Mobile: the table defect (S1) dominates; the challenge editor is a 85vh modal with many fields;
  events use `datetime-local` with no timezone label.
- Copy: “People & activity”, “Team size cap”, “Seats” drift; event dates are ambiguous; no
  scoring mode or countdown.

### 404 and route failure `*`

- Layout: centered flag eyebrow, heading, copy, two links. Correct but generic; no search, no
  recent content, no board shortcut tailored to the attempted path.
- No error boundary exists for render errors, so an exception removes the app rather than showing a
  designed failure state.

## Backend gaps that surface in the UI

These are product gaps, not just missing screens; they are scheduled for Phases 8–9.

1. Hints have a `cost` but no unlock endpoint or ledger, so the UI cannot honor the price.
2. Team ownership is a dead end: remove member, transfer ownership and regenerate invite are
   absent. A sole owner with members cannot leave.
3. No password reset or email verification, so the auth screens cannot offer recovery.
4. No `GET /auth/session`; the client guesses from localStorage.
5. Scoring is static; `dynamicPoints()` / `scoreFor()` exist but are unused and events have no
   scoring mode.
6. No file hosting: challenges accept external URLs or local path metadata, and “Download” only
   works for HTTP URLs.
7. PostgreSQL is the target schema but tests run on SQLite only.
8. No boot refusal for default secrets, no administrative hygiene surface.
9. No configurable hash/truncation policy for wrong submissions.
10. No `reset:dev` / `--demo` seed, so every new environment begins in empty states.

## Constraints the redesign must keep

- Flags stay salted SHA-256 hashes with timing-safe comparison; no response includes a value, salt
  or hash. Hint unlocks and submission changes must preserve this.
- Exactly one HTTP boundary. Every new capability is documented in `backend/API.md` in the same
  change.
- Wrong submission `200 {correct:false}`; duplicate `409 {correct:true,duplicate:true}`.
- All branding and copy original; brand name only in `frontend/src/lib/brand.ts`.
- WCAG AA, labels, focus management, skip link, reduced motion.
- Lighthouse landing: 90+ mobile, 100 desktop.
- Backend tests keep passing; new backend behavior gets tests.
- No new packages beyond those the master prompt already names. React Bits components via shadcn.

## Audit close-out

The product is coherent, fast and honest in its core loop. It fails at the edges: a mobile admin
that cannot be used, a chart that only works for some eyes, controls that are too small to hit, a
paid hint that is free, and a design language that repeats one motif until it stops meaning
anything. The redesign should keep the tokens, the tests and the submission contract, and replace
the composition, navigation and secondary pages.
