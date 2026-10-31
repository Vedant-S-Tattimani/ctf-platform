import { NavLink, useLocation } from 'react-router-dom';
import { Icon } from '@/lib/icons';
import { TAB_LINKS, hidesTabBar } from '@/lib/nav';
import { cn } from '@/lib/utils';

export function MobileTabBar() {
  const { pathname } = useLocation();
  if (hidesTabBar(pathname)) return null;

  return (
    <nav
      aria-label="Sections"
      className="fixed inset-x-0 bottom-0 z-40 border-t border-hairline bg-glass pb-[env(safe-area-inset-bottom)] backdrop-blur-md md:hidden"
    >
      <ul className="mx-auto grid max-w-container grid-cols-4">
        {TAB_LINKS.map((tab) => (
          <li key={tab.to}>
            <NavLink
              to={tab.to}
              className={({ isActive }) =>
                cn(
                  'flex h-16 flex-col items-center justify-center gap-1.5 type-small',
                  'transition-colors duration-instant',
                  isActive ? 'text-primary' : 'text-muted hover:text-secondary',
                )
              }
            >
              {({ isActive }) => (
                <>
                  <span
                    aria-hidden
                    className={cn(
                      'grid size-9 place-items-center rounded-pill transition-colors duration-instant',
                      isActive ? 'bg-elevated text-primary' : 'bg-transparent',
                    )}
                  >
                    <Icon name={tab.icon} size={19} strokeWidth={isActive ? 2.1 : 1.8} />
                  </span>
                  <span className={isActive ? 'font-semibold' : undefined}>{tab.label}</span>
                </>
              )}
            </NavLink>
          </li>
        ))}
      </ul>
    </nav>
  );
}
