import { useState, type FormEvent } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/components/ui/toaster';
import { useAuthStore } from '@/store/authStore';
import { authApi } from '@/lib/authApi';
import { ApiError } from '@/lib/api';

export default function LoginPage() {
  const [email, setEmail] = useState('demo@rentomojo.local');
  const [password, setPassword] = useState('demo12345');
  const [loading, setLoading] = useState(false);

  const toast = useToast();
  const navigate = useNavigate();
  const location = useLocation();
  const setSession = useAuthStore((s) => s.setSession);

  const from = (location.state as { from?: { pathname?: string } } | null)?.from?.pathname ?? '/';

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      const { token, user } = await authApi.login({ email: email.trim(), password });
      setSession(token, user);
      toast.success('Welcome back', `Signed in as ${user.fullName}`);
      navigate(from, { replace: true });
    } catch (err) {
      const message = err instanceof ApiError ? err.message : 'Unexpected error';
      toast.error('Sign in failed', message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex justify-center pt-10">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Sign in</CardTitle>
          <CardDescription>Access your rentals, cart, and dashboard.</CardDescription>
        </CardHeader>
        <CardContent>
          <form className="space-y-4" onSubmit={onSubmit}>
            <div className="space-y-1.5">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                autoComplete="current-password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? 'Signing in…' : 'Sign in'}
            </Button>
            <p className="text-sm text-fg-muted text-center">
              New here?{' '}
              <Link to="/register" className="text-accent hover:underline">
                Create an account
              </Link>
            </p>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
