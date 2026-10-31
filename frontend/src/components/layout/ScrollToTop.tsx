import { useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';

export function ScrollToTop() {
  const { pathname, hash } = useLocation();
  const previous = useRef<string | null>(null);

  useEffect(() => {
    const from = previous.current;
    previous.current = pathname;

    if (hash) {
      const id = decodeURIComponent(hash.slice(1));
      const frame = requestAnimationFrame(() => {
        document.getElementById(id)?.scrollIntoView({ block: 'start' });
      });
      return () => cancelAnimationFrame(frame);
    }

    // The split challenge board swaps the panel in place at lg; jumping to the
    // top there would throw away the reader's position in the list.
    const splitBoard =
      from !== null &&
      from !== pathname &&
      from.startsWith('/challenges') &&
      pathname.startsWith('/challenges') &&
      window.matchMedia('(min-width: 1024px)').matches;
    if (splitBoard) return;

    window.scrollTo(0, 0);
  }, [pathname, hash]);

  return null;
}
