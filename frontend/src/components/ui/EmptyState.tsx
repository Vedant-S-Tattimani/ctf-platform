import { cn } from '@/lib/utils';

interface EmptyStateProps {
  title: string;
  description?: React.ReactNode;
  action?: React.ReactNode;
  className?: string;
}

export function EmptyState({ title, description, action, className }: EmptyStateProps) {
  return (
    <div
      className={cn(
        'flex flex-col items-start gap-3 rounded-lg border border-hairline bg-surface p-8',
        className,
      )}
    >
      <p className="type-h3 text-primary">{title}</p>
      {description && <p className="max-w-measure text-secondary">{description}</p>}
      {action && <div className="pt-1">{action}</div>}
    </div>
  );
}
