# YourCTF redesign plan — “The Ledger”

Status: proposal for approval. No application code changes until this plan is approved.
Inputs: `docs/redesign-audit.md`, `docs/design-rules.md` (updated in Phase 1), `backend/API.md`,
`README.md`, and the source of every route.

## 1. Direction

**The board is the brand.** YourCTF should read like a live competition ledger: ruled rows,
oversized rank numerals, precise timestamps, hairline separators, compact mono metadata, and
generous editorial type where a human is being addressed. The structure supplies the drama — not
eyebrows, neon, decrypt effects or card grids.

Five principles:

1. **One accent, one job.** Violet marks the live signal and the primary action. Cyan marks
   solved/info. Amber marks cost/pending. Nothing is tinted for decoration.
2. **Structure over containers.** Prefer ruled lists, tables and split layouts to floating cards.
   A card must earn its border.
3. **Editorial hierarchy.** One focal statement per screen, clear `h1`→`h2`→`h3`, body measure
   65–75ch, display capped at 6rem, no eyebrow labels above headings.
4. **Data is the interface.** Rank, points, solves, costs and timestamps are set in tabular numerals
   with units. Charts ship with a table. Color is never the only signal.
5. **Motion confirms, never performs.** One authored moment per page; targeted
   `prefers-reduced-motion`; no global animation kill; no scroll-jacking.

Working title for the visual language: **Signal Ledger** — an event dossier crossed with a
scoreboard, not a SaaS dashboard.

## 2. Information architecture

### Site map

| Area | Routes | Notes |
|---|---|---|
| Public | `/` | Landing: event status, hero, score spine, disciplines, stats, CTA |
| Play | `/challenges`, `/challenges/:challengeId` | Board + deep-linkable challenge detail (new route) |
| Play | `/scoreboard`, `/teams`, `/teams/:id`, `/users/:id` | Scoreboard, team hub, team detail, profile |
| Account | `/login`, `/register`, `/forgot-password`, `/reset-password`, `/verify-email`, `/account` | Recovery routes arrive with Phase 8 |
| Organizer | `/admin`, `/admin/challenges`, `/admin/challenges/new`, `/admin/challenges/:id`, `/admin/categories`, `/admin/events`, `/admin/people`, `/admin/activity` | Overview + full-page editors; people and activity split (new) |
| Failure | `*`, route error boundary | Designed 404 and 500 |

Route behaviour changes:

- `/challenges/:challengeId` is added; the board becomes master-detail on ≥1024, a full page below
  that. The modal-only interaction is retired.
- `/admin` gains child routes; tab state moves from `?tab=` to the path. Old `?tab=` links redirect
  to the matching child route.
- Auth pages gain a split layout; no route changes.
- No existing public URL breaks.

### Global navigation

Desktop (≥768):

```
┌──────────────────────────────────────────────────────────────────────────────┐
│ >_ YourCTF   [● LIVE · ends 2 Nov 18:00 UTC]   Challenges  Scoreboard  Teams │
│                                              ⌘K Search   [team]  [avatar ▾]  │
├──────────────────────────────────────────────────────────────────────────────┤
```

- Brand links home. Event chip is data-driven: `LIVE`, `UPCOMING`, `ENDED`, or hidden if no event.
- Three primary links; active link gets `aria-current="page"` and a 2px accent underline.
- Command palette trigger shows `⌘K` on macOS and `Ctrl K` elsewhere; opening it is the only
  global search.
- Identity menu: public profile, account, team page, admin (if role ADMIN), sign out.
- Header height is fixed at 64px. No shrink-on-scroll (removes a layout animation and the 37px
  link targets).
- A "Organizer" link appears in the identity menu, not in the main nav.

Mobile (<768):

```
┌──────────────────────────────────┐
│ >_ YourCTF      [●] [⌘K] [avatar]│
├──────────────────────────────────┤
│                                  │
│              page                │
│                                  │
├──────────────────────────────────┤
│  Board    Scores    Teams    Me  │  fixed, safe-area inset
└──────────────────────────────────┘
```

- Bottom tab bar: Board, Scores, Teams, Me. 44px minimum, labels always visible, active tab marked
  by icon + label weight + accent indicator (not color alone). Safe-area padding.
- Hidden on auth, recovery, and challenge detail screens; those screens provide their own back
  affordance.
- The hamburger menu is removed.

Admin (≥1024):

```
┌────────────┬─────────────────────────────────────────────────────────┐
│ Organizer  │ Overview · event status · View site                     │
│ Overview   │                                                         │
│ Challenges │ page content                                             │
│ Categories │                                                         │
│ Events     │                                                         │
│ People     │                                                         │
│ Activity   │                                                         │
└────────────┴─────────────────────────────────────────────────────────┘
```

Below 1024 the rail becomes a horizontally scrollable tab strip with visible edge affordance and
44px targets, or a select-like section picker if the tabs exceed the width. No admin table may set
a minimum width wider than the viewport.

### Command palette

`Ctrl/⌘ K` opens a dialog with grouped results:

- **Go to** — Home, Challenges, Scoreboard, Teams, Account, Admin (if permitted).
- **Challenges** — client-side search over the loaded challenge list; selecting opens the detail.
- **Team** — view team, copy invite code (if member), manage team.
- **Organizer** — new challenge, categories, events, people, activity (admin only).
- **Session** — sign out.

Combobox semantics, `aria-activedescendant`, arrow/enter/escape, focus returns to the trigger.
No backend endpoint is added.

### Footer

Three original columns plus event line:

