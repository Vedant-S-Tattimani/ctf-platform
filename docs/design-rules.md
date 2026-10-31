# Design rules for YourCTF

Distilled from the Impeccable reference (`../impeccable-ref/skill/reference/`: `typeset.md`,
`colorize.md`, `layout.md`, `animate.md`, `adapt.md`, `clarify.md`) and applied to this product.
Every rule below is binding for the redesign and all future work. Where an older line conflicts
with a later, more specific rule (for example the Impeccable craft floor), the more specific rule
wins. Source: design research, not taste.

## Amendment 2026-11-01 — the world turns light

The re-skin in [antigravity-redesign-plan.md](antigravity-redesign-plan.md) supersedes **World**,
the surface half of **Color**, the **Shape** radii and the **Motion** hero rule. What follows is
the current contract; every other section of this file still binds.

- **World** — light and airy is the default; dark is a first-class `[data-theme="dark"]` override,
  not an afterthought. Near-white canvas, ink text, generous section bands. Compose both worlds
  explicitly; never ship a mechanically inverted theme.
- **Color** — roles keep their names (`bg-canvas`, `text-primary`, `border-hairline`), values flip.
  One accent is now too thin: violet stays the action colour, with blue, mint and coral allowed as
  *sparse* tints for chips, icon fills and the hero particle field. Still no heavy flat colour
  blocks, and still AA in both themes.
- **Shape** — radii grow to 8 / 14 / 24 / 36 with pills for actions; elevation is diffuse and
  low-alpha (`--shadow-soft` / `--shadow-card` / `--shadow-float`), replacing glow-on-dark.
  Hairline borders stay 1px and stay the primary separator.
- **Type** — one open geometric family (Outfit) plus a mono. Display sizes go up and weights come
  *down*: 480 medium at hero scale with tight tracking, never 700. The 65–75ch measure, the 16px
  body floor and the "adjacent roles differ in size and weight" rule are unchanged.
- **Motion** — still one authored moment per page, still transform/opacity only, still reduced-motion
  safe. That moment is now a cursor-reactive particle field on the landing hero instead of the
  violet aurora. Scroll reveals, staggered children and hide-on-scroll chrome are added, not
  scroll-jacking.
- **Anti-goals** — all still binding, plus: do not copy Google's logo, product copy, imagery,
  iconography or the proprietary Google Sans font. Matching a design *language* is the brief;
  lifting assets is not.

## World

Dark, premium, hacker-meets-editorial. Single accent (electric violet) used with restraint;
rarity gives the accent force. Surfaces are composed for dark mode explicitly — never a
mechanically inverted light theme. Reference feel: a competition ledger — navy-ink canvas, violet
signal accent, hairline rules, explicit surface steps — interpreted with our own tokens and type.

## Color (OKLCH, roles not swatches)

- Primitives and semantic tokens live in `src/styles/tokens.css`; Tailwind maps to the vars.
- Roles defined: canvas, elevated surface, primary/secondary/muted text, action, focus,
  selection, border, success, warning, danger, info. No orphan hex values in components.
- One accent owns the primary action and the focal region; it is not spent on decoration.
- Secondary (electric cyan) is reserved for info/solved states; semantic hues stay consistent.
- Dark-mode elevation is explicit: each surface step is its own OKLCH value, not alpha stacks
  (alpha makes contrast context-dependent).
- OKLCH ramps reduce chroma near white and black; no high-chroma extremes.
- Contrast floors (verified, not eyeballed): body text 4.5:1, large text 3:1, controls/icons/
  focus rings 3:1 (WCAG AA). Color is never the only carrier of meaning — pair with icon,
  label, shape or position (e.g. solved = check icon + tint, not tint alone).

## Typography

- Three families with strict roles: display (Space Grotesk) for headings/hero, body (Inter)
  for prose and UI, mono (JetBrains Mono) for flags, code, connection strings, numerals.
  A fourth family is not allowed without a role only it can fill.
- Body floor 16px/1.6. Prose measure 65–75ch; 45ch is a hard floor for narrow panels only,
  never a target for marketing prose. Never exceed 75ch.
- Deliberate role scale in tokens (display / h1 / h2 / h3 / body / small / label / mono);
  adjacent roles differ enough in size *and* weight to be told apart at a glance.
