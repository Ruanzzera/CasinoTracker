/** Pure helpers for the Alavancagem/Roulette module. Extracted so they can be
 *  unit-tested without dragging the Supabase client into the test bundle. */

export interface SpinInput {
  result: 'W' | 'L';
  /** Number of gales applied in this round (0..maxGales). */
  galeCount: number;
}

/** Profit for a single round; stake doubles each gale. */
export function spinProfit(stake: number, payoutMultiplier: number, s: SpinInput): number {
  const net = payoutMultiplier - 1;
  const n = Math.max(0, s.galeCount | 0);
  const finalStake = stake * Math.pow(2, n);
  const prevLost = stake * (Math.pow(2, n) - 1); // sum of all losing previous attempts
  return s.result === 'W' ? finalStake * net - prevLost : -(prevLost + finalStake);
}