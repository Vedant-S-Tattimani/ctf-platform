import { api } from './client';
import type { PublicProfile, User } from './types';

export const usersApi = {
  me: () => api.get<{ user: User }>('/users/me'),
  updateMe: (input: { bio?: string | null; avatarUrl?: string | null }) =>
    api.patch<{ user: User }>('/users/me', input),
  byId: (id: string) => api.get<{ user: PublicProfile }>(`/users/${id}`),
};
