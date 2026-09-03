import { useEffect, useMemo, useState } from 'react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Trash2, Clock, Building2, Gamepad2, FileText, Pencil, User, Loader2, ChevronLeft, ChevronRight } from 'lucide-react';
import { CasinoEntry, entryTypeLabels, entryTypeColors } from '@/types/casino';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { EditEntryDialog } from './EditEntryDialog';

interface EntriesListProps {
  entries: CasinoEntry[];
  onDelete: (id: string) => void;
  onUpdate: (id: string, updates: Partial<Omit<CasinoEntry, 'id' | 'createdAt'>>) => Promise<boolean>;
  houses: string[];
  games: string[];
}

export function EntriesList({ entries, onDelete, onUpdate, houses, games }: EntriesListProps) {
  const [editingEntry, setEditingEntry] = useState<CasinoEntry | null>(null);
  const PAGE_SIZE = 30;
  const [page, setPage] = useState(1);
  const [loadingPage, setLoadingPage] = useState(false);

  const totalPages = Math.max(1, Math.ceil(entries.length / PAGE_SIZE));

  useEffect(() => {
    setPage(1);
  }, [entries.length]);

  useEffect(() => {
    if (page > totalPages) setPage(totalPages);
  }, [page, totalPages]);

  const pageEntries = useMemo(
    () => entries.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE),
    [entries, page],
  );

  const goToPage = (next: number) => {
    if (next < 1 || next > totalPages || next === page || loadingPage) return;
    setLoadingPage(true);
    // Yield to the browser so the loading state paints before the heavy re-render.
    setTimeout(() => {
      setPage(next);
      setLoadingPage(false);
    }, 200);
  };

  if (entries.length === 0) {
    return (
      <div className="stat-card flex flex-col items-center justify-center py-12 text-center">
        <Gamepad2 className="w-12 h-12 text-muted-foreground/50 mb-4" />
        <p className="text-muted-foreground">Nenhuma entrada registrada</p>
        <p className="text-sm text-muted-foreground/70">Comece adicionando seu primeiro lucro!</p>
      </div>
    );
  }

  return (
    <>
      <div className="stat-card p-0 overflow-hidden">
        <div className="p-4 border-b border-border">
          <h3 className="text-lg font-semibold text-foreground">Histórico</h3>
          <p className="text-sm text-muted-foreground">
            {entries.length} entradas · página {page} de {totalPages}
          </p>
        </div>
        <ScrollArea className="h-[400px]">
          {loadingPage ? (
            <div className="flex flex-col items-center justify-center h-[400px] gap-2 text-muted-foreground">
              <Loader2 className="w-6 h-6 animate-spin text-primary" />
              <span className="text-sm">Carregando entradas...</span>
            </div>
          ) : (
          <div className="divide-y divide-border">
            {pageEntries.map((entry, index) => (
              <div
                key={entry.id}
                className="p-4 hover:bg-secondary/50 transition-colors animate-fade-in"
                style={{ animationDelay: `${Math.min(index, 10) * 30}ms` }}
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-2">
                      <span
                        className="px-2 py-0.5 rounded text-xs font-medium"
                        style={{
                          backgroundColor: `${entryTypeColors[entry.type]}20`,
                          color: entryTypeColors[entry.type],
                        }}
                      >
                        {entryTypeLabels[entry.type]}
                      </span>
                      <span className="text-lg font-bold text-profit">
                        +{entry.amount.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                      </span>
                    </div>
                    <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Building2 className="w-3.5 h-3.5" />
                        {entry.house}
                      </span>
                      <span className="flex items-center gap-1">
                        <Gamepad2 className="w-3.5 h-3.5" />
                        {entry.game}
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5" />
                        {format(new Date(entry.createdAt), "dd/MM/yy 'às' HH:mm", { locale: ptBR })}
                      </span>
                      <span className="flex items-center gap-1">
                        <User className="w-3.5 h-3.5" />
                        {entry.account || 'Ruan'}
                      </span>
                    </div>
                    {entry.notes && (
                      <div className="mt-2 text-sm text-muted-foreground/80 flex items-start gap-1">
                        <FileText className="w-3.5 h-3.5 mt-0.5 shrink-0" />
                        <span className="italic">{entry.notes}</span>
                      </div>
                    )}
                  </div>
                  <div className="flex gap-1 shrink-0">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => setEditingEntry(entry)}
                      className="text-muted-foreground hover:text-primary hover:bg-primary/10"
                    >
                      <Pencil className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => onDelete(entry.id)}
                      className="text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
          )}
        </ScrollArea>
        {totalPages > 1 && (
          <div className="flex items-center justify-between gap-2 p-3 border-t border-border">
            <Button
              variant="outline"
              size="sm"
              onClick={() => goToPage(page - 1)}
              disabled={page === 1 || loadingPage}
              className="gap-1"
            >
              <ChevronLeft className="w-4 h-4" />
              Anterior
            </Button>
            <span className="text-xs text-muted-foreground">
              {page} / {totalPages}
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => goToPage(page + 1)}
              disabled={page === totalPages || loadingPage}
              className="gap-1"
            >
              Próxima
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
        )}
      </div>

      <EditEntryDialog
        entry={editingEntry}
        open={!!editingEntry}
        onOpenChange={(open) => !open && setEditingEntry(null)}
        onSave={onUpdate}
        houses={houses}
        games={games}
      />
    </>
  );
}
