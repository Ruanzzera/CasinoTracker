import { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Filter, Calendar, Building2, Gamepad2, Tag, TrendingUp, DollarSign, Download } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { MultiSelectFilter } from '@/components/MultiSelectFilter';
import { useCasinoData } from '@/hooks/useCasinoData';
import { entryTypeLabels } from '@/types/casino';
import { StatCard } from '@/components/StatCard';
import { EntriesList } from '@/components/EntriesList';
import { HoursHeatmap } from '@/components/HoursHeatmap';
import { AccountComparison } from '@/components/AccountComparison';
import { exportToCSV } from '@/lib/exportData';
import { toast } from 'sonner';

export default function Analytics() {
  const { entries, houses, games, deleteEntry, updateEntry, calculateStatistics } = useCasinoData();
  
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [selectedHouses, setSelectedHouses] = useState<string[]>([]);
  const [selectedGames, setSelectedGames] = useState<string[]>([]);
  const [selectedTypes, setSelectedTypes] = useState<string[]>([]);

  const filteredEntries = useMemo(() => {
    // Interpret date bounds explicitly in Brasília (UTC-3) so filters match the
    // day the user actually sees, regardless of the browser's local timezone.
    const startTs = startDate ? new Date(`${startDate}T00:00:00-03:00`).getTime() : null;
    const endTs = endDate ? new Date(`${endDate}T23:59:59.999-03:00`).getTime() : null;
    const houseSet = selectedHouses.length ? new Set(selectedHouses) : null;
    const gameSet = selectedGames.length ? new Set(selectedGames) : null;
    const typeSet = selectedTypes.length ? new Set(selectedTypes) : null;

    return entries.filter(entry => {
      const ts = new Date(entry.createdAt).getTime();
      if (startTs !== null && ts < startTs) return false;
      if (endTs !== null && ts > endTs) return false;
      if (houseSet && !houseSet.has(entry.house)) return false;
      if (gameSet && !gameSet.has(entry.game)) return false;
      if (typeSet && !typeSet.has(entry.type)) return false;
      return true;
    });
  }, [entries, startDate, endDate, selectedHouses, selectedGames, selectedTypes]);

  const stats = useMemo(() => {
    const s = calculateStatistics(filteredEntries);
    const average = s.entriesCount > 0 ? s.totalProfit / s.entriesCount : 0;
    const highest = s.highestEntry?.amount ?? 0;
    return {
      total: s.totalProfit,
      count: s.entriesCount,
      average,
      highest,
      bestHouse: { name: s.bestHouse?.house ?? '-', total: s.bestHouse?.total ?? 0 },
      bestGame: { name: s.bestGame?.game ?? '-', total: s.bestGame?.total ?? 0 },
      bestType: { name: s.bestType ? entryTypeLabels[s.bestType.type] : '-', total: s.bestType?.total ?? 0 },
    };
  }, [filteredEntries, calculateStatistics]);

  const clearFilters = () => {
    setStartDate('');
    setEndDate('');
    setSelectedHouses([]);
    setSelectedGames([]);
    setSelectedTypes([]);
  };

  const hasFilters = !!startDate || !!endDate
    || selectedHouses.length > 0
    || selectedGames.length > 0
    || selectedTypes.length > 0;

  const handleExport = () => {
    if (filteredEntries.length === 0) {
      toast.error('Nenhuma entrada para exportar');
      return;
    }
    exportToCSV(filteredEntries, 'casino_analytics');
    toast.success('Dados exportados com sucesso!');
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-7xl mx-auto px-4 py-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <Link to="/">
              <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-foreground">
                <ArrowLeft className="w-5 h-5" />
              </Button>
            </Link>
            <div>
              <h1 className="text-2xl font-bold text-foreground">Analytics</h1>
              <p className="text-muted-foreground text-sm">Análise detalhada com filtros</p>
            </div>
          </div>
          <Button variant="outline" size="sm" onClick={handleExport} className="gap-2">
            <Download className="w-4 h-4" />
            Exportar CSV
          </Button>
        </div>

        {/* Filters Card */}
        <div className="stat-card mb-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-foreground flex items-center gap-2">
              <Filter className="w-5 h-5 text-primary" />
              Filtros
            </h3>
            {hasFilters && (
              <Button variant="ghost" size="sm" onClick={clearFilters} className="text-muted-foreground hover:text-foreground">
                Limpar filtros
              </Button>
            )}
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            {/* Start Date */}
            <div className="space-y-2">
              <Label className="text-muted-foreground flex items-center gap-1">
                <Calendar className="w-3 h-3" />
                Data Início
              </Label>
              <Input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="bg-secondary border-border text-foreground"
              />
            </div>

            {/* End Date */}
            <div className="space-y-2">
              <Label className="text-muted-foreground flex items-center gap-1">
                <Calendar className="w-3 h-3" />
                Data Fim
              </Label>
              <Input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="bg-secondary border-border text-foreground"
              />
            </div>

            {/* House Filter */}
            <div className="space-y-2">
              <Label className="text-muted-foreground flex items-center gap-1">
                <Building2 className="w-3 h-3" />
                Casa
              </Label>
              <MultiSelectFilter
                options={houses.map(h => ({ value: h, label: h }))}
                selected={selectedHouses}
                onChange={setSelectedHouses}
                allLabel="Todas"
              />
            </div>

            {/* Game Filter */}
            <div className="space-y-2">
              <Label className="text-muted-foreground flex items-center gap-1">
                <Gamepad2 className="w-3 h-3" />
                Jogo
              </Label>
              <MultiSelectFilter
                options={games.map(g => ({ value: g, label: g }))}
                selected={selectedGames}
                onChange={setSelectedGames}
                allLabel="Todos"
              />
            </div>

            {/* Type Filter */}
            <div className="space-y-2">
              <Label className="text-muted-foreground flex items-center gap-1">
                <Tag className="w-3 h-3" />
                Tipo
              </Label>
              <MultiSelectFilter
                options={Object.entries(entryTypeLabels).map(([value, label]) => ({ value, label }))}
                selected={selectedTypes}
                onChange={setSelectedTypes}
                allLabel="Todos"
              />
            </div>
          </div>
        </div>

        {/* Stats for filtered data */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <StatCard
            title="Total Filtrado"
            value={`R$ ${stats.total.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`}
            icon={<DollarSign className="w-5 h-5" />}
            highlight
          />
          <StatCard
            title="Entradas"
            value={stats.count.toString()}
            icon={<TrendingUp className="w-5 h-5" />}
          />
          <StatCard
            title="Média"
            value={`R$ ${stats.average.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`}
            icon={<TrendingUp className="w-5 h-5" />}
          />
          <StatCard
            title="Maior Valor"
            value={`R$ ${stats.highest.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`}
            icon={<TrendingUp className="w-5 h-5" />}
          />
        </div>

        {/* Best performers */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="stat-card">
            <div className="flex items-center gap-2 mb-2">
              <Building2 className="w-4 h-4 text-primary" />
              <span className="text-sm text-muted-foreground">Melhor Casa</span>
            </div>
            <p className="text-lg font-semibold text-foreground">{stats.bestHouse.name}</p>
            <p className="text-sm text-primary">
              R$ {stats.bestHouse.total.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </p>
          </div>
          <div className="stat-card">
            <div className="flex items-center gap-2 mb-2">
              <Gamepad2 className="w-4 h-4 text-primary" />
              <span className="text-sm text-muted-foreground">Melhor Jogo</span>
            </div>
            <p className="text-lg font-semibold text-foreground">{stats.bestGame.name}</p>
            <p className="text-sm text-primary">
              R$ {stats.bestGame.total.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </p>
          </div>
          <div className="stat-card">
            <div className="flex items-center gap-2 mb-2">
              <Tag className="w-4 h-4 text-primary" />
              <span className="text-sm text-muted-foreground">Melhor Tipo</span>
            </div>
            <p className="text-lg font-semibold text-foreground">{stats.bestType.name}</p>
            <p className="text-sm text-primary">
              R$ {stats.bestType.total.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </p>
          </div>
        </div>

        {/* Heatmap */}
        <div className="mb-6">
          <HoursHeatmap entries={filteredEntries} />
        </div>

        {/* Account comparison (Ruan vs Rita) */}
        <AccountComparison entries={filteredEntries} />

        {/* Filtered entries list */}
        <EntriesList entries={filteredEntries} onDelete={deleteEntry} onUpdate={updateEntry} houses={houses} games={games} />
      </div>
    </div>
  );
}
