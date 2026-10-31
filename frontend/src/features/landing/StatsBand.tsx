import { useQuery } from '@tanstack/react-query';
import { challengesApi } from '@/api/challenges';
import { scoreboardApi } from '@/api/scoreboard';
import CountUp from '@/components/reactbits/CountUp';

const STATS = [
  { key: 'challenges', label: 'Challenges' },
  { key: 'disciplines', label: 'Disciplines' },
  { key: 'teams', label: 'Teams ranked' },
  { key: 'solves', label: 'Flags captured' },
] as const;

export function StatsBand() {
  const challenges = useQuery({
    queryKey: ['challenges', 'list'],
    queryFn: ({ signal }) => challengesApi.list({}, signal),
    staleTime: 30_000,
  });
  const board = useQuery({
    queryKey: ['scoreboard', 'teams', 'landing'],
    queryFn: () => scoreboardApi.list({ scope: 'teams', limit: 100 }),
    staleTime: 30_000,
  });

  const list = challenges.data?.challenges ?? [];
  const entries = board.data?.entries ?? [];
  const values: Record<(typeof STATS)[number]['key'], number> = {
    challenges: list.length,
    disciplines: new Set(list.map((challenge) => challenge.category.id)).size,
    teams: entries.length,
    solves: entries.reduce((total, entry) => total + entry.solveCount, 0),
  };

  const pending = challenges.isPending || board.isPending;

  return (
    <section aria-label="Board numbers" className="border-y border-hairline">
      <dl className="mx-auto grid max-w-container grid-cols-2 px-4 py-10 sm:px-6 lg:grid-cols-4">
        {STATS.map((stat) => (
          <div
            key={stat.key}
            className="flex flex-col gap-1 border-hairline px-4 py-4 first:pl-0 lg:border-l lg:first:border-l-0 lg:first:pl-0"
          >
            <dd className="nums text-h2 text-primary">
              {pending ? (
                <span className="inline-block h-8 w-14 animate-pulse rounded-md bg-elevated" />
              ) : (
                <CountUp to={values[stat.key]} duration={0.7} separator="," trigger="view" />
              )}
            </dd>
            <dt className="type-small text-muted">{stat.label}</dt>
          </div>
        ))}
      </dl>
    </section>
  );
}
