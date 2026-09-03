import { useState } from 'react';
import { Plus, DollarSign, Gamepad2, Building2, Tag, FileText, User } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { EntryType, ACCOUNTS, AccountName } from '@/types/casino';
import { TypeSelect } from '@/components/TypeSelect';
import { ComboboxInput } from '@/components/ComboboxInput';
import { toast } from 'sonner';

interface EntryFormProps {
  houses: string[];
  games: string[];
  onSubmit: (entry: { amount: number; type: EntryType; house: string; game: string; notes?: string; account: AccountName }) => void;
  dailyGoalReached?: boolean;
}

export function EntryForm({ houses, games, onSubmit, dailyGoalReached }: EntryFormProps) {
  const [amount, setAmount] = useState('');
  const [type, setType] = useState<EntryType>('bonus');
  const [house, setHouse] = useState('');
  const [game, setGame] = useState('');
  const [notes, setNotes] = useState('');
  const [account, setAccount] = useState<AccountName>('Ruan');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const numAmount = parseFloat(amount.replace(',', '.'));

    if (isNaN(numAmount) || numAmount === 0) {
      toast.error('Digite um valor válido (use - para perdas)');
      return;
    }
    if (!house.trim()) {
      toast.error('Digite uma casa de apostas');
      return;
    }
    if (!game.trim()) {
      toast.error('Digite um jogo');
      return;
    }

    onSubmit({
      amount: numAmount,
      type,
      house: house.trim(),
      game: game.trim(),
      notes: notes.trim() || undefined,
      account,
    });

    setAmount('');
    setHouse('');
    setGame('');
    setNotes('');
    setAccount('Ruan');
    toast.success('Entrada registrada!');
  };

  return (
    <form onSubmit={handleSubmit} className="stat-card space-y-4">
      <h3 className="text-lg font-semibold text-foreground flex items-center gap-2">
        <Plus className="w-5 h-5 text-primary" />
        Nova Entrada
      </h3>

      {dailyGoalReached && (
        <div className="flex items-start gap-2 rounded-md border border-primary/30 bg-primary/10 px-3 py-2 text-xs text-primary">
          <span>🐷</span>
          <span>Meta diária atingida! O valor será arredondado para o múltiplo de R$0,50 mais próximo e o restante irá para o <strong>Tip Jar</strong>.</span>
        </div>
      )}

      <div className="space-y-2">
        <Label htmlFor="amount" className="text-muted-foreground">Valor (R$)</Label>
        <div className="relative">
          <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            id="amount"
            type="text"
            placeholder="0,00"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            className="pl-10 bg-secondary border-border text-foreground input-glow"
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label className="text-muted-foreground flex items-center gap-1">
          <Tag className="w-3 h-3" />
          Tipo
        </Label>
        <TypeSelect
          value={type}
          onValueChange={(v) => setType(v as EntryType)}
          className="bg-secondary border-border text-foreground"
        />
      </div>

      <div className="space-y-2">
        <Label className="text-muted-foreground flex items-center gap-1">
          <User className="w-3 h-3" />
          Conta
        </Label>
        <div className="grid grid-cols-2 gap-1 rounded-md border border-border bg-secondary p-1">
          {ACCOUNTS.map((opt) => (
            <button
              key={opt}
              type="button"
              onClick={() => setAccount(opt)}
              aria-pressed={account === opt}
              className={`rounded-sm px-3 py-2 text-sm font-medium transition-colors ${
                account === opt
                  ? 'bg-primary text-primary-foreground shadow'
                  : 'text-muted-foreground hover:bg-background/40'
              }`}
            >
              {opt}
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-2">
        <Label className="text-muted-foreground">Casa de Apostas</Label>
        <ComboboxInput
          value={house}
          onChange={setHouse}
          suggestions={houses}
          placeholder="Digite o nome da casa"
          icon={Building2}
        />
      </div>

      <div className="space-y-2">
        <Label className="text-muted-foreground">Jogo</Label>
        <ComboboxInput
          value={game}
          onChange={setGame}
          suggestions={games}
          placeholder="Digite o nome do jogo"
          icon={Gamepad2}
        />
      </div>

      <div className="space-y-2">
        <Label className="text-muted-foreground flex items-center gap-1">
          <FileText className="w-3 h-3" />
          Notas (opcional)
        </Label>
        <Textarea
          placeholder="Observações sobre esta entrada..."
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          className="bg-secondary border-border text-foreground resize-none h-16"
        />
      </div>

      <Button type="submit" className="w-full bg-primary text-primary-foreground hover:bg-primary/90">
        <Plus className="w-4 h-4 mr-2" />
        Registrar Lucro
      </Button>
    </form>
  );
}
