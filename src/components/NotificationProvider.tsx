import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useReminders } from '@/hooks/useReminders';
import { useNotificationScheduler } from '@/hooks/useNotificationScheduler';
import { getNotificationPermission } from '@/lib/notifications';
import { supabase } from '@/integrations/supabase/client';
import { PendingRemindersPopup } from './PendingRemindersPopup';

interface NotificationContextType {
  permission: NotificationPermission;
  todayRemindersCount: number;
  isSchedulerActive: boolean;
}

const NotificationContext = createContext<NotificationContextType>({
  permission: 'default',
  todayRemindersCount: 0,
  isSchedulerActive: false,
});

export const useNotificationContext = () => useContext(NotificationContext);

interface NotificationProviderProps {
  children: ReactNode;
}

export const NotificationProvider = ({ children }: NotificationProviderProps) => {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [permission, setPermission] = useState<NotificationPermission>('default');
  const { reminders, getTodayReminders } = useReminders();

  // Check auth state
  useEffect(() => {
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setIsLoggedIn(!!session);
    };

    checkAuth();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_, session) => {
      setIsLoggedIn(!!session);
    });

    return () => subscription.unsubscribe();
  }, []);

  // Check notification permission
  useEffect(() => {
    setPermission(getNotificationPermission());

    // Listen for permission changes
    const handleVisibilityChange = () => {
      if (!document.hidden) {
        setPermission(getNotificationPermission());
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, []);

  const isSchedulerActive = isLoggedIn && permission === 'granted';
  
  // Use the scheduler
  useNotificationScheduler(reminders, isSchedulerActive);

  const todayReminders = getTodayReminders();

  return (
    <NotificationContext.Provider
      value={{
        permission,
        todayRemindersCount: todayReminders.length,
        isSchedulerActive,
      }}
    >
      {isLoggedIn && <PendingRemindersPopup enabled={isLoggedIn} />}
      {children}
    </NotificationContext.Provider>
  );
};
