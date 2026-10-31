"""Generate YourCTF-Handoff.docx — a single self-contained handoff document."""
from docx import Document
from docx.shared import Pt, Cm, RGBColor
from docx.enum.text import WD_ALIGN_PARAGRAPH, WD_BREAK
from docx.enum.table import WD_TABLE_ALIGNMENT
from docx.enum.section import WD_SECTION
from docx.oxml.ns import qn
from docx.oxml import OxmlElement

ACCENT = RGBColor(0x5B, 0x46, 0xD6)
DARK = RGBColor(0x1F, 0x24, 0x33)
GREY = RGBColor(0x55, 0x5B, 0x6B)


def shade(cell, hex_fill):
    tcPr = cell._tc.get_or_add_tcPr()
    shd = OxmlElement('w:shd')
    shd.set(qn('w:val'), 'clear')
    shd.set(qn('w:color'), 'auto')
    shd.set(qn('w:fill'), hex_fill)
    tcPr.append(shd)


def add_page_number(paragraph):
    run = paragraph.add_run()
    fld = OxmlElement('w:fldSimple')
    fld.set(qn('w:instr'), 'PAGE')
    run._r.addnext(fld)


doc = Document()

# Page setup
section = doc.sections[0]
section.page_height = Cm(29.7)
section.page_width = Cm(21.0)
section.top_margin = Cm(2.0)
section.bottom_margin = Cm(1.8)
section.left_margin = Cm(2.2)
section.right_margin = Cm(2.2)

# Base styles
normal = doc.styles['Normal']
normal.font.name = 'Calibri'
normal.font.size = Pt(10.5)
normal.paragraph_format.space_after = Pt(6)
normal.paragraph_format.line_spacing = 1.12

for name, size in (('Heading 1', 17), ('Heading 2', 13.5), ('Heading 3', 11.5)):
    style = doc.styles[name]
    style.font.name = 'Calibri'
    style.font.size = Pt(size)
    style.font.color.rgb = ACCENT if name != 'Heading 3' else DARK
    style.font.bold = True
    style.paragraph_format.space_before = Pt(16 if name == 'Heading 1' else 12)
    style.paragraph_format.space_after = Pt(6)
    style.paragraph_format.keep_with_next = True

# Footer
footer_p = section.footer.paragraphs[0]
footer_p.alignment = WD_ALIGN_PARAGRAPH.CENTER
footer_run = footer_p.add_run('YourCTF — Project Handoff  ·  page ')
footer_run.font.size = Pt(8)
footer_run.font.color.rgb = GREY
add_page_number(footer_p)

# Core properties
doc.core_properties.title = 'YourCTF — Project Handoff'
doc.core_properties.subject = 'Single-document handoff for continuing development'
doc.core_properties.author = 'YourCTF build'
doc.core_properties.comments = 'Generated from the verified project state on 31 October 2026.'


def p(text='', bold=False, italic=False, size=None, color=None, space_after=None, align=None):
    para = doc.add_paragraph()
    run = para.add_run(text)
    run.bold = bold
    run.italic = italic
    if size:
        run.font.size = Pt(size)
    if color:
        run.font.color.rgb = color
    if space_after is not None:
        para.paragraph_format.space_after = Pt(space_after)
    if align:
        para.alignment = align
    return para


def bullet(text, bold_prefix=None):
    para = doc.add_paragraph(style='List Bullet')
    if bold_prefix:
        r = para.add_run(bold_prefix)
        r.bold = True
        para.add_run(text)
    else:
        para.add_run(text)
    para.paragraph_format.space_after = Pt(2)
    return para


def numbered(text, bold_prefix=None):
    para = doc.add_paragraph(style='List Number')
    if bold_prefix:
        r = para.add_run(bold_prefix)
        r.bold = True
        para.add_run(text)
    else:
        para.add_run(text)
    para.paragraph_format.space_after = Pt(2)
    return para


def mono(lines, size=8.8):
    if isinstance(lines, str):
        lines = lines.splitlines()
    para = doc.add_paragraph()
    para.paragraph_format.space_before = Pt(2)
    para.paragraph_format.space_after = Pt(8)
    para.paragraph_format.line_spacing = 1.0
    for i, line in enumerate(lines):
        run = para.add_run(line)
        run.font.name = 'Consolas'
        run._element.rPr.rFonts.set(qn('w:eastAsia'), 'Consolas')
        run.font.size = Pt(size)
        run.font.color.rgb = DARK
        if i < len(lines) - 1:
            run.add_break(WD_BREAK.LINE)
    return para


