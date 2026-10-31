import { EmptyState } from '@/components/ui/EmptyState';
import { ErrorState } from '@/components/ui/ErrorState';
import { Skeleton } from '@/components/ui/Skeleton';
import { cn } from '@/lib/utils';

export interface DataTableColumn<T> {
  key: string;
  header: React.ReactNode;
  render: (row: T) => React.ReactNode;
  align?: 'left' | 'right';
  className?: string;
}

interface DataTableProps<T> {
  label: string;
  columns: DataTableColumn<T>[];
  rows: T[];
  rowKey: (row: T) => string;
  isPending?: boolean;
  error?: string | null;
  onRetry?: () => void;
  empty?: React.ReactNode;
  rowClassName?: (row: T) => string | undefined;
  className?: string;
}

export function DataTable<T>({
  label,
  columns,
  rows,
  rowKey,
  isPending = false,
  error,
  onRetry,
  empty,
  rowClassName,
  className,
}: DataTableProps<T>) {
  if (isPending) {
    return (
      <div className={cn('rounded-lg border border-hairline bg-surface p-4', className)}>
        <div className="flex flex-col gap-3" aria-hidden>
          {Array.from({ length: 5 }).map((_, index) => (
            <Skeleton key={index} className="h-10 w-full" />
          ))}
        </div>
        <span className="sr-only" role="status" aria-live="polite">
          Loading {label.toLowerCase()}
        </span>
      </div>
    );
  }

  if (error) {
    return (
      <ErrorState
        title={`Could not load ${label.toLowerCase()}`}
        description={error}
        onRetry={onRetry}
        className={className}
      />
    );
  }

  if (rows.length === 0) {
    return (
      <div className={className}>
        {empty ?? (
          <EmptyState
            title="Nothing to show yet"
            description="This table will fill in as activity happens."
          />
        )}
      </div>
    );
  }

  return (
    <div className={cn('rounded-lg border border-hairline bg-surface', className)}>
      <div className="hidden overflow-x-auto md:block">
        <table className="w-full border-collapse text-left">
          <caption className="sr-only">{label}</caption>
          <thead>
            <tr className="border-b border-subtle">
              {columns.map((column) => (
                <th
                  key={column.key}
                  scope="col"
                  className={cn(
                    'px-4 py-3 type-small font-semibold text-secondary',
                    column.align === 'right' && 'text-right',
                    column.className,
                  )}
                >
                  {column.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr
                key={rowKey(row)}
                className={cn(
                  'border-b border-hairline transition-colors duration-instant last:border-0 hover:bg-elevated',
                  rowClassName?.(row),
                )}
              >
                {columns.map((column) => (
                  <td
                    key={column.key}
                    className={cn(
                      'px-4 py-3 align-middle text-small text-primary',
                      column.align === 'right' && 'text-right',
                      column.className,
                    )}
                  >
                    {column.render(row)}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <ul className="divide-y divide-hairline md:hidden" aria-label={label}>
        {rows.map((row) => (
          <li key={rowKey(row)} className={cn('p-4', rowClassName?.(row))}>
            <dl className="flex flex-col gap-2">
              {columns.map((column) => (
                <div
                  key={column.key}
                  className="flex items-start justify-between gap-4"
                >
                  <dt className="type-small text-muted">{column.header}</dt>
                  <dd
                    className={cn(
                      'min-w-0 text-small text-primary',
                      column.align === 'right' ? 'text-right' : 'text-left',
                    )}
                  >
                    {column.render(row)}
                  </dd>
                </div>
              ))}
            </dl>
          </li>
        ))}
      </ul>
    </div>
  );
}