- **Play** — Challenges, Scoreboard, Teams.
- **Organizer** — Admin (only if signed in as admin), API contract, Design rules.
- **About** — How scoring works, Rules of engagement, Contact.
- Event line: name, state, dates in UTC, “All times UTC”.
- No fake social icons, no system-status endpoint, no invented legal pages. Links that have no
  destination are not shown.

## 3. Page-by-page text wireframes

### Landing `/`

```
[event chip: LIVE · 24 challenges · ends 2 Nov 18:00 UTC]

H1  Every flag moves the board.
    Two lines of body copy, 65ch max.

    [Browse challenges]   [View scoreboard]
    Built for teams · 18 teams · 240 solves          (quiet metadata)

    ┌ Score spine (right) ─────────────────┐
    │ 01  Null Route            4,820 pts  │
    │ 02  Kernel Panic          4,310 pts  │
    │ 03  Off-By-One            3,990 pts  │
    │ [Full board →]                       │
    └──────────────────────────────────────┘

────────────────────────────────────────────────────────────────────────
Disciplines                                     [All challenges →]
Web 12 · Pwn 9 · Crypto 8 · Reverse 7 · Forensics 6 · Misc 4
(ruled rows in 2–3 columns, counts right-aligned, no card grid)

Featured challenge (one SpotlightCard/TiltedCard, 7/5 split)
  [Web · Hard · 500 points]  Title
  One-sentence brief + solver count
  [Open challenge →]

────────────────────────────────────────────────────────────────────────
Numbers, not cards:
24 challenges · 6 disciplines · 18 teams · 40 solves
(count-up once on view; final value immediately under reduced motion)

How it works (3 numbered steps, no icons in boxes)
1 Read the brief. 2 Work the target. 3 Submit the flag.

────────────────────────────────────────────────────────────────────────
CTA band: "The board is open."  [Create account] [Sign in]
```

States: skeleton for event/spine/stats; per-section error with retry (“Could not load the board.
Retry”); no-event state (“No event is published yet. Browse the archive.” only if archive exists —
otherwise omit the section). No 110vh reserve. Below-fold content loads on idle/scroll without
reserving an empty screen.

### Login `/login`

```
┌───────────────────────────────┬──────────────────────────────────────┐
│ >_ YourCTF                    │ Sign in                              │
│                               │ Use the email on your account.       │
│ LIVE · 24 challenges          │                                      │
│ Ends 2 Nov, 18:00 UTC         │ Email                                │
│                               │ [                                  ] │
│ "One roster. One score."      │ Password                  [Show]     │
│  3 facts: teams share points, │ [                                  ] │
│  hints cost points, flags are │ [Sign in]                            │
│  hashed.                      │ Forgot password?                     │
│                               │ New here? Create an account.         │
└───────────────────────────────┴──────────────────────────────────────┘
```

States: field errors, form alert (invalid credentials, rate limit with retry time, unverified
email with resend), loading button, success redirect. No eyebrow. Password visibility control is
44px.

### Register `/register`

Same split. Fields: username (rules shown before submission), email, password with strength and
requirements, confirm password. On success: “Check your inbox” screen with resend and “Continue to
the board” if verification is not enforced. If mail is not configured in dev, the dev transport
link is shown in a clearly marked dev notice.

### Forgot / Reset / Verify (Phase 8)

- Forgot: email field; always generic success (“If that address has an account, a reset link is on
  its way.”) to avoid account enumeration.
- Reset: new password + confirm; expired/invalid token state with “Request a new link”.
- Verify: success state → sign in; invalid/expired → resend; signed-in banner on Account until
  verified when enforcement is enabled.

### Challenges `/challenges`

```
Challenges                             12 of 24 solved   [progress]
Read the brief, work the target, submit the flag.

┌ Filters (sticky, 280px) ─┐ ┌ Board ────────────────────────────────────┐
│ Search challenges        │ │ 12 results              [Sort ▾] [Grid|List]│
│ [All] [Unsolved] [Solved]│ │ ┌──────────┐ ┌──────────┐ ┌──────────┐   │
│ Category                 │ │ │ Web Hard │ │ Pwn Easy │ │ Crypto   │   │
│  All            24       │ │ │ Title    │ │ Title    │ │ Title    │   │
│  Web            12       │ │ │ 500 · 8  │ │ 100 · 21 │ │ 300 · 4  │   │
│  Pwn             9       │ │ └──────────┘ └──────────┘ └──────────┘   │
│  ...                     │ │ ...                                       │
│ Difficulty               │ │                                           │
│  [All] [Easy] [Medium]   │ │                                           │
│  [Hard] [Insane]         │ │                                           │
│ [Clear filters]          │ │                                           │
└──────────────────────────┘ └───────────────────────────────────────────┘
```

- Categories are a vertical ruled list with counts — no hidden horizontal scroller. On mobile the
  filters live in a sheet opened by “Filters (2)” and the result order stays visible.
- Search is debounced and written to the URL (`?q=`), so filtered views are shareable.
- Sort: default (featured/order), points, most solved, newest. Sort is applied client-side over the
  loaded list; no API change.
- Progress is `solved / total` with a small ring and text; no fabricated percentage if signed out.
- Card: category + difficulty on one line, title (h2), brief clamped to two lines, footer with
  points, solves, file/hint counts, solved stamp. One card may be featured on landing only; the
  board itself stays scannable.
- List view: ruled rows with title, category, difficulty, points, solves, solved state.

