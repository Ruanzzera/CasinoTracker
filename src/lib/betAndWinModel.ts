/**
 * Modelo teórico de promoções "Aposte e Ganhe" baseado em RTP + volatilidade.
 * Funções puras e determinísticas (PRNG com seed) para permitir testes.
 */

export type Volatility = 'low' | 'medium' | 'high';

export const volatilityLabels: Record<Volatility, string> = {
  low: 'Baixa',
  medium: 'Média',
  high: 'Alta',
};

/** Régua ideal do usuário: giros devem valer >= 20% do rollover */
export const IDEAL_SPIN_RATIO = 0.2;
export const WARN_SPIN_RATIO = 0.12;

/** Parâmetros da distribuição de prêmios do slot */
const PRIZE_SHAPE: Record<Volatility, { hitRate: number; alpha: number }> = {
  // alpha menor => cauda mais longa (mais volátil)
  low: { hitRate: 0.42, alpha: 3.2 },
  medium: { hitRate: 0.3, alpha: 2.2 },
  high: { hitRate: 0.2, alpha: 1.7 },
};

/** Desvio relativo da perda de rollover em função da volatilidade */
const ROLLOVER_SD: Record<Volatility, number> = {
  low: 0.07,
  medium: 0.13,
  high: 0.22,
};

/** PRNG determinístico (mulberry32) */
export function makeRng(seed = 123456789) {
  let a = seed >>> 0;
  return function rng() {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Amostra o retorno total (R$) de `spins` giros de bet `bet` com o RTP e volatilidade dados */
export function sampleSpinsReturn(
  spins: number,
  bet: number,
  rtp: number,
  volatility: Volatility,
  rng: () => number,
): number {
  if (spins <= 0 || bet <= 0) return 0;
  const { hitRate, alpha } = PRIZE_SHAPE[volatility];
  // média do multiplicador condicionado a acerto
  const meanHit = rtp / hitRate;
  // Pareto: mean = alpha*xm/(alpha-1)
  const xm = (meanHit * (alpha - 1)) / alpha;
  let total = 0;
  for (let i = 0; i < spins; i++) {
    if (rng() >= hitRate) continue;
    const u = Math.max(rng(), 1e-9);
    total += bet * xm * Math.pow(u, -1 / alpha);
  }
  return total;
}

/** Amostra a perda (R$) para cumprir o rollover com o RTP informado */
export function sampleRolloverLoss(
  rollover: number,
  rtp: number,
  volatility: Volatility,
  rng: () => number,
): number {
  if (rollover <= 0) return 0;
  const expected = rollover * (1 - rtp);
  const sd = rollover * ROLLOVER_SD[volatility];
  // Box-Muller
  const u1 = Math.max(rng(), 1e-9);
  const u2 = rng();
  const z = Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);
  const loss = expected + z * sd;
  // Limites plausíveis: nunca ganha mais do que o rollover, nem perde mais que o rollover
  return Math.max(-rollover, Math.min(rollover, loss));
}

export interface ModelInput {
  requiredRollover: number;
  rolloverRtp: number; // 0..1
  rolloverVolatility?: Volatility;
  spinCount: number;
  spinBet: number;
  prizeRtp: number; // 0..1
  prizeVolatility: Volatility;
  iterations?: number;
  seed?: number;
}

export interface ModelOutput {
  /** custo teórico do rollover = rollover * (1 - rtp) */
  expectedRolloverCost: number;
  /** retorno esperado dos giros = giros * bet * rtp */
  expectedSpinReturn: number;
  /** valor nominal dos giros (giros * bet) */
  spinNominalValue: number;
  /** retorno esperado dos giros como fração do rollover */
  spinRatio: number;
  expectedProfit: number;
  profitProbability: number;
  p10: number;
  p90: number;
  /** bet mínima para os giros atingirem IDEAL_SPIN_RATIO do rollover */
  minBetForIdeal: number;
  verdict: 'viable' | 'marginal' | 'inviable';
}

export function runModel(input: ModelInput): ModelOutput {
  const {
    requiredRollover,
    rolloverRtp,
    rolloverVolatility = 'medium',
    spinCount,
    spinBet,
    prizeRtp,
    prizeVolatility,
    iterations = 10000,
    seed = 987654321,
  } = input;

  const spinNominalValue = Math.max(0, spinCount) * Math.max(0, spinBet);
  const expectedRolloverCost = Math.max(0, requiredRollover) * (1 - rolloverRtp);
  const expectedSpinReturn = spinNominalValue * prizeRtp;
  const spinRatio = requiredRollover > 0 ? expectedSpinReturn / requiredRollover : 0;
  const minBetForIdeal =
    spinCount > 0 && prizeRtp > 0
      ? (requiredRollover * IDEAL_SPIN_RATIO) / (spinCount * prizeRtp)
      : 0;

  const rng = makeRng(seed);
  const profits: number[] = new Array(iterations);
  let wins = 0;
  let sum = 0;
  for (let i = 0; i < iterations; i++) {
    const loss = sampleRolloverLoss(requiredRollover, rolloverRtp, rolloverVolatility, rng);
    const prize = sampleSpinsReturn(spinCount, spinBet, prizeRtp, prizeVolatility, rng);
    const profit = prize - loss;
    profits[i] = profit;
    sum += profit;
    if (profit > 0) wins++;
  }
  profits.sort((a, b) => a - b);
  const pick = (p: number) => profits[Math.min(profits.length - 1, Math.max(0, Math.floor(profits.length * p)))];

  const profitProbability = (wins / iterations) * 100;
  const expectedProfit = sum / iterations;

  let verdict: ModelOutput['verdict'];
  if (profitProbability >= 50 && expectedProfit > 0) verdict = 'viable';
  else if (profitProbability >= 32 || expectedProfit > -expectedRolloverCost * 0.2) verdict = 'marginal';
  else verdict = 'inviable';

  return {
    expectedRolloverCost,
    expectedSpinReturn,
    spinNominalValue,
    spinRatio,
    expectedProfit,
    profitProbability,
    p10: pick(0.1),
    p90: pick(0.9),
    minBetForIdeal,
    verdict,
  };
}

/** Mistura RTP informado com RTP observado no histórico (>=3 amostras) */
export function blendRtp(informed: number, observed: number | null, samples: number): number {
  if (observed == null || samples < 3 || !isFinite(observed) || observed <= 0) return informed;
  return (informed + observed) / 2;
}
