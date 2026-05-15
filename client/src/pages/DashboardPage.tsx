import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/toaster';
import { useAuthStore } from '@/store/authStore';
import { checkoutApi, type Order } from '@/lib/checkoutApi';
import { ApiError } from '@/lib/api';
import { cn, formatCurrencyINR } from '@/lib/utils';

const STATUS_STYLES: Record<Order['status'], string> = {
  PENDING_PAYMENT: 'bg-warning/20 text-warning',
  PAID: 'bg-accent/20 text-accent',
  ACTIVE: 'bg-success/20 text-success',
  CANCELLED: 'bg-danger/20 text-danger',
  COMPLETED: 'bg-fg-muted/20 text-fg-muted',
};

export default function DashboardPage() {
  const token = useAuthStore((s) => s.token)!;
  const user = useAuthStore((s) => s.user);
  const toast = useToast();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    checkoutApi
      .listOrders(token)
      .then(({ orders }) => !cancelled && setOrders(orders))
      .catch((err: unknown) => {
        if (cancelled) return;
        toast.error('Dashboard unavailable', err instanceof ApiError ? err.message : 'Try again');
      })
      .finally(() => !cancelled && setLoading(false));
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  const active = orders.filter((o) => o.status === 'ACTIVE' || o.status === 'PAID');
  const past = orders.filter((o) => o.status === 'CANCELLED' || o.status === 'COMPLETED');

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Profile</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-sm">
          <ProfileField label="Name" value={user?.fullName ?? '—'} />
          <ProfileField label="Email" value={user?.email ?? '—'} />
          <ProfileField label="City" value={user?.city ?? '—'} />
          <ProfileField label="KYC" value={user?.kycStatus ?? 'NOT_SUBMITTED'} />
        </CardContent>
      </Card>

      <div>
        <h2 className="text-lg font-semibold mb-3">Active rentals</h2>
        {loading ? (
          <div className="text-fg-muted">Loading…</div>
        ) : active.length === 0 ? (
          <Card>
            <CardContent className="p-6 text-center space-y-3">
              <p className="text-fg-muted">You don't have any active rentals yet.</p>
              <Button asChild>
                <Link to="/catalog">Browse catalog</Link>
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {active.map((o) => (
              <OrderCard key={o.id} order={o} />
            ))}
          </div>
        )}
      </div>

      {past.length > 0 && (
        <div>
          <h2 className="text-lg font-semibold mb-3">Past orders</h2>
          <div className="space-y-3">
            {past.map((o) => (
              <OrderCard key={o.id} order={o} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function ProfileField({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="text-xs uppercase tracking-wide text-fg-muted">{label}</div>
      <div className="font-medium">{value}</div>
    </div>
  );
}

function OrderCard({ order }: { order: Order }) {
  return (
    <Card>
      <CardContent className="p-4 space-y-3">
        <div className="flex justify-between items-start gap-3">
          <div>
            <div className="font-semibold">Order #{order.id.slice(-8)}</div>
            <div className="text-xs text-fg-muted">
              Placed {new Date(order.createdAt).toLocaleDateString()} · {order.address.city},{' '}
              {order.address.pincode}
            </div>
          </div>
          <span
            className={cn(
              'inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide',
              STATUS_STYLES[order.status],
            )}
          >
            {order.status}
          </span>
        </div>

        <div className="space-y-1 text-sm">
          {order.items.map((it) => (
            <div key={it.id} className="flex justify-between">
              <span>
                {it.productName}{' '}
                <span className="text-fg-muted">
                  × {it.quantity} · {it.monthsCount}mo
                </span>
              </span>
              <span>{formatCurrencyINR(it.monthlyRent)}/mo</span>
            </div>
          ))}
        </div>

        <div className="flex justify-between text-sm border-t border-border pt-2">
          <span className="text-fg-muted">Paid upfront</span>
          <span className="font-semibold">{formatCurrencyINR(order.totalDueNow)}</span>
        </div>
      </CardContent>
    </Card>
  );
}
