import { api } from './client';
import type { Team } from './types';

export const teamsApi = {
  create: (input: { name: string; description?: string }) => api.post<{ team: Team }>('/teams', input),
  join: (inviteCode: string) => api.post<{ team: Team }>('/teams/join', { inviteCode }),
  leave: () => api.post<{ ok: boolean; deleted: boolean }>('/teams/leave'),
  me: () => api.get<{ team: Team | null }>('/teams/me'),
  updateMine: (input: { name?: string; description?: string | null }) =>
    api.patch<{ team: Team }>('/teams/me', input),
  removeMember: (userId: string) =>
    api.delete<{ team: Team }>(`/teams/me/members/${userId}`),
  transferOwnership: (userId: string) =>
    api.post<{ team: Team }>('/teams/me/transfer', { userId }),
  regenerateInviteCode: () => api.post<{ team: Team }>('/teams/me/invite-code'),
  byId: (id: string) => api.get<{ team: Team }>(`/teams/${id}`),
};
