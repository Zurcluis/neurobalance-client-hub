import { useState, useMemo } from 'react';
import { ClientDetailData, Session, Payment } from '@/types/client';
import { format, parseISO, isValid, subMonths, isAfter } from 'date-fns';
import { pt } from 'date-fns/locale';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  PieChart, Pie, Cell, AreaChart, Area
} from 'recharts';
import { BarChart3 } from 'lucide-react';
import { EmptyState } from '@/components/shared/EmptyState';
import { CHART, STATUS_META, tooltipStyle, axisProps } from '@/utils/chartUtils';
import { formatCurrency } from '@/utils/formatUtils';

interface ClientChartsProps {
  client: ClientDetailData;
  sessions: Session[];
  payments: Payment[];
}

type ChartType = 'sessoes' | 'pagamentos' | 'financeiro' | 'evolucao';

const SERIES_COLORS = [
  CHART.primary,
  STATUS_META.finished.color,
  CHART.soft,
  STATUS_META.thinking.color,
  CHART.green,
  STATUS_META.call.color,
];

const LEGEND_STYLE = { color: 'hsl(var(--muted-foreground))' };

const isCancelled = (session: Session) => session.status === 'cancelado';

const safeDate = (value: string | undefined | null) => {
  if (!value) return null;
  const date = parseISO(value);
  return isValid(date) ? date : null;
};

const last6MonthsRange = () => Array.from({ length: 6 }, (_, i) => subMonths(new Date(), i));

const monthBounds = (month: Date) => ({
  firstDayOfMonth: new Date(month.getFullYear(), month.getMonth(), 1),
  lastDayOfMonth: new Date(month.getFullYear(), month.getMonth() + 1, 0)
});

const isInRange = (date: Date, firstDayOfMonth: Date, lastDayOfMonth: Date) =>
  isAfter(date, firstDayOfMonth) && !isAfter(date, lastDayOfMonth);

const EmptyChart = ({ title, description }: { title: string; description: string }) => (
  <EmptyState
    icon={<BarChart3 className="h-10 w-10" />}
    title={title}
    description={description}
    className="py-8"
  />
);

