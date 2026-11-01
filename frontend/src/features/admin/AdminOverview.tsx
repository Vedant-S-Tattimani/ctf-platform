import { Link } from 'react-router-dom';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { buttonVariants } from '@/components/ui/Button';
import { ErrorState } from '@/components/ui/ErrorState';
import { PageHeader } from '@/components/ui/PageHeader';
import { Reveal } from '@/components/ui/Reveal';
import { Skeleton } from '@/components/ui/Skeleton';
import { useCurrentEvent } from '@/features/events/queries';
import { errorMessage } from '@/lib/errors';
import { formatCompactUTC, formatPoints } from '@/lib/format';
import {
  useAdminCategories,
  useAdminChallenges,
  useAdminEvents,
  useAdminSubmissions,
  useAdminUsers,
} from './queries';

function Stat({ label, value, detail }: { label: string; value: string; detail: string }) {
  return (
    <div className="flex flex-col gap-1 bg-surface p-4 sm:p-6">
      <dt className="type-label text-muted">{label}</dt>
      <dd className="nums text-h2 text-primary">{value}</dd>
      <p className="type-small text-muted">{detail}</p>
    </div>
  );
}

export function AdminOverview() {
  const challenges = useAdminChallenges();
  const categories = useAdminCategories();
  const events = useAdminEvents();
  const users = useAdminUsers({ limit: 1, offset: 0 });
  const submissions = useAdminSubmissions({ limit: 8, offset: 0 });
  const currentEvent = useCurrentEvent();

  const challengeList = challenges.data?.challenges ?? [];
  const liveChallenges = challengeList.filter((challenge) => challenge.published).length;
  const draftChallenges = challengeList.length - liveChallenges;
  const eventList = events.data?.events ?? [];
  const liveEvents = eventList.filter((event) => event.published).length;
  const recent = submissions.data?.submissions ?? [];
  const event = currentEvent.data?.event;

  return (
    <section className="flex flex-col gap-10">
      <PageHeader
        title="Overview"
        description="What is live, what is waiting, and what just happened on the board."
        actions={
          <Link to="/admin/challenges/new" className={buttonVariants('primary', 'md')}>
            New challenge
          </Link>
        }
      />

      <Reveal
        stagger
        as="dl"
        className="grid grid-cols-2 gap-px overflow-hidden rounded-lg border border-hairline bg-hairline shadow-card sm:grid-cols-4"
      >
        <Stat
          label="Challenges live"
          value={challenges.data ? String(liveChallenges) : '—'}
          detail={challenges.data ? `${draftChallenges} in draft` : 'Loading challenges…'}
        />
        <Stat
          label="Categories"
          value={categories.data ? String(categories.data.categories.length) : '—'}
          detail="Grouping the board"
        />
        <Stat
          label="Events published"
          value={events.data ? String(liveEvents) : '—'}
          detail={events.data ? `${eventList.length} total` : 'Loading events…'}
        />
        <Stat
          label="Players"
          value={users.data ? formatPoints(users.data.total) : '—'}
          detail="Registered accounts"
        />
      </Reveal>

      <Reveal>
        <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_20rem] lg:items-start lg:gap-8">
          <section
            aria-labelledby="recent-submissions"
            className="min-w-0 rounded-lg border border-hairline bg-surface p-6 shadow-card sm:p-8"
          >
            <div className="flex items-end justify-between gap-3">
              <h2 id="recent-submissions" className="type-h3 text-primary">
                Recent submissions
              </h2>
              <Link
                to="/admin/people"
                className="type-small text-secondary transition-colors duration-instant hover:text-primary"
              >
                Full audit →
              </Link>
            </div>

            {submissions.isPending ? (
              <div className="mt-4 flex flex-col gap-2" aria-busy="true">
                {Array.from({ length: 5 }).map((_, index) => (
                  <Skeleton key={index} className="h-12 rounded-md" />
                ))}
                <span className="sr-only">Loading recent submissions…</span>
              </div>
            ) : submissions.isError ? (
              <div className="mt-4">
                <ErrorState
                  title="Could not load activity"
                  description={errorMessage(submissions.error)}
                  onRetry={() => void submissions.refetch()}
                />
              </div>
            ) : recent.length === 0 ? (
              <div className="py-8 text-center">
                <p className="type-h3 text-primary">No submissions yet</p>
                <p className="mt-2 text-secondary">
                  Attempts appear here as soon as players start submitting flags.
                </p>
              </div>
            ) : (
              <ul className="mt-2 flex flex-col">
                {recent.map((row) => (
                  <li
                    key={row.id}
                    className="-mx-3 grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3 rounded-md border-b border-hairline px-3 py-3 transition-colors duration-instant last:border-b-0 hover:bg-elevated"
                  >
                    <div className="min-w-0">
                      <p className="truncate text-primary">
                        {row.user}
                        <span aria-hidden className="px-1.5 text-muted">
                          →
                        </span>
                        {row.challenge}
                      </p>
                      <p className="type-small text-muted">
                        {row.team ? `${row.team} · ` : ''}
                        {formatCompactUTC(row.createdAt)}
                      </p>
                    </div>
                    <Badge tone={row.correct ? 'success' : 'danger'}>
                      {row.correct ? 'Correct' : 'Wrong'}
                    </Badge>
                  </li>
                ))}
              </ul>
            )}
          </section>

          <aside className="flex flex-col gap-6">
            <section
              aria-labelledby="event-window"
              className="rounded-lg border border-hairline bg-surface p-6 shadow-card"
            >
              <h2 id="event-window" className="type-label text-muted">
                Event window
              </h2>
              {currentEvent.isPending ? (
                <Skeleton className="mt-3 h-32 w-full rounded-md" />
              ) : event ? (
                <div className="mt-3 flex flex-col gap-4">
                  <div className="flex items-start justify-between gap-3">
                    <p className="text-primary">{event.name}</p>
                    <Badge
                      tone={
                        event.state === 'live'
                          ? 'accent'
                          : event.state === 'upcoming'
                            ? 'warning'
                            : 'neutral'
                      }
                    >
                      {event.state === 'live'
                        ? 'Live'
                        : event.state === 'upcoming'
                          ? 'Upcoming'
                          : 'Ended'}
                    </Badge>
                  </div>
                  <dl className="divide-y divide-hairline border-y border-hairline type-small">
                    <div className="flex items-baseline justify-between gap-4 py-2.5">
                      <dt className="text-muted">Starts</dt>
                      <dd className="nums text-secondary">
                        {event.startsAt ? formatCompactUTC(event.startsAt) : 'Not set'}
                      </dd>
                    </div>
                    <div className="flex items-baseline justify-between gap-4 py-2.5">
                      <dt className="text-muted">Ends</dt>
                      <dd className="nums text-secondary">
                        {event.endsAt ? formatCompactUTC(event.endsAt) : 'Not set'}
                      </dd>
                    </div>
                    <div className="flex items-baseline justify-between gap-4 py-2.5">
                      <dt className="text-muted">Team cap</dt>
                      <dd className="nums text-secondary">{event.teamMaxSize}</dd>
                    </div>
                    <div className="flex items-baseline justify-between gap-4 py-2.5">
                      <dt className="text-muted">Challenges</dt>
                      <dd className="nums text-secondary">{event.challengeCount}</dd>
                    </div>
                  </dl>
                  <Link
                    to="/admin/events"
                    className="type-small text-secondary transition-colors duration-instant hover:text-primary"
                  >
                    Manage events →
                  </Link>
                </div>
              ) : (
                <div className="mt-3 flex flex-col gap-3 type-small text-secondary">
                  <p>No event is published, so the board has no competition window.</p>
                  <Link to="/admin/events" className={buttonVariants('secondary', 'sm', 'self-start')}>
                    Publish an event
                  </Link>
                </div>
              )}
            </section>

            <section
              aria-labelledby="integrity-note"
              className="rounded-lg border border-hairline bg-surface p-6 shadow-card"
            >
              <h2 id="integrity-note" className="type-label text-muted">
                Integrity
              </h2>
              <p className="mt-3 max-w-measure type-small text-secondary">
                Flags are stored as salted hashes and compared in constant time. No admin response
                contains a plaintext flag, its hash or its salt.
              </p>
              <Button
                variant="ghost"
                size="sm"
                className="-ml-2 mt-2"
                onClick={() => {
                  void challenges.refetch();
                  void submissions.refetch();
                }}
              >
                Refresh figures
              </Button>
            </section>
          </aside>
        </div>
      </Reveal>
    </section>
  );
}
