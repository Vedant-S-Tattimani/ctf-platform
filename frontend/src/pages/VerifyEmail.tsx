import { useEffect, useRef, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { authApi } from '@/api/auth';
import { AuthLayout } from '@/components/auth/AuthLayout';
import { buttonVariants } from '@/components/ui/Button';
import { Skeleton } from '@/components/ui/Skeleton';
import { useAuth } from '@/hooks/useAuth';
import { errorMessage } from '@/lib/errors';

type State =
  | { kind: 'pending' }
  | { kind: 'success'; username: string }
  | { kind: 'error'; message: string };

export default function VerifyEmail() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token') ?? '';
  const { isAuthenticated, refresh } = useAuth();
  const [state, setState] = useState<State>({ kind: 'pending' });
  const started = useRef(false);

  useEffect(() => {
    if (started.current) return;
    started.current = true;
    if (!token) {
      setState({
        kind: 'error',
        message: 'This page needs the verification token from your email link.',
      });
      return;
    }
    authApi
      .verifyEmail(token)
      .then(async ({ user }) => {
        setState({ kind: 'success', username: user.username });
        if (isAuthenticated) await refresh();
      })
      .catch((error: unknown) => {
        setState({ kind: 'error', message: errorMessage(error) });
      });
  }, [token, isAuthenticated, refresh]);

  if (state.kind === 'pending') {
    return (
      <AuthLayout
        title="Verifying your email"
        subtitle="This takes a moment. Keep this tab open."
        footer={
          <>
            <Link to="/" className="text-accent-strong hover:underline">
              Back home
            </Link>
          </>
        }
      >
        <div className="flex flex-col gap-4" aria-busy="true">
          <Skeleton className="h-5 w-2/3" />
          <Skeleton className="h-5 w-1/2" />
          <span className="sr-only" role="status">
            Checking the verification link…
          </span>
        </div>
      </AuthLayout>
    );
  }

  if (state.kind === 'error') {
    return (
      <AuthLayout
        title="That link did not work"
        subtitle="Verification links are single use and expire after a day."
        footer={
          <>
            Wrong account?{' '}
            <Link to="/login" className="text-accent-strong hover:underline">
              Sign in
            </Link>
          </>
        }
      >
        <div className="flex flex-col gap-4">
          <p
            role="alert"
            className="rounded-md border border-danger bg-danger-faint p-3 type-small text-danger"
          >
            {state.message}
          </p>
          <p className="type-small text-secondary">
            {isAuthenticated
              ? 'Open your account page and send a fresh verification link.'
              : 'Sign in, then send yourself a fresh link from your account page.'}
          </p>
          <Link
            to={isAuthenticated ? '/account' : '/login'}
            className={buttonVariants('primary', 'md', 'w-full')}
          >
            {isAuthenticated ? 'Go to your account' : 'Sign in'}
          </Link>
        </div>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout
      title="Email verified"
      subtitle={`Thanks, ${state.username}. Your address is now on your account.`}
      footer={
        <>
          Signed in elsewhere?{' '}
          <Link to="/account" className="text-accent-strong hover:underline">
            Open your account
          </Link>
        </>
      }
    >
      <div className="flex flex-col gap-4">
        <p
          role="status"
          className="rounded-md border border-success bg-success-faint p-3 type-small text-success"
        >
          Verification confirmed. Nothing else is needed from you.
        </p>
        <div className="flex flex-wrap gap-3">
          <Link to="/challenges" className={buttonVariants('primary', 'md')}>
            Browse challenges
          </Link>
          <Link to={isAuthenticated ? '/account' : '/login'} className={buttonVariants('secondary', 'md')}>
            {isAuthenticated ? 'Your account' : 'Sign in'}
          </Link>
        </div>
      </div>
    </AuthLayout>
  );
}
