import { Icon } from '@/lib/icons';
import { cn } from '@/lib/utils';
import { useTheme } from '@/store/theme';

/**
 * Flips between the two explicit themes. "System" stays reachable from the kit
 * and from Account, but is not a click target here — a two-state control reads
 * more honestly than a three-state one wearing a two-state icon.
 */
export function ThemeToggle({ className }: { className?: string }) {
  const theme = useTheme((state) => state.theme);
  const setMode = useTheme((state) => state.setMode);
  const next = theme === 'dark' ? 'light' : 'dark';

  return (
    <button
      type="button"
      onClick={() => setMode(next)}
      aria-label={`Switch to ${next} theme`}
      className={cn(
        'grid size-10 shrink-0 place-items-center rounded-pill border border-hairline bg-surface',
        'text-secondary transition-[color,border-color,background-color] duration-instant ease-decel',
        'hover:border-strong hover:text-primary',
        className,
      )}
    >
      <Icon name={theme === 'dark' ? 'sun' : 'moon'} size={18} />
    </button>
  );
}
