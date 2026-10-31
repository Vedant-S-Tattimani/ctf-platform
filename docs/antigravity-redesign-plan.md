# Antigravity-inspired re-skin — plan

Frontend-only. `backend/` is read-only for this work; the proof at the end of every phase is
`git diff --stat backend/` being empty. Invariants that survive the re-skin: flags never
rendered or stored client-side, wrong submission = `200 {correct:false}`, duplicate =
`409 {correct:true, duplicate:true}`, no `frontend/`→`backend/` imports.

Reference: https://antigravity.google — studied live; measurements in
[similarity-rubric.md](similarity-rubric.md). We are matching a *design language* (light, airy,
medium-weight geometric sans, pill CTAs, large radii, soft shadows, confetti particle field,
scroll reveals). We are **not** copying their logo, copy, screenshots, iconography or the
proprietary Google Sans font. Brand strings stay only in `frontend/src/lib/brand.ts`.

## 1. Strategy: redefine tokens, don't rewrite call sites

87 `.tsx` files already speak a semantic utility vocabulary — `bg-canvas`, `bg-surface`,
`text-primary`, `text-secondary`, `text-muted`, `border-hairline`, `type-h1`, `rounded-pill`,
`duration-fast`. Counts on the hot path: `text-muted` 181, `text-primary` 173,
`border-hairline` 158, `text-secondary` 147, `bg-elevated` 57, `text-accent` 55.

So the re-skin is driven from `tokens.css` (invert the semantic roles, keep the names), then
component internals, then layout. Only 64 raw colour literals exist in 7 files, so there is very
little to chase by hand. Two name traps to watch: `text-secondary` is the *gray* body colour
while the cyan token surfaces as `info`; `border-strong` is our hairline token, not Tailwind's.

## 2. Palette (OKLCH, derived from the measured reference)

Light is the default; dark is opt-in via `[data-theme="dark"]` and follows
`prefers-color-scheme` when the user has not chosen.

| Role | Light | Dark |
|---|---|---|
| `--bg-canvas` | `oklch(0.995 0.002 265)` (white) | `oklch(0.17 0.015 265)` |
| `--bg-surface` | `oklch(0.985 0.004 265)` (`#F8F9FC`) | `oklch(0.21 0.02 265)` |
| `--bg-elevated` | `oklch(0.975 0.006 265)` | `oklch(0.25 0.022 265)` |
| `--text-primary` | `oklch(0.21 0.012 265)` (ink) | `oklch(0.95 0.008 265)` |
| `--text-secondary` | `oklch(0.45 0.015 265)` | `oklch(0.78 0.015 265)` |
| `--text-muted` | `oklch(0.58 0.015 265)` | `oklch(0.64 0.02 265)` |
| `--border-hairline` | `oklch(0.21 0.012 265 / 0.09)` | `oklch(0.95 0.01 265 / 0.08)` |
| `--accent` (violet) | `oklch(0.55 0.22 292)` | `oklch(0.72 0.17 292)` |
| `--info` (blue) | `oklch(0.55 0.18 255)` | `oklch(0.78 0.12 235)` |
| `--success` (mint) | `oklch(0.6 0.14 165)` | `oklch(0.78 0.15 160)` |
| `--warning` | `oklch(0.65 0.15 65)` | `oklch(0.82 0.15 75)` |
| `--danger` (coral) | `oklch(0.58 0.2 25)` | `oklch(0.7 0.19 25)` |
| Primary pill | ink bg + white text | white bg + ink text |

Four sparse tints (blue, violet, coral, mint) appear only as chips, icon tints, glows and the
hero particle field — never as filled slabs. All text/background pairs must clear AA in both
themes; the `-faint` tokens are ~8–12% alpha washes of their hue.

## 3. Typography

One open family, **Outfit** (`@fontsource-variable/outfit`), for display *and* body — the closest
open match to Google Sans Flex's geometric-humanist proportions — plus the existing
**JetBrains Mono Variable** for flags, code and numerals. Inter and Space Grotesk come out of
`package.json`, `main.tsx` preloads and `fonts.css` once nothing references them.

Weights move from "bold display" to the reference's medium register: display 480–560, h1/h2 480,
body 400. Sizes go up, tracking tightens: hero `clamp(2.75rem, 6.4vw, 5.5rem)` at −0.035em,
h1 3rem/−0.028em, h2 2rem/−0.02em, h3 1.375rem/−0.012em. Body stays 1rem/1.65 at 65–75ch measure.

## 4. Shape and elevation

`--radius-sm` 8 → controls, `--radius-md` 14 → inputs/cards, `--radius-lg` 24 → panels,
`--radius-xl` 36 → hero media slabs, `--radius-pill` 999. Shadows become diffuse and low-alpha:
`--shadow-soft` `0 2px 8px ink/4%`, `--shadow-card` `0 14px 36px -4px ink/12%`,
`--shadow-float` `0 16px 40px ink/12%`. `--shadow-glow` is deleted (zero call sites today).
Borders stay 1px hairlines; no double borders.

## 5. Motion

Transform/opacity only; no layout thrash; one authored moment per page.

- Scroll reveals via `@supports (animation-timeline: view())` with a Motion `whileInView`
  fallback for browsers without scroll-driven animations.
- `@starting-style` for overlay entry, container queries for card density, scroll-snap carousels
  with round prev/next buttons, `overscroll-behavior: contain` in drawers/modals.
