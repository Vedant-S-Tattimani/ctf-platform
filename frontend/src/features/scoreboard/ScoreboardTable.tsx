import { Link } from 'react-router-dom';
import type { ScoreboardEntry } from '@/api/types';
import { Avatar } from '@/components/ui/Avatar';
import { Badge } from '@/components/ui/Badge';
import { EmptyState } from '@/components/ui/EmptyState';
import { buttonVariants } from '@/components/ui/Button';
import { Skeleton } from '@/components/ui/Skeleton';
import { formatCompactUTC, formatCount, formatPoints } from '@/lib/format';
import { cn } from '@/lib/utils';

interface ScoreboardTableProps {
  entries: ScoreboardEntry[];
  scope: 'teams' | 'users';
  highlightId: string | null;
  isPending: boolean;
}

const rankLabel = (rank: number) => String(rank).padStart(2, '0');
const scopeNoun = (scope: 'teams' | 'users') => (scope === 'teams' ? 'Team' : 'Player');

export function ScoreboardTable({ entries, scope, highlightId, isPending }: ScoreboardTableProps) {
  if (isPending) {
    return (
      <div className="flex flex-col" aria-label="Loading scoreboard">
        {Array.from({ length: 6 }, (_, index) => (
          <div key={index} className="border-b border-hairline py-4">
            <Skeleton className="h-6" />
          </div>
        ))}
      </div>
    );
  }

  if (entries.length === 0) {
    return (
      <EmptyState
        className="mt-6"
        title="No solves yet"
        description="The board starts moving with the first flag. Open the challenge list and put the first points on the board."
        action={
          <Link to="/challenges" className={buttonVariants('primary', 'sm')}>
            Browse challenges
          </Link>
        }
      />
    );
  }

  const href = (id: string) => (scope === 'teams' ? `/teams/${id}` : `/users/${id}`);
  const isHighlighted = (id: string) => id === highlightId;

  return (
    <>
      <table className="hidden w-full border-collapse type-small md:table">
        <caption className="sr-only">{scopeNoun(scope)} scoreboard ranked by points</caption>
        <thead>
          <tr className="text-muted">
            <th scope="col" className="w-16 py-3 pr-4 text-right type-label">
              Rank
            </th>
            <th scope="col" className="py-3 pr-4 text-left type-label">
              {scopeNoun(scope)}
            </th>
            {scope === 'teams' && (
              <th scope="col" className="w-24 py-3 pr-4 text-right type-label">
                Members
              </th>
            )}
            <th scope="col" className="w-20 py-3 pr-4 text-right type-label">
              Solves
            </th>
            <th scope="col" className="w-44 py-3 pr-4 text-right type-label">
              Last solve
            </th>
            <th scope="col" className="w-24 py-3 text-right type-label">
              Points
            </th>
          </tr>
        </thead>
        <tbody>
          {entries.map((entry) => {
            const highlighted = isHighlighted(entry.id);
            return (
              <tr
                key={entry.id}
                className={cn(
                  'border-t border-hairline',
                  highlighted && 'band-tint bg-accent-faint',
                )}
              >
                <td className="py-3 pr-4 text-right">
                  <span
                    className={cn(
                      'nums font-mono',
                      entry.rank <= 3 ? 'font-semibold text-accent-strong' : 'text-muted',
                    )}
                  >
                    {rankLabel(entry.rank)}
                  </span>
                </td>
                <th scope="row" className="py-3 pr-4 text-left font-normal">
                  <Link
                    to={href(entry.id)}
                    className="group flex items-center gap-3 text-primary"
                  >
                    <Avatar name={entry.name} src={entry.avatarUrl} size="sm" />
                    <span className="truncate font-medium transition-colors duration-instant group-hover:text-accent-strong">
                      {entry.name}
                    </span>
                    {highlighted && <Badge tone="accent">You</Badge>}
                  </Link>
                </th>
                {scope === 'teams' && (
                  <td className="py-3 pr-4 text-right nums text-secondary">
                    {entry.memberCount ?? '—'}
                  </td>
                )}
                <td className="py-3 pr-4 text-right nums text-secondary">{entry.solveCount}</td>
                <td className="py-3 pr-4 text-right nums text-muted">
                  {entry.lastSolveAt ? formatCompactUTC(entry.lastSolveAt) : '—'}
                </td>
                <td className="py-3 text-right nums font-mono font-semibold text-primary">
                  {formatPoints(entry.points)}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>

      <ol className="md:hidden">
        {entries.map((entry) => (
          <li
            key={entry.id}
            className={cn(
              'border-b border-hairline last:border-b-0',
              isHighlighted(entry.id) && 'band-tint bg-accent-faint',
            )}
          >
            <Link to={href(entry.id)} className="flex items-center gap-3 py-3">
              <span
                className={cn(
                  'nums w-7 shrink-0 text-center font-mono type-small',
                  entry.rank <= 3 ? 'font-semibold text-accent-strong' : 'text-muted',
                )}
              >
                {rankLabel(entry.rank)}
              </span>
              <Avatar name={entry.name} src={entry.avatarUrl} size="sm" />
              <span className="min-w-0 flex-1">
                <span className="flex items-center gap-2">
                  <span className="truncate font-medium text-primary">{entry.name}</span>
                  {isHighlighted(entry.id) && <Badge tone="accent">You</Badge>}
                </span>
                <span className="type-small text-muted">
                  {formatCount(entry.solveCount, 'solve')}
                  {scope === 'teams' &&
                    entry.memberCount !== null &&
                    ` · ${formatCount(entry.memberCount, 'member')}`}
                </span>
              </span>
              <span className="shrink-0 text-right">
                <span className="block nums font-mono font-semibold text-primary">
                  {formatPoints(entry.points)}
                </span>
                <span className="type-small text-muted">pts</span>
              </span>
            </Link>
          </li>
        ))}
      </ol>
    </>
  );
}