- Display type caps at 6rem. No 8rem hero type, no viewport-width type without a clamp.
- Headings: tight negative tracking, no tighter than `-0.04em`; `text-wrap: balance`.
  Body: `text-wrap: pretty`.
- No eyebrows above headings: no all-caps kicker, no `// label`, no flag-brace label, no index
  number floating above a title. The heading carries its own hierarchy.
- Mono is for data and code — flags, ranks, points, timestamps, identifiers. It is not a costume
  for labels, navigation or decoration.
- Label style is 12px uppercase at most three words; never used as a decorative section marker.
- Light-on-dark compensation: +1 step line-height, a touch more tracking, one weight step up
  where the face needs it.
- Tabular/mono numerals for points, ranks, timers and counts.
- Load only used weights (variable fonts); metric-compatible fallbacks; no invisible text.

## Space & shape

- 4-unit base spacing scale in tokens (4/8/12/16/24/32/48/64/96/128). No one-off values.
- Rhythm by contrast: tight inside groups, generous between sections (96–128px bands).
- Group by proximity first; containers/borders only when proximity is not enough.
- Radius roles: sm 8px (controls), md 12px (cards/inputs), lg 16px (panels), pill (badges).
- Hairline borders + an explicit surface step carry elevation. No heavy drop shadows, no hard
  offset shadows, and no zero-offset outer glow/halo as decoration. A single accent glow may mark
  focus or the active primary action; it may not sit behind cards as ambient mood.
- Backdrop blur is reserved for overlays that sit above moving content (header, palette, drawer,
  modal) and must keep a solid fallback. Glass on cards is decoration and is banned.
- No side-stripe borders (thick left/right colored bars on alerts, cards or list rows). Use a
  surface step, an icon and text instead.
- Cards are containment, not rhythm. Do not build a section as a grid of identical
  icon + heading + paragraph cards. Prefer ruled rows, tables and asymmetric composition; a card
  must earn its border.
- No gradient text (background-clip text). No stripe, grid, dot or noise background unless it is
  the subject of the composition.
- `gap` for sibling rhythm; container max-width 1200px; mobile-first single column.

## Motion

- Durations: 100–150ms immediate feedback, 150–300ms routine state change, 300–500ms overlays/
  view transitions, 500–800ms only for the one authored focal moment (hero).
- Easing: decelerate `cubic-bezier(0.16, 1, 0.3, 1)`. Exits faster than entrances. No bounce/
  elastic by reflex.
- Animate transform/opacity/filter/clip/mask; never layout-driving properties. FLIP for reorders.
- One authored motion moment per page. It is the only entrance the page needs; everything else is
  state feedback. No identical fade+rise entrance on every section.
- If a list animates, it staggers once with a capped total delay; live data updates highlight
  change instead of animating layout.
- Content visible by default — a failed script must not hide the page. Never reserve a blank
  viewport while deferring content.
- Exits are faster than entrances. No scroll-jacking, no parallax by default, no bounce/elastic.
- `prefers-reduced-motion` is handled per effect: remove spatial movement, loops, tilt, count-ups
  and draw-on motion; keep opacity/color/state feedback at ≤120ms. **Never** solve reduced motion
  with a global `animation-duration: 0.01ms` kill.
- At most one heavy WebGL/canvas effect per page, lazy-loaded, paused offscreen, and disabled
  (static fallback) under reduced motion and coarse pointers.

## Interaction & responsiveness

- Mobile-first base styles; `min-width` layering; content-driven breakpoints (640/768/1024).
- Detect input, not size: hover effects behind `@media (hover: hover)`; touch targets ≥44px;
  24×24 is the hard minimum for dense desktop controls, with a 44px hit area when the visual
  control is smaller. No functionality that depends on hover.
- Focus-visible ring on every interactive element (accent, 2px, 2px offset) — keyboard order must
  match visual order. Inputs are not exempt: a border-color change alone is not a focus ring.
- No content hidden in a horizontal scroller without a visible affordance (edge fade, arrow or
  count) and keyboard access. No table may set a minimum width wider than the viewport; adapt the
  table into rows/cards instead.
- Safe-area insets respected; `viewport-fit=cover`.
- Empty/loading/error/success states are designed, not defaulted: skeletons instead of blank
  flashes, empty states name the next useful action. 404 and network failure are never conflated.
