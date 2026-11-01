import { useQuery } from '@tanstack/react-query';
import { Link, useParams } from 'react-router-dom';
import { scoreboardApi } from '@/api/scoreboard';
import { teamsApi } from '@/api/teams';
import { PageShell } from '@/components/layout/PageShell';
import { Avatar } from '@/components/ui/Avatar';
import { Badge } from '@/components/ui/Badge';
import { buttonVariants } from '@/components/ui/Button';
import { Progress } from '@/components/ui/Progress';
import { Skeleton } from '@/components/ui/Skeleton';
import { useAuth } from '@/hooks/useAuth';
import { formatDateUTC, formatCount, formatPoints } from '@/lib/format';
import { cn } from '@/lib/utils';

export default function TeamDetail() {
  const { id = '' } = useParams<{ id: string }>();
  const { user, isAuthenticated } = useAuth();

  const { data, isPending, isError } = useQuery({
    queryKey: ['teams', 'detail', id],
    queryFn: () => teamsApi.byId(id),
    enabled: Boolean(id),
  });

  // Public standings, so the roster page can show the same numbers the
  // scoreboard shows without deriving scoring on the client.
  const board = useQuery({
    queryKey: ['scoreboard', 'list', 'teams'],
    queryFn: ({ signal }) => scoreboardApi.list({ scope: 'teams', limit: 100 }, signal),
  });
  const standing = board.data?.entries.find((entry) => entry.id === id) ?? null;

  const team = data?.team;
  const isMember = Boolean(team && user && team.members.some((member) => member.id === user.id));
  const ownerName =
    team?.members.find((member) => member.id === team.ownerId)?.username ?? 'the owner';

  // The same public list already powers the standing card; the window around
  // this rank turns a bare number into the distance actually in play.
  const entries = board.data?.entries ?? [];
  const boardIndex = standing ? entries.indexOf(standing) : -1;
  const boardWindow =
    boardIndex < 0 ? [] : entries.slice(Math.max(0, boardIndex - 1), boardIndex + 2);

  if (isPending) {
    return (
      <PageShell title="Team">
        <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_20rem] lg:items-start lg:gap-8">
          <Skeleton className="h-64 rounded-lg" />
          <Skeleton className="h-40 rounded-lg" />
        </div>
      </PageShell>
    );
  }

  if (isError || !team) {
    return (
      <PageShell title="Team not found">
        <div className="max-w-2xl rounded-lg border border-hairline bg-surface p-6 shadow-card sm:p-8">
          <p className="text-secondary">
            Standings and rosters are public, so this link may simply be out of date — the team may
            also have been removed by its owner.
          </p>
          <div className="mt-5 flex flex-wrap gap-3">
            <Link to="/scoreboard" className={buttonVariants('primary', 'sm')}>
              Back to the scoreboard
            </Link>
            <Link to="/teams" className={buttonVariants('secondary', 'sm')}>
              Browse teams
            </Link>
          </div>
        </div>
      </PageShell>
    );
  }

  return (
    <PageShell
      title={team.name}
      description={team.description ?? 'A team in the competition.'}
      breadcrumbs={[{ label: 'Scoreboard', to: '/scoreboard' }, { label: team.name }]}
      actions={
        isMember ? (
          <Link to="/teams" className={buttonVariants('secondary', 'sm')}>
            Manage team
          </Link>
        ) : !isAuthenticated ? (
          <Link to="/login" className={buttonVariants('secondary', 'sm')}>
            Sign in
          </Link>
        ) : undefined
      }
    >
      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_20rem] lg:items-start lg:gap-8">
        <div className="flex min-w-0 flex-col gap-6">
          <section
            aria-labelledby="members-title"
            className="rounded-lg border border-hairline bg-surface p-6 shadow-card sm:p-8"
          >
            <div className="flex flex-wrap items-baseline justify-between gap-2">
              <h2 id="members-title" className="type-h3 text-primary">
                Members
              </h2>
              <span className="type-small text-muted">
                {formatCount(team.memberCount, 'player')}
              </span>
            </div>
            <Progress
              className="mt-4"
              label="Roster"
              value={team.memberCount}
              max={team.maxSize}
              hint={
                team.memberCount >= team.maxSize
                  ? 'This team is full.'
                  : `${formatCount(team.maxSize - team.memberCount, 'seat')} left.`
              }
            />
            <ul className="mt-4 flex flex-col">
              {team.members.map((member) => (
                <li
                  key={member.id}
                  className="-mx-3 flex items-center gap-3 rounded-md border-b border-hairline px-3 py-3 transition-colors duration-instant last:border-b-0 hover:bg-elevated"
                >
                  <Avatar name={member.username} src={member.avatarUrl} size="sm" />
                  <Link
                    to={`/users/${member.id}`}
                    className="min-w-0 flex-1 truncate font-medium text-primary transition-colors duration-instant hover:text-accent-strong"
                  >
                    {member.username}
                  </Link>
                  {member.id === team.ownerId && <Badge tone="accent">Owner</Badge>}
                  {member.id === user?.id && <span className="type-small text-muted">You</span>}
                </li>
              ))}
            </ul>
          </section>

          {boardWindow.length > 1 && (
            <section
              aria-labelledby="team-window-title"
              className="rounded-lg border border-hairline bg-surface p-6 shadow-card sm:p-8"
            >
              <div className="flex flex-wrap items-baseline justify-between gap-2">
                <h2 id="team-window-title" className="type-h3 text-primary">
                  Around rank {standing?.rank}
                </h2>
                <span className="type-small text-muted">Points gap against this roster</span>
              </div>
              <ul className="mt-4 flex flex-col">
                {boardWindow.map((entry) => {
                  const here = entry.id === id;
                  const ahead = (standing?.rank ?? 0) > entry.rank;
                  const gap = entry.points - (standing?.points ?? 0);
                  return (
                    <li
                      key={entry.id}
                      className={cn(
                        '-mx-3 flex items-center gap-3 rounded-md border-b border-hairline px-3 py-3 transition-colors duration-instant last:border-b-0',
                        here ? 'band-tint bg-accent-faint' : 'hover:bg-elevated',
                      )}
                    >
                      <span className="nums w-7 shrink-0 text-center font-mono type-small text-muted">
                        {String(entry.rank).padStart(2, '0')}
                      </span>
                      <Avatar name={entry.name} src={entry.avatarUrl} size="sm" />
                      {here ? (
                        <span className="min-w-0 flex-1 truncate font-medium text-primary">
                          {entry.name}
                        </span>
                      ) : (
                        <Link
                          to={`/teams/${entry.id}`}
                          className="min-w-0 flex-1 truncate font-medium text-primary transition-colors duration-instant hover:text-accent-strong"
                        >
                          {entry.name}
                        </Link>
                      )}
                      <span className="nums shrink-0 font-mono text-primary">
                        {formatPoints(entry.points)}
                      </span>
                      <span
                        className={cn(
                          'nums w-20 shrink-0 whitespace-nowrap text-right font-mono type-small',
                          here ? 'text-muted' : ahead ? 'text-danger' : 'text-success',
                        )}
                      >
                        {here ? 'this team' : `${ahead ? '-' : '+'}${formatPoints(Math.abs(gap))}`}
                      </span>
                    </li>
                  );
                })}
              </ul>
            </section>
          )}
        </div>

        <aside className="flex min-w-0 flex-col gap-6">
          <section
            aria-labelledby="team-standing-title"
            className="rounded-lg border border-hairline bg-surface p-6 shadow-card"
          >
            <h3 id="team-standing-title" className="type-label text-muted">
              On the board
            </h3>
            {standing ? (
              <dl className="mt-2 flex flex-col type-small">
                <div className="flex items-center justify-between gap-4 border-b border-hairline py-2.5">
                  <dt className="text-muted">Rank</dt>
                  <dd className="nums font-mono font-semibold text-accent-strong">
                    #{standing.rank}
                  </dd>
                </div>
                <div className="flex items-center justify-between gap-4 border-b border-hairline py-2.5">
                  <dt className="text-muted">Points</dt>
                  <dd className="nums font-mono font-semibold text-primary">
                    {formatPoints(standing.points)}
                  </dd>
                </div>
                <div className="flex items-center justify-between gap-4 py-2.5">
                  <dt className="text-muted">Solves</dt>
                  <dd className="nums text-primary">{standing.solveCount}</dd>
                </div>
              </dl>
            ) : (
              <p className="mt-2 type-small text-secondary">
                {board.isPending ? 'Loading standings…' : 'No flags on the board yet.'}
              </p>
            )}
          </section>

          <section
            aria-labelledby="team-details-title"
            className="rounded-lg border border-hairline bg-surface p-6 shadow-card"
          >
            <h3 id="team-details-title" className="type-label text-muted">
              Details
            </h3>
            <dl className="mt-2 flex flex-col type-small">
              <div className="flex items-center justify-between gap-4 border-b border-hairline py-2.5">
                <dt className="text-muted">Owner</dt>
                <dd className="text-primary">{ownerName}</dd>
              </div>
              <div className="flex items-center justify-between gap-4 py-2.5">
                <dt className="text-muted">Created</dt>
                <dd className="nums text-primary">{formatDateUTC(team.createdAt)}</dd>
              </div>
            </dl>
          </section>

          {!isMember && isAuthenticated && (
            <section
              aria-labelledby="join-team-title"
              className="rounded-lg border border-accent bg-accent-faint p-6 shadow-soft"
            >
              <h3 id="join-team-title" className="type-label text-accent-strong">
                Join this team
              </h3>
              <p className="mt-2 type-small text-secondary">
                Team joins are invite-only. Ask {ownerName} for the code, then enter it on the Teams
                page.
              </p>
              <Link to="/teams" className={buttonVariants('secondary', 'sm', 'mt-3')}>
                Enter invite code
              </Link>
            </section>
          )}
        </aside>
      </div>
    </PageShell>
  );
}
