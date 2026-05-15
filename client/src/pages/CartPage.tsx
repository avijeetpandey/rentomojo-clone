import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/components/ui/toaster';
import { useAuthStore } from '@/store/authStore';
import { useCartStore } from '@/store/cartStore';
import { cartApi, TENURE_LABEL } from '@/lib/catalogApi';
import { ApiError } from '@/lib/api';
import { formatCurrencyINR } from '@/lib/utils';

export default function CartPage() {
  const token = useAuthStore((s) => s.token)!;
  const { cart, setCart } = useCartStore();
  const toast = useToast();
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    cartApi
      .get(token)
      .then(({ cart }) => !cancelled && setCart(cart))
      .catch((err: unknown) => {
        if (cancelled) return;
        const m = err instanceof ApiError ? err.message : 'Failed to load cart';
        toast.error('Cart unavailable', m);
      })
      .finally(() => !cancelled && setLoading(false));
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  async function changeQty(itemId: string, qty: number) {
    setBusyId(itemId);
    try {
      const { cart } = await cartApi.update(token, itemId, qty);
      setCart(cart);
    } catch (err) {
      const m = err instanceof ApiError ? err.message : 'Update failed';
      toast.error('Could not update item', m);
    } finally {
      setBusyId(null);
    }
  }

  async function remove(itemId: string) {
    setBusyId(itemId);
    try {
      const { cart } = await cartApi.remove(token, itemId);
      setCart(cart);
      toast.success('Item removed');
    } catch (err) {
      const m = err instanceof ApiError ? err.message : 'Remove failed';
      toast.error('Could not remove item', m);
    } finally {
      setBusyId(null);
    }
  }

  if (loading) return <div className="text-fg-muted">Loading cart…</div>;

  if (cart.items.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Your cart is empty</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-fg-muted">
            Add some furniture, appliances, or a package to get started.
          </p>
          <Button asChild>
            <Link to="/catalog">Browse catalog</Link>
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[2fr_1fr]">
      <div className="space-y-3">
        {cart.items.map((it) => (
          <Card key={it.id}>
            <CardContent className="p-4 flex gap-4">
              <img
                src={it.product.imageUrl}
                alt={it.product.name}
                className="h-24 w-24 rounded-md object-cover bg-canvas-subtle"
              />
              <div className="flex-1 flex flex-col">
                <div className="flex justify-between items-start gap-3">
                  <div>
                    <Link to={`/products/${it.product.slug}`} className="font-semibold hover:underline">
                      {it.product.name}
                    </Link>
                    <div className="text-xs text-fg-muted">
                      {it.product.category.name} · {it.product.city} · {TENURE_LABEL[it.tenure]}
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    disabled={busyId === it.id}
                    onClick={() => remove(it.id)}
                    aria-label="Remove item"
                  >
                    <Trash2 className="h-4 w-4 text-danger" />
                  </Button>
                </div>
                <div className="mt-auto flex items-end justify-between gap-3">
                  <div className="inline-flex items-center rounded-md border border-border">
                    <button
                      type="button"
                      className="px-3 py-1 text-fg-muted hover:bg-canvas-subtle"
                      disabled={busyId === it.id || it.quantity <= 1}
                      onClick={() => changeQty(it.id, it.quantity - 1)}
                    >
                      −
                    </button>
                    <span className="w-8 text-center text-sm">{it.quantity}</span>
                    <button
                      type="button"
                      className="px-3 py-1 text-fg-muted hover:bg-canvas-subtle"
                      disabled={busyId === it.id || it.quantity >= it.product.stock}
                      onClick={() => changeQty(it.id, it.quantity + 1)}
                    >
                      +
                    </button>
                  </div>
                  <div className="text-right text-sm">
                    <div className="font-semibold">{formatCurrencyINR(it.pricing.monthlyRent)}/mo</div>
                    <div className="text-xs text-fg-muted">
                      Deposit {formatCurrencyINR(it.pricing.depositTotal)}
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card className="h-fit">
        <CardHeader>
          <CardTitle>Order summary</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          <Row label="Items" value={String(cart.summary.itemCount)} />
          <Row label="Monthly rent" value={formatCurrencyINR(cart.summary.monthlyTotal)} />
          <Row label="Refundable deposit" value={formatCurrencyINR(cart.summary.depositTotal)} />
          <div className="border-t border-border my-2" />
          <Row label="Payable today" value={formatCurrencyINR(cart.summary.payableNow)} bold />
          <Button asChild className="w-full mt-3">
            <Link to="/checkout">Proceed to checkout</Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}

function Row({ label, value, bold }: { label: string; value: string; bold?: boolean }) {
  return (
    <div className="flex justify-between">
      <span className="text-fg-muted">{label}</span>
      <span className={bold ? 'font-semibold' : ''}>{value}</span>
    </div>
  );
}
