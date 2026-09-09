import React, { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Activity } from 'lucide-react';
import { ResponsiveContainer, LineChart, Line, CartesianGrid, XAxis, YAxis, Tooltip } from 'recharts';
import { format, subMonths, startOfMonth, endOfMonth, isWithinInterval, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { CHART, tooltipStyle, axisProps } from '@/utils/chartUtils';

interface CashFlowDashboardProps {
  payments: any[];
  expenses: any[];
}

export const CashFlowDashboard: React.FC<CashFlowDashboardProps> = ({ payments, expenses }) => {
  const cashFlowData = useMemo(() => {
    const months = [];
    const now = new Date();

    for (let i = 11; i >= 0; i--) {
      const month = subMonths(now, i);
      const monthStart = startOfMonth(month);
      const monthEnd = endOfMonth(month);

      const monthPayments = payments.filter(payment => {
        const paymentDate = parseISO(payment.data);
        return isWithinInterval(paymentDate, { start: monthStart, end: monthEnd });
      });

      const monthExpenses = expenses.filter(expense => {
        const expenseDate = parseISO(expense.data);
        return isWithinInterval(expenseDate, { start: monthStart, end: monthEnd });
      });

      const revenue = monthPayments.reduce((acc, p) => acc + (p.valor || 0), 0);
      const expensesTotal = monthExpenses.reduce((acc, e) => acc + (e.valor || 0), 0);
      const cashFlow = revenue - expensesTotal;

      months.push({
        month: format(month, 'MMM yyyy', { locale: ptBR }),
        receita: revenue,
        despesas: expensesTotal,
        fluxoCaixa: cashFlow,
        saldoAcumulado: 0
      });
    }

    let accumulatedBalance = 0;
    months.forEach(m => {
      accumulatedBalance += m.fluxoCaixa;
      m.saldoAcumulado = accumulatedBalance;
    });

    return months;
  }, [payments, expenses]);

  return (
    <Card className="min-w-0">
      <CardHeader className="flex flex-row items-center justify-between gap-3 pb-2">
        <CardTitle className="text-base font-semibold flex items-center gap-2">
          <Activity className="h-4 w-4 text-primary" />
          Evolução do Fluxo de Caixa
        </CardTitle>
        <span className="text-xs text-muted-foreground hidden sm:inline">Últimos 12 meses</span>
      </CardHeader>
      <CardContent>
        <div className="h-[350px]">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={cashFlowData}>
              <CartesianGrid strokeDasharray="3 3" opacity={0.2} vertical={false} />
              <XAxis dataKey="month" {...axisProps} />
              <YAxis
                tickFormatter={(value) => `€${value.toLocaleString('pt-PT')}`}
                {...axisProps}
              />
              <Tooltip
                formatter={(value: any, name: string) => [
                  `€${value.toLocaleString('pt-PT', { minimumFractionDigits: 2 })}`,
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
                stroke="#94a3b8"
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
