import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { authApi } from '@/api/auth';
import { usersApi } from '@/api/users';
import { PageShell } from '@/components/layout/PageShell';
import { Badge } from '@/components/ui/Badge';
import { Button, buttonVariants } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Skeleton } from '@/components/ui/Skeleton';
import { Tabs } from '@/components/ui/Tabs';
import { useAuth } from '@/hooks/useAuth';
import { errorMessage } from '@/lib/errors';
import { formatDateUTC } from '@/lib/format';
import { toast } from '@/store/toast';

type AccountTab = 'profile' | 'account' | 'team';

export default function Account() {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const { logout } = useAuth();
  const [tab, setTab] = useState<AccountTab>('profile');
  const [signingOut, setSigningOut] = useState(false);
  const [resending, setResending] = useState(false);

  const { data, isPending, isError } = useQuery({
    queryKey: ['users', 'me'],
    queryFn: usersApi.me,
  });
  const user = data?.user;

  const [bio, setBio] = useState('');
  const [avatarUrl, setAvatarUrl] = useState('');

  useEffect(() => {
    if (user) {
      setBio(user.bio ?? '');
      setAvatarUrl(user.avatarUrl ?? '');
    }
  }, [user]);

  const updateProfile = useMutation({
    mutationFn: () =>
      usersApi.updateMe({
        bio: bio.trim() || null,
        avatarUrl: avatarUrl.trim() || null,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users', 'me'] });
      toast.success('Profile saved');
    },
    onError: (error) => toast.error('Could not save profile', errorMessage(error)),
  });

  async function handleResendVerification() {
    setResending(true);
    try {
      const result = await authApi.resendVerification();
      if (result.alreadyVerified) toast.success('Your email is already verified');
      else toast.success('Verification link sent', 'Check your inbox for the single-use link.');
    } catch (error) {
      toast.error('Could not send the verification link', errorMessage(error));
    } finally {
      setResending(false);
    }
  }

  async function handleSignOut() {
    setSigningOut(true);
    try {
      await logout();
      toast.success('Signed out');
      navigate('/');
    } finally {
      setSigningOut(false);
    }
  }

  if (isPending) {
    return (
      <PageShell title="Your account">
        <div className="flex flex-col gap-6">
          <Skeleton className="h-10 w-64" />
          <Skeleton className="h-56" />
        </div>
      </PageShell>
    );
  }

  if (isError || !user) {
    return (
      <PageShell title="Your account">
        <p className="text-secondary">
          We could not load your profile.{' '}
          <Link to="/login" className="text-accent-strong hover:underline">
            Sign in again
          </Link>{' '}
          to refresh your session.
        </p>
      </PageShell>
    );
  }

  return (
    <PageShell
      title={`Hey, ${user.username}`}
      description="Your public profile, sign-in details and team."
    >
      <Tabs
        label="Account sections"
        value={tab}
        onChange={(value) => setTab(value as AccountTab)}
        items={[
          {
            value: 'profile',
            label: 'Profile',
            content: (
              <section aria-labelledby="profile-settings-title" className="max-w-xl">
                <h2 id="profile-settings-title" className="type-h3 text-primary">
                  Public profile
                </h2>
                <p className="mt-1 type-small text-secondary">
                  Shown to other players on the scoreboard and team pages.
                </p>
                <form
                  className="mt-5 flex flex-col gap-5"
                  onSubmit={(event) => {
                    event.preventDefault();
                    updateProfile.mutate();
                  }}
                >
                  <Input
                    label="Bio"
                    value={bio}
                    onChange={(event) => setBio(event.target.value)}
                    placeholder="What do you hack on?"
                    maxLength={280}
                    hint={`${bio.length}/280 characters`}
                  />
                  <Input
                    label="Avatar URL"
                    value={avatarUrl}
                    onChange={(event) => setAvatarUrl(event.target.value)}
                    placeholder="https://…"
                    inputMode="url"
                    hint="Leave blank to use your initials."
                  />
                  <div className="flex flex-wrap items-center gap-3">
                    <Button type="submit" loading={updateProfile.isPending}>
                      Save profile
                    </Button>
                    <Link
                      to={`/users/${user.id}`}
                      className={buttonVariants('ghost', 'sm')}
                    >
                      View public profile
                    </Link>
                  </div>
                </form>
              </section>
            ),
          },
          {
            value: 'account',
            label: 'Account',
            content: (
              <section aria-labelledby="account-details-title" className="max-w-xl">
                <h2 id="account-details-title" className="type-h3 text-primary">
                  Sign-in details
                </h2>
                <p className="mt-1 type-small text-secondary">
                  Contact an organizer if any of these details are wrong.
                </p>
                {!user.emailVerifiedAt && (
                  <div className="mt-4 flex flex-col gap-3 rounded-md border border-warning bg-warning-faint p-3 sm:flex-row sm:items-center sm:justify-between">
                    <p className="type-small text-warning">
                      This email address is not verified yet. Some events require a verified email
                      before you can submit flags.
                    </p>
                    <Button
                      variant="secondary"
                      size="sm"
                      className="shrink-0 self-start sm:self-auto"
                      loading={resending}
                      onClick={() => void handleResendVerification()}
                    >
                      Resend link
                    </Button>
                  </div>
                )}
                <dl className="mt-4 flex flex-col type-small">
                  <div className="flex flex-wrap items-center justify-between gap-4 border-b border-hairline py-3">
                    <dt className="text-muted">Email</dt>
                    <dd className="flex flex-wrap items-center gap-2">
                      <span className="font-mono text-primary">{user.email}</span>
                      {user.emailVerifiedAt ? (
                        <Badge tone="success">Verified</Badge>
                      ) : (
                        <Badge tone="warning">Unverified</Badge>
                      )}
                    </dd>
                  </div>
                  <div className="flex flex-wrap items-center justify-between gap-4 border-b border-hairline py-3">
                    <dt className="text-muted">Role</dt>
                    <dd>
                      <Badge tone={user.role === 'ADMIN' ? 'accent' : 'neutral'}>{user.role}</Badge>
                    </dd>
                  </div>
                  <div className="flex flex-wrap items-center justify-between gap-4 py-3">
                    <dt className="text-muted">Member since</dt>
                    <dd className="nums text-primary">{formatDateUTC(user.createdAt)}</dd>
                  </div>
                </dl>
                <div className="mt-6 border-t border-hairline pt-6">
                  <h3 className="type-label text-muted">Password</h3>
                  <p className="mt-2 type-small text-secondary">
                    Request a single-use link by email to set a new password. Links expire after one
                    hour and sign out other sessions when used.
                  </p>
                  <Link
                    to="/forgot-password"
                    className={buttonVariants('secondary', 'sm', 'mt-3')}
                  >
                    Reset password
                  </Link>
                </div>
                <div className="mt-6 border-t border-hairline pt-6">
                  <Button
                    variant="secondary"
                    size="sm"
                    className="text-danger hover:bg-danger-faint"
                    loading={signingOut}
                    onClick={() => void handleSignOut()}
                  >
                    Sign out
                  </Button>
                </div>
              </section>
            ),
          },
          {
            value: 'team',
            label: 'Team',
            content: (
              <section aria-labelledby="team-summary-title" className="max-w-xl">
                <h2 id="team-summary-title" className="type-h3 text-primary">
                  Team
                </h2>
                {user.teamId ? (
                  <>
                    <p className="mt-2 text-secondary">
                      You are in{' '}
                      <Link
                        to={`/teams/${user.teamId}`}
                        className="font-medium text-accent-strong hover:underline"
                      >
                        {user.teamName ?? 'your team'}
                      </Link>
                      . Flags you solve count toward the team total.
                    </p>
                    <Link to="/teams" className={buttonVariants('secondary', 'sm', 'mt-4')}>
                      Manage team
                    </Link>
                  </>
                ) : (
                  <>
                    <p className="mt-2 text-secondary">
                      You have not joined a team yet. Create one or join with an invite code.
                    </p>
                    <Link to="/teams" className={buttonVariants('primary', 'sm', 'mt-4')}>
                      Find a team
                    </Link>
                  </>
                )}
              </section>
            ),
          },
        ]}
      />
    </PageShell>
  );
}
