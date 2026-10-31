/**
 * Performance probe for the landing page (and any other route passed to --only).
 *
 * Lighthouse is not a dependency of this repo, so this measures the inputs its
 * performance score is built from — FCP, LCP, total blocking time, CLS — plus
 * load timings, transfer weight and DOM size, under the same emulation
 * Lighthouse's mobile preset uses (4x CPU throttle, slow-4G network). Each
 * sample gets a fresh context, so every run is a cold-cache first visit.
 *
 *   node scripts/perf.mjs [--base=http://localhost:4173] [--runs=3] [--only=/]
 *
 * The bands are Lighthouse's published "good" marks. A run inside every band is
 * the evidence; the 0-100 score itself still needs a real Lighthouse pass.
 */
import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { chromium } from 'playwright';

const ROOT = path.resolve(import.meta.dirname, '..', '..');

const arg = (name, fallback) => {
  const hit = process.argv.find((a) => a.startsWith(`--${name}=`));
  return hit ? hit.split('=').slice(1).join('=') : fallback;
};

const base = arg('base', 'http://localhost:4173');
const runs = Number(arg('runs', 3));
const only = arg('only', '/')
  .split(',')
  .map((part) => part.trim())
  .filter(Boolean);

/** Lighthouse "good" thresholds, in ms except CLS. */
const GOOD = { fcp: 1800, lcp: 2500, tbt: 200, cls: 0.1 };

const PRESETS = {
  desktop: {
    viewport: { width: 1440, height: 900 },
    deviceScaleFactor: 1,
    cpuThrottle: 1,
    network: null,
  },
  mobile: {
    viewport: { width: 390, height: 844 },
    deviceScaleFactor: 3,
    cpuThrottle: 4,
    // slow-4G: 1.6 Mbps down, 750 Kbps up, 150 ms round trip.
    network: { latency: 150, downloadThroughput: 204_800, uploadThroughput: 96_000 },
  },
};

const median = (values) => {
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
};

/** Collects the buffered-observer metrics before any app code runs. */
const COLLECT = () => {
  const state = { lcp: 0, lcpNode: '', cls: 0, shifts: [], tbt: 0, tasks: [] };
  window.__perf = state;
  const label = (node) => {
    if (!node) return '';
    const el = node.nodeType === 1 ? node : node.parentElement;
    if (!el) return String(node.nodeName);
    const id = el.id ? `#${el.id}` : '';
    const cls = typeof el.className === 'string' ? `.${el.className.split(' ')[0]}` : '';
    return `${el.tagName.toLowerCase()}${id}${cls}`.slice(0, 60);
  };
  new PerformanceObserver((list) => {
    for (const entry of list.getEntries()) {
      state.lcp = entry.startTime;
      state.lcpNode = label(entry.element);
    }
  }).observe({ type: 'largest-contentful-paint', buffered: true });
  new PerformanceObserver((list) => {
    for (const entry of list.getEntries()) {
      if (entry.hadRecentInput) continue;
      state.cls += entry.value;
      state.shifts.push({ at: Math.round(entry.startTime), value: Number(entry.value.toFixed(4)), nodes: (entry.sources ?? []).map((s) => label(s.node)).filter(Boolean).slice(0, 3) });
    }
  }).observe({ type: 'layout-shift', buffered: true });
  new PerformanceObserver((list) => {
    for (const entry of list.getEntries()) {
      state.tbt += Math.max(0, entry.duration - 50);
      state.tasks.push({ at: Math.round(entry.startTime), duration: Math.round(entry.duration) });
    }
  }).observe({ type: 'longtask', buffered: true });
};

