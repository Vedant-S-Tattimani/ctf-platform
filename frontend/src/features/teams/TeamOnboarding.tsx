import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { teamsApi } from '@/api/teams';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { errorMessage, fieldErrorsFromApi } from '@/lib/errors';
import { useAuth } from '@/hooks/useAuth';
import { toast } from '@/store/toast';

export function TeamOnboarding() {
  const queryClient = useQueryClient();
  const { refresh } = useAuth();

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [inviteCode, setInviteCode] = useState('');
  const [createErrors, setCreateErrors] = useState<Record<string, string>>({});
  const [createError, setCreateError] = useState<string | null>(null);
  const [joinErrors, setJoinErrors] = useState<Record<string, string>>({});
  const [joinError, setJoinError] = useState<string | null>(null);

  const create = useMutation({
    mutationFn: () =>
      teamsApi.create({
        name: name.trim(),
        description: description.trim() || undefined,
      }),
    onSuccess: async ({ team }) => {
      queryClient.invalidateQueries({ queryKey: ['teams'] });
      queryClient.invalidateQueries({ queryKey: ['scoreboard'] });
      await refresh();
      toast.success('Team created', team.inviteCode ? `Invite code ${team.inviteCode}` : undefined);
    },
    onError: (error) => {
      const fields = fieldErrorsFromApi(error);
      setCreateErrors(fields);
      setCreateError(Object.keys(fields).length ? null : errorMessage(error));
    },
  });

  const join = useMutation({
    mutationFn: () => teamsApi.join(inviteCode.trim().toUpperCase()),
    onSuccess: async ({ team }) => {
      queryClient.invalidateQueries({ queryKey: ['teams'] });
      queryClient.invalidateQueries({ queryKey: ['scoreboard'] });
      await refresh();
      toast.success(`Joined ${team.name}`);
    },
    onError: (error) => {
      const fields = fieldErrorsFromApi(error);
      setJoinErrors(fields);
      setJoinError(Object.keys(fields).length ? null : errorMessage(error));
    },
  });

  return (
    <div className="grid gap-10 border-b border-hairline pb-10 lg:grid-cols-2 lg:gap-0">
      <section aria-labelledby="create-team-title" className="lg:pr-10">
        <h2 id="create-team-title" className="type-h2 text-primary">
          Create a team
        </h2>
        <p className="mt-2 max-w-measure text-secondary">
          Name your crew. You will be the owner and can share the invite code right away.
        </p>
        <form
          className="mt-6 flex max-w-md flex-col gap-4"
          onSubmit={(event) => {
            event.preventDefault();
            setCreateError(null);
            setCreateErrors({});
            create.mutate();
          }}
        >
          <Input
            label="Team name"
            value={name}
            onChange={(event) => setName(event.target.value)}
            placeholder="Null Pointer Exception"
            maxLength={40}
            error={createErrors.name}
            hint="3–40 characters, shown on the scoreboard."
          />
          <Input
            label="Description (optional)"
            value={description}
            onChange={(event) => setDescription(event.target.value)}
            placeholder="What does your team hack on?"
            maxLength={300}
            error={createErrors.description}
          />
          {createError && (
            <p role="alert" className="type-small text-danger">
              {createError}
            </p>
          )}
          <div>
            <Button type="submit" loading={create.isPending} disabled={!name.trim()}>
              Create team
            </Button>
          </div>
        </form>
      </section>

      <section
        aria-labelledby="join-team-title"
        className="border-t border-hairline pt-10 lg:border-l lg:border-t-0 lg:pl-10 lg:pt-0"
      >
        <h2 id="join-team-title" className="type-h2 text-primary">
          Join with an invite code
        </h2>
        <p className="mt-2 max-w-measure text-secondary">
          Every team has an eight-character invite code. Ask an owner for theirs.
        </p>
        <form
          className="mt-6 flex max-w-md flex-col gap-4"
          onSubmit={(event) => {
            event.preventDefault();
            setJoinError(null);
            setJoinErrors({});
            join.mutate();
          }}
        >
          <Input
            label="Invite code"
            value={inviteCode}
            onChange={(event) => setInviteCode(event.target.value.toUpperCase())}
            placeholder="ABCD1234"
            maxLength={16}
            autoComplete="off"
            spellCheck={false}
            className="font-mono uppercase tracking-[0.2em]"
            error={joinErrors.inviteCode}
          />
          {joinError && (
            <p role="alert" className="type-small text-danger">
              {joinError}
            </p>
          )}
          <div>
            <Button
              type="submit"
              variant="secondary"
              loading={join.isPending}
              disabled={!inviteCode.trim()}
            >
              Join team
            </Button>
          </div>
        </form>
      </section>
    </div>
  );
}
