import { useState, useMemo, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Pencil, Trash2, Check, X, Search, Building2, Gamepad2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface Props {
  open: boolean;
  onClose: () => void;
  houses: string[];
  games: string[];
  onRefresh: () => void;
}

// Tables/columns that store houses and games
const HOUSE_TARGETS: { table: string; column: string }[] = [
  { table: 'casino_entries', column: 'house' },
  { table: 'bet_and_win_entries', column: 'house' },
  { table: 'tournament_entries', column: 'house' },
  { table: 'tournament_schedule', column: 'house' },
  { table: 'tournaments', column: 'house' },
  { table: 'casino_reminders', column: 'house' },
];

const GAME_TARGETS: { table: string; column: string }[] = [
  { table: 'casino_entries', column: 'game' },
  { table: 'bet_and_win_entries', column: 'game' },
  { table: 'bet_and_win_entries', column: 'prize_game' },
  { table: 'tournament_entries', column: 'slot' },
  { table: 'tournaments', column: 'rollover_game' },
  { table: 'tournament_sessions', column: 'rollover_game' },
];

async function renameAcross(targets: { table: string; column: string }[], oldName: string, newName: string) {
  for (const t of targets) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error } = await (supabase.from(t.table as any) as any)
      .update({ [t.column]: newName })
      .eq(t.column, oldName);
    if (error) console.error(`rename ${t.table}.${t.column}`, error?.message);
  }
}

// "Excluir" no contexto da biblioteca NÃO apaga registros — apenas remove a referência
// ao nome, renomeando para "(Removido)". Assim o usuário não perde entradas históricas
// ao limpar a biblioteca de nomes duplicados ou obsoletos.
const REMOVED_LABEL = '(Removido)';
async function deleteAcross(targets: { table: string; column: string }[], name: string) {
  await renameAcross(targets, name, REMOVED_LABEL);
}

export function LibraryManagerDialog({ open, onClose, houses, games, onRefresh }: Props) {
  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Gerenciar Biblioteca</DialogTitle>
        </DialogHeader>
        <p className="text-xs text-muted-foreground -mt-2 mb-2">
          Renomeie para unificar nomes duplicados (ex.: <em>betano</em> → <em>Betano</em>). Excluir remove todos os registros vinculados.
        </p>
        <Tabs defaultValue="houses">
          <TabsList className="w-full">
            <TabsTrigger value="houses" className="flex-1 gap-2"><Building2 className="w-4 h-4" /> Casas</TabsTrigger>
            <TabsTrigger value="games" className="flex-1 gap-2"><Gamepad2 className="w-4 h-4" /> Jogos</TabsTrigger>
          </TabsList>
          <TabsContent value="houses">
            <NameList items={houses} kind="casa" targets={HOUSE_TARGETS} onChanged={onRefresh} />
          </TabsContent>
          <TabsContent value="games">
            <NameList items={games} kind="jogo" targets={GAME_TARGETS} onChanged={onRefresh} />
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}

function NameList({ items, kind, targets, onChanged }: {
  items: string[];
  kind: 'casa' | 'jogo';
  targets: { table: string; column: string }[];
  onChanged: () => void;
}) {
  const [filter, setFilter] = useState('');
  const [editing, setEditing] = useState<string | null>(null);
  const [draft, setDraft] = useState('');
  const [busy, setBusy] = useState(false);

  useEffect(() => { setEditing(null); setDraft(''); }, [items.length]);

  const filtered = useMemo(() => {
    const n = filter.toLowerCase().trim();
    return items.filter(i => !n || i.toLowerCase().includes(n));
  }, [items, filter]);

  const startEdit = (name: string) => { setEditing(name); setDraft(name); };
  const cancel = () => { setEditing(null); setDraft(''); };

  const save = async (oldName: string) => {
    const newName = draft.trim();
    if (!newName) { toast.error('Nome não pode ficar vazio'); return; }
    if (newName === oldName) { cancel(); return; }
    setBusy(true);
    await renameAcross(targets, oldName, newName);
    setBusy(false);
    toast.success(`${kind === 'casa' ? 'Casa' : 'Jogo'} renomeado`);
    cancel();
    onChanged();
  };

  const remove = async (name: string) => {
    if (!confirm(`Remover "${name}" da biblioteca? As entradas existentes serão preservadas e marcadas como "(Removido)".`)) return;
    setBusy(true);
    await deleteAcross(targets, name);
    setBusy(false);
    toast.success('Removido da biblioteca (dados preservados)');
    onChanged();
  };

  return (
    <div className="space-y-2 mt-3">
      <div className="relative">
        <Search className="absolute left-2 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input value={filter} onChange={e => setFilter(e.target.value)} placeholder="Buscar..." className="pl-8" />
      </div>
      <div className="border border-border rounded-lg divide-y divide-border max-h-[50vh] overflow-y-auto">
        {filtered.length === 0 ? (
          <p className="text-center text-sm text-muted-foreground py-6">Nenhum item</p>
        ) : filtered.map(name => (
          <div key={name} className="flex items-center gap-2 p-2">
            {editing === name ? (
              <>
                <Input value={draft} onChange={e => setDraft(e.target.value)} className="h-8" autoFocus
                  onKeyDown={e => { if (e.key === 'Enter') save(name); if (e.key === 'Escape') cancel(); }} />
                <Button size="icon" variant="ghost" className="h-8 w-8 text-primary" disabled={busy} onClick={() => save(name)}>
                  <Check className="w-4 h-4" />
                </Button>
                <Button size="icon" variant="ghost" className="h-8 w-8" disabled={busy} onClick={cancel}>
                  <X className="w-4 h-4" />
                </Button>
              </>
            ) : (
              <>
                <span className="flex-1 text-sm text-foreground truncate">{name}</span>
                <Button size="icon" variant="ghost" className="h-8 w-8 text-muted-foreground" disabled={busy} onClick={() => startEdit(name)}>
                  <Pencil className="w-3.5 h-3.5" />
                </Button>
                <Button size="icon" variant="ghost" className="h-8 w-8 text-destructive" disabled={busy} onClick={() => remove(name)}>
                  <Trash2 className="w-3.5 h-3.5" />
                </Button>
              </>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}