- Theme the browser surfaces: `::selection`, caret color, scrollbar, focus ring, autofill, and
  tabular numerals. No default light form controls in the dark world.

## UX writing

- Specific verb + object on actions ("Join competition", not "Submit"). Same noun/verb for the
  same concept everywhere (challenge, flag, solve, team).
- Errors answer: what failed, why (when known), how to recover. No internal codes as the
  primary message; no blame.
- Persistent labels; placeholders are examples only. Requirements before submission.
- Empty states distinguish first-run / no-results / filtered / permission-gated.
- Routine success is brief; success confirms outcome, not the gesture.
- Complete translatable sentences; no concatenated fragments; allow expansion.
- Dates state year and timezone; durations state their unit. Admin forms label the timezone.
- No fabricated data, scores, counts, testimonials, logos or status. If the API does not expose it,
  the interface does not show it.
- Flag syntax (`YourCTF{...}`) is functional, not decorative: it appears only where a flag is the
  actual subject. Never use it as a section label, eyebrow or 404 motif.

## Anti-goals (what this must never look like)

- Generic AI/SaaS template: default blue/purple gradients, gradient text, uniform 3-card grids,
  identical icon + heading + text cards, glassmorphism everywhere, emoji as icons.
- Eyebrow-driven hierarchy: `// section`, `YourCTF{label}`, numbered kickers and mono labels above
  every heading. If every section is announced, none of them leads.
- Neon-noir clutter: glows/halos on everything, scanlines, matrix rain, sketchy hand-drawn SVG,
  stripes or grids as background wallpaper.
- Cosmetic chrome: side-stripe borders, hard offset shadows, pill-shaped everything, oversized
  radii on containers, hover tilt on content that must be read.
- Mono-as-costume: mono labels for navigation, body copy or decoration rather than data.
- Motion debt: parallax on every section, scroll-jacking, bounce easing, live-data layout
  animation, loops that keep running offscreen.
- Fake product: invented metrics, lorem testimonial logos, fake system status, placeholder links.

## Impeccable audit and polish protocol

Source: `../impeccable-ref/skill/reference/audit.md`, `polish.md`, `craft-floor.md`. This document
is updated by those references, not replaced.

### Scoring

Audit five dimensions at 4 points each (20 total), and record evidence per finding:

| Dimension | Checks |
|---|---|
| Accessibility | contrast, labels, focus, targets, headings, keyboard, motion, charts |
| Performance | LCP/CLS/TBT, media weight, lazy effects, layout thrash, polling |
| Theming | role tokens, accent discipline, dark surfaces, browser surfaces, consistency |
| Responsive | 360/412/768/1024/1440, overflow, tables, navigation, safe areas |
| Implementation integrity | states, errors, copy truthfulness, dead ends, no fake data |

Severity: P0 blocks a task, P1 serious usability/a11y failure, P2 quality gap, P3 polish.
Fix P0 and P1 before any polish work; do not polish around a structural defect.

### Triage order

1. P0/P1 accessibility and responsive failures.
2. Broken or misleading states (404 vs network, paid hint free, fake status).
3. Hierarchy and composition (eyebrows, repeated grids, weak focal point).
4. Motion and polish (timing, easing, microfeedback).
5. Copy and microcopy.

### Craft floor (bans)

- No eyebrow above a heading.
- No identical icon + heading + text card grid.
- No gradient text.
- No glass decoration.
- No side-stripe borders.
- No zero-offset halo or ambient glow behind surfaces.
- No hard offset shadows.
- No mono used as decoration.
- No emoji or glyph characters as icons.
- No sketchy/hand-drawn SVG.
- No stripe/grid/dot background without a subject.
- No display type over 6rem; no tracking tighter than `-0.04em`.
- No body measure over 75ch.
- No global reduced-motion kill.
- No content hidden in an unmarked horizontal scroller.
- No table wider than the viewport.
- No fabricated data.

### Verification for every phase

- Run the app and use the affected flow in a browser, not only the type checker.
- Check 360, 412, 768, 1024, 1440; keyboard only; reduced motion; coarse pointer.
- Re-check the audit score and P0/P1 list at Phases 10 and 11.

