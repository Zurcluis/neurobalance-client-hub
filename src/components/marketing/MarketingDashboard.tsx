import React, { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { MarketingCampaign, MarketingMetrics } from '@/types/marketing';
import KpiCard from '@/components/shared/KpiCard';
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
  Filler
} from 'chart.js';
import { Bar, Doughnut } from 'react-chartjs-2';
import {
  Euro,
  Users,
  Target,
  BarChart3,
  PieChart,
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
  ArcElement,
  Filler
);

interface MarketingDashboardProps {
  campaigns: MarketingCampaign[];
  metrics: MarketingMetrics;
}

const MarketingDashboard: React.FC<MarketingDashboardProps> = ({
  campaigns,
  metrics
}) => {
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

  // Dados para gráfico de performance mensal
  const monthlyData = useMemo(() => {
    const monthlyStats: { [key: string]: { investimento: number; receita: number; leads: number; vendas: number } } = {};
    
    campaigns.forEach(campaign => {
      const key = `${campaign.mes}/${campaign.ano}`;
      if (!monthlyStats[key]) {
        monthlyStats[key] = { investimento: 0, receita: 0, leads: 0, vendas: 0 };
      }
      monthlyStats[key].investimento += campaign.investimento;
      monthlyStats[key].receita += campaign.receita;
      monthlyStats[key].leads += campaign.leads;
      monthlyStats[key].vendas += campaign.vendas;
    });

    const sortedKeys = Object.keys(monthlyStats).sort((a, b) => {
      const [mesA, anoA] = a.split('/').map(Number);
      const [mesB, anoB] = b.split('/').map(Number);
      return anoA !== anoB ? anoA - anoB : mesA - mesB;
    });

    return {
      labels: sortedKeys,
      datasets: [
        {
          label: 'Investimento',
          data: sortedKeys.map(key => monthlyStats[key].investimento),
          backgroundColor: 'rgba(244, 63, 94, 0.55)',
          borderColor: 'rgba(244, 63, 94, 1)',
          borderWidth: 2,
        },
        {
          label: 'Receita',
          data: sortedKeys.map(key => monthlyStats[key].receita),
          backgroundColor: 'rgba(63, 144, 148, 0.55)',
          borderColor: 'rgba(63, 144, 148, 1)',
          borderWidth: 2,
        }
      ]
    };
  }, [campaigns]);

  // Dados para gráfico de origem das campanhas
  const origemData = useMemo(() => {
    const origemStats: { [key: string]: number } = {};

    campaigns.forEach(campaign => {
      origemStats[campaign.origem] = (origemStats[campaign.origem] || 0) + campaign.receita;
    });

    const colors = [
      '#3f9094', '#2A5854', '#65ada7', '#9CC1BF', '#5C8A87',
      '#B7D6D3', '#F59E0B', '#64748B', '#84CC16', '#F43F5E'
    ];

    return {
      labels: Object.keys(origemStats),
      datasets: [
        {
          data: Object.values(origemStats),
          backgroundColor: colors.slice(0, Object.keys(origemStats).length),
          borderWidth: 2,
          borderColor: '#ffffff'
        }
      ]
    };
  }, [campaigns]);

  // Dados para gráfico de ROI por campanha (top 10)
  const roiData = useMemo(() => {
    const campaignsWithROI = campaigns
      .map(campaign => ({
        ...campaign,
        roi: campaign.investimento > 0 ? ((campaign.receita - campaign.investimento) / campaign.investimento) * 100 : 0
      }))
      .sort((a, b) => b.roi - a.roi)
      .slice(0, 10);

    return {
      labels: campaignsWithROI.map(c => c.name.length > 20 ? c.name.substring(0, 20) + '...' : c.name),
      datasets: [
        {
          label: 'ROI (%)',
          data: campaignsWithROI.map(c => c.roi),
          backgroundColor: campaignsWithROI.map(c => c.roi >= 0 ? 'rgba(34, 197, 94, 0.6)' : 'rgba(239, 68, 68, 0.6)'),
          borderColor: campaignsWithROI.map(c => c.roi >= 0 ? 'rgba(34, 197, 94, 1)' : 'rgba(239, 68, 68, 1)'),
          borderWidth: 1,
        }
      ]
    };
  }, [campaigns]);

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top' as const,
      },
      tooltip: {
        callbacks: {
          label: function(context: any) {
            if (context.dataset.label === 'ROI (%)') {
              return `${context.dataset.label}: ${context.parsed.y.toFixed(1)}%`;
            }
            return `${context.dataset.label}: ${formatCurrency(context.parsed.y)}`;
          }
        }
      }
    },
    scales: {
      y: {
        beginAtZero: true,
        ticks: {
          callback: function(value: any) {
            if (typeof value === 'number') {
              return formatCurrency(value);
            }
            return value;
          }
        }
      }
    }
  };

  const roiChartOptions = {
    ...chartOptions,
    scales: {
      y: {
        beginAtZero: true,
        ticks: {
          callback: function(value: any) {
            return `${value}%`;
          }
        }
      }
    }
  };

  return (
    <div className="space-y-6">
      {/* Métricas Principais */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard
          icon={Euro}
          label="Total Investido"
          value={formatCurrency(metrics.totalInvestimento)}
          tone="red"
          sub={`${campaigns.length} campanhas no período`}
        />
        <KpiCard
          icon={Euro}
          label="Total Receita"
          value={formatCurrency(metrics.totalReceita)}
          tone="emerald"
        />
        <KpiCard
          icon={Users}
          label="Total Leads"
          value={metrics.totalLeads.toLocaleString()}
          tone="teal"
        />
        <KpiCard
          icon={Target}
          label="ROI Médio"
          value={formatPercentage(metrics.roi)}
          tone={metrics.roi >= 0 ? 'teal' : 'red'}
          sub={metrics.roi >= 0 ? 'Retorno positivo' : 'Retorno negativo'}
        />
      </div>

      {/* Métricas Secundárias inline */}
      <Card className="shadow-sm">
        <CardContent className="p-0">
          <div className="grid grid-cols-2 md:grid-cols-4 divide-x divide-y md:divide-y-0 divide-border">
            <div className="p-4 text-center">
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">CPL Médio</p>
              <p className="text-lg font-semibold mt-1 tabular-nums">{formatCurrency(metrics.cplMedio)}</p>
            </div>
            <div className="p-4 text-center">
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">CAC Médio</p>
              <p className="text-lg font-semibold mt-1 tabular-nums">{formatCurrency(metrics.cacMedio)}</p>
            </div>
            <div className="p-4 text-center">
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Taxa Conversão</p>
              <p className="text-lg font-semibold mt-1 tabular-nums">{formatPercentage(metrics.taxaConversaoMedia)}</p>
            </div>
            <div className="p-4 text-center">
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">ROAS</p>
              <p className="text-lg font-semibold mt-1 tabular-nums">{metrics.roas.toFixed(2)}x</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Gráficos */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Gráfico de Performance Mensal */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Performance Mensal
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-80">
              <Bar data={monthlyData} options={chartOptions} />
            </div>
          </CardContent>
        </Card>

        {/* Gráfico de Receita por Origem */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <PieChart className="h-5 w-5" />
              Receita por Origem
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-80">
              <Doughnut 
                data={origemData} 
                options={{
                  responsive: true,
                  maintainAspectRatio: false,
                  plugins: {
                    legend: {
                      position: 'bottom' as const,
                    },
                    tooltip: {
                      callbacks: {
                        label: function(context: any) {
                          return `${context.label}: ${formatCurrency(context.parsed)}`;
                        }
                      }
                    }
                  }
                }}
              />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Gráfico de ROI por Campanha */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            Top 10 Campanhas por ROI
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-96">
            <Bar data={roiData} options={roiChartOptions} />
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default MarketingDashboard;
