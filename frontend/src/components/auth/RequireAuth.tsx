import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';

export function RequireAuth({ children }: { children: React.ReactNode }) {
  const { status } = useAuth();
  const location = useLocation();

  if (status === 'loading') {
    return (
      <div className="mx-auto flex max-w-container flex-col gap-4 px-4 py-16 sm:px-6">
        <div className="h-9 w-48 animate-pulse rounded-md bg-elevated" />
        <div className="h-4 w-72 animate-pulse rounded-md bg-elevated" />
        <div className="mt-4 h-64 animate-pulse rounded-lg bg-elevated" />
        <span className="sr-only" role="status">
          Loading your session…
        </span>
      </div>
    );
  }

  if (status === 'guest') {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  }

  return <>{children}</>;
}
