import { useState, useMemo, useEffect } from 'react';
import PageLayout from '@/components/layout/PageLayout';
import PageHeader from '@/components/shared/PageHeader';
import KpiCard from '@/components/shared/KpiCard';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  PieChart,
  Pie,
  BarChart,
  Bar,
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
import {
  differenceInYears,
  format,
  subMonths,
  subDays,
  startOfMonth,
  endOfMonth,
  eachMonthOfInterval,
  startOfDay,
  endOfDay,
  parseISO
} from 'date-fns';
import { pt } from 'date-fns/locale';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useClients } from '@/hooks/useClients';
import { useAppointments } from '@/hooks/useAppointments';
import { usePayments } from '@/hooks/usePayments';
import {
  Users,
  Calendar,
  Euro,
  Target,
  Activity,
  Download,
  BarChart3
} from 'lucide-react';
import { toast } from 'sonner';
import { CHART, STATUS_META, tooltipStyle, axisProps, compactCurrency } from '@/utils/chartUtils';
import { EVENT_STATUS_COLORS } from '@/utils/eventColors';
import { formatCurrency } from '@/utils/formatUtils';
import { Skeleton } from '@/components/ui/skeleton';
import { SkeletonCard } from '@/components/shared/SkeletonCard';

type TimeRange = '7d' | '30d' | '90d' | '1y' | 'all';

// Escala institucional de teal para séries categóricas (pie charts)
const PIE_COLORS = ['#3f9094', '#5DA399', '#8AC1BB', '#B1D4CF', '#D8E6E3', '#265255', '#7FB8BC'];

interface Bucket {
  label: string;
  start: Date;
  end: Date;
}

/** Janelas temporais por período (mesma lógica do Dashboard). */
const buildBuckets = (range: TimeRange, periodStart: Date): Bucket[] => {
  const now = new Date();

  if (range === '7d') {
    return Array.from({ length: 7 }, (_, i) => {
      const start = startOfDay(subDays(now, 6 - i));
      return { label: format(start, 'd/M'), start, end: endOfDay(start) };
    });
  }

  if (range === '30d' || range === '90d') {
    const weeks = range === '30d' ? 4 : 13;
    return Array.from({ length: weeks }, (_, i) => {
      const end = subDays(now, (weeks - 1 - i) * 7);
      const start = subDays(end, 6);
      return { label: format(end, 'd/M'), start: startOfDay(start), end: endOfDay(end) };
    });
  }

  // '1y' e 'all': buckets mensais desde o início do período
  const months = eachMonthOfInterval({ start: startOfMonth(periodStart), end: now });
  return months.map(m => ({
    label: format(m, 'MMM yy', { locale: pt }),
    start: startOfMonth(m),
    end: endOfMonth(m)
  }));
};

const pctChange = (current: number, previous: number): number | null => {
  if (previous <= 0) return null;
  return ((current - previous) / previous) * 100;
};

const inRange = (dateStr: string | Date | null | undefined, start: Date, end: Date): boolean => {
  if (!dateStr) return false;
  const d = dateStr instanceof Date ? dateStr : parseISO(dateStr);
  return !isNaN(d.getTime()) && d >= start && d <= end;
};

const capitalize = (s: string) => (s ? s.charAt(0).toUpperCase() + s.slice(1) : s);

const EmptyChart = ({ message }: { message: string }) => (
  <div className="h-80 flex items-center justify-center px-4">
    <p className="text-sm text-muted-foreground text-center">{message}</p>
  </div>
);

