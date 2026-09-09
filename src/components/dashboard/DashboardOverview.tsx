import { useEffect, useMemo, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Calendar, DollarSign, Plus, TrendingUp, User, Users } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Link, useNavigate } from 'react-router-dom';
import UpcomingAppointmentsTable from '@/components/dashboard/UpcomingAppointmentsTable';
import useClients from '@/hooks/useClients';
import useAppointments, { type Appointment } from '@/hooks/useAppointments';
import usePayments, { type Payment } from '@/hooks/usePayments';
import { useExpenses } from '@/hooks/useExpenses';
import { getFirstAndLastName } from '@/utils/nameUtils';
import { formatCurrency } from '@/utils/formatUtils';
import TimeRangeSelector, { TimeRange } from './TimeRangeSelector';
import {
  endOfDay, endOfMonth, format, isFuture, isToday, isWithinInterval, parseISO, startOfDay,
  startOfMonth, subDays, subMonths,
} from 'date-fns';
import { ptBR } from 'date-fns/locale';
import {
  Area, Bar, BarChart, CartesianGrid, Cell, ComposedChart, Legend, Line, LineChart,
  Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis,
} from 'recharts';
import { Database } from '@/integrations/supabase/types';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { DashboardSkeleton } from '@/components/shared/SkeletonCard';
import { EmptyState } from '@/components/shared/EmptyState';
import { useAnnouncer } from '@/hooks/useAnnouncer';
import KpiCard from './KpiCard';
import { CHART, STATUS_META, tooltipStyle, axisProps, compactCurrency } from '@/utils/chartUtils';

type Client = Database['public']['Tables']['clientes']['Row'];

const PERIOD_DAYS: Record<Exclude<TimeRange, 'all'>, number> = {
  '7d': 7,
  '30d': 30,
  '90d': 90,
  '1y': 365,
};

interface Bucket {
  label: string;
  start: Date;
  end: Date;
}

const buildBuckets = (range: TimeRange, now: Date): Bucket[] => {
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

  return Array.from({ length: 12 }, (_, i) => {
    const month = subMonths(now, 11 - i);
    return {
      label: format(month, 'MMM', { locale: ptBR }).replace('.', ''),
      start: startOfMonth(month),
      end: endOfMonth(month),
    };
  });
};

const RecentClientsTable = ({
  clients,
  appointments,
  payments,
}: {
  clients: Client[];
  appointments: Appointment[];
  payments: Payment[];
}) => {
  const navigate = useNavigate();

  return (
    <div className="space-y-1">
      {clients.map((client) => {
        const clientAppointments = appointments.filter((apt) => apt.id_cliente === client.id);
        const totalPaid = payments
          .filter((payment) => payment.id_cliente === client.id)
          .reduce((total, payment) => total + (payment.valor || 0), 0);

        return (
          <button
            key={client.id}
            type="button"
            onClick={() => navigate(`/clients/${client.id}`)}
            className="flex w-full items-center justify-between gap-3 rounded-lg p-2.5 text-left transition-colors hover:bg-muted/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <div className="flex min-w-0 items-center gap-3">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary/10 text-sm font-semibold text-primary">
                {client.nome.charAt(0).toUpperCase()}
              </div>
              <div className="min-w-0">
                <p className="truncate text-sm font-medium text-foreground">
                  {getFirstAndLastName(client.nome)}
                </p>
                <p className="truncate text-xs text-muted-foreground">{client.email || 'Sem email'}</p>
              </div>
            </div>
            <div className="shrink-0 text-right">
              <p className="text-sm font-medium tabular-nums text-foreground">
                {clientAppointments.length} sessões
              </p>
              <p className="text-xs tabular-nums text-muted-foreground">{formatCurrency(totalPaid)}</p>
            </div>
          </button>
        );
      })}
      <div className="pt-1 text-center">
        <Link to="/clients" className="text-sm font-medium text-primary hover:underline">
          Ver todos os clientes
        </Link>
      </div>
    </div>
  );
};

