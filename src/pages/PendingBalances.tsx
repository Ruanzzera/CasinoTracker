import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Plus, Check, Trash2, Wallet, Pencil, X } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useSharedLibrary } from '@/hooks/useSharedLibrary';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ComboboxInput } from '@/components/ComboboxInput';
import { ACCOUNTS, AccountName } from '@/types/casino';
import { toast } from 'sonner';
import { formatDateBRT } from '@/lib/timezone';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader,
  AlertDialogTitle, AlertDialogTrigger,
} from '@/components/ui/alert-dialog';

interface PendingBalance {
  id: string;
  house: string;
  account: AccountName;
  amount: number;
  status: 'open' | 'closed';
  created_at: string;
  updated_at: string;
}

export default function PendingBalances() {
  const { user } = useAuth();
  const { houses, refresh: refreshLibrary } = useSharedLibrary();
  const [items, setItems] = useState<PendingBalance[]>([]);
  const [loading, setLoading] = useState(true);

  const [house, setHouse] = useState('');
  const [account, setAccount] = useState<AccountName>('Ruan');
  const [amount, setAmount] = useState('');

  const fetchAll = async () => {
    if (!user) return;
    setLoading(true);
    const { data, error } = await (supabase as any)
      .from('pending_balances')
      .select('*')
      .eq('status', 'open')
      .order('created_at', { ascending: false });
    if (error) toast.error('Erro ao carregar');
    else setItems((data || []) as PendingBalance[]);
    setLoading(false);
  };

  useEffect(() => {
    fetchAll();
     
  }, [user]);

  const total = useMemo(
    () => items.reduce((sum, i) => sum + Number(i.amount || 0), 0),
    [items]
  );

  const totalsByAccount = useMemo(() => {
    const map: Record<string, number> = { Ruan: 0, Rita: 0 };
    items.forEach((i) => { map[i.account] = (map[i.account] || 0) + Number(i.amount || 0); });
    return map;
  }, [items]);

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    if (!house.trim()) { toast.error('Selecione uma casa'); return; }
    const num = parseFloat(amount.replace(',', '.'));
    if (isNaN(num)) { toast.error('Valor inválido'); return; }

    const { data, error } = await (supabase as any)
      .from('pending_balances')
      .insert({ user_id: user.id, house: house.trim(), account, amount: num, status: 'open' })
      .select()
      .single();
    if (error) { toast.error('Erro ao salvar'); return; }
    setItems((prev) => [data as PendingBalance, ...prev]);
    setHouse(''); setAmount(''); setAccount('Ruan');
    refreshLibrary();
    toast.success('Registrado!');
  };

  const updateItem = async (id: string, patch: Partial<PendingBalance>) => {
    const { data, error } = await (supabase as any)
      .from('pending_balances')
      .update(patch)
      .eq('id', id)
      .select()
      .single();
    if (error) { toast.error('Erro ao atualizar'); return; }
    setItems((prev) => prev.map((i) => (i.id === id ? (data as PendingBalance) : i)));
  };

  const closeItem = async (id: string) => {
    const { error } = await (supabase as any)
      .from('pending_balances')
      .update({ status: 'closed', closed_at: new Date().toISOString() })
      .eq('id', id);
    if (error) { toast.error('Erro ao fechar'); return; }
    setItems((prev) => prev.filter((i) => i.id !== id));
    toast.success('Saldo sacado ✓');
  };

  const deleteItem = async (id: string) => {
    const { error } = await (supabase as any).from('pending_balances').delete().eq('id', id);
    if (error) { toast.error('Erro ao excluir'); return; }
    setItems((prev) => prev.filter((i) => i.id !== id));
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-40">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link to="/"><Button variant="ghost" size="icon"><ArrowLeft className="w-4 h-4" /></Button></Link>
            <div className="p-2 rounded-lg bg-primary/20"><Wallet className="w-5 h-5 text-primary" /></div>
            <div>
              <h1 className="text-xl font-bold text-foreground">Saldos Parados</h1>
              <p className="text-xs text-muted-foreground">Dinheiro em aberto nas casas</p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-xs text-muted-foreground">Total em aberto</p>
            <p className="text-2xl font-bold text-primary">
              {total.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
            </p>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-6 space-y-6">
        <div className="grid grid-cols-2 gap-3">
          {ACCOUNTS.map((acc) => (
            <div key={acc} className="stat-card p-3">
              <p className="text-xs text-muted-foreground">{acc}</p>
              <p className="text-lg font-bold text-foreground">
                {(totalsByAccount[acc] || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
              </p>
            </div>
          ))}
        </div>

        <form onSubmit={handleAdd} className="stat-card grid grid-cols-1 md:grid-cols-[1fr_auto_140px_auto] gap-3 items-end">
          <div>
            <Label className="text-muted-foreground text-xs">Casa</Label>
            <ComboboxInput value={house} onChange={setHouse} suggestions={houses} placeholder="Casa" />
          </div>
          <div>
            <Label className="text-muted-foreground text-xs">Conta</Label>
            <div className="grid grid-cols-2 gap-1 rounded-md border border-border bg-secondary p-1">
              {ACCOUNTS.map((opt) => (
                <button
                  key={opt} type="button" onClick={() => setAccount(opt)}
                  className={`rounded-sm px-3 py-2 text-sm font-medium transition-colors ${
                    account === opt ? 'bg-primary text-primary-foreground shadow' : 'text-muted-foreground hover:bg-background/40'
                  }`}
                >{opt}</button>
              ))}
            </div>
          </div>
          <div>
            <Label className="text-muted-foreground text-xs">Valor (R$)</Label>
            <Input inputMode="decimal" placeholder="0,00" value={amount} onChange={(e) => setAmount(e.target.value)} className="bg-secondary" />
          </div>
          <Button type="submit" className="gap-2"><Plus className="w-4 h-4" />Adicionar</Button>
        </form>

        <div className="space-y-2">
          {loading ? (
            <p className="text-muted-foreground text-sm text-center py-8">Carregando…</p>
          ) : items.length === 0 ? (
            <p className="text-muted-foreground text-sm text-center py-8">Nenhum saldo em aberto.</p>
          ) : (
            items.map((it) => (
              <PendingRow
                key={it.id}
                item={it}
                houses={houses}
                onUpdate={(patch) => updateItem(it.id, patch)}
                onClose={() => closeItem(it.id)}
                onDelete={() => deleteItem(it.id)}
              />
            ))
          )}
        </div>
      </main>
    </div>
  );
}

function PendingRow({
  item, houses, onUpdate, onClose, onDelete,
}: {
  item: PendingBalance;
  houses: string[];
  onUpdate: (patch: Partial<PendingBalance>) => void;
  onClose: () => void;
  onDelete: () => void;
}) {
  const [editing, setEditing] = useState(false);
  const [house, setHouse] = useState(item.house);
  const [amount, setAmount] = useState(String(item.amount).replace('.', ','));
  const [account, setAccount] = useState<AccountName>(item.account);
  const [when, setWhen] = useState(() => toLocalInput(item.updated_at));

  const startEdit = () => {
    setHouse(item.house);
    setAmount(String(item.amount).replace('.', ','));
    setAccount(item.account);
    setWhen(toLocalInput(item.updated_at));
    setEditing(true);
  };

  const cancelEdit = () => setEditing(false);

  const saveEdit = () => {
    const patch: Partial<PendingBalance> = {};
    const h = house.trim();
    if (!h) { toast.error('Casa obrigatória'); return; }
    if (h !== item.house) patch.house = h;
    const n = parseFloat(amount.replace(',', '.'));
    if (isNaN(n)) { toast.error('Valor inválido'); return; }
    if (n !== Number(item.amount)) patch.amount = n;
    if (account !== item.account) patch.account = account;
    const iso = fromLocalInput(when);
    if (iso && iso !== item.updated_at) (patch as any).updated_at = iso;
    if (Object.keys(patch).length > 0) onUpdate(patch);
    setEditing(false);
  };

  if (!editing) {
    return (
      <div className="stat-card p-3 grid grid-cols-1 md:grid-cols-[1fr_auto_140px_auto_auto] gap-2 items-center">
        <div className="font-medium text-foreground truncate">{item.house}</div>
        <span className="rounded-sm px-3 py-1.5 text-xs font-medium bg-primary/15 text-primary border border-primary/30 w-fit">
          {item.account}
        </span>
        <div className="text-right font-semibold text-foreground tabular-nums">
          {Number(item.amount).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
        </div>
        <div className="text-xs text-muted-foreground whitespace-nowrap">
          {formatDateBRT(item.updated_at, { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })}
        </div>
        <div className="flex gap-1">
          <Button size="icon" variant="ghost" onClick={startEdit} title="Editar" className="h-8 w-8">
            <Pencil className="w-4 h-4" />
          </Button>
          <Button size="sm" variant="outline" onClick={onClose} title="Sacado / Fechar" className="gap-1">
            <Check className="w-4 h-4" /> Sacar
          </Button>
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button size="icon" variant="ghost" className="h-8 w-8 text-destructive" title="Excluir">
                <Trash2 className="w-4 h-4" />
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Excluir saldo?</AlertDialogTitle>
                <AlertDialogDescription>
                  Isto vai remover permanentemente <b>{item.house}</b> ({item.account}) —{' '}
                  {Number(item.amount).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}.
                  Esta ação não pode ser desfeita.
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
      </div>
    );
  }

  return (
    <div className="stat-card p-3 grid grid-cols-1 md:grid-cols-[1fr_auto_130px_170px_auto] gap-2 items-center border-primary/40">
      <ComboboxInput value={house} onChange={setHouse} suggestions={houses} placeholder="Casa" />
      <div className="grid grid-cols-2 gap-1 rounded-md border border-border bg-secondary p-1">
        {ACCOUNTS.map((opt) => (
          <button
            key={opt} type="button" onClick={() => setAccount(opt)}
            className={`rounded-sm px-3 py-1.5 text-xs font-medium transition-colors ${
              account === opt ? 'bg-primary text-primary-foreground shadow' : 'text-muted-foreground hover:bg-background/40'
            }`}
          >{opt}</button>
        ))}
      </div>
      <Input
        inputMode="decimal" value={amount}
        onChange={(e) => setAmount(e.target.value)}
        onKeyDown={(e) => { if (e.key === 'Enter') saveEdit(); }}
        className="bg-secondary text-right font-semibold"
      />
      <Input
        type="datetime-local" value={when}
        onChange={(e) => setWhen(e.target.value)}
        className="bg-secondary text-xs"
      />
      <div className="flex gap-1">
        <Button size="icon" variant="ghost" onClick={saveEdit} title="Salvar" className="h-8 w-8">
          <Check className="w-4 h-4 text-primary" />
        </Button>
        <Button size="icon" variant="ghost" onClick={cancelEdit} title="Cancelar" className="h-8 w-8">
          <X className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );
}

// datetime-local helpers using Brasília local (browser's local is assumed for input;
// we convert straight through since users edit in their local view).
function toLocalInput(iso: string): string {
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}
function fromLocalInput(local: string): string | null {
  if (!local) return null;
  const d = new Date(local);
  if (isNaN(d.getTime())) return null;
  return d.toISOString();
}