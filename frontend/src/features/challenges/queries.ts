import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { challengesApi } from '@/api/challenges';
import { submissionsApi } from '@/api/submissions';

export function useChallenges() {
  return useQuery({
    queryKey: ['challenges', 'list'],
    queryFn: ({ signal }) => challengesApi.list({}, signal),
    staleTime: 30_000,
  });
}

export function useChallenge(id: string | null) {
  return useQuery({
    queryKey: ['challenges', 'detail', id ?? 'none'],
    queryFn: ({ signal }) => challengesApi.byId(id ?? '', signal),
    enabled: Boolean(id),
    staleTime: 15_000,
  });
}

export function useSubmitFlag() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ challengeId, flag }: { challengeId: string; flag: string }) =>
      submissionsApi.submit(challengeId, flag),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['challenges'] });
      queryClient.invalidateQueries({ queryKey: ['scoreboard'] });
      queryClient.invalidateQueries({ queryKey: ['submissions'] });
    },
  });
}

export function useUnlockHint() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ challengeId, hintId }: { challengeId: string; hintId: string }) =>
      challengesApi.unlockHint(challengeId, hintId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['challenges'] });
      queryClient.invalidateQueries({ queryKey: ['scoreboard'] });
    },
  });
}
