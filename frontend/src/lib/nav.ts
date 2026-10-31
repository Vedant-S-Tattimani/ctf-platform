import type { IconName } from '@/lib/icons';

export const NAV_LINKS = [
  { to: '/challenges', label: 'Challenges' },
  { to: '/scoreboard', label: 'Scoreboard' },
  { to: '/teams', label: 'Teams' },
] as const;

export const TAB_LINKS: { to: string; label: string; icon: IconName }[] = [
  { to: '/challenges', label: 'Board', icon: 'grid' },
  { to: '/scoreboard', label: 'Scores', icon: 'chart' },
  { to: '/teams', label: 'Teams', icon: 'users' },
  { to: '/account', label: 'Me', icon: 'user' },
];

const AUTH_PATHS = ['/login', '/register', '/forgot-password', '/reset-password', '/verify-email'];

/** Screens that carry their own single-task layout: no footer, no bottom tabs. */
export function isImmersivePath(pathname: string): boolean {
  return AUTH_PATHS.some((path) => pathname === path || pathname.startsWith(`${path}/`));
}

export function hidesTabBar(pathname: string): boolean {
  return (
    isImmersivePath(pathname) ||
    pathname.startsWith('/admin') ||
    /^\/challenges\/[^/]+/.test(pathname)
  );
}

export function hidesFooter(pathname: string): boolean {
  return isImmersivePath(pathname) || pathname.startsWith('/admin');
}
