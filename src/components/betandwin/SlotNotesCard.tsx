import { useEffect, useMemo, useState } from 'react';
import { Pencil, Plus, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { ComboboxInput } from '@/components/ComboboxInput';
import { toast } from 'sonner';

export function SlotNotesCard({ userId, houses, entryHouses }: { userId?: string; houses: string[]; entryHouses: string[] }) {
  const storageKey = userId ? `bet-and-win-slot-notes:${userId}` : 'bet-and-win-slot-notes';
  const [notes, setNotes] = useState<Record<string, string>>({});
  const [newHouse, setNewHouse] = useState('');

  useEffect(() => {
    try {
      const raw = localStorage.getItem(storageKey);
      if (raw) setNotes(JSON.parse(raw));
    } catch {}
  }, [storageKey]);

  const persist = (next: Record<string, string>) => {
    setNotes(next);
    try { localStorage.setItem(storageKey, JSON.stringify(next)); } catch {}
  };

  const allHouses = useMemo(() => {
    const set = new Set<string>([...Object.keys(notes), ...entryHouses, ...houses]);
    return Array.from(set).filter(Boolean).sort((a, b) => a.localeCompare(b));
  }, [notes, entryHouses, houses]);

  const visibleHouses = allHouses.filter(h => h in notes);

  const addHouse = () => {
    const h = newHouse.trim();
    if (!h) return;
    if (h in notes) { toast.error('Casa já adicionada'); return; }
    persist({ ...notes, [h]: '' });
    setNewHouse('');
  };

  const removeHouse = (h: string) => {
    const { [h]: _, ...rest } = notes;
    persist(rest);
  };

  return (
    <div className="rounded-lg border border-border/60 bg-card/60 p-3">
      <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2 flex items-center gap-1.5">
        <Pencil className="w-3.5 h-3.5" /> Anotações de Slots
      </h3>

      <div className="flex gap-1.5 mb-2">
        <ComboboxInput value={newHouse} onChange={setNewHouse} suggestions={allHouses.filter(h => !(h in notes))} placeholder="+ casa" />
        <Button type="button" onClick={addHouse} size="sm" variant="outline" className="h-9 px-2">
          <Plus className="w-3.5 h-3.5" />
        </Button>
      </div>

      {visibleHouses.length === 0 ? (
        <p className="text-[11px] text-center text-muted-foreground py-2">Adicione uma casa para anotar.</p>
      ) : (
        <div className="space-y-2 max-h-[320px] overflow-y-auto pr-1">
          {visibleHouses.map(h => (
            <div key={h} className="rounded border border-border/60 bg-muted/10 p-2">
              <div className="flex items-center justify-between mb-1">
                <span className="font-medium text-foreground text-xs">{h}</span>
                <Button variant="ghost" size="icon" className="h-5 w-5 text-muted-foreground hover:text-destructive" onClick={() => removeHouse(h)}>
                  <Trash2 className="w-3 h-3" />
                </Button>
              </div>
              <Textarea
                value={notes[h]}
                onChange={e => persist({ ...notes, [h]: e.target.value })}
                placeholder="Slot, bet ideal..."
                className="min-h-[44px] text-xs p-2 resize-none"
              />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}