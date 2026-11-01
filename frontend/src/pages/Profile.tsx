import { useQuery } from '@tanstack/react-query';
import { Link, useParams } from 'react-router-dom';
import { scoreboardApi } from '@/api/scoreboard';
import { submissionsApi } from '@/api/submissions';
import { usersApi } from '@/api/users';
import { Avatar } from '@/components/ui/Avatar';
import { Badge } from '@/components/ui/Badge';
import { buttonVariants } from '@/components/ui/Button';
import { Skeleton } from '@/components/ui/Skeleton';
import { Stat, StatRow } from '@/components/ui/Stat';
import { useAuth } from '@/hooks/useAuth';
import { formatDateUTC, formatPoints } from '@/lib/format';

export default function Profile() {
  const { id = '' } = useParams<{ id: string }>();
  const { user } = useAuth();
  const isSelf = user?.id === id;

  const profile = useQuery({
    queryKey: ['users', 'profile', id],
    queryFn: () => usersApi.byId(id),
    enabled: Boolean(id),
  });

  const submissions = useQuery({
    queryKey: ['submissions', 'me'],
    queryFn: submissionsApi.mine,
    enabled: isSelf,
  });

  // Public standings, so the profile shows exactly the rank and points the
  // scoreboard shows instead of re-deriving them on the client.
  const board = useQuery({
    queryKey: ['scoreboard', 'list', 'users'],
    queryFn: ({ signal }) => scoreboardApi.list({ scope: 'users', limit: 100 }, signal),
  });
  const standing = board.data?.entries.find((entry) => entry.id === id) ?? null;

  if (profile.isPending) {
    return (
      <main className="mx-auto w-full max-w-container px-4 py-10 sm:px-6 sm:py-12">
        <Skeleton className="h-48 rounded-lg" />
      </main>
    );
  }

  const player = profile.data?.user;
  if (profile.isError || !player) {
    return (
      <main className="mx-auto w-full max-w-container px-4 py-10 sm:px-6 sm:py-12">
        <h1 className="type-h1 text-primary">Player not found</h1>
        <div className="mt-6 max-w-2xl rounded-lg border border-hairline bg-surface p-6 shadow-card sm:p-8">
          <p className="text-secondary">
            This profile does not exist or was removed. The scoreboard is public, so the link may
            simply be out of date.
          </p>
          <div className="mt-5 flex flex-wrap gap-3">
            <Link to="/scoreboard" className={buttonVariants('primary', 'sm')}>
              Back to the scoreboard
            </Link>
            <Link to="/challenges" className={buttonVariants('secondary', 'sm')}>
              Browse challenges
            </Link>
          </div>
        </div>
      </main>
    );
  }

  const solves = (submissions.data?.submissions ?? []).filter((entry) => entry.correct).slice(0, 8);

  return (
    <main className="mx-auto w-full max-w-container px-4 py-10 sm:px-6 sm:py-12">
      <div className="flex flex-col gap-10">
        <header className="flex flex-col gap-6 rounded-lg border border-hairline bg-surface p-6 shadow-card sm:p-8">
          <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
            <div className="flex items-start gap-5">
              <Avatar name={player.username} src={player.avatarUrl} size="lg" />
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <h1 className="type-h1 text-primary">{player.username}</h1>
                  {player.role === 'ADMIN' && <Badge tone="accent">Organizer</Badge>}
                  {isSelf && <Badge tone="neutral">You</Badge>}
                </div>
                <p className="mt-2 max-w-measure text-secondary">
                  {player.bio ?? 'No bio yet.'}
                </p>
              </div>
            </div>
            {isSelf && (
              <Link to="/account" className={buttonVariants('secondary', 'sm', 'self-start')}>
                Edit profile
              </Link>
            )}
          </div>

          {standing && (
            <StatRow className="border-0 py-0">
              <Stat label="Board rank" value={`#${standing.rank}`} />
              <Stat label="Points" value={formatPoints(standing.points)} unit="pts" />
              <Stat
                label="Solves"
                value={standing.solveCount}
                hint={
                  standing.lastSolveAt
                    ? `Last on ${formatDateUTC(standing.lastSolveAt)}`
                    : undefined
                }
              />
            </StatRow>
          )}

          <dl className="flex flex-wrap gap-x-8 gap-y-2 border-t border-hairline pt-5 type-small">
            <div className="flex items-center gap-2">
              <dt className="text-muted">Team</dt>
              <dd>
                {player.teamId && player.teamName ? (
                  <Link
                    to={`/teams/${player.teamId}`}
                    className="text-accent-strong hover:underline"
                  >
                    {player.teamName}
                  </Link>
                ) : (
                  <span className="text-secondary">Solo</span>
                )}
              </dd>
            </div>
            <div className="flex items-center gap-2">
              <dt className="text-muted">Member since</dt>
              <dd className="nums text-secondary">{formatDateUTC(player.createdAt)}</dd>
            </div>
          </dl>
        </header>

        {isSelf && (
          <section
            aria-labelledby="recent-solves-title"
            className="rounded-lg border border-hairline bg-surface p-6 shadow-card sm:p-8"
          >
            <div className="flex flex-wrap items-baseline justify-between gap-2">
              <h2 id="recent-solves-title" className="type-h3 text-primary">
                Recent solves
              </h2>
              <span className="type-small text-muted">Your latest accepted flags</span>
            </div>
            {submissions.isPending ? (
              <div className="mt-4 flex flex-col" aria-label="Loading recent solves">
                {Array.from({ length: 3 }, (_, index) => (
                  <div key={index} className="border-b border-hairline py-3">
                    <Skeleton className="h-5" />
                  </div>
                ))}
              </div>
            ) : solves.length === 0 ? (
              <p className="mt-4 text-secondary">
                No flags on your record yet.{' '}
                <Link to="/challenges" className="text-accent-strong hover:underline">
                  Pick a challenge
                </Link>{' '}
                to get on the board.
              </p>
            ) : (
              <ul className="mt-3 flex flex-col">
                {solves.map((solve) => (
                  <li
                    key={solve.id}
                    className="-mx-3 flex flex-wrap items-center justify-between gap-2 rounded-md border-b border-hairline px-3 py-3 transition-colors duration-instant last:border-b-0 hover:bg-elevated"
                  >
                    <span className="min-w-0 truncate text-primary">{solve.challenge.title}</span>
                    <span className="flex items-center gap-3 type-small">
                      {solve.flag?.label && <span className="text-muted">{solve.flag.label}</span>}
                      <span className="nums rounded-pill bg-success-faint px-2 py-0.5 font-mono font-semibold text-success">
                        +{solve.flag?.points ?? 0}
                      </span>
                      <span className="nums text-muted">{formatDateUTC(solve.createdAt)}</span>
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </section>
        )}
      </div>
    </main>
  );
}
