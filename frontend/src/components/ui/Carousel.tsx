import { useCallback, useEffect, useRef, useState, type ReactNode } from 'react';
import { Icon } from '@/lib/icons';
import { cn } from '@/lib/utils';

interface CarouselProps {
  label: string;
  children: ReactNode[];
  className?: string;
  /** Width each slide claims on the rail, as a CSS flex-basis. */
  itemClassName?: string;
}

/**
 * Scroll-snap rail with round prev/next controls. Native scrolling keeps
 * touch, trackpad and keyboard behaviour; the buttons only nudge the scroll
 * position, so there is no index state to fall out of sync.
 */
export function Carousel({ label, children, className, itemClassName }: CarouselProps) {
  const trackRef = useRef<HTMLUListElement>(null);
  const total = children.length;
  const [edges, setEdges] = useState({ start: true, end: false });
  const [index, setIndex] = useState(1);

  const measure = useCallback(() => {
    const track = trackRef.current;
    if (!track) return;
    const max = track.scrollWidth - track.clientWidth;
    const first = track.firstElementChild as HTMLElement | null;
    const step = first ? first.offsetWidth + 24 : track.clientWidth * 0.8;
    setEdges({
      start: track.scrollLeft <= 2,
      end: track.scrollLeft >= max - 2,
    });
    setIndex(Math.min(total, Math.floor(track.scrollLeft / step) + 1));
  }, [total]);

  useEffect(() => {
    measure();
    const track = trackRef.current;
    if (!track) return;
    const observer = new ResizeObserver(measure);
    observer.observe(track);
    return () => observer.disconnect();
  }, [measure, children.length]);

  const nudge = (direction: -1 | 1) => {
    const track = trackRef.current;
    if (!track) return;
    const first = track.firstElementChild as HTMLElement | null;
    const step = first ? first.offsetWidth + 24 : track.clientWidth * 0.8;
    track.scrollBy({ left: direction * step, behavior: 'smooth' });
  };

  return (
    <div
      role="group"
      aria-roledescription="carousel"
      aria-label={label}
      className={cn('min-w-0', className)}
    >
      <div className="mb-4 flex items-center justify-between gap-4">
        <p aria-hidden className="type-mono text-muted">
          <span className={cn('transition-opacity duration-instant', index > 1 ? 'opacity-100' : 'opacity-40')}>
            {String(index).padStart(2, '0')}
          </span>
          <span className="px-1 opacity-40">/</span>
          <span className={cn('transition-opacity duration-instant', index < total ? 'opacity-100' : 'opacity-40')}>
            {String(total).padStart(2, '0')}
          </span>
        </p>
        <div className="flex gap-2">
          <RoundButton
            label="Previous"
            icon="arrow-left"
            disabled={edges.start}
            onClick={() => nudge(-1)}
          />
          <RoundButton
            label="Next"
            icon="arrow-right"
            disabled={edges.end}
            onClick={() => nudge(1)}
          />
        </div>
      </div>

      <ul
        ref={trackRef}
        onScroll={measure}
        tabIndex={0}
        className={cn(
          'snap-x-mandatory no-scrollbar flex gap-6 overflow-x-auto scroll-smooth pb-2',
          'motion-reduce:scroll-auto',
        )}
      >
        {children.map((child, index) => (
          <li
            key={index}
            className={cn('snap-item shrink-0 basis-[85%] sm:basis-[58%] lg:basis-[38%]', itemClassName)}
          >
            {child}
          </li>
        ))}
      </ul>
    </div>
  );
}

function RoundButton({
  label,
  icon,
  disabled,
  onClick,
}: {
  label: string;
  icon: 'arrow-left' | 'arrow-right';
  disabled: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      disabled={disabled}
      onClick={onClick}
      className={cn(
        'grid size-10 place-items-center rounded-pill border border-hairline bg-surface text-secondary',
        'transition-[color,border-color,box-shadow,opacity] duration-instant',
        'hover:border-strong hover:text-primary hover:shadow-soft',
        'disabled:pointer-events-none disabled:opacity-40',
      )}
    >
      <Icon name={icon} size={17} />
    </button>
  );
}
