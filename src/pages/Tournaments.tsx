import { useState, useMemo, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Trophy, ArrowLeft, Plus, Trash2, Loader2, TrendingUp, TrendingDown, Sun, Moon,
  CheckCircle, ChevronLeft, Target, Activity, Pencil, Check, X, CalendarPlus,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ComboboxInput } from '@/components/ComboboxInput';
import { useTournaments, type Tournament } from '@/hooks/useTournaments';
import { useSharedLibrary } from '@/hooks/useSharedLibrary';
import { useTheme } from '@/hooks/useTheme';
import { toast } from 'sonner';
import { useTournamentSchedule, formatScheduleLabel, DAY_OF_WEEK_LABELS } from '@/hooks/useTournamentSchedule';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { TournamentKpiBar } from '@/components/tournaments/TournamentKpiBar';
import { ActiveTournamentCard, FinalizedTournamentCard, ScheduledItemCard } from '@/components/tournaments/TournamentCard';
import { TournamentRulesPanel } from '@/components/tournaments/TournamentRulesPanel';
import { NewTournamentDialog } from '@/components/tournaments/NewTournamentDialog';
import { monthKeyBRT, todayBRT } from '@/lib/timezone';

const fmtBRL = (n: number) => n.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

const Tournaments = () => {
  const { theme, toggleTheme } = useTheme();
  const { houses, games, refresh: refreshLibrary } = useSharedLibrary();
  const {
    tournaments, loading,
    createTournament, deleteTournament, updateTournament,
    addSession, updateSession, deleteSession,
    getTournamentStats, finalizeTournament,
  } = useTournaments();
  const { items: scheduleItems, addItem: addScheduleItem, deleteItem: deleteScheduleItem } = useTournamentSchedule();

  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [showNew, setShowNew] = useState(false);
  const [showScheduleForm, setShowScheduleForm] = useState(false);
  const [historyPage, setHistoryPage] = useState(0);

  // Schedule form state
  const [schName, setSchName] = useState('');
  const [schHouse, setSchHouse] = useState('');
  const [schType, setSchType] = useState<'specific' | 'recurring'>('specific');
  const [schDate, setSchDate] = useState('');
  const [schTime, setSchTime] = useState('12:00');
  const [schDow, setSchDow] = useState('3'); // quarta

  if (loading) {
    return (<div className="min-h-screen bg-background flex items-center justify-center"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>);
  }

  const selected = tournaments.find(t => t.id === selectedId) || null;

  const month = monthKeyBRT();
  const activeTournaments = tournaments.filter(t => !t.finalizedMonth);
  const finalizedTournaments = tournaments.filter(t => t.finalizedMonth === month);
  const allFinalized = tournaments
    .filter(t => !!t.finalizedMonth)
    .sort((a, b) => (b.finalizedMonth || '').localeCompare(a.finalizedMonth || ''));
  const HISTORY_PAGE_SIZE = 5;
  const historyTotalPages = Math.max(1, Math.ceil(allFinalized.length / HISTORY_PAGE_SIZE));
  const historyItems = allFinalized.slice(historyPage * HISTORY_PAGE_SIZE, (historyPage + 1) * HISTORY_PAGE_SIZE);

  const startFromSchedule = async (item: typeof scheduleItems[number]) => {
    const today = todayBRT();
    const endDate = new Date();
    endDate.setDate(endDate.getDate() + 7);
    const end = endDate.toISOString().split('T')[0];
    const id = await createTournament({
      house: item.house || 'Casa',
      name: item.name || `Torneio ${item.house}`,
      startDate: today,
      endDate: end,
      rolloverGame: '',
      pointsPerReal: 1,
      prizeSpinsCount: 0,
      prizeSpinsValue: 0,
      prizeType: 'giros',
      prizeCashValue: 0,
      initialPosition: 0,
      initialPoints: 0,
      currentPosition: 0,
      pointsPlayerAbove: 0,
      pointsPlayerBelow: 0,
      targetPoints: 0,
      prizePositionCutoff: 0,
    } as any);
    if (item.scheduleType === 'specific') {
      await deleteScheduleItem(item.id);
    }
    refreshLibrary();
    if (id) setSelectedId(id);
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 min-w-0">
              {selected ? (
                <Button variant="ghost" size="icon" onClick={() => setSelectedId(null)}><ChevronLeft className="w-5 h-5" /></Button>
              ) : (
                <Link to="/"><Button variant="ghost" size="icon"><ArrowLeft className="w-5 h-5" /></Button></Link>
              )}
              <Trophy className="w-5 h-5 text-primary shrink-0" />
              <h1 className="text-base sm:text-xl font-bold text-foreground truncate">
                {selected ? (selected.name || `Torneio ${selected.house}`) : 'Torneios'}
              </h1>
            </div>
            <Button variant="ghost" size="icon" onClick={toggleTheme} className="text-muted-foreground shrink-0">
              {theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </Button>
          </div>
        </div>
      </header>

      <div className={`container mx-auto px-3 sm:px-4 py-6 space-y-6 ${selected ? 'max-w-4xl' : 'max-w-6xl'}`}>
        {selected ? (
          <TournamentDetailTabs
            tournament={selected}
            stats={getTournamentStats(selected.id)}
            houses={houses}
            games={games}
            onUpdate={(u) => updateTournament(selected.id, u)}
            onDelete={async () => { await deleteTournament(selected.id); setSelectedId(null); }}
            onAddSession={async (s) => { const r = await addSession(selected.id, s); refreshLibrary(); return r; }}
            onUpdateSession={updateSession}
            onDeleteSession={deleteSession}
            onFinalize={(actualWinnings) => finalizeTournament(selected.id, actualWinnings)}
          />
        ) : (
          <>
            <TournamentKpiBar tournaments={tournaments} getStats={getTournamentStats} schedule={scheduleItems} />

            <div className="flex flex-wrap gap-2">
              <Button onClick={() => setShowNew(true)} className="gap-2 flex-1 sm:flex-none">
                <Plus className="w-4 h-4" /> Novo Torneio
              </Button>
              <Button onClick={() => setShowScheduleForm(s => !s)} variant="outline" className="gap-2 flex-1 sm:flex-none">
                <CalendarPlus className="w-4 h-4" /> {showScheduleForm ? 'Cancelar agenda' : 'Agendar'}
              </Button>
            </div>

            <NewTournamentDialog
              open={showNew}
              onOpenChange={setShowNew}
              houses={houses}
              onCreate={createTournament}
              onCreated={(id) => { setSelectedId(id); refreshLibrary(); }}
            />

            {showScheduleForm && (
              <div className="rounded-xl border border-border bg-card p-4 space-y-3">
                <div><Label>Nome</Label><Input value={schName} onChange={e => setSchName(e.target.value)} placeholder="Ex: Torneio Semanal Brx" /></div>
                <div><Label>Casa</Label><ComboboxInput value={schHouse} onChange={setSchHouse} suggestions={houses} placeholder="Ex: Betano" /></div>
                <div className="space-y-2">
                  <Label>Tipo</Label>
                  <div className="grid grid-cols-2 gap-2">
                    <Button type="button" variant={schType === 'specific' ? 'default' : 'outline'} onClick={() => setSchType('specific')}>Data Específica</Button>
                    <Button type="button" variant={schType === 'recurring' ? 'default' : 'outline'} onClick={() => setSchType('recurring')}>Recorrente</Button>
                  </div>
                </div>
                {schType === 'specific' ? (
                  <div className="grid grid-cols-2 gap-3">
                    <div><Label>Data</Label><Input type="date" value={schDate} onChange={e => setSchDate(e.target.value)} /></div>
                    <div><Label>Hora</Label><Input type="time" value={schTime} onChange={e => setSchTime(e.target.value)} /></div>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <Label>Dia da Semana</Label>
                      <Select value={schDow} onValueChange={setSchDow}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          {DAY_OF_WEEK_LABELS.map((d, i) => (
                            <SelectItem key={i} value={String(i)}>{d}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div><Label>Hora</Label><Input type="time" value={schTime} onChange={e => setSchTime(e.target.value)} /></div>
                  </div>
                )}
                <Button
                  className="w-full"
                  onClick={async () => {
                    if (!schHouse && !schName) { toast.error('Informe nome ou casa'); return; }
                    await addScheduleItem({
                      house: schHouse,
                      name: schName,
                      scheduleType: schType,
                      specificDate: schType === 'specific' && schDate ? `${schDate}T${schTime}:00` : null,
                      dayOfWeek: schType === 'recurring' ? parseInt(schDow) : null,
                      timeOfDay: schType === 'recurring' ? schTime : null,
                      isActive: true,
                    });
                    refreshLibrary();
                    setShowScheduleForm(false);
                    setSchName(''); setSchHouse(''); setSchDate(''); setSchTime('12:00'); setSchDow('3');
                  }}
                >
                  Salvar Agenda
                </Button>
              </div>
            )}

            {/* Kanban: desktop = 3 colunas / mobile = abas */}
            <div className="hidden lg:grid grid-cols-3 gap-4">
              <KanbanColumn title="Agendados" count={scheduleItems.length}>
                {scheduleItems.length === 0 ? (
                  <EmptyHint text="Nenhum torneio agendado." />
                ) : scheduleItems.map(it => (
                  <ScheduledItemCard key={it.id} item={it} onDelete={() => deleteScheduleItem(it.id)} onStart={() => startFromSchedule(it)} />
                ))}
              </KanbanColumn>
              <KanbanColumn title="Em andamento" count={activeTournaments.length} highlight>
                {activeTournaments.length === 0 ? (
                  <EmptyHint text="Nenhum torneio ativo." />
                ) : activeTournaments.map(t => (
                  <ActiveTournamentCard key={t.id} t={t} stats={getTournamentStats(t.id)} onClick={() => setSelectedId(t.id)} />
                ))}
              </KanbanColumn>
              <KanbanColumn title="Finalizados (mês)" count={finalizedTournaments.length}>
                {finalizedTournaments.length === 0 ? (
                  <EmptyHint text="Nenhum finalizado este mês." />
                ) : finalizedTournaments.map(t => (
                  <FinalizedTournamentCard
                    key={t.id}
                    t={t}
                    stats={getTournamentStats(t.id)}
                    onClick={() => setSelectedId(t.id)}
                    onEditWinnings={() => {
                      const current = t.actualWinnings ?? getTournamentStats(t.id)?.prizeValue ?? 0;
                      const v = window.prompt('Quanto você realmente ganhou neste torneio? (R$)', String(current));
                      if (v === null) return;
                      const n = Number(v.replace(',', '.'));
                      if (!isFinite(n) || n < 0) { toast.error('Valor inválido'); return; }
                      updateTournament(t.id, { actualWinnings: n } as any);
                    }}
                  />
                ))}
              </KanbanColumn>
            </div>

            <Tabs defaultValue="active" className="lg:hidden">
              <TabsList className="grid grid-cols-3 w-full">
                <TabsTrigger value="scheduled">Agendados ({scheduleItems.length})</TabsTrigger>
                <TabsTrigger value="active">Ativos ({activeTournaments.length})</TabsTrigger>
                <TabsTrigger value="finalized">Final. ({finalizedTournaments.length})</TabsTrigger>
              </TabsList>
              <TabsContent value="scheduled" className="space-y-2 mt-3">
                {scheduleItems.length === 0 ? <EmptyHint text="Nenhum torneio agendado." /> : scheduleItems.map(it => (
                  <ScheduledItemCard key={it.id} item={it} onDelete={() => deleteScheduleItem(it.id)} onStart={() => startFromSchedule(it)} />
                ))}
              </TabsContent>
              <TabsContent value="active" className="space-y-2 mt-3">
                {activeTournaments.length === 0 ? <EmptyHint text="Nenhum torneio ativo." /> : activeTournaments.map(t => (
                  <ActiveTournamentCard key={t.id} t={t} stats={getTournamentStats(t.id)} onClick={() => setSelectedId(t.id)} />
                ))}
              </TabsContent>
              <TabsContent value="finalized" className="space-y-2 mt-3">
                {finalizedTournaments.length === 0 ? <EmptyHint text="Nenhum finalizado este mês." /> : finalizedTournaments.map(t => (
                  <FinalizedTournamentCard
                    key={t.id}
                    t={t}
                    stats={getTournamentStats(t.id)}
                    onClick={() => setSelectedId(t.id)}
                    onEditWinnings={() => {
                      const current = t.actualWinnings ?? getTournamentStats(t.id)?.prizeValue ?? 0;
                      const v = window.prompt('Quanto você realmente ganhou neste torneio? (R$)', String(current));
                      if (v === null) return;
                      const n = Number(v.replace(',', '.'));
                      if (!isFinite(n) || n < 0) { toast.error('Valor inválido'); return; }
                      updateTournament(t.id, { actualWinnings: n } as any);
                    }}
                  />
                ))}
              </TabsContent>
            </Tabs>

            <div className="rounded-xl border border-border bg-card p-4 space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold text-foreground">Histórico Total</h3>
                <span className="text-xs text-muted-foreground">{allFinalized.length} torneios</span>
              </div>
              {allFinalized.length === 0 ? (
                <EmptyHint text="Nenhum torneio finalizado ainda." />
              ) : (
                <>
                  <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                    {historyItems.map(t => (
                      <FinalizedTournamentCard
                        key={t.id}
                        t={t}
                        stats={getTournamentStats(t.id)}
                        onClick={() => setSelectedId(t.id)}
                        onEditWinnings={() => {
                          const current = t.actualWinnings ?? getTournamentStats(t.id)?.prizeValue ?? 0;
                          const v = window.prompt('Quanto você realmente ganhou neste torneio? (R$)', String(current));
                          if (v === null) return;
                          const n = Number(v.replace(',', '.'));
                          if (!isFinite(n) || n < 0) { toast.error('Valor inválido'); return; }
                          updateTournament(t.id, { actualWinnings: n } as any);
                        }}
                      />
                    ))}
                  </div>
                  {historyTotalPages > 1 && (
                    <div className="flex items-center justify-between pt-2">
                      <Button variant="ghost" size="sm" onClick={() => setHistoryPage(p => Math.max(0, p - 1))} disabled={historyPage === 0}>
                        <ChevronLeft className="w-4 h-4" />
                      </Button>
                      <span className="text-xs text-muted-foreground">
                        Página {historyPage + 1} de {historyTotalPages}
                      </span>
                      <Button variant="ghost" size="sm" onClick={() => setHistoryPage(p => Math.min(historyTotalPages - 1, p + 1))} disabled={historyPage >= historyTotalPages - 1}>
                        <ChevronLeft className="w-4 h-4 rotate-180" />
                      </Button>
                    </div>
                  )}
                </>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
};

function KanbanColumn({ title, count, children, highlight }: { title: string; count: number; children: React.ReactNode; highlight?: boolean }) {
  return (
    <div className={`rounded-xl border ${highlight ? 'border-primary/30 bg-primary/5' : 'border-border bg-muted/20'} p-3 space-y-2`}>
      <div className="flex items-center justify-between px-1">
        <h3 className="text-sm font-semibold text-foreground">{title}</h3>
        <span className="text-xs text-muted-foreground">{count}</span>
      </div>
      <div className="space-y-2 max-h-[60vh] overflow-y-auto pr-1">
        {children}
      </div>
    </div>
  );
}

function EmptyHint({ text }: { text: string }) {
  return <p className="text-center text-muted-foreground py-6 text-xs">{text}</p>;
}

// Wraps the existing TournamentDetail with tabs (Visão geral / Sessões / Projeções)
function TournamentDetailTabs(props: DetailProps) {
  return (
    <Tabs defaultValue="overview" className="space-y-4">
      <TabsList className="grid grid-cols-3 w-full max-w-md">
        <TabsTrigger value="overview">Visão geral</TabsTrigger>
        <TabsTrigger value="sessions">Sessões</TabsTrigger>
        <TabsTrigger value="projections">Projeções</TabsTrigger>
      </TabsList>
      <TabsContent value="overview" className="space-y-4">
        <TournamentRulesPanel t={props.tournament} stats={props.stats} />
        <TournamentDetail {...props} sectionFilter="header" />
      </TabsContent>
      <TabsContent value="sessions" className="space-y-4">
        <TournamentDetail {...props} sectionFilter="sessions" />
      </TabsContent>
      <TabsContent value="projections" className="space-y-4">
        <TournamentDetail {...props} sectionFilter="projections" />
      </TabsContent>
    </Tabs>
  );
}

// ============= Tournament Detail =============
interface DetailProps {
  tournament: Tournament;
  stats: ReturnType<ReturnType<typeof useTournaments>['getTournamentStats']>;
  houses: string[];
  games: string[];
  onUpdate: (u: Partial<Tournament>) => void;
  onDelete: () => void;
  onAddSession: (s: { sessionDate?: string; spinsCount: number; betValue: number; initialBankroll: number; finalBankroll: number; rolloverGame?: string }) => void;
  onUpdateSession: (id: string, u: any) => void;
  onDeleteSession: (id: string) => void;
  onFinalize: (actualWinnings?: number) => void;
  sectionFilter?: 'all' | 'header' | 'sessions' | 'projections';
}

function TournamentDetail({
  tournament: t, stats, houses, games,
  onUpdate, onDelete, onAddSession, onUpdateSession, onDeleteSession, onFinalize,
  sectionFilter = 'all',
}: DetailProps) {
  // Header state
  const [pos, setPos] = useState(String(t.currentPosition));
  const [pAbove, setPAbove] = useState(String(t.pointsPlayerAbove));
  const [pBelow, setPBelow] = useState(String(t.pointsPlayerBelow));
  const [spins, setSpins] = useState(String(t.prizeSpinsCount));
  const [spinsValue, setSpinsValue] = useState(String(t.prizeSpinsValue));
  const [cash, setCash] = useState(String(t.prizeCashValue));
  const [invested, setInvested] = useState(t.manualInvested !== null ? String(t.manualInvested) : '');
  const [cutoff, setCutoff] = useState(String(t.prizePositionCutoff || 0));
  const [ppr, setPpr] = useState(String(t.pointsPerReal));

  useEffect(() => {
    setPos(String(t.currentPosition));
    setPAbove(String(t.pointsPlayerAbove));
    setPBelow(String(t.pointsPlayerBelow));
    setSpins(String(t.prizeSpinsCount));
    setSpinsValue(String(t.prizeSpinsValue));
    setCash(String(t.prizeCashValue));
    setInvested(t.manualInvested !== null ? String(t.manualInvested) : '');
    setCutoff(String(t.prizePositionCutoff || 0));
    setPpr(String(t.pointsPerReal));
  }, [t.id]);

  const savePosition = (val: string) => {
    setPos(val);
    onUpdate({ currentPosition: parseInt(val) || 0 });
  };
  const savePAbove = (val: string) => {
    setPAbove(val);
    onUpdate({ pointsPlayerAbove: parseFloat(val) || 0 });
  };
  const savePBelow = (val: string) => {
    setPBelow(val);
    onUpdate({ pointsPlayerBelow: parseFloat(val) || 0 });
  };
  const savePrize = () => {
    onUpdate({
      prizeSpinsCount: parseInt(spins) || 0,
      prizeSpinsValue: parseFloat(spinsValue) || 0,
      prizeCashValue: parseFloat(cash) || 0,
    });
    toast.success('Prêmio atualizado');
  };
  const togglePrizeType = () => {
    onUpdate({ prizeType: t.prizeType === 'giros' ? 'saldo_real' : 'giros' });
  };
  const saveInvested = () => {
    const trimmed = invested.trim();
    onUpdate({ manualInvested: trimmed === '' ? null : (parseFloat(trimmed) || 0) });
  };
  const saveCutoff = () => {
    onUpdate({ prizePositionCutoff: parseInt(cutoff) || 0 });
  };
  const savePpr = () => {
    onUpdate({ pointsPerReal: parseFloat(ppr) || 0 });
  };

  // Finalize state
  const [showFinalize, setShowFinalize] = useState(false);
  const [finalWinnings, setFinalWinnings] = useState('');

  // New session form
  const [sDate, setSDate] = useState(new Date().toISOString().split('T')[0]);
  const [sSpins, setSSpins] = useState('');
  const [sBet, setSBet] = useState('');
  const [sInit, setSInit] = useState('');
  const [sFinal, setSFinal] = useState('');
  const [sGame, setSGame] = useState(t.rolloverGame || '');

  useEffect(() => {
    setSGame(t.rolloverGame || '');
  }, [t.id, t.rolloverGame]);

  const liveSession = useMemo(() => {
    const sp = parseFloat(sSpins) || 0;
    const bv = parseFloat(sBet) || 0;
    const ib = parseFloat(sInit) || 0;
    const fb = parseFloat(sFinal) || 0;
    const wagered = sp * bv;
    const points = wagered * (t.pointsPerReal || 0);
    const loss = ib - fb;
    return { wagered, points, loss };
  }, [sSpins, sBet, sInit, sFinal, t.pointsPerReal]);

  const handleAddSession = () => {
    const sp = parseFloat(sSpins) || 0;
    const bv = parseFloat(sBet) || 0;
    if (sp <= 0 || bv <= 0) { toast.error('Informe quantidade girada e bet'); return; }
    onAddSession({
      sessionDate: sDate,
      spinsCount: sp,
      betValue: bv,
      initialBankroll: parseFloat(sInit) || 0,
      finalBankroll: parseFloat(sFinal) || 0,
      rolloverGame: sGame,
    });
    setSSpins(''); setSBet(''); setSInit(''); setSFinal('');
  };

  if (!stats) return null;

  const showHeader = sectionFilter === 'all' || sectionFilter === 'header';
  const showSessions = sectionFilter === 'all' || sectionFilter === 'sessions';
  const showProjections = sectionFilter === 'all' || sectionFilter === 'projections';

  return (
    <div className="space-y-6">
      {showHeader && (
      <div className="rounded-xl border border-border bg-card p-4 sm:p-6 space-y-4">
        {/* L1: Investimento, Pontos/R$, Pontuação atual */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="rounded-lg bg-muted/40 p-3">
            <Label className="text-xs text-muted-foreground">Valor investido</Label>
            <Input
              type="number"
              step="0.01"
              value={invested}
              onChange={e => setInvested(e.target.value)}
              onBlur={saveInvested}
              placeholder={fmtBRL(stats.computedLoss)}
              className="mt-1 h-9 text-lg font-bold"
            />
            <p className="text-xs text-muted-foreground mt-1">
              {t.manualInvested !== null ? `Calculado: ${fmtBRL(stats.computedLoss)}` : 'Auto (sessões). Edite p/ sobrescrever.'}
            </p>
          </div>
          <div className="rounded-lg bg-muted/40 p-3">
            <Label className="text-xs text-muted-foreground">Pontos / R$1</Label>
            <Input
              type="number"
              step="0.01"
              value={ppr}
              onChange={e => setPpr(e.target.value)}
              onBlur={savePpr}
              className="mt-1 h-9 text-lg font-bold"
            />
          </div>
          <StatBox label="Pontuação atual" value={stats.totalPoints.toFixed(0)} accent="primary" hint={t.initialPoints > 0 ? `Inicial: ${t.initialPoints.toFixed(0)}` : undefined} />
        </div>

        {/* L2: Prêmio dinâmico (editável) */}
        <div className="rounded-lg bg-muted/40 p-3 space-y-2">
          <div className="flex items-center justify-between gap-2">
            <Label className="text-xs text-muted-foreground">Prêmio</Label>
            <Button type="button" size="sm" variant="outline" onClick={togglePrizeType}>
              {t.prizeType === 'giros' ? 'Giros' : 'Saldo Real'} ⇄
            </Button>
          </div>
          {t.prizeType === 'giros' ? (
            <div className="grid grid-cols-2 gap-2">
              <div>
                <Label className="text-xs">Qtd Giros</Label>
                <Input type="number" value={spins} onChange={e => setSpins(e.target.value)} onBlur={savePrize} />
              </div>
              <div>
                <Label className="text-xs">Bet (R$)</Label>
                <Input type="number" step="0.01" value={spinsValue} onChange={e => setSpinsValue(e.target.value)} onBlur={savePrize} />
              </div>
            </div>
          ) : (
            <div>
              <Label className="text-xs">Valor (R$)</Label>
              <Input type="number" step="0.01" value={cash} onChange={e => setCash(e.target.value)} onBlur={savePrize} />
            </div>
          )}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
            <div>
              <Label className="text-xs">Premia até a colocação</Label>
              <Input
                type="number"
                value={cutoff}
                onChange={e => setCutoff(e.target.value)}
                onBlur={saveCutoff}
                placeholder="0 = ilimitado"
              />
            </div>
            <div className="flex items-end">
              <p className="text-xs text-muted-foreground">
                Estimado: <span className={`font-semibold ${stats.inPrizeRange ? 'text-foreground' : 'text-destructive'}`}>{fmtBRL(stats.prizeValue)}</span>
                {!stats.inPrizeRange && <span className="block text-destructive">Fora da faixa premiada (limite: {t.prizePositionCutoff}º)</span>}
              </p>
            </div>
          </div>
        </div>

        {/* L3: Leaderboard editável */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div><Label className="text-xs">Colocação atual</Label><Input type="number" value={pos} onChange={e => setPos(e.target.value)} onBlur={() => savePosition(pos)} /></div>
          <div><Label className="text-xs">Pnts player acima</Label><Input type="number" step="0.01" value={pAbove} onChange={e => setPAbove(e.target.value)} onBlur={() => savePAbove(pAbove)} /></div>
          <div><Label className="text-xs">Pnts player abaixo</Label><Input type="number" step="0.01" value={pBelow} onChange={e => setPBelow(e.target.value)} onBlur={() => savePBelow(pBelow)} /></div>
        </div>

        <div className="flex gap-2 flex-wrap pt-2 border-t border-border">
          {!t.finalizedMonth && (
            <Button onClick={() => setShowFinalize(s => !s)} variant="outline" className="gap-2 flex-1"><CheckCircle className="w-4 h-4" /> Finalizar</Button>
          )}
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="ghost" size="icon" className="text-destructive"><Trash2 className="w-4 h-4" /></Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Excluir torneio?</AlertDialogTitle>
                <AlertDialogDescription>
                  Isso exclui permanentemente "{t.name || 'Torneio'}" e todas as suas sessões. Essa ação não pode ser desfeita.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancelar</AlertDialogCancel>
                <AlertDialogAction onClick={onDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                  Excluir
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>

        {showFinalize && !t.finalizedMonth && (
          <div className="rounded-lg border border-primary/30 bg-muted/40 p-4 space-y-3">
            <p className="text-sm font-semibold text-foreground">Finalizar Torneio</p>
            <div>
              <Label className="text-xs">Ganhos reais (R$)</Label>
              <Input
                type="number"
                step="0.01"
                value={finalWinnings}
                onChange={e => setFinalWinnings(e.target.value)}
                placeholder={`Estimado: ${fmtBRL(stats.prizeValue)}`}
              />
              <p className="text-xs text-muted-foreground mt-1">Deixe vazio para usar o valor estimado do prêmio.</p>
            </div>
            <div className="grid grid-cols-2 gap-2 text-sm bg-muted/60 rounded-lg p-3">
              <div>Investido: <span className="font-semibold text-destructive">{fmtBRL(stats.totalLoss)}</span></div>
              <div>Ganhos: <span className="font-semibold text-primary">{fmtBRL(finalWinnings.trim() ? parseFloat(finalWinnings) || 0 : stats.prizeValue)}</span></div>
              <div className="col-span-2">
                Resultado final: <span className={`font-bold ${((finalWinnings.trim() ? parseFloat(finalWinnings) || 0 : stats.prizeValue) - stats.totalLoss) >= 0 ? 'text-primary' : 'text-destructive'}`}>
                  {fmtBRL((finalWinnings.trim() ? parseFloat(finalWinnings) || 0 : stats.prizeValue) - stats.totalLoss)}
                </span>
              </div>
            </div>
            <Button
              className="w-full gap-2"
              onClick={() => {
                const winnings = finalWinnings.trim() ? parseFloat(finalWinnings) || 0 : undefined;
                onFinalize(winnings);
              }}
            >
              <CheckCircle className="w-4 h-4" /> Confirmar Finalização
            </Button>
          </div>
        )}
      </div>
      )}

      {showSessions && (
      <div className="rounded-xl border border-border bg-card p-4 sm:p-6 space-y-4">
        <h2 className="text-lg font-semibold text-foreground flex items-center gap-2">
          <Activity className="w-5 h-5" /> Sessões ({stats.sessionsCount})
        </h2>

        {/* Tabela existentes (responsiva) */}
        {stats.sessions.length > 0 && (
          <div className="overflow-x-auto -mx-4 sm:mx-0">
            <table className="w-full text-sm min-w-[600px]">
              <thead className="text-xs text-muted-foreground">
                <tr className="border-b border-border">
                  <th className="text-left py-2 px-2">Data</th>
                  <th className="text-left py-2 px-2">Jogo</th>
                  <th className="text-right py-2 px-2">Qtd</th>
                  <th className="text-right py-2 px-2">Bet</th>
                  <th className="text-right py-2 px-2">Rodado</th>
                  <th className="text-right py-2 px-2">Pontos</th>
                  <th className="text-right py-2 px-2">Banca Ini</th>
                  <th className="text-right py-2 px-2">Banca Fim</th>
                  <th className="text-right py-2 px-2">Perda</th>
                  <th className="py-2 px-2"></th>
                </tr>
              </thead>
              <tbody>
                {stats.sessions.map(s => (
                  <SessionRow
                    key={s.id}
                    session={s}
                    pointsPerReal={t.pointsPerReal}
                    games={games}
                    onUpdate={(u) => onUpdateSession(s.id, u)}
                    onDelete={() => onDeleteSession(s.id)}
                  />
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Nova sessão */}
        <div className="border-t border-border pt-4 space-y-3">
          <p className="text-sm font-medium text-muted-foreground">Adicionar Sessão</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            <div><Label className="text-xs">Data</Label><Input type="date" value={sDate} onChange={e => setSDate(e.target.value)} /></div>
            <div className="lg:col-span-2"><Label className="text-xs">Jogo Rollover</Label><ComboboxInput value={sGame} onChange={setSGame} suggestions={games} placeholder="Ex: Sweet Bonanza" /></div>
          </div>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            <div><Label className="text-xs">Qtd Girada</Label><Input type="number" value={sSpins} onChange={e => setSSpins(e.target.value)} placeholder="0" /></div>
            <div><Label className="text-xs">Bet</Label><Input type="number" step="0.01" value={sBet} onChange={e => setSBet(e.target.value)} placeholder="0,00" /></div>
            <div><Label className="text-xs">Banca Inicial</Label><Input type="number" step="0.01" value={sInit} onChange={e => setSInit(e.target.value)} placeholder="0,00" /></div>
            <div><Label className="text-xs">Banca Final</Label><Input type="number" step="0.01" value={sFinal} onChange={e => setSFinal(e.target.value)} placeholder="0,00" /></div>
          </div>
          {(liveSession.wagered > 0 || liveSession.points > 0) && (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs bg-muted/50 rounded-lg p-3">
              <div>Rodado: <span className="font-semibold text-foreground">{fmtBRL(liveSession.wagered)}</span></div>
              <div>Pontos: <span className="font-semibold text-primary">{liveSession.points.toFixed(0)}</span></div>
              <div>Perda: <span className={`font-semibold ${liveSession.loss > 0 ? 'text-destructive' : 'text-primary'}`}>{fmtBRL(liveSession.loss)}</span></div>
            </div>
          )}
          <Button onClick={handleAddSession} className="w-full gap-2"><Plus className="w-4 h-4" /> Adicionar Sessão</Button>
        </div>
      </div>
      )}

      {showProjections && (
      <div className="rounded-xl border border-primary/30 bg-card p-4 sm:p-6 space-y-4">
        <h2 className="text-lg font-semibold text-foreground flex items-center gap-2">
          <Target className="w-5 h-5 text-primary" /> Análise & Previsão
        </h2>

        <div className="space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <StatBox label="Banca atual" value={fmtBRL(stats.currentBankroll)} />
            <StatBox label="Total rodado" value={fmtBRL(stats.totalWagered)} />
          </div>
          <p className="text-sm font-medium text-muted-foreground pt-2">Projeções (com base no ritmo atual)</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <StatBox
              label="Pontos potenciais c/ banca restante"
              value={`+${stats.potentialAdditionalPoints.toFixed(0)}`}
              hint={`Total projetado: ${stats.projectedTotalPoints.toFixed(0)}`}
              accent="primary"
            />
            <StatBox
              label="Saldo previsto ao final"
              value={fmtBRL(stats.projectedNetResult)}
              hint={`${fmtBRL(stats.prizeValue)} prêmio − ${fmtBRL(stats.totalLoss)} perdas`}
              accent={stats.projectedNetResult >= 0 ? 'primary' : 'destructive'}
            />
            <StatBox
              label="Gasto p/ alcançar player acima"
              value={stats.pointsNeededToOvertake > 0 ? fmtBRL(stats.costToOvertake) : '✓ Já passou'}
              hint={stats.pointsNeededToOvertake > 0 ? `Faltam ${stats.pointsNeededToOvertake.toFixed(0)} pts` : ''}
              accent={stats.pointsNeededToOvertake > 0 ? undefined : 'primary'}
            />
            <StatBox
              label="Colocação prevista"
              value={`${stats.projectedPosition}º`}
              hint={
                stats.projectedPosition < t.currentPosition ? '↑ Sobe' :
                stats.projectedPosition > t.currentPosition ? '↓ Desce' : 'Mantém'
              }
              accent={stats.projectedPosition < t.currentPosition ? 'primary' : stats.projectedPosition > t.currentPosition ? 'destructive' : undefined}
            />
          </div>
          {stats.costPerReal > 0 && (
            <p className="text-xs text-muted-foreground">
              Custo médio por R$1 rodado nesta casa/jogo: <span className="font-semibold text-foreground">{(stats.costPerReal * 100).toFixed(2)}%</span>
            </p>
          )}
        </div>
      </div>
      )}
    </div>
  );
}

function StatBox({ label, value, hint, accent }: { label: string; value: string; hint?: string; accent?: 'primary' | 'destructive' }) {
  const color = accent === 'primary' ? 'text-primary' : accent === 'destructive' ? 'text-destructive' : 'text-foreground';
  return (
    <div className="rounded-lg bg-muted/40 p-3">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className={`text-lg font-bold ${color} mt-1`}>{value}</p>
      {hint && <p className="text-xs text-muted-foreground mt-1">{hint}</p>}
    </div>
  );
}

interface SessionRowProps {
  session: { id: string; sessionDate: string; spinsCount: number; betValue: number; initialBankroll: number; finalBankroll: number; rolloverGame: string };
  pointsPerReal: number;
  games: string[];
  onUpdate: (u: any) => void;
  onDelete: () => void;
}

function SessionRow({ session: s, pointsPerReal, games, onUpdate, onDelete }: SessionRowProps) {
  const [editing, setEditing] = useState(false);
  const [date, setDate] = useState(s.sessionDate);
  const [game, setGame] = useState(s.rolloverGame || '');
  const [spins, setSpins] = useState(String(s.spinsCount));
  const [bet, setBet] = useState(String(s.betValue));
  const [init, setInit] = useState(String(s.initialBankroll));
  const [final, setFinal] = useState(String(s.finalBankroll));

  useEffect(() => {
    setDate(s.sessionDate);
    setGame(s.rolloverGame || '');
    setSpins(String(s.spinsCount));
    setBet(String(s.betValue));
    setInit(String(s.initialBankroll));
    setFinal(String(s.finalBankroll));
  }, [s.id, s.sessionDate, s.spinsCount, s.betValue, s.initialBankroll, s.finalBankroll, s.rolloverGame]);

  const save = () => {
    onUpdate({
      sessionDate: date,
      rolloverGame: game,
      spinsCount: parseFloat(spins) || 0,
      betValue: parseFloat(bet) || 0,
      initialBankroll: parseFloat(init) || 0,
      finalBankroll: parseFloat(final) || 0,
    });
    setEditing(false);
    toast.success('Sessão atualizada');
  };

  const cancel = () => {
    setDate(s.sessionDate);
    setGame(s.rolloverGame || '');
    setSpins(String(s.spinsCount));
    setBet(String(s.betValue));
    setInit(String(s.initialBankroll));
    setFinal(String(s.finalBankroll));
    setEditing(false);
  };

  if (editing) {
    const wagered = (parseFloat(spins) || 0) * (parseFloat(bet) || 0);
    const points = wagered * pointsPerReal;
    const loss = (parseFloat(init) || 0) - (parseFloat(final) || 0);
    return (
      <tr className="border-b border-border/50 bg-muted/20">
        <td className="py-1 px-1"><Input type="date" value={date} onChange={e => setDate(e.target.value)} className="h-8 text-xs" /></td>
        <td className="py-1 px-1 min-w-[140px]"><ComboboxInput value={game} onChange={setGame} suggestions={games} placeholder="Jogo" /></td>
        <td className="py-1 px-1"><Input type="number" value={spins} onChange={e => setSpins(e.target.value)} className="h-8 text-xs text-right w-20" /></td>
        <td className="py-1 px-1"><Input type="number" step="0.01" value={bet} onChange={e => setBet(e.target.value)} className="h-8 text-xs text-right w-20" /></td>
        <td className="text-right py-2 px-2 text-muted-foreground">{fmtBRL(wagered)}</td>
        <td className="text-right py-2 px-2 text-primary">{points.toFixed(0)}</td>
        <td className="py-1 px-1"><Input type="number" step="0.01" value={init} onChange={e => setInit(e.target.value)} className="h-8 text-xs text-right w-24" /></td>
        <td className="py-1 px-1"><Input type="number" step="0.01" value={final} onChange={e => setFinal(e.target.value)} className="h-8 text-xs text-right w-24" /></td>
        <td className={`text-right py-2 px-2 ${loss > 0 ? 'text-destructive' : 'text-primary'}`}>{fmtBRL(loss)}</td>
        <td className="py-1 px-1">
          <div className="flex gap-1">
            <Button variant="ghost" size="icon" className="text-primary h-7 w-7" onClick={save}><Check className="w-3 h-3" /></Button>
            <Button variant="ghost" size="icon" className="text-muted-foreground h-7 w-7" onClick={cancel}><X className="w-3 h-3" /></Button>
          </div>
        </td>
      </tr>
    );
  }

  const wagered = s.spinsCount * s.betValue;
  const points = wagered * pointsPerReal;
  const loss = s.initialBankroll - s.finalBankroll;
  return (
    <tr className="border-b border-border/50">
      <td className="py-2 px-2 text-muted-foreground">{s.sessionDate}</td>
      <td className="py-2 px-2 text-muted-foreground">{s.rolloverGame || '—'}</td>
      <td className="text-right py-2 px-2">{s.spinsCount}</td>
      <td className="text-right py-2 px-2">{fmtBRL(s.betValue)}</td>
      <td className="text-right py-2 px-2">{fmtBRL(wagered)}</td>
      <td className="text-right py-2 px-2 text-primary">{points.toFixed(0)}</td>
      <td className="text-right py-2 px-2">{fmtBRL(s.initialBankroll)}</td>
      <td className="text-right py-2 px-2">{fmtBRL(s.finalBankroll)}</td>
      <td className={`text-right py-2 px-2 ${loss > 0 ? 'text-destructive' : 'text-primary'}`}>{fmtBRL(loss)}</td>
      <td className="py-2 px-2">
        <div className="flex gap-1">
          <Button variant="ghost" size="icon" className="text-foreground h-7 w-7" onClick={() => setEditing(true)}>
            <Pencil className="w-3 h-3" />
          </Button>
          <Button variant="ghost" size="icon" className="text-destructive h-7 w-7" onClick={onDelete}>
            <Trash2 className="w-3 h-3" />
          </Button>
        </div>
      </td>
    </tr>
  );
}

export default Tournaments;
