import { useQuery } from '@tanstack/react-query';
import { AnimatePresence, motion } from 'motion/react';
import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { challengesApi } from '@/api/challenges';
import { teamsApi } from '@/api/teams';
import { useAuth } from '@/hooks/useAuth';
import { Icon, type IconName } from '@/lib/icons';
import { NAV_LINKS } from '@/lib/nav';
import { cn } from '@/lib/utils';
import { usePaletteStore } from '@/store/palette';
import { toast } from '@/store/toast';

type PaletteGroup = 'Go to' | 'Challenges' | 'Team' | 'Organizer' | 'Session';

interface PaletteAction {
  group: PaletteGroup;
  label: string;
  hint?: string;
  icon?: IconName;
  run: () => void;
}

const MAX_RESULTS = 24;

export function CommandPalette() {
  const { open, setOpen } = usePaletteStore();
  const { isAuthenticated, isAdmin, logout } = useAuth();
  const navigate = useNavigate();
  const inputRef = useRef<HTMLInputElement>(null);
  const restoreRef = useRef<HTMLElement | null>(null);
  const [query, setQuery] = useState('');
  const [active, setActive] = useState(0);

  const challengesQuery = useQuery({
    queryKey: ['challenges', 'list'],
    queryFn: ({ signal }) => challengesApi.list({}, signal),
    enabled: open,
    staleTime: 30_000,
  });

  const teamQuery = useQuery({
    queryKey: ['teams', 'me'],
    queryFn: () => teamsApi.me(),
    enabled: open && isAuthenticated,
    staleTime: 30_000,
  });

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') {
        event.preventDefault();
        setOpen(!usePaletteStore.getState().open);
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [setOpen]);

  useEffect(() => {
    if (!open) return;

    restoreRef.current =
      document.activeElement instanceof HTMLElement ? document.activeElement : null;
    setQuery('');
    setActive(0);

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const frame = requestAnimationFrame(() => inputRef.current?.focus());

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        setOpen(false);
      }
    };
    document.addEventListener('keydown', onKeyDown);

    return () => {
      cancelAnimationFrame(frame);
      document.removeEventListener('keydown', onKeyDown);
      document.body.style.overflow = previousOverflow;
      restoreRef.current?.focus();
    };
  }, [open, setOpen]);

  useEffect(() => {
    if (!open) return;
    document.getElementById(`palette-option-${active}`)?.scrollIntoView({ block: 'nearest' });
  }, [active, open]);

  const go = (to: string) => () => {
    setOpen(false);
    navigate(to);
  };

  const actions: PaletteAction[] = [
    { group: 'Go to', label: 'Home', icon: 'arrow-right', run: go('/') },
    ...NAV_LINKS.map<PaletteAction>((link) => ({
      group: 'Go to',
      label: link.label,
      icon: 'arrow-right',
      run: go(link.to),
    })),
    isAuthenticated
      ? { group: 'Go to', label: 'Account', icon: 'user', run: go('/account') }
      : { group: 'Go to', label: 'Sign in', icon: 'user', run: go('/login') },
  ];

  const team = teamQuery.data?.team ?? null;
  if (team) {
    actions.push({
      group: 'Team',
      label: `View ${team.name}`,
      icon: 'users',
      run: go(`/teams/${team.id}`),
    });
    if (team.inviteCode) {
      const code = team.inviteCode;
      actions.push({
        group: 'Team',
        label: 'Copy invite code',
        hint: code,
        icon: 'copy',
        run: () => {
          setOpen(false);
          navigator.clipboard
            .writeText(code)
            .then(() => toast.success('Invite code copied'))
            .catch(() => toast.error('Could not copy the invite code'));
        },
      });
    }
  } else if (isAuthenticated) {
    actions.push({
      group: 'Team',
      label: 'Create or join a team',
      icon: 'users',
      run: go('/teams'),
    });
  }

  if (isAdmin) {
    actions.push(
      { group: 'Organizer', label: 'Admin overview', icon: 'grid', run: go('/admin') },
      {
        group: 'Organizer',
        label: 'Manage challenges',
        icon: 'check',
        run: go('/admin/challenges'),
      },
      { group: 'Organizer', label: 'New challenge', icon: 'plus', run: go('/admin/challenges/new') },
      { group: 'Organizer', label: 'Categories', icon: 'filter', run: go('/admin/categories') },
      { group: 'Organizer', label: 'Events', icon: 'chart', run: go('/admin/events') },
      { group: 'Organizer', label: 'People & activity', icon: 'users', run: go('/admin/people') },
    );
  }

  if (isAuthenticated) {
    actions.push({
      group: 'Session',
      label: 'Sign out',
      icon: 'close',
      run: () => {
        setOpen(false);
        void logout().then(() => navigate('/'));
      },
    });
  }

  for (const challenge of challengesQuery.data?.challenges ?? []) {
    actions.push({
      group: 'Challenges',
      label: challenge.title,
      hint: `${challenge.category.name} · ${challenge.currentPoints} pts`,
      run: go(`/challenges/${challenge.id}`),
    });
  }

  const normalized = query.trim().toLowerCase();
  const matches = (
    normalized
      ? actions.filter((action) =>
          `${action.group} ${action.label} ${action.hint ?? ''}`.toLowerCase().includes(normalized),
        )
      : actions
  ).slice(0, MAX_RESULTS);

  const activeAction = matches[active];
  const activeId = activeAction ? `palette-option-${active}` : undefined;

  const groups: { name: PaletteGroup; items: { action: PaletteAction; index: number }[] }[] = [];
  matches.forEach((action, index) => {
    const last = groups.at(-1);
    if (last && last.name === action.group) last.items.push({ action, index });
    else groups.push({ name: action.group, items: [{ action, index }] });
  });

  function run(action: PaletteAction) {
    action.run();
  }

  function onInputKeyDown(event: React.KeyboardEvent<HTMLInputElement>) {
    if (event.key === 'ArrowDown') {
      event.preventDefault();
      setActive((index) => (matches.length === 0 ? 0 : (index + 1) % matches.length));
    } else if (event.key === 'ArrowUp') {
      event.preventDefault();
      setActive((index) => (matches.length === 0 ? 0 : (index - 1 + matches.length) % matches.length));
    } else if (event.key === 'Home') {
      event.preventDefault();
      setActive(0);
    } else if (event.key === 'End') {
      event.preventDefault();
      setActive(Math.max(0, matches.length - 1));
    } else if (event.key === 'Enter') {
      event.preventDefault();
      if (activeAction) run(activeAction);
    } else if (event.key === 'Tab') {
      event.preventDefault();
      inputRef.current?.focus();
    }
  }

  return (
    <AnimatePresence>
      {open && (
      <motion.div
        className="fixed inset-0 z-[70] flex items-start justify-center p-4 pt-[10vh] sm:pt-[14vh]"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.18, ease: [0.16, 1, 0.3, 1] }}
      >
        <div className="absolute inset-0 bg-scrim" onClick={() => setOpen(false)} aria-hidden />
        <motion.div
          role="dialog"
          aria-modal="true"
          aria-label="Command palette"
          className="relative w-full max-w-xl overflow-hidden rounded-lg border border-subtle bg-surface shadow-panel"
          initial={{ opacity: 0, y: -8, scale: 0.99 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -6 }}
          transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
        >
          <div className="flex items-center gap-3 border-b border-hairline px-4">
            <Icon name="search" size={18} className="text-muted" />
            <input
              ref={inputRef}
              type="text"
              role="combobox"
              aria-expanded={open}
              aria-controls="palette-listbox"
              aria-autocomplete="list"
              aria-activedescendant={activeId}
              aria-label="Search challenges and actions"
              autoComplete="off"
              spellCheck={false}
              placeholder="Search challenges or jump to a page…"
              value={query}
              onChange={(event) => {
                setQuery(event.target.value);
                setActive(0);
              }}
              onKeyDown={onInputKeyDown}
              className="h-14 w-full bg-transparent text-base text-primary outline-none placeholder:text-muted"
            />
            <kbd className="shrink-0 rounded-sm border border-subtle px-1.5 py-0.5 font-mono text-[0.6875rem] leading-none text-muted">
              Esc
            </kbd>
          </div>

          <div
            id="palette-listbox"
            role="listbox"
            aria-label="Results"
            className="max-h-[min(56vh,26rem)] overflow-y-auto p-2"
          >
            {matches.length === 0 ? (
              <p className="px-3 py-8 text-center type-small text-secondary">
                No matches for “{query.trim()}”.
              </p>
            ) : (
              groups.map((group) => (
                <div key={group.name} role="group" aria-label={group.name} className="pb-1">
                  <p aria-hidden className="type-label px-3 pb-1 pt-2.5 text-muted">
                    {group.name}
                  </p>
                  <ul role="none">
                    {group.items.map(({ action, index }) => (
                      <li
                        key={`${group.name}-${action.label}-${index}`}
                        id={`palette-option-${index}`}
                        role="option"
                        aria-selected={index === active}
                        onMouseMove={() => setActive(index)}
                        onMouseDown={(event) => event.preventDefault()}
                        onClick={() => run(action)}
                        className={cn(
                          'flex cursor-pointer items-center justify-between gap-3 rounded-sm px-3 py-2.5',
                          index === active
                            ? 'bg-elevated text-primary'
                            : 'text-secondary hover:bg-elevated/60',
                        )}
                      >
                        <span className="flex min-w-0 items-center gap-2.5">
                          {action.icon && <Icon name={action.icon} size={16} className="text-muted" />}
                          <span className="truncate type-small">{action.label}</span>
                        </span>
                        {action.hint && (
                          <span className="shrink-0 type-small text-muted">{action.hint}</span>
                        )}
                      </li>
                    ))}
                  </ul>
                </div>
              ))
            )}
          </div>

          <div className="flex items-center justify-between gap-4 border-t border-hairline px-4 py-2.5 type-small text-muted">
            <span aria-live="polite">
              {matches.length} {matches.length === 1 ? 'result' : 'results'}
            </span>
            <span aria-hidden className="hidden sm:inline">
              ↑↓ move · ↵ open · Esc close
            </span>
          </div>
        </motion.div>
      </motion.div>
      )}
    </AnimatePresence>
  );
}
