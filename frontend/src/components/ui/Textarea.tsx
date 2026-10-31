import { forwardRef, useId } from 'react';
import { cn } from '@/lib/utils';

export interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label: string;
  error?: string;
  hint?: string;
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(function Textarea(
  { label, error, hint, className, id, rows = 4, ...props },
  ref,
) {
  const generatedId = useId();
  const textareaId = id ?? generatedId;
  const describedBy = error ? `${textareaId}-error` : hint ? `${textareaId}-hint` : undefined;

  return (
    <div className="flex flex-col gap-2">
      <label htmlFor={textareaId} className="type-label text-secondary">
        {label}
      </label>
      <textarea
        ref={ref}
        id={textareaId}
        rows={rows}
        aria-invalid={error ? true : undefined}
        aria-describedby={describedBy}
        className={cn(
          'min-h-24 w-full resize-y rounded-md border bg-elevated px-3 py-2.5 text-base text-primary',
          'placeholder:text-muted transition-colors duration-instant',
          'focus-visible:border-accent disabled:cursor-not-allowed disabled:opacity-60',
          error ? 'border-danger' : 'border-subtle hover:border-strong',
          className,
        )}
        {...props}
      />
      {error ? (
        <p id={`${textareaId}-error`} role="alert" className="type-small text-danger">
          {error}
        </p>
      ) : hint ? (
        <p id={`${textareaId}-hint`} className="type-small text-muted">
          {hint}
        </p>
      ) : null}
    </div>
  );
});