def table(headers, rows, widths=None, font_size=8.6):
    t = doc.add_table(rows=1, cols=len(headers))
    t.style = 'Table Grid'
    t.alignment = WD_TABLE_ALIGNMENT.CENTER
    t.autofit = True
    hdr = t.rows[0].cells
    for i, h in enumerate(headers):
        hdr[i].text = ''
        run = hdr[i].paragraphs[0].add_run(h)
        run.bold = True
        run.font.size = Pt(font_size + 0.2)
        run.font.color.rgb = RGBColor(0xFF, 0xFF, 0xFF)
        shade(hdr[i], '5B46D6')
    for row in rows:
        cells = t.add_row().cells
        for i, value in enumerate(row):
            cells[i].text = ''
            run = cells[i].paragraphs[0].add_run(str(value))
            run.font.size = Pt(font_size)
            if i == 0:
                run.font.name = 'Consolas'
            cells[i].paragraphs[0].paragraph_format.space_after = Pt(1)
    if widths:
        for i, w in enumerate(widths):
            for row in t.rows:
                row.cells[i].width = Cm(w)
    doc.add_paragraph().paragraph_format.space_after = Pt(2)
    return t


# ------------------------------------------------------------------ cover
cover_space = doc.add_paragraph()
cover_space.paragraph_format.space_before = Pt(90)
p('YourCTF', bold=True, size=34, color=ACCENT, space_after=4)
p('Jeopardy CTF platform — project handoff', bold=True, size=16, color=DARK, space_after=10)
p('A single, self-contained briefing: what was built, how it runs, what was verified, and what remains.',
  italic=True, size=11, color=GREY, space_after=26)
p('Prepared 31 October 2026', size=10, color=GREY, space_after=2)
p('Workspace: D:\\ctf platform', size=10, color=GREY, space_after=2)
p('Intended reader: an AI or engineer continuing the project', size=10, color=GREY, space_after=0)

doc.add_page_break()

# ------------------------------------------------------------------ 1 summary
doc.add_heading('1. Executive summary', level=1)
p('YourCTF is a complete, working jeopardy-style Capture The Flag competition platform. It was built '
  'phase by phase (scaffolding → backend → frontend foundation → landing → player pages → admin → '
  'performance/accessibility polish → final QA) and every phase was run and verified before the next '
  'began. The branding, copy and assets are original; only the general layout and feature set are '
  'inspired by modern CTF sites.')
p('The system is two independent applications that communicate exclusively over HTTP: a Node/Express '
  'API with a Prisma database, and a React single-page client. A JSON HTTP contract is documented in '
  'backend/API.md and is the only thing the two sides share.')
p('Current state: backend tests 78/78 passing, both typechecks and both production builds clean. '
  'Phase 11 QA: 51/51 API assertions, 19/19 browser end-to-end checks, keyboard/focus and contrast '
  'audits clean, and production LCP 1.3–2.2 s with CLS 0.002–0.017 at 412 and 1440 px under 4G with '
  '4× CPU throttling. Lighthouse on the Phase 10 build: desktop 100/100/100/100, mobile 90/100/100/100. '
  'The platform supports the full player loop (register → team → solve → scoreboard) and the '
  'organizer loop (event, categories, challenges, flags, hints, uploads, publish, audit).')

# ------------------------------------------------------------------ 2 layout
doc.add_heading('2. Repository layout', level=1)
mono([
    'D:\\ctf platform\\',
    '├─ backend\\           Express + TypeScript API (port 4000)',
    '│  ├─ src\\            app.ts, server.ts, config, middleware, modules/, utils/',
    '│  ├─ prisma\\         schema.prisma, migrations/, seed.ts, dev.db (SQLite)',
    '│  ├─ tests\\          Vitest + Supertest suites (16 files, 78 tests)',
    '│  └─ API.md          the HTTP contract (single source of truth)',
    '├─ frontend\\          React 18 + Vite SPA (dev 5173, preview 4173)',
    '│  └─ src\\            api/, components/, features/, hooks/, pages/, store/, styles/',
    '├─ docs\\              design-rules.md, reference-notes.md, research reference/',
    '└─ README.md          setup, features, security model, known gaps',
])
p('The two apps have no cross-imports. Frontend imports nothing from backend; the API client in '
  'frontend/src/api is the only boundary.')

# ------------------------------------------------------------------ 3 stack
doc.add_heading('3. Stack', level=1)
table(
    ['Layer', 'Technology'],
    [
        ('Frontend', 'React 18.3, Vite 5, TypeScript 5.7, Tailwind CSS 3.4, React Router 6.28'),
        ('State/data', 'TanStack Query 5, Zustand 5'),
        ('Motion', 'Motion 12 (Framer Motion successor), GSAP 3 with ScrollTrigger, custom React Bits components'),
        ('Backend', 'Express 4, TypeScript, Prisma 6, zod 3'),
        ('Auth/crypto', 'JWT (jsonwebtoken) in an httpOnly cookie, bcryptjs for passwords, SHA-256 + salt for flags'),
        ('Hardening', 'helmet, CORS allowlist, express-rate-limit, zod on every body/query'),
        ('Tests', 'Vitest 2 + Supertest 7 (backend); tsc + production build (frontend)'),
        ('Database', 'SQLite in development; Prisma schema written to be PostgreSQL-compatible'),
    ],
    widths=[3.2, 13.4],
)

