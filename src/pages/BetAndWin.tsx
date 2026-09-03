import { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { todayBRT, currentTimeBRT } from '@/lib/timezone';
import { useAuth } from '@/hooks/useAuth';
import {
  Gift, ArrowLeft, Plus, Trash2, Loader2, TrendingUp, TrendingDown, Sun, Moon, CheckCircle, Calculator, Pencil, Sparkles,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { ComboboxInput } from '@/components/ComboboxInput';
import { useBetAndWin, BetAndWinEntry } from '@/hooks/useBetAndWin';
import { useSharedLibrary } from '@/hooks/useSharedLibrary';
import { useTheme } from '@/hooks/useTheme';
import { toast } from 'sonner';
import { SimulatorDialog } from '@/components/betandwin/SimulatorDialog';
import { EditBetAndWinDialog } from '@/components/betandwin/EditBetAndWinDialog';
import { RecommenderDialog } from '@/components/betandwin/RecommenderDialog';
import { SlotNotesCard } from '@/components/betandwin/SlotNotesCard';
import { HouseGameStatsCard } from '@/components/betandwin/HouseGameStatsCard';
import { ACCOUNTS } from '@/types/casino';

const BetAndWin = () => {
  const { user } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const { houses, games, refresh: refreshLibrary } = useSharedLibrary();
  const { entries, loading, totalBalance, unfinalizedBalance, addEntry, updateEntry, deleteEntry, finalizeDay, simulatePromotion, recommendRolloverGames } = useBetAndWin({ libraryHouses: houses, libraryGames: games });
  const [editingEntry, setEditingEntry] = useState<BetAndWinEntry | null>(null);
  const [showSimulator, setShowSimulator] = useState(false);
  const [showRecommender, setShowRecommender] = useState(false);

  const [entryDate, setEntryDate] = useState(todayBRT());
  const [entryTime, setEntryTime] = useState(currentTimeBRT());
  const [house, setHouse] = useState('');
  const [rolloverGame, setRolloverGame] = useState('');
  const [prizeGame, setPrizeGame] = useState('');
  const [betValue, setBetValue] = useState('');
  const [requiredBets, setRequiredBets] = useState('');
  const [initialBankroll, setInitialBankroll] = useState('');
  const [finalBankroll, setFinalBankroll] = useState('');
  const [spinCount, setSpinCount] = useState('');
  const [spinBet, setSpinBet] = useState('');
  const [spinPrize, setSpinPrize] = useState('');
  const [account, setAccount] = useState<string[]>(['Ruan']);
  const [submitting, setSubmitting] = useState(false);

  const liveCalcs = useMemo(() => {
    const ib = parseFloat(initialBankroll || '0');
    const fb = parseFloat(finalBankroll || '0');
    const sp = parseFloat(spinPrize || '0');
    const sc = parseInt(spinCount || '0');
    const sb = parseFloat(spinBet || '0');
    const totalSpinValue = sc * sb;
    // Historical multiplier for prize game (fuzzy match)
    const normalize = (s: string) => s.toLowerCase().replace(/\s+/g, '').normalize('NFD').replace(/[\u0300-\u036f]/g, '');
    let avgMultiplier = 0;
    let hasHistory = false;
    if (prizeGame) {
      const matches = entries.filter(e => normalize(e.prizeGame) === normalize(prizeGame) && e.spinCount > 0 && e.spinBet > 0);
      if (matches.length > 0) {
        const mults = matches.map(e => e.spinPrize / (e.spinCount * e.spinBet)).filter(m => isFinite(m) && m >= 0);
        if (mults.length > 0) { avgMultiplier = mults.reduce((a, b) => a + b, 0) / mults.length; hasHistory = true; }
      }
    }
    const expectedSpinReturn = totalSpinValue * avgMultiplier;
    const rolloverCost = ib - fb;
    const projectedProfit = (hasHistory ? expectedSpinReturn : sp) - rolloverCost;
    return {
      rolloverCost,
      finalBalance: (fb - ib) + sp,
      totalSpinValue,
      expectedSpinReturn,
      projectedProfit,
      hasHistory,
    };
  }, [initialBankroll, finalBankroll, spinPrize, spinCount, spinBet, prizeGame, entries]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!house) { toast.error('Preencha a casa'); return; }
    if (account.length === 0) { toast.error('Selecione pelo menos uma conta'); return; }
    setSubmitting(true);
    await addEntry({
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
    refreshLibrary();
    setHouse(''); setRolloverGame(''); setPrizeGame(''); setBetValue('');
    setRequiredBets(''); setInitialBankroll(''); setFinalBankroll('');
    setSpinCount(''); setSpinBet(''); setSpinPrize('');
    setAccount(['Ruan']);
    setEntryTime(currentTimeBRT());
    setSubmitting(false);
  };

  if (loading) {
    return (<div className="min-h-screen bg-background flex items-center justify-center"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>);
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Link to="/"><Button variant="ghost" size="icon"><ArrowLeft className="w-5 h-5" /></Button></Link>
              <Gift className="w-6 h-6 text-primary" />
              <h1 className="text-xl font-bold text-foreground">Aposte e Ganhe</h1>
            </div>
            <Button variant="ghost" size="icon" onClick={toggleTheme} className="text-muted-foreground">
              {theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </Button>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-6 max-w-7xl grid gap-6 lg:grid-cols-[280px_minmax(0,1fr)_280px]">
        {/* Stats aside (left on desktop, last on mobile) */}
        <aside className="order-3 lg:order-1 lg:sticky lg:top-20 lg:self-start min-w-0">
          <HouseGameStatsCard entries={entries} />
        </aside>

        <div className="order-1 lg:order-2 space-y-6 min-w-0">
        {/* Balance Card */}
        <div className="rounded-xl border border-border bg-card p-6">
          <div className="text-center">
            <p className="text-sm text-muted-foreground mb-1">Saldo Geral Aposte e Ganhe</p>
            <div className={`text-3xl font-bold flex items-center justify-center gap-2 ${totalBalance >= 0 ? 'text-primary' : 'text-destructive'}`}>
              {totalBalance >= 0 ? <TrendingUp className="w-6 h-6" /> : <TrendingDown className="w-6 h-6" />}
              {totalBalance.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
            </div>
            {unfinalizedBalance !== totalBalance && (
              <p className="text-xs text-muted-foreground mt-2">
                Pendente: {unfinalizedBalance.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
              </p>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
          <Button onClick={finalizeDay} variant="outline" className="gap-2">
            <CheckCircle className="w-4 h-4" /> Finalizar Dia
          </Button>
          <Button onClick={() => setShowSimulator(true)} variant="outline" className="gap-2">
            <Calculator className="w-4 h-4" /> Simular
          </Button>
          <Button onClick={() => setShowRecommender(true)} variant="outline" className="gap-2">
            <Sparkles className="w-4 h-4" /> Recomendar
          </Button>
        </div>

        {/* Form */}
        <div className="rounded-xl border border-border bg-card p-4 sm:p-6">
          <h2 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
            <Plus className="w-5 h-5" /> Nova Entrada
          </h2>
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Bloco 1: Contexto */}
            <div className="space-y-3">
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">1. Contexto</p>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div><Label>Data</Label><Input type="date" value={entryDate} onChange={e => setEntryDate(e.target.value)} required /></div>
                <div><Label>Hora</Label><Input type="time" value={entryTime} onChange={e => setEntryTime(e.target.value)} required /></div>
                <div>
                  <Label>Casa *</Label>
                  <ComboboxInput value={house} onChange={setHouse} suggestions={houses} placeholder="Ex: Betano" required />
                </div>
              </div>
              <div className="pt-1">
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
            </div>

            {/* Bloco 2: Configuração da Promoção */}
            <div className="space-y-3 pt-2 border-t border-border">
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">2. Configuração da Promoção</p>
              <div>
                <Label>Jogo Rollover</Label>
                <ComboboxInput value={rolloverGame} onChange={setRolloverGame} suggestions={games} placeholder="Ex: Sweet Bonanza" />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div><Label>Valor da Bet (R$)</Label><Input type="number" step="0.01" value={betValue} onChange={e => setBetValue(e.target.value)} placeholder="0.20" /></div>
                <div><Label>Apostas Necessárias (R$)</Label><Input type="number" step="0.01" value={requiredBets} onChange={e => setRequiredBets(e.target.value)} placeholder="100.00" /></div>
              </div>
            </div>

            {/* Bloco 3: Execução do Rollover */}
            <div className="space-y-3 pt-2 border-t border-border">
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">3. Execução do Rollover</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div><Label>Banca Inicial (R$)</Label><Input type="number" step="0.01" value={initialBankroll} onChange={e => setInitialBankroll(e.target.value)} placeholder="0.00" /></div>
                <div><Label>Banca Final (R$)</Label><Input type="number" step="0.01" value={finalBankroll} onChange={e => setFinalBankroll(e.target.value)} placeholder="0.00" /></div>
              </div>
              {(initialBankroll || finalBankroll) && (
                <div className={`rounded-lg border p-3 text-center ${liveCalcs.rolloverCost > 0 ? 'border-destructive/30 bg-destructive/5' : 'border-primary/30 bg-primary/5'}`}>
                  <p className="text-xs text-muted-foreground">Custo Rollover</p>
                  <p className={`text-lg font-bold ${liveCalcs.rolloverCost > 0 ? 'text-destructive' : 'text-primary'}`}>
                    {liveCalcs.rolloverCost.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                  </p>
                </div>
              )}
            </div>

            {/* Bloco 4: Prêmio Recebido */}
            <div className="space-y-3 pt-2 border-t border-border">
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">4. Prêmio Recebido</p>
              <div>
                <Label>Jogo Prêmio</Label>
                <ComboboxInput value={prizeGame} onChange={setPrizeGame} suggestions={games} placeholder="Ex: Gates of Olympus" />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div><Label>Qtd Giros</Label><Input type="number" value={spinCount} onChange={e => setSpinCount(e.target.value)} placeholder="76" /></div>
                <div><Label>Bet Rodadas (R$)</Label><Input type="number" step="0.01" value={spinBet} onChange={e => setSpinBet(e.target.value)} placeholder="1.33" /></div>
                <div><Label>Valor Ganho Giros (R$)</Label><Input type="number" step="0.01" value={spinPrize} onChange={e => setSpinPrize(e.target.value)} placeholder="0.00" /></div>
              </div>

              {(spinCount || spinBet || spinPrize) && (
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  <div className="rounded-lg border border-border bg-muted/30 p-2 text-center">
                    <p className="text-[10px] text-muted-foreground uppercase">Custo Giros</p>
                    <p className="text-sm font-bold text-foreground">{liveCalcs.totalSpinValue.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</p>
                  </div>
                  <div className="rounded-lg border border-border bg-muted/30 p-2 text-center">
                    <p className="text-[10px] text-muted-foreground uppercase">EV Giros{liveCalcs.hasHistory ? '' : ' *'}</p>
                    <p className="text-sm font-bold text-foreground">{liveCalcs.hasHistory ? liveCalcs.expectedSpinReturn.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }) : '—'}</p>
                  </div>
                  <div className={`rounded-lg border p-2 text-center ${liveCalcs.projectedProfit >= 0 ? 'border-primary/30 bg-primary/5' : 'border-destructive/30 bg-destructive/5'}`}>
                    <p className="text-[10px] text-muted-foreground uppercase">Lucro Projetado</p>
                    <p className={`text-sm font-bold ${liveCalcs.projectedProfit >= 0 ? 'text-primary' : 'text-destructive'}`}>
                      {liveCalcs.projectedProfit.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                    </p>
                  </div>
                  <div className={`rounded-lg border p-2 text-center ${liveCalcs.finalBalance >= 0 ? 'border-primary/30 bg-primary/5' : 'border-destructive/30 bg-destructive/5'}`}>
                    <p className="text-[10px] text-muted-foreground uppercase">Saldo Final</p>
                    <p className={`text-sm font-bold ${liveCalcs.finalBalance >= 0 ? 'text-primary' : 'text-destructive'}`}>
                      {liveCalcs.finalBalance.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                    </p>
                  </div>
                </div>
              )}
              {!liveCalcs.hasHistory && (spinCount || spinBet) && (
                <p className="text-[10px] text-muted-foreground">* EV requer histórico do jogo prêmio</p>
              )}
            </div>

            <Button type="submit" className="w-full" disabled={submitting}>
              {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Adicionar Entrada'}
            </Button>
          </form>
        </div>

        {/* Entries List */}
        <div className="space-y-3">
          <h2 className="text-lg font-semibold text-foreground">Histórico</h2>
          {entries.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">Nenhuma entrada registrada</p>
          ) : (
            entries.map(entry => {
              const balance = entry.finalBankroll - entry.initialBankroll + entry.spinPrize;
              return (
                <div key={entry.id} className="rounded-lg border border-border bg-card p-4">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <span className="font-semibold text-foreground">{entry.house}</span>
                        {entry.finalizedMonth && <span className="text-xs bg-muted px-2 py-0.5 rounded text-muted-foreground">Finalizado</span>}
                        <div className="flex gap-1">
                          {entry.account.map(acc => (
                            <span key={acc} className="text-[10px] px-1.5 py-0.5 rounded bg-primary/10 text-primary border border-primary/20">{acc}</span>
                          ))}
                        </div>
                      </div>
                      <p className="text-xs text-muted-foreground">{entry.entryDate} · {entry.entryTime}</p>
                      <div className="flex flex-wrap gap-x-3 gap-y-1 mt-1 text-sm">
                        {entry.rolloverGame && <span className="text-muted-foreground">Rollover: {entry.rolloverGame}</span>}
                        {entry.prizeGame && <span className="text-muted-foreground">Prêmio: {entry.prizeGame}</span>}
                        {entry.betValue > 0 && <span className="text-muted-foreground">Bet: R$ {entry.betValue.toFixed(2)}</span>}
                      </div>
                      <div className="flex flex-wrap gap-3 mt-1 text-sm">
                        <span className="text-muted-foreground">Apostas: R$ {entry.requiredBets.toFixed(2)}</span>
                        <span className="text-muted-foreground">Banca: R$ {entry.initialBankroll.toFixed(2)} → R$ {entry.finalBankroll.toFixed(2)}</span>
                      </div>
                      <div className="flex flex-wrap gap-3 mt-1 text-sm">
                        {entry.spinCount > 0 && <span className="text-muted-foreground">{entry.spinCount} giros @ R$ {entry.spinBet.toFixed(2)}</span>}
                        {entry.spinPrize > 0 && <span className="text-primary">Ganho giros: R$ {entry.spinPrize.toFixed(2)}</span>}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`font-bold ${balance >= 0 ? 'text-primary' : 'text-destructive'}`}>
                        {balance >= 0 ? '+' : ''}{balance.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                      </span>
                      <Button variant="ghost" size="icon" className="text-muted-foreground" onClick={() => setEditingEntry(entry)}>
                        <Pencil className="w-4 h-4" />
                      </Button>
                      <Button variant="ghost" size="icon" className="text-destructive" onClick={() => deleteEntry(entry.id)}>
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {editingEntry && (
          <EditBetAndWinDialog
            entry={editingEntry}
            open={!!editingEntry}
            onClose={() => setEditingEntry(null)}
            onSave={async (data) => { await updateEntry(editingEntry.id, data); setEditingEntry(null); }}
            houses={houses}
            games={games}
          />
        )}

        <SimulatorDialog
          open={showSimulator}
          onClose={() => setShowSimulator(false)}
          houses={houses}
          games={games}
          onSimulate={simulatePromotion}
        />

        <RecommenderDialog
          open={showRecommender}
          onClose={() => setShowRecommender(false)}
          houses={houses}
          onRecommend={recommendRolloverGames}
        />
        </div>

        {/* Notes aside (right on desktop, second on mobile) */}
        <aside className="order-2 lg:order-3 lg:sticky lg:top-20 lg:self-start min-w-0">
          <SlotNotesCard userId={user?.id} houses={houses} entryHouses={entries.map(e => e.house)} />
        </aside>
      </div>
    </div>
  );
};

export default BetAndWin;
