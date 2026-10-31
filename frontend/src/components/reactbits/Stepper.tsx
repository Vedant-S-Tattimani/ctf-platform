import { cn } from '@/lib/utils';

export interface StepperStep {
  value: string;
  label: string;
  description?: string;
}

interface StepperProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  steps: StepperStep[];
  className?: string;
}

export function Stepper({ label, value, onChange, steps, className }: StepperProps) {
  return (
    <nav aria-label={label} className={className}>
      <ol className="flex flex-wrap gap-2">
        {steps.map((step, index) => {
          const active = step.value === value;
          return (
            <li key={step.value}>
              <button
                type="button"
                onClick={() => onChange(step.value)}
                aria-current={active ? 'step' : undefined}
                className={cn(
                  'flex min-h-11 items-center gap-2 rounded-sm border px-3 text-left transition-colors duration-instant',
                  active
                    ? 'border-accent bg-accent-faint text-primary'
                    : 'border-hairline text-secondary hover:border-subtle hover:text-primary',
                )}
              >
                <span
                  aria-hidden
                  className={cn(
                    'grid size-6 shrink-0 place-items-center rounded-pill border nums text-[0.6875rem]',
                    active ? 'border-accent text-accent-strong' : 'border-subtle text-muted',
                  )}
                >
                  {index + 1}
                </span>
                <span className="flex flex-col">
                  <span className="text-small font-medium">{step.label}</span>
                  {step.description && (
                    <span className="type-small text-muted">{step.description}</span>
                  )}
                </span>
              </button>
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
