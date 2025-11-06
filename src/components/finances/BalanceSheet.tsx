import React, { useMemo, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { TrendingUp, TrendingDown, Calendar, BarChart3, FileText } from 'lucide-react';
import { ResponsiveContainer, BarChart, Bar, CartesianGrid, XAxis, YAxis, Tooltip, Legend, LineChart, Line, ComposedChart, Area } from 'recharts';
import { getQuarter, startOfQuarter, endOfQuarter, startOfYear, endOfYear, isWithinInterval, parseISO } from 'date-fns';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface BalanceSheetProps {
  payments: any[];
  expenses: any[];
}

export const BalanceSheet: React.FC<BalanceSheetProps> = ({ payments, expenses }) => {
  const currentYear = new Date().getFullYear();
  const [selectedYear, setSelectedYear] = useState<number>(currentYear);
  const [viewType, setViewType] = useState<'quarterly' | 'annual'>('quarterly');

  const quarterlyData = useMemo(() => {
    const quarters = [1, 2, 3, 4].map(quarter => {
      const quarterDate = new Date(selectedYear, (quarter - 1) * 3);
      const quarterStart = startOfQuarter(quarterDate);
      const quarterEnd = endOfQuarter(quarterDate);

      const quarterPayments = payments.filter(p => {
        const paymentDate = parseISO(p.data);
        return isWithinInterval(paymentDate, { start: quarterStart, end: quarterEnd });
      });

      const quarterExpenses = expenses.filter(e => {
        const expenseDate = parseISO(e.data);
        return isWithinInterval(expenseDate, { start: quarterStart, end: quarterEnd });
      });

      const revenue = quarterPayments.reduce((acc, p) => acc + (p.valor || 0), 0);
      const expensesTotal = quarterExpenses.reduce((acc, e) => acc + (e.valor || 0), 0);
      const profit = revenue - expensesTotal;
      const profitMargin = revenue > 0 ? (profit / revenue) * 100 : 0;

      return {
        quarter: `T${quarter}`,
        quarterName: `${quarter}º Trimestre ${selectedYear}`,
        period: `${format(quarterStart, 'MMM', { locale: ptBR })} - ${format(quarterEnd, 'MMM', { locale: ptBR })}`,
        receita: revenue,
        despesas: expensesTotal,
        lucro: profit,
        margemLucro: profitMargin,
        transacoes: quarterPayments.length + quarterExpenses.length
      };
    });

    const annualRevenue = quarters.reduce((acc, q) => acc + q.receita, 0);
    const annualExpenses = quarters.reduce((acc, q) => acc + q.despesas, 0);
    const annualProfit = annualRevenue - annualExpenses;
    const annualMargin = annualRevenue > 0 ? (annualProfit / annualRevenue) * 100 : 0;

    return {
      quarters,
      annual: {
        receita: annualRevenue,
        despesas: annualExpenses,
        lucro: annualProfit,
        margemLucro: annualMargin,
        transacoes: quarters.reduce((acc, q) => acc + q.transacoes, 0)
      }
    };
  }, [payments, expenses, selectedYear]);

  const yearlyComparison = useMemo(() => {
    const years = [];
    for (let i = 0; i < 5; i++) {
      const year = currentYear - i;
      const yearStart = startOfYear(new Date(year, 0));
      const yearEnd = endOfYear(new Date(year, 0));

      const yearPayments = payments.filter(p => {
        const paymentDate = parseISO(p.data);
        return isWithinInterval(paymentDate, { start: yearStart, end: yearEnd });
      });

      const yearExpenses = expenses.filter(e => {
        const expenseDate = parseISO(e.data);
        return isWithinInterval(expenseDate, { start: yearStart, end: yearEnd });
      });

      const revenue = yearPayments.reduce((acc, p) => acc + (p.valor || 0), 0);
      const expensesTotal = yearExpenses.reduce((acc, e) => acc + (e.valor || 0), 0);
      const profit = revenue - expensesTotal;

      years.push({
        year: year.toString(),
        receita: revenue,
        despesas: expensesTotal,
        lucro: profit,
        crescimento: 0
      });
    }

    for (let i = 0; i < years.length - 1; i++) {
      const current = years[i];
      const previous = years[i + 1];
      if (previous.receita > 0) {
        current.crescimento = ((current.receita - previous.receita) / previous.receita) * 100;
      }
    }

    return years.reverse();
  }, [payments, expenses, currentYear]);

  const yearOptions = Array.from({ length: 5 }, (_, i) => currentYear - i);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap gap-4 items-center justify-between">
        <div className="flex items-center gap-4">
          <div>
            <label className="block text-sm font-medium mb-2">Ano</label>
            <Select value={selectedYear.toString()} onValueChange={(v) => setSelectedYear(Number(v))}>
              <SelectTrigger className="w-[120px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {yearOptions.map(year => (
                  <SelectItem key={year} value={year.toString()}>
                    {year}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
        
        <Tabs value={viewType} onValueChange={(v) => setViewType(v as 'quarterly' | 'annual')}>
          <TabsList>
            <TabsTrigger value="quarterly">Trimestral</TabsTrigger>
            <TabsTrigger value="annual">Anual</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {viewType === 'quarterly' ? (
        <>
          <Card className="bg-gradient-to-br from-white to-blue-50 border-l-4 border-l-blue-500">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                Resumo Anual {selectedYear}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="text-center p-4 bg-white rounded-lg shadow-sm">
                  <p className="text-sm text-gray-600 mb-1">Receita Total</p>
                  <p className="text-2xl font-bold text-green-600">
                    €{quarterlyData.annual.receita.toLocaleString('pt-PT', { minimumFractionDigits: 2 })}
                  </p>
                </div>
                <div className="text-center p-4 bg-white rounded-lg shadow-sm">
                  <p className="text-sm text-gray-600 mb-1">Despesas Totais</p>
                  <p className="text-2xl font-bold text-red-600">
                    €{quarterlyData.annual.despesas.toLocaleString('pt-PT', { minimumFractionDigits: 2 })}
                  </p>
                </div>
                <div className="text-center p-4 bg-white rounded-lg shadow-sm">
                  <p className="text-sm text-gray-600 mb-1">Lucro Líquido</p>
                  <p className={`text-2xl font-bold ${quarterlyData.annual.lucro >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    €{quarterlyData.annual.lucro.toLocaleString('pt-PT', { minimumFractionDigits: 2 })}
                  </p>
                </div>
                <div className="text-center p-4 bg-white rounded-lg shadow-sm">
                  <p className="text-sm text-gray-600 mb-1">Margem de Lucro</p>
                  <p className={`text-2xl font-bold ${quarterlyData.annual.margemLucro >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {quarterlyData.annual.margemLucro.toFixed(1)}%
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {quarterlyData.quarters.map((quarter, idx) => (
              <Card key={idx} className="bg-gradient-to-br from-white to-gray-50">
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <span className="flex items-center gap-2">
                      <BarChart3 className="h-5 w-5" />
                      {quarter.quarterName}
                    </span>
                    <span className="text-sm text-gray-500">{quarter.period}</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex justify-between items-center p-3 bg-green-50 rounded-lg">
                      <span className="text-sm font-medium text-gray-700">Receita</span>
                      <span className="text-lg font-bold text-green-600">
                        €{quarter.receita.toLocaleString('pt-PT', { minimumFractionDigits: 2 })}
                      </span>
                    </div>
                    <div className="flex justify-between items-center p-3 bg-red-50 rounded-lg">
                      <span className="text-sm font-medium text-gray-700">Despesas</span>
                      <span className="text-lg font-bold text-red-600">
                        €{quarter.despesas.toLocaleString('pt-PT', { minimumFractionDigits: 2 })}
                      </span>
                    </div>
                    <div className="flex justify-between items-center p-3 bg-blue-50 rounded-lg">
                      <span className="text-sm font-medium text-gray-700">Lucro</span>
                      <span className={`text-lg font-bold ${quarter.lucro >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        €{quarter.lucro.toLocaleString('pt-PT', { minimumFractionDigits: 2 })}
                      </span>
                    </div>
                    <div className="flex justify-between items-center p-3 bg-purple-50 rounded-lg">
                      <span className="text-sm font-medium text-gray-700">Margem de Lucro</span>
                      <div className="flex items-center gap-2">
                        {quarter.margemLucro >= 0 ? (
                          <TrendingUp className="h-4 w-4 text-green-600" />
                        ) : (
                          <TrendingDown className="h-4 w-4 text-red-600" />
                        )}
                        <span className={`text-lg font-bold ${quarter.margemLucro >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                          {quarter.margemLucro.toFixed(1)}%
                        </span>
                      </div>
                    </div>
                    <p className="text-xs text-gray-500 text-center pt-2 border-t">
                      {quarter.transacoes} transações no trimestre
                    </p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          <Card className="bg-gradient-to-br from-white to-gray-50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5" />
                Comparação Trimestral {selectedYear}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-[400px]">
                <ResponsiveContainer width="100%" height="100%">
                  <ComposedChart data={quarterlyData.quarters}>
                    <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
                    <XAxis dataKey="quarter" fontSize={12} />
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
                    <Bar dataKey="receita" name="Receita" fill="#10b981" />
                    <Bar dataKey="despesas" name="Despesas" fill="#ef4444" />
                    <Line 
                      type="monotone" 
                      dataKey="lucro" 
                      name="Lucro" 
                      stroke="#3b82f6" 
                      strokeWidth={3}
                      dot={{ fill: '#3b82f6', strokeWidth: 2, r: 5 }}
                    />
                  </ComposedChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </>
      ) : (
        <>
          <Card className="bg-gradient-to-br from-white to-gray-50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Comparação Anual (Últimos 5 Anos)
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-[400px]">
                <ResponsiveContainer width="100%" height="100%">
                  <ComposedChart data={yearlyComparison}>
                    <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
                    <XAxis dataKey="year" fontSize={12} />
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
                    <Area 
                      type="monotone" 
                      dataKey="receita" 
                      name="Receita" 
                      fill="#10b981" 
                      stroke="#10b981" 
                      fillOpacity={0.3}
                    />
                    <Area 
                      type="monotone" 
                      dataKey="despesas" 
                      name="Despesas" 
                      fill="#ef4444" 
                      stroke="#ef4444" 
                      fillOpacity={0.3}
                    />
                    <Line 
                      type="monotone" 
                      dataKey="lucro" 
                      name="Lucro" 
                      stroke="#3b82f6" 
                      strokeWidth={3}
                      dot={{ fill: '#3b82f6', strokeWidth: 2, r: 5 }}
                    />
                  </ComposedChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
            {yearlyComparison.map((yearData, idx) => (
              <Card key={idx} className="bg-gradient-to-br from-white to-blue-50">
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg text-center">{yearData.year}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="text-center">
                    <p className="text-xs text-gray-600">Receita</p>
                    <p className="text-lg font-bold text-green-600">
                      €{yearData.receita.toLocaleString('pt-PT', { maximumFractionDigits: 0 })}
                    </p>
                  </div>
                  <div className="text-center">
                    <p className="text-xs text-gray-600">Lucro</p>
                    <p className={`text-lg font-bold ${yearData.lucro >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      €{yearData.lucro.toLocaleString('pt-PT', { maximumFractionDigits: 0 })}
                    </p>
                  </div>
                  {yearData.crescimento !== 0 && (
                    <div className="text-center pt-2 border-t">
                      <div className="flex items-center justify-center gap-1">
                        {yearData.crescimento >= 0 ? (
                          <TrendingUp className="h-4 w-4 text-green-600" />
                        ) : (
                          <TrendingDown className="h-4 w-4 text-red-600" />
                        )}
                        <span className={`text-sm font-medium ${yearData.crescimento >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                          {Math.abs(yearData.crescimento).toFixed(1)}%
                        </span>
                      </div>
                      <p className="text-xs text-gray-500">vs ano anterior</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </>
      )}
    </div>
  );
};

export default BalanceSheet;

