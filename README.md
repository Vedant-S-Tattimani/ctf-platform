# YourCTF

A jeopardy-style Capture The Flag competition platform: host events, field teams, publish
challenges and run a live scoreboard. Layout and feature set are inspired by modern CTF
platforms; all branding, copy and assets are original.

Monorepo with two independent apps that talk only over HTTP:

```
├── backend/    Node.js + Express + TypeScript + Prisma (SQLite dev / PostgreSQL-shaped schema)
├── frontend/   React 18 + Vite + TypeScript + Tailwind CSS
└── docs/       design rules and research notes
```

## Features

**Players**
- Landing page with live platform stats and a top-teams preview.
- Challenge board with category, difficulty and solved filters; challenge dialog with hints
  (unlockable for points), downloadable handouts and per-flag status.
- Flag submission with instant feedback, first-blood credit and a per-account solve history.
- Live scoreboard for teams and players, with a cumulative points-over-time chart.
- Teams: create, join by invite code, edit (owner), remove members, transfer ownership, leave;
  public team pages.
- Accounts: register, sign in/out, editable profile, email-based password reset, public user
  pages.

**Organizers (role `ADMIN`)**
- Challenge CRUD with draft/publish, points, order, flags (add/remove), hints, and handout
  uploads or external file references.
- Category CRUD; delete is refused while challenges still reference the category.
- Event editing: description, team size cap, start/end, publish/unpublish.
- People & activity: users, teams and the submission audit trail with pagination.

## Stack

| Layer | Choice |
|---|---|
| Frontend | React 18, Vite, TypeScript, Tailwind CSS, React Router, TanStack Query, Zustand, Motion, GSAP |
| Backend | Express, TypeScript, Prisma, zod, bcryptjs, JWT (httpOnly cookie), helmet, CORS, express-rate-limit |
| Tests | Vitest + Supertest (backend), TypeScript checks + production builds (frontend) |

## Prerequisites

- Node.js >= 20
- npm >= 10

## Quick start

### 1. Backend

```bash
cd backend
cp .env.example .env        # edit JWT_SECRET and the bootstrap admin credentials
npm install
npm run prisma:migrate      # creates/updates the SQLite dev database
npm run seed                # seeds categories, an event, 12 challenges and the admin user
npm run dev                 # http://localhost:4000
```

Health check: `GET http://localhost:4000/api/v1/health`

### 2. Frontend

```bash
cd frontend
cp .env.example .env        # VITE_API_URL=http://localhost:4000/api/v1
npm install
npm run dev                 # http://localhost:5173
```

The Vite dev server and the production preview both proxy `/api` to `http://localhost:4000`;
`VITE_API_URL` is the single frontend setting.

### Production preview

```bash
cd frontend
npm run build
npm run preview             # http://localhost:4173 (proxies /api to :4000)
```

## Configuration

Backend settings are validated at boot with zod (`backend/src/config/env.ts`); every variable is
documented in [`backend/.env.example`](backend/.env.example). Highlights:

| Variable | Purpose |
|---|---|
| `DATABASE_URL` | Prisma connection string (`file:./dev.db` by default) |
| `JWT_SECRET` | Signing key for session tokens — use a long random value |
| `COOKIE_NAME`, `COOKIE_SECURE` | Session cookie name and `Secure` attribute (enable behind HTTPS) |
| `CORS_ORIGIN` | Allowed frontend origin(s), comma separated |
| `RATE_LIMIT_*` | Global, auth and submission rate limits |
| `ADMIN_*` | Bootstrap admin created by `npm run seed` |

## Scripts

| Folder | Script | Purpose |
|---|---|---|
| backend | `npm run dev` | API server with watch mode (tsx) |
| backend | `npm run build` | Type-check the server |
| backend | `npm test` | Vitest + Supertest suite (78 tests) |
| backend | `npm run prisma:migrate` | Create/apply dev migrations |
| backend | `npm run prisma:studio` | Inspect the database |
| backend | `npm run seed` | Seed sample data and the bootstrap admin |
| frontend | `npm run dev` | Vite dev server |
| frontend | `npm run typecheck` | TypeScript only |
| frontend | `npm run build` | Type-check + production bundle |
| frontend | `npm run preview` | Serve the production bundle |

## Security model

