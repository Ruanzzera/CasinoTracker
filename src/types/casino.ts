export type EntryType = 'bonus' | 'freespins' | 'daily' | 'bet' | 'mission' | 'aposte_ganhe' | 'torneio';

export type AccountName = 'Ruan' | 'Rita';
export const ACCOUNTS: AccountName[] = ['Ruan', 'Rita'];

export interface CasinoEntry {
  id: string;
  amount: number;
  type: EntryType;
  house: string;
  game: string;
  notes?: string;
  account: AccountName;
  createdAt: Date;
}

export interface CasinoGoal {
  id: string;
  type: 'daily' | 'monthly';
  targetAmount: number;
}

export interface Statistics {
  totalProfit: number;
  dailyTotal: number;
  monthlyTotal: number;
  yearlyTotal: number;
  bestType: { type: EntryType; total: number } | null;
  bestHouse: { house: string; total: number } | null;
  bestGame: { game: string; total: number } | null;
  bestHour: { hour: number; total: number } | null;
  highestEntry: CasinoEntry | null;
  entriesCount: number;
}

export const entryTypeLabels: Record<EntryType, string> = {
  bonus: 'Bônus',
  freespins: 'Free Spins',
  daily: 'Giros Diários',
  bet: 'Aposta',
  mission: 'Missão',
  aposte_ganhe: 'Aposte e Ganhe',
  torneio: 'Torneio',
};

export const entryTypeColors: Record<EntryType, string> = {
  bonus: '#22c55e',
  freespins: '#f59e0b',
  daily: '#3b82f6',
  bet: '#ec4899',
  mission: '#8b5cf6',
  aposte_ganhe: '#10b981',
  torneio: '#eab308',
};

export interface CasinoReminder {
  id: string;
  userId: string;
  house: string;
  title: string;
  description?: string;
  daysOfWeek: number[];
  reminderTime: string;
  isActive: boolean;
  createdAt: Date;
}

export const weekDays = [
  { value: 0, label: 'Dom' },
  { value: 1, label: 'Seg' },
  { value: 2, label: 'Ter' },
  { value: 3, label: 'Qua' },
  { value: 4, label: 'Qui' },
  { value: 5, label: 'Sex' },
  { value: 6, label: 'Sáb' },
];
