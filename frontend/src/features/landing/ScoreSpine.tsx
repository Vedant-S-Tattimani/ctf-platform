import { Link } from 'react-router-dom';
import type { ScoreboardEntry } from '@/api/types';
import { formatPoints } from '@/lib/format';

interface ScoreSpineProps {
  entries: ScoreboardEntry[];
  pending: boolean;
}

/** The landing's single standings surface: ruled rows, no cards. */
export function ScoreSpine({ entries, pending }: ScoreSpineProps) {
  const top = entries.slice(0, 5);

  return (
    <div className="rounded-lg border border-hairline bg-surface">
      <div className="flex items-center justify-between gap-3 border-b border-hairline px-5 py-3.5">
        <p className="type-label text-muted">Live standings</p>
        <Link
          to="/scoreboard"
          className="type-small text-secondary transition-colors duration-instant hover:text-primary"
        >
          Full board →
        </Link>
      </div>

      {pending ? (
        <div aria-hidden>
          {Array.from({ length: 5 }).map((_, index) => (
            <div
              key={index}
              className="grid grid-cols-[1.75rem_minmax(0,1fr)_auto] items-baseline gap-3 border-b border-hairline px-5 py-3 last:border-b-0"
            >
              <span className="h-4 w-4 animate-pulse rounded-sm bg-elevated" />
              <span className="h-4 w-32 max-w-full animate-pulse rounded-sm bg-elevated" />
              <span className="h-4 w-10 animate-pulse rounded-sm bg-elevated" />
            </div>
          ))}
        </div>
      ) : top.length === 0 ? (
        <p className="px-5 py-6 type-small text-muted">
          No solves yet. The first flag sets the pace.
        </p>
      ) : (
        <ol>
          {top.map((entry) => (
            <li
              key={entry.id}
              className="grid grid-cols-[1.75rem_minmax(0,1fr)_auto] items-baseline gap-3 border-b border-hairline px-5 py-3 last:border-b-0"
            >
              <span className="nums type-small text-muted">
                {String(entry.rank).padStart(2, '0')}
              </span>
              <span className="truncate font-medium text-primary">{entry.name}</span>
              <span className="nums type-small text-accent-strong">
                {formatPoints(entry.points)}
              </span>
            </li>
          ))}
        </ol>
      )}
    </div>
  );
}
