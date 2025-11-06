import React, { useMemo, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Home, Zap, Phone, Users, Briefcase, Calculator, Wrench, Beaker, FileText, ShoppingCart } from 'lucide-react';
import { ResponsiveContainer, BarChart, Bar, CartesianGrid, XAxis, YAxis, Tooltip, Legend, PieChart, Pie, Cell } from 'recharts';
import { startOfMonth, endOfMonth, isWithinInterval, parseISO } from 'date-fns';

interface MonthlyAnalysisProps {
  payments: any[];
  expenses: any[];
}

const EXPENSE_CATEGORIES = {
  fixas: {
    name: 'Despesas Fixas',
    color: '#ef4444',
    icon: Home,
    subcategories: [
      'Renda',
      'Água',
      'Luz',
      'Telemóvel',
      'Salários',
      'Contabilidade',
      'ChatGPT',
      'Netflix',
      'Reembolso de capital'
    ]
  },
  variaveis: {
    name: 'Despesas Variáveis',
    color: '#f97316',
    icon: Briefcase,
    subcategories: [
      'Despesas operacionais',
      'Marketing',
      'Publicidade',
      'Transportes',
      'Comunicação'
    ]
  },
  investimento: {
    name: 'Investimento',
    color: '#10b981',
    icon: Wrench,
    subcategories: [
      'Equipamentos',
      'Melhorias',
      'Tecnologia',
      'Formação',
      'Software'
    ]
  },
  materiais: {
    name: 'Materiais',
    color: '#3b82f6',
    icon: Beaker,
    subcategories: [
      'Elétrodos',
      'Pasta condutora',
      'Pasta nuprep',
      'Água destilada',
      'Materiais de escritório'
    ]
  },
  outras: {
    name: 'Outras Despesas',
    color: '#8b5cf6',
    icon: FileText,
    subcategories: [
      'Despesas diversas',
      'Impostos',
      'Taxas',
      'Outros'
    ]
  }
};

const categorizeExpense = (expense: any): string => {
  const categoria = (expense.categoria || '').toLowerCase();
  const descricao = (expense.descricao || '').toLowerCase();
  
  for (const [key, config] of Object.entries(EXPENSE_CATEGORIES)) {
    for (const subcat of config.subcategories) {
      if (categoria.includes(subcat.toLowerCase()) || descricao.includes(subcat.toLowerCase())) {
        return key;
      }
    }
  }
  
  if (categoria.includes('fix') || descricao.includes('renda') || descricao.includes('salário')) {
    return 'fixas';
  }
  if (categoria.includes('investimento') || descricao.includes('equipamento')) {
    return 'investimento';
  }
  if (categoria.includes('material')) {
    return 'materiais';
  }
  if (categoria.includes('operacion') || categoria.includes('variáve')) {
    return 'variaveis';
  }
  
  return 'outras';
};

