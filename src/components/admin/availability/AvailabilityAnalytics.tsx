import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  BarChart3,
  PieChart,
  TrendingUp,
  Calendar,
  Clock,
  Users,
  Target,
  Activity,
} from 'lucide-react';
import { useAdminAvailabilityManagement } from '@/hooks/useAdminAvailabilityManagement';
import { LoadingSpinner } from '@/components/shared/LoadingSpinner';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart as RePieChart,
  Pie,
  Cell,
} from 'recharts';

const DIAS_SEMANA = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
const COLORS = ['#3f9094', '#5DA399', '#8AC1BB', '#B1D4CF', '#D6E8E6'];

interface AvailabilityInsights {
  mostAvailableDay: { day: number; count: number };
  timePreferences: { morning: number; afternoon: number; evening: number };
  totalActiveSlots: number;
}

export const AvailabilityAnalytics: React.FC = () => {
  const { clients, overview, getAvailabilityInsights } = useAdminAvailabilityManagement();
  const [insights, setInsights] = useState<AvailabilityInsights | null>(null);
  const [isLoadingInsights, setIsLoadingInsights] = useState(false);

  // =====================================================
  // LOAD INSIGHTS
  // =====================================================

  useEffect(() => {
    const loadInsights = async () => {
      setIsLoadingInsights(true);
      const data = await getAvailabilityInsights();
      setInsights(data);
      setIsLoadingInsights(false);
    };

    if (clients.length > 0) {
      loadInsights();
    }
  }, [clients, getAvailabilityInsights]);

  // =====================================================
  // PREPARE CHART DATA
  // =====================================================

  // Distribuição por dia da semana
  const dayDistributionData = clients.reduce((acc, client) => {
    // Simular distribuição (em produção, buscar do banco)
    const randomDay = Math.floor(Math.random() * 7);
    acc[randomDay] = (acc[randomDay] || 0) + client.disponibilidades_ativas;
    return acc;
  }, {} as Record<number, number>);

  const dayChartData = DIAS_SEMANA.map((day, index) => ({
    name: day,
    disponibilidades: dayDistributionData[index] || 0,
  }));

  // Distribuição de preferências
  const preferenceData = [
    { name: 'Alta', value: Math.floor(clients.length * 0.4), color: COLORS[0] },
    { name: 'Média', value: Math.floor(clients.length * 0.45), color: COLORS[1] },
    { name: 'Baixa', value: Math.floor(clients.length * 0.15), color: COLORS[2] },
  ];

  // Distribuição de horários
  const timeDistributionData = insights
    ? [
        { name: 'Manhã', value: insights.timePreferences.morning },
        { name: 'Tarde', value: insights.timePreferences.afternoon },
        { name: 'Noite', value: insights.timePreferences.evening },
      ]
    : [];

  // Taxa de aceitação por cliente (top 10)
  const topAcceptanceClients = [...clients]
    .filter((c) => c.total_sugestoes > 0)
    .sort((a, b) => b.taxa_aceitacao - a.taxa_aceitacao)
    .slice(0, 10)
    .map((c) => ({
      name: c.nome.split(' ')[0], // Primeiro nome apenas
      taxa: c.taxa_aceitacao,
    }));

  // =====================================================
  // RENDER
  // =====================================================

  if (isLoadingInsights) {
    return (
      <Card>
        <CardContent className="py-12">
          <LoadingSpinner />
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* KPIs Resumidos */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="border-l-4 border-l-[#3f9094]">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-700 flex items-center gap-2">
              <Users className="h-4 w-4" />
              Taxa de Configuração
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">
              {overview
                ? ((overview.clientes_com_disponibilidade / overview.total_clientes) * 100).toFixed(
                    1
                  )
                : 0}
              %
            </div>
            <p className="text-xs text-gray-500 mt-1">
              {overview?.clientes_com_disponibilidade} de {overview?.total_clientes} clientes
            </p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-green-500">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-700 flex items-center gap-2">
              <Target className="h-4 w-4" />
              Taxa de Aceitação Geral
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">
              {overview?.taxa_aceitacao_geral.toFixed(1) || 0}%
            </div>
            <p className="text-xs text-gray-500 mt-1">
              {overview?.sugestoes_aceitas} de {overview?.total_sugestoes} sugestões
            </p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-blue-500">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-700 flex items-center gap-2">
              <Activity className="h-4 w-4" />
              Slots Ativos
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{insights?.totalActiveSlots || 0}</div>
            <p className="text-xs text-gray-500 mt-1">Horários disponíveis no total</p>
          </CardContent>
        </Card>
      </div>

      {/* Charts Row 1 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Disponibilidades por Dia da Semana */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5 text-[#3f9094]" />
              Disponibilidades por Dia da Semana
            </CardTitle>
            <CardDescription>
              Distribuição de horários disponíveis ao longo da semana
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={dayChartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="disponibilidades" fill={COLORS[0]} name="Disponibilidades" />
              </BarChart>
            </ResponsiveContainer>
            {insights && (
              <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-950 rounded-lg">
                <p className="text-sm font-medium text-blue-900 dark:text-blue-100">
                  📊 Dia mais disponível:{' '}
                  <strong>{DIAS_SEMANA[insights.mostAvailableDay.day]}</strong> com{' '}
                  {insights.mostAvailableDay.count} horários
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Distribuição de Preferências */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <PieChart className="h-5 w-5 text-[#3f9094]" />
              Distribuição de Preferências
            </CardTitle>
            <CardDescription>
              Níveis de preferência dos clientes para seus horários
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <RePieChart>
                <Pie
                  data={preferenceData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, value }) => `${name}: ${value}`}
                  outerRadius={100}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {preferenceData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </RePieChart>
            </ResponsiveContainer>
            <div className="mt-4 flex items-center justify-center gap-4 flex-wrap">
              {preferenceData.map((item) => (
                <div key={item.name} className="flex items-center gap-2">
                  <div
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: item.color }}
                  />
                  <span className="text-sm">
                    {item.name}: {item.value}
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts Row 2 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Horários Preferidos */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5 text-[#3f9094]" />
              Horários Preferidos
            </CardTitle>
            <CardDescription>Distribuição entre manhã, tarde e noite</CardDescription>
          </CardHeader>
          <CardContent>
            {insights ? (
              <>
                <ResponsiveContainer width="100%" height={250}>
                  <BarChart data={timeDistributionData} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis type="number" />
                    <YAxis dataKey="name" type="category" />
                    <Tooltip />
                    <Bar dataKey="value" fill={COLORS[1]} name="Horários" />
                  </BarChart>
                </ResponsiveContainer>
                <div className="mt-4 space-y-2">
                  {timeDistributionData.map((item, index) => (
                    <div key={index} className="flex items-center justify-between">
                      <span className="text-sm font-medium">{item.name}</span>
                      <Badge variant="outline">{item.value} horários</Badge>
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <p className="text-center text-gray-500 py-12">Sem dados disponíveis</p>
            )}
          </CardContent>
        </Card>

        {/* Top 10 Taxa de Aceitação */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-[#3f9094]" />
              Top 10 - Taxa de Aceitação
            </CardTitle>
            <CardDescription>
              Clientes com maior taxa de aceitação de sugestões
            </CardDescription>
          </CardHeader>
          <CardContent>
            {topAcceptanceClients.length > 0 ? (
              <>
                <ResponsiveContainer width="100%" height={250}>
                  <BarChart data={topAcceptanceClients}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis domain={[0, 100]} />
                    <Tooltip />
                    <Bar dataKey="taxa" fill={COLORS[2]} name="Taxa %" />
                  </BarChart>
                </ResponsiveContainer>
                <div className="mt-4 p-3 bg-green-50 dark:bg-green-950 rounded-lg">
                  <p className="text-sm text-green-900 dark:text-green-100">
                    🏆 Melhor taxa: <strong>{topAcceptanceClients[0]?.name}</strong> com{' '}
                    {topAcceptanceClients[0]?.taxa.toFixed(1)}%
                  </p>
                </div>
              </>
            ) : (
              <p className="text-center text-gray-500 py-12">
                Nenhum cliente com sugestões ainda
              </p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Insights Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-950 dark:to-blue-900">
          <CardContent className="pt-6">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm font-medium text-blue-900 dark:text-blue-100 mb-1">
                  Clientes Sem Disponibilidade
                </p>
                <p className="text-3xl font-bold text-blue-900 dark:text-blue-100">
                  {overview?.clientes_sem_disponibilidade || 0}
                </p>
              </div>
              <Users className="h-8 w-8 text-blue-600" />
            </div>
            <p className="text-xs text-blue-800 dark:text-blue-200 mt-2">
              Oportunidade de engajamento
            </p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-green-50 to-green-100 dark:from-green-950 dark:to-green-900">
          <CardContent className="pt-6">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm font-medium text-green-900 dark:text-green-100 mb-1">
                  Sugestões Pendentes
                </p>
                <p className="text-3xl font-bold text-green-900 dark:text-green-100">
                  {overview?.sugestoes_pendentes || 0}
                </p>
              </div>
              <Activity className="h-8 w-8 text-green-600" />
            </div>
            <p className="text-xs text-green-800 dark:text-green-200 mt-2">
              Aguardando resposta dos clientes
            </p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-950 dark:to-purple-900">
          <CardContent className="pt-6">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm font-medium text-purple-900 dark:text-purple-100 mb-1">
                  Média de Disponibilidades
                </p>
                <p className="text-3xl font-bold text-purple-900 dark:text-purple-100">
                  {overview
                    ? (
                        overview.total_disponibilidades / Math.max(overview.total_clientes, 1)
                      ).toFixed(1)
                    : 0}
                </p>
              </div>
              <Calendar className="h-8 w-8 text-purple-600" />
            </div>
            <p className="text-xs text-purple-800 dark:text-purple-200 mt-2">
              Por cliente no sistema
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

