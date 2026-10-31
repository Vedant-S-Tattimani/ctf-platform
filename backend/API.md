# YourCTF API contract

Base URL: `http://localhost:4000/api/v1` (dev). All requests/responses are JSON.
Authentication is a JWT in an httpOnly cookie (name from `COOKIE_NAME`, default `yourctf_session`).
Send cookies with cross-origin clients (`credentials: 'include'`); CORS allows only `CORS_ORIGIN`.

## Conventions

- Errors: `{ "error": string, "details"?: unknown }` with a matching HTTP status.
- Validation errors return `400` with `details` = zod `flatten()` output.
- Rate limits: global `RATE_LIMIT_MAX` per `RATE_LIMIT_WINDOW_MS` on `/api/v1/*`;
  stricter `LOGIN_RATE_LIMIT_MAX` on register/login and `SUBMIT_RATE_LIMIT_MAX` on flag submission.
- Timestamps are ISO-8601 strings.
- **Flag values, salts and hashes are never returned by any endpoint.**

## Auth

| Method | Path | Auth | Body | Response |
|---|---|---|---|---|
| POST | `/auth/register` | – | `{username, email, password}` | `201 {user}` + session cookie |
| POST | `/auth/login` | – | `{email, password}` | `200 {user}` + session cookie |
| POST | `/auth/logout` | – | – | `200 {ok}` clears cookie |
| GET | `/auth/me` | user | – | `200 {user}` |
| GET | `/auth/session` | optional | – | `200 {user}` or `200 {user: null}` — never 401 |
| POST | `/auth/forgot-password` | – | `{email}` | `200 {ok, message}` — always generic |
| POST | `/auth/reset-password` | – | `{token, password}` | `200 {ok}`; invalid/used/expired link → `400` |
| POST | `/auth/verify-email` | – | `{token}` | `200 {ok, user}`; invalid/used/expired link → `400` |
| POST | `/auth/resend-verification` | user | – | `200 {alreadyVerified: boolean}` |

`user` = `{id, username, email, emailVerifiedAt, role, avatarUrl, bio, teamId, createdAt}` for the
authenticated caller's own payloads. `emailVerifiedAt` is `null` until the emailed link is used.
Everywhere else (team members, public profiles) the `email` and verification fields are omitted:
`publicUser` = `{id, username, role, avatarUrl, bio, teamId, createdAt}`.

Registration sends a verification email (24 h, single use). Forgot-password always returns the
same response so accounts cannot be enumerated; when the address exists it sends a 60-minute,
single-use reset link. Reset increments the user's session version, so every previously issued
cookie stops working. Only SHA-256 hashes of email tokens are stored. In development the console
mail transport prints the link; production must configure `MAIL_TRANSPORT` (see below). With
`REQUIRE_EMAIL_VERIFICATION=true`, flag submissions return `403` until the address is verified.

## Users

| Method | Path | Auth | Response |
|---|---|---|---|
| GET | `/users/me` | user | `200 {user}` incl. `teamName` |
| PATCH | `/users/me` | user | body `{bio?, avatarUrl?}` → `200 {user}` |
| GET | `/users/:id` | – | `200 {user}` public profile (`publicUser` + `teamName`, no email) |

## Teams

| Method | Path | Auth | Body | Response |
|---|---|---|---|---|
| POST | `/teams` | user | `{name, description?}` | `201 {team}` (creator = owner+member) |
| POST | `/teams/join` | user | `{inviteCode}` | `200 {team}` |
| POST | `/teams/leave` | user | – | `200 {ok, deleted}` (sole owner deletes team) |
| GET | `/teams/me` | user | – | `200 {team}` or `{team: null}` |
| PATCH | `/teams/me` | owner | `{name?, description?}` | `200 {team}` |
| DELETE | `/teams/me/members/:userId` | owner | – | `200 {team}`; `400` removing yourself, `404` non-member |
| POST | `/teams/me/transfer` | owner | `{userId}` | `200 {team}`; owner becomes a regular member |
| POST | `/teams/me/invite-code` | owner | – | `200 {team}` with a new code; the old code stops working |
| GET | `/teams/:id` | – | – | `200 {team}` |

`team` = `{id, name, description, avatarUrl, maxSize, inviteCode, ownerId, createdAt, memberCount, members: publicUser[]}`.
`inviteCode` is only populated for team members' own payloads; a public `GET /teams/:id`
returns `inviteCode: null`.
Errors: `409` already in a team / team full / name taken; `404` unknown invite code; `403` not the owner.

## Challenges

| Method | Path | Auth | Query | Response |
|---|---|---|---|---|
| GET | `/challenges` | optional | `category` (slug), `eventId`, `difficulty` | `200 {challenges: summary[]}` |
| GET | `/challenges/:id` | optional | – | `200 {challenge: detail}` |
| POST | `/challenges/:id/hints/:hintId/unlock` | user | – | `200 {hint, alreadyUnlocked, pointsSpent, points}` |