const StatisticsPage = () => {
  useEffect(() => {
    document.title = 'Estatísticas | NeuroBalance';
  }, []);

  const { clients, isLoading: clientsLoading, error: clientsError, refresh: refreshClients } = useClients();
  const { appointments, isLoading: appointmentsLoading, error: appointmentsError, refetch: refetchAppointments } = useAppointments();
  const { payments, isLoading: paymentsLoading, error: paymentsError, fetchPayments } = usePayments();

  const isLoading = clientsLoading || appointmentsLoading || paymentsLoading;
  const loadError = clientsError || appointmentsError || (paymentsError ? paymentsError.message : null);

  const retryLoad = () => {
    refreshClients();
    refetchAppointments();
    fetchPayments();
  };

  const [selectedPeriod, setSelectedPeriod] = useState<TimeRange>('30d');
  const [selectedView, setSelectedView] = useState<'overview' | 'clients' | 'appointments' | 'financial'>('overview');

  // Janela do período selecionado (alinhada com os buckets dos gráficos)
  const periodRange = useMemo(() => {
    const now = new Date();
    if (selectedPeriod === 'all') {
      const dates = [
        ...(clients || []).map(c => (c.criado_em ? parseISO(c.criado_em) : null)),
        ...(appointments || []).map(a => (a.data ? parseISO(a.data) : null)),
        ...(payments || []).map(p => (p.data ? parseISO(p.data) : null))
      ].filter((d): d is Date => d !== null && !isNaN(d.getTime()));
      const minDate = dates.sort((a, b) => a.getTime() - b.getTime())[0];
      const start = minDate ? startOfDay(minDate) : startOfDay(subMonths(now, 12));
      return { start, end: endOfDay(now) };
    }
    // 7d = 7 dias · 30d = 4 semanas · 90d = 13 semanas · 1y = 12 meses
    const starts: Record<Exclude<TimeRange, 'all'>, Date> = {
      '7d': startOfDay(subDays(now, 6)),
      '30d': startOfDay(subDays(now, 27)),
      '90d': startOfDay(subDays(now, 90)),
      '1y': startOfMonth(subMonths(now, 11))
    };
    return { start: starts[selectedPeriod], end: endOfDay(now) };
  }, [selectedPeriod, clients, appointments, payments]);

  // Período anterior (mesma duração) para variações reais
  const previousRange = useMemo(() => {
    if (selectedPeriod === 'all') return null;
    const lengthMs = periodRange.end.getTime() - periodRange.start.getTime();
    return {
      start: new Date(periodRange.start.getTime() - lengthMs),
      end: new Date(periodRange.start.getTime() - 1)
    };
  }, [selectedPeriod, periodRange]);

  // Dados do período (agendamentos pela DATA DA SESSÃO, não criação)
  const periodData = useMemo(() => {
    const { start, end } = periodRange;
    return {
      clients: (clients || []).filter(c => inRange(c.criado_em, start, end)),
      appointments: (appointments || []).filter(a => inRange(a.data, start, end)),
      payments: (payments || []).filter(p => inRange(p.data, start, end))
    };
  }, [clients, appointments, payments, periodRange]);

  const previousData = useMemo(() => {
    if (!previousRange) return null;
    const { start, end } = previousRange;
    return {
      clients: (clients || []).filter(c => inRange(c.criado_em, start, end)),
      appointments: (appointments || []).filter(a => inRange(a.data, start, end)),
      payments: (payments || []).filter(p => inRange(p.data, start, end))
    };
  }, [clients, appointments, payments, previousRange]);

  // Cálculo de KPIs
  const kpis = useMemo(() => {
    const totalClients = periodData.clients.length;
    const totalAppointments = periodData.appointments.length;
    const totalRevenue = periodData.payments.reduce((sum, p) => sum + (p.valor || 0), 0);

    const appointmentsByStatus = periodData.appointments.reduce((acc, appointment) => {
      const status = appointment.estado || 'pendente';
      acc[status] = (acc[status] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    const completedAppointments = appointmentsByStatus['realizado'] || 0;
    const completionRate = totalAppointments > 0 ? (completedAppointments / totalAppointments) * 100 : 0;

    const clientsByStatus = periodData.clients.reduce((acc, client) => {
      const status = client.estado || 'ongoing';
      acc[status] = (acc[status] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    const activeClients = clientsByStatus['ongoing'] || 0;
    const conversionRate = totalClients > 0 ? (activeClients / totalClients) * 100 : 0;
    const avgRevenuePerClient = activeClients > 0 ? totalRevenue / activeClients : 0;

    // Variações reais vs. período anterior
    const deltas = previousData
      ? {
          clients: pctChange(totalClients, previousData.clients.length),
          appointments: pctChange(totalAppointments, previousData.appointments.length),
          revenue: pctChange(totalRevenue, previousData.payments.reduce((sum, p) => sum + (p.valor || 0), 0))
        }
      : { clients: null, appointments: null, revenue: null };

    return {
      totalClients,
      totalAppointments,
      totalRevenue,
      avgRevenuePerClient,
      completionRate,
      conversionRate,
      activeClients,
      appointmentsByStatus,
      clientsByStatus,
      deltas
    };
  }, [periodData, previousData]);

  // Série temporal com buckets do período selecionado
  const timelineData = useMemo(() => {
    const buckets = buildBuckets(selectedPeriod, periodRange.start);
    return buckets.map(bucket => ({
      month: bucket.label,
      clients: periodData.clients.filter(c => inRange(c.criado_em, bucket.start, bucket.end)).length,
      appointments: periodData.appointments.filter(a => inRange(a.data, bucket.start, bucket.end)).length,
      revenue: periodData.payments
        .filter(p => inRange(p.data, bucket.start, bucket.end))
        .reduce((sum, p) => sum + (p.valor || 0), 0)
    }));
  }, [periodData, selectedPeriod, periodRange]);

  // Distribuição por género
  const genderData = useMemo(() => {
    const genderCounts = periodData.clients.reduce((acc, client) => {
      const gender = client.genero || 'Não especificado';
      acc[gender] = (acc[gender] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    return Object.entries(genderCounts).map(([name, value]) => ({ name, value }));
  }, [periodData.clients]);

  // Distribuição por idades
  const ageData = useMemo(() => {
    const ageGroups: Record<string, number> = {
      '0-18': 0,
      '19-30': 0,
      '31-40': 0,
      '41-50': 0,
      '51-60': 0,
      '61+': 0
    };
    periodData.clients.forEach(client => {
      if (client.data_nascimento) {
        const age = differenceInYears(new Date(), new Date(client.data_nascimento));
        if (age <= 18) ageGroups['0-18']++;
        else if (age <= 30) ageGroups['19-30']++;
        else if (age <= 40) ageGroups['31-40']++;
        else if (age <= 50) ageGroups['41-50']++;
        else if (age <= 60) ageGroups['51-60']++;
        else ageGroups['61+']++;
      }
    });
    return Object.entries(ageGroups)
      .filter(([, value]) => value > 0)
      .map(([name, value]) => ({ name, value }));
  }, [periodData.clients]);

  // Tipos de agendamento
  const appointmentTypeData = useMemo(() => {
    const typeCounts = periodData.appointments.reduce((acc, appointment) => {
      const type = appointment.tipo || 'Não especificado';
      acc[type] = (acc[type] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    return Object.entries(typeCounts)
      .map(([name, value]) => ({ name: capitalize(name), value }))
      .sort((a, b) => b.value - a.value);
  }, [periodData.appointments]);

  // Métodos de pagamento
  const paymentMethodData = useMemo(() => {
    const methodCounts = periodData.payments.reduce((acc, payment) => {
      const method = payment.tipo || 'Não especificado';
      acc[method] = (acc[method] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    return Object.entries(methodCounts)
      .map(([name, value]) => ({ name: capitalize(name), value }))
      .sort((a, b) => b.value - a.value);
  }, [periodData.payments]);

  // Exportar dados
  const exportData = () => {
    const data = {
      periodo: selectedPeriod,
      periodoInicio: format(periodRange.start, 'yyyy-MM-dd'),
      periodoFim: format(periodRange.end, 'yyyy-MM-dd'),
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

  return (
    <PageLayout>
      <div className="space-y-6">
        <PageHeader
          title="Estatísticas & Analytics"
          description="Análise completa do desempenho e insights da clínica"
          icon={<BarChart3 className="h-5 w-5" />}
          actions={
            <>
              <Select value={selectedPeriod} onValueChange={(value: TimeRange) => setSelectedPeriod(value)}>
                <SelectTrigger className="w-48">
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

              <Button onClick={exportData} variant="outline" size="sm" className="flex items-center gap-2" disabled={isLoading}>
                <Download className="h-4 w-4" />
                <span className="hidden sm:inline">Exportar Dados</span>
              </Button>
            </>
          }
        />

        {/* KPIs */}
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map(i => <SkeletonCard key={i} />)}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <KpiCard
            icon={Users}
            label="Novos clientes"
            value={kpis.totalClients}
            sub={`${kpis.activeClients} ativos`}
            delta={kpis.deltas.clients === null ? undefined : {
              value: `${kpis.deltas.clients >= 0 ? '+' : ''}${kpis.deltas.clients.toFixed(1)}% vs período anterior`,
              positive: kpis.deltas.clients >= 0
            }}
            tone="teal"
          />
          <KpiCard
            icon={Calendar}
            label="Agendamentos"
            value={kpis.totalAppointments}
            sub={`${kpis.completionRate.toFixed(1)}% realizados`}
            delta={kpis.deltas.appointments === null ? undefined : {
              value: `${kpis.deltas.appointments >= 0 ? '+' : ''}${kpis.deltas.appointments.toFixed(1)}% vs período anterior`,
              positive: kpis.deltas.appointments >= 0
            }}
            tone="emerald"
          />
          <KpiCard
            icon={Euro}
            label="Receita"
            value={formatCurrency(kpis.totalRevenue)}
            sub={`${formatCurrency(kpis.avgRevenuePerClient)} por cliente ativo`}
            delta={kpis.deltas.revenue === null ? undefined : {
              value: `${kpis.deltas.revenue >= 0 ? '+' : ''}${kpis.deltas.revenue.toFixed(1)}% vs período anterior`,
              positive: kpis.deltas.revenue >= 0
            }}
            tone="blue"
          />
          <KpiCard
            icon={Target}
            label="Taxa de conversão"
            value={`${kpis.conversionRate.toFixed(1)}%`}
            sub="Clientes ativos"
            tone="purple"
          />
          </div>
        )}

        {/* Erro de carregamento */}
        {!isLoading && loadError && (
          <Card className="border-destructive/40 bg-destructive/5">
            <CardContent className="p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
              <p className="text-sm text-destructive">Não foi possível carregar alguns dados.</p>
              <Button variant="outline" size="sm" onClick={retryLoad}>
                Tentar novamente
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Gráficos */}
        {isLoading ? (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardContent className="pt-6">
                <Skeleton className="h-80 w-full" />
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <Skeleton className="h-80 w-full" />
              </CardContent>
            </Card>
          </div>
        ) : (
        <Tabs value={selectedView} onValueChange={(value) => setSelectedView(value as typeof selectedView)}>
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

          {/* Visão Geral */}
          <TabsContent value="overview" className="space-y-6 mt-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card className="min-w-0">
                <CardHeader className="pb-2">
                  <CardTitle className="text-base font-semibold">Evolução Temporal</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-80">
                    <ResponsiveContainer width="100%" height="100%">
                      <ComposedChart data={timelineData}>
                        <XAxis dataKey="month" {...axisProps} />
                        <YAxis {...axisProps} />
                        <Tooltip contentStyle={tooltipStyle} />
                        <Legend />
                        <Bar dataKey="clients" fill={CHART.primary} name="Novos Clientes" radius={[4, 4, 0, 0]} />
                        <Line
                          type="monotone"
                          dataKey="appointments"
                          stroke={CHART.green}
                          strokeWidth={3}
                          name="Agendamentos"
                          dot={false}
                        />
                      </ComposedChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>

              <Card className="min-w-0">
                <CardHeader className="pb-2">
                  <CardTitle className="text-base font-semibold">Receita</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-80">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={timelineData}>
                        <XAxis dataKey="month" {...axisProps} />
                        <YAxis {...axisProps} tickFormatter={(value) => compactCurrency(value as number)} />
                        <Tooltip formatter={(value) => [formatCurrency(value as number), 'Receita']} contentStyle={tooltipStyle} />
                        <Area
                          type="monotone"
                          dataKey="revenue"
                          stroke={CHART.primary}
                          fill={CHART.primary}
                          fillOpacity={0.15}
                          name="Receita (€)"
                        />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Clientes */}
          <TabsContent value="clients" className="space-y-6 mt-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card className="min-w-0">
                <CardHeader className="pb-2">
                  <CardTitle className="text-base font-semibold">Distribuição por Género</CardTitle>
                </CardHeader>
                <CardContent>
                  {genderData.length === 0 ? (
                    <EmptyChart message="Sem clientes no período selecionado." />
                  ) : (
                  <div className="h-80">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={genderData}
                          cx="50%"
                          cy="50%"
                          labelLine={false}
                          label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                          outerRadius={80}
                          dataKey="value"
                        >
                          {genderData.map((_entry, index) => (
                            <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip contentStyle={tooltipStyle} />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                  )}
                </CardContent>
              </Card>

              <Card className="min-w-0">
                <CardHeader className="pb-2">
                  <CardTitle className="text-base font-semibold">Distribuição por Idade</CardTitle>
                </CardHeader>
                <CardContent>
                  {ageData.length === 0 ? (
                    <EmptyChart message="Sem idades registadas no período selecionado." />
                  ) : (
                  <div className="h-80">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={ageData}>
                        <XAxis dataKey="name" {...axisProps} />
                        <YAxis allowDecimals={false} {...axisProps} />
                        <Tooltip contentStyle={tooltipStyle} />
                        <Bar dataKey="value" name="Clientes" fill={CHART.primary} radius={[4, 4, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                  )}
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base font-semibold">Estado dos Clientes</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {Object.entries(kpis.clientsByStatus).map(([status, count]) => (
                    <div key={status} className="text-center p-4 bg-muted/50 rounded-lg">
                      <div className="text-2xl font-bold tabular-nums">{count}</div>
                      <div className="text-sm text-muted-foreground">
                        {STATUS_META[status]?.label || capitalize(status)}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Agendamentos */}
          <TabsContent value="appointments" className="space-y-6 mt-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card className="min-w-0">
                <CardHeader className="pb-2">
                  <CardTitle className="text-base font-semibold">Tipos de Agendamento</CardTitle>
                </CardHeader>
                <CardContent>
                  {appointmentTypeData.length === 0 ? (
                    <EmptyChart message="Sem agendamentos no período selecionado." />
                  ) : (
                  <div className="h-80">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={appointmentTypeData}
                          cx="50%"
                          cy="50%"
                          labelLine={false}
                          label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                          outerRadius={80}
                          dataKey="value"
                        >
                          {appointmentTypeData.map((_entry, index) => (
                            <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip contentStyle={tooltipStyle} />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-base font-semibold">Estado dos Agendamentos</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {Object.entries(kpis.appointmentsByStatus).map(([status, count]) => {
                      const total = periodData.appointments.length || 1;
                      const pct = ((count as number) / total) * 100;
                      return (
                        <div key={status} className="space-y-1.5">
                          <div className="flex items-center justify-between">
                            <span className="capitalize font-medium text-sm">{status}</span>
                            <span className="text-sm text-muted-foreground tabular-nums">
                              {count} ({pct.toFixed(0)}%)
                            </span>
                          </div>
                          <div className="h-2 rounded-full bg-muted overflow-hidden">
                            <div
                              className="h-full rounded-full"
                              style={{
                                width: `${pct}%`,
                                backgroundColor: EVENT_STATUS_COLORS[status] || CHART.primary
                              }}
                            />
                          </div>
                        </div>
                      );
                    })}
                    {Object.keys(kpis.appointmentsByStatus).length === 0 && (
                      <p className="text-sm text-muted-foreground">Sem agendamentos no período.</p>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Financeiro */}
          <TabsContent value="financial" className="space-y-6 mt-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card className="min-w-0">
                <CardHeader className="pb-2">
                  <CardTitle className="text-base font-semibold">Métodos de Pagamento</CardTitle>
                </CardHeader>
                <CardContent>
                  {paymentMethodData.length === 0 ? (
                    <EmptyChart message="Sem pagamentos no período selecionado." />
                  ) : (
                  <div className="h-80">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={paymentMethodData}
                          cx="50%"
                          cy="50%"
                          labelLine={false}
                          label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                          outerRadius={80}
                          dataKey="value"
                        >
                          {paymentMethodData.map((_entry, index) => (
                            <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip contentStyle={tooltipStyle} />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-base font-semibold">Resumo Financeiro</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex justify-between items-center p-3 bg-muted/50 rounded-lg">
                      <span className="font-medium">Receita Total</span>
                      <span className="text-lg font-bold text-emerald-600 dark:text-emerald-400 tabular-nums">
                        {formatCurrency(kpis.totalRevenue)}
                      </span>
                    </div>
                    <div className="flex justify-between items-center p-3 bg-muted/50 rounded-lg">
                      <span className="font-medium">Receita por Cliente</span>
                      <span className="text-lg font-bold tabular-nums">{formatCurrency(kpis.avgRevenuePerClient)}</span>
                    </div>
                    <div className="flex justify-between items-center p-3 bg-muted/50 rounded-lg">
                      <span className="font-medium">Total de Pagamentos</span>
                      <span className="text-lg font-bold tabular-nums">{periodData.payments.length}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
        )}
      </div>
    </PageLayout>
  );
};

export default StatisticsPage;
