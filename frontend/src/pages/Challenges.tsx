import { useMemo } from 'react';
import { Link, useParams, useSearchParams } from 'react-router-dom';
import type { Category, ChallengeSummary } from '@/api/types';
import { PageHeader } from '@/components/ui/PageHeader';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { EmptyState } from '@/components/ui/EmptyState';
import { ErrorState } from '@/components/ui/ErrorState';
import { Reveal } from '@/components/ui/Reveal';
import { Skeleton } from '@/components/ui/Skeleton';
import { ChallengeFilters } from '@/features/challenges/ChallengeFilters';
import type {
  ChallengeDifficulty,
  ChallengeFilterValues,
  ChallengeSort,
  ChallengeStatus,
} from '@/features/challenges/ChallengeFilters';
import { ChallengePanel } from '@/features/challenges/ChallengePanel';
import { useChallenges } from '@/features/challenges/queries';
import { useAuth } from '@/hooks/useAuth';
import { errorMessage } from '@/lib/errors';
import { difficultyLabel, formatCount, formatPoints } from '@/lib/format';
import { Icon } from '@/lib/icons';
import { cn } from '@/lib/utils';

const DIFFICULTY_RANK: Record<string, number> = { EASY: 0, MEDIUM: 1, HARD: 2 };

function parseDifficulty(value: string | null): ChallengeDifficulty {
  return value === 'easy' || value === 'medium' || value === 'hard' ? value : 'all';
}

function parseStatus(value: string | null): ChallengeStatus {
  return value === 'solved' || value === 'unsolved' ? value : 'all';
}

function parseSort(value: string | null): ChallengeSort {
  return value === 'points' || value === 'difficulty' ? value : 'order';
}

