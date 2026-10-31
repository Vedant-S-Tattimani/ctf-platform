import { cn } from '@/lib/utils';

interface SectionHeaderProps {
  title: React.ReactNode;
  description?: React.ReactNode;
  actions?: React.ReactNode;
  id?: string;
  as?: 'h2' | 'h3';
  className?: string;
}

export function SectionHeader({
  title,
  description,
  actions,
  id,
  as: Heading = 'h2',
  className,
}: SectionHeaderProps) {
  return (
    <div
      className={cn(
        'flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between',
        className,
      )}
    >
      <div className="flex max-w-measure flex-col gap-1">
        <Heading id={id} className={Heading === 'h2' ? 'type-h2 text-primary' : 'type-h3 text-primary'}>
          {title}
        </Heading>
        {description && <p className="type-small text-secondary">{description}</p>}
      </div>
      {actions && <div className="flex shrink-0 flex-wrap items-center gap-2">{actions}</div>}
    </div>
  );
}
