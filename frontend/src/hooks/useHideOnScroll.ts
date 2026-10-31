import { useEffect, useState } from 'react';

/**
 * Chrome that gets out of the way: true once the reader is moving down past
 * `threshold`, false again on the way up or back at the top. While `locked` is
 * set (an overlay owns the screen) the bar never hides.
 */
export function useHideOnScroll(threshold = 96, locked = false) {
  const [hidden, setHidden] = useState(false);

  useEffect(() => {
    if (locked) {
      setHidden(false);
      return;
    }

    let last = window.scrollY;
    let frame = 0;

    const onScroll = () => {
      if (frame) return;
      frame = requestAnimationFrame(() => {
        frame = 0;
        const y = window.scrollY;
        const goingDown = y > last;
        last = y;
        setHidden(goingDown && y > threshold);
      });
    };

    window.addEventListener('scroll', onScroll, { passive: true });
    return () => {
      window.removeEventListener('scroll', onScroll);
      if (frame) cancelAnimationFrame(frame);
    };
  }, [threshold, locked]);

  return hidden;
}
