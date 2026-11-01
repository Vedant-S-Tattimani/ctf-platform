import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { scoreboardApi } from '@/api/scoreboard';
import { teamsApi } from '@/api/teams';
import type { Team } from '@/api/types';
import { Avatar } from '@/components/ui/Avatar';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { CopyButton } from '@/components/ui/CopyButton';
import { Input } from '@/components/ui/Input';
import { Progress } from '@/components/ui/Progress';
import { useAuth } from '@/hooks/useAuth';
import { errorMessage, fieldErrorsFromApi } from '@/lib/errors';
import { formatDateUTC, formatCount, formatPoints } from '@/lib/format';
import { toast } from '@/store/toast';

export function TeamPanel({ team }: { team: Team }) {
  const { user, refresh } = useAuth();
  const queryClient = useQueryClient();
  const isOwner = team.ownerId === user?.id;

  // Same cached query the scoreboard and team pages use, so the standing shown
  // here can never disagree with the board.
  const board = useQuery({
    queryKey: ['scoreboard', 'list', 'teams'],
    queryFn: ({ signal }) => scoreboardApi.list({ scope: 'teams', limit: 100 }, signal),
  });
  const standing = board.data?.entries.find((entry) => entry.id === team.id) ?? null;

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
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_19rem] lg:items-start lg:gap-8">
      <div className="flex flex-col gap-6">
        <header className="flex flex-wrap items-start gap-4 rounded-lg border border-hairline bg-surface p-6 shadow-card sm:gap-5 sm:p-8">
          <Avatar name={team.name} src={team.avatarUrl} size="lg" />
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="type-h2 text-primary">{team.name}</h2>
              {isOwner && <Badge tone="accent">Owner</Badge>}
            </div>
            <p className="mt-1 max-w-measure text-secondary">
              {team.description ?? 'No description yet. The owner can add one below.'}
            </p>
          </div>
          {standing && (
            <dl className="ml-auto flex shrink-0 items-center gap-8">
              <div className="flex flex-col gap-1">
                <dt className="type-small text-muted">Rank</dt>
                <dd className="nums font-mono text-h3 text-accent-strong">#{standing.rank}</dd>
              </div>
              <div className="flex flex-col gap-1">
                <dt className="type-small text-muted">Points</dt>
                <dd className="nums font-mono text-h3 text-primary">
                  {formatPoints(standing.points)}
                </dd>
              </div>
            </dl>
          )}
        </header>

        <section
          aria-labelledby="roster-title"
          className="rounded-lg border border-hairline bg-surface p-6 shadow-card sm:p-8"
        >
          <div className="flex flex-wrap items-baseline justify-between gap-2">
            <h3 id="roster-title" className="type-h3 text-primary">
              Roster
            </h3>
            {isOwner && team.memberCount > 1 && (
              <span className="type-small text-muted">
                Owner controls are on each teammate row.
              </span>
            )}
          </div>
          <Progress
            className="mt-4"
            label="Seats"
            value={team.memberCount}
            max={team.maxSize}
            hint={
              team.memberCount >= team.maxSize
                ? 'This team is full.'
                : `${formatCount(team.maxSize - team.memberCount, 'seat')} left — share the invite code.`
            }
          />
          <ul className="mt-4 flex flex-col">
            {team.members.map((member) => {
              const action = memberAction?.userId === member.id ? memberAction.kind : null;
              return (
                <li
                  key={member.id}
                  className="-mx-3 rounded-md border-b border-hairline px-3 py-3 last:border-b-0"
                >
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
          <section
            aria-labelledby="team-settings-title"
            className="rounded-lg border border-hairline bg-surface p-6 shadow-card sm:p-8"
          >
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

      <aside className="flex flex-col gap-6">
        <section
          aria-labelledby="invite-title"
          className="rounded-lg border border-accent bg-accent-faint p-6 shadow-soft"
        >
          <h3 id="invite-title" className="type-label text-accent-strong">
            Invite code
          </h3>
          <p className="mt-2 type-small text-secondary">
            Share this code so teammates can join the crew.
          </p>
          {team.inviteCode ? (
            <>
              <div className="mt-3 flex flex-wrap items-center gap-3">
                <code className="rounded-md border border-hairline bg-surface px-3 py-1.5 font-mono text-h3 tracking-[0.25em] text-primary">
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

        <section
          aria-labelledby="team-details-title"
          className="rounded-lg border border-hairline bg-surface p-6 shadow-card"
        >
          <h3 id="team-details-title" className="type-label text-muted">
            Details
          </h3>
          <dl className="mt-2 flex flex-col type-small">
            <div className="flex items-center justify-between gap-4 py-2.5">
              <dt className="text-muted">Created</dt>
              <dd className="nums text-primary">{formatDateUTC(team.createdAt)}</dd>
            </div>
          </dl>
        </section>

        <section
          aria-labelledby="leave-team-title"
          className="rounded-lg border border-danger bg-surface p-6 shadow-card"
        >
          <h3 id="leave-team-title" className="type-label text-danger">
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
