import { useId, useState } from 'react';
import type { Category } from '@/api/types';
import { Button } from '@/components/ui/Button';
import { Drawer } from '@/components/ui/Drawer';
import { Segmented } from '@/components/ui/Segmented';
import { Select } from '@/components/ui/Select';
import { Icon } from '@/lib/icons';
import { cn } from '@/lib/utils';

export type ChallengeStatus = 'all' | 'unsolved' | 'solved';
export type ChallengeSort = 'order' | 'points' | 'difficulty';
export type ChallengeDifficulty = 'all' | 'easy' | 'medium' | 'hard';

export interface ChallengeFilterValues {
  query: string;
  category: string;
  difficulty: ChallengeDifficulty;
  status: ChallengeStatus;
  sort: ChallengeSort;
}

interface ChallengeFiltersProps {
  values: ChallengeFilterValues;
  categories: Category[];
  showStatus: boolean;
  resultCount: number;
  totalCount: number;
  onChange: (patch: Partial<ChallengeFilterValues>) => void;
  onReset: () => void;
}

const SORT_OPTIONS: { value: ChallengeSort; label: string }[] = [
  { value: 'order', label: 'Board order' },
  { value: 'points', label: 'Points: high to low' },
  { value: 'difficulty', label: 'Difficulty: easy first' },
];

export function ChallengeFilters({
  values,
  categories,
  showStatus,
  resultCount,
  totalCount,
  onChange,
  onReset,
}: ChallengeFiltersProps) {
  const [open, setOpen] = useState(false);
  const searchId = useId();

  const activeCount = [
    values.query.trim().length > 0,
    values.category !== 'all',
    values.difficulty !== 'all',
    showStatus && values.status !== 'all',
  ].filter(Boolean).length;

  const search = (
    <div className="relative w-full">
      <label htmlFor={searchId} className="sr-only">
        Search challenges by title
      </label>
      <Icon
        name="search"
        size={16}
        className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-muted"
      />
      <input
        id={searchId}
        type="search"
        value={values.query}
        onChange={(event) => onChange({ query: event.target.value })}
        placeholder="Search challenges"
        className={cn(
          'h-11 w-full rounded-md border border-subtle bg-elevated pr-3 pl-9 text-base text-primary',
          'placeholder:text-muted transition-colors duration-instant hover:border-strong',
          'focus:outline-none focus-visible:border-accent',
        )}
      />
    </div>
  );

  const fields = (
    <div className="flex flex-col gap-5">
      <Select
        label="Category"
        value={values.category}
        onChange={(event) => onChange({ category: event.target.value })}
      >
        <option value="all">All categories</option>
        {categories.map((category) => (
          <option key={category.slug} value={category.slug}>
            {category.name}
          </option>
        ))}
      </Select>

      <Select
        label="Difficulty"
        value={values.difficulty}
        onChange={(event) =>
          onChange({ difficulty: event.target.value as ChallengeDifficulty })
        }
      >
        <option value="all">All levels</option>
        <option value="easy">Easy</option>
        <option value="medium">Medium</option>
        <option value="hard">Hard</option>
      </Select>

      {showStatus && (
        <Segmented
          label="Progress"
          value={values.status}
          onChange={(status) => onChange({ status })}
          options={[
            { value: 'all', label: 'All' },
            { value: 'unsolved', label: 'Unsolved' },
            { value: 'solved', label: 'Solved' },
          ]}
        />
      )}

      <Select
        label="Sort"
        value={values.sort}
        onChange={(event) => onChange({ sort: event.target.value as ChallengeSort })}
      >
        {SORT_OPTIONS.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </Select>
    </div>
  );

  return (
    <>
      <div className="mb-6 border-y border-hairline py-4">
        <div className="flex items-center gap-2 lg:hidden">
          {search}
          <Button
            variant="secondary"
            size="md"
            className="shrink-0"
            aria-haspopup="dialog"
            aria-expanded={open}
            onClick={() => setOpen(true)}
          >
            <Icon name="filter" size={16} />
            Filters
            {activeCount > 0 && (
              <span className="nums grid size-5 place-items-center rounded-pill bg-accent text-[0.6875rem] font-semibold text-inverse">
                {activeCount}
              </span>
            )}
          </Button>
        </div>

        <div className="hidden flex-wrap items-end gap-3 lg:flex">
          <div className="w-full max-w-xs">{search}</div>
          <div className="w-44">
            <Select
              label="Category"
              value={values.category}
              onChange={(event) => onChange({ category: event.target.value })}
            >
              <option value="all">All categories</option>
              {categories.map((category) => (
                <option key={category.slug} value={category.slug}>
                  {category.name}
                </option>
              ))}
            </Select>
          </div>
          <div className="w-36">
            <Select
              label="Difficulty"
              value={values.difficulty}
              onChange={(event) =>
                onChange({ difficulty: event.target.value as ChallengeDifficulty })
              }
            >
              <option value="all">All levels</option>
              <option value="easy">Easy</option>
              <option value="medium">Medium</option>
              <option value="hard">Hard</option>
            </Select>
          </div>
          {showStatus && (
            <div className="pb-0.5">
              <Segmented
                label="Progress"
                value={values.status}
                onChange={(status) => onChange({ status })}
                options={[
                  { value: 'all', label: 'All' },
                  { value: 'unsolved', label: 'Unsolved' },
                  { value: 'solved', label: 'Solved' },
                ]}
              />
            </div>
          )}
          <div className="w-52">
            <Select
              label="Sort"
              value={values.sort}
              onChange={(event) => onChange({ sort: event.target.value as ChallengeSort })}
            >
              {SORT_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </Select>
          </div>
        </div>
      </div>

      <Drawer
        open={open}
        onClose={() => setOpen(false)}
        title="Filter challenges"
        description={`${resultCount} of ${totalCount} challenges match`}
        footer={
          <div className="flex items-center justify-between gap-3">
            <Button
              variant="ghost"
              size="md"
              onClick={onReset}
              disabled={activeCount === 0 && values.sort === 'order'}
            >
              Reset
            </Button>
            <Button size="md" onClick={() => setOpen(false)}>
              Show {resultCount}
            </Button>
          </div>
        }
      >
        {fields}
      </Drawer>
    </>
  );
}
