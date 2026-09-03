import { describe, it, expect } from 'vitest';
import { spinProfit } from '@/lib/roulette-math';

describe('spinProfit', () => {
  it('returns net win = stake * (payout-1) on a straight W (no gales)', () => {
    expect(spinProfit(10, 3, { result: 'W', galeCount: 0 })).toBe(20); // 10*(3-1)
    expect(spinProfit(10, 2, { result: 'W', galeCount: 0 })).toBe(10);
  });

  it('returns -stake on a straight L (no gales)', () => {
    expect(spinProfit(10, 3, { result: 'L', galeCount: 0 })).toBe(-10);
  });

  it('recovers previous losses on gale 1 W (payout 3x, stake 10 -> profit 30)', () => {
    // Lost 10, then stake 20 wins net 40 -> total +30
    expect(spinProfit(10, 3, { result: 'W', galeCount: 1 })).toBe(30);
  });

  it('sums all losses on gale 1 L', () => {
    // Lost 10, then lost 20 -> -30
    expect(spinProfit(10, 3, { result: 'L', galeCount: 1 })).toBe(-30);
  });

  it('handles gale 2: W on 2x payout recovers correctly', () => {
    // Lost 10 + 20 = 30, stake 40 wins net 40 -> +10
    expect(spinProfit(10, 2, { result: 'W', galeCount: 2 })).toBe(10);
  });

  it('handles gale 2: L accumulates losses', () => {
    // -(10 + 20 + 40) = -70
    expect(spinProfit(10, 3, { result: 'L', galeCount: 2 })).toBe(-70);
  });

  it('clamps negative galeCount to 0', () => {
    expect(spinProfit(10, 3, { result: 'W', galeCount: -5 })).toBe(20);
  });
});