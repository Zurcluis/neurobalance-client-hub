import { useCallback, useMemo, useState } from 'react';
import { format, isToday, isYesterday, parseISO, startOfDay, subDays } from 'date-fns';
import { pt } from 'date-fns/locale';
import {
  Activity,
  AlertCircle,
  CalendarClock,
  History,
  Info,
  Loader2,
  RefreshCw,
  Users,
  X,
} from 'lucide-react';
import { toast } from 'sonner';
import KpiCard from '@/components/shared/KpiCard';
import { EmptyState } from '@/components/shared/EmptyState';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import useAdminActivity, { type AdminActivityRow } from '@/hooks/useAdminActivity';
import {
  ACTIVITY_ACTION_OPTIONS,
  getActionMeta,
  getEntityLabel,
  getInitials,
} from '@/components/monitoring/activityActions';

const ALL = 'all';
const MIGRATION_FILE = 'supabase/migrations/20260910213800_admin_activity_log.sql';

const getDayGroupLabel = (date: Date): string => {
  if (isToday(date)) return 'Hoje';
  if (isYesterday(date)) return 'Ontem';
  const formatted = format(date, 'dd MMM', { locale: pt });
  return formatted.charAt(0).toUpperCase() + formatted.slice(1);
};

interface DayGroup {
  key: string;
  label: string;
  rows: AdminActivityRow[];
}

const groupByDay = (rows: AdminActivityRow[]): DayGroup[] => {
  const groups = new Map<string, AdminActivityRow[]>();
  for (const row of rows) {
    const key = format(parseISO(row.created_at), 'yyyy-MM-dd');
    const group = groups.get(key);
    if (group) {
      group.push(row);
    } else {
      groups.set(key, [row]);
    }
  }
  return Array.from(groups.entries()).map(([key, groupRows]) => ({
    key,
    label: getDayGroupLabel(parseISO(groupRows[0].created_at)),
    rows: groupRows,
  }));
};

