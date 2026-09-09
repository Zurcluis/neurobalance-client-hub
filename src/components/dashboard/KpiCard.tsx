import { type KeyboardEvent, type ReactNode } from 'react';
import { ArrowDownRight, ArrowUpRight } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { cn } from '@/lib/utils';

interface KpiCardProps {
  label: string;
  value: string;
  sublabel?: string;
  icon: ReactNode;
  delta?: number | null;
  valueClassName?: string;
  onClick?: () => void;
}

const KpiCard = ({ label, value, sublabel, icon, delta = null, valueClassName, onClick }: KpiCardProps) => {
  const handleKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (onClick && (event.key === 'Enter' || event.key === ' ')) {
      event.preventDefault();
      onClick();
    }
  };

  return (
    <Card
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
      onClick={onClick}
      onKeyDown={handleKeyDown}
      className={cn(
        'p-5 transition-colors duration-200',
        onClick &&
          'cursor-pointer hover:border-primary/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background'
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 space-y-1.5">
          <p className="text-sm font-medium text-muted-foreground">{label}</p>
          <p
            className={cn(
              'text-2xl font-semibold tracking-tight tabular-nums text-foreground sm:text-[1.7rem]',
              valueClassName
            )}
          >
            {value}
          </p>
          {sublabel && <p className="truncate text-xs text-muted-foreground">{sublabel}</p>}
        </div>
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
          {icon}
        </div>
      </div>
      {delta !== null && (
        <div className="mt-3 flex items-center gap-1.5 text-xs" title="Comparado com o período anterior">
          <span
            className={cn(
              'flex items-center gap-0.5 font-medium tabular-nums',
              delta >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400'
            )}
          >
            {delta >= 0 ? (
              <ArrowUpRight className="h-3.5 w-3.5" />
            ) : (
              <ArrowDownRight className="h-3.5 w-3.5" />
            )}
            {Math.abs(delta).toFixed(1)}%
          </span>
          <span className="text-muted-foreground">vs período anterior</span>
        </div>
      )}
    </Card>
  );
};

export default KpiCard;
