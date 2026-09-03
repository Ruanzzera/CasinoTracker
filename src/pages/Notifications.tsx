import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { Bell, Plus, ArrowLeft, Loader2, BellOff, CheckCircle, Clock, TestTube } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useReminders } from '@/hooks/useReminders';
import { ReminderCard } from '@/components/ReminderCard';
import { ReminderForm } from '@/components/ReminderForm';
import { CasinoReminder, weekDays } from '@/types/casino';
import { requestNotificationPermission, testNotification, getNotificationPermission } from '@/lib/notifications';
import { useNotificationContext } from '@/components/NotificationProvider';

const Notifications = () => {
  const { user } = useAuth();
  const { reminders, loading, houses, addReminder, updateReminder, deleteReminder, toggleReminder, getTodayReminders } = useReminders();
  const [formOpen, setFormOpen] = useState(false);
  const [editingReminder, setEditingReminder] = useState<CasinoReminder | null>(null);
  const [notificationPermission, setNotificationPermission] = useState<NotificationPermission>('default');
  const { isSchedulerActive } = useNotificationContext();

  useEffect(() => {
    setNotificationPermission(getNotificationPermission());
  }, []);

  const handleRequestPermission = async () => {
    const permission = await requestNotificationPermission();
    setNotificationPermission(permission);
  };

  const handleTestNotification = () => {
    testNotification();
  };

  const handleEdit = (reminder: CasinoReminder) => {
    setEditingReminder(reminder);
    setFormOpen(true);
  };

  const handleFormSubmit = async (data: Omit<CasinoReminder, 'id' | 'userId' | 'createdAt'>) => {
    if (editingReminder) {
      await updateReminder(editingReminder.id, data);
    } else {
      await addReminder(data);
    }
    setEditingReminder(null);
  };

  const handleFormCancel = () => {
    setEditingReminder(null);
  };

  if (!user) return null;

  const activeReminders = reminders.filter(r => r.isActive);
  const inactiveReminders = reminders.filter(r => !r.isActive);

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Link to="/">
                <Button variant="ghost" size="icon">
                  <ArrowLeft className="w-5 h-5" />
                </Button>
              </Link>
              <div className="p-2 rounded-lg bg-primary/20">
                <Bell className="w-6 h-6 text-primary" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-foreground">Notificações</h1>
                <p className="text-sm text-muted-foreground">Gerencie seus lembretes</p>
              </div>
            </div>
            <Button onClick={() => setFormOpen(true)} className="gap-2">
              <Plus className="w-4 h-4" />
              Novo Lembrete
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 max-w-2xl">

        {/* Notification Status */}
        {notificationPermission === 'granted' ? (
          <div className="stat-card mb-6 flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <CheckCircle className="w-5 h-5 text-primary" />
              <div>
                <p className="font-medium text-foreground">Notificações ativas</p>
                <p className="text-sm text-muted-foreground">
                  {isSchedulerActive ? 'Monitorando lembretes' : 'Aguardando autenticação'}
                </p>
              </div>
            </div>
            <Button variant="outline" size="sm" onClick={handleTestNotification} className="gap-2">
              <TestTube className="w-4 h-4" />
              Testar
            </Button>
          </div>
        ) : (
          <div className="stat-card mb-6 flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <BellOff className="w-5 h-5 text-muted-foreground" />
              <div>
                <p className="font-medium text-foreground">Ativar notificações</p>
                <p className="text-sm text-muted-foreground">Receba alertas no navegador</p>
              </div>
            </div>
            <Button variant="outline" size="sm" onClick={handleRequestPermission}>
              Ativar
            </Button>
          </div>
        )}

        {/* Today's Reminders */}
        {getTodayReminders().length > 0 && (
          <div className="stat-card mb-6">
            <div className="flex items-center gap-2 mb-3">
              <Clock className="w-4 h-4 text-primary" />
              <h3 className="font-medium text-foreground">Lembretes de hoje</h3>
            </div>
            <div className="space-y-2">
              {getTodayReminders()
                .sort((a, b) => a.reminderTime.localeCompare(b.reminderTime))
                .map((reminder) => (
                  <div key={reminder.id} className="flex items-center justify-between py-2 border-b border-border last:border-0">
                    <div className="flex items-center gap-3">
                      <span className="text-sm font-mono text-primary">{reminder.reminderTime}</span>
                      <span className="text-sm text-foreground">{reminder.house}</span>
                    </div>
                    <span className="text-sm text-muted-foreground">{reminder.title}</span>
                  </div>
                ))}
            </div>
          </div>
        )}

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        ) : reminders.length === 0 ? (
          <div className="stat-card flex flex-col items-center justify-center py-16 text-center">
            <div className="p-4 rounded-full bg-primary/10 mb-4">
              <Bell className="w-10 h-10 text-primary" />
            </div>
            <h3 className="text-xl font-semibold text-foreground mb-2">
              Nenhum lembrete ainda
            </h3>
            <p className="text-muted-foreground max-w-sm mb-4">
              Crie lembretes para não perder missões e bônus diários dos seus casinos favoritos.
            </p>
            <Button onClick={() => setFormOpen(true)} className="gap-2">
              <Plus className="w-4 h-4" />
              Criar primeiro lembrete
            </Button>
          </div>
        ) : (
          <div className="space-y-6">
            {activeReminders.length > 0 && (
              <div>
                <h2 className="text-sm font-medium text-muted-foreground mb-3">
                  Ativos ({activeReminders.length})
                </h2>
                <div className="space-y-3">
                  {activeReminders.map((reminder) => (
                    <ReminderCard
                      key={reminder.id}
                      reminder={reminder}
                      onToggle={toggleReminder}
                      onEdit={handleEdit}
                      onDelete={deleteReminder}
                    />
                  ))}
                </div>
              </div>
            )}

            {inactiveReminders.length > 0 && (
              <div>
                <h2 className="text-sm font-medium text-muted-foreground mb-3">
                  Inativos ({inactiveReminders.length})
                </h2>
                <div className="space-y-3">
                  {inactiveReminders.map((reminder) => (
                    <ReminderCard
                      key={reminder.id}
                      reminder={reminder}
                      onToggle={toggleReminder}
                      onEdit={handleEdit}
                      onDelete={deleteReminder}
                    />
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </main>

      <ReminderForm
        houses={houses}
        onSubmit={handleFormSubmit}
        editingReminder={editingReminder}
        onCancel={handleFormCancel}
        open={formOpen}
        onOpenChange={setFormOpen}
      />
    </div>
  );
};

export default Notifications;
