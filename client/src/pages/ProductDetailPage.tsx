import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, ShoppingCart } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { useToast } from '@/components/ui/toaster';
import { ALL_TENURES, TENURE_LABEL, catalogApi, cartApi, type Product, type Tenure } from '@/lib/catalogApi';
import { useAuthStore } from '@/store/authStore';
import { useCartStore } from '@/store/cartStore';
import { ApiError } from '@/lib/api';
import { cn, formatCurrencyINR } from '@/lib/utils';

export default function ProductDetailPage() {
  const { slug = '' } = useParams();
  const navigate = useNavigate();
  const toast = useToast();
  const token = useAuthStore((s) => s.token);
  const setCart = useCartStore((s) => s.setCart);

  const [product, setProduct] = useState<Product | null>(null);
  const [tenure, setTenure] = useState<Tenure>('M3');
  const [quantity, setQuantity] = useState(1);
  const [busy, setBusy] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    catalogApi
      .getProduct(slug)
      .then(({ product }) => !cancelled && setProduct(product))
      .catch((err: unknown) => {
        if (cancelled) return;
        const m = err instanceof ApiError ? err.message : 'Failed to load product';
        toast.error('Unable to load product', m);
        navigate('/catalog', { replace: true });
      })
      .finally(() => !cancelled && setLoading(false));
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [slug]);

  const pricing = useMemo(() => {
    if (!product) return null;
    const base = product.tenureOptions.find((t) => t.tenure === tenure)!;
    return {
      ...base,
      quantity,
      monthlyRent: base.unitMonthlyRent * quantity,
      depositTotal: base.depositPerUnit * quantity,
      totalRentOverTenure: base.unitMonthlyRent * quantity * base.months,
    };
  }, [product, tenure, quantity]);

  async function handleAddToCart() {
    if (!product || !token) return;
    setBusy(true);
    try {
      const { cart } = await cartApi.add(token, { productId: product.id, tenure, quantity });
      setCart(cart);
      toast.success('Added to cart', `${product.name} × ${quantity} · ${TENURE_LABEL[tenure]}`);
    } catch (err) {
      const m = err instanceof ApiError ? err.message : 'Unable to add item';
      toast.error('Could not add to cart', m);
    } finally {
      setBusy(false);
    }
  }

  if (loading || !product || !pricing) {
    return <div className="text-fg-muted">Loading product…</div>;
  }

  return (
    <div className="space-y-6">
      <Button asChild variant="ghost" size="sm">
        <Link to="/catalog">
          <ArrowLeft className="h-4 w-4" />
          Back to catalog
        </Link>
      </Button>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="overflow-hidden rounded-lg border border-border bg-canvas-subtle">
          <img src={product.imageUrl} alt={product.name} className="w-full h-full object-cover" />
        </div>

        <div className="space-y-5">
          <div>
            <div className="text-xs uppercase tracking-wide text-fg-muted">{product.category.name}</div>
            <h1 className="text-2xl font-semibold mt-1">{product.name}</h1>
            <p className="text-sm text-fg-muted mt-2">{product.description}</p>
          </div>

          <Card>
            <CardContent className="p-4 space-y-4">
              <div>
                <div className="text-sm font-medium mb-2">Rental tenure</div>
                <div className="grid grid-cols-4 gap-2">
                  {ALL_TENURES.map((t) => {
                    const opt = product.tenureOptions.find((o) => o.tenure === t)!;
                    return (
                      <button
                        key={t}
                        type="button"
                        onClick={() => setTenure(t)}
                        className={cn(
                          'rounded-md border px-2 py-2 text-center text-xs transition-colors',
                          tenure === t
                            ? 'border-accent bg-accent/10 text-fg'
                            : 'border-border bg-canvas hover:bg-canvas-subtle text-fg-muted',
                        )}
                      >
                        <div className="font-semibold text-fg">{TENURE_LABEL[t]}</div>
                        <div>{formatCurrencyINR(opt.unitMonthlyRent)}/mo</div>
                        {opt.discountPct > 0 && <div className="text-success">-{opt.discountPct}%</div>}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="flex items-center gap-3">
                <span className="text-sm font-medium">Quantity</span>
                <div className="inline-flex items-center rounded-md border border-border">
                  <button
                    type="button"
                    className="px-3 py-1 text-fg-muted hover:bg-canvas-subtle"
                    onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                  >
                    −
                  </button>
                  <span className="w-8 text-center text-sm">{quantity}</span>
                  <button
                    type="button"
                    className="px-3 py-1 text-fg-muted hover:bg-canvas-subtle"
                    onClick={() => setQuantity((q) => Math.min(product.stock, q + 1))}
                  >
                    +
                  </button>
                </div>
                <span className="text-xs text-fg-muted">In stock: {product.stock}</span>
              </div>

              <dl className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <dt className="text-fg-muted">Monthly rent</dt>
                  <dd className="text-lg font-semibold">{formatCurrencyINR(pricing.monthlyRent)}</dd>
                </div>
                <div>
                  <dt className="text-fg-muted">Refundable deposit</dt>
                  <dd className="text-lg font-semibold">{formatCurrencyINR(pricing.depositTotal)}</dd>
                </div>
                <div>
                  <dt className="text-fg-muted">Total rent ({pricing.months} mo)</dt>
                  <dd>{formatCurrencyINR(pricing.totalRentOverTenure)}</dd>
                </div>
                <div>
                  <dt className="text-fg-muted">Payable today</dt>
                  <dd className="font-medium">
                    {formatCurrencyINR(pricing.monthlyRent + pricing.depositTotal)}
                  </dd>
                </div>
              </dl>

              <Button className="w-full" disabled={busy} onClick={handleAddToCart}>
                <ShoppingCart className="h-4 w-4" />
                {busy ? 'Adding…' : 'Add to cart'}
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
