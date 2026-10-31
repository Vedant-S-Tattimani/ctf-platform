import { useState } from 'react';
import { Input, type InputProps } from '@/components/ui/Input';
import { Icon } from '@/lib/icons';

export function PasswordInput(props: Omit<InputProps, 'type' | 'trailing'>) {
  const [visible, setVisible] = useState(false);

  return (
    <Input
      {...props}
      type={visible ? 'text' : 'password'}
      trailing={
        <button
          type="button"
          onClick={() => setVisible((current) => !current)}
          aria-label={visible ? 'Hide password' : 'Show password'}
          aria-pressed={visible}
          className="relative grid size-9 place-items-center rounded-sm text-muted transition-colors duration-instant hover:bg-elevated hover:text-primary after:absolute after:-inset-1 after:content-['']"
        >
          <Icon name={visible ? 'eye-off' : 'eye'} size={18} />
        </button>
      }
    />
  );
}
