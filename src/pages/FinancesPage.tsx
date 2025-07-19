import React, { useState, useEffect, useMemo } from 'react';
import PageLayout from '@/components/layout/PageLayout';
import FinancialReport from '@/components/finances/FinancialReport';
import ExpenseManager from '@/components/finances/ExpenseManager';
import EmptyFinanceState from '@/components/finances/EmptyFinanceState';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useLanguage } from '@/hooks/use-language';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ArrowDownCircle, ArrowUpCircle, DollarSign, TrendingUp, TrendingDown, Download, Filter, BarChart3, PieChart, Target, Calendar } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useExpenses } from '@/hooks/useExpenses';
import { usePayments } from '@/hooks/usePayments';
import { ResponsiveContainer, BarChart, CartesianGrid, XAxis, YAxis, Tooltip, Legend, Bar, LineChart, Line, PieChart as RechartsPieChart, Pie, Cell, AreaChart, Area, ComposedChart } from 'recharts';
import { format, parseISO, subMonths, startOfMonth, endOfMonth, isWithinInterval, subDays } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import useClients from '@/hooks/useClients';
import useAppointments from '@/hooks/useAppointments';

const FinancesPage = () => {
  const { t } = useLanguage();
  const [payments, setPayments] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<string>('dashboard');
  const [periodFilter, setPeriodFilter] = useState<'7d' | '30d' | '90d' | '1y' | 'all'>('30d');
  const [selectedMonth, setSelectedMonth] = useState<number>(new Date().getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState<number>(new Date().getFullYear());

  const { expenses, getTotalExpenses, isLoading: isLoadingExpenses } = useExpenses();
  const { payments: paymentsData, isLoading: isLoadingPayments } = usePayments();
  const { clients } = useClients();
  const { appointments } = useAppointments();

  // Métricas financeiras avançadas
  const financialMetrics = useMemo(() => {
    const now = new Date();
    let startDate: Date;
    
    switch (periodFilter) {
      case '7d':
        startDate = subDays(now, 7);
        break;
      case '30d':
        startDate = subDays(now, 30);
        break;
      case '90d':
        startDate = subDays(now, 90);
        break;
      case '1y':
        startDate = subDays(now, 365);
        break;
      default:
        startDate = new Date(0);
    }
    
    const filteredPayments = paymentsData.filter(payment => {
      const paymentDate = parseISO(payment.data);
      return paymentDate >= startDate;
    });
    
    const filteredExpenses = expenses.filter(expense => {
      const expenseDate = parseISO(expense.data);
      return expenseDate >= startDate;
    });
    
    const totalRevenue = filteredPayments.reduce((acc, payment) => acc + (payment.valor || 0), 0);
    const totalExpenses = filteredExpenses.reduce((acc, expense) => acc + (expense.valor || 0), 0);
    const profit = totalRevenue - totalExpenses;
    const profitMargin = totalRevenue > 0 ? (profit / totalRevenue) * 100 : 0;
    
    const avgRevenuePerPayment = filteredPayments.length > 0 ? totalRevenue / filteredPayments.length : 0;
    const avgExpensePerTransaction = filteredExpenses.length > 0 ? totalExpenses / filteredExpenses.length : 0;
    
    // Receita por cliente
    const revenueByClient = filteredPayments.reduce((acc, payment) => {
      acc[payment.id_cliente] = (acc[payment.id_cliente] || 0) + (payment.valor || 0);
      return acc;
    }, {} as Record<number, number>);
    
    const avgRevenuePerClient = Object.keys(revenueByClient).length > 0 ? 
      totalRevenue / Object.keys(revenueByClient).length : 0;
    
    // Top clientes por receita
    const topClientsByRevenue = Object.entries(revenueByClient)
      .map(([clientId, revenue]) => {
        const client = clients.find(c => c.id === parseInt(clientId));
        return {
          clientId: parseInt(clientId),
          clientName: client?.nome || 'Cliente Desconhecido',
          revenue: revenue as number
        };
      })
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 10);
    
    return {
      totalRevenue,
      totalExpenses,
      profit,
      profitMargin,
      avgRevenuePerPayment,
      avgExpensePerTransaction,
      avgRevenuePerClient,
      topClientsByRevenue,
      paymentsCount: filteredPayments.length,
      expensesCount: filteredExpenses.length
    };
  }, [paymentsData, expenses, clients, periodFilter]);

  // Dados para gráficos temporais
  const temporalData = useMemo(() => {
    const months = [];
    const now = new Date();
    
    for (let i = 11; i >= 0; i--) {
      const month = subMonths(now, i);
      const monthStart = startOfMonth(month);
      const monthEnd = endOfMonth(month);
      
      const monthPayments = paymentsData.filter(payment => {
        const paymentDate = parseISO(payment.data);
        return isWithinInterval(paymentDate, { start: monthStart, end: monthEnd });
      });
      
      const monthExpenses = expenses.filter(expense => {
        const expenseDate = parseISO(expense.data);
        return isWithinInterval(expenseDate, { start: monthStart, end: monthEnd });
      });
      
      const monthRevenue = monthPayments.reduce((acc, payment) => acc + (payment.valor || 0), 0);
      const monthExpenseTotal = monthExpenses.reduce((acc, expense) => acc + (expense.valor || 0), 0);
      
      months.push({
        month: format(month, 'MMM yyyy', { locale: ptBR }),
        monthShort: format(month, 'MMM', { locale: ptBR }),
        receita: monthRevenue,
        despesas: monthExpenseTotal,
        lucro: monthRevenue - monthExpenseTotal,
        transacoes: monthPayments.length + monthExpenses.length
      });
    }
    
    return months;
  }, [paymentsData, expenses]);

  // Distribuição de métodos de pagamento
  const paymentMethodsData = useMemo(() => {
    const methods = paymentsData.reduce((acc, payment) => {
      const method = (payment as any).metodo || 'Não especificado';
      acc[method] = (acc[method] || 0) + (payment.valor || 0);
      return acc;
    }, {} as Record<string, number>);
    return Object.entries(methods).map(([method, value]) => ({
      name: method,
      value,
      count: paymentsData.filter(p => ((p as any).metodo || 'Não especificado') === method).length
    }));
  }, [paymentsData]);

  // Distribuição de categorias de despesas
  const expenseCategoriesData = useMemo(() => {
    const categories = expenses.reduce((acc, expense) => {
      const category = expense.categoria || 'Não especificado';
      acc[category] = (acc[category] || 0) + (expense.valor || 0);
      return acc;
    }, {} as Record<string, number>);
    
    return Object.entries(categories).map(([category, value]) => ({
      name: category,
      value: value,
      count: expenses.filter(e => (e.categoria || 'Não especificado') === category).length
    }));
  }, [expenses]);

  // Dados para o mês específico selecionado
  const monthlyData = useMemo(() => {
  const filteredPayments = paymentsData.filter(payment => {
    const date = new Date(payment.data);
    return date.getMonth() + 1 === selectedMonth && date.getFullYear() === selectedYear;
  });

  const filteredExpenses = expenses.filter(expense => {
    const date = new Date(expense.data);
    return date.getMonth() + 1 === selectedMonth && date.getFullYear() === selectedYear;
  });

  const totalRevenueMonth = filteredPayments.reduce((acc, curr) => acc + (curr.valor || 0), 0);
  const totalExpensesMonth = filteredExpenses.reduce((acc, curr) => acc + (curr.valor || 0), 0);
  const totalProfitMonth = totalRevenueMonth - totalExpensesMonth;

    return {
      totalRevenueMonth,
      totalExpensesMonth,
      totalProfitMonth,
      paymentsCount: filteredPayments.length,
      expensesCount: filteredExpenses.length
    };
  }, [paymentsData, expenses, selectedMonth, selectedYear]);

  // Opções de meses e anos
  const monthOptions = [
    'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
    'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
  ];

  const currentYear = new Date().getFullYear();
  const yearOptions = Array.from({ length: 5 }, (_, i) => currentYear - i);

  const fetchPayments = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      const { data, error } = await supabase
        .from('pagamentos')
        .select(`
          *,
          clientes:id_cliente (
            nome
          )
        `)
        .order('data', { ascending: false });
      
      if (error) {
        console.error('Erro ao buscar pagamentos:', error);
        setError('Falha ao carregar pagamentos');
        toast.error('Erro ao carregar pagamentos');
        return;
      }
      
      if (!data) {
        setPayments([]);
        return;
      }
      
      const formattedPayments = data.map(payment => ({
        ...payment,
        cliente_nome: payment.clientes?.nome || 'Cliente Desconhecido'
      }));
      
      setPayments(formattedPayments);
    } catch (err) {
      console.error('Erro ao carregar pagamentos:', err);
      setError('Falha ao carregar pagamentos');
      toast.error('Erro ao carregar pagamentos');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchPayments();
  }, []);

  const handleExportData = () => {
    const exportData = {
      metricas: financialMetrics,
      dadosTemporais: temporalData,
      metodosPagamento: paymentMethodsData,
      categoriasDespesas: expenseCategoriesData,
      dadosMensais: monthlyData,
      periodo: periodFilter,
      dataExportacao: new Date().toISOString()
    };
    
    const dataStr = JSON.stringify(exportData, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
    
    const exportFileDefaultName = `financas-data-${format(new Date(), 'yyyy-MM-dd')}.json`;
    
    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    linkElement.click();
    
    toast.success('Dados financeiros exportados com sucesso!');
  };

  const getPeriodLabel = (period: string) => {
    switch (period) {
      case '7d': return 'Últimos 7 dias';
      case '30d': return 'Últimos 30 dias';
      case '90d': return 'Últimos 90 dias';
      case '1y': return 'Último ano';
      default: return 'Todos os dados';
    }
  };

  return (
    <PageLayout>
      <div className="space-y-6">
        {/* Cabeçalho */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold text-[#3f9094]">Dashboard Financeiro</h1>
            <p className="text-gray-600 mt-2">Análise completa de receitas, despesas e performance financeira</p>
          </div>
          <div className="flex gap-3">
            <Select value={periodFilter} onValueChange={(value: any) => setPeriodFilter(value)}>
              <SelectTrigger className="w-48">
                <Filter className="h-4 w-4 mr-2" />
                <SelectValue placeholder="Selecionar período" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="7d">Últimos 7 dias</SelectItem>
                <SelectItem value="30d">Últimos 30 dias</SelectItem>
                <SelectItem value="90d">Últimos 90 dias</SelectItem>
                <SelectItem value="1y">Último ano</SelectItem>
                <SelectItem value="all">Todos os dados</SelectItem>
              </SelectContent>
            </Select>
            <Button onClick={handleExportData} variant="outline" className="flex items-center gap-2">
              <Download className="h-4 w-4" />
              Exportar
            </Button>
          </div>
        </div>

        {/* KPIs Principais */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="bg-gradient-to-br from-white to-[#E6ECEA]/30 border-l-4 border-l-green-500">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-gray-700">Receita Total</CardTitle>
              <ArrowDownCircle className="h-5 w-5 text-green-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">
                €{financialMetrics.totalRevenue.toLocaleString('pt-PT', { minimumFractionDigits: 2 })}
              </div>
              <p className="text-xs text-gray-500 mt-1">
                {financialMetrics.paymentsCount} transações
              </p>
            </CardContent>
          </Card>
          
          <Card className="bg-gradient-to-br from-white to-[#E6ECEA]/30 border-l-4 border-l-red-500">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-gray-700">Despesas Total</CardTitle>
              <ArrowUpCircle className="h-5 w-5 text-red-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">
                €{financialMetrics.totalExpenses.toLocaleString('pt-PT', { minimumFractionDigits: 2 })}
              </div>
              <p className="text-xs text-gray-500 mt-1">
                {financialMetrics.expensesCount} transações
              </p>
            </CardContent>
          </Card>
          
          <Card className="bg-gradient-to-br from-white to-[#E6ECEA]/30 border-l-4 border-l-[#3f9094]">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-gray-700">Lucro Líquido</CardTitle>
              <DollarSign className="h-5 w-5 text-[#3f9094]" />
            </CardHeader>
            <CardContent>
              <div className={`text-2xl font-bold ${financialMetrics.profit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                €{financialMetrics.profit.toLocaleString('pt-PT', { minimumFractionDigits: 2 })}
              </div>
              <p className="text-xs text-gray-500 mt-1">
                Margem: {financialMetrics.profitMargin.toFixed(1)}%
              </p>
            </CardContent>
          </Card>
          
          <Card className="bg-gradient-to-br from-white to-[#E6ECEA]/30 border-l-4 border-l-[#5DA399]">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-gray-700">Receita por Cliente</CardTitle>
              <Target className="h-5 w-5 text-[#5DA399]" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-[#5DA399]">
                €{financialMetrics.avgRevenuePerClient.toLocaleString('pt-PT', { minimumFractionDigits: 2 })}
              </div>
              <p className="text-xs text-gray-500 mt-1">
                Média por cliente
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Tabs para diferentes visualizações */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
            <TabsTrigger value="temporal">Análise Temporal</TabsTrigger>
            <TabsTrigger value="metodos">Métodos Pagamento</TabsTrigger>
            <TabsTrigger value="clientes">Top Clientes</TabsTrigger>
            <TabsTrigger value="mensal">Análise Mensal</TabsTrigger>
          </TabsList>
          
          <TabsContent value="dashboard" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card className="bg-gradient-to-br from-white to-[#E6ECEA]/20">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <BarChart3 className="h-5 w-5" />
                    Receita vs Despesas (Últimos 12 meses)
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-[300px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={temporalData}>
                        <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
                        <XAxis dataKey="monthShort" fontSize={12} />
                        <YAxis tickFormatter={(value) => `€${value}`} fontSize={12} />
                        <Tooltip 
                          formatter={(value: any, name: string) => [
                            `€${value.toLocaleString('pt-PT', { minimumFractionDigits: 2 })}`, 
                            name
                          ]}
                        />
                        <Legend />
                        <Bar dataKey="receita" name="Receita Total" fill="#10b981" />
                        <Bar dataKey="despesas" name="Despesas Totais" fill="#ef4444" />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>
              
              <Card className="bg-gradient-to-br from-white to-[#E6ECEA]/20">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <TrendingUp className="h-5 w-5" />
                    Evolução do Lucro
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-[300px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={temporalData}>
                        <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
                        <XAxis dataKey="monthShort" fontSize={12} />
                        <YAxis tickFormatter={(value) => `€${value}`} fontSize={12} />
                        <Tooltip 
                          formatter={(value: any) => [
                            `€${value.toLocaleString('pt-PT', { minimumFractionDigits: 2 })}`, 
                            'Lucro'
                          ]}
                        />
                        <Line 
                          type="monotone" 
                          dataKey="lucro" 
                          stroke="#3f9094" 
                          strokeWidth={3}
                          dot={{ fill: '#3f9094', strokeWidth: 2, r: 4 }}
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
          
          <TabsContent value="temporal" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card className="bg-gradient-to-br from-white to-[#E6ECEA]/20">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <AreaChart className="h-5 w-5" />
                    Fluxo de Caixa Mensal
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-[350px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <ComposedChart data={temporalData}>
                        <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
                        <XAxis dataKey="monthShort" fontSize={12} />
                        <YAxis tickFormatter={(value) => `€${value}`} fontSize={12} />
                        <Tooltip 
                          formatter={(value: any, name: string) => [
                            `€${value.toLocaleString('pt-PT', { minimumFractionDigits: 2 })}`, 
                            name
                          ]}
                        />
                        <Legend />
                        <Area type="monotone" dataKey="receita" stackId="1" name="Receita Mensal" stroke="#10b981" fill="#10b981" fillOpacity={0.6} />
                        <Area type="monotone" dataKey="despesas" stackId="2" name="Despesas Mensais" stroke="#ef4444" fill="#ef4444" fillOpacity={0.6} />
                        <Line type="monotone" dataKey="lucro" name="Lucro Líquido" stroke="#3f9094" strokeWidth={3} />
                      </ComposedChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>
              
              <Card className="bg-gradient-to-br from-white to-[#E6ECEA]/20">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <BarChart3 className="h-5 w-5" />
                    Volume de Transações
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-[350px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={temporalData}>
                        <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
                        <XAxis dataKey="monthShort" fontSize={12} />
                        <YAxis fontSize={12} />
                        <Tooltip 
                          formatter={(value: any, name: string) => [value, name]}
                        />
                        <Bar dataKey="transacoes" name="Nº Transações" fill="#8AC1BB" />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
          
          <TabsContent value="metodos" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card className="bg-gradient-to-br from-white to-[#E6ECEA]/20">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <PieChart className="h-5 w-5" />
                    Métodos de Pagamento
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-[300px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <RechartsPieChart>
                        <Pie
                          data={paymentMethodsData}
                          cx="50%"
                          cy="50%"
                          labelLine={false}
                          label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                          outerRadius={80}
                          fill="#8884d8"
                          dataKey="value"
                        >
                          {paymentMethodsData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={['#3f9094', '#5DA399', '#8AC1BB', '#B1D4CF', '#E6ECEA'][index % 5]} />
                          ))}
                        </Pie>
                        <Tooltip formatter={(value: any) => [`€${value.toLocaleString('pt-PT', { minimumFractionDigits: 2 })}`, 'Valor']} />
                      </RechartsPieChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>
              
              <Card className="bg-gradient-to-br from-white to-[#E6ECEA]/20">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <PieChart className="h-5 w-5" />
                    Categorias de Despesas
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-[300px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <RechartsPieChart>
                        <Pie
                          data={expenseCategoriesData}
                          cx="50%"
                          cy="50%"
                          labelLine={false}
                          label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                          outerRadius={80}
                          fill="#8884d8"
                          dataKey="value"
                        >
                          {expenseCategoriesData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={['#ef4444', '#f97316', '#eab308', '#84cc16', '#10b981'][index % 5]} />
                          ))}
                        </Pie>
                        <Tooltip formatter={(value: any) => [`€${value.toLocaleString('pt-PT', { minimumFractionDigits: 2 })}`, 'Valor']} />
                      </RechartsPieChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
          
          <TabsContent value="clientes" className="space-y-6">
            <Card className="bg-gradient-to-br from-white to-[#E6ECEA]/20">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Target className="h-5 w-5" />
                  Top 10 Clientes por Receita
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {financialMetrics.topClientsByRevenue.map((client, index) => (
                    <div key={client.clientId} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-gradient-to-br from-[#3f9094] to-[#5DA399] rounded-full flex items-center justify-center text-white font-bold text-sm">
                          {index + 1}
                        </div>
                        <div>
                          <p className="font-medium">{client.clientName}</p>
                          <p className="text-sm text-gray-600">Cliente ID: {client.clientId}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-[#3f9094]">€{client.revenue.toFixed(2)}</p>
                        <p className="text-xs text-gray-500">
                          {((client.revenue / financialMetrics.totalRevenue) * 100).toFixed(1)}% do total
                        </p>
                      </div>
                    </div>
                  ))}
      </div>
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="mensal" className="space-y-6">
      {/* Seletor de mês e ano */}
      <div className="flex gap-4 mb-6">
        <div>
          <label className="block text-sm font-medium mb-1">Mês</label>
          <select
                  className="border rounded px-3 py-2 bg-white"
            value={selectedMonth}
            onChange={e => setSelectedMonth(Number(e.target.value))}
          >
            {monthOptions.map((month, idx) => (
              <option key={month} value={idx + 1}>{month}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Ano</label>
          <select
                  className="border rounded px-3 py-2 bg-white"
            value={selectedYear}
            onChange={e => setSelectedYear(Number(e.target.value))}
          >
            {yearOptions.map(year => (
              <option key={year} value={year}>{year}</option>
            ))}
          </select>
        </div>
      </div>
            
            {/* KPIs do mês */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card className="bg-gradient-to-br from-white to-[#E6ECEA]/30">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <ArrowDownCircle className="h-4 w-4 text-green-600" />
                    Receitas do Mês
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
                    €{monthlyData.totalRevenueMonth.toLocaleString('pt-PT', { minimumFractionDigits: 2 })}
            </div>
                  <p className="text-xs text-gray-500 mt-1">
                    {monthlyData.paymentsCount} pagamentos
                  </p>
          </CardContent>
        </Card>
              
              <Card className="bg-gradient-to-br from-white to-[#E6ECEA]/30">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <ArrowUpCircle className="h-4 w-4 text-red-600" />
                    Despesas do Mês
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
                    €{monthlyData.totalExpensesMonth.toLocaleString('pt-PT', { minimumFractionDigits: 2 })}
            </div>
                  <p className="text-xs text-gray-500 mt-1">
                    {monthlyData.expensesCount} despesas
                  </p>
          </CardContent>
        </Card>
              
              <Card className="bg-gradient-to-br from-white to-[#E6ECEA]/30">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <DollarSign className="h-4 w-4 text-[#3f9094]" />
                    Lucro do Mês
            </CardTitle>
          </CardHeader>
          <CardContent>
                  <div className={`text-2xl font-bold ${monthlyData.totalProfitMonth >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    €{monthlyData.totalProfitMonth.toLocaleString('pt-PT', { minimumFractionDigits: 2 })}
      </div>
                  <p className="text-xs text-gray-500 mt-1">
                    Margem: {monthlyData.totalRevenueMonth > 0 ? ((monthlyData.totalProfitMonth / monthlyData.totalRevenueMonth) * 100).toFixed(1) : 0}%
          </p>
        </CardContent>
      </Card>
            </div>
          </TabsContent>
        </Tabs>

        {/* Seção de Gestão */}
        <Tabs defaultValue="income" className="w-full">
        <TabsList className="mb-4 grid grid-cols-2 max-w-md">
          <TabsTrigger value="income" className="gap-2">
            <ArrowDownCircle className="h-4 w-4" />
            Receitas
          </TabsTrigger>
          <TabsTrigger value="expenses" className="gap-2">
            <ArrowUpCircle className="h-4 w-4" />
            Despesas
          </TabsTrigger>
        </TabsList>
          
        <TabsContent value="income">
          {isLoading ? (
            <div className="flex justify-center items-center h-64">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#3f9094]"></div>
              <span className="ml-2">Carregando dados financeiros...</span>
            </div>
          ) : error ? (
            <div className="flex flex-col items-center justify-center h-64 text-center">
              <p className="text-red-500 font-medium mb-2">Erro ao carregar dados financeiros</p>
              <p className="text-gray-600 mb-4">{error}</p>
              <button 
                onClick={fetchPayments}
                  className="px-4 py-2 bg-[#3f9094] text-white rounded-md hover:bg-[#2A5854]"
              >
                Tentar Novamente
              </button>
            </div>
          ) : payments.length === 0 ? (
            <EmptyFinanceState />
          ) : (
            <FinancialReport initialPayments={payments} />
          )}
        </TabsContent>
          
        <TabsContent value="expenses">
          <ExpenseManager />
        </TabsContent>
      </Tabs>
      </div>
    </PageLayout>
  );
};

export default FinancesPage;
