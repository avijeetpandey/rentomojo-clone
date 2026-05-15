import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { useAuthStore } from '@/store/authStore';
import { API_BASE } from '@/lib/api';

export default function HomePage() {
  const { user } = useAuthStore();
  const [backendOk, setBackendOk] = useState<'loading' | 'ok' | 'error'>('loading');

  useEffect(() => {
    fetch(`${API_BASE}/health`)
      .then((r) => (r.ok ? setBackendOk('ok') : setBackendOk('error')))
      .catch(() => setBackendOk('error'));
  }, []);

  return (
    <div className="space-y-8">
      <section className="space-y-3">
        <h1 className="text-3xl font-semibold tracking-tight">
          {user
            ? `Welcome back, ${user.fullName.split(' ')[0]}.`
            : 'Rent furniture & appliances on a monthly subscription.'}
        </h1>
        <p className="text-fg-muted max-w-2xl">
          Browse curated packages, pick a tenure that fits, and we'll deliver it to your door. Cancel or swap
          anytime. Browse the catalog, pick a tenure, add to cart, and get it delivered.
        </p>
        <div className="flex flex-wrap gap-3">
          {user ? (
            <>
              <Button asChild>
                <Link to="/catalog">Browse catalog</Link>
              </Button>
              <Button asChild variant="outline">
                <Link to="/dashboard">My dashboard</Link>
              </Button>
            </>
          ) : (
            <>
              <Button asChild>
                <Link to="/register">Create account</Link>
              </Button>
              <Button asChild variant="outline">
                <Link to="/login">Sign in</Link>
              </Button>
            </>
          )}
        </div>
      </section>

      <div className="grid gap-4 sm:grid-cols-3">
        {[
          { title: 'Furniture', body: 'Beds, sofas, dining sets curated for every home.' },
          { title: 'Appliances', body: 'Refrigerators, washing machines, ACs delivered & installed.' },
          { title: 'Packages', body: 'Bundle everything you need at a flat monthly rent.' },
        ].map((c) => (
          <Card key={c.title}>
            <CardHeader>
              <CardTitle>{c.title}</CardTitle>
              <CardDescription>{c.body}</CardDescription>
            </CardHeader>
            <CardContent>
              <Button asChild variant="link" className="p-0 h-auto">
                <Link to="/catalog">Explore →</Link>
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="rounded-md border border-border bg-canvas-subtle px-4 py-3 text-xs text-fg-muted">
        Backend status:{' '}
        <span
          className={
            backendOk === 'ok'
              ? 'text-success font-medium'
              : backendOk === 'error'
                ? 'text-danger font-medium'
                : ''
          }
        >
          {backendOk === 'ok' ? 'connected' : backendOk === 'error' ? 'unreachable' : 'checking…'}
        </span>{' '}
        — API @ <code>{API_BASE}</code>
      </div>
    </div>
  );
}
