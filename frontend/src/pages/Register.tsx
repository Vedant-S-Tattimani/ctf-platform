import { useState } from 'react';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import { AuthLayout } from '@/components/auth/AuthLayout';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { useAuth } from '@/hooks/useAuth';
import { errorMessage, fieldErrorsFromApi } from '@/lib/errors';
import { toast } from '@/store/toast';

export default function Register() {
  const { register, isAuthenticated } = useAuth();
  const navigate = useNavigate();

  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  if (isAuthenticated) return <Navigate to="/account" replace />;

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setSubmitting(true);
    setFormError(null);
    setFieldErrors({});
    try {
      const user = await register(username.trim(), email.trim(), password);
      toast.success(
        `Account created, ${user.username}`,
        'You are signed in. Check your inbox for a verification link.',
      );
      navigate('/account', { replace: true });
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
      title="Create your account"
      subtitle="Register to join a team, solve challenges and climb the scoreboard."
      footer={
        <>
          Already registered?{' '}
          <Link to="/login" className="text-accent-strong hover:underline">
            Sign in
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
          label="Username"
          name="username"
          autoComplete="username"
          required
          placeholder="n3rdmeister"
          hint="3–32 characters: letters, numbers, _ . -"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          error={fieldErrors.username}
        />
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
          autoComplete="new-password"
          required
          hint="At least 8 characters."
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          error={fieldErrors.password}
        />
        <Button type="submit" size="lg" loading={submitting} className="w-full">
          Create account
        </Button>
      </form>
    </AuthLayout>
  );
}
