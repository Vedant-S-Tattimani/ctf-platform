/**
 * Screenshot harness for the re-skin loop.
 *
 *   node scripts/shoot.mjs --iter=01 [--base=http://localhost:4173] [--only=/,/challenges]
 *
 * Saves shots at 1440x900 and 390x844, in light and dark, to ../docs/shots/<iter>/
 * and writes a console-error report next to them.
 *
 *   --mode=steps|full|both   "steps" walks the page one viewport at a time so
 *                            scroll-triggered reveals actually render; "full" is a
 *                            stitched full-page shot (renders blank below the fold
 *                            on reveal-animated pages). Default: both.
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
const widths = [
  { name: '1440', value: { width: 1440, height: 900 } },
  { name: '390', value: { width: 390, height: 844 } },
];
const themes = arg('themes', 'light,dark').split(',');
const mode = arg('mode', 'both');

const targets = arg(
  'only',
  [
    '/',
    '/challenges',
    '/scoreboard',
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

const slug = (path) => (path === '/' ? 'home' : path.replace(/^\/|\/$/g, '').replace(/\//g, '-'));

const outDir = resolve(shotsRoot, iter);
mkdirSync(outDir, { recursive: true });

const browser = await chromium.launch();
const report = { base, iter, startedAt: new Date().toISOString(), pages: [] };

for (const path of targets) {
  for (const { name: widthName, value: viewport } of widths) {
    for (const theme of themes) {
      const context = await browser.newContext({
        viewport,
        deviceScaleFactor: 1,
        reducedMotion: 'no-preference',
      });
      await context.addInitScript(
        ([key, value]) => localStorage.setItem(key, value),
        [themeKey, theme],
      );

      const page = await context.newPage();
      const problems = [];
      page.on('console', (msg) => {
        if (msg.type() === 'error') problems.push(msg.text().slice(0, 300));
      });
      page.on('pageerror', (err) => problems.push(`pageerror: ${String(err).slice(0, 300)}`));

      const record = { path, width: widthName, theme, errors: [], overflowX: null, shots: [] };
      try {
        await page.goto(base + path, { waitUntil: 'networkidle', timeout: 30_000 });
        const overflowX = await page.evaluate(
          () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
        );
        record.overflowX = overflowX;

        if (mode !== 'full') {
          const steps = await page.evaluate(() =>
            Math.min(12, Math.ceil(document.body.scrollHeight / window.innerHeight)),
          );
          for (let i = 0; i < steps; i += 1) {
            await page.evaluate(
              (index) => window.scrollTo(0, index * window.innerHeight),
              i,
            );
            await page.waitForTimeout(450);
            const file = resolve(outDir, `${slug(path)}-${widthName}-${theme}-s${i + 1}.png`);
            await page.screenshot({ path: file });
            record.shots.push(`docs/shots/${iter}/${slug(path)}-${widthName}-${theme}-s${i + 1}.png`);
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
          const file = resolve(outDir, `${slug(path)}-${widthName}-${theme}-full.png`);
          await page.screenshot({ path: file, fullPage: true });
          record.shot = `docs/shots/${iter}/${slug(path)}-${widthName}-${theme}-full.png`;
        }
      } catch (err) {
        record.failed = String(err.message || err).slice(0, 200);
      }
      record.errors = [...new Set(problems)];
      report.pages.push(record);
      await context.close();
    }
  }
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
