import { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { authApi } from '@/api/auth';
import { AuthLayout } from '@/components/auth/AuthLayout';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { useAuth } from '@/hooks/useAuth';
import { errorMessage, fieldErrorsFromApi } from '@/lib/errors';
import { toast } from '@/store/toast';

export default function ResetPassword() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token') ?? '';
  const navigate = useNavigate();
  const { refresh } = useAuth();

  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setFormError(null);
    setFieldErrors({});
    if (password !== confirm) {
      setFieldErrors({ confirm: 'Passwords do not match.' });
      return;
    }
    setSubmitting(true);
    try {
      await authApi.resetPassword(token, password);
      toast.success('Password updated', 'Sign in with your new password.');
      await refresh();
      navigate('/login', { replace: true });
    } catch (error) {
      const fields = fieldErrorsFromApi(error);
      setFieldErrors(fields);
      setFormError(
        Object.keys(fields).length === 0
          ? errorMessage(error)
          : 'Check the highlighted fields and try again.',
      );
    } finally {
      setSubmitting(false);
    }
  }

  if (!token) {
    return (
      <AuthLayout
        title="Reset link missing"
        subtitle="This page needs the single-use token from your email."
        footer={
          <>
            Need a new one?{' '}
            <Link to="/forgot-password" className="text-accent-strong hover:underline">
              Request a reset link
            </Link>
          </>
        }
      >
        <p className="text-secondary">
          Open the reset link from your inbox directly, or request a fresh link to start again.
        </p>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout
      title="Choose a new password"
      subtitle="This link works once and expires one hour after it was sent."
      footer={
        <>
          Changed your mind?{' '}
          <Link to="/login" className="text-accent-strong hover:underline">
            Back to sign in
          </Link>
        </>
      }
    >
      <form onSubmit={handleSubmit} className="flex flex-col gap-5" noValidate>
        {formError && (
          <p
            role="alert"
            className="type-small rounded-md border border-danger bg-danger-faint p-3 text-danger"
          >
            {formError}
          </p>
        )}
        <Input
          label="New password"
          type="password"
          name="password"
          autoComplete="new-password"
          required
          hint="At least 8 characters."
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          error={fieldErrors.password}
        />
        <Input
          label="Confirm new password"
          type="password"
          name="confirm"
          autoComplete="new-password"
          required
          value={confirm}
          onChange={(event) => setConfirm(event.target.value)}
          error={fieldErrors.confirm}
        />
        <Button
          type="submit"
          size="lg"
          loading={submitting}
          disabled={!password || !confirm}
          className="w-full"
        >
          Set new password
        </Button>
        <p className="type-small text-muted">
          All other signed-in sessions are signed out when the new password is saved.
        </p>
      </form>
    </AuthLayout>
  );
}
