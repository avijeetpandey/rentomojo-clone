import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import { Toaster } from '@/components/ui/toaster';
import CheckoutPage from '@/pages/CheckoutPage';
import DashboardPage from '@/pages/DashboardPage';

// ---- mock fetch so we don't hit a real network in tests ----
const EMPTY_CART = {
  cart: {
    id: null,
    items: [],
    summary: { itemCount: 0, monthlyTotal: 0, depositTotal: 0, totalRentOverTenure: 0, payableNow: 0 },
  },
};
const ACTIVE_ORDER = {
  orders: [
    {
      id: 'ord_test1',
      status: 'ACTIVE',
      subtotal: 11400,
      depositTotal: 4000,
      totalDueNow: 5900,
      monthlyTotal: 1900,
      address: {
        addressLine1: '1 MG Road',
        city: 'Bangalore',
        state: 'Karnataka',
        pincode: '560001',
        contactPhone: '999',
      },
      kycDocumentRef: null,
      createdAt: new Date().toISOString(),
      items: [
        {
          id: 'oi1',
          productId: 'p1',
          productName: 'Test Sofa',
          quantity: 2,
          tenure: 'M6',
          monthsCount: 6,
          monthlyRent: 1900,
          depositAmount: 4000,
        },
      ],
    },
  ],
};

beforeEach(() => {
  vi.stubGlobal(
    'fetch',
    vi.fn(async (url: string) => ({
      ok: true,
      status: 200,
      text: async () => {
        if (String(url).includes('/cart')) return JSON.stringify(EMPTY_CART);
        if (String(url).includes('/orders')) return JSON.stringify(ACTIVE_ORDER);
        return JSON.stringify({});
      },
    })),
  );
});

afterEach(() => {
  vi.unstubAllGlobals();
});

// Fake the auth store so pages don't redirect.
vi.mock('@/store/authStore', () => ({
  useAuthStore: (sel: ((s: unknown) => unknown) | undefined) => {
    const state = {
      token: 'test-token',
      user: {
        id: 'u1',
        email: 'a@b.com',
        fullName: 'Test User',
        city: 'Bangalore',
        role: 'CUSTOMER',
        kycStatus: 'NOT_SUBMITTED',
      },
      setUser: () => {},
      setSession: () => {},
      clear: () => {},
    };
    return typeof sel === 'function' ? sel(state) : state;
  },
}));

vi.mock('@/store/cartStore', () => ({
  useCartStore: (sel: ((s: unknown) => unknown) | undefined) => {
    const state = { cart: EMPTY_CART.cart, setCart: () => {}, refresh: async () => {}, reset: () => {} };
    return typeof sel === 'function' ? sel(state) : state;
  },
}));

function Wrapper({ children }: { children: React.ReactNode }) {
  return (
    <MemoryRouter initialEntries={['/']}>
      <Toaster>{children}</Toaster>
    </MemoryRouter>
  );
}

describe('CheckoutPage', () => {
  it('renders empty-cart fallback when cart has no items', async () => {
    render(
      <Wrapper>
        <CheckoutPage />
      </Wrapper>,
    );
    expect(await screen.findByText(/nothing to checkout/i)).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /browse catalog/i })).toBeInTheDocument();
  });
});

describe('DashboardPage', () => {
  it('renders profile + active rental section', async () => {
    render(
      <Wrapper>
        <DashboardPage />
      </Wrapper>,
    );
    expect(await screen.findByText('Test User')).toBeInTheDocument();
    expect(screen.getByText('Active rentals')).toBeInTheDocument();
  });

  it('displays order details from API', async () => {
    render(
      <Wrapper>
        <DashboardPage />
      </Wrapper>,
    );
    expect(await screen.findByText('Test Sofa')).toBeInTheDocument();
    expect(screen.getByText(/5,900/)).toBeInTheDocument();
  });
});