# ------------------------------------------------------------------ 4 quick start
doc.add_heading('4. Quick start', level=1)
doc.add_heading('4.1 Backend', level=2)
mono([
    'cd backend',
    'cp .env.example .env        # edit JWT_SECRET and ADMIN_PASSWORD',
    'npm install',
    'npm run prisma:migrate      # create/apply SQLite dev database',
    'npm run seed                # categories, event, 12 challenges, admin user',
    'npm run dev                 # http://localhost:4000',
])
p('Health check: GET http://localhost:4000/api/v1/health → 200 {ok, service, env, time}.')
doc.add_heading('4.2 Frontend', level=2)
mono([
    'cd frontend',
    'cp .env.example .env        # VITE_API_URL=http://localhost:4000/api/v1',
    'npm install',
    'npm run dev                 # http://localhost:5173',
])
doc.add_heading('4.3 Production preview', level=2)
mono([
    'cd frontend',
    'npm run build',
    'npm run preview             # http://localhost:4173 (proxies /api to :4000)',
])
p('Both the Vite dev server and the preview proxy /api to localhost:4000, so the app works with the '
  'same VITE_API_URL in development and preview.')

# ------------------------------------------------------------------ 5 config
doc.add_heading('5. Configuration', level=1)
p('Backend environment is validated at boot with zod in backend/src/config/env.ts. Invalid values stop '
  'the process with a readable list. The frontend reads only VITE_API_URL.')
table(
    ['Variable', 'Default', 'Purpose'],
    [
        ('PORT', '4000', 'API port'),
        ('CORS_ORIGIN', 'http://localhost:5173', 'Allowed origin(s), comma-separated'),
        ('DATABASE_URL', 'file:./dev.db', 'Prisma connection string'),
        ('JWT_SECRET', 'dev fallback only', 'Session token signing key — must be set for real use'),
        ('JWT_EXPIRES_IN', '7d', 'Session lifetime'),
        ('COOKIE_NAME', 'yourctf_session', 'Session cookie name'),
        ('COOKIE_SECURE', 'false', 'Set true behind HTTPS'),
        ('RATE_LIMIT_WINDOW_MS / RATE_LIMIT_MAX', '15 min / 300', 'Global API rate limit'),
        ('LOGIN_RATE_LIMIT_MAX', '10', 'Register/login attempts per window'),
        ('SUBMIT_RATE_LIMIT_MAX', '30', 'Flag submissions per window'),
        ('ADMIN_USERNAME / ADMIN_EMAIL / ADMIN_PASSWORD', 'admin / admin@yourctf.local / ChangeMe123!', 'Bootstrap admin created by seed'),
    ],
    widths=[6.4, 5.6, 4.6],
)

# ------------------------------------------------------------------ 6 features
doc.add_heading('6. Feature inventory', level=1)
doc.add_heading('6.1 Players', level=2)
bullet('Landing page with live platform stats, category grid, top-teams preview and CTA band.', 'Landing: ')
bullet('Challenge board with category, difficulty and solved filters; search; live/draft status.', 'Challenges: ')
bullet('Challenge dialog with description, hints (unlockable for points), downloadable handouts and per-flag solved state.', 'Challenge detail: ')
bullet('Flag submission with instant correct/incorrect feedback, first-blood credit and scoreboard refresh.', 'Submission: ')
bullet('Live scoreboard for teams and players with rank, points, solves, last solve, and a cumulative points-over-time chart for the top five.', 'Scoreboard: ')
bullet('Create a team, join by invite code, edit name/description, remove members, transfer ownership, leave; public team pages with roster and stats.', 'Teams: ')
bullet('Register, sign in/out, edit bio/avatar, password reset link, public profiles, per-account solve history on the account page.', 'Accounts: ')
doc.add_heading('6.2 Organizers (ADMIN)', level=2)
bullet('Challenge CRUD with draft/publish, difficulty, points, order, event assignment.', 'Challenges: ')
bullet('Add/remove flags (label + points), hints (content + cost), handout uploads (raw body + X-File-Name) or external references.', 'Challenge internals: ')
bullet('Category CRUD; deletion is refused while challenges still reference the category (409).', 'Categories: ')
bullet('Event editing: description, team size cap, start/end, publish/unpublish.', 'Events: ')
bullet('Paged listings of users, teams and submissions (audit trail) with counts and totals.', 'People & activity: ')

