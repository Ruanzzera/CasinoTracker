import { todayDateStringBRT } from './timezone';

const ACK_KEY = 'acked_reminders';
const EVENT = 'reminder-ack-changed';

interface AckStore { date: string; ids: string[] }

export const getAckedToday = (): Set<string> => {
  try {
    const raw = localStorage.getItem(ACK_KEY);
    if (!raw) return new Set();
    const parsed: AckStore = JSON.parse(raw);
    if (parsed.date !== todayDateStringBRT()) {
      localStorage.removeItem(ACK_KEY);
      return new Set();
    }
    return new Set(parsed.ids);
  } catch {
    return new Set();
  }
};

export const ackReminder = (id: string) => {
  const set = getAckedToday();
  set.add(id);
  localStorage.setItem(ACK_KEY, JSON.stringify({
    date: todayDateStringBRT(),
    ids: Array.from(set),
  }));
  window.dispatchEvent(new CustomEvent(EVENT));
};

export const ackAll = (ids: string[]) => {
  const set = getAckedToday();
  ids.forEach(i => set.add(i));
  localStorage.setItem(ACK_KEY, JSON.stringify({
    date: todayDateStringBRT(),
    ids: Array.from(set),
  }));
  window.dispatchEvent(new CustomEvent(EVENT));
};

export const subscribeAck = (cb: () => void) => {
  const handler = () => cb();
  window.addEventListener(EVENT, handler);
  window.addEventListener('storage', handler);
  return () => {
    window.removeEventListener(EVENT, handler);
    window.removeEventListener('storage', handler);
  };
};