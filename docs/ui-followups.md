# UI follow-ups

Anything the re-skin could not land inside its loop budget, or that would have needed a backend
change. Add a dated entry with the page group, the gap, and why it is parked.

## 2026-11-01 · landing — the mobile performance gate is measured, not met

Phase 3 asks for Lighthouse 90+ mobile / 100 desktop. Lighthouse is not a dependency here and is
not on the allowed list for this re-skin, so `frontend/scripts/perf.mjs` measures the inputs its
performance score is built from, cold-cache, under Lighthouse's mobile emulation (4x CPU throttle,
slow-4G). Medians of three runs, `docs/perf/landing.json`:

| profile | FCP | LCP | TBT | CLS | critical weight | DOM |
|---|---|---|---|---|---|---|
| desktop 1440 | 148 ms | 308 ms | 0 ms | 0.0047 | 249 KB / 15 req | 469 |
| mobile 390 | 1828 ms | 2412 ms | 346 ms | 0 | 249 KB / 15 req | 469 |

Desktop sits inside every "good" band. Mobile does not: FCP and LCP are gated by the client-rendered
shell — 161 KB gz of JS has to arrive and execute before anything paints — and TBT is React mount
plus the deferred `BelowFold` chunk. The font preload took desktop CLS from 0.0466 to 0.0047 and
mobile from 0.0064 to 0; mobile blocking time measured anywhere between 228 ms and 367 ms across
runs, which is the spread of this harness on one machine rather than a regression. Nothing in the
allowed change set closes the remaining gap.

Two ways forward, both outside this phase's budget:

1. **Confirm the score before optimising further.** `npx lighthouse http://localhost:4173
   --preset=mobile --only=performance` needs a package that is not a repo dependency, so it is the
   user's call. The numbers above are the evidence; the 0-100 is not claimed anywhere.
2. **Prerender the hero into `index.html`.** A static shell (headline, subhead, CTA pills) outside
   `#root`, removed in `main.tsx` before `createRoot`, would move FCP/LCP to the HTML+CSS transfer
   (~22 KB) instead of the JS. It duplicates landing copy in two places, so it needs a decision
   about that drift before it is built.

## 2026-11-01 · landing — 768 px not re-shot this phase — **closed in Phase 7**

Phase 3's loop captured 1440 and 390 in both themes. The tablet breakpoint is on the Phase 7
whole-site checklist (360/412/768/1024/1440) rather than re-proved here.

Closed: Phase 7 shot 360, 390, 412, 768 and 1024 on every public route, both signed-in and guest, in
both themes. 768 found one real defect — the footer's four link columns sat in an `auto` grid track and
squeezed the event line to one word per row — now two columns until `lg:`. The two header/table
overflows it did *not* find were at 1024 and 360, described in `docs/iteration-log.md`.


## 2026-11-01 · challenges — `flagsSolved` does not mean what its name says

`backend/src/modules/challenges/challenges.service.ts:117` sets
`flagsSolved: challenge.solves.length` — the number of solve rows across **all** users — while
`solvedByMe` is per-user and `flagsTotal` is the flag count. On the seed data "Crackme Junior"
therefore reports `flagsSolved: 2` with `flagsTotal: 1`.

The board used to print that pair as `2/1 flags`, which reads as personal progress and is wrong
twice over. Phase 4 fixed the symptom in the frontend: the row now shows `flagsTotal` targets and
leaves personal state to the check icon, and the panel derives its progress from per-flag
`solvedByMe`, which is correct.

What is still missing is a real per-user flag count. A `flagsSolvedByMe` on the summary would let
the board show `1/2` for a partially solved multi-flag challenge without a detail fetch per row.
That is a response-shape change, so it is not in this branch.

## 2026-11-01 · challenges — the detail column wants data the API does not expose

A brief with no files and no hints ends about 400px short of the fold on a 1440x900 desktop
viewport, leaving a large blank field beside a full-height board. The obvious fillers — recent
solvers on this challenge, or who took first blood — are not in `ChallengeDetail`. Recorded rather
than papered over with static filler copy.

## 2026-11-01 · standings — no public solve feed for a team

`TeamDetail` fills its main column with the ranking window around the team, which is the only
standing data the API exposes publicly. What it could not show — and what the page would rather
have than whitespace on a tall viewport — is the roster's recent solves. `submissionsApi.mine` is
self-scoped (`/api/v1/submissions/mine`), so the same block on `/users/:id` only works when you are
looking at your own profile; for anyone else it renders nothing. A public
`GET /api/v1/teams/:id/solves` (or a `userId`/`teamId` filter on the existing public feed) would
close it. Not built: that is a route and response-shape change.

## 2026-11-01 · standings — `/scoreboard?scope=users` was outside the harness

`shoot.mjs` walked paths, not query strings, so the Players scope never appeared in a phase capture
even though it is a different component tree over the same data (no chart, `Players` labels, per-user
links). It was verified by hand this phase and then fixed: the scope is now a default target and
`slug()` folds a query into the filename (`scoreboard-scope-users-…`), so Phase 8 picks it up with
the rest of the sweep.

## 2026-11-01 · standings — `<Reveal>` sections are blank in a naive full-page capture

`.reveal` starts at `opacity: 0` and only clears when the IntersectionObserver fires, so a full-page
screenshot taken without scrolling shows the below-fold sections as empty bands. `shoot.mjs` is
immune — it pre-scrolls the document before the stitched capture (scripts/shoot.mjs:193) — but the
first browser-tool capture of the Players scope looked like a missing table for exactly this reason.
Worth knowing before anyone reads a blank screenshot as a bug; a `prefers-reduced-data` or
print-time override would make the class safe for capture tools in general.

## 2026-11-01 · whole site — the mobile tab bar lands mid-page in a stitched capture

Same family as the entry above, opposite cause: `--mode=full` takes a `fullPage` screenshot, and a
`position: fixed` element is painted at its viewport offset inside the stitched document. On every
sub-`md` route the bottom tab bar therefore appears floating across the middle of the shot, cutting
the list it overlays. Nothing is broken — `--mode=steps` shots, which are real viewports, show the bar
pinned to the bottom edge. Left alone because the fix is in the capture tool (clip per viewport), not
in the product.

## 2026-11-01 · admin — the two-step delete labels itself twice

In the card list the confirm button reads "Confirm delete"; in the table row it reads "Confirm". Same
handler, same `confirmId` state, two strings — which is also what makes an automated assertion on
`getByRole('button', { name: 'Confirm delete' })` width-dependent. One label would be better than
either: the row already says what is being acted on, so "Confirm" is arguably correct and the card's
longer label is the outlier. Not changed in Phase 8 because the audit was supposed to be measurement,
not a second polish pass.

## 2026-11-01 · design system — `/__kit` does not exist in production

The component gallery is `import.meta.env.DEV`-gated (`src/routes.tsx:44`), so the built bundle has no
page that shows the primitives, both themes and all five widths side by side. That is deliberate — it
is not a user-facing screen and it should not ship — but it means reviewers of a deployed build cannot
inspect the system, only its use. Serving it behind a flag, or exporting the kit as a static page at
build time, would close that without putting a dev route in front of players.
