import { useEffect, useMemo, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import KpiCard from '@/components/shared/KpiCard';
import { EmptyState } from '@/components/shared/EmptyState';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { AlertCircle, AlertTriangle, Package, RefreshCw, Target, TrendingUp } from 'lucide-react';
import type { Payment } from '@/hooks/usePayments';
import type { Expense } from '@/hooks/useExpenses';
import {
  buildPackRenewals,
  buildRevenueForecast,
  detectAnomalies,
  type AppointmentLike,
  type FinanceAnomaly,
  type PackRenewal,
  type RevenueForecast,
} from '@/utils/financeInsights';
import { formatCurrency } from '@/utils/formatUtils';
import RevenueForecastCard from './RevenueForecastCard';
import AnomaliesCard from './AnomaliesCard';
import PackRenewalsCard from './PackRenewalsCard';

interface ForecastAndAlertsTabProps {
  payments: Payment[];
  expenses: Expense[];
  isLoading: boolean;
  error: Error | null;
  onRetry: () => void;
}

const ForecastAndAlertsTab = ({ payments, expenses, isLoading, error, onRetry }: ForecastAndAlertsTabProps) => {
  const [appointments, setAppointments] = useState<AppointmentLike[]>([]);
  const [appointmentsLoading, setAppointmentsLoading] = useState(true);
  const [appointmentsError, setAppointmentsError] = useState<string | null>(null);

  const fetchAppointments = async () => {
    try {
      setAppointmentsLoading(true);
      setAppointmentsError(null);
      const { data, error: fetchError } = await supabase
        .from('agendamentos')
        .select('id, data, estado, id_cliente');
      if (fetchError) throw fetchError;
      setAppointments((data || []) as AppointmentLike[]);
    } catch (err) {
      console.error('Erro ao carregar agendamentos:', err);
      setAppointmentsError('Não foi possível carregar os agendamentos');
    } finally {
      setAppointmentsLoading(false);
    }
  };

  useEffect(() => {
    fetchAppointments();
  }, []);

  const now = useMemo(() => new Date(), []);

  const forecast: RevenueForecast = useMemo(
    () => buildRevenueForecast(payments, appointments, now),
    [payments, appointments, now]
  );

  const anomalies: FinanceAnomaly[] = useMemo(
    () => detectAnomalies(payments, expenses, now),
    [payments, expenses, now]
  );

  const renewals: PackRenewal[] = useMemo(
    () => buildPackRenewals(payments, appointments, now),
    [payments, appointments, now]
  );

  if (isLoading || appointmentsLoading) {
    return (
      <div className="space-y-6 min-w-0">
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
          <Skeleton className="h-[110px] w-full" />
          <Skeleton className="h-[110px] w-full" />
          <Skeleton className="h-[110px] w-full" />
          <Skeleton className="h-[110px] w-full" />
        </div>
        <Skeleton className="h-[420px] w-full" />
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
          <Skeleton className="h-[260px] w-full" />
          <Skeleton className="h-[260px] w-full" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center min-w-0">
        <AlertCircle className="h-12 w-12 text-red-500 mb-4" />
        <p className="text-red-500 font-medium mb-2">Erro ao carregar dados financeiros</p>
        <p className="text-muted-foreground mb-4">{error.message}</p>
        <Button onClick={onRetry} variant="outline" className="gap-2">
          <RefreshCw className="h-4 w-4" />
          Tentar novamente
        </Button>
      </div>
    );
  }

  if (payments.length === 0 && expenses.length === 0) {
    return (
      <EmptyState
        icon={<TrendingUp className="h-10 w-10" />}
        title="Sem dados suficientes"
        description="Registe pagamentos e despesas para ativar a previsão de receita, a deteção de anomalias e os avisos de renovação de packs."
        action={{
          label: 'Atualizar dados',
          onClick: () => {
            onRetry();
            fetchAppointments();
          },
          icon: <RefreshCw className="h-4 w-4" />,
        }}
      />
    );
  }

  return (
    <div className="space-y-6 min-w-0">
      {appointmentsError && (
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-lg border border-amber-200 bg-amber-50 dark:border-amber-900 dark:bg-amber-950/40 px-4 py-3">
          <div className="flex items-center gap-2.5 min-w-0">
            <AlertTriangle className="h-4 w-4 text-amber-600 dark:text-amber-300 shrink-0" />
            <span className="text-sm text-amber-800 dark:text-amber-200">{appointmentsError}</span>
          </div>
          <Button
            variant="outline"
            size="sm"
            className="gap-2 shrink-0 border-amber-300 dark:border-amber-800"
            onClick={fetchAppointments}
          >
            <RefreshCw className="h-4 w-4" />
            Tentar novamente
          </Button>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4 min-w-0">
        <KpiCard
          icon={TrendingUp}
          label="Receita prevista"
          value={formatCurrency(forecast.conservativeTotal)}
          tone="emerald"
          sub={`Próximos ${forecast.projectedMonths} meses · conservador`}
        />
        <KpiCard
          icon={Target}
          label="Cenário otimista"
          value={formatCurrency(forecast.optimisticTotal)}
          tone="blue"
          sub={`Inclui média histórica (${formatCurrency(forecast.avgMonthlyTotal)}/mês)`}
        />
        <KpiCard
          icon={AlertTriangle}
          label="Anomalias detetadas"
          value={anomalies.length}
          tone="amber"
          sub="Últimos 6 meses"
        />
        <KpiCard
          icon={Package}
          label="Packs a renovar"
          value={renewals.length}
          tone="purple"
          sub={`${forecast.futureBookedSessions} sessões futuras agendadas`}
        />
      </div>

      <RevenueForecastCard forecast={forecast} />

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 min-w-0">
        <AnomaliesCard anomalies={anomalies} />
        <PackRenewalsCard renewals={renewals} />
      </div>
    </div>
  );
};

export default ForecastAndAlertsTab;
