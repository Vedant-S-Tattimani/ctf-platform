import { useState } from 'react';
import { Link } from 'react-router-dom';
import { authApi } from '@/api/auth';
import { AuthLayout } from '@/components/auth/AuthLayout';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { errorMessage, fieldErrorsFromApi } from '@/lib/errors';

export default function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setSubmitting(true);
    setFormError(null);
    setFieldErrors({});
    try {
      const result = await authApi.forgotPassword(email.trim());
      setSent(result.message);
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

  return (
    <AuthLayout
      title="Reset your password"
      subtitle="Enter your account email and we will send a single-use link to set a new password."
      footer={
        <>
          Remembered it?{' '}
          <Link to="/login" className="text-accent-strong hover:underline">
            Sign in
          </Link>
        </>
      }
    >
      {sent ? (
        <div className="flex flex-col gap-4">
          <p
            role="status"
            className="rounded-md border border-success bg-success-faint p-3 type-small text-success"
          >
            {sent}
          </p>
          <p className="type-small text-secondary">
            The link expires after one hour. If it does not arrive, check your spam folder or try
            again.
          </p>
          <Button variant="secondary" onClick={() => setSent(null)} className="w-full">
            Use a different email
          </Button>
        </div>
      ) : (
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
            label="Email"
            type="email"
            name="email"
            autoComplete="email"
            required
            placeholder="you@example.com"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            error={fieldErrors.email}
          />
          <Button type="submit" size="lg" loading={submitting} className="w-full">
            Send reset link
          </Button>
        </form>
      )}
    </AuthLayout>
  );
}
