import { computePricing, TENURE_MONTHS } from '../src/services/pricingService';

describe('pricingService', () => {
  const base = {
    baseMonthlyRent: 1000,
    depositAmount: 2000,
    discount3M: 0,
    discount6M: 0.05,
    discount12M: 0.1,
    quantity: 1,
  };

  it('returns base rent for M1 with zero discount', () => {
    const p = computePricing({ ...base, tenure: 'M1' });
    expect(p.unitMonthlyRent).toBe(1000);
    expect(p.monthlyRent).toBe(1000);
    expect(p.discountPct).toBe(0);
    expect(p.months).toBe(1);
    expect(p.totalRentOverTenure).toBe(1000);
    expect(p.depositTotal).toBe(2000);
  });

  it('applies 5% discount for M6', () => {
    const p = computePricing({ ...base, tenure: 'M6' });
    expect(p.unitMonthlyRent).toBe(950);
    expect(p.discountPct).toBe(5);
    expect(p.months).toBe(6);
    expect(p.totalRentOverTenure).toBe(950 * 6);
  });

  it('applies 10% discount and scales quantity for M12', () => {
    const p = computePricing({ ...base, tenure: 'M12', quantity: 2 });
    expect(p.unitMonthlyRent).toBe(900);
    expect(p.monthlyRent).toBe(1800);
    expect(p.depositTotal).toBe(4000);
    expect(p.totalRentOverTenure).toBe(1800 * 12);
  });

  it('exposes month mapping for all tenures', () => {
    expect(TENURE_MONTHS).toEqual({ M1: 1, M3: 3, M6: 6, M12: 12 });
  });
});
