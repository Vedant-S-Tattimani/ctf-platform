import { useMutation, useQuery, useQueryClient, type QueryClient } from '@tanstack/react-query';
import {
  adminApi,
  type CategoryInput,
  type CreateChallengeInput,
  type EventInput,
  type FileAttachInput,
  type ListParams,
  type UpdateChallengeInput,
} from '@/api/admin';

function useAdminInvalidate() {
  const queryClient = useQueryClient();
  return (keys: string[]) => {
    for (const key of keys) void queryClient.invalidateQueries({ queryKey: ['admin', key] });
  };
}

/** Challenge edits can change what players see, so refresh public queries too. */
function invalidatePublic(queryClient: QueryClient) {
  void queryClient.invalidateQueries({ queryKey: ['challenges'] });
  void queryClient.invalidateQueries({ queryKey: ['scoreboard'] });
}

export function useAdminChallenges() {
  return useQuery({
    queryKey: ['admin', 'challenges'],
    queryFn: adminApi.challenges.list,
  });
}

export function useAdminChallenge(id: string | null) {
  return useQuery({
    queryKey: ['admin', 'challenge', id],
    queryFn: () => adminApi.challenges.byId(id!),
    enabled: Boolean(id),
  });
}

export function useAdminCategories() {
  return useQuery({ queryKey: ['admin', 'categories'], queryFn: adminApi.categories.list });
}

export function useAdminEvents() {
  return useQuery({ queryKey: ['admin', 'events'], queryFn: adminApi.events.list });
}

export function useAdminUsers(params: ListParams) {
  return useQuery({
    queryKey: ['admin', 'users', params],
    queryFn: () => adminApi.users(params),
    placeholderData: (previous) => previous,
  });
}

export function useAdminTeams(params: ListParams) {
  return useQuery({
    queryKey: ['admin', 'teams', params],
    queryFn: () => adminApi.teams(params),
    placeholderData: (previous) => previous,
  });
}

export function useAdminSubmissions(params: ListParams) {
  return useQuery({
    queryKey: ['admin', 'submissions', params],
    queryFn: () => adminApi.submissions(params),
    placeholderData: (previous) => previous,
  });
}

export function useCreateChallenge() {
  const queryClient = useQueryClient();
  const invalidate = useAdminInvalidate();
  return useMutation({
    mutationFn: (input: CreateChallengeInput) => adminApi.challenges.create(input),
    onSuccess: () => {
      invalidate(['challenges']);
      invalidatePublic(queryClient);
    },
  });
}

export function useUpdateChallenge(id: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: UpdateChallengeInput) => adminApi.challenges.update(id, input),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['admin', 'challenges'] });
      void queryClient.invalidateQueries({ queryKey: ['admin', 'challenge', id] });
      invalidatePublic(queryClient);
    },
  });
}

export function useDeleteChallenge() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => adminApi.challenges.remove(id),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['admin', 'challenges'] });
      invalidatePublic(queryClient);
    },
  });
}

export function useFlagMutations(challengeId: string) {
  const queryClient = useQueryClient();
  const refresh = () => {
    void queryClient.invalidateQueries({ queryKey: ['admin', 'challenge', challengeId] });
    void queryClient.invalidateQueries({ queryKey: ['admin', 'challenges'] });
  };

  return {
    add: useMutation({
      mutationFn: (input: { label?: string; value: string; points: number }) =>
        adminApi.challenges.addFlag(challengeId, input),
      onSuccess: refresh,
    }),
    remove: useMutation({
      mutationFn: (flagId: string) => adminApi.challenges.removeFlag(flagId),
      onSuccess: refresh,
    }),
  };
}

export function useHintMutations(challengeId: string) {
  const queryClient = useQueryClient();
  const refresh = () =>
    void queryClient.invalidateQueries({ queryKey: ['admin', 'challenge', challengeId] });

  return {
    add: useMutation({
      mutationFn: (input: { content: string; cost: number }) =>
        adminApi.challenges.addHint(challengeId, input),
      onSuccess: refresh,
    }),
    remove: useMutation({
      mutationFn: (hintId: string) => adminApi.challenges.removeHint(hintId),
      onSuccess: refresh,
    }),
  };
}

export function useFileMutations(challengeId: string) {
  const queryClient = useQueryClient();
  const refresh = () =>
    void queryClient.invalidateQueries({ queryKey: ['admin', 'challenge', challengeId] });

  return {
    add: useMutation({
      mutationFn: (input: FileAttachInput) => adminApi.challenges.addFile(challengeId, input),
      onSuccess: refresh,
    }),
    remove: useMutation({
      mutationFn: (fileId: string) => adminApi.challenges.removeFile(fileId),
      onSuccess: refresh,
    }),
    upload: useMutation({
      mutationFn: (file: File) => adminApi.challenges.upload(file),
    }),
  };
}

export function useCategoryMutations() {
  const queryClient = useQueryClient();
  const refresh = () => void queryClient.invalidateQueries({ queryKey: ['admin', 'categories'] });
  return {
    create: useMutation({
      mutationFn: (input: CategoryInput) => adminApi.categories.create(input),
      onSuccess: refresh,
    }),
    update: useMutation({
      mutationFn: ({ id, input }: { id: string; input: Partial<CategoryInput> }) =>
        adminApi.categories.update(id, input),
      onSuccess: refresh,
    }),
    remove: useMutation({
      mutationFn: (id: string) => adminApi.categories.remove(id),
      onSuccess: refresh,
    }),
  };
}

export function useEventMutations() {
  const queryClient = useQueryClient();
  const refresh = () => void queryClient.invalidateQueries({ queryKey: ['admin', 'events'] });
  return {
    create: useMutation({
      mutationFn: (input: EventInput) => adminApi.events.create(input),
      onSuccess: refresh,
    }),
    update: useMutation({
      mutationFn: ({ id, input }: { id: string; input: Partial<EventInput> }) =>
        adminApi.events.update(id, input),
      onSuccess: refresh,
    }),
  };
}
