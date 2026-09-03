import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Settings2, Trash2, Plus, Star } from 'lucide-react';
import type { RouletteMode } from '@/hooks/useRoulette';

interface Props {
  modes: RouletteMode[];
  onCreate: (m: Omit<RouletteMode, 'id'>) => Promise<void> | void;
  onUpdate: (id: string, patch: Partial<Omit<RouletteMode, 'id'>>) => Promise<void> | void;
  onDelete: (id: string) => Promise<void> | void;
}

export function ModesManagerDialog({ modes, onCreate, onUpdate, onDelete }: Props) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState('');
  const [mult, setMult] = useState('2');
  const [bet, setBet] = useState('10');
  const [rounds, setRounds] = useState('3');
  const [gales, setGales] = useState('2');

  const add = async () => {
    const m = parseFloat(mult.replace(',', '.'));
    const b = parseFloat(bet.replace(',', '.'));
    const r = parseInt(rounds, 10);
    const g = parseInt(gales, 10);
    if (!name.trim() || !Number.isFinite(m) || m <= 1 || !Number.isFinite(b) || b <= 0) return;
    await onCreate({
      name: name.trim(),
      payoutMultiplier: m,
      defaultBet: b,
      isDefault: modes.length === 0,
      matchRounds: Number.isFinite(r) && r >= 1 && r <= 9 ? r : 3,
      maxGales: Number.isFinite(g) && g >= 0 && g <= 5 ? g : 2,
    });
    setName(''); setMult('2'); setBet('10'); setRounds('3'); setGales('2');
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2"><Settings2 className="w-4 h-4" /> Modos</Button>
      </DialogTrigger>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Modos de jogo</DialogTitle>
        </DialogHeader>

        <div className="space-y-3 max-h-[50vh] overflow-y-auto pr-1">
          {modes.length === 0 && <p className="text-sm text-muted-foreground">Nenhum modo cadastrado.</p>}
          {modes.map(m => (
            <ModeRow key={m.id} mode={m} onUpdate={onUpdate} onDelete={onDelete} />
          ))}
        </div>

        <div className="border-t border-border pt-3 space-y-2">
          <div className="text-sm font-semibold">Novo modo</div>
          <div className="grid grid-cols-2 gap-2">
            <div className="col-span-2">
              <Label className="text-xs">Nome</Label>
              <Input value={name} onChange={e => setName(e.target.value)} placeholder="Ex.: Roleta dezena, Bacbo, Cor..." />
            </div>
            <div>
              <Label className="text-xs">Pagamento (×)</Label>
              <Input type="number" step="0.1" value={mult} onChange={e => setMult(e.target.value)} />
            </div>
            <div>
              <Label className="text-xs">Aposta padrão</Label>
              <Input type="number" step="0.01" value={bet} onChange={e => setBet(e.target.value)} />
            </div>
            <div>
              <Label className="text-xs">Rodadas (MD)</Label>
              <Input type="number" min="1" max="9" value={rounds} onChange={e => setRounds(e.target.value)} />
            </div>
            <div>
              <Label className="text-xs">Máx. gales</Label>
              <Input type="number" min="0" max="5" value={gales} onChange={e => setGales(e.target.value)} />
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button onClick={add} className="gap-2"><Plus className="w-4 h-4" /> Adicionar modo</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function ModeRow({ mode, onUpdate, onDelete }: { mode: RouletteMode; onUpdate: Props['onUpdate']; onDelete: Props['onDelete'] }) {
  const [name, setName] = useState(mode.name);
  const [mult, setMult] = useState(String(mode.payoutMultiplier));
  const [bet, setBet] = useState(String(mode.defaultBet));
  const [rounds, setRounds] = useState(String(mode.matchRounds));
  const [gales, setGales] = useState(String(mode.maxGales));

  const save = () => {
    const m = parseFloat(mult.replace(',', '.'));
    const b = parseFloat(bet.replace(',', '.'));
    const r = parseInt(rounds, 10);
    const g = parseInt(gales, 10);
    onUpdate(mode.id, {
      name: name.trim() || mode.name,
      payoutMultiplier: Number.isFinite(m) && m > 1 ? m : mode.payoutMultiplier,
      defaultBet: Number.isFinite(b) && b > 0 ? b : mode.defaultBet,
      matchRounds: Number.isFinite(r) && r >= 1 && r <= 9 ? r : mode.matchRounds,
      maxGales: Number.isFinite(g) && g >= 0 && g <= 5 ? g : mode.maxGales,
    });
  };

  return (
    <div className="rounded-lg border border-border bg-secondary/30 p-3 space-y-2">
      <div className="flex items-center justify-between gap-2">
        <Input value={name} onChange={e => setName(e.target.value)} onBlur={save} className="h-8" />
        <div className="flex items-center gap-2">
          <button
            type="button"
            title={mode.isDefault ? 'Modo padrão' : 'Definir como padrão'}
            onClick={() => onUpdate(mode.id, { isDefault: true })}
            className={`p-1 rounded ${mode.isDefault ? 'text-yellow-400' : 'text-muted-foreground hover:text-foreground'}`}
          >
            <Star className={`w-4 h-4 ${mode.isDefault ? 'fill-yellow-400' : ''}`} />
          </button>
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7 text-muted-foreground hover:text-destructive"
            onClick={() => { if (confirm(`Remover "${mode.name}"?`)) onDelete(mode.id); }}
          >
            <Trash2 className="w-3.5 h-3.5" />
          </Button>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-2">
        <div>
          <Label className="text-[10px] text-muted-foreground">Pagamento (×)</Label>
          <Input type="number" step="0.1" value={mult} onChange={e => setMult(e.target.value)} onBlur={save} className="h-8" />
        </div>
        <div>
          <Label className="text-[10px] text-muted-foreground">Aposta padrão</Label>
          <Input type="number" step="0.01" value={bet} onChange={e => setBet(e.target.value)} onBlur={save} className="h-8" />
        </div>
        <div>
          <Label className="text-[10px] text-muted-foreground">Rodadas (MD)</Label>
          <Input type="number" min="1" max="9" value={rounds} onChange={e => setRounds(e.target.value)} onBlur={save} className="h-8" />
        </div>
        <div>
          <Label className="text-[10px] text-muted-foreground">Máx. gales</Label>
          <Input type="number" min="0" max="5" value={gales} onChange={e => setGales(e.target.value)} onBlur={save} className="h-8" />
        </div>
      </div>
    </div>
  );
}