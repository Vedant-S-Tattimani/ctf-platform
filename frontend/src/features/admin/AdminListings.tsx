import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import type { AdminSubmissionRow, AdminTeamRow, AdminUserRow } from '@/api/types';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { ErrorState } from '@/components/ui/ErrorState';
import { PageHeader } from '@/components/ui/PageHeader';
import { Segmented } from '@/components/ui/Segmented';
import { Skeleton } from '@/components/ui/Skeleton';
import { errorMessage } from '@/lib/errors';
import { formatCompactUTC, formatDateUTC, formatDateTimeUTC } from '@/lib/format';
import { useAdminSubmissions, useAdminTeams, useAdminUsers } from './queries';

type ListingTab = 'users' | 'teams' | 'submissions';

const PAGE_SIZE = 25;

export function AdminListings() {
  const [tab, setTab] = useState<ListingTab>('users');
  const [page, setPage] = useState(0);

  useEffect(() => {
    setPage(0);
  }, [tab]);

  const params = { limit: PAGE_SIZE, offset: page * PAGE_SIZE };
  const users = useAdminUsers(params);
  const teams = useAdminTeams(params);
  const submissions = useAdminSubmissions(params);

  const total =
    tab === 'users'
      ? (users.data?.total ?? 0)
      : tab === 'teams'
        ? (teams.data?.total ?? 0)
        : (submissions.data?.total ?? 0);
  const pending =
    tab === 'users' ? users.isPending : tab === 'teams' ? teams.isPending : submissions.isPending;
  const failed =
    tab === 'users' ? users.isError : tab === 'teams' ? teams.isError : submissions.isError;
  const failure = tab === 'users' ? users.error : tab === 'teams' ? teams.error : submissions.error;
  const retry =
    tab === 'users' ? users.refetch : tab === 'teams' ? teams.refetch : submissions.refetch;

  const start = total === 0 ? 0 : page * PAGE_SIZE + 1;
  const end = Math.min((page + 1) * PAGE_SIZE, total);

  return (
    <section className="flex flex-col gap-6">
      <PageHeader
        title="People & activity"
        description="Read-only rosters and an audit trail of every flag attempt. Wrong guesses are stored hashed, so only their length appears here."
        actions={
          <Segmented
            label="Listing"
            value={tab}
            onChange={setTab}
            options={[
              { value: 'users', label: 'Users' },
              { value: 'teams', label: 'Teams' },
              { value: 'submissions', label: 'Submissions' },
            ]}
          />
        }
      />

      {failed ? (
        <ErrorState
          title="Could not load records"
          description={errorMessage(failure)}
          onRetry={() => void retry()}
        />
      ) : pending ? (
        <div className="flex flex-col gap-2" aria-busy="true">
          {Array.from({ length: 6 }).map((_, index) => (
            <Skeleton key={index} className="h-12 rounded-md" />
          ))}
          <span className="sr-only">Loading records…</span>
        </div>
      ) : total === 0 ? (
        <div className="border-y border-hairline py-12 text-center">
          <p className="type-h3 text-primary">No records yet</p>
          <p className="mx-auto mt-2 max-w-measure text-secondary">
            {tab === 'submissions'
              ? 'Attempts appear here as soon as players submit flags.'
              : 'Records appear here as players and teams join the competition.'}
          </p>
        </div>
      ) : tab === 'users' ? (
        <UsersTable rows={users.data?.users ?? []} />
      ) : tab === 'teams' ? (
        <TeamsTable rows={teams.data?.teams ?? []} />
      ) : (
        <SubmissionsTable rows={submissions.data?.submissions ?? []} />
      )}

      <div className="flex items-center justify-between gap-3 type-small text-muted">
        <span>
          {total === 0 ? 'No records' : `Showing ${start}–${end} of ${total}`}
        </span>
        <div className="flex items-center gap-2">
          <Button
            variant="secondary"
            size="sm"
            disabled={page === 0}
            onClick={() => setPage((current) => Math.max(0, current - 1))}
          >
            Previous
          </Button>
          <Button
            variant="secondary"
            size="sm"
            disabled={end >= total}
            onClick={() => setPage((current) => current + 1)}
          >
            Next
          </Button>
        </div>
      </div>
    </section>
  );
}

