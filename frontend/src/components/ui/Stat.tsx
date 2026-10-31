import { cn } from '@/lib/utils';

interface StatProps {
  label: string;
  value: React.ReactNode;
  unit?: string;
  hint?: React.ReactNode;
  className?: string;
}

export function Stat({ label, value, unit, hint, className }: StatProps) {
  return (
    <div className={cn('flex flex-col gap-1', className)}>
      <p className="type-small text-secondary">{label}</p>
      <p className="flex items-baseline gap-1.5">
        <span className="nums text-h2 text-primary">{value}</span>
        {unit && <span className="type-small text-muted">{unit}</span>}
      </p>
      {hint && <p className="type-small text-muted">{hint}</p>}
    </div>
  );
}

export function StatRow({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        'grid grid-cols-2 gap-x-6 gap-y-5 border-y border-hairline py-5 sm:grid-cols-4',
        className,
      )}
    >
      {children}
    </div>
  );
}
