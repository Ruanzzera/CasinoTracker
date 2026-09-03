import { CasinoReminder } from '@/types/casino';
import { toast } from 'sonner';

export const requestNotificationPermission = async (): Promise<NotificationPermission> => {
  if (!('Notification' in window)) {
    toast.error('Seu navegador não suporta notificações');
    return 'denied';
  }

  const permission = await Notification.requestPermission();
  
  if (permission === 'granted') {
    toast.success('Notificações ativadas!');
  } else if (permission === 'denied') {
    toast.error('Notificações bloqueadas. Ative nas configurações do navegador.');
  }
  
  return permission;
};

export const sendBrowserNotification = (reminder: CasinoReminder): boolean => {
  if (!('Notification' in window)) {
    showFallbackToast(reminder);
    return false;
  }

  if (Notification.permission !== 'granted') {
    showFallbackToast(reminder);
    return false;
  }

  try {
    const notification = new Notification(`🎰 ${reminder.house}`, {
      body: reminder.title + (reminder.description ? `\n${reminder.description}` : ''),
      icon: '/favicon.ico',
      tag: reminder.id,
      requireInteraction: true,
    });

    notification.onclick = () => {
      window.focus();
      notification.close();
    };

    return true;
  } catch (error) {
    console.error('Error sending notification:', error);
    showFallbackToast(reminder);
    return false;
  }
};

const showFallbackToast = (reminder: CasinoReminder) => {
  toast(`🎰 ${reminder.house}`, {
    description: reminder.title,
    duration: 10000,
    action: {
      label: 'OK',
      onClick: () => {},
    },
  });
};

export const getNotificationPermission = (): NotificationPermission => {
  if (!('Notification' in window)) {
    return 'denied';
  }
  return Notification.permission;
};

export const testNotification = () => {
  if (Notification.permission === 'granted') {
    new Notification('🎰 Teste de Notificação', {
      body: 'As notificações estão funcionando corretamente!',
      icon: '/favicon.ico',
      requireInteraction: false,
    });
    return true;
  } else {
    toast.info('Teste de notificação', {
      description: 'As notificações estão funcionando! (via toast)',
    });
    return false;
  }
};
