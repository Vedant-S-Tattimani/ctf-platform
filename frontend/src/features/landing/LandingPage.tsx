import { lazy, Suspense, useEffect, useState } from 'react';
import { Hero } from './Hero';

const BelowFold = lazy(() => import('./BelowFold'));

const WAKE_EVENTS = ['scroll', 'pointerdown', 'keydown', 'touchstart'] as const;

/**
 * Below-fold sections mount on first intent so the hero paints against a
 * smaller main-thread budget. The timeout covers assistive tech that never
 * emits scroll/pointer/key events.
 */
function DeferredBelowFold() {
  const [active, setActive] = useState(false);

  useEffect(() => {
    if (active) return;
    const activate = () => setActive(true);
    for (const name of WAKE_EVENTS) {
      window.addEventListener(name, activate, { once: true, passive: true });
    }
    const timeout = window.setTimeout(activate, 1500);
    if (window.scrollY > 0) activate();

    return () => {
      for (const name of WAKE_EVENTS) window.removeEventListener(name, activate);
      window.clearTimeout(timeout);
    };
  }, [active]);

  return active ? (
    <Suspense fallback={<div aria-hidden className="min-h-svh" />}>
      <BelowFold />
    </Suspense>
  ) : (
    <div aria-hidden className="min-h-svh" />
  );
}

export function LandingPage() {
  return (
    <main>
      <Hero />
      <DeferredBelowFold />
    </main>
  );
}
