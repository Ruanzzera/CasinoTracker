import { useMemo, useState } from 'react';
import { Calculator } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Slider } from '@/components/ui/slider';
import { ComboboxInput } from '@/components/ComboboxInput';
import type { SimulationResult, SimulationParams } from '@/hooks/useBetAndWin';
import { verdictConfig } from './verdictConfig';
import { IDEAL_SPIN_RATIO, WARN_SPIN_RATIO, volatilityLabels, type Volatility } from '@/lib/betAndWinModel';

export function SimulatorDialog({ open, onClose, houses, games, onSimulate }: {
  open: boolean;
  onClose: () => void;
  houses: string[];
  games: string[];
  onSimulate: (params: SimulationParams) => SimulationResult;
}) {
  const [house, setHouse] = useState('');
  const [deposit, setDeposit] = useState('');
  const [requiredRollover, setRequiredRollover] = useState('');
  const [spinCount, setSpinCount] = useState('');
  const [spinBet, setSpinBet] = useState('');
  const [prizeGame, setPrizeGame] = useState('');
  const [rolloverRtp, setRolloverRtp] = useState(92);
  const [prizeRtp, setPrizeRtp] = useState(92);
  const [volatility, setVolatility] = useState<Volatility>('medium');

  const numbers = {
    deposit: parseFloat(deposit || '0'),
    requiredRollover: parseFloat(requiredRollover || '0'),
    spinCount: parseInt(spinCount || '0'),
    spinBet: parseFloat(spinBet || '0'),
  };

  const result = useMemo<SimulationResult | null>(() => {
    if (numbers.requiredRollover <= 0 && numbers.spinCount <= 0) return null;
    return onSimulate({
      house,
      deposit: numbers.deposit,
      requiredRollover: numbers.requiredRollover,
      spinCount: numbers.spinCount,
      spinBet: numbers.spinBet,
      prizeGame,
      rolloverRtp: rolloverRtp / 100,
      prizeRtp: prizeRtp / 100,
      prizeVolatility: volatility,
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [house, deposit, requiredRollover, spinCount, spinBet, prizeGame, rolloverRtp, prizeRtp, volatility, onSimulate]);

  const config = result ? verdictConfig[result.verdict] : null;
  const fmt = (v: number) => v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  const nominal = numbers.spinCount * numbers.spinBet;
  const nominalRatio = numbers.requiredRollover > 0 ? nominal / numbers.requiredRollover : 0;

  const ratioTone = (r: number) =>
    r >= IDEAL_SPIN_RATIO ? 'text-primary' : r >= WARN_SPIN_RATIO ? 'text-amber-500' : 'text-destructive';

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Calculator className="w-5 h-5" /> Simular Promoção
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Modelo baseado em RTP e volatilidade, calibrado com seu histórico quando existir.
          </p>
          <div>
            <Label>Casa</Label>
            <ComboboxInput value={house} onChange={setHouse} suggestions={houses} placeholder="Ex: Betano" />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div><Label>Depósito (R$)</Label><Input type="number" step="0.01" value={deposit} onChange={e => setDeposit(e.target.value)} placeholder="100.00" /></div>
            <div><Label>Rollover Necessário (R$)</Label><Input type="number" step="0.01" value={requiredRollover} onChange={e => setRequiredRollover(e.target.value)} placeholder="100.00" /></div>
          </div>
          <div>
            <Label>Jogo do Prêmio</Label>
            <ComboboxInput value={prizeGame} onChange={setPrizeGame} suggestions={games} placeholder="Ex: Gates of Olympus" />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div><Label>Qtd Giros do Prêmio</Label><Input type="number" value={spinCount} onChange={e => setSpinCount(e.target.value)} placeholder="200" /></div>
            <div><Label>Bet dos Giros (R$)</Label><Input type="number" step="0.01" value={spinBet} onChange={e => setSpinBet(e.target.value)} placeholder="0.05" /></div>
          </div>

          {nominal > 0 && (
            <div className="rounded-lg border border-border bg-muted/30 p-3 text-xs">
              {numbers.spinCount} × {fmt(numbers.spinBet)} = <strong>{fmt(nominal)}</strong>
              {numbers.requiredRollover > 0 && (
                <> = <strong className={ratioTone(nominalRatio)}>{(nominalRatio * 100).toFixed(1)}%</strong> do rollover (ideal ≥ 20%)</>
              )}
            </div>
          )}

          <div className="space-y-4 rounded-lg border border-border p-3">
            <div>
              <div className="flex justify-between text-sm">
                <Label>RTP do jogo de rollover</Label>
                <span className="font-medium">{rolloverRtp}%</span>
              </div>
              <Slider className="mt-2" min={86} max={98} step={1} value={[rolloverRtp]} onValueChange={([v]) => setRolloverRtp(v)} />
            </div>
            <div>
              <div className="flex justify-between text-sm">
                <Label>RTP do jogo do prêmio</Label>
                <span className="font-medium">{prizeRtp}%</span>
              </div>
              <Slider className="mt-2" min={86} max={98} step={1} value={[prizeRtp]} onValueChange={([v]) => setPrizeRtp(v)} />
            </div>
            <div>
              <Label>Volatilidade do jogo do prêmio</Label>
              <div className="mt-2 grid grid-cols-3 gap-1 rounded-md border border-border bg-secondary p-1">
                {(['low', 'medium', 'high'] as Volatility[]).map(v => (
                  <button
                    key={v}
                    type="button"
                    onClick={() => setVolatility(v)}
                    aria-pressed={volatility === v}
                    className={`rounded-sm px-2 py-1.5 text-sm font-medium transition-colors ${
                      volatility === v ? 'bg-primary text-primary-foreground shadow' : 'text-muted-foreground hover:bg-background/40'
                    }`}
                  >
                    {volatilityLabels[v]}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {result && (
            <div className={`rounded-xl border p-5 space-y-4 ${config!.color}`}>
              <div className="flex items-center justify-between">
                <span className="font-semibold text-lg">Resultado</span>
                <Badge variant="outline" className={config!.color}>{config!.label}</Badge>
              </div>

              <div className="grid grid-cols-2 gap-3 text-sm">
                <div className="rounded-lg bg-background/50 p-3">
                  <p className="text-xs opacity-70">Prob. de Lucro</p>
                  <p className="font-bold text-base">{result.model.profitProbability.toFixed(0)}%</p>
                  <p className="text-xs opacity-50">10.000 simulações</p>
                </div>
                <div className="rounded-lg bg-background/50 p-3">
                  <p className="text-xs opacity-70">Lucro Esperado</p>
                  <p className="font-bold text-base">{fmt(result.model.expectedProfit)}</p>
                  <p className="text-xs opacity-50">média das simulações</p>
                </div>
                <div className="rounded-lg bg-background/50 p-3">
                  <p className="text-xs opacity-70">Custo Teórico Rollover</p>
                  <p className="font-bold text-base">{fmt(result.model.expectedRolloverCost)}</p>
                  <p className="text-xs opacity-50">RTP usado {(result.rolloverRtpUsed * 100).toFixed(1)}%</p>
                </div>
                <div className="rounded-lg bg-background/50 p-3">
                  <p className="text-xs opacity-70">Retorno Esperado Giros</p>
                  <p className="font-bold text-base">{fmt(result.model.expectedSpinReturn)}</p>
                  <p className={`text-xs font-medium ${ratioTone(result.model.spinRatio)}`}>
                    {(result.model.spinRatio * 100).toFixed(1)}% do rollover
                  </p>
                </div>
                <div className="rounded-lg bg-background/50 p-3">
                  <p className="text-xs opacity-70">Pior / Melhor Caso</p>
                  <p className="font-bold text-base">{fmt(result.model.p10)} · {fmt(result.model.p90)}</p>
                  <p className="text-xs opacity-50">percentis 10 e 90</p>
                </div>
                <div className="rounded-lg bg-background/50 p-3">
                  <p className="text-xs opacity-70">Bet mín. p/ 20%</p>
                  <p className="font-bold text-base">{fmt(result.model.minBetForIdeal)}</p>
                  <p className="text-xs opacity-50">com {numbers.spinCount} giros</p>
                </div>
              </div>

              <div className="text-xs space-y-1 opacity-80">
                {result.houseSamples >= 3 && result.rolloverRtpObserved != null ? (
                  <p>Histórico da casa: RTP observado {(result.rolloverRtpObserved * 100).toFixed(1)}% ({result.houseSamples} amostras) — misturado ao informado.</p>
                ) : (
                  <p>Sem histórico suficiente da casa ({result.houseSamples} amostras): usando apenas o RTP informado.</p>
                )}
                {result.gameSamples >= 3 && result.prizeRtpObserved != null ? (
                  <p>Histórico do jogo do prêmio: retorno observado {(result.prizeRtpObserved * 100).toFixed(1)}% ({result.gameSamples} amostras).</p>
                ) : (
                  <p>Sem histórico suficiente do jogo do prêmio ({result.gameSamples} amostras): usando apenas o RTP informado.</p>
                )}
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
