import { cn } from '@/lib/utils';

type Tone = 'neutral' | 'accent' | 'info' | 'success' | 'warning' | 'danger';

const tones: Record<Tone, string> = {
  neutral: 'border-subtle bg-elevated text-secondary',
  accent: 'border-accent bg-accent-faint text-accent-strong',
  info: 'border-info bg-info-faint text-info',
  success: 'border-success bg-success-faint text-success',
  warning: 'border-warning bg-warning-faint text-warning',
  danger: 'border-danger bg-danger-faint text-danger',
};

export function Badge({
  tone = 'neutral',
  className,
  ...props
}: React.HTMLAttributes<HTMLSpanElement> & { tone?: Tone }) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 whitespace-nowrap rounded-pill border px-2.5 py-0.5',
        'type-label normal-case tracking-normal',
        tones[tone],
        className,
      )}
      {...props}
    />
  );
}
