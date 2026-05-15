import { type AuthUser } from '@/store/authStore';
import { apiFetch } from '@/lib/api';

export interface AuthResponse {
  token: string;
  user: AuthUser;
}

export const authApi = {
  register(input: { email: string; password: string; fullName: string; city?: string; phone?: string }) {
    return apiFetch<AuthResponse>('/api/v1/auth/register', { method: 'POST', body: input });
  },
  login(input: { email: string; password: string }) {
    return apiFetch<AuthResponse>('/api/v1/auth/login', { method: 'POST', body: input });
  },
  me(token: string) {
    return apiFetch<{ user: AuthUser }>('/api/v1/auth/me', { token });
  },
};
