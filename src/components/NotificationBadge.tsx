import { Bell } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { useNotificationContext } from '@/components/NotificationProvider';

export const NotificationBadge = () => {
  const { todayRemindersCount, isSchedulerActive } = useNotificationContext();

  return (
    <Link to="/notifications" className="relative">
      <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-foreground">
        <Bell className="w-4 h-4" />
        {todayRemindersCount > 0 && (
          <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 flex items-center justify-center text-[10px] font-bold rounded-full bg-primary text-primary-foreground">
            {todayRemindersCount > 9 ? '9+' : todayRemindersCount}
          </span>
        )}
        {!isSchedulerActive && todayRemindersCount > 0 && (
          <span className="absolute bottom-0 right-0 w-2 h-2 rounded-full bg-destructive" />
        )}
      </Button>
    </Link>
  );
};
