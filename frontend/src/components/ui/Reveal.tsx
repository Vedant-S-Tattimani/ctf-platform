import { useEffect, useRef, useState, type CSSProperties, type ElementType, type ReactNode } from 'react';
import { cn } from '@/lib/utils';

interface RevealProps {
  children: ReactNode;
  className?: string;
  /** Stagger in ms, handed to the CSS transition through --reveal-delay. */
  delay?: number;
  as?: ElementType;
  /** Animate the children instead of the container; pair with .stagger. */
  stagger?: boolean;
  /** Needed on Tailwind-reset lists, whose native list role is stripped. */
  role?: 'list';
}

/**
 * Fades and lifts its children in the first time they enter the viewport.
 * Under prefers-reduced-motion the global stylesheet neutralises .reveal, so the
 * content is simply visible; the observer still runs and costs nothing.
 */
export function Reveal({
  children,
  className,
  delay = 0,
  as: Tag = 'div',
  stagger = false,
  role,
}: RevealProps) {
  const ref = useRef<HTMLElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const node = ref.current;
    if (!node || visible) return;
    if (!('IntersectionObserver' in window)) {
      setVisible(true);
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) {
          setVisible(true);
          observer.disconnect();
        }
      },
      { rootMargin: '0px 0px -12% 0px', threshold: 0.05 },
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, [visible]);

  return (
    <Tag
      ref={ref}
      role={role}
      data-visible={visible ? 'true' : 'false'}
      className={cn(!stagger && 'reveal', !stagger && visible && 'reveal-visible', className)}
      style={delay ? ({ '--reveal-delay': `${delay}ms` } as CSSProperties) : undefined}
    >
      {children}
    </Tag>
  );
}
