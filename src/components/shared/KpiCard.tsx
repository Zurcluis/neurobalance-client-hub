import React from 'react';
import { Card } from '@/components/ui/card';
import { TrendingUp, TrendingDown, LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

export type KpiTone = 'teal' | 'emerald' | 'red' | 'blue' | 'purple' | 'amber' | 'slate';

interface KpiCardProps {
  icon: LucideIcon;
  label: string;
  value: string | number;
  sub?: string;
  delta?: { value: string; positive: boolean };
  tone?: KpiTone;
  className?: string;
}

const toneStyles: Record<KpiTone, { tile: string; value: string; delta: string }> = {
  teal: {
    tile: 'bg-teal-50 text-teal-600 dark:bg-teal-950/40 dark:text-teal-300',
    value: 'text-teal-700 dark:text-teal-300',
    delta: 'text-teal-600 dark:text-teal-300',
  },
  emerald: {
    tile: 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-300',
    value: 'text-emerald-700 dark:text-emerald-300',
    delta: 'text-emerald-600 dark:text-emerald-300',
  },
  red: {
    tile: 'bg-red-50 text-red-600 dark:bg-red-950/40 dark:text-red-300',
    value: 'text-red-700 dark:text-red-300',
    delta: 'text-red-600 dark:text-red-300',
  },
  blue: {
    tile: 'bg-blue-50 text-blue-600 dark:bg-blue-950/40 dark:text-blue-300',
    value: 'text-blue-700 dark:text-blue-300',
    delta: 'text-blue-600 dark:text-blue-300',
  },
  purple: {
    tile: 'bg-purple-50 text-purple-600 dark:bg-purple-950/40 dark:text-purple-300',
    value: 'text-purple-700 dark:text-purple-300',
    delta: 'text-purple-600 dark:text-purple-300',
  },
  amber: {
    tile: 'bg-amber-50 text-amber-600 dark:bg-amber-950/40 dark:text-amber-300',
    value: 'text-amber-700 dark:text-amber-300',
    delta: 'text-amber-600 dark:text-amber-300',
  },
  slate: {
    tile: 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300',
    value: 'text-slate-800 dark:text-slate-200',
    delta: 'text-slate-600 dark:text-slate-300',
  },
};

const KpiCard: React.FC<KpiCardProps> = ({
  icon: Icon,
  label,
  value,
  sub,
  delta,
  tone = 'teal',
  className,
}) => {
  const styles = toneStyles[tone];

  return (
    <Card className={cn('p-4 sm:p-5 shadow-sm hover:shadow-md transition-shadow', className)}>
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-sm font-medium text-muted-foreground">{label}</p>
          <p className={cn('text-2xl sm:text-[1.7rem] font-bold mt-1 tracking-tight tabular-nums', styles.value)}>
            {value}
          </p>
          {(delta || sub) && (
            <div className="flex items-center gap-2 mt-2 flex-wrap">
              {delta && (
                <span
                  className={cn(
                    'inline-flex items-center gap-1 text-xs font-semibold',
                    styles.delta
                  )}
                >
                  {delta.positive ? <TrendingUp className="h-3.5 w-3.5" /> : <TrendingDown className="h-3.5 w-3.5" />}
                  {delta.value}
                </span>
              )}
              {sub && <span className="text-xs text-muted-foreground">{sub}</span>}
            </div>
          )}
        </div>
        <div className={cn('h-10 w-10 rounded-lg flex items-center justify-center shrink-0', styles.tile)}>
          <Icon className="h-5 w-5" />
        </div>
      </div>
    </Card>
  );
};

export default KpiCard;
