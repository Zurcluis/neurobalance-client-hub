import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Investment } from '@/types/investments';
import { PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from 'recharts';

interface PortfolioChartProps {
  investments: Investment[];
}

export const PortfolioChart: React.FC<PortfolioChartProps> = ({ investments }) => {
  const COLORS = ['#FF8042', '#0088FE', '#00C49F', '#FFBB28', '#8884D8'];

  // Dados para o gráfico de pizza por tipo
  const typeData = investments.reduce((acc, inv) => {
    const existing = acc.find(item => item.type === inv.type);
    const value = inv.quantity * inv.currentPrice;
    
    if (existing) {
      existing.value += value;
    } else {
      acc.push({
        type: inv.type === 'crypto' ? 'Crypto' : inv.type === 'stock' ? 'Ações' : 'ETFs',
        value,
        color: inv.type === 'crypto' ? COLORS[0] : inv.type === 'stock' ? COLORS[1] : COLORS[2]
      });
    }
    return acc;
  }, [] as Array<{ type: string; value: number; color: string }>);

  // Dados para o gráfico de barras de P&L
  const pnlData = investments.map(inv => {
    const totalValue = inv.quantity * inv.currentPrice;
    const totalInvested = inv.quantity * inv.buyPrice;
    const pnl = totalValue - totalInvested;
    const pnlPercent = totalInvested > 0 ? (pnl / totalInvested) * 100 : 0;

    return {
      symbol: inv.symbol,
      pnl: pnl,
      pnlPercent: pnlPercent,
      fill: pnl >= 0 ? '#10B981' : '#EF4444'
    };
  }).sort((a, b) => b.pnl - a.pnl);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-PT', {
      style: 'currency',
      currency: 'EUR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white dark:bg-gray-800 p-3 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg">
          <p className="font-medium">{`${label}`}</p>
          <p className="text-sm">
            <span className="text-green-600 dark:text-green-400">P&L: </span>
            {formatCurrency(payload[0].value)}
          </p>
          <p className="text-sm">
            <span className="text-blue-600 dark:text-blue-400">%: </span>
            {payload[0].payload.pnlPercent.toFixed(2)}%
          </p>
        </div>
      );
    }
    return null;
  };

  const PieTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white dark:bg-gray-800 p-3 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg">
          <p className="font-medium">{payload[0].payload.type}</p>
          <p className="text-sm">
            <span className="text-blue-600 dark:text-blue-400">Valor: </span>
            {formatCurrency(payload[0].value)}
          </p>
        </div>
      );
    }
    return null;
  };

  if (investments.length === 0) {
    return null;
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
      {/* Gráfico de Pizza - Distribuição por Tipo */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg font-semibold">Distribuição por Tipo</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={typeData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ type, percent }) => `${type} ${(percent * 100).toFixed(1)}%`}
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
              >
                {typeData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip content={<PieTooltip />} />
            </PieChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Gráfico de Barras - P&L por Investimento */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg font-semibold">P&L por Investimento</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart
              data={pnlData}
              margin={{
                top: 5,
                right: 30,
                left: 20,
                bottom: 5,
              }}
            >
              <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
              <XAxis 
                dataKey="symbol" 
                tick={{ fontSize: 12 }}
                className="text-gray-600 dark:text-gray-400"
              />
              <YAxis 
                tick={{ fontSize: 12 }}
                className="text-gray-600 dark:text-gray-400"
                tickFormatter={(value) => formatCurrency(value)}
              />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="pnl" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  );
};
