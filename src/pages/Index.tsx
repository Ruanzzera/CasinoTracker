import { useState } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { 
  TrendingUp, Calendar, CalendarDays, CalendarRange,
  Trophy, Building2, Gamepad2, Clock, Zap, BarChart3,
  LogOut, Sun, Moon, Download, Share2, PiggyBank, Gift, MoreVertical, Rocket, Library, ListChecks, Wallet, Eye, EyeOff,
} from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { NotificationBadge } from '@/components/NotificationBadge';
import { Button } from '@/components/ui/button';
import { useCasinoData } from '@/hooks/useCasinoData';
import { useGoals } from '@/hooks/useGoals';
import { useTheme } from '@/hooks/useTheme';
import { usePrivacy, PRIVACY_MASK } from '@/hooks/usePrivacy';

import { useTipJar } from '@/hooks/useTipJar';
import { useSharedLibrary } from '@/hooks/useSharedLibrary';
import { StatCard } from '@/components/StatCard';
import { EntryForm } from '@/components/EntryForm';
import { EntriesList } from '@/components/EntriesList';
import { Charts } from '@/components/Charts';
import { TimeRecommendations } from '@/components/TimeRecommendations';
import { GoalProgress } from '@/components/GoalProgress';
import { AdvancedCharts } from '@/components/AdvancedCharts';
import { entryTypeLabels } from '@/types/casino';
import { useCustomEntryTypes } from '@/hooks/useCustomEntryTypes';
import { exportToCSV, generateShareText } from '@/lib/exportData';
import { toast } from 'sonner';
import { NewsTicker } from '@/components/NewsTicker';
import { LibraryManagerDialog } from '@/components/LibraryManagerDialog';

