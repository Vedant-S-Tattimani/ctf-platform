import { useState } from 'react';
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom';
import { AuthLayout } from '@/components/auth/AuthLayout';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { useAuth } from '@/hooks/useAuth';
import { errorMessage, fieldErrorsFromApi } from '@/lib/errors';
import { toast } from '@/store/toast';

export default function Login() {
  const { login, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const from = (location.state as { from?: string } | null)?.from ?? '/account';

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  if (isAuthenticated) return <Navigate to={from} replace />;

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setSubmitting(true);
    setFormError(null);
    setFieldErrors({});
    try {
      const user = await login(email.trim(), password);
      toast.success(`Welcome back, ${user.username}`, 'You are signed in.');
      navigate(from, { replace: true });
    } catch (error) {
      const fields = fieldErrorsFromApi(error);
      setFieldErrors(fields);
      setFormError(
        error instanceof Error && Object.keys(fields).length === 0
          ? errorMessage(error)
          : 'Check the highlighted fields and try again.',
      );
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <AuthLayout
      title="Sign in"
      subtitle="Use the email and password you registered with."
      footer={
        <>
          Prefer to look around first?{' '}
          <Link to="/" className="text-accent-strong hover:underline">
            Back home
          </Link>
        </>
      }
    >
      <form onSubmit={handleSubmit} className="flex flex-col gap-5" noValidate>
        {formError && (
          <p role="alert" className="type-small rounded-md border border-danger bg-danger-faint p-3 text-danger">
            {formError}
          </p>
        )}
        <Input
          label="Email"
          type="email"
          name="email"
          autoComplete="email"
          required
          placeholder="you@example.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          error={fieldErrors.email}
        />
        <Input
          label="Password"
          type="password"
          name="password"
          autoComplete="current-password"
          required
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          error={fieldErrors.password}
        />
        <div className="-mt-2 flex justify-end">
          <Link
            to="/forgot-password"
            className="rounded-sm type-small text-secondary transition-colors duration-instant hover:text-primary"
          >
            Forgot password?
          </Link>
        </div>
        <Button type="submit" size="lg" loading={submitting} className="w-full">
          Sign in
        </Button>
        <p className="type-small text-center text-muted">
          New here?{' '}
          <Link to="/register" className="text-accent-strong hover:underline">
            Create an account
          </Link>
        </p>
      </form>
    </AuthLayout>
  );
}