States: skeleton rows/cards; error with retry; empty board (“The organizer has not published
challenges yet.”); filtered empty (“No challenges match these filters. Clear filters.”); signed-out
variant hides status filters.

### Challenge detail `/challenges/:challengeId`

Desktop ≥1024: board stays visible on the left; detail is a right panel (480–560px) that can be
deep-linked and closed with “Back to board”. Below 1024: a full page.

```
← Board                             Web · Hard · 500 points
Title
12 teams solved · 2 hints · 1 file

Brief (65ch max, preserved line breaks)
This is the description the organizer wrote.

┌ Submit ──────────────────────────────────────────────┐
│ Flag  [YourCTF{...}                 ]  [Submit]      │
│ Not the flag. Check the format and try again.        │
│ Your team has 3 attempts left this minute.           │
└──────────────────────────────────────────────────────┘

Hints (2)
┌ Unlock · 25 points ──────────────────────────────────┐
│ Locked. 25 points will be deducted from your team.   │
│ [Unlock hint]                                        │
└──────────────────────────────────────────────────────┘
┌ Unlocked ────────────────────────────────────────────┐
│ Hint content...                                      │
└──────────────────────────────────────────────────────┘

Files
brief.pdf · 1.4 MB   [Download]
```

- Locked hint content is not present in the client payload (Phase 8 backend).
- Unlock states: confirmation with cost, in-flight, unlocked, already unlocked, insufficient points
  (with current team points and the gap). A successful unlock announces the new team score.
- Solved state: stamp + “Solved by your team” + timestamp; submission form replaced by a link to the
  scoreboard. Duplicate is explained plainly.
- On mobile, the submit block is sticky above the safe area within the page; no modal scroll trap.
- No solver list because the API does not expose it; solve count is shown.

### Scoreboard `/scoreboard`

```
Scoreboard                       ● updates every 15s   [Pause]
Team and player standings for the current event.

[Teams] [Players]

┌ #1 (wide) ──────────────┐  ┌ #2 ───────────┐  ┌ #3 ───────────┐
│ Null Route      4,820   │  │ Kernel Panic  │  │ Off-By-One    │
│ 18 solves · 5 members   │  │ 4,310        │  │ 3,990         │
└─────────────────────────┘  └──────────────┘  └───────────────┘

Your team · #7 · 1,240 points · 3 solves        [View team →]   (pinned)

┌ Points over time ────────────────────────────────[Chart|Table]┐
│ line patterns + end labels + legend with marker shapes        │
└───────────────────────────────────────────────────────────────┘

Rank   Team             Solves   Points    Last solve
01     Null Route       18       4,820     12:04:11
02     Kernel Panic     17       4,310     11:58:02
...
```

- Podium uses scale and position, not new hues; #1 alone gets the accent rule.
- “You are here” is a pinned row outside the table, not a background tint alone; it remains visible
  while scrolling.
- Table toggle exposes the same series as an accessible `<table>` with a summary sentence. Series
  also use dash patterns and end labels, so color is not the only key.
- Chart empty state names the first action (“Scores appear after the first solve.”), and a failed
  history request shows its own retry.
- Poll updates do not animate row order. Changed rows get a 600ms tint that respects reduced
  motion, and a polite live summary announces rank/points changes only, not every tick.
- Pause stops polling and says “Updates paused”.
- Updated timestamp is explicit: “Updated 10:32:05 UTC”.

### Teams `/teams`

```
Teams
Compete as a crew. One roster, one score.

┌ Your team ─────────────────────────────────────────────┐
│ Null Route                        #7 · 1,240 points    │
│ 5 of 6 members · Invite code 7K2Q9M        [Copy]      │
│ [Open team] [Manage]                                   │
└────────────────────────────────────────────────────────┘

No team yet:
┌ Create a team ─────────────┐  ┌ Join with a code ──────────┐
│ Name, description          │  │ Invite code                │
│ [Create team]              │  │ [Join team]                │
└────────────────────────────┘  └────────────────────────────┘

Top teams                                        [Full board →]
Rank  Team             Members   Points
01    Null Route       5         4,820
...
```

- Heading order fixed: `h1` → section `h2` → card titles `h3` only inside sections.
- Team fetch errors show “Could not load your team. Retry” instead of onboarding.
- Top teams failures show their own error, not an empty list.
- Onboarding explains team size, ownership and that invites are one code per team before the
  fields, not after a failed submit.

### Team detail `/teams/:id`

```
Null Route                                      [Manage team]
One-line description.
#7 on the board · 1,240 points · 5 members

Members
┌ Member        Role     Joined        ┐
│ alice         Owner   12 Oct 2026    │
│ bob           Member  13 Oct 2026    │
└──────────────────────────────────────┘

Team details
Created 12 Oct 2026 · Size cap 6 · Invite code visible to members
```

- Rank/points come from the existing scoreboard response for the team when it appears in the
  fetched range; otherwise show “Not in the current top 50” rather than inventing a value.
- No fabricated solve timeline: the API does not expose team solves. The page links to the
  scoreboard and the roster profiles.
- Error: network failure shows retry; only a real 404 shows “Team not found”.
- Ownership controls (remove member, transfer, regenerate code) arrive in Phase 8 and live in a
  “Manage” section here and on the team hub.

### Profile `/users/:id`

```
alice                                          [View team →]
Member since 12 Oct 2026 · Team Null Route

Bio (65ch)
...

Recent solves (self only)
Challenge             Category   Points   Solved
...
```

- Public profiles show identity, team and bio only — no invented stats.
- Self sees recent solves, with a designed empty state (“No solves yet. Open the board.”).
- 404 and network error are distinct; network error offers retry.

