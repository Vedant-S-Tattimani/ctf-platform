# Reference notes — soterctf.com

Reconnaissance for building `YourCTF` (original branding; layout/features/feel only, no copied assets).
Captured 2026-10-31 with a real browser (DevTools-style inspection + screenshots in `docs/reference/`).
The site is a client-rendered Vite + React SPA (`#root`, `/assets/index-*.js`), so plain HTML fetch returns nothing; all notes below come from the live DOM, computed styles and the Network tab.

Screenshots:
- `01-landing-full.png` — landing before scroll-reveal (shows reveal-on-scroll + cookie banner)
- `02-landing-revealed.png` — landing after triggering reveals (full section order)
- `03-login.png` — login card
- `04-app-dashboard.png` — authenticated dashboard
- `05-challenges.png` — 404 page (legacy `/app/chall` route)
- `06-comp-home.png` — competition home (per-competition subdomain)
- `07-comp-challenges.png` — challenges gated empty-state
- `08-comp-leaderboard.png` — leaderboard (mobile width)
- `ref-leaderboard.webp`, `ref-challenges.webp`, `ref-comp-home.webp` — the site's own product screenshots (desktop leaderboard, challenge detail, competition hero)

---

## 1. Routes / pages

### Marketing site (soterctf.com)
| Route | Page |
|---|---|
| `/` | Landing (hero, features, hosting pitch, themes, pricing, footer) |
| `/login` | Sign-in card (email+password, Google OAuth) |
| `/signup` | Register |
| `/organize`, `/organize/contact` | "Host your own CTF" pitch / contact |
| `/privacy` | Privacy policy (linked from cookie banner + login terms) |
| anything else | 404 page |

### App shell (soterctf.com/app, authenticated)
| Route | Page |
|---|---|
| `/app` | Dashboard |
| `/app/practice` | Practice (solo training challenges) |
| `/app/teams` | Teams |
| `/app/orgs` | Organizations |
| `/app/news` | Platform news |
| `/app/halloffame` | Hall of Fame |
| (drawer) | Create CTF, Documentation (external), Settings, language switcher |

`/app` redirects: unauthenticated → `/login`; authenticated `/login` → `/app`.

### Competition app (per-competition SUBDOMAIN, e.g. demo.soterctf.com)
Each competition is its own sub-app on a subdomain. Menu: Home, Rules, Leaderboard, Challenges, Teams + i18n (English / Català / Español) + user block (avatar, username, email, Profile, Settings, Log out).
| Route | Page |
|---|---|
| `/` | Competition home (hero, cover art, countdown, meta) |
| `/rules` | Rules |
| `/challenges` | Challenge list → detail (gated until registered with a team) |
| `/leaderboard` | Scoreboard |
| `/teams` | Teams |

> Architectural note: Soter shards competitions onto subdomains. For `YourCTF` we keep ONE app and scope by competition id instead — same screens, simpler routing.

---

## 2. Navigation structure

**Marketing navbar:** minimal — logo left, language switcher (EN flag) + auth CTAs right. Hero carries the primary CTAs (`Get Started` → `/signup`, `Log In →`, `Read the documentation →`).

**App top bar (sticky, dark):** hamburger (opens left drawer), global search ("Search challenges, teams, users..."), notification bell, avatar.
**App drawer:** Dashboard, Practice, Teams, Organizations, News, Hall of Fame, `Create CTF` button, Documentation link, "YOUR ORGANIZATIONS" group, language switcher, Settings.

**Competition navbar:** logo + competition name left, hamburger right → modal dialog menu (Home, Rules, Leaderboard, Challenges, Teams, languages, user block).

**Footer (marketing):** 3 columns — About blurb, Quick Links (Challenges, Teams, Support), Follow Us (LinkedIn, YouTube) — plus copyright line. Competition footer: "Powered by SoterCTF" + copyright.

---

## 3. Landing page sections, in order

