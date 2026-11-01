import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import type { EventState, PublicEvent } from '@/api/types';
import { formatCompactUTC, formatCount, formatCountdown } from '@/lib/format';
import { cn } from '@/lib/utils';

const STATE_META: Record<
  EventState,
  { label: string; dot: string; chip: string; heading: string }
> = {
  live: {
    label: 'Live',
    dot: 'bg-accent',
    chip: 'border-accent bg-accent-faint text-accent-strong',
    heading: 'text-accent-strong',
  },
  upcoming: {
    label: 'Upcoming',
    dot: 'bg-warning',
    chip: 'border-warning bg-warning-faint text-warning',
    heading: 'text-warning',
  },
  ended: {
    label: 'Ended',
    dot: 'bg-muted',
    chip: 'border-subtle bg-elevated text-secondary',
    heading: 'text-secondary',
  },
};

function timingLine(event: PublicEvent): string {
  if (event.state === 'live') {
    return event.endsAt ? `Ends ${formatCompactUTC(event.endsAt)}` : 'Ends when the board closes';
  }
  if (event.state === 'upcoming') {
    return event.startsAt ? `Starts ${formatCompactUTC(event.startsAt)}` : 'Starts soon';
  }
  return event.endsAt ? `Ended ${formatCompactUTC(event.endsAt)}` : 'Event closed';
}

function countdownLabel(event: PublicEvent, now: number): string | null {
  if (event.state === 'live' && event.endsAt) return `Ends in ${formatCountdown(event.endsAt, now)}`;
  if (event.state === 'upcoming' && event.startsAt) {
    return `Starts in ${formatCountdown(event.startsAt, now)}`;
  }
  return null;
}

function useTick(active: boolean): number {
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    if (!active) return;
    const timer = window.setInterval(() => setNow(Date.now()), 30_000);
    return () => window.clearInterval(timer);
  }, [active]);

  return now;
}

interface EventStatusProps {
  event: PublicEvent | null | undefined;
  variant?: 'chip' | 'panel' | 'line';
  /** Adds the published challenge count to the chip, as on the landing hero. */
  withCount?: boolean;
  className?: string;
}

/**
 * The one place the shell renders event state. Everything comes from
 * /events/current, so a chip can never claim "LIVE" for an unpublished event.
 */
export function EventStatus({
  event,
  variant = 'chip',
  withCount = false,
  className,
}: EventStatusProps) {
  const now = useTick(Boolean(event) && variant !== 'chip' && event?.state !== 'ended');
  if (!event) return null;

  const meta = STATE_META[event.state];
  const timing = timingLine(event);

  if (variant === 'chip') {
    const countLabel = formatCount(event.challengeCount, 'challenge');
    return (
      <Link
        to="/challenges"
        aria-label={`${meta.label} event ${event.name}. ${withCount ? `${countLabel}. ` : ''}${timing}.`}
        className={cn(
          'group relative inline-flex h-8 items-center gap-2 rounded-pill border px-3 type-small',
          'transition-colors duration-instant hover:border-strong',
          'after:absolute after:-inset-y-2 after:inset-x-0 after:content-[""]',
          meta.chip,
          className,
        )}
      >
        <span aria-hidden className={cn('size-1.5 shrink-0 rounded-pill', meta.dot)} />
        <span className="font-semibold">{meta.label}</span>
        {withCount && (
          <>
            <span aria-hidden className="hidden text-muted min-[520px]:inline">
              ·
            </span>
            <span aria-hidden className="hidden whitespace-nowrap text-secondary min-[520px]:inline">
              {countLabel}
            </span>
          </>
        )}
        {/* The timing is the chip's widest part; below xl it pushes the shell's
            right-hand group past a 1024 viewport. */}
        <span aria-hidden className="hidden text-muted xl:inline">
          ·
        </span>
        <span aria-hidden className="hidden whitespace-nowrap text-secondary xl:inline">
          {timing}
        </span>
      </Link>
    );
  }

  if (variant === 'line') {
    return (
      <p className={cn('type-small text-secondary', className)}>
        <span className="font-semibold text-primary">{event.name}</span>
        <span className="text-muted"> · {meta.label} · {timing}</span>
      </p>
    );
  }

  const countdown = countdownLabel(event, now);

  return (
    <section
      aria-label="Current event"
      className={cn('rounded-lg border border-hairline bg-surface p-5', className)}
    >
      <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
        <span
          className={cn(
            'inline-flex h-7 items-center gap-2 rounded-pill border px-2.5 type-label normal-case tracking-normal',
            meta.chip,
          )}
        >
          <span aria-hidden className={cn('size-1.5 rounded-pill', meta.dot)} />
          {meta.label}
        </span>
        <span className="type-small text-muted">{timing}</span>
      </div>

      <p className={cn('type-h3 mt-3', meta.heading)}>{event.name}</p>
      {event.description && (
        <p className="mt-1 max-w-measure type-small text-secondary">{event.description}</p>
      )}

      <dl className="mt-4 grid grid-cols-3 gap-4 border-t border-hairline pt-4">
        <div>
          <dt className="type-label text-muted">Challenges</dt>
          <dd className="nums mt-1 text-primary">{event.challengeCount}</dd>
        </div>
        <div>
          <dt className="type-label text-muted">Team size</dt>
          <dd className="nums mt-1 text-primary">up to {event.teamMaxSize}</dd>
        </div>
        <div>
          <dt className="type-label text-muted">
            {event.state === 'live' ? 'Time left' : event.state === 'upcoming' ? 'Time to start' : 'Closed'}
          </dt>
          <dd className="nums mt-1 text-primary">
            {countdown ?? (event.endsAt ? formatCompactUTC(event.endsAt) : '—')}
          </dd>
        </div>
      </dl>
    </section>
  );
}
