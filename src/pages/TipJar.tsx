import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import {
  PiggyBank,
  ArrowLeft,
  Plus,
  Minus,
  Trash2,
  Loader2,
  TrendingUp,
  TrendingDown,
  Sun,
  Moon,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useTipJar } from '@/hooks/useTipJar';
import { useTheme } from '@/hooks/useTheme';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

const TipJar = () => {
  const { user } = useAuth();
  const { entries, loading, balance, addExpense, deleteEntry } = useTipJar();
  const { theme, toggleTheme } = useTheme();

  const [expenseAmount, setExpenseAmount] = useState('');
  const [expenseDescription, setExpenseDescription] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleExpenseSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const num = parseFloat(expenseAmount.replace(',', '.'));
    if (!num || num <= 0) {
      toast.error('Digite um valor válido');
      return;
    }
    if (!expenseDescription.trim()) {
      toast.error('Digite uma descrição');
      return;
    }
    setSubmitting(true);
    await addExpense(num, expenseDescription.trim());
    setExpenseAmount('');
    setExpenseDescription('');
    setSubmitting(false);
    toast.success('Gasto registrado no Tip Jar!');
  };

  const handleDelete = async (id: string) => {
    await deleteEntry(id);
    toast.success('Entrada removida');
  };

  if (!user) return null;

  const fmt = (v: number) => v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Link to="/">
                <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-foreground">
                  <ArrowLeft className="w-5 h-5" />
                </Button>
              </Link>
              <div className="p-2 rounded-lg bg-primary/20">
                <PiggyBank className="w-6 h-6 text-primary" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-foreground">Tip Jar</h1>
                <p className="text-sm text-muted-foreground">Restos para apostas e promoções</p>
              </div>
            </div>
            <Button variant="ghost" size="icon" onClick={toggleTheme} className="text-muted-foreground hover:text-foreground">
              {theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 max-w-2xl space-y-6">

        {/* Balance Card */}
        <div className={`stat-card text-center py-8 ${balance >= 0 ? 'border-green-500/30' : 'border-red-500/30'} border`}>
          <div className={`inline-flex items-center gap-2 text-sm font-medium mb-2 ${balance >= 0 ? 'text-green-500' : 'text-destructive'}`}>
            <PiggyBank className="w-4 h-4" />
            Saldo Tip Jar
          </div>
          <p className={`text-4xl font-bold ${balance >= 0 ? 'text-green-400' : 'text-destructive'}`}>
            {fmt(balance)}
          </p>
          <p className="text-xs text-muted-foreground mt-2">
            Valores acumulados após atingir a meta diária
          </p>
        </div>

        {/* Expense Form */}
        <form onSubmit={handleExpenseSubmit} className="stat-card space-y-4">
          <h3 className="text-base font-semibold text-foreground flex items-center gap-2">
            <Minus className="w-4 h-4 text-destructive" />
            Registrar Gasto
          </h3>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label className="text-muted-foreground text-xs">Valor (R$)</Label>
              <Input
                type="text"
                placeholder="0,00"
                value={expenseAmount}
                onChange={e => setExpenseAmount(e.target.value)}
                className="bg-secondary border-border text-foreground"
              />
            </div>
            <div className="space-y-1">
              <Label className="text-muted-foreground text-xs">Descrição</Label>
              <Input
                type="text"
                placeholder="Ex: Aposta bônus"
                value={expenseDescription}
                onChange={e => setExpenseDescription(e.target.value)}
                className="bg-secondary border-border text-foreground"
              />
            </div>
          </div>
          <Button
            type="submit"
            disabled={submitting}
            className="w-full bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            {submitting ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Minus className="w-4 h-4 mr-2" />}
            Registrar Gasto
          </Button>
        </form>

        {/* History */}
        <div className="stat-card space-y-3">
          <h3 className="text-base font-semibold text-foreground flex items-center gap-2">
            <PiggyBank className="w-4 h-4 text-primary" />
            Histórico
          </h3>

          {loading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="w-6 h-6 animate-spin text-primary" />
            </div>
          ) : entries.length === 0 ? (
            <div className="text-center py-10 text-muted-foreground">
              <PiggyBank className="w-10 h-10 mx-auto mb-3 opacity-30" />
              <p className="text-sm">Nenhuma movimentação ainda.</p>
              <p className="text-xs mt-1">Os restos das entradas após a meta diária aparecerão aqui.</p>
            </div>
          ) : (
            <div className="space-y-2 max-h-[420px] overflow-y-auto pr-1">
              {entries.map(entry => (
                <div
                  key={entry.id}
                  className={`flex items-center justify-between p-3 rounded-lg border ${
                    entry.amount >= 0
                      ? 'bg-green-500/5 border-green-500/20'
                      : 'bg-destructive/5 border-destructive/20'
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className={`p-1.5 rounded-full flex-shrink-0 ${entry.amount >= 0 ? 'bg-green-500/20' : 'bg-destructive/20'}`}>
                      {entry.amount >= 0
                        ? <TrendingUp className="w-3 h-3 text-green-500" />
                        : <TrendingDown className="w-3 h-3 text-destructive" />
                      }
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-foreground truncate">
                        {entry.description || (entry.amount >= 0 ? 'Resto de entrada' : 'Gasto')}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {format(entry.createdAt, "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <span className={`text-sm font-bold ${entry.amount >= 0 ? 'text-green-400' : 'text-destructive'}`}>
                      {entry.amount >= 0 ? '+' : ''}{fmt(entry.amount)}
                    </span>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7 text-muted-foreground hover:text-destructive"
                      onClick={() => handleDelete(entry.id)}
                    >
                      <Trash2 className="w-3 h-3" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default TipJar;