### Account `/account`

```
Account
Profile, security and team in one place.

[Profile] [Security] [Team]                 (tabs, URL-backed)

Profile
  Username        alice (read-only)
  Bio             [textarea, 4 rows]
  Avatar URL      [url]  [preview]
  [Save changes]

Security
  Email           alice@example.com   Verified | Unverified [Resend]
  Password        [Change password]  (Phase 8)
  Sessions        Sign out (current device)

Team
  Null Route · #7 · 1,240 points   [Open team] [Manage]
  or "You are not on a team." [Create or join →]
```

- Bio becomes a `Textarea`; avatar URL gets a preview and error state; email is shown only here.
- No “Hey, admin” title. No password section until the backend exists (Phase 8), so the tab appears
  with a clear available action, not a dead form.

### Admin overview `/admin`

```
Organizer                                        [View site]
Live · 24 challenges · 18 teams · 6 disciplines

┌ 24 published ┐ ┌ 18 teams ┐ ┌ 240 solves ┐ ┌ 12 hints used ┐
└──────────────┘ └──────────┘ └────────────┘ └───────────────┘

Quick actions
[New challenge] [Edit event] [Review activity]

Recent activity (AnimatedList, mount only)
12:04  alice solved "Cold Start" (Web) · +500
11:58  Null Route unlocked a hint on "Night Shift" · -25
...

Event
LIVE · 30 Oct 2026 09:00 UTC → 2 Nov 2026 18:00 UTC
Scoring: Static · Team cap: 6                    [Edit event]
```

- Stat cards are allowed only here because each is a distinct metric with an action, not a
  repeated marketing grid. Metrics come from existing endpoints; hint usage appears in Phase 8.
- No fabricated system-health widget. If boot-time configuration checks exist (Phase 8), surface
  them here.

### Admin challenges `/admin/challenges`

```
Challenges                         [New challenge]
[Search] [All] [Published] [Draft]   Sort: Order ▾
[x]  Title              Category  Difficulty  Points  Solves  Status    [Edit]
...
Bulk: [Publish] [Unpublish] selected (2)          Page 1 of 2
```

- Full-width responsive table ≥1024; below that, ruled cards with all fields and actions visible.
  No `min-w` wider than the viewport.
- Sort, status filter, search, pagination and bulk publish are client-side over the admin list
  unless the API already paginates. If server pagination is required, it is added to `API.md` in the
  same phase.
- No drag-only reorder: order is changed with up/down buttons and a numeric order field.

### Challenge editor `/admin/challenges/new` and `/:id`

Full page, not a modal. Sticky save bar with draft/published state and “Preview”.

```
New challenge                    Draft       [Preview] [Save draft] [Publish]
[1 Basics] [2 Content] [3 Flags] [4 Hints & files] [5 Review]

Basics
  Title, category, difficulty, points, order, event

Content
  Description (textarea, markdown-free, preserved lines)
  Live preview rendered with the public challenge component

Flags
  Add flag [password-style input] [Add]
  Stored as salted hashes. Values cannot be retrieved after saving.
  List: "flag 1 · added 30 Oct" [Remove]

Hints & files
  Hint content + cost + add; file upload (Phase 9) or external URL
  Warnings: unlocking deducts team points; locked content is never sent to players.

Review
  Public preview, validation summary, publish checklist
```

- Stepper is advisory, not a wizard gate: every step is reachable and saveable; validation runs on
  save. No nested 85vh scroll.
- Unsaved-changes guard on navigation.
- Flag values are write-only; edit shows only “replace flag”, never a value or hash.

### Admin categories `/admin/categories`

Ruled table: order, color swatch + name, slug, challenge count, actions. Add/edit inline or in a
drawer. Reorder with up/down. Delete is guarded and explains which challenges block it. Color input
shows hex + swatch; default uses the accent token, not a hard-coded hex.

### Admin events `/admin/events`

Event cards with state, full dates (year + timezone), team cap, scoring mode (Phase 9), publish
state. Edit in a full-page or drawer form with timezone labeled on both start and end. Publish and
unpublish state the consequence. A countdown is shown only for a live/upcoming event and uses the
server timestamps.

### Admin people `/admin/people` and activity `/admin/activity`

- People: semantic tabs Users | Teams; search; sort by joined/name/role; pagination; responsive
  cards below 1024.
- Activity: submissions audit with search, correctness filter, user/team and challenge, pagination.
  Never shows a submitted flag value (the API does not return it), only outcome and time. Incorrect
  attempts show “incorrect attempt” with no value.
- Empty, loading, error and filtered-empty states for each tab.

### 404 and route failure

```
404 — no such signal
That page is not on the board. It may have moved or never existed.
[Back to challenges] [Scoreboard] [Home]
If you followed a link from inside YourCTF, that link is broken.
```

Error boundary: designed screen with “This screen failed to render”, retry (re-mount), reload, home;
technical detail only in development. No eyebrow, no flag-brace decoration.

## 4. Component inventory

### Retained and refined

