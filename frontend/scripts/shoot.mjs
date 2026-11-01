/**
 * Screenshot harness for the re-skin loop.
 *
 *   node scripts/shoot.mjs --iter=01 [--base=http://localhost:4173] [--only=/,/challenges]
 *                          [--states=menu,palette,submit,modal] [--widths=1440,1024,768,390]
 *                          [--login=email:password]
 *
 * Saves shots in light and dark to ../docs/shots/<iter>/ and writes a console-error
 * report next to them. Default widths are 1440x900 and 390x844. With --login the
 * filenames gain an "-in" marker and the session cookie is set before the first
 * navigation.
 *
 *   --mode=steps|full|both   "steps" walks the page one viewport at a time so
 *                            scroll-triggered reveals actually render; "full" is a
 *                            stitched full-page shot, taken after the same pre-scroll
 *                            so revealed sections are not captured blank. Default: both.
 */
import { mkdirSync, writeFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright';

const here = dirname(fileURLToPath(import.meta.url));
const root = resolve(here, '..');
const shotsRoot = resolve(root, '../docs/shots');

const arg = (name, fallback) => {
  const hit = process.argv.find((a) => a.startsWith(`--${name}=`));
  return hit ? hit.slice(name.length + 3) : fallback;
};

const base = arg('base', 'http://localhost:4173');
const iter = arg('iter', 'manual');
const themeKey = arg('themeKey', 'yourctf.theme');
const widthPresets = {
  360: { width: 360, height: 800 },
  390: { width: 390, height: 844 },
  412: { width: 412, height: 915 },
  768: { width: 768, height: 1024 },
  1024: { width: 1024, height: 768 },
  1440: { width: 1440, height: 900 },
};
const widths = arg('widths', '1440,390')
  .split(',')
  .filter(Boolean)
  .map((name) => {
    const value = widthPresets[name];
    if (!value) throw new Error(`unknown --widths entry ${name} (try 360,390,412,768,1024,1440)`);
    return { name, value };
  });
const themes = arg('themes', 'light,dark').split(',');
const mode = arg('mode', 'both');

/**
 * Interaction states, captured with the page at the top of the document. A state
 * whose trigger is not present at this width (for example the mobile menu button
 * at 1440) is skipped rather than failed.
 */
const stateActions = {
  menu: (page) => page.getByRole('button', { name: 'Open menu' }).click({ timeout: 2500 }),
  palette: async (page) => {
    await page.keyboard.press('Control+k');
    await page.waitForSelector('[role="dialog"]', { timeout: 2500 });
  },
  /**
   * Exercises the wrong-answer path on a challenge panel: the value is not a
   * real flag, so the server answers 200 {correct:false} and nothing on the
   * board changes.
   */
  submit: async (page) => {
    const field = page.getByLabel('Flag', { exact: true });
    await field.scrollIntoViewIfNeeded();
    await field.fill('YourCTF{not-a-real-flag}');
    await page.getByRole('button', { name: 'Submit flag' }).click();
    await page.waitForTimeout(700);
  },
  /**
   * Opens the create-dialog on an admin listing so the form gets captured too.
   * Pages without such a button skip this state rather than failing.
   */
  modal: (page) => page.getByRole('button', { name: /^New / }).first().click({ timeout: 2500 }),
};
const states = arg('states', '')
  .split(',')
  .filter((name) => name in stateActions);

/**
 * `--login=email:password` signs the session in through the API before the
 * first navigation, so the cookie is on the context and the protected screens
 * are reachable. Filenames gain an `-in` marker so they never overwrite the
 * signed-out capture of the same route.
 */
const login = arg('login', '');
const authTag = login ? '-in' : '';

const targets = arg(
  'only',
  [
    '/',
    '/challenges',
    '/scoreboard',
    '/scoreboard?scope=users',
    '/teams',
    '/login',
    '/register',
    '/account',
    '/admin',
    '/no-such-page',
  ].join(','),
)
  .split(',')
  .filter(Boolean);

const slug = (path) => {
  const [pathname, query] = path.split('?');
  const name = pathname === '/' ? 'home' : pathname.replace(/^\/|\/$/g, '').replace(/\//g, '-');
  return query ? `${name}-${query.replace(/[^a-z0-9]+/gi, '-')}` : name;
};

const outDir = resolve(shotsRoot, iter);
mkdirSync(outDir, { recursive: true });

const browser = await chromium.launch();
const report = { base, iter, startedAt: new Date().toISOString(), pages: [] };

/**
 * One context per theme, so the session cookie is established once instead of
 * once per page: ~100 logins in a run trips the backend's login rate limiter and
 * the rest of the sweep silently captures signed-out screens. The theme itself is
 * read at boot, so it cannot be switched inside a context.
 */
for (const theme of themes) {
  const context = await browser.newContext({
    viewport: { width: 1440, height: 900 },
    deviceScaleFactor: 1,
    reducedMotion: 'no-preference',
  });
  await context.addInitScript(
    ([key, value]) => localStorage.setItem(key, value),
    [themeKey, theme],
  );

  if (login) {
    const split = login.indexOf(':');
    const response = await context.request.post(`${base}/api/v1/auth/login`, {
      data: {
        email: login.slice(0, split),
        password: login.slice(split + 1),
      },
    });
    if (!response.ok()) {
      throw new Error(`login failed: ${response.status()} ${await response.text()}`);
    }
  }

  for (const path of targets) {
    for (const { name: widthName, value: viewport } of widths) {
      const page = await context.newPage();
      await page.setViewportSize(viewport);
      const problems = [];
      page.on('console', (msg) => {
        if (msg.type() === 'error') problems.push(msg.text().slice(0, 300));
      });
      page.on('pageerror', (err) => problems.push(`pageerror: ${String(err).slice(0, 300)}`));

      const record = { path, width: widthName, theme, auth: login ? 'session' : 'guest', errors: [], overflowX: null, shots: [] };
      try {
        await page.goto(base + path, { waitUntil: 'networkidle', timeout: 30_000 });
        const overflowX = await page.evaluate(
          () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
        );
        record.overflowX = overflowX;

        if (mode !== 'full') {
          // The landing mounts its below-fold sections on first scroll, so the
          // step count is re-read at every position instead of once up front.
          for (let i = 0; i < 14; i += 1) {
            await page.evaluate(
              (index) => window.scrollTo(0, index * window.innerHeight),
              i,
            );
            await page.waitForTimeout(450);
            const file = resolve(outDir, `${slug(path)}${authTag}-${widthName}-${theme}-s${i + 1}.png`);
            await page.screenshot({ path: file });
            record.shots.push(`docs/shots/${iter}/${slug(path)}${authTag}-${widthName}-${theme}-s${i + 1}.png`);
            const done = await page.evaluate(
              () => window.scrollY + window.innerHeight >= document.body.scrollHeight - 4,
            );
            if (done) break;
          }
        }

        if (mode !== 'steps') {
          await page.evaluate(async () => {
            const step = Math.round(window.innerHeight * 0.8);
            for (let y = 0; y <= document.body.scrollHeight; y += step) {
              window.scrollTo(0, y);
              await new Promise((r) => setTimeout(r, 60));
            }
            window.scrollTo(0, 0);
            await new Promise((r) => setTimeout(r, 250));
          });
          const file = resolve(outDir, `${slug(path)}${authTag}-${widthName}-${theme}-full.png`);
          await page.screenshot({ path: file, fullPage: true });
          record.shot = `docs/shots/${iter}/${slug(path)}${authTag}-${widthName}-${theme}-full.png`;
        }

        // Interaction states come last: they leave the page in a changed state
        // (a rejected submission, an open sheet) and must not pollute the walk.
        for (const state of states) {
          const file = resolve(outDir, `${slug(path)}${authTag}-${widthName}-${theme}-${state}.png`);
          const label = `docs/shots/${iter}/${slug(path)}${authTag}-${widthName}-${theme}-${state}.png`;
          try {
            await stateActions[state](page);
            await page.waitForTimeout(400);
            await page.screenshot({ path: file });
            record.shots.push(label);
            await page.keyboard.press('Escape');
            await page.waitForTimeout(250);
          } catch {
            record.skipped = [...(record.skipped ?? []), state];
          }
        }
      } catch (err) {
        record.failed = String(err.message || err).slice(0, 200);
      }
      record.errors = [...new Set(problems)];
      report.pages.push(record);
      await page.close();
    }
  }
  await context.close();
}

await browser.close();
report.finishedAt = new Date().toISOString();
writeFileSync(resolve(outDir, 'report.json'), JSON.stringify(report, null, 2));

const failing = report.pages.filter((p) => p.failed || p.errors.length || (p.overflowX ?? 0) > 1);
console.log(
  `${report.pages.length} shots -> ${outDir}\n${failing.length} page/theme combinations with failures, console errors or horizontal overflow`,
);
for (const p of failing) {
  console.log(`  ${p.path} @${p.width} ${p.theme}: ${p.failed ?? ''} ${p.errors.join(' | ')}${p.overflowX > 1 ? ` overflowX=${p.overflowX}px` : ''}`);
}
