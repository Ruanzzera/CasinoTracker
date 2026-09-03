import { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Pencil, DollarSign, Gamepad2, Building2, Tag, FileText, CalendarIcon, Clock, User } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Calendar } from '@/components/ui/calendar';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { CasinoEntry, EntryType, ACCOUNTS, AccountName } from '@/types/casino';
import { TypeSelect } from '@/components/TypeSelect';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

interface EntryUpdates {
  amount?: number;
  type?: EntryType;
  house?: string;
  game?: string;
  notes?: string;
  account?: AccountName;
  createdAt?: string;
}

interface EditEntryDialogProps {
  entry: CasinoEntry | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (id: string, updates: EntryUpdates) => Promise<boolean>;
  houses: string[];
  games: string[];
}

export function EditEntryDialog({ entry, open, onOpenChange, onSave, houses, games }: EditEntryDialogProps) {
  const [amount, setAmount] = useState('');
  const [type, setType] = useState<EntryType>('bonus');
  const [house, setHouse] = useState('');
  const [game, setGame] = useState('');
  const [notes, setNotes] = useState('');
  const [date, setDate] = useState<Date | undefined>(undefined);
  const [time, setTime] = useState('');
  const [account, setAccount] = useState<AccountName>('Ruan');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (entry) {
      setAmount(entry.amount.toString());
      setType(entry.type);
      setHouse(entry.house);
      setGame(entry.game);
      setNotes(entry.notes || '');
      setAccount(entry.account || 'Ruan');
      const entryDate = new Date(entry.createdAt);
      setDate(entryDate);
      setTime(format(entryDate, 'HH:mm'));
    }
  }, [entry]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!entry) return;

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

    // Combine date and time
    let createdAt: string | undefined;
    if (date) {
      const [hours, minutes] = time.split(':').map(Number);
      const newDate = new Date(date);
      newDate.setHours(hours || 0, minutes || 0, 0, 0);
      createdAt = newDate.toISOString();
    }

    setLoading(true);
    const success = await onSave(entry.id, {
      amount: numAmount,
      type,
      house: house.trim(),
      game: game.trim(),
      notes: notes.trim() || undefined,
      account,
      createdAt,
    });
    setLoading(false);

    if (success) {
      toast.success('Entrada atualizada!');
      onOpenChange(false);
    } else {
      toast.error('Erro ao atualizar entrada');
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-card border-border max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-foreground">
            <Pencil className="w-5 h-5 text-primary" />
            Editar Entrada
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="edit-amount" className="text-muted-foreground">Valor (R$)</Label>
            <div className="relative">
              <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                id="edit-amount"
                type="text"
                placeholder="0,00"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="pl-10 bg-secondary border-border text-foreground"
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
            <div className="relative">
              <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Digite o nome da casa"
                value={house}
                onChange={(e) => setHouse(e.target.value)}
                list="houses-list"
                className="pl-10 bg-secondary border-border text-foreground"
              />
              <datalist id="houses-list">
                {houses.map((h) => <option key={h} value={h} />)}
              </datalist>
            </div>
          </div>

          <div className="space-y-2">
            <Label className="text-muted-foreground">Jogo</Label>
            <div className="relative">
              <Gamepad2 className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Digite o nome do jogo"
                value={game}
                onChange={(e) => setGame(e.target.value)}
                list="games-list"
                className="pl-10 bg-secondary border-border text-foreground"
              />
              <datalist id="games-list">
                {games.map((g) => <option key={g} value={g} />)}
              </datalist>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label className="text-muted-foreground flex items-center gap-1">
                <CalendarIcon className="w-3 h-3" />
                Data
              </Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal bg-secondary border-border",
                      !date && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {date ? format(date, "dd/MM/yyyy", { locale: ptBR }) : "Selecione"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={date}
                    onSelect={setDate}
                    initialFocus
                    locale={ptBR}
                    className="pointer-events-auto"
                  />
                </PopoverContent>
              </Popover>
            </div>

            <div className="space-y-2">
              <Label className="text-muted-foreground flex items-center gap-1">
                <Clock className="w-3 h-3" />
                Horário
              </Label>
              <Input
                type="time"
                value={time}
                onChange={(e) => setTime(e.target.value)}
                className="bg-secondary border-border text-foreground"
              />
            </div>
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

          <div className="flex gap-2 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="flex-1"
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={loading}
              className="flex-1 bg-primary text-primary-foreground hover:bg-primary/90"
            >
              {loading ? 'Salvando...' : 'Salvar'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}