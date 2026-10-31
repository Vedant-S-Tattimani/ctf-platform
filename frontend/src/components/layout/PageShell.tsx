import { PageHeader } from '@/components/ui/PageHeader';
import { cn } from '@/lib/utils';

interface PageShellProps {
  title: string;
  description?: React.ReactNode;
  actions?: React.ReactNode;
  meta?: React.ReactNode;
  breadcrumbs?: { label: string; to?: string }[];
  children: React.ReactNode;
  className?: string;
}

export function PageShell({
  title,
  description,
  actions,
  meta,
  breadcrumbs,
  children,
  className,
}: PageShellProps) {
  return (
    <main className={cn('mx-auto w-full max-w-container px-4 py-10 sm:px-6 sm:py-12', className)}>
      <PageHeader
        title={title}
        description={description}
        actions={actions}
        meta={meta}
        breadcrumbs={breadcrumbs}
      />
      {children}
    </main>
  );
}
