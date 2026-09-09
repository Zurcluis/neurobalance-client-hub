import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from 'recharts';
import type { Investment, InvestmentType } from '@/types/investments';
import { CHART, tooltipStyle, axisProps, compactCurrency } from '@/utils/chartUtils';
import { formatCurrency } from '@/utils/formatUtils';

const TYPE_META: Record<InvestmentType, { label: string; color: string }> = {
  crypto: { label: 'Criptomoedas', color: CHART.primary },
  stock: { label: 'Ações', color: CHART.soft },
  etf: { label: 'ETFs', color: '#8AC1BB' },
};

interface PortfolioChartProps {
  investments: Investment[];
}

export const PortfolioChart: React.FC<PortfolioChartProps> = ({ investments }) => {
  const typeData = (Object.keys(TYPE_META) as InvestmentType[])
    .map(type => {
      const items = investments.filter(inv => inv.type === type);
      return {
        type,
        label: TYPE_META[type].label,
        color: TYPE_META[type].color,
        count: items.length,
        value: items.reduce((sum, inv) => sum + inv.quantity * inv.currentPrice, 0),
      };
    })
    .filter(item => item.count > 0);

  const totalValue = typeData.reduce((sum, item) => sum + item.value, 0);

  const pnlData = investments
    .map(inv => {
      const invested = inv.quantity * inv.buyPrice;
      const pnl = inv.quantity * (inv.currentPrice - inv.buyPrice);
      return {
        symbol: inv.symbol,
        pnl,
        pnlPercent: invested > 0 ? (pnl / invested) * 100 : 0,
        fill: pnl >= 0 ? CHART.green : CHART.red,
      };
    })
    .sort((a, b) => b.pnl - a.pnl);

  if (investments.length === 0) {
    return null;
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-base font-semibold">Distribuição por tipo</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={260}>
            <PieChart>
              <Pie
                data={typeData}
                dataKey="value"
                nameKey="label"
                cx="50%"
                cy="50%"
                innerRadius={55}
                outerRadius={90}
                strokeWidth={2}
              >
                {typeData.map(item => (
                  <Cell key={item.type} fill={item.color} />
                ))}
              </Pie>
              <Tooltip
                contentStyle={tooltipStyle}
                formatter={value => [formatCurrency(value as number), 'Valor']}
              />
            </PieChart>
          </ResponsiveContainer>
          <div className="mt-4 space-y-1.5">
            {typeData.map(item => (
              <div
                key={item.type}
                className="flex items-center justify-between gap-3 rounded-md bg-muted/50 px-3 py-2"
              >
                <div className="flex items-center gap-2 min-w-0">
                  <span
                    className="h-2.5 w-2.5 rounded-full shrink-0"
                    style={{ backgroundColor: item.color }}
                  />
                  <span className="text-sm font-medium truncate">{item.label}</span>
                  <span className="text-xs text-muted-foreground shrink-0">
                    {item.count} {item.count === 1 ? 'posição' : 'posições'}
                  </span>
                </div>
                <div className="text-sm shrink-0">
                  <span className="font-semibold tabular-nums">{formatCurrency(item.value)}</span>
                  <span className="text-muted-foreground ml-2 tabular-nums">
                    {totalValue > 0 ? `${((item.value / totalValue) * 100).toFixed(1)}%` : '—'}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base font-semibold">Ganhos/Perdas por ativo</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={340}>
            <BarChart data={pnlData} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="symbol" {...axisProps} interval={0} />
              <YAxis {...axisProps} width={56} tickFormatter={compactCurrency} />
              <Tooltip
                contentStyle={tooltipStyle}
                formatter={value => [formatCurrency(value as number), 'Ganhos/Perdas']}
              />
              <Bar dataKey="pnl" radius={[4, 4, 0, 0]} maxBarSize={48}>
                {pnlData.map((item, index) => (
                  <Cell key={`${item.symbol}-${index}`} fill={item.fill} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  );
};
