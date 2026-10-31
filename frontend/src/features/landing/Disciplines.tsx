import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { challengesApi } from '@/api/challenges';
import { Reveal } from '@/components/ui/Reveal';
import { Icon } from '@/lib/icons';
import { cn } from '@/lib/utils';

interface CategoryRow {
  id: string;
  name: string;
  slug: string;
  color: string | null;
  count: number;
}

export function Disciplines() {
  const { data, isPending } = useQuery({
    queryKey: ['challenges', 'list'],
    queryFn: ({ signal }) => challengesApi.list({}, signal),
    staleTime: 30_000,
  });

  const groups = new Map<string, CategoryRow>();
  for (const challenge of data?.challenges ?? []) {
    const existing = groups.get(challenge.category.id);
    if (existing) existing.count += 1;
    else {
      groups.set(challenge.category.id, {
        id: challenge.category.id,
        name: challenge.category.name,
        slug: challenge.category.slug,
        color: challenge.category.color,
        count: 1,
      });
    }
  }
  const categories = [...groups.values()].sort(
    (a, b) => b.count - a.count || a.name.localeCompare(b.name),
  );

  return (
    <section
      className="mx-auto max-w-container px-4 pt-20 sm:px-6 sm:pt-band"
      aria-labelledby="disciplines-title"
    >
      <Reveal className="mb-6 flex flex-wrap items-end justify-between gap-3">
        <h2 id="disciplines-title" className="type-h2 text-primary">
          Disciplines
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
        <div className="grid gap-x-12 sm:grid-cols-2 lg:grid-cols-3" aria-hidden>
          {Array.from({ length: 6 }).map((_, index) => (
            <span
              key={index}
              className="my-3 h-6 animate-pulse rounded-sm bg-elevated"
            />
          ))}
        </div>
      ) : categories.length === 0 ? (
        <p className="max-w-measure text-secondary">
          No challenges are published yet. The board opens when the first event does.
        </p>
      ) : (
        <Reveal stagger className="stagger grid gap-x-12 sm:grid-cols-2 lg:grid-cols-3">
          {categories.map((category) => (
            <Link
              key={category.id}
              to={`/challenges?category=${encodeURIComponent(category.slug)}`}
              className={cn(
                'group flex items-baseline justify-between gap-4 border-b border-hairline py-3.5',
                'text-primary transition-colors duration-instant hover:border-strong',
              )}
            >
              <span className="flex min-w-0 items-center gap-2.5">
                <span
                  aria-hidden
                  className="size-2 shrink-0 rounded-pill"
                  style={{ backgroundColor: category.color ?? 'var(--accent)' }}
                />
                <span className="truncate">{category.name}</span>
              </span>
              <span className="nums type-small text-muted transition-colors duration-instant group-hover:text-secondary">
                {category.count}
              </span>
            </Link>
          ))}
        </Reveal>
      )}
    </section>
  );
}
