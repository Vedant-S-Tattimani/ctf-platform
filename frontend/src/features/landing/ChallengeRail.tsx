import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { challengesApi } from '@/api/challenges';
import { Carousel } from '@/components/ui/Carousel';
import { Reveal } from '@/components/ui/Reveal';
import { Badge } from '@/components/ui/Badge';
import { difficultyLabel, difficultyTone, formatPoints } from '@/lib/format';
import { Icon } from '@/lib/icons';

/** The rail the landing uses instead of a single spotlight: hardest first. */
export function ChallengeRail() {
  const { data, isPending } = useQuery({
    queryKey: ['challenges', 'list'],
    queryFn: ({ signal }) => challengesApi.list({}, signal),
    staleTime: 30_000,
  });

  const challenges = [...(data?.challenges ?? [])]
    .sort((a, b) => b.currentPoints - a.currentPoints)
    .slice(0, 6);

  return (
    <section className="mx-auto max-w-container px-4 py-16 sm:px-6 sm:py-band" aria-labelledby="rail-title">
      <Reveal className="mb-6 flex flex-wrap items-end justify-between gap-3">
        <h2 id="rail-title" className="type-h2 text-primary">
          Highest on the board
        </h2>
        <Link
          to="/challenges"
          className="group inline-flex items-center gap-1.5 type-small text-secondary transition-colors duration-instant hover:text-primary"
        >
          All challenges
          <Icon
            name="arrow-right"
            size={15}
            className="transition-transform duration-fast ease-decel group-hover:translate-x-0.5 motion-reduce:transition-none"
          />
        </Link>
      </Reveal>

      {isPending ? (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3" aria-hidden>
          {Array.from({ length: 3 }).map((_, index) => (
            <span key={index} className="h-56 animate-pulse rounded-lg bg-elevated" />
          ))}
        </div>
      ) : challenges.length === 0 ? (
        <p className="max-w-measure text-secondary">
          No challenges are published yet. The rail fills as soon as the board opens.
        </p>
      ) : (
        <Carousel label="Challenges with the most points on the board">
          {challenges.map((challenge) => (
            <Link
              key={challenge.id}
              to={`/challenges/${challenge.id}`}
              className="group flex h-full flex-col gap-4 rounded-lg border border-hairline bg-surface p-6 shadow-soft transition-[box-shadow,border-color,transform] duration-fast ease-decel hover:-translate-y-0.5 hover:border-strong hover:shadow-card motion-reduce:translate-y-0"
            >
              <div className="flex flex-wrap items-center gap-2">
                <Badge tone="info">{challenge.category.name}</Badge>
                <Badge tone={difficultyTone(challenge.difficulty)}>
                  {difficultyLabel(challenge.difficulty)}
                </Badge>
              </div>

              <h3 className="type-h3 text-primary">{challenge.title}</h3>

              <p className="type-small text-secondary">
                {challenge.flagsSolved} of {challenge.flagsTotal}{' '}
                {challenge.flagsTotal === 1 ? 'flag' : 'flags'} captured
                {challenge.solvedByMe && ' · you solved this'}
              </p>

              <dl className="mt-auto flex items-baseline justify-between gap-4 border-t border-hairline pt-4">
                <div className="flex items-baseline gap-2">
                  <dd className="nums text-h3 text-accent-strong">
                    {formatPoints(challenge.currentPoints)}
                  </dd>
                  <dt className="type-small text-muted">pts</dt>
                </div>
                <div className="flex items-baseline gap-2">
                  <dd className="nums type-small text-primary">{challenge.solveCount}</dd>
                  <dt className="type-small text-muted">
                    {challenge.solveCount === 1 ? 'solver' : 'solvers'}
                  </dt>
                </div>
                <span className="inline-flex items-center gap-1 type-small text-muted transition-transform duration-fast ease-decel group-hover:translate-x-0.5 motion-reduce:transition-none">
                  Open
                  <Icon name="arrow-right" size={14} />
                </span>
              </dl>
            </Link>
          ))}
        </Carousel>
      )}
    </section>
  );
}
