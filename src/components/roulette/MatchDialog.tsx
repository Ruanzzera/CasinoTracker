import { useEffect, useMemo, useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, Check, X, RotateCcw, Zap } from 'lucide-react';
import type { RouletteMode, SpinInput } from '@/hooks/useRoulette';
import { spinProfit } from '@/hooks/useRoulette';

interface Props {
  modes: RouletteMode[];
  onFinish: (spins: SpinInput[], stake: number, mode: RouletteMode) => Promise<void> | void;
}

const fmt = (v: number) => v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

export function MatchDialog({ modes, onFinish }: Props) {
  const [open, setOpen] = useState(false);
  const defaultMode = useMemo(() => modes.find(m => m.isDefault) ?? modes[0], [modes]);
  const [modeId, setModeId] = useState<string>('');
  const [stake, setStake] = useState<string>('');
  const [spins, setSpins] = useState<SpinInput[]>([]);
  /** Gale level being attempted in the current round (0 = original attempt). */
  const [currentGale, setCurrentGale] = useState(0);
  const [pending, setPending] = useState<null | { result: 'W' | 'L' }>(null);
  const [saving, setSaving] = useState(false);

  const mode = modes.find(m => m.id === modeId) ?? defaultMode;
  const rounds = mode?.matchRounds ?? 3;
  const maxGales = mode?.maxGales ?? 2;

  useEffect(() => {
    if (open && defaultMode) {
      setModeId(defaultMode.id);
      setStake(String(defaultMode.defaultBet));
      setSpins([]); setPending(null); setCurrentGale(0);
    }
  }, [open, defaultMode]);

  useEffect(() => {
    if (mode) setStake(prev => prev === '' ? String(mode.defaultBet) : prev);
  }, [mode]);

  const wins = spins.filter(s => s.result === 'W').length;
  const losses = spins.filter(s => s.result === 'L').length;
  const isComplete = spins.length >= rounds;
  const stakeNum = parseFloat((stake || '0').replace(',', '.')) || 0;

  const totalProfit = useMemo(() => {
    if (!mode) return 0;
    return spins.reduce((acc, s) => acc + spinProfit(stakeNum, mode.payoutMultiplier, s), 0);
  }, [spins, stakeNum, mode]);

  const reset = () => { setSpins([]); setPending(null); setCurrentGale(0); };
  const close = () => { setOpen(false); reset(); };

  const onResultClick = (r: 'W' | 'L') => {
    if (isComplete || pending || !mode) return;
    setPending({ result: r });
  };

  const confirmSpin = () => {
    if (!pending || !mode) return;
    setSpins([...spins, { result: pending.result, galeCount: currentGale }]);
    setPending(null);
    setCurrentGale(0);
  };

  const applyGale = () => {
    setCurrentGale(g => g + 1);
    setPending(null);
  };

  const cancelPending = () => { setPending(null); };

  const finalize = async () => {
    if (!isComplete || !mode) return;
    setSaving(true);
    await onFinish(spins, stakeNum, mode);
    setSaving(false);
    close();
  };

  const previewProfit = pending && mode
    ? spinProfit(stakeNum, mode.payoutMultiplier, { result: pending.result, galeCount: currentGale })
    : 0;

  const pendingStake = stakeNum * Math.pow(2, currentGale);
  const canApplyGale = pending?.result === 'L' && currentGale < maxGales;
  const md = `MD${rounds}`;

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) reset(); setOpen(v); }}>
      <DialogTrigger asChild>
        <Button className="w-full gap-2" disabled={modes.length === 0}>
          <Plus className="w-4 h-4" /> Nova partida
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Nova partida {md}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-2">
            <div>
              <Label className="text-xs">Modo</Label>
              <Select value={modeId} onValueChange={(v) => {
                setModeId(v);
                const m = modes.find(x => x.id === v);
                if (m) setStake(String(m.defaultBet));
              }}>
                <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                <SelectContent>
                  {modes.map(m => (
                    <SelectItem key={m.id} value={m.id}>
                      {m.name} · MD{m.matchRounds} · {m.payoutMultiplier}× · até {m.maxGales} gales
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs">Stake por rodada</Label>
              <Input
                type="number" step="0.01"
                value={stake}
                onChange={e => setStake(e.target.value)}
                disabled={spins.length > 0}
              />
            </div>
          </div>

          {mode && (
            <div className="text-xs text-muted-foreground">
              {md} · {mode.payoutMultiplier}× · até {maxGales} gales · Win = +{fmt(stakeNum * (mode.payoutMultiplier - 1))} · Loss = -{fmt(stakeNum)}
            </div>
          )}

          <div className={`grid gap-2 ${rounds >= 3 ? 'grid-cols-3' : 'grid-cols-2'}`}>
            {Array.from({ length: rounds }).map((_, i) => {
              const s = spins[i];
              const isCurrent = i === spins.length;
              return (
                <div key={i} className={`rounded-lg border-2 p-3 text-center ${
                  s?.result === 'W' ? 'border-emerald-500/50 bg-emerald-500/10' :
                  s?.result === 'L' ? 'border-red-500/50 bg-red-500/10' :
                  isCurrent ? 'border-primary/50 bg-primary/5' :
                  'border-border bg-secondary/30'
                }`}>
                  <div className="text-xs text-muted-foreground mb-1">Rodada {i + 1}</div>
                  <div className={`text-2xl font-bold flex items-center justify-center gap-1 ${
                    s?.result === 'W' ? 'text-emerald-400' : s?.result === 'L' ? 'text-red-400' : 'text-muted-foreground'
                  }`}>
                    {s?.result ?? '—'}
                    {s && s.galeCount > 0 && (
                      <span className="inline-flex items-center text-[10px] text-yellow-400">
                        <Zap className="w-3 h-3" />{s.galeCount}
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {!isComplete && !pending && currentGale === 0 && (
            <div className="grid grid-cols-2 gap-2">
              <Button onClick={() => onResultClick('W')} disabled={!mode || stakeNum <= 0} className="bg-emerald-600 hover:bg-emerald-700 text-white gap-2">
                <Check className="w-4 h-4" /> Win
              </Button>
              <Button onClick={() => onResultClick('L')} disabled={!mode || stakeNum <= 0} variant="destructive" className="gap-2">
                <X className="w-4 h-4" /> Loss
              </Button>
            </div>
          )}

          {currentGale > 0 && !pending && (
            <div className="rounded-lg border border-yellow-500/40 bg-yellow-500/10 p-3 space-y-2">
              <div className="flex items-center gap-2 text-sm">
                <Zap className="w-4 h-4 text-yellow-400" />
                <span className="font-semibold">Gale {currentGale} ativo</span>
                <span className="text-xs text-muted-foreground">stake: {fmt(pendingStake)}</span>
              </div>
              <div className="text-xs text-muted-foreground">Qual o resultado da entrada de recuperação?</div>
              <div className="grid grid-cols-2 gap-2">
                <Button onClick={() => setPending({ result: 'W' })} className="bg-emerald-600 hover:bg-emerald-700 text-white gap-2">
                  <Check className="w-4 h-4" /> Win Gale
                </Button>
                <Button onClick={() => setPending({ result: 'L' })} variant="destructive" className="gap-2">
                  <X className="w-4 h-4" /> Loss Gale
                </Button>
              </div>
            </div>
          )}

          {pending && mode && (
            <div className="rounded-lg border-2 border-primary/50 bg-primary/5 p-3 space-y-3">
              <div className="text-sm font-semibold">
                Confirmar rodada {spins.length + 1}
                {currentGale > 0 && <span className="ml-2 text-yellow-400">(Gale {currentGale})</span>}
              </div>
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div>
                  <div className="text-xs text-muted-foreground">Stake</div>
                  <div className="font-semibold">{fmt(pendingStake)}</div>
                </div>
                <div>
                  <div className="text-xs text-muted-foreground">Resultado</div>
                  <div className={`font-semibold ${pending.result === 'W' ? 'text-emerald-400' : 'text-red-400'}`}>
                    {pending.result === 'W' ? 'Win' : 'Loss'}{currentGale > 0 ? ` (Gale ${currentGale})` : ''}
                  </div>
                </div>
                <div className="col-span-2">
                  <div className="text-xs text-muted-foreground">Lucro/Prejuízo da rodada</div>
                  <div className={`text-lg font-bold ${previewProfit >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                    {previewProfit >= 0 ? '+' : ''}{fmt(previewProfit)}
                  </div>
                </div>
              </div>
              <div className="flex flex-wrap gap-2">
                <Button onClick={confirmSpin} className="flex-1 gap-2"><Check className="w-4 h-4" /> Confirmar</Button>
                {canApplyGale && (
                  <Button onClick={applyGale} variant="outline" className="gap-2 border-yellow-500/40 text-yellow-400 hover:text-yellow-300">
                    <Zap className="w-4 h-4" /> Aplicar Gale {currentGale + 1}
                  </Button>
                )}
                <Button onClick={cancelPending} variant="ghost" size="icon"><X className="w-4 h-4" /></Button>
              </div>
            </div>
          )}

          <div className="flex items-center justify-between rounded-lg bg-secondary/50 p-3">
            <div>
              <div className="text-xs text-muted-foreground">Placar</div>
              <div className="text-lg font-bold">{wins}-{losses}</div>
            </div>
            <div className="text-right">
              <div className="text-xs text-muted-foreground">Acumulado</div>
              <div className={`text-lg font-bold ${totalProfit >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                {totalProfit >= 0 ? '+' : ''}{fmt(totalProfit)}
              </div>
            </div>
          </div>

          <div className="flex gap-2">
            <Button variant="outline" onClick={reset} disabled={spins.length === 0 || saving} className="gap-2">
              <RotateCcw className="w-4 h-4" /> Limpar
            </Button>
            <Button onClick={finalize} disabled={!isComplete || saving} className="flex-1">
              {saving ? 'Salvando...' : isComplete ? 'Salvar partida' : `Aguardando ${md}`}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}