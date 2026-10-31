import { Link, NavLink } from 'react-router-dom';
import { EventStatus } from '@/components/events/EventStatus';
import { UserMenu } from '@/components/layout/UserMenu';
import { ThemeToggle } from '@/components/ui/ThemeToggle';
import { useCurrentEvent } from '@/features/events/queries';
import { BRAND } from '@/lib/brand';
import { Icon } from '@/lib/icons';
import { NAV_LINKS } from '@/lib/nav';
import { cn } from '@/lib/utils';
import { usePaletteStore } from '@/store/palette';

const isMac = typeof navigator !== 'undefined' && /Mac|iPhone|iPad/.test(navigator.platform);
const shortcutHint = isMac ? '⌘K' : 'Ctrl K';

function PaletteTrigger() {
  const setOpen = usePaletteStore((state) => state.setOpen);

  return (
    <button
      type="button"
      onClick={() => setOpen(true)}
      aria-label="Search challenges and jump to a page"
      aria-keyshortcuts="Control+K Meta+K"
      className={cn(
        'flex h-11 items-center gap-2 rounded-sm border border-subtle bg-elevated/60 px-2.5',
        'text-muted transition-colors duration-instant hover:border-strong hover:text-primary',
        'sm:px-3',
      )}
    >
      <Icon name="search" size={16} />
      <span className="hidden type-small xl:inline">Search</span>
      <kbd className="hidden whitespace-nowrap rounded-sm border border-subtle px-1.5 py-0.5 font-mono text-[0.6875rem] leading-none text-muted sm:inline">
        {shortcutHint}
      </kbd>
    </button>
  );
}

export function Navbar() {
  const { data } = useCurrentEvent();

  return (
    <header className="sticky top-0 z-40 border-b border-hairline bg-glass backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-container items-center gap-2 px-4 sm:gap-3 sm:px-6">
        <Link
          to="/"
          className="flex shrink-0 items-center gap-2 font-display text-h3 tracking-tight text-primary"
        >
          <span
            aria-hidden
            className="grid size-8 place-items-center rounded-sm bg-accent font-mono text-sm font-bold text-inverse"
          >
            {'>'}_
          </span>
          <span>{BRAND.name}</span>
        </Link>

        <nav aria-label="Main" className="hidden items-center md:flex">
          {NAV_LINKS.map((link) => (
            <NavLink
              key={link.to}
              to={link.to}
              className={({ isActive }) =>
                cn(
                  'relative flex h-16 items-center px-3 type-small font-medium transition-colors duration-instant',
                  'after:absolute after:inset-x-2 after:bottom-0 after:h-0.5 after:rounded-pill after:bg-accent',
                  'after:transition-transform after:duration-fast after:ease-decel motion-reduce:after:transition-none',
                  isActive
                    ? 'text-primary after:scale-x-100'
                    : 'text-secondary after:scale-x-0 hover:text-primary hover:after:scale-x-100',
                )
              }
            >
              {link.label}
            </NavLink>
          ))}
        </nav>

        <div className="ml-auto flex items-center gap-1.5 sm:gap-2.5">
          <EventStatus event={data?.event} className="mr-0.5" />
          <PaletteTrigger />
          <ThemeToggle />
          <UserMenu />
        </div>
      </div>
    </header>
  );
}
