import { useMemo } from 'react';
import { Trophy, Bell, Calendar } from 'lucide-react';
import { useReminders } from '@/hooks/useReminders';
import { useTournaments } from '@/hooks/useTournaments';
import { useTournamentSchedule, getNextOccurrence, formatScheduleLabel } from '@/hooks/useTournamentSchedule';
import { getDayBRT, nowBRT } from '@/lib/timezone';

interface TickerItem {
  icon: 'bell' | 'trophy' | 'calendar';
  text: string;
}

export function NewsTicker() {
  const { reminders } = useReminders();
  const { tournaments } = useTournaments();
  const { getUpcomingEvents } = useTournamentSchedule();

  const tickerItems = useMemo<TickerItem[]>(() => {
    const items: TickerItem[] = [];
    const todayDow = getDayBRT();

    // Today's reminders
    reminders
      .filter(r => r.isActive && r.daysOfWeek.includes(todayDow))
      .forEach(r => {
        items.push({
          icon: 'bell',
          text: `🔔 ${r.title} — ${r.house} às ${r.reminderTime?.slice(0, 5) || ''}`,
        });
      });

    // Tournaments closing within 3 days
    const now = nowBRT();
    const limit = new Date(now);
    limit.setDate(limit.getDate() + 3);
    tournaments
      .filter(t => !t.finalizedMonth)
      .forEach(t => {
        const endDate = new Date(t.endDate + 'T23:59:59');
        if (endDate >= now && endDate <= limit) {
          const daysLeft = Math.ceil((endDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
          const label = daysLeft <= 0 ? 'HOJE' : daysLeft === 1 ? 'AMANHÃ' : `em ${daysLeft} dias`;
          items.push({
            icon: 'trophy',
            text: `🏆 Torneio "${t.name || t.house}" fecha ${label}`,
          });
        }
      });

    // Upcoming scheduled events
    getUpcomingEvents(3).forEach(({ item }) => {
      const label = formatScheduleLabel(item);
      items.push({
        icon: 'calendar',
        text: `📅 ${item.name || item.house} — ${label}`,
      });
    });

    return items;
  }, [reminders, tournaments, getUpcomingEvents]);

  if (tickerItems.length === 0) return null;

  const IconMap = { bell: Bell, trophy: Trophy, calendar: Calendar };

  // Duplicate items for seamless loop
  const doubled = [...tickerItems, ...tickerItems];

  return (
    <div className="w-full bg-primary/10 border-b border-primary/20 overflow-hidden relative h-9 flex items-center">
      <div className="absolute left-0 top-0 h-full w-8 bg-gradient-to-r from-primary/10 to-transparent z-10 pointer-events-none" />
      <div className="absolute right-0 top-0 h-full w-8 bg-gradient-to-l from-primary/10 to-transparent z-10 pointer-events-none" />
      <div className="flex animate-ticker whitespace-nowrap">
        {doubled.map((item, i) => {
          const Icon = IconMap[item.icon];
          return (
            <span key={i} className="inline-flex items-center gap-1.5 mx-8 text-sm text-foreground/80">
              <Icon className="w-3.5 h-3.5 text-primary flex-shrink-0" />
              {item.text}
            </span>
          );
        })}
      </div>
    </div>
  );
}