const Index = () => {
  const { user } = useAuth();
  const { houses, games, refresh: refreshLibrary, noteNames } = useSharedLibrary();
  const { entries, addEntry, updateEntry, deleteEntry, statistics: stats, chartData } = useCasinoData({ libraryHouses: houses, libraryGames: games });
  const [showLibrary, setShowLibrary] = useState(false);
  const { setGoal, getGoal } = useGoals();
  const { theme, toggleTheme } = useTheme();
  const { hidden: privacyHidden, toggle: togglePrivacy } = usePrivacy();

  const { allTypes } = useCustomEntryTypes();
  const { balance: tipJarBalance, addIncome: addTipJarIncome } = useTipJar();
  
  const dailyGoal = getGoal('daily');
  const monthlyGoal = getGoal('monthly');
  const dailyGoalReached = !!(dailyGoal && stats.dailyTotal >= dailyGoal.targetAmount);

  const handleAddEntry = async (entry: Parameters<typeof addEntry>[0]) => {
    await addEntry(entry, {
      dailyGoalReached,
      onTipJar: (remainder, sourceId) => {
        addTipJarIncome(remainder, `Resto de entrada (${entry.house})`, sourceId);
        toast.info(`R$ ${remainder.toFixed(2).replace('.', ',')} enviado ao Tip Jar 🐷`, { duration: 3000 });
      },
    });
    // CÓDIGO ANTIGO (mantido): relia a biblioteca inteira do banco a cada entrada.
    // refreshLibrary();
    noteNames(entry.house, entry.game);
  };

  const handleLogout = async () => { await supabase.auth.signOut(); };

  const handleExport = () => {
    if (entries.length === 0) { toast.error('Nenhuma entrada para exportar'); return; }
    exportToCSV(entries);
    toast.success('Dados exportados com sucesso!');
  };

  const handleShare = async () => {
    const text = generateShareText(stats);
    if (navigator.share) {
      try { await navigator.share({ text }); } catch { await navigator.clipboard.writeText(text); toast.success('Estatísticas copiadas!'); }
    } else { await navigator.clipboard.writeText(text); toast.success('Estatísticas copiadas para a área de transferência!'); }
  };

  if (!user) return null;

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary/20"><Zap className="w-6 h-6 text-primary" /></div>
              <div><h1 className="text-xl font-bold text-foreground">Casino Tracker</h1><p className="text-sm text-muted-foreground">Acompanhe seus lucros</p></div>
            </div>
            <div className="flex items-center gap-2">
              {/* Desktop full set */}
              <div className="hidden md:flex items-center gap-2">
                <Button variant="ghost" size="icon" onClick={togglePrivacy} className="text-muted-foreground hover:text-foreground" title={privacyHidden ? 'Mostrar valores' : 'Ocultar valores'}>{privacyHidden ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}</Button>
                <Button variant="ghost" size="icon" onClick={toggleTheme} className="text-muted-foreground hover:text-foreground">{theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}</Button>

                <Button variant="ghost" size="icon" onClick={handleExport} className="text-muted-foreground hover:text-foreground"><Download className="w-4 h-4" /></Button>
                <Button variant="ghost" size="icon" onClick={handleShare} className="text-muted-foreground hover:text-foreground"><Share2 className="w-4 h-4" /></Button>
                <Button variant="ghost" size="icon" onClick={() => setShowLibrary(true)} className="text-muted-foreground hover:text-foreground" title="Gerenciar casas e jogos"><Library className="w-4 h-4" /></Button>
                <NotificationBadge />
                <Link to="/tip-jar"><Button variant="outline" size="sm" className="gap-2"><PiggyBank className="w-4 h-4" /><span className="hidden lg:inline">Tip Jar</span><span className={`text-xs font-bold ${tipJarBalance >= 0 ? 'text-primary' : 'text-destructive'}`}>{privacyHidden ? PRIVACY_MASK : tipJarBalance.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</span></Button></Link>
                <Link to="/tournaments"><Button variant="outline" size="sm" className="gap-2"><Trophy className="w-4 h-4" /><span className="hidden lg:inline">Torneios</span></Button></Link>
                <Link to="/tarefas"><Button variant="outline" size="sm" className="gap-2"><ListChecks className="w-4 h-4" /><span className="hidden lg:inline">Tarefas</span></Button></Link>
                <Link to="/saldos"><Button variant="outline" size="sm" className="gap-2"><Wallet className="w-4 h-4" /><span className="hidden lg:inline">Saldos</span></Button></Link>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" size="sm" className="gap-2">
                      <MoreVertical className="w-4 h-4" />
                      <span className="hidden lg:inline">Mais</span>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-52 bg-popover">
                    <DropdownMenuItem asChild>
                      <Link to="/analytics"><BarChart3 className="w-4 h-4 mr-2" /> Analytics</Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link to="/alavancagem"><Rocket className="w-4 h-4 mr-2" /> Alavancagem</Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link to="/bet-and-win"><Gift className="w-4 h-4 mr-2" /> Aposte e Ganhe</Link>
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
                <div className="profit-badge animate-pulse-slow"><TrendingUp className="w-4 h-4" /><span>{stats.entriesCount} entradas</span></div>
                <Button variant="ghost" size="icon" onClick={handleLogout} className="text-muted-foreground hover:text-foreground"><LogOut className="w-4 h-4" /></Button>
              </div>

              {/* Mobile compact set */}
              <div className="flex md:hidden items-center gap-1">
                <Link to="/tip-jar"><Button variant="outline" size="icon" className="h-9 w-9"><PiggyBank className="w-4 h-4" /></Button></Link>
                <Link to="/tournaments"><Button variant="outline" size="icon" className="h-9 w-9"><Trophy className="w-4 h-4" /></Button></Link>
                <Link to="/bet-and-win"><Button variant="outline" size="icon" className="h-9 w-9"><Gift className="w-4 h-4" /></Button></Link>
                <Link to="/alavancagem"><Button variant="outline" size="icon" className="h-9 w-9"><Rocket className="w-4 h-4" /></Button></Link>
                <Link to="/tarefas"><Button variant="outline" size="icon" className="h-9 w-9"><ListChecks className="w-4 h-4" /></Button></Link>
                <Link to="/saldos"><Button variant="outline" size="icon" className="h-9 w-9"><Wallet className="w-4 h-4" /></Button></Link>
                <Button variant="ghost" size="icon" className="h-9 w-9" onClick={togglePrivacy} title={privacyHidden ? 'Mostrar valores' : 'Ocultar valores'}>{privacyHidden ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}</Button>

                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-9 w-9"><MoreVertical className="w-4 h-4" /></Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-52 bg-popover">
                    <DropdownMenuItem onClick={toggleTheme}>
                      {theme === 'dark' ? <Sun className="w-4 h-4 mr-2" /> : <Moon className="w-4 h-4 mr-2" />}
                      {theme === 'dark' ? 'Modo Claro' : 'Modo Escuro'}
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link to="/analytics"><BarChart3 className="w-4 h-4 mr-2" /> Analytics</Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link to="/notifications"><Calendar className="w-4 h-4 mr-2" /> Notificações</Link>
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={handleExport}><Download className="w-4 h-4 mr-2" /> Exportar CSV</DropdownMenuItem>
                    <DropdownMenuItem onClick={handleShare}><Share2 className="w-4 h-4 mr-2" /> Compartilhar</DropdownMenuItem>
                    <DropdownMenuItem onClick={() => setShowLibrary(true)}><Library className="w-4 h-4 mr-2" /> Gerenciar Biblioteca</DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={handleLogout} className="text-destructive focus:text-destructive">
                      <LogOut className="w-4 h-4 mr-2" /> Sair
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>
          </div>
        </div>
      </header>

      <NewsTicker />

      <main className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
          <GoalProgress type="daily" label="Meta Diária" currentAmount={stats.dailyTotal} targetAmount={dailyGoal?.targetAmount} onSetGoal={(amount) => setGoal('daily', amount)} />
          <GoalProgress type="monthly" label="Meta Mensal" currentAmount={stats.monthlyTotal} targetAmount={monthlyGoal?.targetAmount} onSetGoal={(amount) => setGoal('monthly', amount)} />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <StatCard title="Lucro Total" value={stats.totalProfit} icon={<TrendingUp className="w-5 h-5" />} highlight />
          <StatCard title="Hoje" value={stats.dailyTotal} icon={<Calendar className="w-5 h-5" />} subtitle={stats.dailyTotal > 0 ? 'Dia positivo!' : undefined} trend={stats.dailyTotal > 0 ? 'up' : undefined} />
          <StatCard title="Este Mês" value={stats.monthlyTotal} icon={<CalendarDays className="w-5 h-5" />} />
          <StatCard title="Este Ano" value={stats.yearlyTotal} icon={<CalendarRange className="w-5 h-5" />} />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {stats.bestType && <StatCard title="Melhor Tipo" value={allTypes.find(t => t.value === stats.bestType!.type)?.label || stats.bestType.type} subtitle={stats.bestType.total.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })} icon={<Trophy className="w-5 h-5" />} sensitive={false} />}
          {stats.bestHouse && <StatCard title="Melhor Casa" value={stats.bestHouse.house} subtitle={stats.bestHouse.total.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })} icon={<Building2 className="w-5 h-5" />} sensitive={false} />}
          {stats.bestGame && <StatCard title="Melhor Jogo" value={stats.bestGame.game} subtitle={stats.bestGame.total.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })} icon={<Gamepad2 className="w-5 h-5" />} sensitive={false} />}
          {stats.bestHour && <StatCard title="Melhor Horário" value={`${stats.bestHour.hour}:00`} subtitle={stats.bestHour.total.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })} icon={<Clock className="w-5 h-5" />} sensitive={false} />}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          <div className="lg:col-span-1 space-y-6">
            <EntryForm houses={houses} games={games} onSubmit={handleAddEntry} dailyGoalReached={dailyGoalReached} />
            <EntriesList entries={entries.slice(0, 20)} onDelete={deleteEntry} onUpdate={updateEntry} houses={houses} games={games} />
            <TimeRecommendations entries={entries} />
          </div>
          <div className="lg:col-span-2 space-y-6">
            {entries.length > 0 ? (
              <>
                <Charts {...chartData} />
                <AdvancedCharts entries={entries} />
              </>
            ) : (
              <div className="stat-card flex flex-col items-center justify-center py-20 text-center">
                <div className="p-4 rounded-full bg-primary/10 mb-4"><TrendingUp className="w-10 h-10 text-primary" /></div>
                <h3 className="text-xl font-semibold text-foreground mb-2">Comece a rastrear seus lucros</h3>
                <p className="text-muted-foreground max-w-sm">Adicione sua primeira entrada para ver estatísticas detalhadas e gráficos de análise.</p>
              </div>
            )}
          </div>
        </div>
      </main>
      <LibraryManagerDialog
        open={showLibrary}
        onClose={() => setShowLibrary(false)}
        houses={houses}
        games={games}
        onRefresh={() => refreshLibrary(true)}
      />
    </div>
  );
};

export default Index;