| Component | Change |
|---|---|
| `Button` | Focus ring restored; md/lg ≥44px; sm ≥36px with a 44px hit area; loading keeps width stable; danger confirm semantics. |
| `Input`, `Textarea`, `Select` | Visible 2px focus ring with offset; Select gets a chevron; error/hint wiring kept; password variant; input `autoComplete` set per form. |
| `Segmented` | Becomes a radio-group for filters and a proper `Tabs` primitive for navigation; 44px targets; roving tabindex. |
| `Modal` | Kept for confirmations and palette; initial focus goes to the dialog title or first field, not the container; close target ≥44px. |
| `Toast` | Dismiss target ≥44px; no auto-dismiss while focused/hovered; verifies `role=status`; max 3 visible. |
| `Card`, `CardTitle` | Heading level is caller-controlled (`as`), default `h3` only inside a section; no card in marketing grids. |
| `Badge` | Always text + tone; never color-only; new `cost` and `live` variants. |
| `Avatar` | Optional link semantics externally; image fallback kept. |
| `Skeleton` | Pulse disabled under reduced motion; fixed aspect to prevent CLS. |
| `PageShell` | Replaced by `PageHeader` + shell (no title-only template); breadcrumbs/meta/actions. |

### New primitives

- `AppShell`, `DesktopNav`, `MobileTabBar`, `AdminRail`, `Footer` — one navigation model.
- `CommandPalette` — combobox, grouped actions, focus return.
- `EventStatus` — state chip + dates + countdown; one source of truth.
- `PageHeader`, `SectionHeader` — title, description, actions, optional breadcrumb; no eyebrow.
- `Stat`, `StatRow` — label/value/unit with tabular numerals.
- `DataTable` — sortable headers, selection, sticky header, priority columns, card mode <768,
  loading/empty/error slots.
- `Tabs` — `role=tablist` with arrow keys and URL-backed selection.
- `Drawer` — mobile filters, admin secondary editors; focus trap, escape, restore.
- `ProgressRing` and `ProgressBar` — solved counts, no color-only meaning.
- `EmptyState`, `ErrorState` — action-oriented copy, retry callback, optional detail.
- `PasswordInput` — show/hide with 44px control.
- `CopyButton` — invite code copy, `aria-live` confirmation, 44px.
- `ConfirmDialog` — destructive actions, names the object and consequence.
- `ChallengePanel` — shared public detail content for route and admin preview.
- `HintCard` — locked/unlocked/cost/insufficient states.
- `Podium`, `RankRow` — scoreboard composition.
- `ChartWithTable` — patterned SVG series + data table toggle + summary.
- `Time` — `<time dateTime>` with year + timezone formatting.
- `Icon` set — original inline SVGs, one stroke set, 20/24px, `aria-hidden` unless labeled.
- `ScrollToTop`, `RouteErrorBoundary`, `SkipLink` — shell reliability.

### React Bits placement

Installed via shadcn into `frontend/src/components/reactbits/` (registry is already configured in
`components.json`). If the generator writes to `src/components/`, move the file and fix imports so
the folder contract holds. Delete demo assets and adapt classes to our tokens.

| Component | Where | Rules |
|---|---|---|
| `Aurora` (existing) | Landing hero background only | Heavy WebGL; lazy-loaded; static gradient under reduced motion; disabled on coarse pointers; DPR capped; paused offscreen. This is the only heavy effect on the page. |
| `SpotlightCard` (existing) | Landing featured challenge/event | One instance, not a grid; spotlight only on fine pointers; content legible without the effect. |
| `Magnet` (existing) | Landing primary CTA only | Fine pointers only; max offset small; removed under reduced motion. No magnet on secondary buttons. |
| `CountUp` (existing) | Landing stats and podium | Starts when visible; renders the final value immediately under reduced motion; never shows 0 while offscreen. |
| `AnimatedContent` (existing) | At most one authored reveal per page | Remove the repeated section entrance; keep for the palette/drawer content if useful. |
| `TiltedCard` (new) | Landing featured challenge only | CSS 3D tilt on fine pointers; static card under reduced motion/coarse; no tilt on touch. |
| `AnimatedList` (new) | Admin overview recent activity | Mount-only; no looping; items are real activity rows; reduced-motion fallback is a plain list. |
| `Stepper` (new) | Admin challenge editor section nav | Navigation, not gating; keyboard accessible; not animated beyond state color. |
| `DecryptedText` (existing) | Remove from hero | A decrypt gimmick conflicts with the ledger direction; delete if unused. |

Install commands (Phase 2, run from `frontend/`; verify output paths before committing):

```bash
npx shadcn@latest add @react-bits/TiltedCard-TS-TW
npx shadcn@latest add @react-bits/AnimatedList-TS-TW
npx shadcn@latest add @react-bits/Stepper-TS-TW
```

Not used: Dock, MagicBento, GlitchText, StarBorder, Ribbons, GridMotion, ClickSpark, Noise,
BorderGlow, ScrambledText, ShinyText. Restraint is the point.

### Tokens and type

- Keep the OKLCH roles. Add only: `--data-1..5` line patterns (stroke/dash, not new hues), a
  `--hairline-strong` step for table headers, and a `--surface-raised` step if the ledger needs one.
- Type scale: display clamps to 6rem; h1 2.25–3rem; body 16px/1.6; small 14px; label 12px used
  rarely and never as an eyebrow. Mono only for flags, code, ranks, points, timestamps.
- Prose measure 65–75ch; display tracking floor `-0.04em`; `text-wrap: balance` on headings and
  `pretty` on prose.
- Tabular numerals everywhere numbers align.
- Browser surfaces themed: selection, caret, scrollbar, focus ring, form controls.

## 5. Motion plan

### Rules

1. One authored motion moment per page; everything else is state feedback.
2. No repeated identical section entrance. If a section is not the focal moment, it is static.
3. Animate `transform`, `opacity`, `filter`, `clip-path`, `mask`; never width/height/top/left.
4. Exits are faster than entrances; no bounce/elastic.
5. Reduced motion is targeted per effect: remove spatial movement and loops, keep opacity/color
   state feedback at ≤120ms. No global `0.01ms` rule.
