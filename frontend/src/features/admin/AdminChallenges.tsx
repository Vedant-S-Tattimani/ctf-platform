import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Badge } from '@/components/ui/Badge';
import { Button, buttonVariants } from '@/components/ui/Button';
import { ErrorState } from '@/components/ui/ErrorState';
import { Input } from '@/components/ui/Input';
import { PageHeader } from '@/components/ui/PageHeader';
import { Segmented } from '@/components/ui/Segmented';
import { Skeleton } from '@/components/ui/Skeleton';
import { errorMessage } from '@/lib/errors';
import { difficultyLabel, difficultyTone, formatPoints } from '@/lib/format';
import { useAdminChallenges } from './queries';

type StateFilter = 'all' | 'published' | 'draft';

export function AdminChallenges() {
  const { data, isPending, isError, error, refetch } = useAdminChallenges();
  const [status, setStatus] = useState<StateFilter>('all');
  const [query, setQuery] = useState('');

  const items = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return (data?.challenges ?? []).filter((challenge) => {
      if (status === 'published' && !challenge.published) return false;
      if (status === 'draft' && challenge.published) return false;
      if (needle && !challenge.title.toLowerCase().includes(needle)) return false;
      return true;
    });
  }, [data?.challenges, status, query]);

  const live = (data?.challenges ?? []).filter((challenge) => challenge.published).length;
  const filterActive = status !== 'all' || query.trim().length > 0;

  return (
    <section className="flex flex-col gap-6">
      <PageHeader
        title="Challenges"
        description="Every brief on the board, published or in draft. Open a row to edit its flags, hints and files."
        actions={
          <Link to="/admin/challenges/new" className={buttonVariants('primary', 'md')}>
            New challenge
          </Link>
        }
      />

      <div className="flex flex-col gap-3 border-y border-hairline py-3 sm:flex-row sm:items-end sm:justify-between">
        <div className="w-full sm:max-w-xs">
          <Input
            label="Search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Filter by title"
          />
        </div>
        <div className="flex flex-wrap items-end gap-3">
          <p className="type-small text-muted">
            {data ? `${items.length} of ${data.challenges.length} · ${live} live` : 'Loading…'}
          </p>
          <Segmented
            label="Publish state"
            value={status}
            onChange={setStatus}
            options={[
              { value: 'all', label: 'All' },
              { value: 'published', label: 'Live' },
              { value: 'draft', label: 'Drafts' },
            ]}
          />
        </div>
      </div>

      {isPending ? (
        <div className="flex flex-col gap-2" aria-busy="true">
          {Array.from({ length: 6 }).map((_, index) => (
            <Skeleton key={index} className="h-14 rounded-md" />
          ))}
          <span className="sr-only">Loading challenges…</span>
        </div>
      ) : isError ? (
        <ErrorState
          title="Could not load the challenge list"
          description={errorMessage(error)}
          onRetry={() => void refetch()}
        />
      ) : items.length === 0 ? (
        <div className="border-y border-hairline py-12 text-center">
          <p className="type-h3 text-primary">No challenges here</p>
          <p className="mx-auto mt-2 max-w-measure text-secondary">
            {data?.challenges.length === 0
              ? 'Create the first challenge for this competition.'
              : 'Nothing matches the current filter.'}
          </p>
          {data?.challenges.length === 0 && (
            <Link
              to="/admin/challenges/new"
              className={buttonVariants('secondary', 'sm', 'mt-4')}
            >
              New challenge
            </Link>
          )}
          {data && data.challenges.length > 0 && filterActive && (
            <Button
              variant="secondary"
              size="sm"
              className="mt-4"
              onClick={() => {
                setQuery('');
                setStatus('all');
              }}
            >
              Reset filters
            </Button>
          )}
        </div>
      ) : (
        <>
          <ul className="border-t border-hairline md:hidden">
            {items.map((challenge) => (
              <li key={challenge.id} className="border-b border-hairline">
                <Link to={`/admin/challenges/${challenge.id}`} className="flex flex-col gap-2 py-3">
                  <span className="flex items-start justify-between gap-3">
                    <span className="min-w-0">
                      <span className="block truncate text-primary">{challenge.title}</span>
                      <span className="type-small text-muted">
                        {challenge.category.name} · {formatPoints(challenge.points)} pts
                      </span>
                    </span>
                    <Badge tone={challenge.published ? 'success' : 'neutral'}>
                      {challenge.published ? 'Live' : 'Draft'}
                    </Badge>
                  </span>
                  <span className="flex flex-wrap items-center gap-x-3 gap-y-1 type-small text-muted">
                    <Badge tone={difficultyTone(challenge.difficulty)}>
                      {difficultyLabel(challenge.difficulty)}
                    </Badge>
                    <span>{challenge._count.flags ?? 0} flags</span>
                    <span>{challenge._count.solves ?? 0} solves</span>
                    <span className="truncate">{challenge.event?.name ?? 'No event'}</span>
                  </span>
                </Link>
              </li>
            ))}
          </ul>

          <div className="hidden overflow-x-auto md:block">
            <table className="w-full min-w-[44rem] border-collapse text-left">
              <thead>
                <tr className="border-b border-hairline type-label text-muted">
                  <th scope="col" className="py-2.5 pr-4 font-medium">
                    Challenge
                  </th>
                  <th scope="col" className="px-4 py-2.5 font-medium">
                    Difficulty
                  </th>
                  <th scope="col" className="px-4 py-2.5 text-right font-medium">
                    Points
                  </th>
                  <th scope="col" className="px-4 py-2.5 text-right font-medium">
                    Flags
                  </th>
                  <th scope="col" className="px-4 py-2.5 text-right font-medium">
                    Solves
                  </th>
                  <th scope="col" className="px-4 py-2.5 font-medium">
                    Status
                  </th>
                  <th scope="col" className="py-2.5 pl-4 text-right">
                    <span className="sr-only">Actions</span>
                  </th>
                </tr>
              </thead>
              <tbody>
                {items.map((challenge) => (
                  <tr key={challenge.id} className="border-b border-hairline hover:bg-elevated">
                    <td className="py-3 pr-4">
                      <Link
                        to={`/admin/challenges/${challenge.id}`}
                        className="font-medium text-primary transition-colors duration-instant hover:text-accent-strong"
                      >
                        {challenge.title}
                      </Link>
                      <span className="block type-small text-muted">
                        {challenge.category.name} · {challenge.event?.name ?? 'No event'}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <Badge tone={difficultyTone(challenge.difficulty)}>
                        {difficultyLabel(challenge.difficulty)}
                      </Badge>
                    </td>
                    <td className="nums px-4 py-3 text-right font-mono text-small text-secondary">
                      {formatPoints(challenge.points)}
                    </td>
                    <td className="nums px-4 py-3 text-right text-secondary">
                      {challenge._count.flags ?? 0}
                    </td>
                    <td className="nums px-4 py-3 text-right text-secondary">
                      {challenge._count.solves ?? 0}
                    </td>
                    <td className="px-4 py-3">
                      <Badge tone={challenge.published ? 'success' : 'neutral'}>
                        {challenge.published ? 'Live' : 'Draft'}
                      </Badge>
                    </td>
                    <td className="py-3 pl-4 text-right">
                      <Link
                        to={`/admin/challenges/${challenge.id}`}
                        className={buttonVariants('ghost', 'sm')}
                      >
                        Edit
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </section>
  );
}
