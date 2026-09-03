import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { ArrowLeft, Plus, Trash2, Edit2, ListChecks } from 'lucide-react';
import { useDailyTasks, DailyTask, TaskInput } from '@/hooks/useDailyTasks';
import { ACCOUNTS, AccountName, EntryType, entryTypeLabels } from '@/types/casino';
import { useSharedLibrary } from '@/hooks/useSharedLibrary';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { formatDateBRT } from '@/lib/timezone';

const EMPTY: TaskInput = { title: '', description: '', house: '', entryType: '', accounts: [...ACCOUNTS], isActive: true };
const ENTRY_TYPES: EntryType[] = ['bonus', 'freespins', 'daily', 'bet', 'mission', 'aposte_ganhe'];

export default function DailyTasks() {
  const { tasks, addTask, updateTask, deleteTask, toggleCompletion, isDone } = useDailyTasks();
  const { houses } = useSharedLibrary();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<DailyTask | null>(null);
  const [form, setForm] = useState<TaskInput>(EMPTY);
  const [templateMode, setTemplateMode] = useState(true);

  const openNew = () => { setEditing(null); setForm(EMPTY); setTemplateMode(true); setOpen(true); };
  const openEdit = (t: DailyTask) => {
    setEditing(t);
    setForm({ title: t.title, description: t.description || '', house: t.house || '', entryType: t.entryType || '', accounts: t.accounts, isActive: t.isActive });
    setTemplateMode(Boolean(t.house && t.entryType));
    setOpen(true);
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    let payload: TaskInput = form;
    if (templateMode) {
      if (!form.house || !form.entryType || form.accounts.length === 0) return;
      const title = `${form.house} — ${entryTypeLabels[form.entryType as EntryType]}`;
      payload = { ...form, title };
    } else {
      if (!form.title.trim() || form.accounts.length === 0) return;
    }
    if (editing) await updateTask(editing.id, payload);
    else await addTask(payload);
    setOpen(false);
  };

  const toggleAccount = (a: AccountName) => {
    setForm(f => ({ ...f, accounts: f.accounts.includes(a) ? f.accounts.filter(x => x !== a) : [...f.accounts, a] }));
  };

  const progress = useMemo(() => {
    let total = 0, done = 0;
    tasks.filter(t => t.isActive).forEach(t => t.accounts.forEach(a => { total++; if (isDone(t.id, a)) done++; }));
    return { total, done, pct: total ? Math.round((done / total) * 100) : 0 };
  }, [tasks, isDone]);

  return (
    <div className="min-h-screen bg-background">
      <header className="glass-card border-b border-border sticky top-0 z-40">
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <Link to="/"><Button variant="ghost" size="icon"><ArrowLeft className="w-4 h-4" /></Button></Link>
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-lg bg-primary/20"><ListChecks className="w-5 h-5 text-primary" /></div>
              <div>
                <h1 className="text-lg font-bold">Tarefas Diárias</h1>
                <p className="text-xs text-muted-foreground capitalize">{formatDateBRT(new Date(), { weekday: 'long', day: '2-digit', month: 'long' })}</p>
              </div>
            </div>
          </div>
          <Button onClick={openNew} className="gap-2"><Plus className="w-4 h-4" /> Nova</Button>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-6 space-y-4">
        <div className="stat-card">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-muted-foreground">Progresso do dia</span>
            <span className="text-sm font-semibold">{progress.done}/{progress.total} ({progress.pct}%)</span>
          </div>
          <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
            <div className="h-full bg-primary transition-all" style={{ width: `${progress.pct}%` }} />
          </div>
          <p className="text-xs text-muted-foreground mt-2">As marcações reiniciam automaticamente a cada dia (fuso Brasília).</p>
        </div>

        {tasks.length === 0 && (
          <div className="stat-card text-center py-12 text-muted-foreground">
            Nenhuma tarefa ainda. Clique em <b>Nova</b> para começar.
          </div>
        )}

        <div className="grid gap-4 md:grid-cols-2">
          {ACCOUNTS.map(account => {
            const accountTasks = tasks.filter(t => t.accounts.includes(account));
            const activeTasks = accountTasks.filter(t => t.isActive);
            const doneCount = activeTasks.filter(t => isDone(t.id, account)).length;
            return (
              <section key={account} className="stat-card">
                <div className="flex items-center justify-between mb-3 pb-2 border-b border-border">
                  <h2 className="text-base font-bold">{account}</h2>
                  <span className="text-xs text-muted-foreground">
                    {doneCount}/{activeTasks.length}
                  </span>
                </div>
                {accountTasks.length === 0 ? (
                  <p className="text-xs text-muted-foreground py-4 text-center">Sem tarefas para esta conta.</p>
                ) : (
                  <ul className="space-y-1">
                    {accountTasks.map(t => {
                      const done = isDone(t.id, account);
                      const primary = t.house || t.title;
                      const meta = [
                        t.entryType ? entryTypeLabels[t.entryType] : null,
                        t.description || null,
                      ].filter(Boolean).join(' · ');
                      return (
                        <li
                          key={t.id}
                          className={`group flex items-start gap-2 rounded-md px-2 py-1.5 hover:bg-muted/40 transition-colors ${
                            !t.isActive ? 'opacity-50' : ''
                          }`}
                        >
                          <Checkbox
                            checked={done}
                            onCheckedChange={() => toggleCompletion(t.id, account)}
                            className="mt-0.5"
                          />
                          <button
                            type="button"
                            onClick={() => toggleCompletion(t.id, account)}
                            className="flex-1 min-w-0 text-left"
                          >
                            <div className={`text-sm font-medium truncate ${done ? 'line-through text-muted-foreground' : ''}`}>
                              {primary}
                            </div>
                            {meta && (
                              <div className="text-[11px] text-muted-foreground truncate">{meta}</div>
                            )}
                          </button>
                          <div className="flex opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                            <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => openEdit(t)}>
                              <Edit2 className="w-3 h-3" />
                            </Button>
                            <Button variant="ghost" size="icon" className="h-6 w-6 text-destructive" onClick={() => deleteTask(t.id)}>
                              <Trash2 className="w-3 h-3" />
                            </Button>
                          </div>
                        </li>
                      );
                    })}
                  </ul>
                )}
              </section>
            );
          })}
        </div>
      </main>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader><DialogTitle>{editing ? 'Editar Tarefa' : 'Nova Tarefa'}</DialogTitle></DialogHeader>
          <form onSubmit={submit} className="space-y-4">
            <div className="flex items-center justify-between rounded-lg border border-border p-3">
              <div>
                <Label className="text-sm">Usar modelo (Casa + Tipo)</Label>
                <p className="text-xs text-muted-foreground">Monta o título automaticamente a partir da biblioteca.</p>
              </div>
              <Switch checked={templateMode} onCheckedChange={setTemplateMode} />
            </div>

            {templateMode ? (
              <>
                <div className="space-y-2">
                  <Label>Casa</Label>
                  <Select value={form.house || ''} onValueChange={v => setForm({ ...form, house: v })}>
                    <SelectTrigger><SelectValue placeholder="Selecione uma casa" /></SelectTrigger>
                    <SelectContent>
                      {houses.length === 0 && <div className="px-3 py-2 text-xs text-muted-foreground">Nenhuma casa na biblioteca ainda.</div>}
                      {houses.map(h => <SelectItem key={h} value={h}>{h}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Tipo</Label>
                  <Select value={form.entryType || ''} onValueChange={v => setForm({ ...form, entryType: v as EntryType })}>
                    <SelectTrigger><SelectValue placeholder="Selecione um tipo" /></SelectTrigger>
                    <SelectContent>
                      {ENTRY_TYPES.map(t => <SelectItem key={t} value={t}>{entryTypeLabels[t]}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              </>
            ) : (
              <>
                <div className="space-y-2">
                  <Label>Título</Label>
                  <Input value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} placeholder="Ex: Resgatar rodadas grátis" required />
                </div>
                <div className="space-y-2">
                  <Label>Casa (opcional)</Label>
                  <Input value={form.house || ''} onChange={e => setForm({ ...form, house: e.target.value })} placeholder="Ex: Vai de Bet" />
                </div>
              </>
            )}

            <div className="space-y-2">
              <Label>Descrição (opcional)</Label>
              <Textarea rows={2} value={form.description || ''} onChange={e => setForm({ ...form, description: e.target.value })} placeholder="Passos, valores, observações..." />
            </div>
            <div className="space-y-2">
              <Label>Contas</Label>
              <div className="flex gap-2">
                {ACCOUNTS.map(a => (
                  <button
                    key={a}
                    type="button"
                    onClick={() => toggleAccount(a)}
                    className={`flex-1 py-2 rounded-lg border-2 text-sm transition-colors ${
                      form.accounts.includes(a) ? 'bg-primary/20 border-primary text-primary' : 'border-border'
                    }`}
                  >{a}</button>
                ))}
              </div>
            </div>
            <div className="flex gap-2 pt-2">
              <Button type="button" variant="outline" className="flex-1" onClick={() => setOpen(false)}>Cancelar</Button>
              <Button type="submit" className="flex-1">{editing ? 'Salvar' : 'Criar'}</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}