`difficulty` is case-sensitive and one of `easy`, `medium`, `hard`, `insane`; unknown values are
rejected with `400`. On admin create/update it is optional and defaults to `medium`.

`summary` = `{id, title, difficulty, points, currentPoints, order, category{id,name,slug,color}, eventId, flagsTotal, flagsSolved, solveCount, solvedByMe, firstBloodByMe}`.
`points` is the configured base value; `currentPoints` is what a solver earns right now (equal to
`points` on static events, decayed per flag on dynamic events).
`detail` adds `description`, `hints[{id,order,cost,unlocked,content}]`,
`files[{id,name,path,sizeBytes,mimeType,downloadUrl}]`,
`flags[{id,label,points,currentPoints,order,solvedByMe,firstBlood}]`.
For stored uploads `path` is `null` and `downloadUrl` points at `/files/:assetId`; externally
referenced handouts keep `path` and have a `null` `downloadUrl`.
Unpublished challenges 404 for everyone.

**Hints:** `content` is `null` and `unlocked` is `false` while a hint is locked, so paid hint text
never leaves the server unearned. Hints with `cost: 0` are always unlocked. Unlocking deducts the
cost once per payer — the team when the player has one (members share a single ledger), otherwise
the player — and is idempotent: repeating it returns the text with `alreadyUnlocked: true` and
`pointsSpent: 0`. Not enough points → `409` with `details: {code: "INSUFFICIENT_POINTS", points}`.
Ended event → `403`. Responses never include flag material. Scores are derived as
`solve points − hint spend`; no stored score is edited in place.

## Events

| Method | Path | Auth | Response |
|---|---|---|---|
| GET | `/events/current` | – | `200 {event, serverTime}` |

`event` is the published event a public visitor should see — a live one, else the soonest
upcoming, else the most recently ended — or `null` when none is published. Draft events are
never returned.

`event` = `{id, name, slug, description, startsAt, endsAt, teamMaxSize, challengeCount, state}`
where `state` = `live \| upcoming \| ended` computed from the dates, and `challengeCount` counts
published challenges only.


## Submissions

| Method | Path | Auth | Body | Response |
|---|---|---|---|---|
| POST | `/submissions` | user | `{challengeId, flag}` | `200 {correct, points?, firstBlood?, flagLabel?, message}` |
| GET | `/submissions/me` | user | – | `200 {submissions[]}` (last 100 attempts) |

Wrong flag → `200 {correct:false}`. The attempt is recorded as a salted hash plus its length
(`providedSalt`, `providedHash`, `providedLength`) — the plaintext value is never stored or
returned. `GET /submissions/me` exposes `providedLength` and, only when
`WRONG_ATTEMPT_DISPLAY_PREFIX=true`, an 8-character `providedHashPrefix` for spotting repeated
guesses.
Correct → solve created, worth the base value on static events or the decayed award on dynamic
events (frozen on the solve row); `firstBlood:true` when nobody solved that flag before.
Repeat of an already-solved flag (by the player or a teammate) → `409 {correct:true, duplicate:true}`.
Ended event → `403`. Unknown/unpublished challenge → `404`.

## Files

| Method | Path | Auth | Body | Response |
|---|---|---|---|---|
| GET | `/files/:id` | optional | – | streamed attachment (`Content-Disposition`, `nosniff`) |

Stored handouts are only served once attached to a published challenge; draft-only assets 404 for
everyone except signed-in admins. Unknown ids and malformed stored names also 404. Display names
are sanitized on upload; on-disk names are random 32-hex strings and never exposed.

## Scoreboard

| Method | Path | Query | Response |
|---|---|---|---|
| GET | `/scoreboard` | `scope=teams\|users` (default teams), `eventId?`, `limit` (≤100), `offset` | `200 {entries[]}` |
| GET | `/scoreboard/history` | same | `200 {series[]}` for the points-over-time chart |

`entry` = `{rank, id, name, avatarUrl, memberCount, points, solveCount, lastSolveAt}`.
`points` = solve points minus hint spend for that scope (team ledgers for `scope=teams`, personal
ledgers for `scope=users`). Ties break on earliest last solve. `series` =
`[{id, name, points:[{t, y}...]}]` cumulative, top 5 teams, first point pinned at the event start
(or first solve) with `y: 0`; hint spend appears as a downward step.

## Admin (role `ADMIN`; all routes `401`/`403` otherwise)