- Hide-on-scroll header: `translateY` driven by scroll direction, never `display`.
- Landing hero: cursor-reactive confetti particle field (canvas), lazy-loaded, one per page,
  disabled under `prefers-reduced-motion` and coarse pointers → static soft gradient.

## 6. Information architecture (unchanged routes)

`/` `/challenges` `/challenges/:id` `/scoreboard` `/teams` `/teams/:id` `/users/:id` `/login`
`/register` `/forgot-password` `/reset-password` `/verify-email` `/account` `/admin/*` `*` 404,
plus dev-only `/__kit`. No route is added or removed; the mega footer may only link to these.

## 7. Page wireframes (text)

**Landing** — header (logo left, links centre, ink pill right) → announcement strip → hero:
particle field behind a 3-line medium-weight headline, one subline, two pill CTAs, live stat
chips → "How it works" three large-radius cards, staggered reveal → discipline snap-carousel
with round prev/next → sticky two-column feature section driven by `/events/current` +
`/scoreboard` → scoreboard teaser (podium) + first-blood ticker → FAQ accordion → CTA band →
mega footer.

**Challenges** — sticky filter bar (segmented category pills, search, difficulty chips,
grid/list toggle) → soft-glow hover cards with difficulty chip and solved/first-blood state →
right-side drawer (full-screen under `md`) with description, handouts, hints, mono pill flag
input, success burst, shake-on-wrong, rate-limit notice, solver list.

**Scoreboard** — podium top-3 → segmented teams/players → hairline table with pinned "you" row →
accessible SVG chart with `<table>` fallback.

**Teams / profile / auth** — create/join cards with copy-code pill; profile stat cards + solve
timeline; auth as a centred card on a soft gradient field with inline errors and show/hide
password.

**Admin** — same system, denser: rail + hairline tables with search/sort/paging, forms, confirm
dialogs, no heavy effects.

## 8. Component inventory

Reuse and restyle: `ui/Button` (pill variants), `Input`, `Textarea`, `Select`, `Tabs` →
segmented pills, `Badge` → chips, `Card`, `Modal`, `Drawer`, `Toast`, `Skeleton`, `DataTable`,
`Avatar`, `Progress`, `ConfirmDialog`, `CopyButton`, `EmptyState`, `ErrorState`, `PageHeader`,
`SectionHeader`, `Stat`, `Segmented`.
React Bits already vendored: `AnimatedContent`, `AnimatedList`, `Aurora`, `CountUp`, `Magnet`,
`SpotlightCard`, `Stepper`, `TiltedCard`. Add (verify names on reactbits.dev before installing):
`FadeContent`, `SplitText` or `BlurText`, a pill/dock nav. `Aurora` is replaced by the new
particle field on landing — one heavy effect per page, so Aurora moves or goes.
New: `ThemeToggle`, `ParticleField`, `Reveal`, `Carousel`, `FAQ` accordion, `Ticker`.

## 9. Loop mechanics


Per page group: build → `node frontend/scripts/shoot.mjs` → read the PNGs next to the reference
shots → score against the rubric → write the next self-prompt (3 biggest gaps, each with a
concrete token/component/spacing/motion fix) → execute → repeat until ≥38 with no criterion
below 3, or the cap. History lives in [iteration-log.md](iteration-log.md); anything unresolved
goes to [ui-followups.md](ui-followups.md).

## 10. Reference read (from `docs/reference/antigravity/`)

Stepped viewport captures at 1440 and 390, contact sheets `contact-1440.png`,
`contact-1440-b.png`, `contact-390.png`. What the language actually is, top to bottom:

1. **Header** — white, 1px hairline under. Logo mark + wordmark left; nav links with small
   dropdown carets centred; right side a dark pill CTA plus a light outlined pill (locale).
   A light-grey announcement strip sits below with a dark `NEW` chip and a close ×.
2. **Hero** — white, ~1.5 viewports tall, centred. A confetti particle field of thousands of
   tiny blue/violet/coral/mint dots radiating outward from the centre. Small logo lockup, then a
   two-line headline at roughly 90px, weight ~450, ink, tight tracking, then one dark pill CTA.
   Nothing else in the band — the emptiness is the point.
3. **Feature rows** — text column left (h2 ~36px/450, small grey body at a narrow measure),
   media right: a dark rounded panel (radius ≈24–36px) holding a product screenshot; the next row
   flips sides. Huge vertical gaps between rows.
4. **Statement row** — two-line h2 on the left, a short paragraph pushed to the right and down,
   almost nothing between them.
5. **Media carousel** — one large pastel-grey rounded card with a video/play overlay, caption
   bottom-left, round prev/next buttons bottom-right.
6. **Card rail** — "Latest blogs" style: h2 left, outlined pill right, then a horizontal snap rail
   of cards (dark rounded thumbnail, medium-weight title, tiny grey date + category) that bleeds
   off the right edge.
7. **Dark CTA band** — full-bleed near-black with a sparse blue particle field, headline left,
   two pill buttons.
8. **Footer** — white: small heading left, two tiny link columns, then the brand wordmark set
   *enormous*, edge to edge, in ink, then a hairline row with the company name left and legal
   links right.

Mobile (390): everything collapses to one column, headings centred, cards stack, the carousel
keeps its round prev/next pair centred below the card.

Adopting for YourCTF: the airy hero with a particle field, alternating text/media rows using real
product surfaces (challenge drawer, scoreboard) as the media, round prev/next on the discipline
carousel, a dark CTA band, and the oversized wordmark footer. Not adopting: their logo, copy,
photography, icon set or font.

