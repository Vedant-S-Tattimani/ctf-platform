import { useQuery } from '@tanstack/react-query';
import { Link, useParams } from 'react-router-dom';
import { submissionsApi } from '@/api/submissions';
import { usersApi } from '@/api/users';
import { Avatar } from '@/components/ui/Avatar';
import { Badge } from '@/components/ui/Badge';
import { buttonVariants } from '@/components/ui/Button';
import { Skeleton } from '@/components/ui/Skeleton';
import { useAuth } from '@/hooks/useAuth';
import { formatDateUTC } from '@/lib/format';

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

  if (profile.isPending) {
    return (
      <main className="mx-auto w-full max-w-container px-4 py-10 sm:px-6 sm:py-12">
        <Skeleton className="h-48" />
      </main>
    );
  }

  const player = profile.data?.user;
  if (profile.isError || !player) {
    return (
      <main className="mx-auto w-full max-w-container px-4 py-10 sm:px-6 sm:py-12">
        <h1 className="type-h1 text-primary">Player not found</h1>
        <p className="mt-2 text-secondary">
          This profile does not exist or was removed.{' '}
          <Link to="/scoreboard" className="text-accent-strong hover:underline">
            Back to the scoreboard
          </Link>
          .
        </p>
      </main>
    );
  }

  const solves = (submissions.data?.submissions ?? []).filter((entry) => entry.correct).slice(0, 8);

  return (
    <main className="mx-auto w-full max-w-container px-4 py-10 sm:px-6 sm:py-12">
      <div className="flex flex-col gap-10">
        <header className="flex flex-col gap-6 border-b border-hairline pb-8">
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

          <dl className="flex flex-wrap gap-x-8 gap-y-2 type-small">
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
          <section aria-labelledby="recent-solves-title">
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
              <p className="mt-4 border-t border-hairline pt-4 text-secondary">
                No flags on your record yet.{' '}
                <Link to="/challenges" className="text-accent-strong hover:underline">
                  Pick a challenge
                </Link>{' '}
                to get on the board.
              </p>
            ) : (
              <ul className="mt-2">
                {solves.map((solve) => (
                  <li
                    key={solve.id}
                    className="flex flex-wrap items-center justify-between gap-2 border-b border-hairline py-3 last:border-b-0"
                  >
                    <span className="min-w-0 truncate text-primary">{solve.challenge.title}</span>
                    <span className="flex items-center gap-3 type-small">
                      {solve.flag?.label && <span className="text-muted">{solve.flag.label}</span>}
                      <span className="font-mono font-semibold text-success">
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
