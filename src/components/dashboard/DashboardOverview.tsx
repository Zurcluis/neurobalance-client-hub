import React, { useEffect, useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Calendar, User, BarChart3, Plus, DollarSign, TrendingUp, TrendingDown, Users, Target, Clock, ArrowUpRight, ArrowDownRight, Download, Filter } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Link, useNavigate } from 'react-router-dom';
import UpcomingAppointmentsTable from '@/components/dashboard/UpcomingAppointmentsTable';
import useClients from '@/hooks/useClients';
import useAppointments from '@/hooks/useAppointments';
import usePayments from '@/hooks/usePayments';
import { useExpenses } from '@/hooks/useExpenses';
import { format, isToday, parseISO, isFuture, subDays, subMonths, startOfMonth, endOfMonth, isWithinInterval } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { ResponsiveContainer, BarChart, CartesianGrid, XAxis, YAxis, Tooltip, Legend, Bar, LineChart, Line, PieChart, Pie, Cell, ComposedChart, Area, AreaChart } from 'recharts';
import { Database } from '@/integrations/supabase/types';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';

type Client = Database['public']['Tables']['clientes']['Row'];

const getClientSessionsAndPayments = (clientId: number, appointments: any[], payments: any[]) => {
  const clientAppointments = appointments.filter(apt => apt.id_cliente === clientId);
  const clientPayments = payments.filter(payment => payment.id_cliente === clientId);
  
  const sessionCount = clientAppointments.length;
  const totalPaid = clientPayments.reduce((total, payment) => total + (payment.valor || 0), 0);
  
  return { sessionCount, totalPaid };
};

