import React, { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowDownCircle, ArrowUpCircle, TrendingUp, TrendingDown, DollarSign, Activity } from 'lucide-react';
import { ResponsiveContainer, LineChart, Line, CartesianGrid, XAxis, YAxis, Tooltip, Legend } from 'recharts';
import { format, subMonths, startOfMonth, endOfMonth, isWithinInterval, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';

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

  const currentMonthData = cashFlowData[cashFlowData.length - 1] || {
    receita: 0,
    despesas: 0,
    fluxoCaixa: 0,
    saldoAcumulado: 0
  };

  const previousMonthData = cashFlowData[cashFlowData.length - 2] || {
    receita: 0,
    despesas: 0,
    fluxoCaixa: 0,
    saldoAcumulado: 0
  };

  const revenueGrowth = previousMonthData.receita > 0 
    ? ((currentMonthData.receita - previousMonthData.receita) / previousMonthData.receita) * 100 
    : 0;

  const expensesGrowth = previousMonthData.despesas > 0 
    ? ((currentMonthData.despesas - previousMonthData.despesas) / previousMonthData.despesas) * 100 
    : 0;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="bg-gradient-to-br from-white to-green-50 border-l-4 border-l-green-500">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-700">Faturação Mensal</CardTitle>
            <ArrowDownCircle className="h-5 w-5 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              €{currentMonthData.receita.toLocaleString('pt-PT', { minimumFractionDigits: 2 })}
            </div>
            <div className="flex items-center gap-1 mt-1">
              {revenueGrowth >= 0 ? (
                <TrendingUp className="h-4 w-4 text-green-600" />
              ) : (
                <TrendingDown className="h-4 w-4 text-red-600" />
              )}
              <span className={`text-xs font-medium ${revenueGrowth >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {Math.abs(revenueGrowth).toFixed(1)}% vs mês anterior
              </span>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-white to-red-50 border-l-4 border-l-red-500">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-700">Despesas Mensais</CardTitle>
            <ArrowUpCircle className="h-5 w-5 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              €{currentMonthData.despesas.toLocaleString('pt-PT', { minimumFractionDigits: 2 })}
            </div>
            <div className="flex items-center gap-1 mt-1">
              {expensesGrowth >= 0 ? (
                <TrendingUp className="h-4 w-4 text-red-600" />
              ) : (
                <TrendingDown className="h-4 w-4 text-green-600" />
              )}
              <span className={`text-xs font-medium ${expensesGrowth >= 0 ? 'text-red-600' : 'text-green-600'}`}>
                {Math.abs(expensesGrowth).toFixed(1)}% vs mês anterior
              </span>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-white to-blue-50 border-l-4 border-l-blue-500">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-700">Fluxo de Caixa</CardTitle>
            <Activity className="h-5 w-5 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${currentMonthData.fluxoCaixa >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              €{currentMonthData.fluxoCaixa.toLocaleString('pt-PT', { minimumFractionDigits: 2 })}
            </div>
            <p className="text-xs text-gray-500 mt-1">
              Receitas - Despesas
            </p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-white to-purple-50 border-l-4 border-l-purple-500">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-700">Saldo Acumulado</CardTitle>
            <DollarSign className="h-5 w-5 text-purple-500" />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${currentMonthData.saldoAcumulado >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              €{currentMonthData.saldoAcumulado.toLocaleString('pt-PT', { minimumFractionDigits: 2 })}
            </div>
            <p className="text-xs text-gray-500 mt-1">
              Últimos 12 meses
            </p>
          </CardContent>
        </Card>
      </div>

      <Card className="bg-gradient-to-br from-white to-gray-50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5" />
            Evolução do Fluxo de Caixa
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[350px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={cashFlowData}>
                <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
                <XAxis dataKey="month" fontSize={12} />
                <YAxis 
                  tickFormatter={(value) => `€${value.toLocaleString('pt-PT')}`} 
                  fontSize={12} 
                />
                <Tooltip 
                  formatter={(value: any, name: string) => [
                    `€${value.toLocaleString('pt-PT', { minimumFractionDigits: 2 })}`, 
                    name
                  ]}
                  contentStyle={{ backgroundColor: 'white', border: '1px solid #e5e7eb' }}
                />
                <Legend />
                <Line 
                  type="monotone" 
                  dataKey="receita" 
                  name="Receita" 
                  stroke="#10b981" 
                  strokeWidth={2}
                  dot={{ fill: '#10b981', strokeWidth: 2, r: 4 }}
                />
                <Line 
                  type="monotone" 
                  dataKey="despesas" 
                  name="Despesas" 
                  stroke="#ef4444" 
                  strokeWidth={2}
                  dot={{ fill: '#ef4444', strokeWidth: 2, r: 4 }}
                />
                <Line 
                  type="monotone" 
                  dataKey="fluxoCaixa" 
                  name="Fluxo de Caixa" 
                  stroke="#3b82f6" 
                  strokeWidth={3}
                  dot={{ fill: '#3b82f6', strokeWidth: 2, r: 5 }}
                />
                <Line 
                  type="monotone" 
                  dataKey="saldoAcumulado" 
                  name="Saldo Acumulado" 
                  stroke="#8b5cf6" 
                  strokeWidth={2}
                  strokeDasharray="5 5"
                  dot={{ fill: '#8b5cf6', strokeWidth: 2, r: 4 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default CashFlowDashboard;

