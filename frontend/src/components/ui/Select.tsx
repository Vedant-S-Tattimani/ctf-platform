import { forwardRef, useId } from 'react';
import { Icon } from '@/lib/icons';
import { cn } from '@/lib/utils';

export interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label: string;
  error?: string;
  hint?: string;
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(function Select(
  { label, error, hint, className, id, children, ...props },
  ref,
) {
  const generatedId = useId();
  const selectId = id ?? generatedId;
  const describedBy = error ? `${selectId}-error` : hint ? `${selectId}-hint` : undefined;

  return (
    <div className="flex flex-col gap-2">
      <label htmlFor={selectId} className="type-label text-secondary">
        {label}
      </label>
      <div className="relative">
        <select
          ref={ref}
          id={selectId}
          aria-invalid={error ? true : undefined}
          aria-describedby={describedBy}
          className={cn(
            'h-11 w-full appearance-none rounded-md border bg-elevated pl-3 pr-10 text-base text-primary',
            'transition-colors duration-instant',
            'focus-visible:border-accent disabled:cursor-not-allowed disabled:opacity-60',
            error ? 'border-danger' : 'border-subtle hover:border-strong',
            className,
          )}
          {...props}
        >
          {children}
        </select>
        <Icon
          name="chevron-down"
          size={18}
          className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-muted"
        />
      </div>
      {error ? (
        <p id={`${selectId}-error`} role="alert" className="type-small text-danger">
          {error}
        </p>
      ) : hint ? (
        <p id={`${selectId}-hint`} className="type-small text-muted">
          {hint}
        </p>
      ) : null}
    </div>
  );
});
