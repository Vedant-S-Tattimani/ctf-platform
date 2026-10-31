import { cn } from '@/lib/utils';

export function Card({
  className,
  interactive = false,
  ...props
}: React.HTMLAttributes<HTMLDivElement> & { interactive?: boolean }) {
  return (
    <div
      className={cn(
        'rounded-lg border border-hairline bg-surface p-6 shadow-soft',
        interactive &&
          'transition-[border-color,background-color,box-shadow,transform] duration-fast ease-decel hover:border-subtle hover:bg-elevated hover:shadow-card motion-reduce:hover:transform-none',
        className,
      )}
      {...props}
    />
  );
}

export function CardHeader({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn('mb-4 flex flex-col gap-1', className)} {...props} />;
}

export function CardTitle({
  as: Heading = 'h3',
  className,
  ...props
}: React.HTMLAttributes<HTMLHeadingElement> & { as?: 'h2' | 'h3' | 'h4' }) {
  return <Heading className={cn('type-h3 text-primary', className)} {...props} />;
}

export function CardDescription({ className, ...props }: React.HTMLAttributes<HTMLParagraphElement>) {
  return <p className={cn('type-small text-secondary', className)} {...props} />;
}