1. **Hero** — centered: auto-rotating product-screenshot carousel (3 slides: leaderboard / challenges / competition home) with dot indicators, then H1 "Build, Play, Hack and Compete.", one-paragraph pitch, `Get Started` (solid indigo) + `Log In →` (ghost) + `Read the documentation →` (text link).
2. **Value props** — H2 "Learn, Compete and Host CTF Challenges" + intro paragraph + 4 icon rows: Compete in CTFs / Host Your Own Competitions / Talent Recruitment / Learn Cybersecurity.
3. **Hosting pitch** — eyebrow "Custom Competitions, Full Support", H1 "Tailored CTF Experience", paragraph, product screenshot, contact line, 4 icon rows (Multi-Flag Challenges / Organization-Exclusive Events / Talent Discovery / Dedicated Support), closing paragraph.
4. **Managed platform** — H2 "Fully Managed Platform." + 2 paragraphs (infrastructure, analytics/reports).
5. **Customization** — eyebrow "Make It Yours", H2 "Complete Competition Customization", paragraph, **theme gallery grid of 6 preview cards** (Sakura, Mystic, Scholar, Frost, Ember, Hacker), 4 icon rows (Flexible Team Settings / Visual Themes / Full Branding / Access Control).
6. **Pricing** — eyebrow "Pricing", H2 "Plans for every CTF", two plan cards (Free €0 "Recommended" / Enterprise "Contact us") each with a feature checklist (challenges, players, private/public comps, docker challenges, branding, priority support, custom challenge authoring).
7. **Footer** (see above).

Pattern to reuse: eyebrow → big tight heading → one paragraph → content block → icon feature rows. Sections alternate subtly darker/lighter navy bands.

---

## 4. Visual design (measured)

### Color
| Token | Value | Use |
|---|---|---|
| page bg | `rgb(15,23,42)` `#0F172A` (slate-900) | body; deeper bands ≈ `#0B1120` |
| surface/card | ≈ `#151C2C` (white 2–4% over bg) | cards, tables, inputs |
| text primary | `rgb(226,232,240)` `#E2E8F0`; headings `#FFF` | body / headings |
| text muted | ≈ `#94A3B8` (slate-400) | secondary copy, meta |
| accent (primary) | `rgb(129,140,248)` `#818CF8` (indigo-400); hover ≈ `#A5B4FC` | CTAs, links, ranks, chart series |
| accent deep | violet ≈ `#7C3AED` | cover art, podium ring, category pills |
| border | ≈ `rgba(148,163,184,.12)` | hairline card borders |
| status | green/lime/orange/red/pink/cyan | avatar initials, chart series, status badges |

Single indigo/violet accent on navy; no blue-purple SaaS gradients. Avatars are saturated solid circles with white initials.

### Type
- **Inter** everywhere on the reference (body 16/24; H1 36/45 w700 letter-spacing −0.9px; competition hero ≈64px w800). Mono (ui-monospace/JetBrains-like) for flags, connection strings, code blocks.
- For `YourCTF`: keep this *scale* (tight negative tracking on display, 16px body) but swap in a distinctive display face + mono per the design brief.

### Shape & spacing
- Card radius ≈ 12–16px; buttons ≈ 8–10px; pills/badges fully round.
- Hairline borders, soft inner glow, no heavy drop shadows.
- Section vertical rhythm ≈ 96–128px; container ≈ 1200px; generous whitespace, left-aligned app content / centered marketing heroes.

### Motion
- Scroll-reveal: sections fade + translate-y on enter (content is invisible pre-reveal — see `01-landing-full.png`).
- Hero carousel auto-rotates with dot indicators; countdown ticks; no `<canvas>`/WebGL on the landing (0 canvas nodes) — effects are CSS/DOM based.
- Cookie-consent banner (bottom card: icon, title, text, Reject / Accept all).
- Sticky dark top bar.

---

## 5. Feature inventory (observed)

**Auth:** login card (logo mark, title, welcome line, labelled inputs with leading icons + password eye toggle, "Forgot password?" right-aligned, solid submit, "Continue with Google", sign-up cross-link, terms line). Register analogous.

