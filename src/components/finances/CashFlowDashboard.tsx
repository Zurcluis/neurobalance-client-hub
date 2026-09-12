import React, { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Activity } from 'lucide-react';
import { ResponsiveContainer, LineChart, Line, CartesianGrid, XAxis, YAxis, Tooltip } from 'recharts';
import { parseISO } from 'date-fns';
import { CHART, tooltipStyle, axisProps } from '@/utils/chartUtils';
import { formatCurrency } from '@/utils/formatUtils';
import { FinancePeriod, getChartBuckets, isInWindow } from '@/utils/financePeriods';

interface CashFlowDashboardProps {
  payments: Array<{ data?: string | null; valor?: number | null }>;
  expenses: Array<{ data?: string | null; valor?: number | null }>;
  period: FinancePeriod;
}

export const CashFlowDashboard: React.FC<CashFlowDashboardProps> = ({ payments, expenses, period }) => {
  const { cashFlowData, subtitle } = useMemo(() => {
    const now = new Date();

    // Data mais antiga disponível (pagamentos + despesas)
    let earliest: Date | null = null;
    const trackEarliest = (dateStr?: string | null) => {
      if (!dateStr) return;
      const parsed = parseISO(dateStr);
      if (Number.isNaN(parsed.getTime())) return;
      if (!earliest || parsed < earliest) earliest = parsed;
    };
    payments.forEach(p => trackEarliest(p.data));
    expenses.forEach(e => trackEarliest(e.data));

    const { buckets, subtitle: chartSubtitle } = getChartBuckets(period, earliest, now);

    const sumIn = (items: Array<{ data?: string | null; valor?: number | null }>, start: Date, end: Date) =>
      items.reduce((acc, it) => (isInWindow(it.data, start, end) ? acc + (it.valor || 0) : acc), 0);

    let accumulatedBalance = 0;
    const cashFlowData = buckets.map(bucket => {
      const revenue = sumIn(payments, bucket.start, bucket.end);
      const expensesTotal = sumIn(expenses, bucket.start, bucket.end);
      accumulatedBalance += revenue - expensesTotal;
      return {
        month: bucket.label,
        receita: revenue,
        despesas: expensesTotal,
        fluxoCaixa: revenue - expensesTotal,
        saldoAcumulado: accumulatedBalance
      };
    });

    return { cashFlowData, subtitle: chartSubtitle };
  }, [payments, expenses, period]);

  return (
    <Card className="min-w-0">
      <CardHeader className="flex flex-row items-center justify-between gap-3 pb-2">
        <CardTitle className="text-base font-semibold flex items-center gap-2">
          <Activity className="h-4 w-4 text-primary" />
          Evolução do Fluxo de Caixa
        </CardTitle>
        <span className="text-xs text-muted-foreground hidden sm:inline">{subtitle}</span>
      </CardHeader>
      <CardContent>
        <div className="h-[350px] min-w-0 overflow-hidden">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={cashFlowData}>
              <CartesianGrid strokeDasharray="3 3" opacity={0.2} vertical={false} />
              <XAxis dataKey="month" minTickGap={16} {...axisProps} />
              <YAxis
                tickFormatter={(value) => `€${value.toLocaleString('pt-PT')}`}
                {...axisProps}
              />
              <Tooltip
                formatter={(value, name) => [
                  formatCurrency(Number(value)),
                  name
                ]}
                contentStyle={tooltipStyle}
              />
              <Line
                type="monotone"
                dataKey="receita"
                name="Receita"
                stroke={CHART.green}
                strokeWidth={2}
                dot={false}
                activeDot={{ r: 4 }}
              />
              <Line
                type="monotone"
                dataKey="despesas"
                name="Despesas"
                stroke={CHART.red}
                strokeWidth={2}
                dot={false}
                activeDot={{ r: 4 }}
              />
              <Line
                type="monotone"
                dataKey="fluxoCaixa"
                name="Fluxo de Caixa"
                stroke={CHART.primary}
                strokeWidth={3}
                dot={false}
                activeDot={{ r: 5 }}
              />
              <Line
                type="monotone"
                dataKey="saldoAcumulado"
                name="Saldo Acumulado"
                stroke="hsl(var(--muted-foreground))"
                strokeWidth={2}
                strokeDasharray="5 5"
                dot={false}
                activeDot={{ r: 4 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
};

export default CashFlowDashboard;
