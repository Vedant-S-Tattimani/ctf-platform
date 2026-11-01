import { useQuery } from '@tanstack/react-query';
import { lazy, Suspense } from 'react';
import { Link } from 'react-router-dom';
import { scoreboardApi } from '@/api/scoreboard';
import { EventStatus } from '@/components/events/EventStatus';
import Magnet from '@/components/reactbits/Magnet';
import { buttonVariants } from '@/components/ui/Button';
import { useCurrentEvent } from '@/features/events/queries';
import { useAuth } from '@/hooks/useAuth';
import { usePrefersCoarsePointer, usePrefersReducedMotion } from '@/hooks/usePrefersReducedMotion';
import { formatCount } from '@/lib/format';
import { ScoreSpine } from './ScoreSpine';

const ParticleField = lazy(() => import('@/components/reactbits/ParticleField'));

export function Hero() {
  const { isAuthenticated } = useAuth();
  const reducedMotion = usePrefersReducedMotion();
  const coarsePointer = usePrefersCoarsePointer();

  const event = useCurrentEvent();
  const board = useQuery({
    queryKey: ['scoreboard', 'teams', 'landing'],
    queryFn: () => scoreboardApi.list({ scope: 'teams', limit: 100 }),
    staleTime: 30_000,
  });

  const entries = board.data?.entries ?? [];
  const solves = entries.reduce((total, entry) => total + entry.solveCount, 0);

  return (
    <section className="relative isolate overflow-hidden">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 -z-20"
        style={{
          background:
            'radial-gradient(55% 50% at 15% 0%, oklch(0.75 0.14 292 / 0.1), transparent 70%), radial-gradient(45% 40% at 88% 10%, oklch(0.8 0.1 200 / 0.09), transparent 70%)',
        }}
      />
      {reducedMotion || coarsePointer ? (
        /* Static stand-in for the field: the same scatter, drawn with gradients
           and frozen. No canvas, no animation frame, no motion. */
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 -z-10 opacity-[0.4]"
          style={{
            backgroundImage:
              'radial-gradient(circle at center, oklch(0.62 0.19 258 / 0.5) 0 1.5px, transparent 2px), radial-gradient(circle at center, oklch(0.6 0.2 292 / 0.4) 0 1.5px, transparent 2px)',
            backgroundSize: '168px 168px, 224px 224px',
            backgroundPosition: '0 0, 84px 112px',
          }}
        />
      ) : (
        <Suspense fallback={null}>
          <div aria-hidden className="pointer-events-none absolute inset-0 -z-10">
            <ParticleField />
          </div>
        </Suspense>
      )}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 bottom-0 -z-10 h-40 bg-gradient-to-b from-transparent to-canvas"
      />

      <div className="mx-auto grid min-h-[calc(100svh-4rem)] max-w-container content-center gap-12 px-4 pb-20 pt-14 sm:px-6 sm:pt-20 lg:grid-cols-[minmax(0,1fr)_22rem] lg:items-center lg:gap-16 lg:pb-24">
        <div className="flex flex-col items-start gap-6">
          <div className="flex min-h-8 items-center">
            {event.isPending ? (
              <span aria-hidden className="h-8 w-44 animate-pulse rounded-pill bg-elevated" />
            ) : (
              <EventStatus event={event.data?.event} withCount />
            )}
          </div>

          <h1 className="max-w-[17ch] text-[clamp(2.75rem,7vw,5.5rem)] font-medium leading-[1.02] tracking-[-0.035em] text-primary">
            Every flag moves the <span className="text-accent-strong">board.</span>
          </h1>

          <p className="max-w-measure text-lg leading-relaxed text-secondary">
            Salted-flag scoring, live team standings and a challenge board that stays readable
            under pressure — for organizers who run the room and teams who work the targets.
          </p>

          <div className="flex flex-wrap items-center gap-3">
            <Magnet
              magnetStrength={0.35}
              maxOffset={6}
              disabled={coarsePointer}
              wrapperClassName="inline-block"
            >
              <Link
                to={isAuthenticated ? '/challenges' : '/register'}
                className={buttonVariants('primary', 'lg')}
              >
                {isAuthenticated ? 'Browse challenges' : 'Create your account'}
              </Link>
            </Magnet>
            <Link to="/scoreboard" className={buttonVariants('secondary', 'lg')}>
              View scoreboard
            </Link>
          </div>

          <div className="flex min-h-6 items-center">
            {board.isPending ? (
              <span aria-hidden className="h-4 w-56 animate-pulse rounded-pill bg-elevated" />
            ) : (
              <p className="type-small text-muted">
                Built for teams
                {entries.length > 0 && ` · ${formatCount(entries.length, 'team')} ranked`}
                {solves > 0 && ` · ${formatCount(solves, 'flag')} captured`}
              </p>
            )}
          </div>
        </div>

        <ScoreSpine entries={entries} pending={board.isPending} />
      </div>
    </section>
  );
}
