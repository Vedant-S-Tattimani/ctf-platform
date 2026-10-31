import { useEffect, useRef, useState } from 'react';
import { Button } from '@/components/ui/Button';
import { Icon } from '@/lib/icons';

type CopyState = 'idle' | 'copied' | 'failed';

interface CopyButtonProps {
  value: string;
  label?: string;
  copiedLabel?: string;
  className?: string;
}

export function CopyButton({
  value,
  label = 'Copy',
  copiedLabel = 'Copied',
  className,
}: CopyButtonProps) {
  const [state, setState] = useState<CopyState>('idle');
  const timer = useRef<number | undefined>(undefined);

  useEffect(() => () => window.clearTimeout(timer.current), []);

  async function copy() {
    window.clearTimeout(timer.current);
    try {
      await navigator.clipboard.writeText(value);
      setState('copied');
    } catch {
      setState('failed');
    }
    timer.current = window.setTimeout(() => setState('idle'), 2000);
  }

  return (
    <Button variant="secondary" size="sm" onClick={() => void copy()} className={className}>
      <Icon name={state === 'copied' ? 'check' : 'copy'} size={16} />
      {state === 'copied' ? copiedLabel : state === 'failed' ? 'Copy failed' : label}
      <span className="sr-only" role="status" aria-live="polite">
        {state === 'copied' ? copiedLabel : state === 'failed' ? 'Copy failed' : ''}
      </span>
    </Button>
  );
}