export const MonthlyAnalysis: React.FC<MonthlyAnalysisProps> = ({ payments, expenses }) => {
  const currentDate = new Date();
  const [selectedMonth, setSelectedMonth] = useState<number>(currentDate.getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState<number>(currentDate.getFullYear());

  const monthlyData = useMemo(() => {
    const monthStart = startOfMonth(new Date(selectedYear, selectedMonth - 1));
    const monthEnd = endOfMonth(new Date(selectedYear, selectedMonth - 1));

    const monthPayments = payments.filter(payment => {
      const paymentDate = parseISO(payment.data);
      return isWithinInterval(paymentDate, { start: monthStart, end: monthEnd });
    });

    const monthExpenses = expenses.filter(expense => {
      const expenseDate = parseISO(expense.data);
      return isWithinInterval(expenseDate, { start: monthStart, end: monthEnd });
    });

    const totalRevenue = monthPayments.reduce((acc, p) => acc + (p.valor || 0), 0);
    const totalExpenses = monthExpenses.reduce((acc, e) => acc + (e.valor || 0), 0);

    const categorizedExpenses = monthExpenses.reduce((acc, expense) => {
      const category = categorizeExpense(expense);
      acc[category] = (acc[category] || 0) + (expense.valor || 0);
      return acc;
    }, {} as Record<string, number>);

    const categoryData = Object.entries(EXPENSE_CATEGORIES).map(([key, config]) => ({
      category: key,
      name: config.name,
      value: categorizedExpenses[key] || 0,
      color: config.color,
      icon: config.icon,
      percentage: totalExpenses > 0 ? ((categorizedExpenses[key] || 0) / totalExpenses) * 100 : 0
    }));

    const detailedExpenses = monthExpenses.map(expense => ({
      ...expense,
      category: categorizeExpense(expense),
      categoryName: EXPENSE_CATEGORIES[categorizeExpense(expense) as keyof typeof EXPENSE_CATEGORIES].name
    }));

    return {
      totalRevenue,
      totalExpenses,
      profit: totalRevenue - totalExpenses,
      profitMargin: totalRevenue > 0 ? ((totalRevenue - totalExpenses) / totalRevenue) * 100 : 0,
      categoryData: categoryData.filter(c => c.value > 0),
      detailedExpenses,
      paymentsCount: monthPayments.length,
      expensesCount: monthExpenses.length
    };
  }, [payments, expenses, selectedMonth, selectedYear]);

  const monthOptions = [
    'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
    'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
  ];

  const yearOptions = Array.from({ length: 5 }, (_, i) => currentDate.getFullYear() - i);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap gap-4">
        <div>
          <label className="block text-sm font-medium mb-2">Mês</label>
          <Select value={selectedMonth.toString()} onValueChange={(v) => setSelectedMonth(Number(v))}>
            <SelectTrigger className="w-[180px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {monthOptions.map((month, idx) => (
                <SelectItem key={month} value={(idx + 1).toString()}>
                  {month}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
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

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="bg-gradient-to-br from-white to-green-50 border-l-4 border-l-green-500">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-700">Faturação</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              €{monthlyData.totalRevenue.toLocaleString('pt-PT', { minimumFractionDigits: 2 })}
            </div>
            <p className="text-xs text-gray-500 mt-1">
              {monthlyData.paymentsCount} pagamentos
            </p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-white to-red-50 border-l-4 border-l-red-500">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-700">Despesas</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              €{monthlyData.totalExpenses.toLocaleString('pt-PT', { minimumFractionDigits: 2 })}
            </div>
            <p className="text-xs text-gray-500 mt-1">
              {monthlyData.expensesCount} despesas
            </p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-white to-blue-50 border-l-4 border-l-blue-500">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-700">Lucro</CardTitle>
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${monthlyData.profit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              €{monthlyData.profit.toLocaleString('pt-PT', { minimumFractionDigits: 2 })}
            </div>
            <p className="text-xs text-gray-500 mt-1">
              Margem: {monthlyData.profitMargin.toFixed(1)}%
            </p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-white to-purple-50 border-l-4 border-l-purple-500">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-700">Taxa de Eficiência</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-600">
              {(100 - (monthlyData.totalRevenue > 0 ? (monthlyData.totalExpenses / monthlyData.totalRevenue) * 100 : 0)).toFixed(1)}%
            </div>
            <p className="text-xs text-gray-500 mt-1">
              Rentabilidade operacional
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="bg-gradient-to-br from-white to-gray-50">
          <CardHeader>
            <CardTitle>Despesas por Categoria</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={monthlyData.categoryData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percentage }) => `${name} ${percentage.toFixed(1)}%`}
                    outerRadius={100}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {monthlyData.categoryData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip 
                    formatter={(value: any) => [`€${value.toLocaleString('pt-PT', { minimumFractionDigits: 2 })}`, 'Valor']}
                    contentStyle={{ backgroundColor: 'white', border: '1px solid #e5e7eb' }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-white to-gray-50">
          <CardHeader>
            <CardTitle>Comparação de Categorias</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={monthlyData.categoryData} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
                  <XAxis type="number" tickFormatter={(value) => `€${value}`} fontSize={12} />
                  <YAxis type="category" dataKey="name" width={150} fontSize={12} />
                  <Tooltip 
                    formatter={(value: any) => [`€${value.toLocaleString('pt-PT', { minimumFractionDigits: 2 })}`, 'Valor']}
                    contentStyle={{ backgroundColor: 'white', border: '1px solid #e5e7eb' }}
                  />
                  <Bar dataKey="value" name="Despesa">
                    {monthlyData.categoryData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="bg-gradient-to-br from-white to-gray-50">
        <CardHeader>
          <CardTitle>Detalhamento por Categoria</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {monthlyData.categoryData.map((cat, idx) => {
              const Icon = cat.icon;
              const categoryExpenses = monthlyData.detailedExpenses.filter(e => e.category === cat.category);
              
              return (
                <div key={idx} className="border rounded-lg p-4" style={{ borderLeftColor: cat.color, borderLeftWidth: '4px' }}>
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full flex items-center justify-center" style={{ backgroundColor: `${cat.color}20` }}>
                        <Icon className="h-5 w-5" style={{ color: cat.color }} />
                      </div>
                      <div>
                        <h3 className="font-semibold">{cat.name}</h3>
                        <p className="text-sm text-gray-600">{categoryExpenses.length} despesas</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-xl font-bold" style={{ color: cat.color }}>
                        €{cat.value.toLocaleString('pt-PT', { minimumFractionDigits: 2 })}
                      </p>
                      <p className="text-sm text-gray-600">{cat.percentage.toFixed(1)}% do total</p>
                    </div>
                  </div>
                  
                  <div className="space-y-2 mt-3 pt-3 border-t">
                    {categoryExpenses.slice(0, 5).map((expense, expIdx) => (
                      <div key={expIdx} className="flex justify-between items-center text-sm">
                        <span className="text-gray-700">{expense.descricao || 'Sem descrição'}</span>
                        <span className="font-medium">€{(expense.valor || 0).toFixed(2)}</span>
                      </div>
                    ))}
                    {categoryExpenses.length > 5 && (
                      <p className="text-xs text-gray-500 text-center pt-2">
                        +{categoryExpenses.length - 5} despesas adicionais
                      </p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      <Card className="bg-gradient-to-br from-blue-50 to-indigo-50 border-l-4 border-l-blue-500">
        <CardHeader>
          <CardTitle className="text-blue-800">Categorias de Despesas</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {Object.entries(EXPENSE_CATEGORIES).map(([key, config]) => {
            const Icon = config.icon;
            return (
              <div key={key} className="bg-white rounded-lg p-3 shadow-sm">
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-8 h-8 rounded-full flex items-center justify-center" style={{ backgroundColor: `${config.color}20` }}>
                    <Icon className="h-4 w-4" style={{ color: config.color }} />
                  </div>
                  <h4 className="font-semibold" style={{ color: config.color }}>{config.name}</h4>
                </div>
                <div className="pl-11">
                  <p className="text-xs text-gray-600">
                    {config.subcategories.join(', ')}
                  </p>
                </div>
              </div>
            );
          })}
        </CardContent>
      </Card>
    </div>
  );
};

export default MonthlyAnalysis;