# ------------------------------------------------------------------ 7 architecture
doc.add_heading('7. Architecture and key flows', level=1)
doc.add_heading('7.1 Sessions and authentication', level=2)
bullet('Register/login issues a JWT stored in an httpOnly cookie named by COOKIE_NAME; the client sends credentials with every request. Passwords are bcrypt hashes (10 rounds).', 'Auth: ')
bullet('GET /auth/me returns the current user; public payloads omit email (publicUser).', 'Identity: ')
bullet('The cookie is invisible to JavaScript, so the client stores a non-sensitive localStorage hint (yourctf:session). First-time guests skip the /auth/me probe (this eliminated the expected 401 console error and reached Best Practices 100). The hint is set on login/register and cleared on logout or an expired session.', 'Session bootstrap: ')
bullet('Admin routes require role ADMIN; RequireAuth/RequireAdmin components guard client routes; the API enforces the same with 401/403.', 'Authorization: ')
doc.add_heading('7.2 Flag lifecycle and the answer-key invariant', level=2)
bullet('A flag is stored as SHA-256(salt + ":" + trimmed value). The salt is 16 random bytes (hex) generated per flag. Verification recomputes the digest and compares with timingSafeEqual.', 'Storage: ')
bullet('No endpoint returns flag values, hashes or salts — including admin. Admin challenge detail exposes only id, label, points and order per flag.', 'Exposure: ')
bullet('POST /submissions with a wrong value returns 200 {correct:false} and records the attempt. A correct value creates a Solve (with firstBlood computed from prior solves of that flag) and returns points and message. Re-submitting an already-solved flag returns 409 {correct:true, duplicate:true}. The UI branches on result.correct, so a wrong answer is never shown as accepted.', 'Submission contract: ')
bullet('The frontend production bundle was scanned for every seeded flag string and for secrets: none appear. The only "YourCTF{" strings in the bundle are input placeholders.', 'Bundle check: ')
doc.add_heading('7.3 Scoring and scoreboard', level=2)
bullet('Events choose STATIC or DYNAMIC scoring. Static awards each flag its base points; dynamic decays quadratically from the base value to scoringMinimumPoints across scoringDecayThreshold solves, and the awarded amount is frozen on the Solve row. Scoreboard totals and the per-flag currentPoints use the same helper (src/utils/scoring.ts).', 'Points: ')
bullet('Team score is the sum of member solves. Ties break on the earliest last solve. The history endpoint builds cumulative series for the top five teams, with the first point pinned at the event start (or first solve) at y=0.', 'Ranking: ')
doc.add_heading('7.4 Teams', level=2)
bullet('A team has an owner, an invite code and a max size (event teamMaxSize). Creating a team makes the creator owner and first member. Joining is by invite code; the code is only returned to members.', 'Model: ')
bullet('The owner can edit the team, remove members and transfer ownership. An owner cannot leave while other members remain; a sole owner leaving deletes the team. Removing or losing membership clears the member\'s teamId and settled solves keep their team attribution.', 'Rules: ')
doc.add_heading('7.5 Frontend structure', level=2)
mono([
    'src/',
    '├─ api/            typed HTTP client + endpoint modules (auth, users, teams,',
    '│                  challenges, submissions, scoreboard, admin)',
    '├─ components/     layout (RootLayout, Navbar), ui (Button, Input, Modal, Toast...),',
    '│                  auth guards, reactbits/ (Aurora, DecryptedText, CountUp, Magnet,',
    '│                  AnimatedContent, ...)',
    '├─ features/       landing/, challenges/, scoreboard/, teams/, admin/',
    '├─ hooks/          useAuth, usePrefersReducedMotion, useScrollTriggerRefresh',
    '├─ pages/          Home, Challenges, Scoreboard, Teams, TeamDetail, Profile,',
    '│                  Account, Login, Register, Admin, NotFound',
    '├─ store/          auth (Zustand), toast (Zustand)',
    '├─ lib/            brand.ts (single brand constant), utils (cn), format, errors',
    '├─ styles/         tokens.css (OKLCH roles), globals.css, fonts.css',
    '└─ routes.tsx      createBrowserRouter; all pages except Home are React.lazy',
])
bullet('Routing: /, /challenges, /scoreboard, /teams, /teams/:id, /users/:id, /login, /register, /account (auth), /admin (admin), * → NotFound.', 'Routes: ')
bullet('Data: TanStack Query with 15 s stale time; mutations invalidate prefixes such as [\'scoreboard\'] and [\'teams\']. Zustand holds the session user and toast queue.', 'Data layer: ')
bullet('Build: manualChunks split react, query/zustand, motion and gsap; the Home route is eager, everything else is lazy with a skeleton fallback.', 'Bundling: ')
doc.add_heading('7.6 Landing performance strategy', level=2)
bullet('Route-level code splitting and vendor chunking; the below-the-fold sections (stats, categories, mini scoreboard, CTA) are lazy and mount on the first scroll/pointer/key/touch intent, with a long fallback for assistive tech that never emits those events.', 'Deferral: ')
bullet('Hero social-proof query is armed 1.2 s after mount, outside the startup burst.', 'Query timing: ')
bullet('The WebGL aurora is paused on coarse-pointer devices and renders at dpr 1; it is skipped entirely under prefers-reduced-motion.', 'Decorative WebGL: ')
bullet('Fonts are self-hosted woff2 from @fontsource-variable, preloaded, and declared with font-display: optional to eliminate swap-induced layout shift. The hero live-badge row reserves height so the arriving query cannot shift layout.', 'Fonts/CLS: ')
bullet('Reduced motion is honored globally (CSS media rule collapses animations/transitions) and per component (MotionConfig reducedMotion="user", usePrefersReducedMotion, CountUp snaps to its final value).', 'Motion: ')

