import { Link, Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { PageShell } from '@/components/layout/PageShell';
import { buttonVariants } from '@/components/ui/Button';

export function RequireAdmin({ children }: { children: React.ReactNode }) {
  const { status, isAdmin } = useAuth();
  const location = useLocation();

  if (status === 'loading') {
    return (
      <div className="mx-auto flex max-w-container flex-col gap-4 px-4 py-16 sm:px-6">
        <div className="h-9 w-48 animate-pulse rounded-md bg-elevated" />
        <div className="mt-4 h-64 animate-pulse rounded-lg bg-elevated" />
        <span className="sr-only" role="status">
          Checking your permissions…
        </span>
      </div>
    );
  }

  if (status === 'guest') {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  }

  if (!isAdmin) {
    return (
      <PageShell title="Admins only" description="This area is restricted to competition organizers.">
        <div className="rounded-lg border border-hairline bg-surface p-8">
          <p className="text-secondary">
            Your account does not have admin access. If you believe this is a mistake, contact the
            organizers.
          </p>
          <Link to="/" className={buttonVariants('secondary', 'md', 'mt-5')}>
            Back to the platform
          </Link>
        </div>
      </PageShell>
    );
  }

  return <>{children}</>;
}