6. Live data does not animate layout; it highlights change.
7. Heavy effects: at most one per page, lazy, paused offscreen, disabled under reduced motion and
   coarse pointers.

### Moments

| Surface | Trigger | Motion | Duration | Reduced motion |
|---|---|---|---|---|
| Landing hero | mount | Aurora idle drift behind static type | continuous, paused offscreen | static gradient |
| Landing stats | first in view | CountUp to final | 700ms, once | final value immediately |
| Landing score spine | first in view | rows fade/translate 8px, stagger 50ms | 450ms total cap | fade only |
| Landing featured card | fine pointer hover | TiltedCard 3–5° | 200ms | static |
| Palette | open/close | opacity + scale 0.98→1 / reverse | 150 / 100ms | fade |
| Challenge panel | open/close | opacity + translate 16px / reverse | 200 / 150ms | fade |
| Wrong flag | submit | 2px horizontal shake, once | 250ms | no shake; feedback text + border |
| Correct flag | submit | stamp scale 0.96→1 + opacity | 250ms, once | fade only |
| Hint unlock | success | cost line updates, no confetti | 150ms color | same |
| Scoreboard update | poll | changed row tint fades | 600ms | instant tint, same duration |
| Chart | first in view | path draw once | 600ms | final path |
| Admin activity | mount | AnimatedList stagger | 300ms cap | plain list |
| Row removal | delete | layout collapse via FLIP | 200ms | instant |

### Implementation

- Motion `useReducedMotion()` for JS-driven effects; CSS keyframes wrapped in
  `@media (prefers-reduced-motion: no-preference)` or scoped classes.
- Replace the global reduced-motion block with: no smooth scroll, no decorative loops, no transform
  animations; opacity/color transitions remain.
- Do not animate the header height. Do not animate table row order.
- CountUp must initialize to the final value and only animate from 0 when it is visible at mount,
  so screenshots, prints and offscreen mounts never show zeros.
- Respect `document.visibilityState` for polling-heavy surfaces and Aurora.

## 6. Responsive and accessibility plan

### Breakpoints

| Width | Navigation | Layout |
|---|---|---|
| 360–767 | Header + bottom tabs; filters in a sheet; challenge full page | 1 column; tables become cards; no horizontal page scroll |
| 768–1023 | Header with links + palette | 2-column challenge cards; admin tabs, no rail |
| 1024–1439 | Header + palette; admin rail | Master-detail challenges; 3-column board; data tables |
| ≥1440 | Same | Max container 1200px; hero 7/5 split; no stretched line lengths |

Rules: no `min-width` wider than the viewport; any unavoidable local scroller gets visible edge
fades + keyboard access; sticky elements account for header height and safe-area insets; test
360/390/412/768/1024/1440.

### Accessibility acceptance criteria

- Visible 2px accent focus ring with 2px offset on **every** interactive element, including inputs
  (remove `focus:outline-none` unless a ring replaces it).
- Targets: 44×44 for public/touch controls, 24×24 hard minimum for dense desktop controls, with a
  44px hit area via pseudo-element when the visual control is smaller.
- Heading order: exactly one `h1`; sections `h2`; cards `h3`; no styled paragraph used as a heading.
- Landmarks: banner, nav (labeled), main, contentinfo; skip link first in tab order.
- Navigation uses `aria-current`; tabs use `role=tablist/tab/tabpanel` with arrow keys; drawers and
  palette trap focus and restore it.
- Chart: table toggle, summary sentence, dash patterns, end labels; decorative SVG `aria-hidden`.
- Badges and status never rely on color alone (icon or text).
- Live updates: polite live region for meaningful changes only; pause control.
- Forms: persistent labels, requirements before submit, errors name problem + recovery, no
  placeholder-only labels, correct `autocomplete`.
- Reduced motion honored per effect; no global kill.
- Contrast: body 4.5:1, large text 3:1, controls/focus 3:1; verify tokens after any change.
- Keyboard map: skip link → header → main; `⌘K`; `/` focuses challenge search (optional); Escape
  closes overlays; arrow keys in tabs/palette; no hover-only actions.

### Testing

- Manual keyboard-only pass for landing, board, detail, submit, scoreboard, teams, account, admin
  create/edit.
- Reduced-motion pass at each viewport.
- Screen-reader spot check (NVDA or VoiceOver) for board, detail, palette, scoreboard chart.
- Lighthouse mobile/desktop after Phases 4, 7, 10.
- No new test dependency: use backend Vitest/Supertest plus TypeScript builds, manual and Lighthouse
  for the frontend.

## 7. States and copy

### State matrix

| Surface | Loading | Empty | Error | Partial |
|---|---|---|---|---|
| Landing | skeleton spine/stats | no event / no scores copy | section error + retry | missing chart data |
| Board | skeleton cards | organizer has not published | retry | filtered-empty + clear |
| Detail | skeleton panel | n/a | 404 vs network retry | locked hint, no files |
| Submit | button loading | n/a | wrong / duplicate / rate-limit / ended | attempt budget |
| Scoreboard | skeleton table | no solves yet | board retry; history retry | paused updates; stale tag |
| Teams | skeleton | onboarding | team fetch error ≠ onboarding | top list error |
| Team detail | skeleton | n/a | 404 vs network retry | not in top 50 |
| Profile | skeleton | no solves (self) | 404 vs network retry | private fields |
| Account | skeleton | n/a | retry | unverified email |
| Admin tables | skeleton | create-first CTA | retry | filtered-empty |
| Forms | saving | n/a | field + form error | unsaved guard |
| Auth | button loading | n/a | invalid / rate-limit / unverified / expired token | dev mail notice |
| 404 / boundary | n/a | n/a | designed recovery | dev details only |

