import { useQueryClient } from '@tanstack/react-query';
import { useEffect } from 'react';
import { authApi } from '@/api/auth';
import { useAuthStore } from '@/store/auth';

let bootstrapped = false;

/**
 * Session bootstrap + auth actions. `/auth/session` always answers 200, so
 * guests resolve cleanly without an error path. The store is the source of
 * truth; this hook wires it to the API and React Query cache.
 */
export function useAuth() {
  const { user, status, setUser } = useAuthStore();
  const queryClient = useQueryClient();

  useEffect(() => {
    if (bootstrapped) return;
    bootstrapped = true;
    authApi
      .session()
      .then(({ user: current }) => setUser(current))
      .catch(() => setUser(null));
  }, [setUser]);

  const invalidateSession = () => queryClient.invalidateQueries();

  async function login(email: string, password: string) {
    const { user: current } = await authApi.login({ email, password });
    setUser(current);
    invalidateSession();
    return current;
  }

  async function register(username: string, email: string, password: string) {
    const { user: current } = await authApi.register({ username, email, password });
    setUser(current);
    invalidateSession();
    return current;
  }

  async function logout() {
    try {
      await authApi.logout();
    } finally {
      setUser(null);
      queryClient.clear();
    }
  }

  async function refresh() {
    try {
      const { user: current } = await authApi.session();
      setUser(current);
    } catch {
      setUser(null);
    }
  }

  return {
    user,
    status,
    isAuthenticated: status === 'authenticated',
    isLoading: status === 'loading',
    isAdmin: user?.role === 'ADMIN',
    login,
    register,
    logout,
    refresh,
  };
}
