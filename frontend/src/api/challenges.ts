import { api } from './client';
import type { ChallengeDetail, ChallengeSummary, UnlockHintResult } from './types';

export interface ChallengeFilters {
  category?: string;
  eventId?: string;
  difficulty?: string;
}

export const challengesApi = {
  list: (filters: ChallengeFilters = {}, signal?: AbortSignal) =>
    api.get<{ challenges: ChallengeSummary[] }>('/challenges', filters, signal),
  byId: (id: string, signal?: AbortSignal) =>
    api.get<{ challenge: ChallengeDetail }>(`/challenges/${id}`, undefined, signal),
  unlockHint: (challengeId: string, hintId: string) =>
    api.post<UnlockHintResult>(`/challenges/${challengeId}/hints/${hintId}/unlock`),
};
