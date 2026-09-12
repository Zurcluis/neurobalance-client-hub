import { cn } from '@/lib/utils';

const STATUS_BADGE_CLASSES: Record<string, string> = {
  realizado: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300',
  confirmado: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300',
  agendado: 'bg-blue-100 text-blue-700 dark:bg-blue-950/40 dark:text-blue-300',
  pendente: 'bg-blue-100 text-blue-700 dark:bg-blue-950/40 dark:text-blue-300',
  em_andamento: 'bg-amber-100 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300',
  pausado: 'bg-purple-100 text-purple-700 dark:bg-purple-950/40 dark:text-purple-300',
  cancelado: 'bg-red-100 text-red-700 dark:bg-red-950/40 dark:text-red-300',
};

const StatusBadge = ({ status }: { status: string | null | undefined }) => {
  const key = status?.toLowerCase() ?? '';
  const label = status
    ? status.charAt(0).toUpperCase() + status.slice(1).replace(/_/g, ' ')
    : 'N/A';
  return (
    <span
      className={cn(
        'inline-block rounded-full px-2 py-1 text-xs font-medium whitespace-nowrap',
        STATUS_BADGE_CLASSES[key] ?? 'bg-muted text-muted-foreground'
      )}
    >
      {label}
    </span>
  );
};

export default StatusBadge;
