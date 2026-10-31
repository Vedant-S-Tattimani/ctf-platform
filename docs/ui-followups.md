# UI follow-ups

Anything the re-skin could not land inside its loop budget, or that would have needed a backend
change. Add a dated entry with the page group, the gap, and why it is parked.

## 2026-11-01 · landing — the mobile performance gate is measured, not met

Phase 3 asks for Lighthouse 90+ mobile / 100 desktop. Lighthouse is not a dependency here and is
not on the allowed list for this re-skin, so `frontend/scripts/perf.mjs` measures the inputs its
performance score is built from, cold-cache, under Lighthouse's mobile emulation (4x CPU throttle,
slow-4G). Medians of three runs, `docs/perf/landing.json`:

| profile | FCP | LCP | TBT | CLS | critical weight | DOM |
|---|---|---|---|---|---|---|
| desktop 1440 | 148 ms | 308 ms | 0 ms | 0.0047 | 249 KB / 15 req | 469 |
| mobile 390 | 1828 ms | 2412 ms | 346 ms | 0 | 249 KB / 15 req | 469 |

Desktop sits inside every "good" band. Mobile does not: FCP and LCP are gated by the client-rendered
shell — 161 KB gz of JS has to arrive and execute before anything paints — and TBT is React mount
plus the deferred `BelowFold` chunk. The font preload took desktop CLS from 0.0466 to 0.0047 and
mobile from 0.0064 to 0; mobile blocking time measured anywhere between 228 ms and 367 ms across
runs, which is the spread of this harness on one machine rather than a regression. Nothing in the
allowed change set closes the remaining gap.

Two ways forward, both outside this phase's budget:

1. **Confirm the score before optimising further.** `npx lighthouse http://localhost:4173
   --preset=mobile --only=performance` needs a package that is not a repo dependency, so it is the
   user's call. The numbers above are the evidence; the 0-100 is not claimed anywhere.
2. **Prerender the hero into `index.html`.** A static shell (headline, subhead, CTA pills) outside
   `#root`, removed in `main.tsx` before `createRoot`, would move FCP/LCP to the HTML+CSS transfer
   (~22 KB) instead of the JS. It duplicates landing copy in two places, so it needs a decision
   about that drift before it is built.

## 2026-11-01 · landing — 768 px not re-shot this phase

Phase 3's loop captured 1440 and 390 in both themes. The tablet breakpoint is on the Phase 8
whole-site checklist (360/412/768/1024/1440) rather than re-proved here.

