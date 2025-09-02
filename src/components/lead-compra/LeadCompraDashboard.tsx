import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { LeadCompraStatistics } from '@/types/lead-compra';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
} from 'chart.js';
import { Bar, Doughnut, Line } from 'react-chartjs-2';
import {
  Users,
  ShoppingCart,
  UserCheck,
  Euro,
  TrendingUp,
  TrendingDown,
  BarChart3,
  PieChart,
  Target,
  Calendar
} from 'lucide-react';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  Title,
  Tooltip,
  Legend,
  ArcElement
);

interface LeadCompraDashboardProps {
  statistics: LeadCompraStatistics;
}

const LeadCompraDashboard: React.FC<LeadCompraDashboardProps> = ({ statistics }) => {
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-PT', {
      style: 'currency',
      currency: 'EUR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(value);
  };

  const formatPercentage = (value: number) => {
    return `${value.toFixed(1)}%`;
  };

  // Dados para gráfico de distribuição por gênero
  const generoData = {
    labels: ['Masculino', 'Feminino', 'Outro'],
    datasets: [
      {
        data: [
          statistics.distribuicaoPorGenero.masculino,
          statistics.distribuicaoPorGenero.feminino,
          statistics.distribuicaoPorGenero.outro,
        ],
        backgroundColor: ['#3B82F6', '#EC4899', '#10B981'],
        borderWidth: 2,
        borderColor: '#ffffff'
      }
    ]
  };

  // Dados para gráfico de cidades (top 10)
  const cidadesEntries = Object.entries(statistics.distribuicaoPorCidade)
    .sort(([,a], [,b]) => b - a)
    .slice(0, 10);

  const cidadesData = {
    labels: cidadesEntries.map(([cidade]) => cidade),
    datasets: [
      {
        label: 'Registos por Cidade',
        data: cidadesEntries.map(([, count]) => count),
        backgroundColor: 'rgba(59, 130, 246, 0.6)',
        borderColor: 'rgba(59, 130, 246, 1)',
        borderWidth: 1,
      }
    ]
  };

  // Dados para gráfico mensal
  const mesesEntries = Object.entries(statistics.distribuicaoPorMes)
    .sort(([a], [b]) => {
      const [mesA, anoA] = a.split('/').map(Number);
      const [mesB, anoB] = b.split('/').map(Number);
      return anoA !== anoB ? anoA - anoB : mesA - mesB;
    });

  const mesesData = {
    labels: mesesEntries.map(([mesAno]) => {
      const [mes, ano] = mesAno.split('/');
      const meses = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
      return `${meses[parseInt(mes) - 1]} ${ano}`;
    }),
    datasets: [
      {
        label: 'Registos por Mês',
        data: mesesEntries.map(([, count]) => count),
        borderColor: 'rgba(16, 185, 129, 1)',
        backgroundColor: 'rgba(16, 185, 129, 0.1)',
        tension: 0.4,
        fill: true,
      }
    ]
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top' as const,
      },
    },
  };

  return (
    <div className="space-y-6">
      {/* Título */}
      <div className="text-center mb-8">
        <h2 className="text-3xl font-bold text-gray-900 mb-2">📊 LEAD COMPRA - NEUROBALANCE</h2>
        <p className="text-gray-600">Dashboard completo de leads e conversões</p>
      </div>

      {/* Métricas Principais */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total de Registos</p>
                <p className="text-2xl font-bold text-blue-600">
                  {statistics.totalRegistos.toLocaleString()}
                </p>
              </div>
              <Users className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Compras Registadas</p>
                <p className="text-2xl font-bold text-green-600">
                  {statistics.comprasRegistadas.toLocaleString()}
                </p>
              </div>
              <ShoppingCart className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Leads (sem compra)</p>
                <p className="text-2xl font-bold text-orange-600">
                  {statistics.leadsRegistados.toLocaleString()}
                </p>
              </div>
              <UserCheck className="h-8 w-8 text-orange-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Valor Total Registado</p>
                <p className="text-2xl font-bold text-purple-600">
                  {formatCurrency(statistics.valorTotalRegistado)}
                </p>
              </div>
              <Euro className="h-8 w-8 text-purple-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Estatísticas dos Valores */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            Estatísticas dos Valores
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            <div className="text-center">
              <p className="text-sm text-gray-600">Registos com Valor</p>
              <p className="text-xl font-semibold text-blue-600">
                {statistics.estatisticasValores.registosComValor}
              </p>
            </div>
            <div className="text-center">
              <p className="text-sm text-gray-600">Média</p>
              <p className="text-xl font-semibold text-green-600">
                {formatCurrency(statistics.estatisticasValores.media)}
              </p>
            </div>
            <div className="text-center">
              <p className="text-sm text-gray-600">Mínimo</p>
              <p className="text-xl font-semibold text-red-600">
                {formatCurrency(statistics.estatisticasValores.minimo)}
              </p>
            </div>
            <div className="text-center">
              <p className="text-sm text-gray-600">Mediana</p>
              <p className="text-xl font-semibold text-purple-600">
                {formatCurrency(statistics.estatisticasValores.mediana)}
              </p>
            </div>
            <div className="text-center">
              <p className="text-sm text-gray-600">Máximo</p>
              <p className="text-xl font-semibold text-orange-600">
                {formatCurrency(statistics.estatisticasValores.maximo)}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Taxa de Conversão */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Taxa de Conversão Lead → Compra</p>
              <p className={`text-2xl font-bold ${statistics.conversaoLeadParaCompra >= 50 ? 'text-green-600' : statistics.conversaoLeadParaCompra >= 25 ? 'text-orange-600' : 'text-red-600'}`}>
                {statistics.conversaoLeadParaCompra >= 50 ? (
                  <TrendingUp className="inline h-6 w-6 mr-2" />
                ) : (
                  <TrendingDown className="inline h-6 w-6 mr-2" />
                )}
                {formatPercentage(statistics.conversaoLeadParaCompra)}
              </p>
            </div>
            <Target className="h-8 w-8 text-indigo-500" />
          </div>
        </CardContent>
      </Card>

      {/* Gráficos */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Distribuição por Gênero */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <PieChart className="h-5 w-5" />
              Distribuição por Gênero
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-80">
              <Doughnut 
                data={generoData} 
                options={{
                  responsive: true,
                  maintainAspectRatio: false,
                  plugins: {
                    legend: {
                      position: 'bottom' as const,
                    },
                  }
                }}
              />
            </div>
          </CardContent>
        </Card>

        {/* Top 10 Cidades */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              Top 10 Cidades
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-80">
              <Bar data={cidadesData} options={chartOptions} />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Evolução Mensal */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Evolução Mensal de Registos
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-80">
            <Line data={mesesData} options={chartOptions} />
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default LeadCompraDashboard;
