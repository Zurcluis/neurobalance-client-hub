import React, { useEffect, useState, useMemo } from 'react';
import PageLayout from '@/components/layout/PageLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  PieChart,
  Pie,
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  Cell,
  ResponsiveContainer,
  Legend,
  Area,
  AreaChart,
  ComposedChart
} from 'recharts';
import { ChartContainer, ChartTooltipContent, ChartLegendContent } from '@/components/ui/chart';
import { cn } from '@/lib/utils';
import { 
  differenceInYears, 
  format, 
  subMonths, 
  subDays, 
  isAfter, 
  isBefore, 
  parseISO,
  startOfMonth,
  endOfMonth,
  eachMonthOfInterval,
  eachDayOfInterval,
  startOfDay,
  endOfDay
} from 'date-fns';
import { pt } from 'date-fns/locale';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useClients } from '@/hooks/useClients';
import { useAppointments } from '@/hooks/useAppointments';
import { usePayments } from '@/hooks/usePayments';
import { Database } from '@/integrations/supabase/types';
import { 
  TrendingUp, 
  TrendingDown, 
  Users, 
  Calendar, 
  Euro, 
  Clock,
  Target,
  Activity,
  Download,
  Filter,
  BarChart3,
  PieChart as PieChartIcon,
  LineChart as LineChartIcon
} from 'lucide-react';
import { toast } from 'sonner';

// Cores para os gráficos
const COLORS = ['#3f9094', '#5DA399', '#8AC1BB', '#B1D4CF', '#D8E6E3', '#265255'];

type Client = Database['public']['Tables']['clientes']['Row'];
type Appointment = Database['public']['Tables']['agendamentos']['Row'];

interface KPICardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: React.ReactNode;
  trend?: {
    value: number;
    isPositive: boolean;
  };
  color?: string;
}

const KPICard: React.FC<KPICardProps> = ({ title, value, subtitle, icon, trend, color = '#3f9094' }) => (
  <Card className="hover:shadow-xl transition-all duration-300 hover:scale-105 border-l-4" style={{ borderLeftColor: color }}>
    <CardContent className="p-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="p-3 rounded-xl shadow-sm" style={{ backgroundColor: `${color}20` }}>
            <div style={{ color }}>{icon}</div>
          </div>
          <div>
            <p className="text-sm font-medium text-gray-600 dark:text-gray-400">{title}</p>
            <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">{value}</p>
            {subtitle && <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{subtitle}</p>}
          </div>
        </div>
        {trend && (
          <div className={`flex items-center space-x-1 ${trend.isPositive ? 'text-green-600' : 'text-red-600'}`}>
            {trend.isPositive ? <TrendingUp size={18} /> : <TrendingDown size={18} />}
            <span className="text-sm font-bold">{Math.abs(trend.value)}%</span>
          </div>
        )}
      </div>
    </CardContent>
  </Card>
);

