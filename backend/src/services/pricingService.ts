import type { RentalTenure } from '@prisma/client';

export const TENURE_MONTHS: Record<RentalTenure, number> = {
  M1: 1,
  M3: 3,
  M6: 6,
  M12: 12,
};

export const ALL_TENURES: RentalTenure[] = ['M1', 'M3', 'M6', 'M12'];

export interface PricingInput {
  baseMonthlyRent: number;
  depositAmount: number;
  discount3M: number;
  discount6M: number;
  discount12M: number;
  tenure: RentalTenure;
  quantity: number;
}

export interface PricingBreakdown {
  tenure: RentalTenure;
  months: number;
  quantity: number;
  unitMonthlyRent: number; // after discount, per unit
  monthlyRent: number; // unitMonthlyRent * quantity
  discountPct: number;
  depositPerUnit: number;
  depositTotal: number;
  totalRentOverTenure: number; // monthlyRent * months
}

export function discountFor(input: PricingInput): number {
  switch (input.tenure) {
    case 'M1':
      return 0;
    case 'M3':
      return input.discount3M;
    case 'M6':
      return input.discount6M;
    case 'M12':
      return input.discount12M;
  }
}

export function computePricing(input: PricingInput): PricingBreakdown {
  const months = TENURE_MONTHS[input.tenure];
  const discount = Math.max(0, Math.min(1, discountFor(input)));
  const unitMonthlyRent = Math.round(input.baseMonthlyRent * (1 - discount));
  const monthlyRent = unitMonthlyRent * input.quantity;
  const depositTotal = input.depositAmount * input.quantity;
  return {
    tenure: input.tenure,
    months,
    quantity: input.quantity,
    unitMonthlyRent,
    monthlyRent,
    discountPct: Number((discount * 100).toFixed(2)),
    depositPerUnit: input.depositAmount,
    depositTotal,
    totalRentOverTenure: monthlyRent * months,
  };
}