# ------------------------------------------------------------------ 8 data model
doc.add_heading('8. Data model (Prisma)', level=1)
table(
    ['Model', 'Key fields', 'Relations / notes'],
    [
        ('User', 'id, username, email, passwordHash, role, avatarUrl, bio, teamId', 'Owns teams; has submissions and solves'),
        ('Team', 'id, name, inviteCode, description, avatarUrl, maxSize, ownerId', 'Members are Users; owner relation; solves/submissions'),
        ('Event', 'id, name, slug, description, startsAt, endsAt, teamMaxSize, published', 'Has challenges'),
        ('Category', 'id, name, slug, color, icon', 'Has challenges; unique name and slug'),
        ('Challenge', 'id, title, description, difficulty, points, published, order, categoryId, eventId', 'Has flags, hints, files, solves, submissions'),
        ('Flag', 'id, label, salt, hash, points, order, challengeId', 'SHA-256(salt + trimmed value); cascade with challenge'),
        ('Hint', 'id, content, cost, order, challengeId', 'Unlock deducts cost once per user; cascade with challenge'),
        ('ChallengeFile', 'id, name, path, assetId, sizeBytes, challengeId', 'Either a stored FileAsset (downloadUrl) or an external path'),
        ('FileAsset', 'id, name, storedName, mimeType, sizeBytes', 'Raw upload written under UPLOAD_DIR'),
        ('Submission', 'id, providedLength, providedSalt, providedHash, correct, createdAt, userId, teamId, challengeId, flagId', 'Audit trail stores a salted hash of wrong attempts, never the text'),
        ('Solve', 'id, points, firstBlood, solvedAt, userId, teamId, challengeId, flagId', 'One solve per user per flag'),
    ],
    widths=[2.4, 8.0, 6.2],
)

# ------------------------------------------------------------------ 9 API
doc.add_heading('9. HTTP API reference', level=1)
p('Base URL in development: http://localhost:4000/api/v1. All requests and responses are JSON. '
  'Authentication is the session cookie. Errors are {error, details?} with a matching status; '
  'validation failures return 400 with zod flatten() details. The complete contract lives in '
  'backend/API.md — keep it in sync with code changes.')

doc.add_heading('9.1 Auth and users', level=2)
table(
    ['Method', 'Path', 'Auth', 'Notes'],
    [
        ('POST', '/auth/register', '—', '201 {user} + session cookie'),
        ('POST', '/auth/login', '—', '200 {user} + session cookie'),
        ('POST', '/auth/logout', '—', '200 {ok}, clears cookie'),
        ('POST', '/auth/forgot-password', '—', '200 generic {ok, message}; never reveals whether the email exists'),
        ('POST', '/auth/reset-password', '—', '{token, password} → 200; single-use token, 60 min, bumps session version'),
        ('GET', '/auth/me', 'user', '200 {user}'),
        ('GET', '/users/me', 'user', '200 {user} incl. teamName'),
        ('PATCH', '/users/me', 'user', '{bio?, avatarUrl?} → 200 {user}'),
        ('GET', '/users/:id', '—', 'Public profile (no email) + teamName'),
    ],
    widths=[1.8, 4.4, 1.6, 8.8],
)

doc.add_heading('9.2 Teams', level=2)
table(
    ['Method', 'Path', 'Auth', 'Notes'],
    [
        ('POST', '/teams', 'user', '{name, description?} → 201; creator is owner+member'),
        ('POST', '/teams/join', 'user', '{inviteCode} → 200; 409 if full/already in team; 404 unknown code'),
        ('POST', '/teams/leave', 'user', '200 {ok, deleted}; owner with members → 409'),
        ('GET', '/teams/me', 'user', '200 {team} or {team:null}'),
        ('PATCH', '/teams/me', 'owner', '{name?, description?} → 200'),
        ('DELETE', '/teams/me/members/:userId', 'owner', 'Remove a member; 200 {team}'),
        ('POST', '/teams/me/transfer', 'owner', '{userId} → 200 {team}'),
        ('POST', '/teams/me/invite-code', 'owner', 'Regenerate the invite code → 200 {team}'),
        ('GET', '/teams/:id', '—', 'Public team; inviteCode is null for non-members'),
    ],
    widths=[1.8, 4.4, 1.6, 8.8],
)

doc.add_heading('9.3 Challenges and submissions', level=2)
table(
    ['Method', 'Path', 'Auth', 'Notes'],
    [
        ('GET', '/challenges', 'optional', 'Filters: category (slug), eventId, difficulty'),
        ('GET', '/challenges/:id', 'optional', 'Detail: description, hints, files, flags (status only); unpublished → 404'),
        ('POST', '/submissions', 'user', '{challengeId, flag} → 200 {correct, points?, firstBlood?, flagLabel?, message}'),
        ('GET', '/submissions/me', 'user', 'Last 100 own attempts'),
        ('POST', '/challenges/:id/hints/:hintId/unlock', 'user', '200 {hint, alreadyUnlocked, pointsSpent, points}'),
        ('GET', '/files/:id', 'optional', 'Stored handout download (Content-Disposition attachment); drafts only for admins'),
    ],
    widths=[1.8, 4.4, 1.6, 8.8],
)
p('Conflict semantics: wrong value → 200 {correct:false}; already solved → 409 {correct:true, duplicate:true}; '
  'ended event → 403; unknown/unpublished challenge → 404.')

