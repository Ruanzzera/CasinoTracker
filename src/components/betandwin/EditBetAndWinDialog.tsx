import { useMemo, useState } from 'react';
import { Loader2 } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { ComboboxInput } from '@/components/ComboboxInput';
import type { BetAndWinEntry } from '@/hooks/useBetAndWin';
import { ACCOUNTS } from '@/types/casino';
import { toast } from 'sonner';

export function EditBetAndWinDialog({ entry, open, onClose, onSave, houses, games }: {
  entry: BetAndWinEntry;
  open: boolean;
  onClose: () => void;
  onSave: (data: { entryDate: string; entryTime: string; house: string; rolloverGame: string; prizeGame: string; betValue: number; requiredBets: number; initialBankroll: number; finalBankroll: number; spinCount: number; spinBet: number; spinPrize: number; account: string[] }) => Promise<void>;
  houses: string[];
  games: string[];
}) {
  const [entryDate, setEntryDate] = useState(entry.entryDate);
  const [entryTime, setEntryTime] = useState(entry.entryTime || '12:00');
  const [house, setHouse] = useState(entry.house);
  const [rolloverGame, setRolloverGame] = useState(entry.rolloverGame);
  const [prizeGame, setPrizeGame] = useState(entry.prizeGame);
  const [betValue, setBetValue] = useState(String(entry.betValue));
  const [requiredBets, setRequiredBets] = useState(String(entry.requiredBets));
  const [initialBankroll, setInitialBankroll] = useState(String(entry.initialBankroll));
  const [finalBankroll, setFinalBankroll] = useState(String(entry.finalBankroll));
  const [spinCount, setSpinCount] = useState(String(entry.spinCount));
  const [spinBet, setSpinBet] = useState(String(entry.spinBet));
  const [spinPrize, setSpinPrize] = useState(String(entry.spinPrize));
  const [account, setAccount] = useState<string[]>(entry.account && entry.account.length > 0 ? entry.account : ['Ruan']);
  const [saving, setSaving] = useState(false);

  const liveCalcs = useMemo(() => {
    const ib = parseFloat(initialBankroll || '0');
    const fb = parseFloat(finalBankroll || '0');
    const sp = parseFloat(spinPrize || '0');
    return { rolloverCost: ib - fb, finalBalance: (fb - ib) + sp };
  }, [initialBankroll, finalBankroll, spinPrize]);

  const handleSave = async () => {
    if (!house) { toast.error('Preencha a casa'); return; }
    if (account.length === 0) { toast.error('Selecione pelo menos uma conta'); return; }
    setSaving(true);
    await onSave({
      entryDate, entryTime, house, rolloverGame, prizeGame,
      betValue: parseFloat(betValue || '0'),
      requiredBets: parseFloat(requiredBets || '0'),
      initialBankroll: parseFloat(initialBankroll || '0'),
      finalBankroll: parseFloat(finalBankroll || '0'),
      spinCount: parseInt(spinCount || '0'),
      spinBet: parseFloat(spinBet || '0'),
      spinPrize: parseFloat(spinPrize || '0'),
      account,
    });
    setSaving(false);
  };

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader><DialogTitle>Editar Entrada</DialogTitle></DialogHeader>
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div><Label>Data</Label><Input type="date" value={entryDate} onChange={e => setEntryDate(e.target.value)} /></div>
            <div><Label>Hora</Label><Input type="time" value={entryTime} onChange={e => setEntryTime(e.target.value)} /></div>
          </div>
          <div>
            <Label>Casa *</Label>
            <ComboboxInput value={house} onChange={setHouse} suggestions={houses} />
          </div>
          <div>
            <Label className="mb-2 block">Contas</Label>
            <div className="flex flex-wrap gap-4">
              {ACCOUNTS.map(acc => (
                <label key={acc} className="flex items-center gap-2 text-sm text-foreground cursor-pointer">
                  <Checkbox
                    checked={account.includes(acc)}
                    onCheckedChange={(checked) => {
                      setAccount(prev => checked ? [...prev, acc] : prev.filter(a => a !== acc));
                    }}
                  />
                  {acc}
                </label>
              ))}
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div><Label>Jogo Rollover</Label><ComboboxInput value={rolloverGame} onChange={setRolloverGame} suggestions={games} /></div>
            <div><Label>Jogo Prêmio</Label><ComboboxInput value={prizeGame} onChange={setPrizeGame} suggestions={games} /></div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div><Label>Valor da Bet (R$)</Label><Input type="number" step="0.01" value={betValue} onChange={e => setBetValue(e.target.value)} /></div>
            <div><Label>Apostas Necessárias (R$)</Label><Input type="number" step="0.01" value={requiredBets} onChange={e => setRequiredBets(e.target.value)} /></div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div><Label>Banca Inicial (R$)</Label><Input type="number" step="0.01" value={initialBankroll} onChange={e => setInitialBankroll(e.target.value)} /></div>
            <div><Label>Banca Final (R$)</Label><Input type="number" step="0.01" value={finalBankroll} onChange={e => setFinalBankroll(e.target.value)} /></div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div><Label>Qtd Giros</Label><Input type="number" value={spinCount} onChange={e => setSpinCount(e.target.value)} /></div>
            <div><Label>Bet Rodadas (R$)</Label><Input type="number" step="0.01" value={spinBet} onChange={e => setSpinBet(e.target.value)} /></div>
            <div><Label>Valor Ganho Giros (R$)</Label><Input type="number" step="0.01" value={spinPrize} onChange={e => setSpinPrize(e.target.value)} /></div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className={`rounded-lg border p-3 text-center ${liveCalcs.rolloverCost > 0 ? 'border-destructive/30 bg-destructive/5' : 'border-primary/30 bg-primary/5'}`}>
              <p className="text-xs text-muted-foreground">Custo Rollover</p>
              <p className={`text-lg font-bold ${liveCalcs.rolloverCost > 0 ? 'text-destructive' : 'text-primary'}`}>
                {liveCalcs.rolloverCost.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
              </p>
            </div>
            <div className={`rounded-lg border p-3 text-center ${liveCalcs.finalBalance >= 0 ? 'border-primary/30 bg-primary/5' : 'border-destructive/30 bg-destructive/5'}`}>
              <p className="text-xs text-muted-foreground">Saldo Final</p>
              <p className={`text-lg font-bold ${liveCalcs.finalBalance >= 0 ? 'text-primary' : 'text-destructive'}`}>
                {liveCalcs.finalBalance.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
              </p>
            </div>
          </div>
          <Button className="w-full" onClick={handleSave} disabled={saving}>
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Salvar Alterações'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}