Every error states what failed, why when known, and the recovery action. 404 and network failure are
never conflated.

### Copy rules

- Remove every eyebrow above a heading and every `YourCTF{...}` decoration. Flag syntax appears
  only where a flag is the subject (input placeholder, docs).
- Voice: direct, calm, technical; second person; sentence case; no exclamation marks.
- One vocabulary: challenge, flag, solve, team, score, points, hint, event.
- Dates: full date, year and timezone (`2 Nov 2026, 18:00 UTC`); admin forms label the timezone.
- Actions name the result: “Create team”, “Submit flag”, “Unlock hint · 25 points”, “Publish
  challenge”, “Copy invite code”.
- Replace “People & activity” with People and Activity as separate destinations. Replace “Seats”
  and “Team size cap” with one term: “Team size limit”. Replace “Hey, admin” with “Account”.
- Empty states name the next action; no dead ends.
- Errors: “Not the flag. Check the format and try again.” / “Your team already solved this
  challenge.” / “Too many attempts. Try again in 60 seconds.” / “This challenge is not available.”
- Never show a flag value, hash, salt, token or reset link in the UI outside the dev mail notice.

## 8. Backend gap plan

All new capabilities cross HTTP and update `backend/API.md` in the same change. The answer-key
invariant and the submission contract are unchanged.

### Phase 8 — team, hints, recovery, hygiene

**Schema**

- `HintUnlock { id, hintId, teamId, userId, cost, createdAt }`, unique `(hintId, teamId)`.
  Team score = solve points − unlocked hint costs. No score is edited in place.
- `VerificationToken { id, userId, kind: RESET | VERIFY, tokenHash, expiresAt, usedAt }`.
  Tokens are random, stored hashed, single-use, expiring.
- `User.emailVerifiedAt` and `User.sessionVersion` (invalidates JWTs after password reset or
  sign-out-all).
- Optional `Team.inviteCodeRotatedAt`.

**API**

| Method | Path | Auth | Behaviour |
|---|---|---|---|
| POST | `/challenges/:id/hints/:hintId/unlock` | user + team | Idempotent; deducts cost once; 409 `INSUFFICIENT_POINTS` with current points; returns hint content + team points. Locked hint content is omitted from challenge payloads. |
| DELETE | `/teams/me/members/:userId` | owner | Removes a non-owner member; 400 removing owner/self; 404 non-member. |
| POST | `/teams/me/transfer` | owner | `{userId}`; target must be a member; owner becomes member; returns team. |
| POST | `/teams/me/invite-code` | owner | Rotates code; old code stops working; returns new code. |
| POST | `/auth/forgot-password` | – | Always generic 200; rate-limited; sends via `MailTransport`. |
| POST | `/auth/reset-password` | – | `{token, password}`; validates, updates hash, increments `sessionVersion`, marks token used. |
| POST | `/auth/resend-verification` | user | Rate-limited; sends a new verification token. |
| GET/POST | `/auth/verify-email` | – | Single-use token; sets `emailVerifiedAt`; invalid/expired state. |

- `MailTransport` interface with a console/dev adapter and an SMTP/env adapter boundary; no new
  package unless approved. In production, a missing transport refuses to boot.
- Boot refusal: reject default `JWT_SECRET`, default bootstrap admin password, missing cookie/
  database configuration, and production config with dev-only settings. Clear log, non-zero exit;
  tests cover the validator.
- Enforce email verification only when `REQUIRE_EMAIL_VERIFICATION=true`; otherwise show status
  and let users play.
- Tests: hint content never leaks while locked; deduction/idempotency/insufficient; member remove/
  transfer/rotate permissions; token expiry/single use/session invalidation; generic forgot
  response; boot validator.

**Frontend**

- Hint card with unlock confirmation, deduction, insufficient state; challenge payload type change.
- Team manage section (remove/transfer/regenerate) with confirmations.
- Account security tab; forgot/reset/verify routes; verification banner.
- All new states in the state matrix.

### Phase 9 — scoring, files, Postgres, config, session, demo data

- **Dynamic scoring**: event-level `scoringMode` (`STATIC` default, `DYNAMIC`), stored
  `pointsAwarded` per submission at solve time. `scoreFor()` is used at submission time and in the
  admin preview; scoreboard sums awarded points minus hint costs. Admin event form exposes mode and
  the decay inputs; tests cover first-blood value, monotonicity, and static events unchanged.
- **File upload/hosting**: `FileAsset` table; admin raw binary upload with filename/content-type
  headers and a size cap; allowlist MIME types; random stored names; path traversal safe; public
  download with `Content-Disposition`; challenge file references can point to an asset or an
  external URL. No dependency added: use Express raw body, not multipart. Tests for size, type,
  auth, traversal, download headers.
- **PostgreSQL**: `docker-compose.yml` for Postgres, Prisma provider switched to `postgresql`, new
  migrations, `.env.example` and README updated, test suite runs against the container
  (`npm run db:up` + `npm test`). SQLite is retired as the dev target in this phase. This is a
  deliberate setup change; see approval decisions.