const ClientCharts = ({ client, sessions, payments }: ClientChartsProps) => {
  const [chartType, setChartType] = useState<ChartType>('sessoes');

  const sessionsData = useMemo(() => {
    const realizedCancelled = sessions.filter(s => isCancelled(s));
    const monthlyLabels = last6MonthsRange();

    return monthlyLabels
      .map(month => {
        const monthStr = format(month, 'MMM yyyy', { locale: pt });
        const shortMonthStr = format(month, 'MMM', { locale: pt });
        const { firstDayOfMonth, lastDayOfMonth } = monthBounds(month);

        const countInMonth = (list: Session[]) =>
          list.filter(session => {
            const date = safeDate(session.date);
            return date !== null && isInRange(date, firstDayOfMonth, lastDayOfMonth);
          }).length;

        return {
          name: monthStr,
          shortName: shortMonthStr,
          sessoesRealizadas: countInMonth(sessions) - countInMonth(realizedCancelled),
          sessoesTotal: countInMonth(sessions)
        };
      })
      .reverse();
  }, [sessions]);

  const paymentsData = useMemo(() => {
    const paymentByType: Record<string, number> = {};

    payments.forEach(payment => {
      const type = payment.tipo || 'Não especificado';
      paymentByType[type] = (paymentByType[type] || 0) + (payment.valor || 0);
    });

    return Object.entries(paymentByType).map(([name, value]) => ({
      name,
      value: Number(value.toFixed(2))
    }));
  }, [payments]);

  const financialData = useMemo(
    () =>
      last6MonthsRange()
        .map(month => {
          const { firstDayOfMonth, lastDayOfMonth } = monthBounds(month);
          const total = payments.reduce((sum, payment) => {
            const date = safeDate(payment.data);
            if (!date || !isInRange(date, firstDayOfMonth, lastDayOfMonth)) return sum;
            return sum + (payment.valor || 0);
          }, 0);

          return {
            name: format(month, 'MMM yyyy', { locale: pt }),
            shortName: format(month, 'MMM', { locale: pt }),
            valor: Number(total.toFixed(2))
          };
        })
        .reverse(),
    [payments]
  );

  const chartOptions: Array<{ value: ChartType; label: string }> = [
    { value: 'sessoes', label: 'Sessões' },
    { value: 'pagamentos', label: 'Tipos de Pagamento' },
    { value: 'financeiro', label: 'Financeiro Mensal' },
    { value: 'evolucao', label: 'Evolução' },
  ];

  const renderChart = () => {
    switch (chartType) {
      case 'sessoes': {
        if (sessions.length === 0) {
          return (
            <EmptyChart
              title="Sem sessões registadas"
              description="Assim que existirem sessões, o gráfico mensal será apresentado aqui."
            />
          );
        }
        return (
          <div className="h-80 w-full min-w-0">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={sessionsData}
                margin={{ top: 10, right: 10, left: 0, bottom: 20 }}
              >
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
                <XAxis
                  dataKey="name"
                  angle={-15}
                  textAnchor="end"
                  height={60}
                  {...axisProps}
                  tickFormatter={(_, index) => sessionsData[index]?.shortName ?? ''}
                />
                <YAxis allowDecimals={false} {...axisProps} />
                <Tooltip contentStyle={tooltipStyle} cursor={{ fill: 'hsl(var(--muted))' }} />
                <Legend verticalAlign="top" height={36} wrapperStyle={LEGEND_STYLE} />
                <Bar dataKey="sessoesRealizadas" name="Realizadas" fill={CHART.primary} radius={[4, 4, 0, 0]} />
                <Bar dataKey="sessoesTotal" name="Total" fill={STATUS_META.thinking.color} radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        );
      }

      case 'pagamentos': {
        if (paymentsData.length === 0) {
          return (
            <EmptyChart
              title="Sem pagamentos registados"
              description="Assim que existirem pagamentos, a distribuição por tipo será apresentada aqui."
            />
          );
        }
        return (
          <div className="h-80 w-full min-w-0">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={paymentsData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  outerRadius={90}
                  dataKey="value"
                  nameKey="name"
                  label={({ percent }) => `${((percent ?? 0) * 100).toFixed(0)}%`}
                >
                  {paymentsData.map((_, index) => (
                    <Cell key={`cell-${index}`} fill={SERIES_COLORS[index % SERIES_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip contentStyle={tooltipStyle} formatter={(value) => formatCurrency(Number(value))} />
                <Legend verticalAlign="bottom" height={50} wrapperStyle={LEGEND_STYLE} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        );
      }

      case 'financeiro': {
        if (payments.length === 0) {
          return (
            <EmptyChart
              title="Sem dados financeiros"
              description="Assim que existirem pagamentos, a evolução mensal será apresentada aqui."
            />
          );
        }
        return (
          <div className="h-80 w-full min-w-0">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart
                data={financialData}
                margin={{ top: 10, right: 10, left: 0, bottom: 20 }}
              >
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
                <XAxis
                  dataKey="name"
                  angle={-15}
                  textAnchor="end"
                  height={60}
                  {...axisProps}
                  tickFormatter={(_, index) => financialData[index]?.shortName ?? ''}
                />
                <YAxis {...axisProps} />
                <Tooltip contentStyle={tooltipStyle} formatter={(value) => formatCurrency(Number(value))} />
                <Area type="monotone" dataKey="valor" name="Valor" stroke={CHART.primary} fill={CHART.primary} fillOpacity={0.3} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        );
      }

      case 'evolucao': {
        const realizadas = sessions.filter(s => !isCancelled(s)).length;
        const completionRate = client.max_sessoes && client.max_sessoes > 0
          ? (realizadas / client.max_sessoes) * 100 : 0;

        const progressData = [
          { name: 'Progresso', valor: Number(completionRate.toFixed(0)) }
        ];

        return (
          <div className="flex flex-col items-center gap-4 min-w-0">
            <div className="h-80 w-full min-w-0">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={progressData}
                  layout="vertical"
                  margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke="hsl(var(--border))" />
                  <XAxis type="number" domain={[0, 100]} {...axisProps} />
                  <YAxis dataKey="name" type="category" {...axisProps} />
                  <Tooltip contentStyle={tooltipStyle} formatter={(value) => [`${value}%`, 'Concluído']} />
                  <Bar dataKey="valor" fill={CHART.primary} radius={[0, 4, 4, 0]} barSize={30} />
                </BarChart>
              </ResponsiveContainer>
            </div>

            <div className="text-center max-w-md min-w-0">
              <h3 className="font-medium mb-2">Progresso do Cliente</h3>
              <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                <div className="text-center w-full sm:w-auto">
                  <div className="text-2xl sm:text-3xl font-bold tabular-nums">{realizadas}</div>
                  <div className="text-xs sm:text-sm text-muted-foreground">Sessões realizadas</div>
                </div>
                <div className="text-center w-full sm:w-auto">
                  <div className="text-2xl sm:text-3xl font-bold tabular-nums">{client.max_sessoes || '?'}</div>
                  <div className="text-xs sm:text-sm text-muted-foreground">Sessões planeadas</div>
                </div>
                <div className="text-center w-full sm:w-auto">
                  <div className="text-2xl sm:text-3xl font-bold tabular-nums text-primary">{completionRate.toFixed(0)}%</div>
                  <div className="text-xs sm:text-sm text-muted-foreground">Taxa de conclusão</div>
                </div>
              </div>
            </div>
          </div>
        );
      }

      default:
        return (
          <div className="h-80 flex items-center justify-center text-sm text-muted-foreground">
            Selecione um tipo de gráfico.
          </div>
        );
    }
  };

  return (
    <div className="space-y-4 min-w-0">
      <div className="grid grid-cols-2 sm:flex sm:flex-wrap gap-2">
        {chartOptions.map(option => (
          <Button
            key={option.value}
            size="sm"
            variant={chartType === option.value ? 'default' : 'outline'}
            onClick={() => setChartType(option.value)}
          >
            {option.label}
          </Button>
        ))}
      </div>

      <Card className="p-3 sm:p-4 shadow-sm min-w-0 overflow-hidden">
        {renderChart()}
      </Card>
    </div>
  );
};

export default ClientCharts;
