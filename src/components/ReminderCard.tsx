import { CasinoReminder, weekDays } from '@/types/casino';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Building2, Clock, Trash2, Edit2 } from 'lucide-react';

interface ReminderCardProps {
  reminder: CasinoReminder;
  onToggle: (id: string) => void;
  onEdit: (reminder: CasinoReminder) => void;
  onDelete: (id: string) => void;
}

export const ReminderCard = ({ reminder, onToggle, onEdit, onDelete }: ReminderCardProps) => {
  const getDaysLabel = () => {
    if (reminder.daysOfWeek.length === 7) return 'Todos os dias';
    if (reminder.daysOfWeek.length === 0) return 'Nenhum dia';
    return reminder.daysOfWeek
      .sort((a, b) => a - b)
      .map(d => weekDays.find(w => w.value === d)?.label)
      .join(', ');
  };

  return (
    <div className={`stat-card transition-opacity ${!reminder.isActive ? 'opacity-50' : ''}`}>
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <Building2 className="w-4 h-4 text-primary shrink-0" />
            <span className="text-sm text-muted-foreground truncate">{reminder.house}</span>
          </div>
          <h3 className="font-semibold text-foreground truncate">{reminder.title}</h3>
          {reminder.description && (
            <p className="text-sm text-muted-foreground mt-1 line-clamp-2">{reminder.description}</p>
          )}
          <div className="flex items-center gap-4 mt-3 text-sm">
            <div className="flex items-center gap-1.5 text-muted-foreground">
              <Clock className="w-3.5 h-3.5" />
              <span>{reminder.reminderTime.slice(0, 5)}</span>
            </div>
            <span className="text-muted-foreground">•</span>
            <span className="text-muted-foreground">{getDaysLabel()}</span>
          </div>
        </div>
        <div className="flex flex-col items-end gap-2">
          <Switch
            checked={reminder.isActive}
            onCheckedChange={() => onToggle(reminder.id)}
          />
          <div className="flex gap-1">
            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => onEdit(reminder)}>
              <Edit2 className="w-4 h-4" />
            </Button>
            <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:text-destructive" onClick={() => onDelete(reminder.id)}>
              <Trash2 className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};