- **Flags are never stored or served in plaintext.** Each flag value is stored as
  SHA-256(salt + trimmed value) with a random 16-byte per-flag salt and compared with
  `timingSafeEqual`. Passwords use bcrypt (10 rounds). No API response — public or admin —
  includes flag values, hashes or salts; the admin detail exposes only
  `{id, label, points, order}` per flag.
- Wrong submissions return `200 {correct:false}`; duplicates return `409 {correct:true,
  duplicate:true}` so the UI never implies a wrong answer was accepted.
- Sessions are JWTs in an httpOnly cookie; `COOKIE_SECURE=true` for HTTPS deployments. CORS only
  allows `CORS_ORIGIN`.
- Every request body/query is validated with zod; helmet sets security headers; rate limits apply
  globally and are stricter on register/login and flag submission.
- The frontend never receives flag data at build time: the production bundle was scanned for all
  seeded flag strings.

## Testing and quality checks

```bash
cd backend  && npm test && npm run build
cd frontend && npm run typecheck && npm run build
```

Latest verified results (Phase 11, fresh production build):

- Backend: **78/78** Vitest + Supertest tests passing; `npm run build` (tsc) clean.
- Frontend: `npm run typecheck` and `npm run build` clean.
- API audit: **51/51** assertions — recursive scan for flag/hash/salt fields and seeded flag
  strings in every response, submission contract (`200 {correct:false}` / `409 duplicate`), file
  upload/attach/download/delete, hint unlock idempotency, dynamic scoring, team limits and invite
  privacy, generic forgot-password, logout cookie clearing.
- Browser end-to-end (headless Chrome at 360/412/1440): **19/19** checks — filters and search,
  registration, wrong/correct/solved flag states, login errors, forgot password, admin create and
  delete, people & activity.
- Keyboard and accessibility: skip link, `Ctrl K` palette, modal/drawer focus traps with Escape and
  focus restore, body scroll lock, reduced-motion mode (no WebGL, no pulse); computed contrast AA
  and a visible focus ring on 14/14 tab stops across 13 pages.
- Production performance on a 4G profile with 4× CPU throttling: LCP **1.3–2.2 s**, CLS
  **0.002–0.017** on `/`, `/challenges` and `/scoreboard` at 412 and 1440 px; 19–22 requests and
  ≤ 336 KB transferred. Lighthouse itself was not re-run in this pass; the Phase 10 run reported
  **100** desktop and **90–91** mobile performance.

## API contract

The HTTP contract — endpoints, payload shapes, error codes and limits — lives in
[`backend/API.md`](backend/API.md). Frontend and backend share no code; they communicate only
through this API.

## Branding

The product name lives in a single constant: `frontend/src/lib/brand.ts`. Rename the brand there
(plus the seed/flag prefix in `backend/.env` where relevant).

## Design

Tokens, type scale, motion rules and accessibility floors are documented in
[`docs/design-rules.md`](docs/design-rules.md); research notes are in
[`docs/reference-notes.md`](docs/reference-notes.md).

## Known gaps

- **Stored uploads are local-disk only.** Handout uploads are written under `UPLOAD_DIR`; there is
  no S3/object-storage adapter. Mount the directory on a persistent volume in production.
- **Mail uses a console logger or webhook.** Verification and password-reset mail goes through
  `MAIL_TRANSPORT` (`console` logs the message, `webhook` POSTs JSON to `MAIL_WEBHOOK_URL`); no
  SMTP client ships with the app, so production needs a relay webhook.
- **Wrong-flag attempts are hashed, not stored verbatim.** The audit trail keeps the attempt
  length, a salted hash and an optional 8-character hash prefix; organizers never see the plaintext.
- **Session bootstrap hint.** The cookie is httpOnly, so the client keeps a `yourctf:session`
  localStorage hint to decide whether to call `/auth/me` on load. If storage is cleared while the
  cookie is still valid, the user appears signed out until their next sign-in.
- **SQLite is the exercised database.** The Prisma schema is written to be PostgreSQL-compatible,
  but only SQLite has been run.
- **React Router v7 future-flag warnings** may appear in the dev console.
- **Decorative performance trade-offs:** the hero WebGL aurora is paused on touch devices, and
  below-the-fold landing sections mount on first scroll/key/touch intent (with a long fallback).
- **Admin tables scroll horizontally** from `md` up; smaller viewports use stacked cards instead.