const DashboardOverview = () => {
  const navigate = useNavigate();
  const { clients, isLoading: isClientsLoading } = useClients();
  const { appointments, isLoading: isAppointmentsLoading } = useAppointments();
  const { payments, isLoading: isPaymentsLoading } = usePayments();
  const { expenses, isLoading: isExpensesLoading } = useExpenses();
  const { announce } = useAnnouncer();

  const [periodFilter, setPeriodFilter] = useState<TimeRange>('all');
  const [hasAnnounced, setHasAnnounced] = useState(false);

  const metrics = useMemo(() => {
    const now = new Date();
    const days = periodFilter === 'all' ? null : PERIOD_DAYS[periodFilter];
    const start = days ? subDays(now, days) : null;
    const prevStart = start && days ? subDays(start, days) : null;

    const clientDate = (client: Client) => (client.criado_em ? parseISO(client.criado_em) : new Date(0));
    const onDate = (item: { data: string }) => parseISO(item.data);

    const inRange = <T,>(list: T[], getDate: (item: T) => Date, from: Date | null, to?: Date | null) =>
      list.filter((item) => {
        const date = getDate(item);
        if (from && to) return date >= from && date < to;
        return start ? date >= start : true;
      });

    const currentClients = inRange(clients, clientDate, start);
    const previousClients = prevStart ? inRange(clients, clientDate, prevStart, start) : [];
    const currentAppointments = inRange(appointments, onDate, start);
    const previousAppointments = prevStart ? inRange(appointments, onDate, prevStart, start) : [];
    const currentPayments = inRange(payments, onDate, start);
    const previousPayments = prevStart ? inRange(payments, onDate, prevStart, start) : [];
    const currentExpenses = inRange(expenses, onDate, start);
    const previousExpenses = prevStart ? inRange(expenses, onDate, prevStart, start) : [];

    const sum = (list: { valor: number }[]) => list.reduce((acc, item) => acc + (item.valor || 0), 0);

    const totalRevenue = sum(currentPayments);
    const prevRevenue = sum(previousPayments);
    const totalExpenses = sum(currentExpenses);
    const prevExpenses = sum(previousExpenses);
    const profit = totalRevenue - totalExpenses;
    const prevProfit = prevRevenue - prevExpenses;

    const completedAppointments = currentAppointments.filter((apt) => apt.estado === 'realizado').length;
    const activeClients = currentClients.filter((client) => client.estado === 'ongoing' || !client.estado).length;

    const pct = (current: number, previous: number) =>
      previous > 0 ? ((current - previous) / previous) * 100 : null;

    return {
      totalClients: currentClients.length,
      activeClients,
      totalAppointments: currentAppointments.length,
      completedAppointments,
      totalRevenue,
      profit,
      completionRate: currentAppointments.length > 0 ? (completedAppointments / currentAppointments.length) * 100 : 0,
      conversionRate: currentClients.length > 0 ? (activeClients / currentClients.length) * 100 : 0,
      avgRevenuePerClient: activeClients > 0 ? totalRevenue / activeClients : 0,
      margin: totalRevenue > 0 ? (profit / totalRevenue) * 100 : 0,
      clientsDelta: pct(currentClients.length, previousClients.length),
      appointmentsDelta: pct(currentAppointments.length, previousAppointments.length),
      revenueDelta: pct(totalRevenue, prevRevenue),
      profitDelta: pct(profit, prevProfit),
    };
  }, [clients, appointments, payments, expenses, periodFilter]);

  const chartData = useMemo(() => {
    const now = new Date();

    return buildBuckets(periodFilter, now).map((bucket) => {
      const within = (date: string) =>
        isWithinInterval(parseISO(date), { start: bucket.start, end: bucket.end });

      const receita = payments
        .filter((payment) => within(payment.data))
        .reduce((acc, payment) => acc + (payment.valor || 0), 0);
      const despesas = expenses
        .filter((expense) => within(expense.data))
        .reduce((acc, expense) => acc + (expense.valor || 0), 0);

      return {
        label: bucket.label,
        clientes: clients.filter((client) => client.criado_em && within(client.criado_em)).length,
        agendamentos: appointments.filter((apt) => within(apt.data)).length,
        receita,
        despesas,
        lucro: receita - despesas,
      };
    });
  }, [clients, appointments, payments, expenses, periodFilter]);

  const clientStatusData = useMemo(() => {
    const statusCount = clients.reduce((acc, client) => {
      const status = client.estado || 'ongoing';
      acc[status] = (acc[status] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return Object.entries(statusCount).map(([status, count]) => ({
      name: STATUS_META[status]?.label || status,
      value: count,
      color: STATUS_META[status]?.color || CHART.primary,
    }));
  }, [clients]);

  const todaysAppointments = useMemo(
    () =>
      appointments
        .filter((appointment) => isToday(parseISO(appointment.data)))
        .sort((a, b) => parseISO(a.data).getTime() - parseISO(b.data).getTime()),
    [appointments]
  );

  const upcomingAppointments = useMemo(
    () =>
      appointments
        .filter((appointment) => isFuture(parseISO(appointment.data)) && !isToday(parseISO(appointment.data)))
        .sort((a, b) => parseISO(a.data).getTime() - parseISO(b.data).getTime()),
    [appointments]
  );

  const agendaAppointments = useMemo(
    () => [...todaysAppointments, ...upcomingAppointments].slice(0, 6),
    [todaysAppointments, upcomingAppointments]
  );

  const recentClients = useMemo(
    () =>
      [...clients]
        .sort((a, b) => {
          const dateA = a.criado_em ? parseISO(a.criado_em).getTime() : 0;
          const dateB = b.criado_em ? parseISO(b.criado_em).getTime() : 0;
          return dateB - dateA;
        })
        .slice(0, 5),
    [clients]
  );

  useEffect(() => {
    const isLoading = isClientsLoading || isAppointmentsLoading || isPaymentsLoading || isExpensesLoading;

    if (!isLoading && !hasAnnounced) {
      announce(
        `Dashboard carregado. ${clients.length} clientes, ${appointments.length} agendamentos.`,
        'polite'
      );
      setHasAnnounced(true);
    }
  }, [isClientsLoading, isAppointmentsLoading, isPaymentsLoading, isExpensesLoading, clients, appointments, hasAnnounced, announce]);

  const formatAppointmentsForTable = (list: Appointment[]) =>
    list.map((appointment) => ({
      id: appointment.id?.toString() || '',
      title: appointment.titulo || '',
      date: appointment.data || '',
      clientName: appointment.clientes?.nome || 'Cliente não definido',
      clientId: appointment.id_cliente?.toString() || '',
      type: appointment.tipo || '',
      confirmed: appointment.estado === 'confirmado' || appointment.estado === 'realizado',
    }));

  if (isClientsLoading || isAppointmentsLoading || isPaymentsLoading || isExpensesLoading) {
    return <DashboardSkeleton />;
  }

  if (clients.length === 0) {
    return (
      <EmptyState
        icon={<User className="h-12 w-12" />}
        title="Bem-vindo ao NeuroBalance CMS"
        description="Este é o seu sistema de gestão de clientes. Comece adicionando o seu primeiro cliente para visualizar estatísticas e agendamentos avançados."
        action={{
          label: 'Adicionar Cliente',
          onClick: () => navigate('/clients'),
          icon: <Plus className="h-4 w-4" />,
        }}
        secondaryAction={{
          label: 'Ver Calendário',
          onClick: () => navigate('/calendar'),
          icon: <Calendar className="h-4 w-4" />,
        }}
        className="rounded-xl border border-border bg-card"
      />
    );
  }

  const totalClientsInStatus = clientStatusData.reduce((acc, entry) => acc + entry.value, 0);

  return (
    <div className="space-y-6">
      <div className="flex justify-start sm:justify-end">
        <TimeRangeSelector selectedRange={periodFilter} onRangeChange={setPeriodFilter} />
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <KpiCard
          label="Clientes"
          value={String(metrics.totalClients)}
          sublabel={`${metrics.activeClients} ativos · ${metrics.conversionRate.toFixed(0)}% conversão`}
          icon={<Users className="h-5 w-5" />}
          delta={metrics.clientsDelta}
          onClick={() => navigate('/clients')}
        />
        <KpiCard
          label="Agendamentos"
          value={String(metrics.totalAppointments)}
          sublabel={`${metrics.completedAppointments} realizados · ${metrics.completionRate.toFixed(0)}% conclusão`}
          icon={<Calendar className="h-5 w-5" />}
          delta={metrics.appointmentsDelta}
          onClick={() => navigate('/calendar')}
        />
        <KpiCard
          label="Receita"
          value={formatCurrency(metrics.totalRevenue)}
          sublabel={`${formatCurrency(metrics.avgRevenuePerClient)} por cliente`}
          icon={<TrendingUp className="h-5 w-5" />}
          delta={metrics.revenueDelta}
          onClick={() => navigate('/finances')}
        />
        <KpiCard
          label="Lucro"
          value={formatCurrency(metrics.profit)}
          sublabel={`Margem ${metrics.margin.toFixed(0)}%`}
          icon={<DollarSign className="h-5 w-5" />}
          delta={metrics.profitDelta}
          valueClassName={
            metrics.profit >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400'
          }
          onClick={() => navigate('/finances')}
        />
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between gap-3 pb-2">
          <div className="flex items-center gap-2.5">
            <CardTitle className="text-base font-semibold">Agenda</CardTitle>
            {todaysAppointments.length > 0 && (
              <Badge variant="secondary" className="tabular-nums">
                {todaysAppointments.length} hoje
              </Badge>
            )}
          </div>
          <Button asChild variant="outline" size="sm">
            <Link to="/calendar">Ver calendário</Link>
          </Button>
        </CardHeader>
        <CardContent>
          {agendaAppointments.length > 0 ? (
            <UpcomingAppointmentsTable appointments={formatAppointmentsForTable(agendaAppointments)} />
          ) : (
            <div className="py-8 text-center">
              <Calendar className="mx-auto mb-3 h-10 w-10 text-muted-foreground/40" />
              <p className="text-sm text-muted-foreground">Sem agendamentos futuros. Crie um no calendário.</p>
            </div>
          )}
        </CardContent>
      </Card>

      <Tabs defaultValue="temporal" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="temporal">Temporal</TabsTrigger>
          <TabsTrigger value="clientes">Clientes</TabsTrigger>
          <TabsTrigger value="financeiro">Financeiro</TabsTrigger>
        </TabsList>

        <TabsContent value="temporal" className="mt-4 space-y-6">
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2 lg:gap-6">
            <Card className="min-w-0">
              <CardHeader className="pb-2">
                <CardTitle className="text-base font-semibold">Clientes e Agendamentos</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-[240px] overflow-hidden lg:h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <ComposedChart data={chartData}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
                      <XAxis dataKey="label" {...axisProps} minTickGap={12} />
                      <YAxis yAxisId="left" {...axisProps} width={32} allowDecimals={false} />
                      <YAxis yAxisId="right" orientation="right" {...axisProps} width={32} allowDecimals={false} />
                      <Tooltip contentStyle={tooltipStyle} cursor={{ fill: 'hsl(var(--muted))', opacity: 0.5 }} />
                      <Legend />
                      <Bar
                        yAxisId="left"
                        dataKey="clientes"
                        name="Novos clientes"
                        fill={CHART.primary}
                        radius={[6, 6, 0, 0]}
                        maxBarSize={28}
                      />
                      <Line
                        yAxisId="right"
                        type="monotone"
                        dataKey="agendamentos"
                        name="Agendamentos"
                        stroke={CHART.soft}
                        strokeWidth={2.5}
                        dot={false}
                      />
                    </ComposedChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            <Card className="min-w-0">
              <CardHeader className="pb-2">
                <CardTitle className="text-base font-semibold">Evolução Financeira</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-[240px] overflow-hidden lg:h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <ComposedChart data={chartData}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
                      <XAxis dataKey="label" {...axisProps} minTickGap={12} />
                      <YAxis {...axisProps} width={48} tickFormatter={compactCurrency} />
                      <Tooltip
                        contentStyle={tooltipStyle}
                        formatter={(value: number) => formatCurrency(value)}
                        labelFormatter={(label) => label}
                      />
                      <Legend />
                      <Area
                        type="monotone"
                        dataKey="receita"
                        name="Receita"
                        stroke={CHART.primary}
                        fill={CHART.primary}
                        fillOpacity={0.15}
                        strokeWidth={2}
                      />
                      <Area
                        type="monotone"
                        dataKey="despesas"
                        name="Despesas"
                        stroke={CHART.red}
                        fill={CHART.red}
                        fillOpacity={0.12}
                        strokeWidth={2}
                      />
                      <Line
                        type="monotone"
                        dataKey="lucro"
                        name="Lucro"
                        stroke={CHART.green}
                        strokeWidth={2.5}
                        dot={false}
                      />
                    </ComposedChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="clientes" className="mt-4 space-y-6">
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2 lg:gap-6">
            <Card className="min-w-0">
              <CardHeader className="pb-2">
                <CardTitle className="text-base font-semibold">Distribuição por Estado</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-col items-center gap-6 lg:flex-row">
                  <div className="relative h-[240px] w-full max-w-[260px] shrink-0">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={clientStatusData}
                          dataKey="value"
                          nameKey="name"
                          innerRadius={72}
                          outerRadius={104}
                          paddingAngle={3}
                          cornerRadius={4}
                          strokeWidth={0}
                        >
                          {clientStatusData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Pie>
                        <Tooltip contentStyle={tooltipStyle} formatter={(value: number) => [value, 'Clientes']} />
                      </PieChart>
                    </ResponsiveContainer>
                    <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
                      <span className="text-2xl font-semibold tabular-nums tracking-tight text-foreground">
                        {totalClientsInStatus}
                      </span>
                      <span className="text-xs text-muted-foreground">clientes</span>
                    </div>
                  </div>
                  <ul className="w-full space-y-2.5">
                    {clientStatusData.map((entry) => (
                      <li key={entry.name} className="flex items-center gap-2.5">
                        <span
                          className="h-2.5 w-2.5 shrink-0 rounded-full"
                          style={{ backgroundColor: entry.color }}
                        />
                        <span className="min-w-0 flex-1 truncate text-sm text-muted-foreground">{entry.name}</span>
                        <span className="text-sm tabular-nums text-muted-foreground">
                          {totalClientsInStatus > 0 ? ((entry.value / totalClientsInStatus) * 100).toFixed(0) : 0}%
                        </span>
                        <span className="w-8 text-right text-sm font-medium tabular-nums text-foreground">
                          {entry.value}
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
              </CardContent>
            </Card>

            <Card className="min-w-0">
              <CardHeader className="pb-2">
                <CardTitle className="text-base font-semibold">Clientes Recentes</CardTitle>
              </CardHeader>
              <CardContent>
                <RecentClientsTable clients={recentClients} appointments={appointments} payments={payments} />
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="financeiro" className="mt-4 space-y-6">
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2 lg:gap-6">
            <Card className="min-w-0">
              <CardHeader className="pb-2">
                <CardTitle className="text-base font-semibold">Receita vs Despesas</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-[240px] overflow-hidden lg:h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={chartData}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
                      <XAxis dataKey="label" {...axisProps} minTickGap={12} />
                      <YAxis {...axisProps} width={48} tickFormatter={compactCurrency} />
                      <Tooltip
                        contentStyle={tooltipStyle}
                        formatter={(value: number) => formatCurrency(value)}
                        cursor={{ fill: 'hsl(var(--muted))', opacity: 0.5 }}
                      />
                      <Legend />
                      <Bar dataKey="receita" name="Receita" fill={CHART.primary} radius={[6, 6, 0, 0]} maxBarSize={28} />
                      <Bar dataKey="despesas" name="Despesas" fill={CHART.red} radius={[6, 6, 0, 0]} maxBarSize={28} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            <Card className="min-w-0">
              <CardHeader className="pb-2">
                <CardTitle className="text-base font-semibold">Margem de Lucro</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-[240px] overflow-hidden lg:h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={chartData}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
                      <XAxis dataKey="label" {...axisProps} minTickGap={12} />
                      <YAxis {...axisProps} width={48} tickFormatter={compactCurrency} />
                      <Tooltip
                        contentStyle={tooltipStyle}
                        formatter={(value: number) => formatCurrency(value)}
                      />
                      <Line
                        type="monotone"
                        dataKey="lucro"
                        name="Lucro"
                        stroke={CHART.green}
                        strokeWidth={2.5}
                        dot={{ fill: CHART.green, strokeWidth: 0, r: 3 }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
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