const RecentClientsTable = ({ clients, appointments, payments }: { clients: Client[], appointments: any[], payments: any[] }) => {
  const navigate = useNavigate();
  
  return (
    <div className="space-y-2">
      {clients.map(client => {
        const { sessionCount, totalPaid } = getClientSessionsAndPayments(client.id, appointments, payments);
        return (
          <div 
            key={client.id} 
            className="flex items-center justify-between p-3 bg-gradient-to-r from-[#E6ECEA]/30 to-[#B1D4CF]/20 rounded-lg cursor-pointer hover:from-[#E6ECEA]/50 hover:to-[#B1D4CF]/30 transition-all duration-200 border border-[#B1D4CF]/20"
            onClick={() => navigate(`/clients/${client.id}`)}
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-[#3f9094] to-[#5DA399] rounded-full flex items-center justify-center text-white font-medium">
                {client.nome.charAt(0).toUpperCase()}
              </div>
            <div>
                <p className="font-medium text-gray-800">{client.nome}</p>
              <p className="text-sm text-gray-600">{client.email || 'Sem email'}</p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-sm font-medium text-[#3f9094]">{sessionCount} sessões</p>
              <p className="text-xs text-gray-500">€{totalPaid.toLocaleString('pt-PT', { minimumFractionDigits: 2 })}</p>
            </div>
          </div>
        );
      })}
      {clients.length > 3 && (
        <Link 
          to="/clients" 
          className="text-[#3f9094] hover:text-[#2A5854] text-sm flex justify-center mt-2 font-medium"
        >
          Ver todos os clientes →
        </Link>
      )}
    </div>
  );
};

const DashboardOverview = () => {
  const navigate = useNavigate();
  const { clients, isLoading: isClientsLoading } = useClients();
  const { appointments, isLoading: isAppointmentsLoading } = useAppointments();
  const { payments, isLoading: isPaymentsLoading, getTotalRevenue } = usePayments();
  const { expenses, isLoading: isExpensesLoading, getTotalExpenses } = useExpenses();
  
  const [todayAppointments, setTodayAppointments] = useState<any[]>([]);
  const [upcomingAppointments, setUpcomingAppointments] = useState<any[]>([]);
  const [completedSessions, setCompletedSessions] = useState<number>(0);
  const [totalSessions, setTotalSessions] = useState<number>(0);
  const [recentClients, setRecentClients] = useState<any[]>([]);
  const [periodFilter, setPeriodFilter] = useState<'7d' | '30d' | '90d' | '1y' | 'all'>('30d');
  
  // Métricas avançadas
  const advancedMetrics = useMemo(() => {
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
    
    const filteredClients = clients.filter(client => {
      const clientDate = client.criado_em ? parseISO(client.criado_em) : new Date(0);
      return clientDate >= startDate;
    });
    
    const filteredAppointments = appointments.filter(apt => {
      const aptDate = parseISO(apt.data);
      return aptDate >= startDate;
    });
    
    const filteredPayments = payments.filter(payment => {
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
    
    const completedAppts = filteredAppointments.filter(apt => apt.estado === 'realizado').length;
    const totalAppts = filteredAppointments.length;
    const completionRate = totalAppts > 0 ? (completedAppts / totalAppts) * 100 : 0;
    
    const activeClients = filteredClients.filter(client => client.estado === 'ongoing' || !client.estado).length;
    const conversionRate = filteredClients.length > 0 ? (activeClients / filteredClients.length) * 100 : 0;
    
    const avgRevenuePerClient = activeClients > 0 ? totalRevenue / activeClients : 0;
    const avgSessionsPerClient = activeClients > 0 ? completedAppts / activeClients : 0;
    
    return {
      totalClients: filteredClients.length,
      activeClients,
      totalAppointments: totalAppts,
      completedAppointments: completedAppts,
      totalRevenue,
      totalExpenses,
      profit,
      completionRate,
      conversionRate,
      avgRevenuePerClient,
      avgSessionsPerClient
    };
  }, [clients, appointments, payments, expenses, periodFilter]);
  
  // Dados para gráficos temporais
  const temporalData = useMemo(() => {
    const months = [];
    const now = new Date();
    
    for (let i = 5; i >= 0; i--) {
      const month = subMonths(now, i);
      const monthStart = startOfMonth(month);
      const monthEnd = endOfMonth(month);
      
      const monthClients = clients.filter(client => {
        const clientDate = client.criado_em ? parseISO(client.criado_em) : new Date(0);
        return isWithinInterval(clientDate, { start: monthStart, end: monthEnd });
      }).length;
      
      const monthAppointments = appointments.filter(apt => {
        const aptDate = parseISO(apt.data);
        return isWithinInterval(aptDate, { start: monthStart, end: monthEnd });
      }).length;
      
      const monthRevenue = payments.filter(payment => {
        const paymentDate = parseISO(payment.data);
        return isWithinInterval(paymentDate, { start: monthStart, end: monthEnd });
      }).reduce((acc, payment) => acc + (payment.valor || 0), 0);
      
      const monthExpenses = expenses.filter(expense => {
        const expenseDate = parseISO(expense.data);
        return isWithinInterval(expenseDate, { start: monthStart, end: monthEnd });
      }).reduce((acc, expense) => acc + (expense.valor || 0), 0);
      
      months.push({
        month: format(month, 'MMM', { locale: ptBR }),
        clientes: monthClients,
        agendamentos: monthAppointments,
        receita: monthRevenue,
        despesas: monthExpenses,
        lucro: monthRevenue - monthExpenses
      });
    }
    
    return months;
  }, [clients, appointments, payments, expenses]);
  
  // Dados para gráfico de pizza - distribuição de clientes por estado
  const clientStatusData = useMemo(() => {
    const statusCount = clients.reduce((acc, client) => {
      const status = client.estado || 'ongoing';
      acc[status] = (acc[status] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    
    const statusLabels = {
      ongoing: 'Em Andamento',
      thinking: 'Pensando',
      'no-need': 'Sem Necessidade',
      finished: 'Finalizado',
      call: 'Ligar'
    };
    
    return Object.entries(statusCount).map(([status, count]) => ({
      name: statusLabels[status] || status,
      value: count,
      color: {
        ongoing: '#3f9094',
        thinking: '#5DA399',
        'no-need': '#8AC1BB',
        finished: '#B1D4CF',
        call: '#E6ECEA'
      }[status] || '#3f9094'
    }));
  }, [clients]);
  
  useEffect(() => {
    if (!isAppointmentsLoading && appointments) {
      const today = new Date();
      
      const todaysAppts = appointments.filter(appointment => {
        const appointmentDate = parseISO(appointment.data);
        return isToday(appointmentDate);
      }).sort((a, b) => new Date(a.data).getTime() - new Date(b.data).getTime());
      
      const futureAppts = appointments.filter(appointment => {
        const appointmentDate = parseISO(appointment.data);
        return isFuture(appointmentDate);
      }).sort((a, b) => new Date(a.data).getTime() - new Date(b.data).getTime());
      
      const completed = appointments.filter(appointment => {
        const appointmentDate = parseISO(appointment.data);
        return appointmentDate < today && appointment.estado === 'realizado';
      }).length;

      const total = appointments.length;
      
      setTodayAppointments(todaysAppts);
      setUpcomingAppointments(futureAppts.slice(0, 4));
      setCompletedSessions(completed);
      setTotalSessions(total);
    }
  }, [appointments, isAppointmentsLoading]);
  
  useEffect(() => {
    if (!isClientsLoading && clients) {
      const sortedClients = [...clients]
        .sort((a, b) => {
          const dateA = a.criado_em ? new Date(a.criado_em).getTime() : 0;
          const dateB = b.criado_em ? new Date(b.criado_em).getTime() : 0;
          return dateB - dateA;
        })
        .slice(0, 5);
        
      setRecentClients(sortedClients);
    }
  }, [clients, isClientsLoading]);
    
  const formatAppointmentsForTable = (appointments) => {
    return appointments.map(appointment => ({
      id: appointment.id?.toString() || '',
      title: appointment.titulo || '',
      date: appointment.data || '',
      clientName: appointment.clientes?.nome || 'Cliente não definido',
      clientId: appointment.id_cliente?.toString() || '',
      type: appointment.tipo || '',
      confirmed: appointment.estado === 'confirmado' || appointment.estado === 'realizado'
    }));
  };
  
  const handleExportData = () => {
    const exportData = {
      metricas: advancedMetrics,
      dadosTemporais: temporalData,
      distribuicaoClientes: clientStatusData,
      dataExportacao: new Date().toISOString()
    };
    
    const dataStr = JSON.stringify(exportData, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
    
    const exportFileDefaultName = `dashboard-data-${format(new Date(), 'yyyy-MM-dd')}.json`;
    
    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    linkElement.click();
    
    toast.success('Dados exportados com sucesso!');
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
  
  if (isClientsLoading || isAppointmentsLoading || isPaymentsLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#3f9094] mx-auto mb-4"></div>
          <p className="text-lg font-medium text-gray-700">Carregando dados...</p>
          <p className="text-sm text-gray-500">Aguarde enquanto processamos as informações</p>
        </div>
      </div>
    );
  }
  
  if (clients.length === 0) {
    return (
      <div className="space-y-6">
        <div className="flex flex-col items-center justify-center p-12 bg-gradient-to-br from-white to-[#E6ECEA]/30 rounded-xl shadow-lg border border-[#B1D4CF]/20 text-center">
          <div className="w-16 h-16 bg-gradient-to-br from-[#3f9094] to-[#5DA399] rounded-full flex items-center justify-center mb-4">
            <User className="h-8 w-8 text-white" />
          </div>
          <h2 className="text-2xl font-bold text-[#3f9094] mb-4">Bem-vindo ao NeuroBalance CMS</h2>
          <p className="text-gray-600 max-w-md mb-8">
            Este é o seu sistema de gestão de clientes. Comece adicionando o seu primeiro cliente para
            visualizar estatísticas e agendamentos avançados.
          </p>
          <div className="flex gap-4">
            <Button 
              asChild
              className="bg-gradient-to-r from-[#3f9094] to-[#5DA399] hover:from-[#2A5854] hover:to-[#3f9094] shadow-lg"
            >
              <Link to="/clients">
                <Plus className="h-4 w-4 mr-2" />
                Adicionar Cliente
              </Link>
            </Button>
            <Button 
              asChild
              variant="outline" 
              className="border-[#3f9094] text-[#3f9094] hover:bg-[#3f9094] hover:text-white"
            >
              <Link to="/calendar">
                <Calendar className="h-4 w-4 mr-2" />
                Ver Calendário
              </Link>
            </Button>
          </div>
        </div>
      </div>
    );
  }
  
  return (
    <div className="space-y-6">
      {/* Próximos Agendamentos */}
      <Card className="bg-gradient-to-br from-white to-[#E6ECEA]/30 border-l-4 border-l-[#5DA399]">
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-lg font-bold text-[#3f9094] flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Próximos Agendamentos
          </CardTitle>
          <Button asChild variant="outline" className="text-[#3f9094] border-[#3f9094]">
            <Link to="/calendar">Ver Calendário</Link>
          </Button>
        </CardHeader>
        <CardContent>
          {upcomingAppointments.length > 0 ? (
            <UpcomingAppointmentsTable appointments={formatAppointmentsForTable(upcomingAppointments)} />
          ) : (
            <div className="py-8 text-center">
              <p className="text-gray-500">Nenhum agendamento futuro encontrado.</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* KPIs Principais */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="bg-gradient-to-br from-white to-[#E6ECEA]/30 border-l-4 border-l-[#3f9094] hover:shadow-lg transition-all duration-200 cursor-pointer" onClick={() => navigate('/clients')}>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-700">Total de Clientes</CardTitle>
            <Users className="h-5 w-5 text-[#3f9094]" />
          </CardHeader>
          <CardContent>
            <div className="flex items-baseline justify-between">
              <div>
                <div className="text-2xl font-bold text-[#3f9094]">{advancedMetrics.totalClients}</div>
                <p className="text-xs text-gray-500 mt-1">
                  {advancedMetrics.activeClients} ativos
                </p>
              </div>
              <div className="flex items-center text-green-600 text-sm">
                <ArrowUpRight className="h-4 w-4" />
                <span className="font-medium">{advancedMetrics.conversionRate.toFixed(1)}%</span>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="bg-gradient-to-br from-white to-[#E6ECEA]/30 border-l-4 border-l-[#5DA399] hover:shadow-lg transition-all duration-200 cursor-pointer" onClick={() => navigate('/calendar')}>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-700">Agendamentos</CardTitle>
            <Calendar className="h-5 w-5 text-[#5DA399]" />
          </CardHeader>
          <CardContent>
            <div className="flex items-baseline justify-between">
              <div>
                <div className="text-2xl font-bold text-[#5DA399]">{advancedMetrics.totalAppointments}</div>
                <p className="text-xs text-gray-500 mt-1">
                  {advancedMetrics.completedAppointments} realizados
                </p>
              </div>
              <div className="flex items-center text-green-600 text-sm">
                <Target className="h-4 w-4" />
                <span className="font-medium">{advancedMetrics.completionRate.toFixed(1)}%</span>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="bg-gradient-to-br from-white to-[#E6ECEA]/30 border-l-4 border-l-[#8AC1BB] hover:shadow-lg transition-all duration-200 cursor-pointer" onClick={() => navigate('/finances')}>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-700">Receita Total</CardTitle>
            <TrendingUp className="h-5 w-5 text-[#8AC1BB]" />
          </CardHeader>
          <CardContent>
            <div className="flex items-baseline justify-between">
              <div>
                <div className="text-2xl font-bold text-[#8AC1BB]">€{advancedMetrics.totalRevenue.toLocaleString('pt-PT', { minimumFractionDigits: 2 })}</div>
                <p className="text-xs text-gray-500 mt-1">
                  €{advancedMetrics.avgRevenuePerClient.toFixed(2)} por cliente
                </p>
              </div>
              <div className="flex items-center text-green-600 text-sm">
                <ArrowUpRight className="h-4 w-4" />
                <span className="font-medium">+12.5%</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-white to-[#E6ECEA]/30 border-l-4 border-l-[#B1D4CF] hover:shadow-lg transition-all duration-200 cursor-pointer" onClick={() => navigate('/finances')}>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-700">Lucro Líquido</CardTitle>
            <DollarSign className="h-5 w-5 text-[#B1D4CF]" />
          </CardHeader>
          <CardContent>
            <div className="flex items-baseline justify-between">
              <div>
                <div className={`text-2xl font-bold ${advancedMetrics.profit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  €{advancedMetrics.profit.toLocaleString('pt-PT', { minimumFractionDigits: 2 })}
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  Margem: {advancedMetrics.totalRevenue > 0 ? ((advancedMetrics.profit / advancedMetrics.totalRevenue) * 100).toFixed(1) : 0}%
                </p>
              </div>
              <div className={`flex items-center text-sm ${advancedMetrics.profit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {advancedMetrics.profit >= 0 ? <ArrowUpRight className="h-4 w-4" /> : <ArrowDownRight className="h-4 w-4" />}
                <span className="font-medium">{advancedMetrics.profit >= 0 ? '+' : ''}8.3%</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
      
      {/* Gráficos e Análises */}
      <Tabs defaultValue="temporal" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="temporal">Análise Temporal</TabsTrigger>
          <TabsTrigger value="clientes">Distribuição Clientes</TabsTrigger>
          <TabsTrigger value="financeiro">Análise Financeira</TabsTrigger>
          <TabsTrigger value="resumo">Resumo Executivo</TabsTrigger>
        </TabsList>
        
        <TabsContent value="temporal" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className="bg-gradient-to-br from-white to-[#E6ECEA]/20">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="h-5 w-5" />
                  Evolução de Clientes e Agendamentos
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <ComposedChart data={temporalData}>
                      <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
                      <XAxis dataKey="month" fontSize={12} />
                      <YAxis yAxisId="left" fontSize={12} />
                      <YAxis yAxisId="right" orientation="right" fontSize={12} />
                      <Tooltip 
                        formatter={(value: any, name: string) => [
                          typeof value === 'number' ? value.toLocaleString() : value, 
                          name
                        ]}
                      />
                      <Legend />
                      <Bar yAxisId="left" dataKey="clientes" name="Novos Clientes" fill="#3f9094" />
                      <Line yAxisId="right" type="monotone" dataKey="agendamentos" name="Total Agendamentos" stroke="#5DA399" strokeWidth={3} />
                    </ComposedChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
            
            <Card className="bg-gradient-to-br from-white to-[#E6ECEA]/20">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5" />
                  Evolução Financeira
            </CardTitle>
          </CardHeader>
              <CardContent>
                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={temporalData}>
                      <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
                      <XAxis dataKey="month" fontSize={12} />
                      <YAxis tickFormatter={(value) => `€${value}`} fontSize={12} />
                      <Tooltip 
                        formatter={(value: any, name: string) => [
                          `€${value.toLocaleString('pt-PT', { minimumFractionDigits: 2 })}`, 
                          name
                        ]}
                      />
                      <Legend />
                      <Area type="monotone" dataKey="receita" stackId="1" name="Receita Mensal" stroke="#3f9094" fill="#3f9094" fillOpacity={0.6} />
                      <Area type="monotone" dataKey="despesas" stackId="2" name="Despesas Mensais" stroke="#ff6b6b" fill="#ff6b6b" fillOpacity={0.6} />
                      <Line type="monotone" dataKey="lucro" name="Lucro Líquido" stroke="#00c851" strokeWidth={3} />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
              </div>
        </TabsContent>
        
        <TabsContent value="clientes" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className="bg-gradient-to-br from-white to-[#E6ECEA]/20">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  Distribuição por Estado
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={clientStatusData}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="value"
                      >
                        {clientStatusData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(value: any) => [value, 'Clientes']} />
                    </PieChart>
                  </ResponsiveContainer>
              </div>
          </CardContent>
        </Card>
        
            <Card className="bg-gradient-to-br from-white to-[#E6ECEA]/20">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Clock className="h-5 w-5" />
                  Clientes Recentes
            </CardTitle>
          </CardHeader>
              <CardContent>
                <RecentClientsTable clients={recentClients} appointments={appointments} payments={payments} />
          </CardContent>
        </Card>
      </div>
        </TabsContent>
        
        <TabsContent value="financeiro" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className="bg-gradient-to-br from-white to-[#E6ECEA]/20">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <DollarSign className="h-5 w-5" />
                  Receita vs Despesas
            </CardTitle>
          </CardHeader>
              <CardContent>
                <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={temporalData}>
                  <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
                      <XAxis dataKey="month" fontSize={12} />
                      <YAxis tickFormatter={(value) => `€${value}`} fontSize={12} />
                  <Tooltip 
                        formatter={(value: any, name: string) => [
                          `€${value.toLocaleString('pt-PT', { minimumFractionDigits: 2 })}`, 
                          name
                        ]}
                  />
                      <Legend />
                      <Bar dataKey="receita" name="Receita Total" fill="#3f9094" />
                      <Bar dataKey="despesas" name="Despesas Totais" fill="#ff6b6b" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
            
            <Card className="bg-gradient-to-br from-white to-[#E6ECEA]/20">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5" />
                  Margem de Lucro
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={temporalData}>
                      <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
                      <XAxis dataKey="month" fontSize={12} />
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
                        stroke="#00c851" 
                        strokeWidth={3} 
                        dot={{ fill: '#00c851', strokeWidth: 2, r: 4 }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
        
        <TabsContent value="resumo" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className="bg-gradient-to-br from-white to-[#E6ECEA]/20">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="h-5 w-5" />
                  Agendamentos de Hoje
                </CardTitle>
              </CardHeader>
              <CardContent>
                {todayAppointments.length > 0 ? (
                  <UpcomingAppointmentsTable appointments={formatAppointmentsForTable(todayAppointments)} />
                ) : (
                  <div className="py-8 text-center">
                    <Calendar className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                    <p className="text-gray-500">Sem agendamentos para hoje</p>
                    <Link 
                      to="/calendar" 
                      className="text-[#3f9094] hover:text-[#2A5854] text-sm mt-2 inline-block font-medium"
                    >
                      Ir para o calendário →
                    </Link>
                  </div>
                )}
              </CardContent>
            </Card>
            
            <Card className="bg-gradient-to-br from-white to-[#E6ECEA]/20">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="h-5 w-5" />
                  Métricas de Performance
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Taxa de Conversão</span>
                    <span className="font-bold text-[#3f9094]">{advancedMetrics.conversionRate.toFixed(1)}%</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Taxa de Conclusão</span>
                    <span className="font-bold text-[#5DA399]">{advancedMetrics.completionRate.toFixed(1)}%</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Sessões por Cliente</span>
                    <span className="font-bold text-[#8AC1BB]">{advancedMetrics.avgSessionsPerClient.toFixed(1)}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Receita por Cliente</span>
                    <span className="font-bold text-[#B1D4CF]">€{advancedMetrics.avgRevenuePerClient.toFixed(2)}</span>
                  </div>
                  <div className="pt-4 border-t">
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium text-gray-700">Período de Análise</span>
                      <span className="text-xs text-gray-500">{getPeriodLabel(periodFilter)}</span>
                    </div>
                  </div>
            </div>
          </CardContent>
        </Card>
      </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default DashboardOverview;
