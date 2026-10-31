import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { scoreboardApi } from '@/api/scoreboard';
import { teamsApi } from '@/api/teams';
import type { ScoreboardEntry } from '@/api/types';
import { PageShell } from '@/components/layout/PageShell';
import { Avatar } from '@/components/ui/Avatar';
import { buttonVariants } from '@/components/ui/Button';
import { Skeleton } from '@/components/ui/Skeleton';
import { TeamOnboarding } from '@/features/teams/TeamOnboarding';
import { TeamPanel } from '@/features/teams/TeamPanel';
import { useAuth } from '@/hooks/useAuth';
import { formatPoints } from '@/lib/format';
import { cn } from '@/lib/utils';

export default function Teams() {
  const { user, status, isAuthenticated } = useAuth();

  const team = useQuery({
    queryKey: ['teams', 'me'],
    queryFn: teamsApi.me,
    enabled: isAuthenticated,
  });

  const top = useQuery({
    queryKey: ['scoreboard', 'teams', 'discover'],
    queryFn: ({ signal }) => scoreboardApi.list({ scope: 'teams', limit: 10 }, signal),
  });

  return (
    <PageShell title="Teams" description="Compete as a crew: one roster, one score on the board.">
      <div className="flex flex-col gap-12">
        {isAuthenticated ? (
          team.isPending ? (
            <div className="flex flex-col gap-6" aria-label="Loading your team">
              <Skeleton className="h-24" />
              <Skeleton className="h-44" />
            </div>
          ) : team.data?.team ? (
            <TeamPanel team={team.data.team} />
          ) : (
            <TeamOnboarding />
          )
        ) : status === 'loading' ? (
          <Skeleton className="h-40" />
        ) : (
          <GuestInvite />
        )}

        <TopTeams
          entries={top.data?.entries ?? []}
          isPending={top.isPending}
          highlightId={user?.teamId ?? null}
        />
      </div>
    </PageShell>
  );
}

function GuestInvite() {
  return (
    <section aria-labelledby="bring-crew-title" className="border-y border-hairline py-8 sm:py-10">
      <div className="grid gap-6 lg:grid-cols-[1fr_auto] lg:items-end">
        <div>
          <h2 id="bring-crew-title" className="type-h2 text-primary">
            Bring your crew
          </h2>
          <p className="mt-3 max-w-measure text-secondary">
            Sign in to create a team or join one with an invite code. Teams share a scoreboard
            position, so every flag counts for the whole roster.
          </p>
        </div>
        <div className="flex flex-wrap gap-3">
          <Link to="/register" className={buttonVariants('primary', 'md')}>
            Create an account
          </Link>
          <Link to="/login" className={buttonVariants('secondary', 'md')}>
            Sign in
          </Link>
        </div>
      </div>
    </section>
  );
}

function TopTeams({
  entries,
  isPending,
  highlightId,
}: {
  entries: ScoreboardEntry[];
  isPending: boolean;
  highlightId: string | null;
}) {
  return (
    <section aria-labelledby="top-teams-title">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h2 id="top-teams-title" className="type-h2 text-primary">
          Top teams
        </h2>
        <Link
          to="/scoreboard"
          className="rounded-sm type-small text-secondary transition-colors duration-instant hover:text-primary"
        >
          Full scoreboard →
        </Link>
      </div>
      <p className="mt-1 type-small text-muted">Ranked by total points across the event.</p>

      {isPending ? (
        <div className="mt-4 flex flex-col" aria-label="Loading top teams">
          {Array.from({ length: 4 }, (_, index) => (
            <div key={index} className="border-b border-hairline py-4">
              <Skeleton className="h-6" />
            </div>
          ))}
        </div>
      ) : entries.length === 0 ? (
        <p className="mt-4 border-t border-hairline pt-4 text-secondary">
          No team has put a flag on the board yet. The first solve starts the ranking.
        </p>
      ) : (
        <ol className="mt-2">
          {entries.map((entry) => {
            const highlighted = entry.id === highlightId;
            return (
              <li
                key={entry.id}
                className={cn(
                  'border-b border-hairline',
                  highlighted && 'bg-accent-faint',
                )}
              >
                <Link to={`/teams/${entry.id}`} className="group flex items-center gap-3 py-3">
                  <span className="nums w-7 shrink-0 text-center font-mono type-small text-muted">
                    {String(entry.rank).padStart(2, '0')}
                  </span>
                  <Avatar name={entry.name} src={entry.avatarUrl} size="sm" />
                  <span className="min-w-0 flex-1">
                    <span className="block truncate font-medium text-primary transition-colors duration-instant group-hover:text-accent-strong">
                      {entry.name}
                    </span>
                    <span className="type-small text-muted">
                      {entry.memberCount ?? 0}{' '}
                      {(entry.memberCount ?? 0) === 1 ? 'member' : 'members'} · {entry.solveCount}{' '}
                      {entry.solveCount === 1 ? 'solve' : 'solves'}
                    </span>
                  </span>
                  <span className="nums shrink-0 font-mono font-semibold text-primary">
                    {formatPoints(entry.points)}
                  </span>
                </Link>
              </li>
            );
          })}
        </ol>
      )}
    </section>
  );
}
