import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import KpiCard from '@/components/dashboard/KpiCard';
import { BarChart3, Clock, Target, TrendingUp, Users } from 'lucide-react';
import {
  Area, AreaChart, Bar, BarChart, CartesianGrid, Cell, Pie, PieChart,
  ResponsiveContainer, Tooltip, XAxis, YAxis,
} from 'recharts';
import { formatCurrency } from '@/utils/formatUtils';
import { CHART, axisProps, tooltipStyle } from '@/utils/chartUtils';
import { Database } from '@/integrations/supabase/types';

type Client = Database['public']['Tables']['clientes']['Row'];

interface StatusSlice {
  key: string;
  label: string;
  value: number;
  color: string;
}

export interface ClientsAnalytics {
  total: number;
  activeClients: number;
  newClientsThisMonth: number;
  conversionRate: number;
  genderDistribution: { name: string; value: number }[];
  ageDistribution: { name: string; value: number }[];
  statusDistribution: StatusSlice[];
  monthlyEvolution: { month: string; clientes: number }[];
  topClientsByRevenue: (Client & { revenue: number; sessions: number })[];
  clientsNeedingAttention: number;
  upcomingSessions: number;
}

const ClientsOverview = ({ analytics }: { analytics: ClientsAnalytics }) => {
  const totalStatus = analytics.statusDistribution.reduce((acc, entry) => acc + entry.value, 0);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <KpiCard
          label="Total de Clientes"
          value={String(analytics.total)}
          sublabel={`${analytics.activeClients} ativos · ${analytics.conversionRate.toFixed(0)}% ativos`}
          icon={<Users className="h-5 w-5" />}
        />
        <KpiCard
          label="Novos (30 dias)"
          value={String(analytics.newClientsThisMonth)}
          sublabel={`${((analytics.newClientsThisMonth / (analytics.total || 1)) * 100).toFixed(1)}% do total`}
          icon={<TrendingUp className="h-5 w-5" />}
        />
        <KpiCard
          label="Sessões (7 dias)"
          value={String(analytics.upcomingSessions)}
          sublabel="Agendamentos futuros"
          icon={<Clock className="h-5 w-5" />}
        />
        <KpiCard
          label="Avisos Pendentes"
          value={String(analytics.clientsNeedingAttention)}
          sublabel='Clientes "Pensando" há mais de 7 dias'
          icon={<Target className="h-5 w-5" />}
          valueClassName={
            analytics.clientsNeedingAttention > 0 ? 'text-amber-600 dark:text-amber-400' : undefined
          }
        />
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2 lg:gap-6">
        <Card className="min-w-0">
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-semibold">Distribuição por Estado</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col items-center gap-6 lg:flex-row">
              <div className="relative h-[240px] w-full max-w-[260px] shrink-0 overflow-hidden">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={analytics.statusDistribution}
                      dataKey="value"
                      nameKey="label"
                      innerRadius={72}
                      outerRadius={104}
                      paddingAngle={3}
                      cornerRadius={4}
                      strokeWidth={0}
                    >
                      {analytics.statusDistribution.map((entry) => (
                        <Cell key={entry.key} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip contentStyle={tooltipStyle} formatter={(value: number) => [value, 'Clientes']} />
                  </PieChart>
                </ResponsiveContainer>
                <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
                  <span className="text-2xl font-semibold tabular-nums tracking-tight text-foreground">
                    {totalStatus}
                  </span>
                  <span className="text-xs text-muted-foreground">clientes</span>
                </div>
              </div>
              <ul className="w-full space-y-2.5">
                {analytics.statusDistribution.map((entry) => (
                  <li key={entry.key} className="flex items-center gap-2.5">
                    <span
                      className="h-2.5 w-2.5 shrink-0 rounded-full"
                      style={{ backgroundColor: entry.color }}
                    />
                    <span className="min-w-0 flex-1 truncate text-sm text-muted-foreground">{entry.label}</span>
                    <span className="text-sm tabular-nums text-muted-foreground">
                      {totalStatus > 0 ? ((entry.value / totalStatus) * 100).toFixed(0) : 0}%
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
            <CardTitle className="text-base font-semibold">Evolução Mensal</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[240px] overflow-hidden lg:h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={analytics.monthlyEvolution}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
                  <XAxis dataKey="month" {...axisProps} minTickGap={12} />
                  <YAxis {...axisProps} width={32} allowDecimals={false} />
                  <Tooltip contentStyle={tooltipStyle} />
                  <Area
                    type="monotone"
                    dataKey="clientes"
                    name="Novos clientes"
                    stroke={CHART.primary}
                    fill={CHART.primary}
                    fillOpacity={0.15}
                    strokeWidth={2}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card className="min-w-0">
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-semibold">Distribuição por Género</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[240px] overflow-hidden lg:h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={analytics.genderDistribution}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
                  <XAxis dataKey="name" {...axisProps} />
                  <YAxis {...axisProps} width={32} allowDecimals={false} />
                  <Tooltip contentStyle={tooltipStyle} cursor={{ fill: 'hsl(var(--muted))', opacity: 0.5 }} />
                  <Bar dataKey="value" name="Clientes" fill={CHART.primary} radius={[6, 6, 0, 0]} maxBarSize={48} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card className="min-w-0">
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-semibold">Distribuição por Idade</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[240px] overflow-hidden lg:h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={analytics.ageDistribution}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
                  <XAxis dataKey="name" {...axisProps} />
                  <YAxis {...axisProps} width={32} allowDecimals={false} />
                  <Tooltip contentStyle={tooltipStyle} cursor={{ fill: 'hsl(var(--muted))', opacity: 0.5 }} />
                  <Bar dataKey="value" name="Clientes" fill={CHART.soft} radius={[6, 6, 0, 0]} maxBarSize={48} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="min-w-0">
        <CardHeader className="pb-2">
          <CardTitle className="text-base font-semibold">Top 10 Clientes por Receita</CardTitle>
        </CardHeader>
        <CardContent>
          {analytics.topClientsByRevenue.length > 0 ? (
            <div className="space-y-1">
              {analytics.topClientsByRevenue.map((client, index) => (
                <div
                  key={client.id}
                  className="flex items-center justify-between gap-3 rounded-lg p-2.5 transition-colors hover:bg-muted/60"
                >
                  <div className="flex min-w-0 items-center gap-3">
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-sm font-semibold text-primary">
                      {index + 1}
                    </div>
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium text-foreground">{client.nome}</p>
                      <p className="text-xs text-muted-foreground">
                        {client.sessions} {client.sessions === 1 ? 'sessão' : 'sessões'}
                      </p>
                    </div>
                  </div>
                  <div className="shrink-0 text-right">
                    <p className="text-sm font-semibold tabular-nums text-foreground">
                      {formatCurrency(client.revenue)}
                    </p>
                    <p className="text-xs tabular-nums text-muted-foreground">
                      {formatCurrency(client.sessions > 0 ? client.revenue / client.sessions : 0)}/sessão
                    </p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="py-8 text-center">
              <BarChart3 className="mx-auto mb-3 h-10 w-10 text-muted-foreground/40" />
              <p className="text-sm text-muted-foreground">Sem receita registada para os clientes filtrados.</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default ClientsOverview;
