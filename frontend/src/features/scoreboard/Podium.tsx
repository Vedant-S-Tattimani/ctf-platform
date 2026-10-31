import { Link } from 'react-router-dom';
import type { ScoreboardEntry } from '@/api/types';
import { Avatar } from '@/components/ui/Avatar';
import { Badge } from '@/components/ui/Badge';
import { Skeleton } from '@/components/ui/Skeleton';
import { formatPoints } from '@/lib/format';
import { cn } from '@/lib/utils';

interface PodiumProps {
  entries: ScoreboardEntry[];
  scope: 'teams' | 'users';
  highlightId: string | null;
}

const rankLabel = (rank: number) => String(rank).padStart(2, '0');

/** Reserves the podium's footprint while the first board fetch is in flight. */
export function PodiumSkeleton() {
  return (
    <section aria-hidden aria-busy="true" className="border-y border-hairline">
      <div className="grid sm:grid-cols-[1.4fr_1fr]">
        <div className="flex flex-col gap-6 py-7 sm:pr-10">
          <Skeleton className="h-3.5 w-36" />
          <div className="flex items-center gap-4">
            <Skeleton className="size-14 rounded-pill" />
            <div className="min-w-0 flex-1">
              <Skeleton className="h-9 w-52 max-w-full" />
              <Skeleton className="mt-2 h-6 w-44 max-w-full" />
            </div>
          </div>
        </div>
        <div className="flex flex-col border-t border-hairline sm:border-l sm:border-t-0 sm:pl-10">
          {[0, 1].map((index) => (
            <div
              key={index}
              className="flex flex-1 items-center gap-4 border-b border-hairline py-5 last:border-b-0"
            >
              <Skeleton className="h-4 w-6" />
              <Skeleton className="size-10 rounded-pill" />
              <div className="min-w-0 flex-1">
                <Skeleton className="h-4 w-28 max-w-full" />
                <Skeleton className="mt-2 h-7 w-16" />
              </div>
              <Skeleton className="h-4 w-10" />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

export function Podium({ entries, scope, highlightId }: PodiumProps) {
  const [first, ...rest] = entries;
  if (!first) return null;
  const href = (id: string) => (scope === 'teams' ? `/teams/${id}` : `/users/${id}`);
  const label = scope === 'teams' ? 'team' : 'player';

  return (
    <section aria-labelledby="podium-title" className="border-y border-hairline">
      <h2 id="podium-title" className="sr-only">
        Top three
      </h2>
      <div className={cn('grid', rest.length > 0 && 'sm:grid-cols-[1.4fr_1fr]')}>
        <div className="flex flex-col gap-6 py-7 sm:pr-10">
          <p className="flex items-center gap-2 type-label text-muted">
            <span aria-hidden className="nums font-mono text-accent-strong">
              01
            </span>
            Leading {label}
          </p>
          <div className="flex items-center gap-4">
            <Avatar name={first.name} src={first.avatarUrl} size="lg" />
            <div className="min-w-0">
              <Link
                to={href(first.id)}
                className="block truncate type-h2 text-primary transition-colors duration-instant hover:text-accent-strong"
              >
                {first.name}
              </Link>
              <p className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 type-small text-muted">
                <span className="nums font-mono text-h3 text-accent-strong">
                  {formatPoints(first.points)}
                </span>
                <span>points</span>
                <span aria-hidden>·</span>
                <span>
                  {first.solveCount} {first.solveCount === 1 ? 'solve' : 'solves'}
                </span>
                {first.memberCount !== null && (
                  <>
                    <span aria-hidden>·</span>
                    <span>
                      {first.memberCount} {first.memberCount === 1 ? 'member' : 'members'}
                    </span>
                  </>
                )}
                {first.id === highlightId && <Badge tone="accent">You</Badge>}
              </p>
            </div>
          </div>
        </div>

        {rest.length > 0 && (
          <ol className="flex flex-col border-t border-hairline sm:border-l sm:border-t-0 sm:pl-10">
            {rest.slice(0, 2).map((entry) => (
              <li key={entry.id} className="flex-1 border-b border-hairline last:border-b-0">
                <Link
                  to={href(entry.id)}
                  className="group flex h-full items-center gap-4 py-5"
                >
                  <span className="nums w-6 shrink-0 font-mono type-small text-muted">
                    {rankLabel(entry.rank)}
                  </span>
                  <Avatar name={entry.name} src={entry.avatarUrl} size="md" />
                  <span className="min-w-0 flex-1">
                    <span className="block truncate font-medium text-primary group-hover:text-accent-strong">
                      {entry.name}
                      {entry.id === highlightId && (
                        <span className="ml-2 type-small text-accent-strong">You</span>
                      )}
                    </span>
                    <span className="type-small text-muted">
                      {entry.solveCount} {entry.solveCount === 1 ? 'solve' : 'solves'}
                    </span>
                  </span>
                  <span className="nums shrink-0 font-mono font-semibold text-primary">
                    {formatPoints(entry.points)}
                  </span>
                </Link>
              </li>
            ))}
          </ol>
        )}
      </div>
    </section>
  );
}
