// Brasília timezone helpers (America/Sao_Paulo)
const BRT_TIMEZONE = 'America/Sao_Paulo';

/** Get current date/time in Brasília timezone */
export function nowBRT(): Date {
  return new Date(new Date().toLocaleString('en-US', { timeZone: BRT_TIMEZONE }));
}

/** Get today's date string (YYYY-MM-DD) in Brasília timezone */
export function todayBRT(): string {
  return new Date().toLocaleDateString('en-CA', { timeZone: BRT_TIMEZONE }); // en-CA gives YYYY-MM-DD
}

/** Get start of today in Brasília timezone as a Date object */
export function todayStartBRT(): Date {
  const d = nowBRT();
  return new Date(d.getFullYear(), d.getMonth(), d.getDate());
}

/** Get start of current month in Brasília timezone */
export function monthStartBRT(): Date {
  const d = nowBRT();
  return new Date(d.getFullYear(), d.getMonth(), 1);
}

/** Get start of current year in Brasília timezone */
export function yearStartBRT(): Date {
  const d = nowBRT();
  return new Date(d.getFullYear(), 0, 1);
}

/** Get current month key (YYYY-MM) in Brasília timezone */
export function monthKeyBRT(): string {
  const d = nowBRT();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
}

/** Convert a UTC date to Brasília timezone Date object for local calculations */
export function toBRT(date: Date | string): Date {
  const d = typeof date === 'string' ? new Date(date) : date;
  return new Date(d.toLocaleString('en-US', { timeZone: BRT_TIMEZONE }));
}

/** Get day of week (0=Sun) in Brasília timezone */
export function getDayBRT(date?: Date): number {
  return (date ? toBRT(date) : nowBRT()).getDay();
}

/** Get hour in Brasília timezone */
export function getHourBRT(date?: Date): number {
  return (date ? toBRT(date) : nowBRT()).getHours();
}

/** Get current time as HH:MM in Brasília timezone */
export function currentTimeBRT(): string {
  return new Date().toLocaleTimeString('en-GB', { timeZone: BRT_TIMEZONE, hour: '2-digit', minute: '2-digit' });
}

/** Get today's date string for storage key purposes (in BRT) */
export function todayDateStringBRT(): string {
  return nowBRT().toDateString();
}

/** Format a date to Brasília timezone for display */
export function formatDateBRT(date: Date | string, options?: Intl.DateTimeFormatOptions): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toLocaleString('pt-BR', { timeZone: BRT_TIMEZONE, ...options });
}

/** Compose a BRT date (YYYY-MM-DD) and time (HH:MM) into a UTC ISO string */
export function brtDateTimeToISO(dateStr: string, timeStr: string): string {
  const safeTime = /^\d{2}:\d{2}$/.test(timeStr) ? timeStr : '12:00';
  // America/Sao_Paulo is UTC-3 year-round (no DST since 2019)
  return new Date(`${dateStr}T${safeTime}:00-03:00`).toISOString();
}

/** Get current time in BRT as HH:MM (alias of currentTimeBRT, ensures HH:MM format) */
export function currentHHMMBRT(): string {
  return currentTimeBRT();
}
