import { describe, expect, it } from 'vitest';
import { finalPrice } from './price-rule';

describe('simulated price rule', () => {
  it.each([
    [1000000, 40, 3, 1000000],
    [1000000, 22, 8, 1250000],
    [1000000, 70, 15, 1300000],
    [350000, 25, 6, 437500],
    [350000, 26, 5, 350000],
    [333333, 30, 10, 366666],
    [12345, 30, 10, 13580],
    [520000, undefined, 11, 624000],
  ])(
    'AC-043 base %i, age %s, vehicle %s gives %i (documented examples)',
    (base, age, vehicle, price) => {
      expect(finalPrice(base, age, vehicle)).toBe(price);
    },
  );

  it.each([
    [-1, 0],
    [0, 0],
    [5, 0],
    [6, 10],
    [10, 10],
    [11, 20],
    [40, 20],
  ])('AC-043 a vehicle of %i years adds %i %%', (vehicleAge, percent) => {
    expect(finalPrice(100000, 40, vehicleAge)).toBe(100000 + percent * 1000);
  });

  it.each([
    [18, 15],
    [25, 15],
    [26, 0],
    [64, 0],
    [65, 10],
    [90, 10],
  ])('AC-043 a policyholder of %i years adds %i %%', (policyholderAge, percent) => {
    expect(finalPrice(100000, policyholderAge, 3)).toBe(100000 + percent * 1000);
  });

  it('AC-043 inputs that are not available add nothing', () => {
    expect(finalPrice(690000, undefined, undefined)).toBe(690000);
    expect(finalPrice(690000, 22, undefined)).toBe(793500);
  });

  it('AC-043 rounds to the nearest whole amount with halves up', () => {
    expect(finalPrice(5, 22, 3)).toBe(6); // 5.75
    expect(finalPrice(10, 22, 6), 'exactly half').toBe(13); // 12.5
    expect(finalPrice(1, 30, 6)).toBe(1); // 1.1
  });
});
