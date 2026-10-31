import { cn } from '@/lib/utils';

interface ProgressProps {
  value: number;
  max: number;
  label: string;
  hint?: React.ReactNode;
  variant?: 'bar' | 'ring';
  size?: number;
  className?: string;
}

export function Progress({
  value,
  max,
  label,
  hint,
  variant = 'bar',
  size = 56,
  className,
}: ProgressProps) {
  const safeMax = Math.max(0, max);
  const safeValue = Math.min(Math.max(0, value), safeMax || 0);
  const percent = safeMax > 0 ? Math.round((safeValue / safeMax) * 100) : 0;
  const valueText = `${safeValue} of ${safeMax}`;

  if (variant === 'ring') {
    const radius = 22;
    const circumference = 2 * Math.PI * radius;
    return (
      <div
        role="progressbar"
        aria-label={label}
        aria-valuemin={0}
        aria-valuemax={safeMax}
        aria-valuenow={safeValue}
        aria-valuetext={valueText}
        className={cn('inline-flex items-center gap-3', className)}
      >
        <span className="relative inline-grid place-items-center" style={{ width: size, height: size }}>
          <svg width={size} height={size} viewBox="0 0 56 56" aria-hidden className="-rotate-90">
            <circle cx="28" cy="28" r={radius} fill="none" stroke="var(--bg-elevated)" strokeWidth="4" />
            <circle
              cx="28"
              cy="28"
              r={radius}
              fill="none"
              stroke={percent === 100 ? 'var(--success)' : 'var(--accent)'}
              strokeWidth="4"
              strokeLinecap="round"
              strokeDasharray={circumference}
              strokeDashoffset={circumference * (1 - percent / 100)}
            />
          </svg>
          <span className="absolute nums text-small text-primary">{percent}%</span>
        </span>
        <span className="flex flex-col">
          <span className="type-small text-primary">{label}</span>
          <span className="type-small text-muted">{valueText}</span>
          {hint && <span className="type-small text-muted">{hint}</span>}
        </span>
      </div>
    );
  }

  return (
    <div
      role="progressbar"
      aria-label={label}
      aria-valuemin={0}
      aria-valuemax={safeMax}
      aria-valuenow={safeValue}
      aria-valuetext={valueText}
      className={cn('flex flex-col gap-2', className)}
    >
      <span className="flex items-baseline justify-between gap-3">
        <span className="type-small text-secondary">{label}</span>
        <span className="nums text-small text-primary">{valueText}</span>
      </span>
      <span className="block h-1.5 overflow-hidden rounded-pill bg-elevated">
        <span
          className={cn(
            'block h-full origin-left rounded-pill transition-transform duration-fast ease-decel motion-reduce:transition-none',
            percent === 100 ? 'bg-success' : 'bg-accent',
          )}
          style={{ transform: `scaleX(${percent / 100})` }}
        />
      </span>
      {hint && <span className="type-small text-muted">{hint}</span>}
    </div>
  );
}
