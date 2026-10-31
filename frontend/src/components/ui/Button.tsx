import { forwardRef } from 'react';
import { cn } from '@/lib/utils';

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger';
type Size = 'sm' | 'md' | 'lg';

const base =
  'relative inline-flex select-none items-center justify-center gap-2 rounded-pill font-body font-medium ' +
  'transition-[background-color,border-color,color,box-shadow,opacity,transform] duration-instant ease-decel ' +
  'active:scale-[0.98] motion-reduce:active:scale-100 ' +
  'disabled:pointer-events-none disabled:opacity-50';

/* `bg-primary text-inverse` is deliberate: it resolves to an ink pill on the light
   canvas and a paper pill on the dark one, which is the reference's primary action. */
const variants: Record<Variant, string> = {
  primary: 'bg-primary text-inverse shadow-soft hover:shadow-card hover:opacity-90',
  secondary: 'border border-strong bg-canvas text-primary hover:bg-elevated',
  ghost: 'text-secondary hover:bg-elevated hover:text-primary',
  danger: 'bg-danger text-inverse shadow-soft hover:opacity-90',
};

// sm is visually 36px but carries a 44px hit area so dense desktop actions stay usable.
const sizes: Record<Size, string> = {
  sm: 'h-9 px-4 text-small after:absolute after:inset-x-0 after:-inset-y-1 after:content-[""]',
  md: 'h-11 px-6 text-base',
  lg: 'h-12 px-8 text-base',
};

export function buttonVariants(variant: Variant = 'primary', size: Size = 'md', className?: string) {
  return cn(base, variants[variant], sizes[size], className);
}

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  loading?: boolean;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  { variant = 'primary', size = 'md', loading = false, className, children, disabled, ...props },
  ref,
) {
  return (
    <button
      ref={ref}
      className={buttonVariants(variant, size, className)}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      {...props}
    >
      {loading && (
        <span
          aria-hidden
          className="size-4 animate-spin rounded-full border-2 border-current border-t-transparent"
        />
      )}
      {children}
    </button>
  );
});
