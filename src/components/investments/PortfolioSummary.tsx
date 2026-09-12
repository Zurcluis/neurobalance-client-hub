import React from 'react';
import KpiCard from '@/components/shared/KpiCard';
import { TrendingUp, TrendingDown, Wallet, Target, Award } from 'lucide-react';
import { formatCurrency, formatPercent } from '@/utils/formatUtils';
import type { PortfolioSummary as PortfolioSummaryData } from '@/types/investments';

interface PortfolioSummaryProps {
  summary: PortfolioSummaryData;
}

const positionPercent = (position: { pnl: number; quantity: number; buyPrice: number }): number => {
  const invested = position.quantity * position.buyPrice;
  return invested > 0 ? (position.pnl / invested) * 100 : 0;
};

export const PortfolioSummary: React.FC<PortfolioSummaryProps> = ({ summary }) => {
  const isProfit = summary.totalPnL >= 0;
  const { topGainer, topLoser } = summary;
  const showLoser = topLoser && topLoser.symbol !== topGainer?.symbol;

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      <KpiCard
        icon={Wallet}
        label="Valor atual"
        value={formatCurrency(summary.totalValue)}
        sub={
          summary.unpricedCount > 0
            ? `${summary.unpricedCount} ${summary.unpricedCount === 1 ? 'posição sem' : 'posições sem'} preço atualizado`
            : 'Valor de mercado'
        }
        tone="blue"
      />
      <KpiCard
        icon={Target}
        label="Total investido"
        value={formatCurrency(summary.totalInvested)}
        sub="Capital aplicado"
        tone="purple"
      />
      <KpiCard
        icon={isProfit ? TrendingUp : TrendingDown}
        label="Ganhos/Perdas"
        value={formatCurrency(summary.totalPnL)}
        delta={{
          value: `${summary.totalPnLPercent >= 0 ? '+' : ''}${formatPercent(summary.totalPnLPercent)}`,
          positive: isProfit,
        }}
        sub={
          summary.unpricedCount > 0
            ? 'Apenas posições com preço atualizado'
            : undefined
        }
        tone={isProfit ? 'emerald' : 'red'}
      />
      <KpiCard
        icon={Award}
        label="Melhor posição"
        value={topGainer?.symbol ?? '—'}
        delta={
          topGainer
            ? {
                value: `${positionPercent(topGainer) >= 0 ? '+' : ''}${formatPercent(positionPercent(topGainer))}`,
                positive: positionPercent(topGainer) >= 0,
              }
            : undefined
        }
        sub={
          showLoser
            ? `Pior: ${topLoser.symbol} (${formatPercent(positionPercent(topLoser))})`
            : undefined
        }
        tone="amber"
      />
    </div>
  );
};
