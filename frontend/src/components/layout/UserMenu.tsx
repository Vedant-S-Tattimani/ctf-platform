import { useEffect, useRef, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Avatar } from '@/components/ui/Avatar';
import { useAuth } from '@/hooks/useAuth';
import { Icon } from '@/lib/icons';
import { cn } from '@/lib/utils';

const menuItem =
  'flex w-full items-center rounded-sm px-3 py-2.5 text-left type-small text-secondary ' +
  'transition-colors duration-instant hover:bg-elevated hover:text-primary';

export function UserMenu() {
  const { user, status, isAdmin, logout } = useAuth();
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();
  const { pathname } = useLocation();

  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (!open) return;

    const onPointerDown = (event: PointerEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false);
    };

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        setOpen(false);
        buttonRef.current?.focus();
        return;
      }
      if (event.key !== 'ArrowDown' && event.key !== 'ArrowUp') return;

      const items = [
        ...(menuRef.current?.querySelectorAll<HTMLElement>('[role="menuitem"]') ?? []),
      ];
      if (items.length === 0) return;
      event.preventDefault();
      const current = items.findIndex((item) => item === document.activeElement);
      const next =
        event.key === 'ArrowDown'
          ? current === -1
            ? 0
            : (current + 1) % items.length
          : current === -1
            ? items.length - 1
            : (current - 1 + items.length) % items.length;
      items[next]?.focus();
    };

    document.addEventListener('pointerdown', onPointerDown);
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('pointerdown', onPointerDown);
      document.removeEventListener('keydown', onKeyDown);
    };
  }, [open]);

  if (status === 'loading') {
    return <span aria-hidden className="size-9 animate-pulse rounded-pill bg-elevated" />;
  }

  if (!user) {
    return (
      <div className="flex items-center gap-2">
        <Link
          to="/login"
          className="inline-flex h-11 items-center whitespace-nowrap rounded-sm px-3 type-small font-semibold text-secondary transition-colors duration-instant hover:text-primary"
        >
          Sign in
        </Link>
        <Link
          to="/register"
          className="hidden h-11 items-center whitespace-nowrap rounded-sm bg-accent px-4 type-small font-semibold text-inverse transition-colors duration-instant hover:bg-accent-strong lg:inline-flex"
        >
          Create account
        </Link>
      </div>
    );
  }

  async function handleSignOut() {
    setOpen(false);
    await logout();
    navigate('/');
  }

  return (
    <div ref={rootRef} className="relative">
      <button
        ref={buttonRef}
        type="button"
        onClick={() => setOpen((value) => !value)}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label={`Account menu for ${user.username}`}
        className={cn(
          'flex h-11 items-center gap-2 rounded-sm pl-1 pr-1.5 transition-colors duration-instant',
          'hover:bg-elevated',
          open && 'bg-elevated',
        )}
      >
        <Avatar name={user.username} src={user.avatarUrl} size="sm" />
        <span className="hidden max-w-[9rem] truncate type-small font-medium text-primary lg:inline">
          {user.username}
        </span>
        <Icon name="chevron-down" size={14} className="hidden text-muted sm:block" />
      </button>

      {open && (
        <div
          ref={menuRef}
          role="menu"
          aria-label="Account"
          className="absolute right-0 top-[calc(100%+0.375rem)] w-64 rounded-md border border-subtle bg-surface p-1.5 shadow-panel"
        >
          <div className="px-3 py-2">
            <p className="truncate type-small font-semibold text-primary">{user.username}</p>
            <p className="truncate type-small text-muted">{user.email}</p>
          </div>
          <div role="separator" className="my-1 h-px bg-hairline" />
          <Link to={`/users/${user.id}`} role="menuitem" className={menuItem}>
            Public profile
          </Link>
          <Link to="/account" role="menuitem" className={menuItem}>
            Account settings
          </Link>
          <Link
            to={user.teamId ? `/teams/${user.teamId}` : '/teams'}
            role="menuitem"
            className={menuItem}
          >
            {user.teamId ? 'Your team' : 'Create or join a team'}
          </Link>
          {isAdmin && (
            <Link to="/admin" role="menuitem" className={menuItem}>
              Organizer
            </Link>
          )}
          <div role="separator" className="my-1 h-px bg-hairline" />
          <button
            type="button"
            role="menuitem"
            onClick={() => void handleSignOut()}
            className={menuItem}
          >
            Sign out
          </button>
        </div>
      )}
    </div>
  );
}