Challenges:
- `GET /admin/challenges` → `{challenges[]}` all challenges (including drafts) with category, event, and flag/hint/file/solve counts
- `GET /admin/challenges/:id` → `{challenge}` full draft-safe detail (flags expose `id/label/points/order/algo` only — never salt or hash). Dynamic-event challenges also return `scoring: {mode, minimumPoints, decayThreshold, samples:[{solves, points}]}`; static ones return `scoring: null`.
- `POST /admin/challenges` `{title, description, categoryId, eventId?, difficulty?, points, published?, order?, flags:[{label?, value, points}], hints?:[{content, cost?}], files?:[{name, path, sizeBytes?}]}` → `201 {challenge}` (flags stored as salted hashes)
- `PATCH /admin/challenges/:id` partial scalars (incl. `published`, `points`) → `200 {challenge}`
- `DELETE /admin/challenges/:id` → `200 {ok}`
- `POST /admin/challenges/:id/flags` `{label?, value, points, algo?}` → `201 {flag}` (no hash returned). `algo` is `sha256` (default) or `sha512`; each flag stores the algorithm it was hashed with, so changing `FLAG_HASH_ALGORITHM` never breaks existing flags.
- `DELETE /admin/flags/:id` → `200 {ok}`; `409` if the flag has solves
- `POST /admin/challenges/:id/hints` `{content, cost?}` → `201 {hint}`; `DELETE /admin/hints/:id`
- `POST /admin/challenges/:id/files` `{assetId}` or `{name, path, sizeBytes?}` → `201 {file}`; `DELETE /admin/files/:id` (also removes the stored file when no other challenge references the asset)

Uploads:
- `POST /admin/files` — raw body, `Content-Type` = file MIME, `X-File-Name` = URI-encoded display name (max `UPLOAD_MAX_BYTES`, default 5 MB) → `201 {asset: {id,name,mimeType,sizeBytes,createdAt,downloadUrl}}`
- Allowed MIME types: `application/octet-stream`, `application/pdf`, `application/zip`, `application/x-zip-compressed`, `application/gzip`, `application/x-tar`, `text/plain`, `text/csv`, `image/png`, `image/jpeg`, `image/gif`, `image/webp`. Anything else (HTML, SVG, scripts) → `415`; oversized body → `413`; empty body → `400`.

Categories:
- `GET /admin/categories` → `{categories[]}` with `_count.challenges`
- `POST /admin/categories` `{name, slug?, color?, icon?}` → `201`; `409` on clash
- `PATCH /admin/categories/:id`; `DELETE /admin/categories/:id` (`409` while in use)

Events:
- `GET /admin/events` → `{events[]}`
- `POST /admin/events` `{name, slug?, description?, startsAt?, endsAt?, teamMaxSize?, published?, scoringMode?, scoringMinimumPoints?, scoringDecayThreshold?}` → `201`
- `PATCH /admin/events/:id` (times, publish toggle, scoring settings) → `200`

`scoringMode` is `STATIC` (default) or `DYNAMIC`. Dynamic events decay each flag quadratically from
its configured points (1 solve) to `scoringMinimumPoints` (default 100) across
`scoringDecayThreshold` solves (default 40). The awarded amount is frozen on each solve, so editing
the event later never rewrites the scoreboard.

Listings (paged with `limit`/`offset`, response includes `total`):
- `GET /admin/users` → users with team + solve counts
- `GET /admin/teams` → teams with member/solve counts + owner
- `GET /admin/submissions` → attempts with user/team/challenge names. Wrong attempts expose only `providedLength` (and `providedHashPrefix` when `WRONG_ATTEMPT_DISPLAY_PREFIX=true`); correct attempts carry no attempt data.

## Health

`GET /health` → `200 {ok, service, env, time}`. Mounted before the rate limiter, so it is exempt.

## Deployment notes

The boot validator refuses to start a production server that still looks like development.
`NODE_ENV=production` requires: a `JWT_SECRET` that is not the dev default and is at least 32
characters; a non-default `ADMIN_PASSWORD`; `COOKIE_SECURE=true`; a non-default `DATABASE_URL`;
and an explicit `MAIL_TRANSPORT` (`console`, or `webhook` together with `MAIL_WEBHOOK_URL`, which
receives `{from, to, subject, text}` JSON). `APP_BASE_URL` is the public frontend URL used in
email links. Invalid configuration logs every issue and exits non-zero.

Handouts are written under `UPLOAD_DIR` (default `./uploads`, relative to the backend) with random
names; mount this directory on a persistent volume in production and set `UPLOAD_MAX_BYTES`.
`FLAG_HASH_ALGORITHM` (`sha256` default, `sha512` supported) only affects new flags.

Tests and development use SQLite. For PostgreSQL, `docker-compose.yml` at the repo root starts a
`postgres:16` service; point `DATABASE_URL` at it, change the Prisma datasource provider to
`postgresql`, then run `npx prisma migrate deploy && npm run seed`. `npm run reset:dev -- --yes
[--demo]` wipes only a local SQLite database (it refuses production and non-`file:` URLs) and
re-seeds; `--demo` also creates six demo players on three teams so the board is not empty.