**Dashboard:** competition hero banner (diagonal status ribbon "Upcoming", watermark "CAPTURE THE FLAG", name card), upcoming/finished competition list (logo tile, name, org, date, status badge), platform news list, weekly streak heatmap (Mon–Sat), activity-last-year grid, flags/month bar chart, personal summary card (avatar, username, rank title e.g. "Script Kiddie", points, progress-to-next-rank %, compare-with-friends).

**Competitions:** status (Upcoming / In course / Finished), countdown (DAYS/HOURS/MINS/SECS boxes), cover art, "Teams up to N members", add-to-calendar link, rules page.

**Challenges:** gated until the user joins with a team (empty-state card: icon, "You're not registered", explanation, `Join competition` CTA). Detail page: back link; header card with title + category pill (uppercase, indigo outline) + points pill; meta row (author, N solves, N/M flags); Description card with mono connection block (`$ nc host port`); **Tasks card** (multi-flag challenges: numbered tasks, per-task points `+100`, question text, mono flag-format hint `BRAND{***}`); Submit Flag card (mono input, full-width submit); First Blood card (top-3 solvers with avatar, rank, timestamp).

**Scoreboard:** header (icon tile, title, subtitle, status chip); points-over-time multi-series line chart with colour-dot legend and time axis; table (Rank — #1 rendered as trophy icon, others `#n`, unranked `-`; avatar; team name + member count; bold points; flags) with pagination ("page 1 of 2"); top-3 podium (center #1 elevated with ring); "my team" side card (Position / Points / Flags rows).

**Teams / Orgs / News / Hall of Fame / Friends / Notifications / global search / i18n / themes** — all present as nav destinations or dashboard widgets.

**404:** giant indigo "404", "Page not found", subtext, solid "Go to home" + ghost "Go to dashboard".

---

## 6. API shape (Network tab, `api.soterctf.com/api/v4`)

Versioned REST on a separate `api.` subdomain; static media on `cdn.soterctf.com` (`/web/image/*`, `/user/{id}/avatar.webp`, `/org/{id}/comp/{slug}/cover.webp`); realtime via **socket.io** (Engine.IO polling) on the api host.

Observed endpoints (all JSON, 200):
```
GET  /api/v4/csrf                          # CSRF token bootstrap
GET  /api/v4/user/me                       # current user
GET  /api/v4/user/tour                     # onboarding tour state
GET  /api/v4/noti                          # notifications
GET  /api/v4/comp                          # competitions
GET  /api/v4/org/user                      # my organizations
GET  /api/v4/org/{orgId}/competitions
GET  /api/v4/news/{locale}/recent/{n}
GET  /api/v4/stats/streak/weekly | /best | /yearly
GET  /api/v4/stats/points/{compId}         # points-over-time series
GET  /api/v4/friends
GET  /api/v4/team/me                       # my team
     /socket.io/?EIO=4&transport=polling   # realtime (scoreboard pushes)
```

Conventions worth borrowing for `backend/API.md`: versioned prefix (`/api/v1`), CSRF bootstrap call, `me`-style self endpoints, nested resources under org/comp, locale in path for content, stats grouped under `/stats/*`, websocket channel for live scoreboard instead of polling.

---

## 7. Takeaways for YourCTF

1. Dark navy + single indigo/violet accent, hairline borders, soft glows — premium not neon-noir.
2. Eyebrow → tight heading → paragraph → icon feature rows is the house layout pattern.
3. Scroll-reveal everywhere; carousel in hero; countdown for events; podium + time-series chart on scoreboard.
4. Challenge model supports **multiple flags/tasks per challenge** with per-task points and first-blood recognition — mirror this in the schema (Challenge → Task/Flag).
5. Gating: challenges hidden until team registration → design good empty states.
6. Rank titles ("Script Kiddie" → "Novice" …) and streaks/activity heatmaps add stickiness — cheap to include later.
7. Realtime scoreboard via socket; we'll use SSE or 15s polling per the brief.
