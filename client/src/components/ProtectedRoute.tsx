import { Navigate, useLocation } from 'react-router-dom';
import type { ReactNode } from 'react';
import { useAuthStore } from '@/store/authStore';

export function ProtectedRoute({ children }: { children: ReactNode }) {
  const { token } = useAuthStore();
  const location = useLocation();
  if (!token) return <Navigate to="/login" state={{ from: location }} replace />;
  return <>{children}</>;
}
