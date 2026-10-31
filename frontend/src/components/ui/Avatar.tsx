import { useState } from 'react';
import { initials } from '@/lib/format';
import { cn } from '@/lib/utils';

const sizes = {
  sm: 'size-8 text-small',
  md: 'size-10 text-base',
  lg: 'size-14 text-h3',
} as const;

interface AvatarProps {
  name: string;
  src?: string | null;
  size?: keyof typeof sizes;
  className?: string;
}

export function Avatar({ name, src, size = 'md', className }: AvatarProps) {
  const [failed, setFailed] = useState(false);
  const showImage = Boolean(src) && !failed;

  return (
    <span
      aria-hidden
      className={cn(
        'inline-grid shrink-0 place-items-center overflow-hidden rounded-pill border border-hairline',
        'bg-accent-faint font-mono font-bold text-accent-strong',
        sizes[size],
        className,
      )}
    >
      {showImage ? (
        <img
          src={src ?? undefined}
          alt=""
          className="size-full object-cover"
          onError={() => setFailed(true)}
        />
      ) : (
        initials(name)
      )}
    </span>
  );
}