doc.add_heading('9.4 Scoreboard and health', level=2)
table(
    ['Method', 'Path', 'Notes'],
    [
        ('GET', '/scoreboard', 'scope=teams|users (default teams), eventId?, limit≤100, offset'),
        ('GET', '/scoreboard/history', 'Same filters; cumulative series for top five: [{id, name, points:[{t,y}]}]'),
        ('GET', '/health', '200 {ok, service, env, time}; mounted before the rate limiter'),
    ],
    widths=[1.8, 5.2, 9.6],
)

doc.add_heading('9.5 Admin (role ADMIN; 401/403 otherwise)', level=2)
table(
    ['Method', 'Path', 'Notes'],
    [
        ('GET', '/admin/challenges', 'All challenges incl. drafts, with counts'),
        ('GET', '/admin/challenges/:id', 'Full detail; flags expose id/label/points/order only'),
        ('POST', '/admin/challenges', 'Create with flags[{label?,value,points}], hints[], files[]'),
        ('PATCH', '/admin/challenges/:id', 'Partial scalars incl. published and points'),
        ('DELETE', '/admin/challenges/:id', 'Cascades flags/hints/files/solves/submissions'),
        ('POST', '/admin/challenges/:id/flags', '201 {flag} — no hash returned'),
        ('DELETE', '/admin/flags/:id', '409 when the flag has solves'),
        ('POST', '/admin/challenges/:id/hints', '201 {hint}; DELETE /admin/hints/:id'),
        ('POST', '/admin/challenges/:id/files', '{assetId} or {name, path, sizeBytes?} → 201 {file}; DELETE /admin/files/:id'),
        ('POST', '/admin/files', 'Raw upload (body = bytes, X-File-Name header) → 201 {asset, downloadUrl}'),
        ('GET/POST', '/admin/categories', 'List with counts; create (409 on clash)'),
        ('PATCH/DELETE', '/admin/categories/:id', 'Delete → 409 while in use'),
        ('GET/POST', '/admin/events', 'List; create'),
        ('PATCH', '/admin/events/:id', 'Description, times, teamMaxSize, publish toggle'),
        ('GET', '/admin/users', 'Paged (limit/offset/total) with team + solve counts'),
        ('GET', '/admin/teams', 'Paged with member/solve counts + owner'),
        ('GET', '/admin/submissions', 'Paged attempts; correct attempts carry no flag text'),
    ],
    widths=[2.0, 6.4, 8.2],
)

# ------------------------------------------------------------------ 10 design
doc.add_heading('10. Design system', level=1)
p('The binding visual rules are in docs/design-rules.md. Summary: a dark, premium '
  '"hacker-meets-editorial" world with one electric-violet accent and a cyan secondary; surfaces are '
  'composed as explicit dark steps, not alpha stacks; one accent owns primary actions and the focal '
  'region. Body text ≥ 4.5:1, large text ≥ 3:1, controls and focus rings ≥ 3:1; color is never the '
  'only carrier of meaning.')
bullet('OKLCH semantic tokens in src/styles/tokens.css (canvas, surface, elevated, overlay, text roles, accent/secondary, semantic states, borders, scrim). Tailwind maps to these variables — no orphan hex values in components.', 'Color: ')
bullet('Space Grotesk for display/headings, Inter for body, JetBrains Mono for code, labels and numerals. Custom scale: display, h1–h3, label, body, small, mono — registered in the Tailwind config and in tailwind-merge so size utilities never collide with color utilities.', 'Type: ')
bullet('150–300 ms ease-out for UI transitions, instant feedback on press, Motion + GSAP for landing choreography; prefers-reduced-motion collapses animation globally and components settle instantly.', 'Motion: ')
bullet('Design implementer notes: the hero uses an aurora canvas, decrypted headline, and magnetic CTA; counters use CountUp; below-fold sections use AnimatedContent with ScrollTrigger.', 'React Bits: ')

