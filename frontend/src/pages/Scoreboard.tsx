import { useQuery } from '@tanstack/react-query';
import { useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { scoreboardApi } from '@/api/scoreboard';
import { PageShell } from '@/components/layout/PageShell';
import { Button } from '@/components/ui/Button';
import { ErrorState } from '@/components/ui/ErrorState';
import { Segmented } from '@/components/ui/Segmented';
import { Reveal } from '@/components/ui/Reveal';
import { Podium, PodiumSkeleton } from '@/features/scoreboard/Podium';
import { ScoreChart } from '@/features/scoreboard/ScoreChart';
import { ScoreboardTable } from '@/features/scoreboard/ScoreboardTable';
import { useAuth } from '@/hooks/useAuth';
import { errorMessage } from '@/lib/errors';
import { formatCount, formatDateTimeUTC, formatPoints } from '@/lib/format';
import { Icon } from '@/lib/icons';
import { cn } from '@/lib/utils';

const REFRESH_MS = 15_000;

type Scope = 'teams' | 'users';

export default function Scoreboard() {
  const [searchParams, setSearchParams] = useSearchParams();
  const scope: Scope = searchParams.get('scope') === 'users' ? 'users' : 'teams';
  const [live, setLive] = useState(true);
  const { user } = useAuth();

  const board = useQuery({
    queryKey: ['scoreboard', 'list', scope],
    queryFn: ({ signal }) => scoreboardApi.list({ scope, limit: 100 }, signal),
    refetchInterval: live ? REFRESH_MS : false,
  });

  const history = useQuery({
    queryKey: ['scoreboard', 'history'],
    queryFn: ({ signal }) => scoreboardApi.history({ scope: 'teams', limit: 5 }, signal),
    enabled: scope === 'teams',
    refetchInterval: live ? REFRESH_MS * 2 : false,
  });

  function setScope(next: Scope) {
    const params = new URLSearchParams(searchParams);
    if (next === 'users') params.set('scope', 'users');
    else params.delete('scope');
    setSearchParams(params, { replace: true });
  }

  const entries = board.data?.entries ?? [];
  const podiumEntries = entries.slice(0, 3);
  const highlightId = scope === 'teams' ? (user?.teamId ?? null) : (user?.id ?? null);
  const ownEntry = highlightId ? (entries.find((entry) => entry.id === highlightId) ?? null) : null;
  const updatedAt = board.dataUpdatedAt ? new Date(board.dataUpdatedAt).toISOString() : null;
  const scopeLabel = scope === 'teams' ? 'team' : 'player';
  const href = (id: string) => (scope === 'teams' ? `/teams/${id}` : `/users/${id}`);

  // The empty board already ships its own bordered state, so the card shell is
  // only added around real rows or the loading skeleton.
  const table = (
    <ScoreboardTable
      entries={entries}
      scope={scope}
      highlightId={highlightId}
      isPending={board.isPending}
    />
  );

  return (
    <PageShell
      title="Scoreboard"
      description={`Live standings for every ${scopeLabel} on the board, ranked by points.`}
      actions={
        <div className="flex items-center gap-3">
          <span
            aria-live="polite"
            className="hidden items-center gap-2 type-small text-muted sm:flex"
          >
            <span
              aria-hidden
              className={cn(
                'size-2 rounded-pill',
                live ? 'animate-pulse bg-success motion-reduce:animate-none' : 'bg-subtle',
              )}
            />
            {live ? 'Auto-refreshes every 15s' : 'Auto-refresh paused'}
          </span>
          <Button
            variant="secondary"
            size="sm"
            aria-pressed={live}
            onClick={() => setLive((current) => !current)}
          >
            <Icon name={live ? 'pause' : 'play'} size={16} />
            {live ? 'Pause' : 'Resume'}
          </Button>
        </div>
      }
    >
      <div className="flex flex-col gap-10">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <Segmented
            label="Leaderboard scope"
            value={scope}
            onChange={setScope}
            options={[
              { value: 'teams', label: 'Teams' },
              { value: 'users', label: 'Players' },
            ]}
          />
          <p className="w-full type-small text-muted sm:w-auto">
            {entries.length} ranked
            {updatedAt && ` · updated ${formatDateTimeUTC(updatedAt)}`}
          </p>
        </div>

        {board.isError ? (
          <ErrorState
            title="The scoreboard did not load"
            description={errorMessage(board.error)}
            onRetry={() => void board.refetch()}
          />
        ) : (
          <>
            {board.isPending ? (
              <PodiumSkeleton />
            ) : (
              entries.length > 0 && (
                <Podium entries={podiumEntries} scope={scope} highlightId={highlightId} />
              )
            )}

            {ownEntry && ownEntry.rank > 3 && (
              <section
                aria-label="Your position"
                className="band-tint flex flex-wrap items-center gap-x-4 gap-y-1 rounded-lg border border-accent bg-accent-faint px-4 py-3 shadow-soft"
              >
                <span className="type-label text-accent-strong">Your position</span>
                <span className="nums font-mono text-small text-muted">#{ownEntry.rank}</span>
                <Link
                  to={href(ownEntry.id)}
                  className="font-medium text-primary transition-colors duration-instant hover:text-accent-strong"
                >
                  {ownEntry.name}
                </Link>
                {scope === 'teams' && ownEntry.memberCount !== null && (
                  <span className="type-small text-muted">
                    {formatCount(ownEntry.memberCount, 'member')}
                  </span>
                )}
                <span className="ml-auto flex items-baseline gap-2">
                  <span className="nums font-mono font-semibold text-primary">
                    {formatPoints(ownEntry.points)}
                  </span>
                  <span className="type-small text-muted">pts</span>
                </span>
              </section>
            )}

            {scope === 'teams' && (board.isPending || entries.length > 0) && (
              <Reveal>
                <ScoreChart series={history.data?.series ?? []} isPending={history.isPending} />
              </Reveal>
            )}

            <Reveal>
              <section aria-labelledby="full-board-title">
                <div className="flex flex-wrap items-baseline justify-between gap-2 pb-4">
                  <h2 id="full-board-title" className="type-h3 text-primary">
                    Full board
                  </h2>
                  <span className="type-small text-muted">
                    Every {scopeLabel} with at least one solve
                  </span>
                </div>
                {board.isPending || entries.length > 0 ? (
                  <div className="overflow-hidden rounded-lg border border-hairline bg-surface px-4 py-2 shadow-card sm:px-6">
                    {table}
                  </div>
                ) : (
                  table
                )}
              </section>
            </Reveal>
          </>
        )}
      </div>
    </PageShell>
  );
}