const TeamActivitySection = () => {
  const [adminFilter, setAdminFilter] = useState(ALL);
  const [actionFilter, setActionFilter] = useState(ALL);

  const handleNewRow = useCallback((row: AdminActivityRow) => {
    toast('Nova atividade da equipa', {
      description: `${row.admin_name} — ${getActionMeta(row.action).label}`,
      duration: 4000,
    });
  }, []);

  const { rows, loading, loadingMore, hasMore, missingTable, error, loadMore, refresh } =
    useAdminActivity({ onNewRow: handleNewRow });

  const adminOptions = useMemo(
    () =>
      Array.from(new Set(rows.map((r) => r.admin_name))).sort((a, b) =>
        a.localeCompare(b, 'pt', { sensitivity: 'base' })
      ),
    [rows]
  );

  const filtersActive = adminFilter !== ALL || actionFilter !== ALL;

  const filteredRows = useMemo(
    () =>
      rows.filter(
        (r) =>
          (adminFilter === ALL || r.admin_name === adminFilter) &&
          (actionFilter === ALL || r.action === actionFilter)
      ),
    [rows, adminFilter, actionFilter]
  );

  const dayGroups = useMemo(() => groupByDay(filteredRows), [filteredRows]);

  const kpis = useMemo(() => {
    const todayStart = startOfDay(new Date());
    const weekStart = startOfDay(subDays(new Date(), 7));

    const distinctAdmin = (list: AdminActivityRow[]) =>
      new Set(list.map((r) => r.admin_id || r.admin_name)).size;

    const actionsTodayList = rows.filter((r) => parseISO(r.created_at) >= todayStart);
    const actionsWeekList = rows.filter((r) => parseISO(r.created_at) >= weekStart);

    return {
      actionsToday: actionsTodayList.length,
      actionsWeek: actionsWeekList.length,
      activeToday: distinctAdmin(actionsTodayList),
      activeWeek: distinctAdmin(actionsWeekList),
    };
  }, [rows]);

  const clearFilters = () => {
    setAdminFilter(ALL);
    setActionFilter(ALL);
  };

  if (loading) {
    return (
      <div className="space-y-6" aria-busy="true" aria-label="A carregar atividade da equipa">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Skeleton className="h-28 w-full" />
          <Skeleton className="h-28 w-full" />
          <Skeleton className="h-28 w-full" />
          <Skeleton className="h-28 w-full" />
        </div>
        <Skeleton className="h-16 w-full" />
        <div className="space-y-3">
          <Skeleton className="h-5 w-32" />
          <Skeleton className="h-20 w-full" />
          <Skeleton className="h-20 w-full" />
          <Skeleton className="h-20 w-full" />
        </div>
      </div>
    );
  }

  if (missingTable) {
    return (
      <Alert>
        <Info className="h-4 w-4" />
        <AlertTitle>Funcionalidade requer migração SQL</AlertTitle>
        <AlertDescription className="space-y-2">
          <p>
            Aplica a migração no Supabase SQL Editor para ativar o registo de atividade da equipa:
          </p>
          <code className="block rounded bg-muted px-2 py-1 font-mono text-xs text-foreground">
            {MIGRATION_FILE}
          </code>
          <Button variant="outline" size="sm" onClick={refresh} className="mt-2 gap-2">
            <RefreshCw className="h-4 w-4" />
            Verificar novamente
          </Button>
        </AlertDescription>
      </Alert>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <AlertCircle className="mb-4 h-12 w-12 text-destructive" />
        <p className="mb-1 font-medium text-destructive">Erro ao carregar atividade da equipa</p>
        <p className="mb-4 text-sm text-muted-foreground">{error}</p>
        <Button variant="outline" onClick={refresh} className="gap-2">
          <RefreshCw className="h-4 w-4" />
          Tentar novamente
        </Button>
      </div>
    );
  }

  if (rows.length === 0) {
    return (
      <EmptyState
        icon={<History className="h-10 w-10" />}
        title="Sem atividade registada ainda"
        description="As ações das administrativas aparecerão aqui assim que começarem a ser registadas."
      />
    );
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <KpiCard
          icon={Activity}
          label="Ações hoje"
          value={kpis.actionsToday}
          sub="Nos registos carregados"
          tone="blue"
        />
        <KpiCard
          icon={CalendarClock}
          label="Ações 7 dias"
          value={kpis.actionsWeek}
          sub="Nos registos carregados"
          tone="teal"
        />
        <KpiCard
          icon={Users}
          label="Administrativas ativas hoje"
          value={kpis.activeToday}
          sub="Nos registos carregados"
          tone="purple"
        />
        <KpiCard
          icon={Users}
          label="Administrativas ativas 7 dias"
          value={kpis.activeWeek}
          sub="Nos registos carregados"
          tone="emerald"
        />
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base font-semibold">Atividade da Equipa</CardTitle>
          <CardDescription>Ações registadas pelas administrativas, em tempo real</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-[1fr_1fr_auto_auto] lg:items-center">
            <Select value={adminFilter} onValueChange={setAdminFilter}>
              <SelectTrigger aria-label="Filtrar por administrativa">
                <SelectValue placeholder="Todas as administrativas" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={ALL}>Todas as administrativas</SelectItem>
                {adminOptions.map((name) => (
                  <SelectItem key={name} value={name}>
                    {name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={actionFilter} onValueChange={setActionFilter}>
              <SelectTrigger aria-label="Filtrar por tipo de ação">
                <SelectValue placeholder="Todos os tipos de ação" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={ALL}>Todos os tipos de ação</SelectItem>
                {ACTIVITY_ACTION_OPTIONS.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Button
              variant="ghost"
              size="sm"
              onClick={clearFilters}
              disabled={!filtersActive}
              className="gap-2"
              aria-label="Limpar filtros"
            >
              <X className="h-4 w-4" />
              Limpar filtros
            </Button>

            <p className="text-xs text-muted-foreground lg:text-right" aria-live="polite">
              {filteredRows.length} de {rows.length} registos
            </p>
          </div>

          {filteredRows.length === 0 ? (
            <EmptyState
              icon={<History className="h-10 w-10" />}
              title="Sem resultados para os filtros aplicados"
              description="Ajusta ou limpa os filtros para ver mais atividade."
              action={{
                label: 'Limpar filtros',
                onClick: clearFilters,
                icon: <X className="h-4 w-4" />,
                variant: 'outline',
              }}
            />
          ) : (
            <div className="space-y-8">
              {dayGroups.map((group) => (
                <section key={group.key} aria-label={group.label}>
                  <div className="mb-4 flex items-center gap-3">
                    <h4 className="text-sm font-semibold">{group.label}</h4>
                    <div className="h-px flex-1 bg-border" />
                    <span className="text-xs text-muted-foreground tabular-nums">
                      {group.rows.length}
                    </span>
                  </div>
                  <ul className="space-y-3">
                    {group.rows.map((row) => {
                      const meta = getActionMeta(row.action);
                      const Icon = meta.icon;
                      const entityLabel = getEntityLabel(row.entity);
                      return (
                        <li
                          key={row.id}
                          className="flex gap-3 rounded-lg border p-3 transition-colors hover:bg-muted/40"
                        >
                          <div
                            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-semibold text-primary"
                            aria-hidden="true"
                          >
                            {getInitials(row.admin_name)}
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                              <Icon
                                className="h-4 w-4 shrink-0 text-muted-foreground"
                                aria-hidden="true"
                              />
                              <span className="text-sm font-medium">{row.admin_name}</span>
                              <span className="text-sm text-muted-foreground">{meta.label}</span>
                              {entityLabel && (
                                <Badge variant="outline" className="max-w-full truncate">
                                  {entityLabel}
                                </Badge>
                              )}
                              <time
                                dateTime={row.created_at}
                                className="ml-auto text-xs text-muted-foreground tabular-nums"
                              >
                                {format(parseISO(row.created_at), 'HH:mm')}
                              </time>
                            </div>
                            {row.details && (
                              <p className="mt-1 break-words text-xs text-muted-foreground">
                                {row.details}
                              </p>
                            )}
                          </div>
                        </li>
                      );
                    })}
                  </ul>
                </section>
              ))}
            </div>
          )}

          {hasMore && !filtersActive && (
            <div className="flex justify-center">
              <Button
                variant="outline"
                onClick={loadMore}
                disabled={loadingMore}
                className="gap-2"
              >
                {loadingMore ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <RefreshCw className="h-4 w-4" />
                )}
                Carregar mais
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default TeamActivitySection;
