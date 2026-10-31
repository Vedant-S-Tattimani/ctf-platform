import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { challengesApi } from '@/api/challenges';
import SpotlightCard from '@/components/reactbits/SpotlightCard';
import { TiltedCard } from '@/components/reactbits/TiltedCard';
import { Badge } from '@/components/ui/Badge';
import { buttonVariants } from '@/components/ui/Button';
import { difficultyLabel, difficultyTone, formatPoints } from '@/lib/format';
import { Icon } from '@/lib/icons';

export function FeaturedChallenge() {
  const { data, isPending } = useQuery({
    queryKey: ['challenges', 'list'],
    queryFn: ({ signal }) => challengesApi.list({}, signal),
    staleTime: 30_000,
  });

  const challenge = [...(data?.challenges ?? [])].sort(
    (a, b) => b.currentPoints - a.currentPoints,
  )[0];

  const detail = useQuery({
    queryKey: ['challenges', 'detail', challenge?.id],
    queryFn: ({ signal }) => challengesApi.byId(challenge!.id, signal),
    enabled: Boolean(challenge),
    staleTime: 30_000,
  });

  if (isPending) {
    return (
      <section className="mx-auto max-w-container px-4 py-16 sm:px-6" aria-hidden>
        <span className="mb-6 block h-8 w-52 animate-pulse rounded-md bg-elevated" />
        <span className="block h-64 animate-pulse rounded-lg bg-elevated" />
      </section>
    );
  }

  if (!challenge) return null;

  return (
    <section
      className="mx-auto max-w-container px-4 py-16 sm:px-6"
      aria-labelledby="featured-title"
    >
      <h2 id="featured-title" className="mb-6 type-h2 text-primary">
        Featured challenge
      </h2>

      <TiltedCard>
        <SpotlightCard
          className="border border-hairline p-6 sm:p-8 lg:p-10"
          spotlightColor="rgba(143, 123, 255, 0.16)"
          intensity={0.7}
        >
          <div className="grid gap-8 lg:grid-cols-[7fr_5fr] lg:gap-12">
            <div className="flex flex-col items-start gap-4">
              <div className="flex flex-wrap items-center gap-2">
                <Badge tone="info">{challenge.category.name}</Badge>
                <Badge tone={difficultyTone(challenge.difficulty)}>
                  {difficultyLabel(challenge.difficulty)}
                </Badge>
                <Badge tone="accent">{formatPoints(challenge.currentPoints)} points</Badge>
              </div>

              <h3 className="type-h1 max-w-[22ch] text-primary">{challenge.title}</h3>

              <p className="line-clamp-3 max-w-measure text-secondary">
                {detail.data?.challenge.description ?? 'Open the brief for targets, files and hints.'}
              </p>

              <Link
                to={`/challenges/${challenge.id}`}
                className={buttonVariants('secondary', 'md', 'mt-1')}
              >
                Open challenge
                <Icon name="arrow-right" size={16} />
              </Link>
            </div>

            <dl className="grid content-start gap-3 border-t border-hairline pt-6 lg:border-l lg:border-t-0 lg:pl-10 lg:pt-0">
              <div className="flex items-baseline justify-between gap-4">
                <dt className="type-small text-muted">Points</dt>
                <dd className="nums text-h3 text-accent-strong">
                  {formatPoints(challenge.currentPoints)}
                </dd>
              </div>
              <div className="flex items-baseline justify-between gap-4">
                <dt className="type-small text-muted">Flags</dt>
                <dd className="nums text-primary">{challenge.flagsTotal}</dd>
              </div>
              <div className="flex items-baseline justify-between gap-4">
                <dt className="type-small text-muted">Solvers</dt>
                <dd className="nums text-primary">{challenge.solveCount}</dd>
              </div>
              {challenge.solvedByMe && (
                <p className="type-small font-semibold text-success">You have solved this one.</p>
              )}
            </dl>
          </div>
        </SpotlightCard>
      </TiltedCard>
    </section>
  );
}
