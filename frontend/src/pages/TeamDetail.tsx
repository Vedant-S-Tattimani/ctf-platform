import { useQuery } from '@tanstack/react-query';
import { Link, useParams } from 'react-router-dom';
import { teamsApi } from '@/api/teams';
import { PageShell } from '@/components/layout/PageShell';
import { Avatar } from '@/components/ui/Avatar';
import { Badge } from '@/components/ui/Badge';
import { buttonVariants } from '@/components/ui/Button';
import { Skeleton } from '@/components/ui/Skeleton';
import { useAuth } from '@/hooks/useAuth';
import { formatDateUTC } from '@/lib/format';

export default function TeamDetail() {
  const { id = '' } = useParams<{ id: string }>();
  const { user, isAuthenticated } = useAuth();

  const { data, isPending, isError } = useQuery({
    queryKey: ['teams', 'detail', id],
    queryFn: () => teamsApi.byId(id),
    enabled: Boolean(id),
  });

  const team = data?.team;
  const isMember = Boolean(team && user && team.members.some((member) => member.id === user.id));
  const ownerName =
    team?.members.find((member) => member.id === team.ownerId)?.username ?? 'the owner';

  if (isPending) {
    return (
      <PageShell title="Team">
        <div className="grid gap-10 lg:grid-cols-[minmax(0,1fr)_18rem]">
          <Skeleton className="h-64" />
          <Skeleton className="h-40" />
        </div>
      </PageShell>
    );
  }

  if (isError || !team) {
    return (
      <PageShell title="Team not found">
        <p className="text-secondary">
          This team does not exist or was removed.{' '}
          <Link to="/scoreboard" className="text-accent-strong hover:underline">
            Back to the scoreboard
          </Link>
          .
        </p>
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
      <div className="grid gap-10 lg:grid-cols-[minmax(0,1fr)_18rem] lg:gap-0">
        <section aria-labelledby="members-title" className="lg:pr-10">
          <div className="flex flex-wrap items-baseline justify-between gap-2">
            <h2 id="members-title" className="type-h3 text-primary">
              Members
            </h2>
            <span className="type-small text-muted">
              {team.memberCount} of {team.maxSize} seats taken
            </span>
          </div>
          <ul className="mt-2">
            {team.members.map((member) => (
              <li
                key={member.id}
                className="flex items-center gap-3 border-b border-hairline py-3 last:border-b-0"
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

        <aside className="flex flex-col gap-8 lg:border-l lg:border-hairline lg:pl-8">
          <section aria-labelledby="team-details-title">
            <h3 id="team-details-title" className="type-label text-muted">
              Details
            </h3>
            <dl className="mt-2 flex flex-col type-small">
              <div className="flex items-center justify-between gap-4 border-b border-hairline py-2.5">
                <dt className="text-muted">Owner</dt>
                <dd className="text-primary">{ownerName}</dd>
              </div>
              <div className="flex items-center justify-between gap-4 border-b border-hairline py-2.5">
                <dt className="text-muted">Created</dt>
                <dd className="nums text-primary">{formatDateUTC(team.createdAt)}</dd>
              </div>
              <div className="flex items-center justify-between gap-4 py-2.5">
                <dt className="text-muted">Seats</dt>
                <dd className="nums text-primary">
                  {team.memberCount}/{team.maxSize}
                </dd>
              </div>
            </dl>
          </section>

          {!isMember && isAuthenticated && (
            <section aria-labelledby="join-team-title" className="border-t border-hairline pt-6">
              <h3 id="join-team-title" className="type-label text-muted">
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
