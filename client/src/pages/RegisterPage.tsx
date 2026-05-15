import { useState, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/components/ui/toaster';
import { useAuthStore } from '@/store/authStore';
import { authApi } from '@/lib/authApi';
import { ApiError } from '@/lib/api';

const CITIES = ['Bangalore', 'Mumbai', 'Delhi', 'Hyderabad', 'Pune', 'Chennai'];

export default function RegisterPage() {
  const [form, setForm] = useState({
    fullName: '',
    email: '',
    password: '',
    phone: '',
    city: 'Bangalore',
  });
  const [loading, setLoading] = useState(false);

  const toast = useToast();
  const navigate = useNavigate();
  const setSession = useAuthStore((s) => s.setSession);

  const update = <K extends keyof typeof form>(k: K, v: (typeof form)[K]) =>
    setForm((p) => ({ ...p, [k]: v }));

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (form.password.length < 8) {
      toast.warning('Weak password', 'Password must be at least 8 characters.');
      return;
    }
    setLoading(true);
    try {
      const { token, user } = await authApi.register({
        email: form.email.trim(),
        password: form.password,
        fullName: form.fullName.trim(),
        phone: form.phone.trim() || undefined,
        city: form.city,
      });
      setSession(token, user);
      toast.success('Account created', `Welcome, ${user.fullName}!`);
      navigate('/', { replace: true });
    } catch (err) {
      const message = err instanceof ApiError ? err.message : 'Unexpected error';
      toast.error('Registration failed', message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex justify-center pt-10">
      <Card className="w-full max-w-lg">
        <CardHeader>
          <CardTitle>Create your account</CardTitle>
          <CardDescription>Rent furniture, appliances, and more in minutes.</CardDescription>
        </CardHeader>
        <CardContent>
          <form className="space-y-4" onSubmit={onSubmit}>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="fullName">Full name</Label>
                <Input
                  id="fullName"
                  required
                  value={form.fullName}
                  onChange={(e) => update('fullName', e.target.value)}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  autoComplete="email"
                  required
                  value={form.email}
                  onChange={(e) => update('email', e.target.value)}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  autoComplete="new-password"
                  required
                  value={form.password}
                  onChange={(e) => update('password', e.target.value)}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="phone">Phone (optional)</Label>
                <Input
                  id="phone"
                  type="tel"
                  value={form.phone}
                  onChange={(e) => update('phone', e.target.value)}
                />
              </div>
              <div className="space-y-1.5 sm:col-span-2">
                <Label htmlFor="city">City</Label>
                <select
                  id="city"
                  className="flex h-9 w-full rounded-md border border-border bg-canvas px-3 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/60"
                  value={form.city}
                  onChange={(e) => update('city', e.target.value)}
                >
                  {CITIES.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? 'Creating account…' : 'Create account'}
            </Button>
            <p className="text-sm text-fg-muted text-center">
              Already have an account?{' '}
              <Link to="/login" className="text-accent hover:underline">
                Sign in
              </Link>
            </p>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
