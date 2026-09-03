import { useEffect, useRef, useCallback } from 'react';
import { CasinoReminder } from '@/types/casino';
import { sendBrowserNotification } from '@/lib/notifications';
import { nowBRT, getDayBRT, currentTimeBRT, todayDateStringBRT } from '@/lib/timezone';

const STORAGE_KEY = 'notified_reminders';
const CHECK_INTERVAL = 30000; // 30 seconds

const getNotifiedToday = (): Set<string> => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) return new Set();
    
    const { date, ids } = JSON.parse(stored);
    const today = todayDateStringBRT();
    
    if (date !== today) {
      localStorage.removeItem(STORAGE_KEY);
      return new Set();
    }
    
    return new Set(ids);
  } catch {
    return new Set();
  }
};

const markAsNotified = (reminderId: string) => {
  const notified = getNotifiedToday();
  notified.add(reminderId);
  
  localStorage.setItem(STORAGE_KEY, JSON.stringify({
    date: todayDateStringBRT(),
    ids: Array.from(notified),
  }));
};

export const useNotificationScheduler = (reminders: CasinoReminder[], enabled: boolean) => {
  const intervalRef = useRef<number | null>(null);
  const lastCheckRef = useRef<string>('');

  const checkReminders = useCallback(() => {
    if (!enabled || reminders.length === 0) return;

    const currentDay = getDayBRT();
    const currentTime = currentTimeBRT();
    
    // Avoid checking the same minute multiple times
    const checkKey = `${currentDay}-${currentTime}`;
    if (lastCheckRef.current === checkKey) return;
    lastCheckRef.current = checkKey;

    const notifiedToday = getNotifiedToday();

    reminders.forEach(reminder => {
      if (!reminder.isActive) return;
      if (!reminder.daysOfWeek.includes(currentDay)) return;
      if (reminder.reminderTime !== currentTime) return;
      if (notifiedToday.has(reminder.id)) return;

      // Fire notification
      sendBrowserNotification(reminder);
      markAsNotified(reminder.id);
    });
  }, [reminders, enabled]);

  useEffect(() => {
    if (!enabled) {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      return;
    }

    // Check immediately on mount
    checkReminders();

    // Set up interval
    intervalRef.current = window.setInterval(checkReminders, CHECK_INTERVAL);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [checkReminders, enabled]);

  return { checkReminders };
};
