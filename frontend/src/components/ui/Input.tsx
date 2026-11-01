import { forwardRef, useId } from 'react';
import { cn } from '@/lib/utils';

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string;
  error?: string;
  hint?: string;
  trailing?: React.ReactNode;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(function Input(
  { label, error, hint, trailing, className, id, ...props },
  ref,
) {
  const generatedId = useId();
  const inputId = id ?? generatedId;
  const describedBy = error ? `${inputId}-error` : hint ? `${inputId}-hint` : undefined;
  const isFile = props.type === 'file';

  return (
    <div className="flex flex-col gap-2">
      <label htmlFor={inputId} className="type-label text-secondary">
        {label}
      </label>
      <div className="relative">
        <input
          ref={ref}
          id={inputId}
          aria-invalid={error ? true : undefined}
          aria-describedby={describedBy}
          className={cn(
            'h-11 w-full rounded-md border bg-overlay px-4 text-base text-primary shadow-soft',
            'placeholder:text-muted transition-[border-color,box-shadow] duration-instant',
            'focus-visible:border-accent focus-visible:shadow-card disabled:cursor-not-allowed disabled:opacity-60',
            error ? 'border-danger' : 'border-subtle hover:border-strong',
            trailing && 'pr-12',
            isFile &&
              'cursor-pointer px-3 file:mr-3 file:h-7 file:rounded-pill file:border file:border-subtle file:bg-elevated file:px-3 file:text-xs file:font-medium file:text-primary hover:file:border-strong',
            className,
          )}
          {...props}
        />
        {trailing && (
          <span className="absolute inset-y-0 right-1 flex items-center">{trailing}</span>
        )}
      </div>
      {error ? (
        <p id={`${inputId}-error`} role="alert" className="type-small text-danger">
          {error}
        </p>
      ) : hint ? (
        <p id={`${inputId}-hint`} className="type-small text-muted">
          {hint}
        </p>
      ) : null}
    </div>
  );
});
