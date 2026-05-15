import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { CheckCircle2, FileCheck2, FileUp, MapPin, Wallet } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/components/ui/toaster';
import { useAuthStore } from '@/store/authStore';
import { useCartStore } from '@/store/cartStore';
import { useCityStore } from '@/store/cityStore';
import { cartApi, TENURE_LABEL } from '@/lib/catalogApi';
import { checkoutApi, type KycDocumentType } from '@/lib/checkoutApi';
import { ApiError } from '@/lib/api';
import { cn, formatCurrencyINR } from '@/lib/utils';

type Step = 'review' | 'address' | 'kyc' | 'success';

const STEPS: { key: Step; label: string; icon: typeof MapPin }[] = [
  { key: 'review', label: 'Review', icon: Wallet },
  { key: 'address', label: 'Address', icon: MapPin },
  { key: 'kyc', label: 'KYC', icon: FileCheck2 },
  { key: 'success', label: 'Done', icon: CheckCircle2 },
];

export default function CheckoutPage() {
  const toast = useToast();
  const token = useAuthStore((s) => s.token)!;
  const { user, setUser } = useAuthStore();
  const { cart, setCart } = useCartStore();
  const { city } = useCityStore();

  const [step, setStep] = useState<Step>('review');
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [orderId, setOrderId] = useState<string | null>(null);

  const [address, setAddress] = useState({
    addressLine1: '',
    addressLine2: '',
    city,
    state: 'Karnataka',
    pincode: '',
    contactPhone: '',
  });

  const [kyc, setKyc] = useState<{
    documentType: KycDocumentType;
    documentNumber: string;
    documentRef: string;
  }>({ documentType: 'PASSPORT', documentNumber: '', documentRef: '' });
  const [kycApproved, setKycApproved] = useState(user?.kycStatus === 'APPROVED');

  useEffect(() => {
    let cancelled = false;
    cartApi
      .get(token)
      .then(({ cart }) => !cancelled && setCart(cart))
      .catch((err: unknown) => {
        if (cancelled) return;
        toast.error('Cart unavailable', err instanceof ApiError ? err.message : 'Try again');
      })
      .finally(() => !cancelled && setLoading(false));
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  const stepIndex = useMemo(() => STEPS.findIndex((s) => s.key === step), [step]);

  function addressValid() {
    return (
      address.addressLine1.length >= 4 &&
      address.city.length >= 2 &&
      address.state.length >= 2 &&
      /^\d{4,10}$/.test(address.pincode) &&
      address.contactPhone.length >= 7
    );
  }

  async function submitKyc() {
    if (!kyc.documentNumber || !kyc.documentRef) {
      toast.warning('Add KYC details', 'Pick a document and upload a file.');
      return;
    }
    setBusy(true);
    try {
      const res = await checkoutApi.submitKyc(token, kyc);
      if (res.status === 'APPROVED') {
        setKycApproved(true);
        if (user) setUser({ ...user, kycStatus: 'APPROVED' });
        toast.success('KYC approved', 'You can now place the order.');
      }
    } catch (err) {
      const m = err instanceof ApiError ? err.message : 'KYC failed';
      toast.error('KYC failed', m);
    } finally {
      setBusy(false);
    }
  }

  async function placeOrder() {
    setBusy(true);
    try {
      const { order } = await checkoutApi.createOrder(token, {
        address: { ...address, addressLine2: address.addressLine2 || undefined },
        kycDocumentRef: kyc.documentRef || undefined,
      });
      setOrderId(order.id);
      setCart({
        id: null,
        items: [],
        summary: { itemCount: 0, monthlyTotal: 0, depositTotal: 0, totalRentOverTenure: 0, payableNow: 0 },
      });
      toast.success('Order placed!', `Total paid: ${formatCurrencyINR(order.totalDueNow)}`);
      setStep('success');
    } catch (err) {
      const m = err instanceof ApiError ? err.message : 'Order failed';
      toast.error('Order failed', m);
    } finally {
      setBusy(false);
    }
  }

  if (loading) return <div className="text-fg-muted">Loading checkout…</div>;

  if (cart.items.length === 0 && step !== 'success') {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Nothing to checkout</CardTitle>
        </CardHeader>
        <CardContent>
          <Button asChild>
            <Link to="/catalog">Browse catalog</Link>
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6 max-w-3xl mx-auto">
      <Stepper currentIndex={stepIndex} />

      {step === 'review' && (
        <Card>
          <CardHeader>
            <CardTitle>Review your order</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {cart.items.map((it) => (
              <div
                key={it.id}
                className="flex items-center justify-between border-b border-border pb-2 last:border-0"
              >
                <div>
                  <div className="font-medium">{it.product.name}</div>
                  <div className="text-xs text-fg-muted">
                    {it.product.category.name} · {it.quantity} × {TENURE_LABEL[it.tenure]}
                  </div>
                </div>
                <div className="text-right text-sm">
                  <div>{formatCurrencyINR(it.pricing.monthlyRent)}/mo</div>
                  <div className="text-xs text-fg-muted">
                    Dep. {formatCurrencyINR(it.pricing.depositTotal)}
                  </div>
                </div>
              </div>
            ))}
            <SummaryRows summary={cart.summary} />
            <Button className="w-full" onClick={() => setStep('address')}>
              Continue to address
            </Button>
          </CardContent>
        </Card>
      )}

      {step === 'address' && (
        <Card>
          <CardHeader>
            <CardTitle>Delivery address</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <Field
              label="Address line 1"
              value={address.addressLine1}
              onChange={(v) => setAddress({ ...address, addressLine1: v })}
            />
            <Field
              label="Address line 2 (optional)"
              value={address.addressLine2}
              onChange={(v) => setAddress({ ...address, addressLine2: v })}
            />
            <div className="grid grid-cols-2 gap-3">
              <Field
                label="City"
                value={address.city}
                onChange={(v) => setAddress({ ...address, city: v as typeof address.city })}
              />
              <Field
                label="State"
                value={address.state}
                onChange={(v) => setAddress({ ...address, state: v })}
              />
              <Field
                label="Pincode"
                value={address.pincode}
                onChange={(v) => setAddress({ ...address, pincode: v })}
              />
              <Field
                label="Contact phone"
                value={address.contactPhone}
                onChange={(v) => setAddress({ ...address, contactPhone: v })}
              />
            </div>
            <div className="flex gap-2 pt-2">
              <Button variant="outline" onClick={() => setStep('review')}>
                Back
              </Button>
              <Button className="flex-1" disabled={!addressValid()} onClick={() => setStep('kyc')}>
                Continue to KYC
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {step === 'kyc' && (
        <Card>
          <CardHeader>
            <CardTitle>KYC verification</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-fg-muted">
              Required for rentals. We'll auto-approve test documents. Try Aadhaar ending in <code>0000</code>{' '}
              to see a rejection.
            </p>
            <div className="space-y-1.5">
              <Label>Document type</Label>
              <select
                className="h-9 w-full rounded-md border border-border bg-canvas px-3 text-sm"
                value={kyc.documentType}
                onChange={(e) => setKyc({ ...kyc, documentType: e.target.value as KycDocumentType })}
              >
                <option value="PASSPORT">Passport</option>
                <option value="AADHAAR">Aadhaar</option>
                <option value="DRIVING_LICENSE">Driving License</option>
              </select>
            </div>
            <Field
              label="Document number"
              value={kyc.documentNumber}
              onChange={(v) => setKyc({ ...kyc, documentNumber: v })}
            />
            <div className="space-y-1.5">
              <Label>Upload document</Label>
              <label className="flex items-center gap-2 rounded-md border border-dashed border-border px-3 py-3 cursor-pointer hover:bg-canvas-subtle">
                <FileUp className="h-4 w-4 text-fg-muted" />
                <span className="text-sm text-fg-muted">{kyc.documentRef || 'Click to choose a file'}</span>
                <input
                  type="file"
                  className="hidden"
                  onChange={(e) => {
                    const f = e.target.files?.[0];
                    if (f)
                      setKyc((p) => ({ ...p, documentRef: `${f.name} (${Math.round(f.size / 1024)} KB)` }));
                  }}
                />
              </label>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setStep('address')}>
                Back
              </Button>
              {!kycApproved ? (
                <Button className="flex-1" disabled={busy} onClick={submitKyc}>
                  {busy ? 'Verifying…' : 'Submit KYC'}
                </Button>
              ) : (
                <Button className="flex-1" disabled={busy} onClick={placeOrder}>
                  {busy ? 'Placing order…' : `Place order · ${formatCurrencyINR(cart.summary.payableNow)}`}
                </Button>
              )}
            </div>
            {kycApproved && (
              <div className="text-xs text-success flex items-center gap-1.5">
                <CheckCircle2 className="h-3.5 w-3.5" /> KYC approved — you're ready to place the order.
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {step === 'success' && (
        <Card>
          <CardHeader>
            <CardTitle>
              <span className="inline-flex items-center gap-2">
                <CheckCircle2 className="h-5 w-5 text-success" /> Order confirmed
              </span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <p>
              Your rental is on its way! Track active rentals on your{' '}
              <Link to="/dashboard" className="text-accent hover:underline">
                dashboard
              </Link>
              .
            </p>
            {orderId && <p className="text-xs text-fg-muted">Order ID: {orderId}</p>}
            <div className="flex gap-2">
              <Button asChild>
                <Link to="/dashboard">Go to dashboard</Link>
              </Button>
              <Button asChild variant="outline">
                <Link to="/catalog">Continue shopping</Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function Stepper({ currentIndex }: { currentIndex: number }) {
  return (
    <ol className="flex items-center gap-2">
      {STEPS.map((s, i) => {
        const active = i === currentIndex;
        const done = i < currentIndex;
        return (
          <li key={s.key} className="flex items-center gap-2 flex-1">
            <div
              className={cn(
                'flex h-7 w-7 items-center justify-center rounded-full border text-xs font-medium',
                done && 'bg-success/20 border-success text-success',
                active && 'bg-accent text-accent-fg border-accent',
                !active && !done && 'border-border text-fg-muted',
              )}
            >
              {done ? '✓' : i + 1}
            </div>
            <span className={cn('text-xs', active ? 'text-fg font-medium' : 'text-fg-muted')}>{s.label}</span>
            {i < STEPS.length - 1 && <div className="flex-1 h-px bg-border" />}
          </li>
        );
      })}
    </ol>
  );
}

function Field({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  return (
    <div className="space-y-1.5">
      <Label>{label}</Label>
      <Input value={value} onChange={(e) => onChange(e.target.value)} />
    </div>
  );
}

function SummaryRows({
  summary,
}: {
  summary: { monthlyTotal: number; depositTotal: number; payableNow: number };
}) {
  return (
    <div className="space-y-1 text-sm pt-2 border-t border-border">
      <div className="flex justify-between">
        <span className="text-fg-muted">Monthly rent</span>
        <span>{formatCurrencyINR(summary.monthlyTotal)}</span>
      </div>
      <div className="flex justify-between">
        <span className="text-fg-muted">Refundable deposit</span>
        <span>{formatCurrencyINR(summary.depositTotal)}</span>
      </div>
      <div className="flex justify-between font-semibold pt-1">
        <span>Payable today</span>
        <span>{formatCurrencyINR(summary.payableNow)}</span>
      </div>
    </div>
  );
}
