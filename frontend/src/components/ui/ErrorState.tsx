import { Button } from '@/components/ui/Button';
import { Icon } from '@/lib/icons';
import { cn } from '@/lib/utils';

interface ErrorStateProps {
  title?: string;
  description: React.ReactNode;
  onRetry?: () => void;
  retryLabel?: string;
  className?: string;
}

export function ErrorState({
  title = 'Something went wrong',
  description,
  onRetry,
  retryLabel = 'Try again',
  className,
}: ErrorStateProps) {
  return (
    <div
      role="alert"
      className={cn(
        'flex flex-col items-start gap-3 rounded-lg border border-danger bg-danger-faint p-6',
        className,
      )}
    >
      <div className="flex items-center gap-2 text-danger">
        <Icon name="warning" size={18} />
        <p className="type-h3">{title}</p>
      </div>
      <p className="max-w-measure text-secondary">{description}</p>
      {onRetry && (
        <Button variant="secondary" size="sm" onClick={onRetry}>
          {retryLabel}
        </Button>
      )}
    </div>
  );
}
