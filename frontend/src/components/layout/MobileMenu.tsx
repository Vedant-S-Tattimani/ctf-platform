import { useEffect, useRef } from 'react';
import { Link, NavLink, useLocation } from 'react-router-dom';
import { EventStatus } from '@/components/events/EventStatus';
import { Segmented } from '@/components/ui/Segmented';
import { useCurrentEvent } from '@/features/events/queries';
import { useAuth } from '@/hooks/useAuth';
import { BRAND } from '@/lib/brand';
import { Icon } from '@/lib/icons';
import { NAV_LINKS } from '@/lib/nav';
import { cn } from '@/lib/utils';
import { useTheme, type ThemeMode } from '@/store/theme';

interface MobileMenuProps {
  open: boolean;
  onClose: () => void;
}

/**
 * The small-screen nav. A full-screen sheet rather than a dropdown: it has to
 * hold primary nav, auth actions and the theme choice without crowding.
 */
export function MobileMenu({ open, onClose }: MobileMenuProps) {
  const closeRef = useRef<HTMLButtonElement>(null);
  const location = useLocation();
  const { user, isAdmin } = useAuth();
  const mode = useTheme((state) => state.mode);
  const setMode = useTheme((state) => state.setMode);
  const { data } = useCurrentEvent();
  const event = data?.event ?? null;

  useEffect(() => {
    if (!open) return;

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };

    document.addEventListener('keydown', onKeyDown);
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const frame = requestAnimationFrame(() => closeRef.current?.focus());

    return () => {
      document.removeEventListener('keydown', onKeyDown);
      document.body.style.overflow = previousOverflow;
      cancelAnimationFrame(frame);
    };
  }, [open, onClose]);

  useEffect(onClose, [location.pathname]);

  if (!open) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Menu"
      className="menu-sheet fixed inset-0 z-50 flex flex-col bg-canvas px-4 pb-8 pt-3 sm:px-6"
    >
      <div className="flex h-16 items-center justify-between">
        <span className="flex items-center gap-2 font-display text-h3 text-primary">
          <span
            aria-hidden
            className="grid size-8 place-items-center rounded-sm bg-accent font-mono text-sm font-bold text-inverse"
          >
            {'>'}_
          </span>
          {BRAND.name}
        </span>
        <button
          ref={closeRef}
          type="button"
          onClick={onClose}
          aria-label="Close menu"
          className="grid size-11 place-items-center rounded-pill border border-hairline bg-surface text-secondary transition-colors duration-instant hover:text-primary"
        >
          <Icon name="close" size={18} />
        </button>
      </div>

      <nav aria-label="Main" className="mt-6 flex flex-col border-t border-hairline">
        {NAV_LINKS.map((link) => (
          <NavLink
            key={link.to}
            to={link.to}
            className={({ isActive }) =>
              cn(
                'flex items-center justify-between border-b border-hairline py-5 type-h2',
                isActive ? 'text-primary' : 'text-secondary',
              )
            }
          >
            {link.label}
            <Icon name="arrow-right" size={18} className="text-muted" />
          </NavLink>
        ))}
      </nav>

      <div className="mt-8 flex flex-col gap-3">
        {user ? (
          <>
            <Link to="/account" className={row}>
              Account settings
            </Link>
            <Link to={user.teamId ? `/teams/${user.teamId}` : '/teams'} className={row}>
              {user.teamId ? 'Your team' : 'Create or join a team'}
            </Link>
            {isAdmin && (
              <Link to="/admin" className={row}>
                Organizer
              </Link>
            )}
          </>
        ) : (
          <>
            <Link to="/login" className={row}>
              Sign in
            </Link>
            <Link to="/register" className={cn(row, 'border-transparent bg-primary text-inverse')}>
              Create account
            </Link>
          </>
        )}
      </div>

      <div className="mt-auto pt-10">
        <div className="mb-6 border-t border-hairline pt-6">
          {event ? (
            <EventStatus variant="line" event={event} />
          ) : (
            <p className="type-small text-muted">No event is published right now.</p>
          )}
        </div>
        <p className="mb-3 type-small text-muted">Appearance</p>
        <Segmented
          label="Appearance"
          value={mode}
          onChange={(value: ThemeMode) => setMode(value)}
          options={[
            { value: 'light', label: 'Light' },
            { value: 'dark', label: 'Dark' },
            { value: 'system', label: 'System' },
          ]}
        />
        <div aria-hidden className="mt-8 overflow-hidden">
          <p className="select-none whitespace-nowrap text-center font-display text-[clamp(3rem,22vw,9rem)] font-medium leading-[0.82] tracking-[-0.05em] text-primary">
            {BRAND.name}
          </p>
        </div>
      </div>
    </div>
  );
}

const row =
  'flex h-12 items-center justify-center rounded-pill border border-strong type-small font-medium text-primary';