- **Hashing/truncation config**: `FLAG_HASH_ALGORITHM=sha256|sha512` stored per flag with the hash
  (`algo` column); verification uses the stored algorithm; constant-time compare. Wrong attempts
  store a per-attempt salted hash + length, never a plaintext value; an optional
  `WRONG_ATTEMPT_DISPLAY_PREFIX` (default off) controls any truncated display. Tests cover mixed
  algorithms and the no-plaintext guarantee.
- **Session**: `GET /auth/session` always 200 `{user}` or `{user:null}`; frontend bootstraps once,
  removes the localStorage gate and hint. Tests for signed-in, signed-out and expired cookie.
- **Dev data**: `npm run reset:dev` guarded against production; `npm run seed -- --demo` creates
  original demo users/teams/solves/hint unlocks/activity so every screen has content. Demo
  credentials live only in README/dev docs. No plaintext flags in API responses, ever.
- **API.md** updated for every item; all existing tests stay green.

## 9. Phase map and exit criteria

Every phase starts with an exact create/edit/delete manifest before code, ends with
`cd backend && npm test && npm run build` and `cd frontend && npm run typecheck && npm run build`,
and reports “Phase N done” before waiting for “continue”.

| Phase | Deliverable | Main files (indicative) | Exit criteria |
|---|---|---|---|
| 2 | Design system + `/__kit` | `styles/tokens.css`, `styles/globals.css`, `tailwind.config.ts`, `components/ui/*`, new shell primitives, `pages/Kit.tsx`, `routes.tsx` (dev-only route), `reactbits/*`, `lib/format.ts`, `lib/icons.tsx` | Kit shows type, color, targets, focus, states, tables at 6 widths; no global motion kill; builds; Lighthouse unaffected |
| 3 | Shell, navigation, palette, errors | `RootLayout`, `Navbar`/`DesktopNav`, `MobileTabBar`, `AdminRail`, `Footer`, `CommandPalette`, `ErrorBoundary`, `ScrollToTop`, `NotFound`, `routes.tsx`, `PageHeader` | Keyboard + mobile nav pass; 404/500 designed; scroll restoration; no horizontal overflow |
| 4 | Landing redesign | `features/landing/*`, `pages/LandingPage.tsx`, `features/challenges/FeaturedChallenge.tsx`, `EventStatus`, remove unused `DecryptedText` | One heavy effect; no eyebrows; no 110vh; Lighthouse ≥90 mobile / 100 desktop |
| 5 | Challenges UX | `pages/Challenges.tsx`, `features/challenges/*`, `routes.tsx`, `ChallengePanel`, `Drawer`, `Tabs` | Deep link works; filters/sort/search in URL; mobile sheet; states; a11y |
| 6 | Scoreboard, teams, profiles, account | `pages/Scoreboard.tsx`, `features/scoreboard/*`, `pages/Teams.tsx`, `TeamDetail.tsx`, `Profile.tsx`, `Account.tsx`, `features/teams/*`, `features/profile/*` | Podium, pinned row, chart table; team/profile states; heading order; manage hooks ready |
| 7 | Admin redesign | `pages/Admin.tsx`, `features/admin/*`, admin routes, `pages/AdminOverview.tsx`, `Activity.tsx` | No table wider than viewport; full-page editor + stepper + preview; overview; bulk/sort; dates with timezone |
| 8 | Backend gaps 1 | Prisma schema/migrations, hint/team/auth routes + services, mail transport, boot validator, tests, `API.md`, frontend hint/team/security/recovery screens | All new tests pass; locked hint content never returned; recovery flows work; UI states complete |
| 9 | Backend gaps 2 | Prisma schema/migrations, scoring, files, config, session, compose, reset/demo seed, tests, `API.md`, frontend wiring | Dynamic scoring correct; uploads safe; PG tests pass; `/auth/session` always 200; demo seed populates every screen |
| 10 | Polish pass | Impeccable critique/audit/polish across all pages, no new features | 360/412/768/1024/1440, keyboard, reduced motion, states, copy, Lighthouse re-run, no P0/P1 |
| 11 | Final QA + docs | `README.md`, `docs/*`, new `YourCTF-Handoff.md`, full verification | All four commands green, Lighthouse targets, audit /20 improved, no known P1 |

## 10. Explicit non-goals

- No new product features outside Phases 8–9 (no forums, writeups, notifications, real-time SSE,
  bracket views, or public team directory).
- No fabricated statistics on team/profile pages; only API data is shown.
- No new npm packages beyond the three React Bits components and the tools already in the project.
  Postgres uses Docker Compose; uploads use Express raw bodies.
- No light theme.
- No markdown dependency; descriptions stay preserved plain text unless a dependency is approved.
- No changes to flag storage semantics that weaken the answer-key invariant.
- No SoterCTF assets, copy, colors or layout copies.

## 11. Decisions requested with approval

1. **Challenge detail becomes `/challenges/:id`** with desktop master-detail, replacing the modal.
2. **Admin becomes an overview + child routes**, and the challenge editor becomes a full page with
   a stepper, replacing the modal.
3. **Mobile uses a 4-tab bottom bar and a command palette**, replacing the hamburger menu.
4. **Uploads are implemented with raw binary bodies + local storage** (no multipart dependency).
5. **Phase 9 switches Prisma to PostgreSQL** as the single provider, with Docker Compose required
   for dev/tests.
6. **Dynamic scoring is stored at solve time** and configured per event; default remains static so
   existing events do not change.

Approve `docs/redesign-plan.md` to begin Phase 2. Until then, no application code will be written.
