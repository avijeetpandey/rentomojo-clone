import { create } from 'zustand';
import { persist } from 'zustand/middleware';

type Theme = 'light' | 'dark';

interface ThemeState {
  theme: Theme;
  toggle: () => void;
  setTheme: (t: Theme) => void;
}

export const useThemeStore = create<ThemeState>()(
  persist(
    (set, get) => ({
      theme:
        typeof window !== 'undefined' && window.matchMedia?.('(prefers-color-scheme: dark)').matches
          ? 'dark'
          : 'light',
      toggle: () => set({ theme: get().theme === 'dark' ? 'light' : 'dark' }),
      setTheme: (t) => set({ theme: t }),
    }),
    { name: 'rentomojo.theme' },
  ),
);

export function applyThemeClass(theme: Theme) {
  const root = document.documentElement;
  if (theme === 'dark') root.classList.add('dark');
  else root.classList.remove('dark');
}
