import { useState, useEffect } from 'react';
import { CasinoReminder, weekDays } from '@/types/casino';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Plus, Save } from 'lucide-react';

interface ReminderFormProps {
  houses: string[];
  onSubmit: (reminder: Omit<CasinoReminder, 'id' | 'userId' | 'createdAt'>) => void;
  editingReminder?: CasinoReminder | null;
  onCancel?: () => void;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const ReminderForm = ({ houses, onSubmit, editingReminder, onCancel, open, onOpenChange }: ReminderFormProps) => {
  const [title, setTitle] = useState('');
  const [house, setHouse] = useState('');
  const [customHouse, setCustomHouse] = useState('');
  const [description, setDescription] = useState('');
  const [selectedDays, setSelectedDays] = useState<number[]>([]);
  const [time, setTime] = useState('10:00');

  useEffect(() => {
    if (editingReminder) {
      setTitle(editingReminder.title);
      setHouse(houses.includes(editingReminder.house) ? editingReminder.house : 'custom');
      setCustomHouse(houses.includes(editingReminder.house) ? '' : editingReminder.house);
      setDescription(editingReminder.description || '');
      setSelectedDays(editingReminder.daysOfWeek);
      setTime(editingReminder.reminderTime.slice(0, 5));
    } else {
      resetForm();
    }
  }, [editingReminder, houses]);

  const resetForm = () => {
    setTitle('');
    setHouse('');
    setCustomHouse('');
    setDescription('');
    setSelectedDays([]);
    setTime('10:00');
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const finalHouse = house === 'custom' ? customHouse : house;
    
    if (!title.trim() || !finalHouse.trim() || selectedDays.length === 0) {
      return;
    }

    onSubmit({
      title: title.trim(),
      house: finalHouse.trim(),
      description: description.trim() || undefined,
      daysOfWeek: selectedDays,
      reminderTime: time + ':00',
      isActive: true,
    });

    resetForm();
    onOpenChange(false);
  };

  const toggleDay = (day: number) => {
    setSelectedDays(prev => 
      prev.includes(day) ? prev.filter(d => d !== day) : [...prev, day]
    );
  };

  const selectAllDays = () => {
    setSelectedDays([0, 1, 2, 3, 4, 5, 6]);
  };

  const selectWeekDays = () => {
    setSelectedDays([1, 2, 3, 4, 5]);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{editingReminder ? 'Editar Lembrete' : 'Novo Lembrete'}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="title">Título</Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Ex: Missão diária"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="house">Casa</Label>
            <Select value={house} onValueChange={setHouse}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione a casa" />
              </SelectTrigger>
              <SelectContent>
                {houses.map((h) => (
                  <SelectItem key={h} value={h}>{h}</SelectItem>
                ))}
                <SelectItem value="custom">Outra...</SelectItem>
              </SelectContent>
            </Select>
            {house === 'custom' && (
              <Input
                value={customHouse}
                onChange={(e) => setCustomHouse(e.target.value)}
                placeholder="Nome da casa"
                className="mt-2"
              />
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="time">Horário</Label>
            <Input
              id="time"
              type="time"
              value={time}
              onChange={(e) => setTime(e.target.value)}
              required
            />
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label>Dias da semana</Label>
              <div className="flex gap-2">
                <Button type="button" variant="ghost" size="sm" onClick={selectWeekDays}>
                  Semana
                </Button>
                <Button type="button" variant="ghost" size="sm" onClick={selectAllDays}>
                  Todos
                </Button>
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              {weekDays.map((day) => (
                <label
                  key={day.value}
                  className={`flex items-center justify-center w-10 h-10 rounded-full cursor-pointer transition-colors border-2 ${
                    selectedDays.includes(day.value)
                      ? 'bg-primary text-primary-foreground border-primary'
                      : 'border-border hover:border-primary/50'
                  }`}
                >
                  <Checkbox
                    checked={selectedDays.includes(day.value)}
                    onCheckedChange={() => toggleDay(day.value)}
                    className="sr-only"
                  />
                  <span className="text-xs font-medium">{day.label}</span>
                </label>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Descrição (opcional)</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Detalhes da missão..."
              rows={2}
            />
          </div>

          <div className="flex gap-2 pt-2">
            <Button type="button" variant="outline" className="flex-1" onClick={() => {
              onOpenChange(false);
              onCancel?.();
            }}>
              Cancelar
            </Button>
            <Button type="submit" className="flex-1 gap-2">
              {editingReminder ? <Save className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
              {editingReminder ? 'Salvar' : 'Criar'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
