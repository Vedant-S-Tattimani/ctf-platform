import { Link, NavLink, Outlet } from 'react-router-dom';
import { Badge } from '@/components/ui/Badge';
import { cn } from '@/lib/utils';

const ADMIN_LINKS: { to: string; label: string; end?: boolean }[] = [
  { to: '/admin', label: 'Overview', end: true },
  { to: '/admin/challenges', label: 'Challenges' },
  { to: '/admin/categories', label: 'Categories' },
  { to: '/admin/events', label: 'Events' },
  { to: '/admin/people', label: 'People & activity' },
];

export default function Admin() {
  return (
    <main className="mx-auto w-full max-w-container px-4 py-8 sm:px-6 lg:py-10">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3 border-b border-hairline pb-4">
        <div className="flex flex-wrap items-center gap-3">
          <p className="type-label text-muted">Admin</p>
          <Badge tone="accent">Organizer</Badge>
        </div>
        <Link
          to="/challenges"
          className="type-small text-secondary transition-colors duration-instant hover:text-primary"
        >
          Public board →
        </Link>
      </div>

      <div className="grid gap-8 lg:grid-cols-[10.5rem_minmax(0,1fr)] lg:gap-12">
        <nav aria-label="Admin sections" className="min-w-0 lg:sticky lg:top-24 lg:self-start">
          <div className="-mx-4 flex flex-wrap border-b border-hairline px-4 sm:-mx-6 sm:px-6 lg:hidden">
            {ADMIN_LINKS.map((link) => (
              <NavLink
                key={link.to}
                to={link.to}
                end={link.end}
                className={({ isActive }) =>
                  cn(
                    '-mb-px flex min-h-11 shrink-0 items-center whitespace-nowrap border-b-2 px-3 type-small font-medium transition-colors duration-instant',
                    isActive
                      ? 'border-b-accent text-primary'
                      : 'border-b-transparent text-secondary hover:text-primary',
                  )
                }
              >
                {link.label}
              </NavLink>
            ))}
          </div>

          <ul className="hidden border-t border-hairline lg:block">
            {ADMIN_LINKS.map((link) => (
              <li key={link.to} className="border-b border-hairline">
                <NavLink
                  to={link.to}
                  end={link.end}
                  className={({ isActive }) =>
                    cn(
                      'flex min-h-11 items-center border-l-2 px-3 type-small font-medium transition-colors duration-instant',
                      isActive
                        ? 'border-l-accent bg-accent-faint text-primary'
                        : 'border-l-transparent text-secondary hover:bg-elevated hover:text-primary',
                    )
                  }
                >
                  {link.label}
                </NavLink>
              </li>
            ))}
          </ul>
        </nav>

        <div className="min-w-0">
          <Outlet />
        </div>
      </div>
    </main>
  );
}