# ------------------------------------------------------------------ 11 verification
doc.add_heading('11. Verification evidence', level=1)
doc.add_heading('11.1 Automated', level=2)
mono([
    'cd backend  && npm test          # 16 files, 78 tests passing',
    'cd backend  && npm run build     # tsc --noEmit, clean',
    'cd frontend && npm run typecheck # tsc --noEmit, clean',
    'cd frontend && npm run build     # production bundle, clean',
])
table(
    ['Area', 'Evidence'],
    [
        ('Auth and sessions', 'register, login, me, logout, session versions, password reset tokens, env validation'),
        ('Users and teams', 'profile read/update, create/join/limits/leave, member removal, ownership transfer, invite privacy'),
        ('Challenges', 'list filters, detail, unpublished visibility, hint unlock and idempotency, file attach/download'),
        ('Submissions', 'wrong/duplicate/correct, first blood, ended event, stored attempt hashes'),
        ('Scoring and scoreboard', 'static and dynamic decay, frozen solve points, ranking, ties, history series'),
        ('Admin', 'challenge/flag/category/event CRUD, uploads, paged listings'),
    ],
    widths=[3.4, 13.2],
)
doc.add_heading('11.2 Lighthouse (Phase 10 build, landing page)', level=2)
table(
    ['Profile', 'Performance', 'Accessibility', 'Best practices', 'SEO', 'Metrics'],
    [
        ('Desktop', '100', '100', '100', '100', 'LCP 0.2 s · TBT 30 ms · CLS 0'),
        ('Mobile', '90–91', '100', '100', '100', 'LCP 0.8 s · FCP 0.8 s · TBT ~400 ms · CLS 0'),
    ],
    widths=[2.2, 2.6, 2.8, 3.0, 1.8, 5.6],
)
p('Remaining mobile TBT is React startup itself (three long tasks in react-vendor, CPU-throttled ×4). '
  'Below-fold JS and decorative work were moved out of the measurement window as far as practical. '
  'Lighthouse was not re-run for Phase 11; the Chrome DevTools Protocol measurements below were used '
  'instead because the CLI was not installed.')

doc.add_heading('11.3 Production performance (Phase 11, 4G + 4× CPU)', level=2)
table(
    ['Page', '412 px LCP / CLS', '1440 px LCP / CLS', 'Requests', 'Transferred'],
    [
        ('/', '1548 ms / 0.017', '1344 ms / 0.016', '19', '336 KB'),
        ('/challenges', '2128 ms / 0.002', '2160 ms / 0.005', '22', '287 KB'),
        ('/scoreboard', '1896 ms / 0.002', '1860 ms / 0.005', '21', '279 KB'),
    ],
    widths=[3.2, 4.2, 4.2, 2.0, 3.0],
)
p('Measured on the production preview with 1.6 Mbps down / 150 ms latency and 4× CPU throttling. '
  'Scoreboard skeletons mirror the loaded podium and chart footprints, so the first data paint does '
  'not move content (the shift fell from 0.081 to 0.002 at 412 px).')

doc.add_heading('11.4 Manual and harness checks', level=2)
bullet('51/51 API assertions: recursive scan for flag/hash/salt fields and seeded flag strings in every response, submission contract, uploads, hint unlocks, dynamic scoring, team limits and invite privacy, generic forgot-password, logout cookie.', 'API audit: ')
bullet('19/19 browser checks at 360/412/1440: filters and search, registration, wrong/correct/solved flag states, login errors, forgot password, admin create/delete, people & activity.', 'End-to-end: ')
bullet('Skip link, Ctrl K palette, palette/account/filter/admin dialogs open and close with Escape, Tab and Shift+Tab stay inside, focus returns to the trigger, body scroll lock is restored, and reduced motion removes the aurora and pulse.', 'Keyboard: ')
bullet('Computed contrast with alpha compositing found no failures across 13 pages; all 14 tab stops show a visible 2 px focus ring.', 'Contrast: ')
bullet('Guests produce no console errors and no /auth/me request; admin session survives reload.', 'Console: ')
bullet('Public and admin API payloads inspected for flag values/hashes/salts (none); production bundle grepped for all seeded flags and secrets (none).', 'Leak audit: ')

# ------------------------------------------------------------------ 12 gaps
doc.add_heading('12. Known gaps', level=1)
table(
    ['Area', 'Gap', 'Impact / next step'],
    [
        ('Files', 'Uploads are written to local disk under UPLOAD_DIR; no S3/object-storage adapter ships.', 'Mount the directory on a persistent volume or add a storage adapter.'),
        ('Mail', 'Email goes through a console logger or a JSON webhook (MAIL_TRANSPORT); no SMTP client is bundled.', 'Point MAIL_WEBHOOK_URL at a relay such as Postmark/SES in production.'),
        ('Audit', 'Wrong attempts are stored as length + salted hash + optional 8-char prefix, never plaintext.', 'Acceptable; disable WRONG_ATTEMPT_DISPLAY_PREFIX if prefix display is too revealing.'),
        ('Session', 'With a valid cookie but cleared localStorage, the user appears signed out until next sign-in (the httpOnly cookie cannot be probed cheaply without the 401 console noise).', 'Acceptable trade-off; document it for support.'),
        ('Database', 'Only SQLite has been exercised; PostgreSQL is intended but untested.', 'Run migrations + tests against Postgres before production.'),
        ('Console', 'React Router v7 future-flag warnings may appear in the dev console.', 'Opt into the v7 flags or accept until upgrading.'),
        ('Mobile perf', 'Aurora paused on touch devices; below-fold sections mount on intent; admin tables scroll horizontally from md up.', 'Deliberate trade-offs; revisit with production data.'),
        ('Dev data', 'The dev database carries a live demo event, three demo teams and password DemoPass123! for demo users.', 'Run npm run reset:dev -- --yes --demo for a fresh demo state before publishing.'),
    ],
    widths=[2.4, 8.4, 5.8],
)

