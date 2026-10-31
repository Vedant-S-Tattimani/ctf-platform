import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { teamsApi } from '@/api/teams';
import type { Team } from '@/api/types';
import { Avatar } from '@/components/ui/Avatar';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { CopyButton } from '@/components/ui/CopyButton';
import { Input } from '@/components/ui/Input';
import { useAuth } from '@/hooks/useAuth';
import { errorMessage, fieldErrorsFromApi } from '@/lib/errors';
import { formatDateUTC } from '@/lib/format';
import { toast } from '@/store/toast';

export function TeamPanel({ team }: { team: Team }) {
  const { user, refresh } = useAuth();
  const queryClient = useQueryClient();
  const isOwner = team.ownerId === user?.id;

  const [name, setName] = useState(team.name);
  const [description, setDescription] = useState(team.description ?? '');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [confirmingLeave, setConfirmingLeave] = useState(false);
  const [confirmingRotate, setConfirmingRotate] = useState(false);
  const [memberAction, setMemberAction] = useState<{
    kind: 'remove' | 'transfer';
    userId: string;
  } | null>(null);

  useEffect(() => {
    setName(team.name);
    setDescription(team.description ?? '');
  }, [team.name, team.description]);

  const update = useMutation({
    mutationFn: () =>
      teamsApi.updateMine({
        name: name.trim(),
        description: description.trim() || null,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['teams'] });
      toast.success('Team updated');
    },
    onError: (error) => {
      const fields = fieldErrorsFromApi(error);
      setErrors(fields);
      if (!Object.keys(fields).length) toast.error('Could not update the team', errorMessage(error));
    },
  });

  const leave = useMutation({
    mutationFn: () => teamsApi.leave(),
    onSuccess: async (result) => {
      queryClient.invalidateQueries({ queryKey: ['teams'] });
      queryClient.invalidateQueries({ queryKey: ['scoreboard'] });
      await refresh();
      toast.success(
        'You left the team',
        result.deleted ? 'The team had no other members and was deleted.' : undefined,
      );
    },
    onError: (error) => toast.error('Could not leave the team', errorMessage(error)),
  });

  const removeMember = useMutation({
    mutationFn: (userId: string) => teamsApi.removeMember(userId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['teams'] });
      queryClient.invalidateQueries({ queryKey: ['scoreboard'] });
      setMemberAction(null);
      toast.success('Member removed', 'They can rejoin with a current invite code.');
    },
    onError: (error) => toast.error('Could not remove the member', errorMessage(error)),
  });

  const transfer = useMutation({
    mutationFn: (userId: string) => teamsApi.transferOwnership(userId),
    onSuccess: async () => {
      queryClient.invalidateQueries({ queryKey: ['teams'] });
      await refresh();
      setMemberAction(null);
      toast.success('Ownership transferred', 'You are now a regular member of this team.');
    },
    onError: (error) => toast.error('Could not transfer ownership', errorMessage(error)),
  });

  const rotate = useMutation({
    mutationFn: teamsApi.regenerateInviteCode,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['teams'] });
      setConfirmingRotate(false);
      toast.success('Invite code rotated', 'The previous code no longer works.');
    },
    onError: (error) => toast.error('Could not rotate the invite code', errorMessage(error)),
  });

  return (
    <div className="grid gap-10 lg:grid-cols-[minmax(0,1fr)_19rem] lg:gap-0">
      <div className="flex flex-col gap-8 lg:pr-10">
        <header className="flex items-start gap-4 sm:gap-5">
          <Avatar name={team.name} src={team.avatarUrl} size="lg" />
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="type-h2 text-primary">{team.name}</h2>
              {isOwner && <Badge tone="accent">Owner</Badge>}
            </div>
            <p className="mt-1 max-w-measure text-secondary">
              {team.description ?? 'No description yet. The owner can add one below.'}
            </p>
            <p className="mt-2 type-small text-muted">
              {team.memberCount} of {team.maxSize} seats taken
            </p>
          </div>
        </header>

        <section aria-labelledby="roster-title" className="border-t border-hairline pt-6">
          <div className="flex flex-wrap items-baseline justify-between gap-2">
            <h3 id="roster-title" className="type-h3 text-primary">
              Roster
            </h3>
            <span className="type-small text-muted">
              {team.memberCount}/{team.maxSize} seats
            </span>
          </div>
          {isOwner && team.memberCount > 1 && (
            <p className="mt-1 type-small text-muted">
              As owner you can remove members or hand over ownership.
            </p>
          )}
          <ul className="mt-2">
            {team.members.map((member) => {
              const action = memberAction?.userId === member.id ? memberAction.kind : null;
              return (
                <li key={member.id} className="border-b border-hairline py-3 last:border-b-0">
                  <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
                    <Avatar name={member.username} src={member.avatarUrl} size="sm" />
                    <Link
                      to={`/users/${member.id}`}
                      className="min-w-0 flex-1 truncate font-medium text-primary transition-colors duration-instant hover:text-accent-strong"
                    >
                      {member.username}
                    </Link>
                    {member.id === team.ownerId && <Badge tone="accent">Owner</Badge>}
                    {member.id === user?.id && <span className="type-small text-muted">You</span>}
                    {isOwner && member.id !== team.ownerId && (
                      <span className="flex shrink-0 items-center gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() =>
                            setMemberAction({ kind: 'transfer', userId: member.id })
                          }
                        >
                          Make owner
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-danger hover:bg-danger-faint"
                          onClick={() => setMemberAction({ kind: 'remove', userId: member.id })}
                        >
                          Remove
                        </Button>
                      </span>
                    )}
                  </div>
                  {action && (
                    <div className="mt-2 flex flex-wrap items-center gap-2 rounded-md border border-hairline bg-elevated px-3 py-2">
                      <span className="type-small text-secondary">
                        {action === 'remove'
                          ? `Remove ${member.username} from the team?`
                          : `Make ${member.username} the owner? You lose owner controls.`}
                      </span>
                      <Button
                        variant={action === 'remove' ? 'danger' : 'primary'}
                        size="sm"
                        loading={
                          (action === 'remove' && removeMember.isPending) ||
                          (action === 'transfer' && transfer.isPending)
                        }
                        onClick={() => {
                          if (action === 'remove') removeMember.mutate(member.id);
                          else transfer.mutate(member.id);
                        }}
                      >
                        Confirm
                      </Button>
                      <Button variant="ghost" size="sm" onClick={() => setMemberAction(null)}>
                        Cancel
                      </Button>
                    </div>
                  )}
                </li>
              );
            })}
          </ul>
        </section>

        {isOwner && (
          <section aria-labelledby="team-settings-title" className="border-t border-hairline pt-6">
            <h3 id="team-settings-title" className="type-h3 text-primary">
              Team settings
            </h3>
            <p className="mt-1 type-small text-secondary">
              Only the owner can rename the team or edit its description.
            </p>
            <form
              className="mt-5 flex max-w-lg flex-col gap-4"
              onSubmit={(event) => {
                event.preventDefault();
                setErrors({});
                update.mutate();
              }}
            >
              <Input
                label="Team name"
                value={name}
                onChange={(event) => setName(event.target.value)}
                maxLength={40}
                error={errors.name}
              />
              <Input
                label="Description"
                value={description}
                onChange={(event) => setDescription(event.target.value)}
                maxLength={300}
                error={errors.description}
              />
              <div>
                <Button type="submit" loading={update.isPending} disabled={!name.trim()}>
                  Save changes
                </Button>
              </div>
            </form>
          </section>
        )}
      </div>

      <aside className="flex flex-col gap-8 lg:border-l lg:border-hairline lg:pl-8">
        <section aria-labelledby="invite-title">
          <h3 id="invite-title" className="type-label text-muted">
            Invite code
          </h3>
          <p className="mt-2 type-small text-secondary">
            Share this code so teammates can join the crew.
          </p>
          {team.inviteCode ? (
            <>
              <div className="mt-3 flex flex-wrap items-center gap-3">
                <code className="rounded-sm border border-subtle bg-elevated px-3 py-1.5 font-mono text-h3 tracking-[0.25em] text-primary">
                  {team.inviteCode}
                </code>
                <CopyButton value={team.inviteCode} label="Copy code" copiedLabel="Copied" />
              </div>
              {isOwner &&
                (confirmingRotate ? (
                  <div className="mt-3 flex flex-wrap items-center gap-2">
                    <span className="type-small text-secondary">Rotate the code now?</span>
                    <Button
                      variant="secondary"
                      size="sm"
                      loading={rotate.isPending}
                      onClick={() => rotate.mutate()}
                    >
                      Yes, rotate
                    </Button>
                    <Button variant="ghost" size="sm" onClick={() => setConfirmingRotate(false)}>
                      Cancel
                    </Button>
                  </div>
                ) : (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="mt-2 -ml-3"
                    onClick={() => setConfirmingRotate(true)}
                  >
                    Rotate code
                  </Button>
                ))}
            </>
          ) : (
            <p className="mt-3 text-secondary">Only team members can see the invite code.</p>
          )}
        </section>

        <section aria-labelledby="team-details-title" className="border-t border-hairline pt-6">
          <h3 id="team-details-title" className="type-label text-muted">
            Details
          </h3>
          <dl className="mt-2 flex flex-col type-small">
            <div className="flex items-center justify-between gap-4 border-b border-hairline py-2.5">
              <dt className="text-muted">Created</dt>
              <dd className="nums text-primary">{formatDateUTC(team.createdAt)}</dd>
            </div>
            <div className="flex items-center justify-between gap-4 py-2.5">
              <dt className="text-muted">Seats</dt>
              <dd className="nums text-primary">
                {team.memberCount}/{team.maxSize}
              </dd>
            </div>
          </dl>
        </section>

        <section aria-labelledby="leave-team-title" className="border-t border-hairline pt-6">
          <h3 id="leave-team-title" className="type-label text-muted">
            Leave team
          </h3>
          <p className="mt-2 type-small text-secondary">
            {isOwner && team.memberCount > 1
              ? 'Owners cannot leave while other members are on the team.'
              : 'You can join another team with an invite code afterwards.'}
          </p>
          {confirmingLeave ? (
            <div className="mt-3 flex flex-wrap items-center gap-2">
              <span className="type-small text-danger">Leave this team?</span>
              <Button
                variant="danger"
                size="sm"
                loading={leave.isPending}
                onClick={() => leave.mutate()}
              >
                Yes, leave
              </Button>
              <Button variant="ghost" size="sm" onClick={() => setConfirmingLeave(false)}>
                Cancel
              </Button>
            </div>
          ) : (
            <Button
              variant="ghost"
              size="sm"
              className="mt-2 -ml-3 text-danger hover:bg-danger-faint"
              onClick={() => setConfirmingLeave(true)}
            >
              Leave team
            </Button>
          )}
        </section>
      </aside>
    </div>
  );
}