async function measureOnce(url, preset) {
  const browser = await chromium.launch();
  const context = await browser.newContext({
    viewport: preset.viewport,
    deviceScaleFactor: preset.deviceScaleFactor,
  });
  const page = await context.newPage();
  const cdp = await context.newCDPSession(page);
  await cdp.send('Emulation.setCPUThrottlingRate', { rate: preset.cpuThrottle });
  if (preset.network) {
    await cdp.send('Network.enable');
    await cdp.send('Network.emulateNetworkConditions', { offline: false, ...preset.network });
  }

  await page.addInitScript(COLLECT);
  await page.goto(url, { waitUntil: 'load' });
  // Walk the page so the lazily mounted sections are part of the measurement,
  // then return to the top: a hero-only number would understate the page.
  await page.evaluate(async () => {
    const step = window.innerHeight;
    for (let y = step; y < document.body.scrollHeight; y += step) {
      window.scrollTo(0, y);
      await new Promise((resolve) => requestAnimationFrame(resolve));
    }
    window.scrollTo(0, 0);
  });
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(1500);

  const metrics = await page.evaluate(() => {
    const nav = performance.getEntriesByType('navigation')[0];
    const paint = (name) => performance.getEntriesByName(name)[0]?.startTime ?? 0;
    const resources = performance.getEntriesByType('resource');
    const perf = window.__perf ?? { lcp: 0, lcpNode: '', cls: 0, shifts: [], tbt: 0, tasks: [] };
    return {
      ttfb: Math.round(nav?.responseEnd ?? 0),
      fcp: Math.round(paint('first-contentful-paint')),
      lcp: Math.round(perf.lcp),
      lcpNode: perf.lcpNode,
      cls: Number(perf.cls.toFixed(4)),
      shifts: perf.shifts.filter((s) => s.value > 0.001),
      tbt: Math.round(perf.tbt),
      tasks: perf.tasks.filter((t) => t.duration > 50),
      dcl: Math.round(nav?.domContentLoadedEventEnd ?? 0),
      load: Math.round(nav?.loadEventEnd ?? 0),
      dom: document.querySelectorAll('*').length,
      requests: resources.length + 1,
      transferred: Math.round(
        (nav?.encodedBodySize ?? 0) + resources.reduce((t, r) => t + r.encodedBodySize, 0),
      ),
    };
  });

  await browser.close();
  return metrics;
}

const rows = [];

for (const [name, preset] of Object.entries(PRESETS)) {
  for (const route of only) {
    const samples = [];
    for (let i = 0; i < runs; i += 1) {
      samples.push(await measureOnce(`${base}${route}`, preset));
    }
    const numeric = Object.keys(samples[0]).filter((key) => typeof samples[0][key] === 'number');
    const mid = samples[Math.floor(samples.length / 2)];
    const summary = Object.fromEntries(
      numeric.map((key) => [key, median(samples.map((s) => s[key]))]),
    );
    const band = {
      fcp: summary.fcp <= GOOD.fcp,
      lcp: summary.lcp <= GOOD.lcp,
      tbt: summary.tbt <= GOOD.tbt,
      cls: summary.cls <= GOOD.cls,
    };
    rows.push({ profile: name, route, ...summary, band, lcpNode: mid.lcpNode, shifts: mid.shifts, tasks: mid.tasks, samples });
    console.log(
      `${name.padEnd(7)} ${route.padEnd(12)} FCP ${String(summary.fcp).padStart(5)}ms  ` +
        `LCP ${String(summary.lcp).padStart(5)}ms (${mid.lcpNode})  ` +
        `TBT ${String(summary.tbt).padStart(4)}ms  CLS ${String(summary.cls).padEnd(6)}  ` +
        `load ${String(summary.load).padStart(5)}ms  ${(summary.transferred / 1024).toFixed(0)} KB/` +
        `${summary.requests} req  DOM ${summary.dom}  ` +
        `${Object.values(band).every(Boolean) ? 'in band' : Object.entries(band).filter(([, ok]) => !ok).map(([k]) => k).join(',')}`,
    );
    for (const shift of mid.shifts.slice(0, 6)) {
      console.log(`        shift ${String(shift.value).padEnd(7)} @${shift.at}ms  ${shift.nodes.join(', ')}`);
    }
    for (const task of mid.tasks.slice(0, 8)) {
      console.log(`        long task ${task.duration}ms @${task.at}ms`);
    }
  }
}

const out = path.join(ROOT, 'docs', 'perf', 'landing.json');
await mkdir(path.dirname(out), { recursive: true });
await writeFile(out, `${JSON.stringify({ base, runs, good: GOOD, rows }, null, 2)}\n`);
console.log(`\n${rows.length} profile/route rows -> docs/perf/landing.json`);