function UsersTable({ rows }: { rows: AdminUserRow[] }) {
  return (
    <>
      <ul className="border-t border-hairline md:hidden">
        {rows.map((row) => (
          <li key={row.id} className="flex flex-col gap-1.5 border-b border-hairline py-3">
            <div className="flex items-start justify-between gap-3">
              <Link
                to={`/users/${row.id}`}
                className="min-w-0 truncate font-medium text-primary transition-colors duration-instant hover:text-accent-strong"
              >
                {row.username}
              </Link>
              <Badge tone={row.role === 'ADMIN' ? 'accent' : 'neutral'}>{row.role}</Badge>
            </div>
            <p className="truncate type-small text-secondary">{row.email}</p>
            <p className="type-small text-muted">
              {row.team?.name ?? 'No team'} · {row._count.solves} solves ·{' '}
              {formatCompactUTC(row.createdAt)}
            </p>
          </li>
        ))}
      </ul>

      <div className="hidden overflow-x-auto md:block">
        <table className="w-full min-w-[44rem] border-collapse text-left">
          <thead>
            <tr className="border-b border-hairline type-label text-muted">
              <th scope="col" className="py-2.5 pr-4 font-medium">
                Player
              </th>
              <th scope="col" className="px-4 py-2.5 font-medium">
                Email
              </th>
              <th scope="col" className="px-4 py-2.5 font-medium">
                Role
              </th>
              <th scope="col" className="px-4 py-2.5 font-medium">
                Team
              </th>
              <th scope="col" className="px-4 py-2.5 text-right font-medium">
                Solves
              </th>
              <th scope="col" className="py-2.5 pl-4 text-right font-medium">
                Joined
              </th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.id} className="border-b border-hairline hover:bg-elevated">
                <td className="py-3 pr-4">
                  <Link
                    to={`/users/${row.id}`}
                    className="font-medium text-primary transition-colors duration-instant hover:text-accent-strong"
                  >
                    {row.username}
                  </Link>
                </td>
                <td className="px-4 py-3 type-small text-secondary">{row.email}</td>
                <td className="px-4 py-3">
                  <Badge tone={row.role === 'ADMIN' ? 'accent' : 'neutral'}>{row.role}</Badge>
                </td>
                <td className="px-4 py-3 type-small text-secondary">{row.team?.name ?? '—'}</td>
                <td className="nums px-4 py-3 text-right text-secondary">{row._count.solves}</td>
                <td className="nums py-3 pl-4 text-right type-small text-muted">
                  {formatDateUTC(row.createdAt)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}

function TeamsTable({ rows }: { rows: AdminTeamRow[] }) {
  return (
    <>
      <ul className="border-t border-hairline md:hidden">
        {rows.map((row) => (
          <li key={row.id} className="flex flex-col gap-1.5 border-b border-hairline py-3">
            <Link
              to={`/teams/${row.id}`}
              className="truncate font-medium text-primary transition-colors duration-instant hover:text-accent-strong"
            >
              {row.name}
            </Link>
            <p className="type-small text-secondary">Owner {row.owner.username}</p>
            <p className="type-small text-muted">
              {row._count.members}/{row.maxSize} members · {row._count.solves} solves ·{' '}
              {formatCompactUTC(row.createdAt)}
            </p>
          </li>
        ))}
      </ul>

      <div className="hidden overflow-x-auto md:block">
        <table className="w-full min-w-[40rem] border-collapse text-left">
          <thead>
            <tr className="border-b border-hairline type-label text-muted">
              <th scope="col" className="py-2.5 pr-4 font-medium">
                Team
              </th>
              <th scope="col" className="px-4 py-2.5 font-medium">
                Owner
              </th>
              <th scope="col" className="px-4 py-2.5 text-right font-medium">
                Members
              </th>
              <th scope="col" className="px-4 py-2.5 text-right font-medium">
                Solves
              </th>
              <th scope="col" className="py-2.5 pl-4 text-right font-medium">
                Created
              </th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.id} className="border-b border-hairline hover:bg-elevated">
                <td className="py-3 pr-4">
                  <Link
                    to={`/teams/${row.id}`}
                    className="font-medium text-primary transition-colors duration-instant hover:text-accent-strong"
                  >
                    {row.name}
                  </Link>
                </td>
                <td className="px-4 py-3 type-small text-secondary">{row.owner.username}</td>
                <td className="nums px-4 py-3 text-right text-secondary">
                  {row._count.members}/{row.maxSize}
                </td>
                <td className="nums px-4 py-3 text-right text-secondary">{row._count.solves}</td>
                <td className="nums py-3 pl-4 text-right type-small text-muted">
                  {formatDateUTC(row.createdAt)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}

function attemptSummary(row: AdminSubmissionRow): string | null {
  if (row.correct || row.providedLength === null) return null;
  const prefix = row.providedHashPrefix ? ` · ${row.providedHashPrefix}…` : '';
  return `${row.providedLength} chars${prefix}`;
}

function SubmissionsTable({ rows }: { rows: AdminSubmissionRow[] }) {
  return (
    <>
      <ul className="border-t border-hairline md:hidden">
        {rows.map((row) => (
          <li key={row.id} className="flex flex-col gap-1.5 border-b border-hairline py-3">
            <div className="flex items-start justify-between gap-3">
              <p className="min-w-0 truncate text-primary">
                {row.user}
                <span aria-hidden className="px-1.5 text-muted">
                  →
                </span>
                {row.challenge}
              </p>
              <Badge tone={row.correct ? 'success' : 'danger'}>
                {row.correct ? 'Correct' : 'Wrong'}
              </Badge>
            </div>
            <p className="type-small text-muted">
              {row.team ? `${row.team} · ` : ''}
              {formatCompactUTC(row.createdAt)}
            </p>
            {attemptSummary(row) && (
              <p className="truncate font-mono type-small text-secondary">{attemptSummary(row)}</p>
            )}
          </li>
        ))}
      </ul>

      <div className="hidden overflow-x-auto md:block">
        <table className="w-full min-w-[46rem] border-collapse text-left">
          <thead>
            <tr className="border-b border-hairline type-label text-muted">
              <th scope="col" className="py-2.5 pr-4 font-medium">
                Time
              </th>
              <th scope="col" className="px-4 py-2.5 font-medium">
                Player
              </th>
              <th scope="col" className="px-4 py-2.5 font-medium">
                Team
              </th>
              <th scope="col" className="px-4 py-2.5 font-medium">
                Challenge
              </th>
              <th scope="col" className="px-4 py-2.5 font-medium">
                Verdict
              </th>
              <th scope="col" className="py-2.5 pl-4 font-medium">
                Attempt
              </th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.id} className="border-b border-hairline hover:bg-elevated">
                <td className="nums py-3 pr-4 type-small text-muted">
                  {formatDateTimeUTC(row.createdAt)}
                </td>
                <td className="px-4 py-3 type-small text-secondary">{row.user}</td>
                <td className="px-4 py-3 type-small text-secondary">{row.team ?? '—'}</td>
                <td className="px-4 py-3 type-small text-primary">{row.challenge}</td>
                <td className="px-4 py-3">
                  <Badge tone={row.correct ? 'success' : 'danger'}>
                    {row.correct ? 'Correct' : 'Wrong'}
                  </Badge>
                </td>
                <td className="max-w-[16rem] truncate px-4 py-3 font-mono type-small text-secondary">
                  {attemptSummary(row) ?? (row.correct ? '—' : '')}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}