# ------------------------------------------------------------------ 13 rules
doc.add_heading('13. Rules to preserve when continuing', level=1)
numbered('All branding, copy and visual assets are original. The product name lives only in frontend/src/lib/brand.ts (plus seed env for the flag prefix). Do not copy SoterCTF or any third-party assets.', 'Originality: ')
numbered('Never store or return plaintext flags. Flag values stay as salted SHA-256 hashes; no API response (public or admin) may include a flag value, hash or salt. Keep timing-safe comparison.', 'Answer-key invariant: ')
numbered('No cross-imports between frontend and backend. Any new capability crosses the HTTP boundary and is documented in backend/API.md in the same change.', 'One boundary: ')
numbered('Colors, spacing, type and motion come from src/styles/tokens.css and docs/design-rules.md. Do not introduce orphan hex values or a second accent.', 'Design tokens: ')
numbered('Keep the wrong/duplicate submission contract (200 {correct:false} vs 409 {correct:true,duplicate:true}); the UI depends on it.', 'Submission contract: ')
numbered('Do not invent dependencies. The current stack is intentionally limited (React, Router, Query, Zustand, Motion, GSAP, Tailwind; Express, Prisma, zod, JWT, bcryptjs).', 'Dependencies: ')
numbered('Every change should be verified: backend tests, both typechecks, production build, and a browser pass for UI changes. Keep Lighthouse ≥ 90 on the landing page.', 'Verification: ')
numbered('Maintain accessibility floors (AA contrast, labels, focus management, reduced motion) and the skip link.', 'Accessibility: ')

# ------------------------------------------------------------------ 14 key files
doc.add_heading('14. Where to look', level=1)
table(
    ['Concern', 'File(s)'],
    [
        ('HTTP contract', 'backend/API.md'),
        ('Server bootstrap / middleware', 'backend/src/app.ts, backend/src/server.ts, backend/src/middleware/'),
        ('Auth / JWT / cookies', 'backend/src/modules/auth/, backend/src/utils/jwt.ts'),
        ('Flag hashing / verification', 'backend/src/utils/hash.ts'),
        ('Submission + scoring', 'backend/src/modules/submissions/, backend/src/utils/scoring.ts'),
        ('Scoreboard aggregation', 'backend/src/modules/scoreboard/'),
        ('Admin endpoints', 'backend/src/modules/admin/'),
        ('Database schema / seed', 'backend/prisma/schema.prisma, backend/prisma/seed.ts'),
        ('Env validation', 'backend/src/config/env.ts'),
        ('Typed API client', 'frontend/src/api/'),
        ('Session bootstrap + actions', 'frontend/src/hooks/useAuth.ts, frontend/src/store/auth.ts'),
        ('Routing + guards', 'frontend/src/routes.tsx, frontend/src/components/auth/'),
        ('Design tokens', 'frontend/src/styles/tokens.css, frontend/tailwind.config.ts'),
        ('Brand constant', 'frontend/src/lib/brand.ts'),
        ('Landing page / perf deferral', 'frontend/src/features/landing/LandingPage.tsx, Hero.tsx, BelowFold.tsx'),
        ('Dialog/Toast primitives', 'frontend/src/components/ui/Modal.tsx, Toast.tsx'),
        ('Admin UI', 'frontend/src/features/admin/, frontend/src/pages/Admin.tsx'),
        ('Design rules', 'docs/design-rules.md'),
        ('Setup / gaps', 'README.md'),
    ],
    widths=[6.4, 10.2],
)

# ------------------------------------------------------------------ 15 seed
doc.add_heading('15. Seed data and access', level=1)
bullet('Admin: admin@yourctf.local / ChangeMe123! (from backend/.env.example). Change these before any real deployment.', 'Credentials: ')
bullet('One published event ("YourCTF Open 2026"), 6 categories (Web, Crypto, Pwn, Reverse, Forensics, Misc) and 12 challenges with flags across all difficulties.', 'Content: ')
bullet('npm run seed -- --demo adds six players (pixel, byte, raven, nova, cipher, ghost) on three teams with solved challenges, so the podium, chart and board render with real data. Demo password: DemoPass123!.', 'Demo population: ')
bullet('Category slugs are used by the challenge filter; event teamMaxSize drives team capacity; the event scoring mode defaults to STATIC with minimum 100 and decay threshold 40.', 'Notes: ')
p('To reset to a clean state: stop the API and run npm run reset:dev -- --yes --demo (it refuses production and non-file: databases), or delete backend/prisma/dev.db and run npm run prisma:migrate && npm run seed -- --demo.')

# Final line
doc.add_paragraph().paragraph_format.space_before = Pt(10)
p('End of handoff document.', italic=True, size=9, color=GREY, align=WD_ALIGN_PARAGRAPH.CENTER)

doc.save('D:/ctf platform/YourCTF-Handoff.docx')
print('written')
