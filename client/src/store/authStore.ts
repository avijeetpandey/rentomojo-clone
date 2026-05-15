import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type UserRole = 'CUSTOMER' | 'ADMIN';

export interface AuthUser {
  id: string;
  email: string;
  fullName: string;
  city: string;
  role: UserRole;
  kycStatus: string;
}

interface AuthState {
  token: string | null;
  user: AuthUser | null;
  setSession: (token: string, user: AuthUser) => void;
  setUser: (user: AuthUser) => void;
  clear: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      token: null,
      user: null,
      setSession: (token, user) => set({ token, user }),
      setUser: (user) => set({ user }),
      clear: () => set({ token: null, user: null }),
    }),
    { name: 'rentomojo.auth' },
  ),
);
