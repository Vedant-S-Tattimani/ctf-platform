import { create } from 'zustand';

export type ThemeMode = 'light' | 'dark' | 'system';
export type Theme = 'light' | 'dark';

const STORAGE_KEY = 'yourctf.theme';
const darkQuery = '(prefers-color-scheme: dark)';

const systemTheme = (): Theme =>
  window.matchMedia(darkQuery).matches ? 'dark' : 'light';

const storedMode = (): ThemeMode => {
  try {
    const value = window.localStorage.getItem(STORAGE_KEY);
    return value === 'light' || value === 'dark' ? value : 'system';
  } catch {
    // Private browsing and sandboxed frames throw on access; fall back to system.
    return 'system';
  }
};

const writeMode = (mode: ThemeMode) => {
  try {
    if (mode === 'system') window.localStorage.removeItem(STORAGE_KEY);
    else window.localStorage.setItem(STORAGE_KEY, mode);
  } catch {
    /* persisted for this session only */
  }
  document.documentElement.dataset.theme = mode === 'system' ? systemTheme() : mode;
};

interface ThemeStore {
  mode: ThemeMode;
  theme: Theme;
  setMode: (mode: ThemeMode) => void;
  toggle: () => void;
}

export const useTheme = create<ThemeStore>((set, get) => {
  const initial = storedMode();
  document.documentElement.dataset.theme = initial === 'system' ? systemTheme() : initial;

  return {
    mode: initial,
    theme: initial === 'system' ? systemTheme() : initial,
    setMode: (mode) => {
      writeMode(mode);
      set({ mode, theme: mode === 'system' ? systemTheme() : mode });
    },
    toggle: () => get().setMode(get().theme === 'dark' ? 'light' : 'dark'),
  };
});

window
  .matchMedia(darkQuery)
  .addEventListener('change', () => useTheme.getState().setMode(useTheme.getState().mode));
