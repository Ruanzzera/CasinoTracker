import { describe, it, expect } from 'vitest';
import { runModel, sampleSpinsReturn, makeRng, blendRtp } from './betAndWinModel';

describe('betAndWinModel', () => {
  it('calibra o RTP dos giros na média', () => {
    const rng = makeRng(42);
    let total = 0;
    const rounds = 200;
    const spins = 500;
    const bet = 0.05;
    for (let i = 0; i < rounds; i++) total += sampleSpinsReturn(spins, bet, 0.92, 'medium', rng);
    const observed = total / (rounds * spins * bet);
    expect(observed).toBeGreaterThan(0.8);
    expect(observed).toBeLessThan(1.05);
  });

  it('calcula custo, retorno e razão dos giros', () => {
    const r = runModel({
      requiredRollover: 100,
      rolloverRtp: 0.92,
      spinCount: 200,
      spinBet: 0.05,
      prizeRtp: 0.9,
      prizeVolatility: 'medium',
      iterations: 2000,
    });
    expect(r.expectedRolloverCost).toBeCloseTo(8, 5);
    expect(r.spinNominalValue).toBeCloseTo(10, 5);
    expect(r.expectedSpinReturn).toBeCloseTo(9, 5);
    expect(r.spinRatio).toBeCloseTo(0.09, 5);
    expect(r.minBetForIdeal).toBeCloseTo(20 / (200 * 0.9), 5);
  });

  it('probabilidade de lucro cresce com a bet dos giros', () => {
    const base = { requiredRollover: 100, rolloverRtp: 0.92, spinCount: 200, prizeRtp: 0.92, prizeVolatility: 'medium' as const, iterations: 4000 };
    const low = runModel({ ...base, spinBet: 0.05 });
    const high = runModel({ ...base, spinBet: 0.5 });
    expect(high.profitProbability).toBeGreaterThan(low.profitProbability);
    expect(high.expectedProfit).toBeGreaterThan(low.expectedProfit);
  });

  it('blendRtp ignora histórico com poucas amostras', () => {
    expect(blendRtp(0.92, 0.5, 2)).toBe(0.92);
    expect(blendRtp(0.92, 0.8, 5)).toBeCloseTo(0.86, 5);
  });
});
