import { Link } from 'react-router-dom';
import { cn } from '@/lib/utils';

export interface Breadcrumb {
  label: string;
  to?: string;
}

interface PageHeaderProps {
  title: string;
  description?: React.ReactNode;
  actions?: React.ReactNode;
  meta?: React.ReactNode;
  breadcrumbs?: Breadcrumb[];
  className?: string;
  /** Overrides the h1 type step, e.g. when a page-level detail takes the lead. */
  titleClassName?: string;
}

export function PageHeader({
  title,
  description,
  actions,
  meta,
  breadcrumbs,
  className,
  titleClassName,
}: PageHeaderProps) {
  return (
    <header className={cn('mb-8 flex flex-col gap-5', className)}>
      {breadcrumbs && breadcrumbs.length > 0 && (
        <nav aria-label="Breadcrumb">
          <ol className="flex flex-wrap items-center gap-2 type-small text-muted">
            {breadcrumbs.map((crumb, index) => {
              const last = index === breadcrumbs.length - 1;
              return (
                <li key={`${crumb.label}-${index}`} className="flex items-center gap-2">
                  {crumb.to && !last ? (
                    <Link
                      to={crumb.to}
                      className="rounded-sm transition-colors duration-instant hover:text-primary"
                    >
                      {crumb.label}
                    </Link>
                  ) : (
                    <span aria-current={last ? 'page' : undefined} className={last ? 'text-secondary' : undefined}>
                      {crumb.label}
                    </span>
                  )}
                  {!last && (
                    <span aria-hidden className="text-muted">
                      /
                    </span>
                  )}
                </li>
              );
            })}
          </ol>
        </nav>
      )}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div className="flex min-w-0 flex-col gap-2">
          <h1 className={cn('type-h1 text-primary', titleClassName)}>{title}</h1>
          {description && <p className="max-w-measure text-secondary">{description}</p>}
          {meta && <div className="flex flex-wrap items-center gap-x-3 gap-y-2 type-small text-muted">{meta}</div>}
        </div>
        {actions && <div className="flex shrink-0 flex-wrap items-center gap-3">{actions}</div>}
      </div>
    </header>
  );
}
