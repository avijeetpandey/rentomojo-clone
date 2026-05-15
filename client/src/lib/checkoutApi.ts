import { apiFetch } from './api';

export type OrderStatus = 'PENDING_PAYMENT' | 'PAID' | 'ACTIVE' | 'CANCELLED' | 'COMPLETED';

export interface Address {
  addressLine1: string;
  addressLine2?: string;
  city: string;
  state: string;
  pincode: string;
  contactPhone: string;
}

export interface OrderItem {
  id: string;
  productId: string;
  productName: string;
  quantity: number;
  tenure: 'M1' | 'M3' | 'M6' | 'M12';
  monthsCount: number;
  monthlyRent: number;
  depositAmount: number;
}

export interface Order {
  id: string;
  status: OrderStatus;
  subtotal: number;
  depositTotal: number;
  totalDueNow: number;
  monthlyTotal: number;
  address: Address & { addressLine2?: string | null };
  kycDocumentRef: string | null;
  createdAt: string;
  items: OrderItem[];
}

export type KycDocumentType = 'AADHAAR' | 'PASSPORT' | 'DRIVING_LICENSE';

export const checkoutApi = {
  submitKyc: (
    token: string,
    body: { documentType: KycDocumentType; documentNumber: string; documentRef: string },
  ) =>
    apiFetch<{ status: 'APPROVED' | 'REJECTED' | 'PENDING'; documentRef: string }>('/api/v1/checkout/kyc', {
      method: 'POST',
      token,
      body,
    }),

  createOrder: (token: string, body: { address: Address; kycDocumentRef?: string }) =>
    apiFetch<{ order: Order }>('/api/v1/checkout/orders', { method: 'POST', token, body }),

  listOrders: (token: string) => apiFetch<{ orders: Order[] }>('/api/v1/checkout/orders', { token }),

  getOrder: (token: string, id: string) =>
    apiFetch<{ order: Order }>(`/api/v1/checkout/orders/${id}`, { token }),
};