const StatisticsPage = () => {
  const { clients } = useClients();
  const { appointments } = useAppointments();
  const { payments } = usePayments();
  
  const [selectedPeriod, setSelectedPeriod] = useState<'7d' | '30d' | '90d' | '1y' | 'all'>('30d');
  const [selectedView, setSelectedView] = useState<'overview' | 'clients' | 'appointments' | 'financial'>('overview');
  const [isLoading, setIsLoading] = useState(false);

  // Função para filtrar dados por período
  const filterByPeriod = (data: any[], dateField: string) => {
    if (selectedPeriod === 'all') return data;
    const now = new Date();
    let startDate: Date;
    switch (selectedPeriod) {
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
        return data;
    }
    return data.filter(item => {
      const itemDate = new Date(item[dateField]);
      return itemDate >= startOfDay(startDate) && itemDate <= endOfDay(now);
    });
  };

  // Dados filtrados
  const filteredClients = useMemo(() => filterByPeriod(clients || [], 'criado_em'), [clients, selectedPeriod]);
  const filteredAppointments = useMemo(() => filterByPeriod(appointments || [], 'criado_em'), [appointments, selectedPeriod]);
  const filteredPayments = useMemo(() => filterByPeriod(payments || [], 'data'), [payments, selectedPeriod]);

  // Cálculos de KPIs
  const kpis = useMemo(() => {
    const totalClients = filteredClients.length;
    const totalAppointments = filteredAppointments.length;
    const totalRevenue = filteredPayments.reduce((sum, payment) => sum + (payment.valor || 0), 0) || 0;
    const avgRevenuePerClient = totalClients > 0 ? totalRevenue / totalClients : 0;
    // Agendamentos por estado
    const appointmentsByStatus = filteredAppointments.reduce((acc, appointment) => {
      const status = appointment.estado || 'pendente';
      acc[status] = (acc[status] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    const completedAppointments = appointmentsByStatus['realizado'] || 0;
    const completionRate = totalAppointments > 0 ? (completedAppointments / totalAppointments) * 100 : 0;
    // Clientes por estado
    const clientsByStatus = filteredClients.reduce((acc, client) => {
      const status = client.estado || 'ongoing';
      acc[status] = (acc[status] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    const activeClients = clientsByStatus['ongoing'] || 0;
    const conversionRate = totalClients > 0 ? (activeClients / totalClients) * 100 : 0;
    return {
      totalClients,
      totalAppointments,
      totalRevenue,
      avgRevenuePerClient,
      completionRate,
      conversionRate,
      activeClients,
      appointmentsByStatus,
      clientsByStatus
    };
  }, [filteredClients, filteredAppointments, filteredPayments]);

  // Dados para gráficos temporais
  const timelineData = useMemo(() => {
    if (!filteredClients || !filteredAppointments || !filteredPayments) return [];
    const now = new Date();
    const startDate = subMonths(now, 6);
    const months = eachMonthOfInterval({ start: startDate, end: now });
    return months.map(month => {
      const monthStart = startOfMonth(month);
      const monthEnd = endOfMonth(month);
      const monthClients = filteredClients.filter(client => {
        const clientDate = new Date(client.criado_em);
        return clientDate >= monthStart && clientDate <= monthEnd;
      }).length;
      const monthAppointments = filteredAppointments.filter(appointment => {
        const appointmentDate = new Date(appointment.criado_em);
        return appointmentDate >= monthStart && appointmentDate <= monthEnd;
      }).length;
      const monthRevenue = filteredPayments.filter(payment => {
        const paymentDate = new Date(payment.data);
        return paymentDate >= monthStart && paymentDate <= monthEnd;
      }).reduce((sum, payment) => sum + (payment.valor || 0), 0);
      return {
        month: format(month, 'MMM yyyy', { locale: pt }),
        clients: monthClients,
        appointments: monthAppointments,
        revenue: monthRevenue
      };
    });
  }, [filteredClients, filteredAppointments, filteredPayments]);

  // Dados para análise de géneros
  const genderData = useMemo((): Array<{name: string, value: number}> => {
    if (!filteredClients) return [];
    const genderCounts = filteredClients.reduce((acc, client) => {
      const gender = client.genero || 'Não especificado';
      acc[gender] = (acc[gender] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    return Object.entries(genderCounts).map(([name, value]) => ({ name, value: value as number }));
  }, [filteredClients]);

  // Dados para análise de idades
  const ageData = useMemo((): Array<{name: string, value: number}> => {
    if (!filteredClients) return [];
    const ageGroups = {
      "0-18": 0,
      "19-30": 0,
      "31-40": 0,
      "41-50": 0,
      "51-60": 0,
      "61+": 0
    };
    filteredClients.forEach(client => {
      if (client.data_nascimento) {
        const age = differenceInYears(new Date(), new Date(client.data_nascimento));
        if (age <= 18) ageGroups["0-18"]++;
        else if (age <= 30) ageGroups["19-30"]++;
        else if (age <= 40) ageGroups["31-40"]++;
        else if (age <= 50) ageGroups["41-50"]++;
        else if (age <= 60) ageGroups["51-60"]++;
        else ageGroups["61+"]++;
      }
    });
    return Object.entries(ageGroups)
      .filter(([_, value]) => value > 0)
      .map(([name, value]) => ({ name, value: value as number }));
  }, [filteredClients]);

  // Dados para análise de tipos de agendamento
  const appointmentTypeData = useMemo((): Array<{name: string, value: number}> => {
    if (!filteredAppointments) return [];
    const typeCounts = filteredAppointments.reduce((acc, appointment) => {
      const type = appointment.tipo || 'Não especificado';
      acc[type] = (acc[type] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    return Object.entries(typeCounts).map(([name, value]) => ({ name, value: value as number }));
  }, [filteredAppointments]);

  // Dados para análise de métodos de pagamento
  const paymentMethodData = useMemo((): Array<{name: string, value: number}> => {
    if (!filteredPayments) return [];
    const methodCounts = filteredPayments.reduce((acc, payment) => {
      const method = payment.tipo || 'Não especificado';
      acc[method] = (acc[method] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    return Object.entries(methodCounts).map(([name, value]) => ({ name, value: value as number }));
  }, [filteredPayments]);

  // Função para exportar dados
  const exportData = () => {
    const data = {
      kpis,
      timelineData,
      genderData,
      ageData,
      appointmentTypeData,
      paymentMethodData,
      exportDate: new Date().toISOString()
    };
    
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `estatisticas-${format(new Date(), 'yyyy-MM-dd')}.json`;
    a.click();
    URL.revokeObjectURL(url);
    
    toast.success('Dados exportados com sucesso!');
  };

  const chartConfig = {
    primary: { 
      label: "Primary",
      color: "#3f9094" 
    },
    secondary: { 
      label: "Secondary",
      color: "#5DA399" 
    },
    tertiary: { 
      label: "Tertiary",
      color: "#8AC1BB" 
    },
    quaternary: { 
      label: "Quaternary",
      color: "#B1D4CF" 
    },
  } satisfies any;

  return (
    <PageLayout>
      <div className="space-y-6">
        {/* Header Melhorado */}
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-[#3f9094] to-[#2A5854] bg-clip-text text-transparent">
              Estatísticas & Analytics
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mt-1">
              Análise completa do desempenho e insights da clínica
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <Select value={selectedPeriod} onValueChange={(value: any) => setSelectedPeriod(value)}>
              <SelectTrigger className="w-48">
                <Filter className="h-4 w-4 mr-2" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="7d">Últimos 7 dias</SelectItem>
                <SelectItem value="30d">Últimos 30 dias</SelectItem>
                <SelectItem value="90d">Últimos 90 dias</SelectItem>
                <SelectItem value="1y">Último ano</SelectItem>
                <SelectItem value="all">Todos os dados</SelectItem>
              </SelectContent>
            </Select>
            
            <Button onClick={exportData} variant="outline" size="sm" className="flex items-center gap-2">
              <Download className="h-4 w-4" />
              <span className="hidden sm:inline">Exportar Dados</span>
            </Button>
                  </div>
              </div>

        {/* KPIs Dashboard */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <KPICard
            title="Total de Clientes"
            value={kpis.totalClients}
            subtitle={`${kpis.activeClients} ativos`}
            icon={<Users className="h-6 w-6" />}
            color="#3f9094"
          />
          
          <KPICard
            title="Agendamentos"
            value={kpis.totalAppointments}
            subtitle={`${kpis.completionRate.toFixed(1)}% concluídos`}
            icon={<Calendar className="h-6 w-6" />}
            color="#5DA399"
          />
          
          <KPICard
            title="Receita Total"
            value={`€${kpis.totalRevenue.toFixed(2)}`}
            subtitle={`€${kpis.avgRevenuePerClient.toFixed(2)} por cliente`}
            icon={<Euro className="h-6 w-6" />}
            color="#8AC1BB"
          />
          
          <KPICard
            title="Taxa de Conversão"
            value={`${kpis.conversionRate.toFixed(1)}%`}
            subtitle="Clientes ativos"
            icon={<Target className="h-6 w-6" />}
            color="#B1D4CF"
          />
              </div>

        {/* Navigation Tabs */}
        <Tabs value={selectedView} onValueChange={(value: any) => setSelectedView(value)}>
          <TabsList className="grid w-full grid-cols-2 md:grid-cols-4 h-auto md:h-10">
            <TabsTrigger value="overview" className="flex items-center gap-2">
              <Activity className="h-4 w-4" />
              <span className="hidden sm:inline">Visão Geral</span>
            </TabsTrigger>
            <TabsTrigger value="clients" className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              <span className="hidden sm:inline">Clientes</span>
            </TabsTrigger>
            <TabsTrigger value="appointments" className="flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              <span className="hidden sm:inline">Agendamentos</span>
            </TabsTrigger>
            <TabsTrigger value="financial" className="flex items-center gap-2">
              <Euro className="h-4 w-4" />
              <span className="hidden sm:inline">Financeiro</span>
            </TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Timeline Chart */}
          <Card>
            <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <LineChartIcon className="h-5 w-5" />
                    Evolução Temporal
                  </CardTitle>
            </CardHeader>
            <CardContent>
                  <ChartContainer className="h-80" config={chartConfig}>
                <ResponsiveContainer width="100%" height="100%">
                      <ComposedChart data={timelineData}>
                        <XAxis dataKey="month" />
                    <YAxis />
                    <Tooltip content={<ChartTooltipContent />} />
                        <Legend />
                        <Bar dataKey="clients" fill="#3f9094" name="Novos Clientes" />
                        <Line 
                          type="monotone" 
                          dataKey="appointments" 
                          stroke="#5DA399" 
                          strokeWidth={3}
                          name="Agendamentos"
                        />
                      </ComposedChart>
                </ResponsiveContainer>
              </ChartContainer>
          </CardContent>
        </Card>

              {/* Revenue Chart */}
              <Card>
          <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <BarChart3 className="h-5 w-5" />
                    Receita Mensal
                  </CardTitle>
          </CardHeader>
                <CardContent>
                  <ChartContainer className="h-80" config={chartConfig}>
                <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={timelineData}>
                        <XAxis dataKey="month" />
                        <YAxis />
                    <Tooltip content={<ChartTooltipContent />} />
                        <Area 
                          type="monotone" 
                          dataKey="revenue" 
                          stroke="#3f9094" 
                          fill="#3f9094" 
                          fillOpacity={0.6}
                          name="Receita (€)"
                        />
                      </AreaChart>
                </ResponsiveContainer>
              </ChartContainer>
          </CardContent>
        </Card>
      </div>
          </TabsContent>

          {/* Clients Tab */}
          <TabsContent value="clients" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Gender Distribution */}
              <Card>
          <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <PieChartIcon className="h-5 w-5" />
                    Distribuição por Género
                  </CardTitle>
          </CardHeader>
                <CardContent>
                  <ChartContainer className="h-80" config={chartConfig}>
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={genderData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {genderData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip content={<ChartTooltipContent />} />
                  </PieChart>
                </ResponsiveContainer>
              </ChartContainer>
          </CardContent>
        </Card>

              {/* Age Distribution */}
              <Card>
          <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <BarChart3 className="h-5 w-5" />
                    Distribuição por Idade
                  </CardTitle>
          </CardHeader>
                <CardContent>
                  <ChartContainer className="h-80" config={chartConfig}>
                <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={ageData}>
                        <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip content={<ChartTooltipContent />} />
                        <Bar dataKey="value" fill="#3f9094" name="Clientes">
                          {ageData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </ChartContainer>
          </CardContent>
        </Card>
      </div>

            {/* Client Status Summary */}
            <Card>
        <CardHeader>
                <CardTitle>Estado dos Clientes</CardTitle>
        </CardHeader>
        <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {Object.entries(kpis.clientsByStatus).map(([status, count]) => (
                    <div key={status} className="text-center p-4 bg-gray-50 rounded-lg">
                      <div className="text-2xl font-bold text-gray-900">{count as number}</div>
                      <div className="text-sm text-gray-600 capitalize">{status}</div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Appointments Tab */}
          <TabsContent value="appointments" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Appointment Types */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <PieChartIcon className="h-5 w-5" />
                    Tipos de Agendamento
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ChartContainer className="h-80" config={chartConfig}>
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={appointmentTypeData}
                          cx="50%"
                          cy="50%"
                          labelLine={false}
                          label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                          outerRadius={80}
                          fill="#8884d8"
                          dataKey="value"
                        >
                          {appointmentTypeData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip content={<ChartTooltipContent />} />
                      </PieChart>
                    </ResponsiveContainer>
                  </ChartContainer>
                </CardContent>
              </Card>

              {/* Appointment Status */}
              <Card>
                <CardHeader>
                  <CardTitle>Estado dos Agendamentos</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {Object.entries(kpis.appointmentsByStatus).map(([status, count]) => (
                      <div key={status} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <span className="capitalize font-medium">{status}</span>
                        <Badge variant="secondary">{count as number} agendamentos</Badge>
                </div>
              ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Financial Tab */}
          <TabsContent value="financial" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Payment Methods */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <PieChartIcon className="h-5 w-5" />
                    Métodos de Pagamento
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ChartContainer className="h-80" config={chartConfig}>
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={paymentMethodData}
                          cx="50%"
                          cy="50%"
                          labelLine={false}
                          label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                          outerRadius={80}
                          fill="#8884d8"
                          dataKey="value"
                        >
                          {paymentMethodData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip content={<ChartTooltipContent />} />
                      </PieChart>
                    </ResponsiveContainer>
                  </ChartContainer>
                </CardContent>
              </Card>

              {/* Financial Summary */}
              <Card>
                <CardHeader>
                  <CardTitle>Resumo Financeiro</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                      <span className="font-medium">Receita Total</span>
                      <span className="text-lg font-bold text-green-600">€{kpis.totalRevenue.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                      <span className="font-medium">Receita por Cliente</span>
                      <span className="text-lg font-bold">€{kpis.avgRevenuePerClient.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                      <span className="font-medium">Total de Pagamentos</span>
                      <span className="text-lg font-bold">{payments?.length || 0}</span>
                    </div>
                  </div>
        </CardContent>
      </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </PageLayout>
  );
};

export default StatisticsPage;