export default function Challenges() {
  const { isAuthenticated } = useAuth();
  const { challengeId } = useParams<{ challengeId?: string }>();
  const { data, isPending, isError, error, refetch } = useChallenges();
  const [searchParams, setSearchParams] = useSearchParams();

  const values: ChallengeFilterValues = {
    query: searchParams.get('q') ?? '',
    category: searchParams.get('category') ?? 'all',
    difficulty: parseDifficulty(searchParams.get('difficulty')),
    status: isAuthenticated ? parseStatus(searchParams.get('status')) : 'all',
    sort: parseSort(searchParams.get('sort')),
  };

  const challenges = data?.challenges ?? [];
  const solvedCount = challenges.filter((challenge) => challenge.solvedByMe).length;

  const categories = useMemo(() => {
    const seen = new Map<string, Category>();
    for (const challenge of challenges) {
      if (!seen.has(challenge.category.slug)) seen.set(challenge.category.slug, challenge.category);
    }
    return [...seen.values()].sort((a, b) => a.name.localeCompare(b.name));
  }, [challenges]);

  const filtered = useMemo(() => {
    const needle = values.query.trim().toLowerCase();
    const list = challenges.filter((challenge) => {
      if (values.category !== 'all' && challenge.category.slug !== values.category) return false;
      if (values.difficulty !== 'all' && challenge.difficulty.toLowerCase() !== values.difficulty) {
        return false;
      }
      if (values.status === 'solved' && !challenge.solvedByMe) return false;
      if (values.status === 'unsolved' && challenge.solvedByMe) return false;
      if (needle && !challenge.title.toLowerCase().includes(needle)) return false;
      return true;
    });

    const compare = (a: ChallengeSummary, b: ChallengeSummary) => a.title.localeCompare(b.title);
    if (values.sort === 'points') {
      return list.sort((a, b) => b.currentPoints - a.currentPoints || compare(a, b));
    }
    if (values.sort === 'difficulty') {
      return list.sort(
        (a, b) =>
          (DIFFICULTY_RANK[a.difficulty] ?? 0) - (DIFFICULTY_RANK[b.difficulty] ?? 0) ||
          b.currentPoints - a.currentPoints,
      );
    }
    return list.sort((a, b) => a.order - b.order || compare(a, b));
  }, [challenges, values.category, values.difficulty, values.status, values.query, values.sort]);

  const filterActive =
    values.query.trim().length > 0 ||
    values.category !== 'all' ||
    values.difficulty !== 'all' ||
    values.status !== 'all';

  function update(patch: Partial<ChallengeFilterValues>) {
    const next = new URLSearchParams(searchParams);
    if ('query' in patch) {
      const query = patch.query?.trim() ?? '';
      if (query) next.set('q', query);
      else next.delete('q');
    }
    if ('category' in patch) {
      if (patch.category && patch.category !== 'all') next.set('category', patch.category);
      else next.delete('category');
    }
    if ('difficulty' in patch) {
      if (patch.difficulty && patch.difficulty !== 'all') next.set('difficulty', patch.difficulty);
      else next.delete('difficulty');
    }
    if ('status' in patch) {
      if (patch.status && patch.status !== 'all') next.set('status', patch.status);
      else next.delete('status');
    }
    if ('sort' in patch) {
      if (patch.sort && patch.sort !== 'order') next.set('sort', patch.sort);
      else next.delete('sort');
    }
    setSearchParams(next, { replace: true });
  }

  function reset() {
    setSearchParams(new URLSearchParams(), { replace: true });
  }

  return (
    <main className="mx-auto w-full max-w-container px-4 py-8 sm:px-6 lg:py-10">
      <PageHeader
        className={cn(challengeId && 'hidden lg:flex')}
        // With a challenge open the brief is the subject of the page, so the
        // section title steps down and the challenge title takes the h1 scale.
        titleClassName={challengeId ? 'type-h2' : undefined}
        title="Challenges"
        description="Read the brief, work the target, submit the flag. The board updates the moment a solve lands."
        actions={
          isPending ? (
            <Badge tone="neutral">Loading</Badge>
          ) : (
            <>
              <Badge tone="neutral">{formatCount(challenges.length, 'challenge')}</Badge>
              {isAuthenticated && (
                <Badge tone="accent">
                  {solvedCount} solved
                </Badge>
              )}
            </>
          )
        }
      />

      <div className={cn(challengeId && 'hidden lg:block')}>
        <ChallengeFilters
          values={values}
          categories={categories}
          showStatus={isAuthenticated}
          resultCount={filtered.length}
          totalCount={challenges.length}
          onChange={update}
          onReset={reset}
        />
      </div>

      <div className="grid gap-8 lg:grid-cols-[minmax(0,26rem)_minmax(0,1fr)] lg:gap-0">
        <section
          aria-label="Challenge board"
          className={cn(
            'min-w-0',
            // Master/detail: on mobile the panel replaces the list; on desktop the
            // list pins under the navbar while a longer brief scrolls past.
            challengeId && 'hidden lg:sticky lg:top-16 lg:block lg:self-start lg:pr-2',
          )}
        >
          {isPending ? (
            <div className="flex flex-col gap-2" aria-busy="true">
              {Array.from({ length: 8 }).map((_, index) => (
                <Skeleton key={index} className="h-14 rounded-md" />
              ))}
              <span className="sr-only">Loading challenges…</span>
            </div>
          ) : isError ? (
            <ErrorState
              title="Could not load the board"
              description={errorMessage(error)}
              onRetry={() => void refetch()}
            />
          ) : challenges.length === 0 ? (
            <EmptyState
              title="The board is empty"
              description="The organizers have not published any challenges yet. Check back once the event goes live."
            />
          ) : (
            <>
              <div className="mb-2 flex items-center justify-between gap-3 border-b border-hairline py-1 pr-2 pl-3">
                <div className="flex items-center gap-3">
                  <p className="type-label text-muted">
                    {filtered.length === challenges.length
                      ? formatCount(challenges.length, 'challenge')
                      : `${filtered.length} of ${challenges.length}`}
                  </p>
                  {filterActive && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="-my-1 -ml-1"
                      onClick={reset}
                    >
                      Reset
                    </Button>
                  )}
                </div>
                <p className="type-label text-muted">Points</p>
              </div>

              {filtered.length === 0 ? (
                <EmptyState
                  className="mt-4"
                  title="No challenges match these filters"
                  description="Widen the search or reset the filters to see the full board."
                  action={
                    <Button variant="secondary" size="sm" onClick={reset}>
                      Reset filters
                    </Button>
                  }
                />
              ) : (
                <Reveal as="ul" stagger role="list" className="flex flex-col">
                  {filtered.map((challenge) => {
                    const selected = challenge.id === challengeId;
                    return (
                      <li key={challenge.id}>
                        <Link
                          to={{
                            pathname: `/challenges/${challenge.id}`,
                            search: searchParams.toString(),
                          }}
                          state={{ fromBoard: true }}
                          aria-current={selected ? 'page' : undefined}
                          className={cn(
                            'group grid grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-3 border-b border-hairline border-l-2 py-3 pl-3 pr-2',
                            'transition-colors duration-instant',
                            selected
                              ? 'band-tint border-l-accent bg-accent-faint'
                              : 'border-l-transparent hover:bg-elevated',
                          )}
                        >
                          <span
                            aria-hidden
                            className="size-2 rounded-pill transition-transform duration-fast ease-decel group-hover:scale-150 motion-reduce:transition-none motion-reduce:group-hover:scale-100"
                            style={{ backgroundColor: challenge.category.color ?? 'var(--accent)' }}
                          />
                          <span className="flex min-w-0 flex-col gap-0.5">
                            <span
                              className={cn(
                                'truncate',
                                challenge.solvedByMe ? 'text-secondary' : 'text-primary',
                              )}
                            >
                              {challenge.title}
                            </span>
                            <span className="type-small truncate text-muted">
                              {challenge.category.name} · {difficultyLabel(challenge.difficulty)}
                              {challenge.flagsTotal > 1 &&
                                ` · ${challenge.flagsTotal} flags`}
                            </span>
                          </span>
                          <span className="flex shrink-0 items-center gap-2.5">
                            {challenge.solvedByMe && (
                              <Icon name="check" size={14} label="Solved" className="text-success" />
                            )}
                            <span
                              className={cn(
                                'nums font-mono text-small',
                                selected ? 'text-accent-strong' : 'text-primary',
                              )}
                            >
                              {formatPoints(challenge.currentPoints)}
                            </span>
                          </span>
                        </Link>
                      </li>
                    );
                  })}
                </Reveal>
              )}

              {filterActive && filtered.length > 0 && (
                <p role="status" className="sr-only">
                  {filtered.length} of {challenges.length} challenges match the current filters.
                </p>
              )}
            </>
          )}
        </section>

        <div
          className={cn(
            'min-w-0 lg:border-l lg:border-hairline lg:pl-8',
            challengeId ? 'block' : 'hidden lg:block',
          )}
        >
          {challengeId ? (
            <ChallengePanel challengeId={challengeId} />
          ) : (
            <BoardAside openCount={challenges.length} solvedCount={solvedCount} />
          )}
        </div>
      </div>
    </main>
  );
}

function BoardAside({ openCount, solvedCount }: { openCount: number; solvedCount: number }) {
  return (
    <aside className="flex flex-col gap-8 pt-2">
      <h2 className="type-h2 max-w-[16ch] text-primary">Pick a challenge.</h2>
      <p className="max-w-measure text-secondary">
        Every row opens its brief, files and flags here. Narrow the board with the filters above, or
        press <span className="font-mono text-small text-primary">⌘K</span> to search from anywhere.
      </p>
      <dl className="grid grid-cols-2 gap-4 border-t border-hairline pt-4">
        <div className="flex flex-col gap-1">
          <dt className="type-label text-muted">On the board</dt>
          <dd className="nums text-h3 text-primary">{openCount}</dd>
        </div>
        <div className="flex flex-col gap-1">
          <dt className="type-label text-muted">Solved by you</dt>
          <dd className="nums text-h3 text-primary">{solvedCount}</dd>
        </div>
      </dl>
      <p className="max-w-measure type-small text-muted">
        Flags are checked against a salted hash on the server. A repeat submission returns your
        original solve rather than scoring twice.
      </p>
    </aside>
  );
}
