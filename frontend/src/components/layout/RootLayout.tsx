import { Outlet, useLocation } from 'react-router-dom';
import { CommandPalette } from '@/components/layout/CommandPalette';
import { Footer } from '@/components/layout/Footer';
import { MobileTabBar } from '@/components/layout/MobileTabBar';
import { Navbar } from '@/components/layout/Navbar';
import { ScrollToTop } from '@/components/layout/ScrollToTop';
import { SkipLink } from '@/components/layout/SkipLink';
import { Toaster } from '@/components/ui/Toast';
import { hidesFooter, hidesTabBar } from '@/lib/nav';
import { cn } from '@/lib/utils';

export function RootLayout() {
  const { pathname } = useLocation();
  const showTabs = !hidesTabBar(pathname);
  /* Keyed by page group, not full pathname: the challenge board swaps its panel
     in place and must not replay the route transition or remount the list. */
  const section = `/${pathname.split('/')[1] ?? ''}`;

  return (
    <div
      className={cn(
        'flex min-h-screen flex-col bg-canvas',
        showTabs && 'pb-[calc(4rem+env(safe-area-inset-bottom))] md:pb-0',
      )}
    >
      <SkipLink />
      <ScrollToTop />
      <Navbar />
      <div
        key={section}
        id="main-content"
        tabIndex={-1}
        className="page-enter min-h-[calc(100svh-4rem)] flex-1 outline-none"
      >
        <Outlet />
      </div>
      {!hidesFooter(pathname) && <Footer />}
      <MobileTabBar />
      <CommandPalette />
      <Toaster />
    </div>
  );
}
