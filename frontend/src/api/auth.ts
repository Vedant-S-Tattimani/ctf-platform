import { api } from './client';
import type { User } from './types';

export const authApi = {
  register: (input: { username: string; email: string; password: string }) =>
    api.post<{ user: User }>('/auth/register', input),
  login: (input: { email: string; password: string }) =>
    api.post<{ user: User }>('/auth/login', input),
  logout: () => api.post<{ ok: boolean }>('/auth/logout'),
  me: (signal?: AbortSignal) => api.get<{ user: User }>('/auth/me', undefined, signal),
  /** Always 200; `user` is null for guests. Used to bootstrap the shell. */
  session: (signal?: AbortSignal) =>
    api.get<{ user: User | null }>('/auth/session', undefined, signal),

  forgotPassword: (email: string) =>
    api.post<{ ok: boolean; message: string }>('/auth/forgot-password', { email }),
  resetPassword: (token: string, password: string) =>
    api.post<{ ok: boolean }>('/auth/reset-password', { token, password }),
  verifyEmail: (token: string) =>
    api.post<{ ok: boolean; user: User }>('/auth/verify-email', { token }),
  resendVerification: () =>
    api.post<{ alreadyVerified: boolean }>('/auth/resend-verification'),
};
