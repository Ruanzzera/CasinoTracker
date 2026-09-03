import { useMemo, useState } from 'react';
import { Sparkles } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Slider } from '@/components/ui/slider';
import { ComboboxInput } from '@/components/ComboboxInput';
import type { RecommendResult, RecommendParams } from '@/hooks/useBetAndWin';
import { verdictConfig } from './verdictConfig';
import { IDEAL_SPIN_RATIO, WARN_SPIN_RATIO, volatilityLabels, type Volatility } from '@/lib/betAndWinModel';

export function RecommenderDialog({ open, onClose, houses, onRecommend }: {
  open: boolean;
  onClose: () => void;
  houses: string[];
  onRecommend: (params: RecommendParams) => RecommendResult;
}) {
  const [house, setHouse] = useState('');
  const [targetRollover, setTargetRollover] = useState('');
  const [spinCount, setSpinCount] = useState('');
  const [spinBet, setSpinBet] = useState('');
  const [rolloverRtp, setRolloverRtp] = useState(92);
  const [prizeRtp, setPrizeRtp] = useState(92);
  const [volatility, setVolatility] = useState<Volatility>('medium');

  const result = useMemo<RecommendResult | null>(() => {
    if (!house) return null;
    return onRecommend({
      house,
      targetRollover: parseFloat(targetRollover || '0'),
      spinCount: parseInt(spinCount || '0'),
      spinBet: parseFloat(spinBet || '0'),
      rolloverRtp: rolloverRtp / 100,
      prizeRtp: prizeRtp / 100,
      prizeVolatility: volatility,
    });
  }, [house, targetRollover, spinCount, spinBet, rolloverRtp, prizeRtp, volatility, onRecommend]);

  const fmt = (v: number) => v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  const ratioTone = (r: number) =>
    r >= IDEAL_SPIN_RATIO ? 'text-primary' : r >= WARN_SPIN_RATIO ? 'text-amber-500' : 'text-destructive';

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="w-5 h-5" /> Recomendador de Rollover
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Combinações rankeadas pela probabilidade de lucro (RTP informado + histórico quando existir).
          </p>
          <div>
            <Label>Casa</Label>
            <ComboboxInput value={house} onChange={setHouse} suggestions={houses} placeholder="Ex: Betano" />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div><Label>Rollover Alvo (R$)</Label><Input type="number" step="0.01" value={targetRollover} onChange={e => setTargetRollover(e.target.value)} placeholder="100" /></div>
            <div><Label>Qtd Giros</Label><Input type="number" value={spinCount} onChange={e => setSpinCount(e.target.value)} placeholder="200" /></div>
            <div><Label>Bet Giros (R$)</Label><Input type="number" step="0.01" value={spinBet} onChange={e => setSpinBet(e.target.value)} placeholder="0.05" /></div>
          </div>

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


          {result && result.mostConsistent && (
            <div className="rounded-lg border border-primary/30 bg-primary/5 p-3 text-sm">
              <span className="font-medium text-primary">⭐ Rollover mais consistente nesta casa:</span>{' '}
              <span className="text-foreground">{result.mostConsistent.game}</span>{' '}
              <span className="text-muted-foreground">(RTP {result.mostConsistent.rtpObserved.toFixed(1)}% · {result.mostConsistent.samples} amostras)</span>
            </div>
          )}

          {result && result.recommendations.length === 0 && (
            <div className="rounded-lg border border-border bg-muted/30 p-4 text-center text-sm text-muted-foreground">
              Sem histórico de jogos nesta casa para comparar. Use o Simulador para avaliar pelo RTP.
            </div>
          )}

          {result && result.recommendations.length > 0 && (
            <div className="space-y-2">
              <p className="text-sm font-medium text-foreground">Top {result.recommendations.length} Combinações</p>
              {result.recommendations.map((rec, i) => {
                const cfg = verdictConfig[rec.verdict];
                return (
                  <div key={i} className={`rounded-lg border p-3 ${cfg.color}`}>
                    <div className="flex items-start justify-between gap-2 mb-2 flex-wrap">
                      <div className="font-semibold text-sm">
                        #{i + 1} {rec.rolloverGame} → {rec.prizeGame}
                      </div>
                      <Badge variant="outline" className={cfg.color}>{cfg.label}</Badge>
                    </div>
                    <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 text-xs">
                      <div className="rounded bg-background/50 p-2">
                        <p className="opacity-70">Lucro Esperado</p>
                        <p className={`font-bold text-sm ${rec.expectedProfit >= 0 ? 'text-primary' : 'text-destructive'}`}>{fmt(rec.expectedProfit)}</p>
                      </div>
                      <div className="rounded bg-background/50 p-2">
                        <p className="opacity-70">Custo Rollover</p>
                        <p className="font-bold text-sm">{fmt(rec.expectedCost)}</p>
                      </div>
                      <div className="rounded bg-background/50 p-2">
                        <p className="opacity-70">Prob. Lucro</p>
                        <p className="font-bold text-sm">{rec.profitProbability.toFixed(0)}%</p>
                      </div>
                      <div className="rounded bg-background/50 p-2">
                        <p className="opacity-70">Giros / Rollover</p>
                        <p className={`font-bold text-sm ${ratioTone(rec.spinRatio)}`}>{(rec.spinRatio * 100).toFixed(1)}%</p>
                      </div>
                      <div className="rounded bg-background/50 p-2">
                        <p className="opacity-70">RTP / Amostras</p>
                        <p className="font-bold text-sm">{rec.rtpObserved.toFixed(0)}% · {rec.samples}</p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}


        </div>
      </DialogContent>
    </Dialog>
  );
}