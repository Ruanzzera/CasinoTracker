import { ReactNode } from 'react';
import { cn } from '@/lib/utils';
import { usePrivacy, PRIVACY_MASK } from '@/hooks/usePrivacy';

interface StatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon?: ReactNode;
  trend?: 'up' | 'down' | 'neutral';
  className?: string;
  highlight?: boolean;
  /** Set to false to keep the value visible in privacy mode */
  sensitive?: boolean;
}

export function StatCard({ title, value, subtitle, icon, trend, className, highlight, sensitive = true }: StatCardProps) {
  const { hidden } = usePrivacy();
  const mask = hidden && sensitive;

  const displayValue = typeof value === 'number'
    ? (mask ? PRIVACY_MASK : value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }))
    : value;


  const displaySubtitle = mask && subtitle && /\d/.test(subtitle) ? PRIVACY_MASK : subtitle;

  return (
    <div className={cn('stat-card animate-fade-in', className)}>
      <div className="relative z-10">
        <div className="flex items-start justify-between mb-4">
          <span className="text-sm font-medium text-muted-foreground">{title}</span>
          {icon && (
            <div className={cn(
              'p-2 rounded-lg',
              highlight ? 'bg-accent/20 text-accent' : 'bg-primary/20 text-primary'
            )}>
              {icon}
            </div>
          )}
        </div>
        <div className={cn(
          'text-3xl font-bold tracking-tight',
          highlight ? 'gold-text' : 'text-foreground'
        )}>
          {displayValue}
        </div>
        {displaySubtitle && (
          <p className={cn(
            'mt-2 text-sm',
            trend === 'up' && 'text-profit',
            trend === 'down' && 'text-loss',
            !trend && 'text-muted-foreground'
          )}>
            {displaySubtitle}
          </p>
        )}
      </div>
    </div>
  );
}

