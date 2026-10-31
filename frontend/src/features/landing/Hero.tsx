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
import { formatPoints } from '@/lib/format';
import { ScoreSpine } from './ScoreSpine';

const Aurora = lazy(() => import('@/components/reactbits/Aurora'));

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
            'radial-gradient(60% 55% at 18% 0%, oklch(0.7 0.18 292 / 0.16), transparent 70%), radial-gradient(50% 45% at 85% 8%, oklch(0.72 0.14 195 / 0.1), transparent 70%)',
        }}
      />
      {!reducedMotion && !coarsePointer && (
        <Suspense fallback={null}>
          <div aria-hidden className="pointer-events-none absolute inset-0 -z-10 opacity-50">
            <Aurora
              colorStops={['#7d68ff', '#2fb3c9', '#14182b']}
              amplitude={1.2}
              blend={0.5}
              speed={0.5}
              height={0.55}
              layers={2}
              glow={0.5}
              opacity={0.42}
              mouseInteraction={false}
              dpr={1}
            />
          </div>
        </Suspense>
      )}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 bottom-0 -z-10 h-40 bg-gradient-to-b from-transparent to-canvas"
      />

      <div className="mx-auto grid max-w-container gap-12 px-4 pb-20 pt-14 sm:px-6 sm:pt-20 lg:grid-cols-[minmax(0,1fr)_22rem] lg:items-center lg:gap-16 lg:pb-24">
        <div className="flex flex-col items-start gap-6">
          <div className="flex min-h-8 items-center">
            {event.isPending ? (
              <span aria-hidden className="h-8 w-44 animate-pulse rounded-pill bg-elevated" />
            ) : (
              <EventStatus event={event.data?.event} withCount />
            )}
          </div>

          <h1 className="max-w-[17ch] text-[clamp(2.75rem,7vw,5rem)] font-bold leading-[1.02] tracking-[-0.04em] text-primary">
            Every flag <span className="text-accent-strong">moves the board.</span>
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
                {entries.length > 0 &&
                  ` · ${entries.length} ${entries.length === 1 ? 'team' : 'teams'} ranked`}
                {solves > 0 && ` · ${formatPoints(solves)} flags captured`}
              </p>
            )}
          </div>
        </div>

        <ScoreSpine entries={entries} pending={board.isPending} />
      </div>
    </section>
  );
}
