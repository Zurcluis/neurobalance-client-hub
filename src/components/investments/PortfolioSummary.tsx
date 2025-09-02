import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { PortfolioSummary as PortfolioSummaryType } from '@/types/investments';
import { TrendingUp, TrendingDown, DollarSign, Target, Award, AlertTriangle } from 'lucide-react';

interface PortfolioSummaryProps {
  summary: PortfolioSummaryType;
}

export const PortfolioSummary: React.FC<PortfolioSummaryProps> = ({ summary }) => {
  const isProfit = summary.totalPnL >= 0;
  
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-PT', {
      style: 'currency',
      currency: 'EUR'
    }).format(value);
  };

  const formatPercent = (value: number) => {
    return `${value >= 0 ? '+' : ''}${value.toFixed(2)}%`;
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
      <Card className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-950 dark:to-blue-900 border-blue-200 dark:border-blue-800">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium text-blue-700 dark:text-blue-300">
            Valor Total
          </CardTitle>
          <DollarSign className="h-4 w-4 text-blue-600 dark:text-blue-400" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-blue-900 dark:text-blue-100">
            {formatCurrency(summary.totalValue)}
          </div>
          <p className="text-xs text-blue-600 dark:text-blue-400 mt-1">
            Portfolio atual
          </p>
        </CardContent>
      </Card>

      <Card className="bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-950 dark:to-purple-900 border-purple-200 dark:border-purple-800">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium text-purple-700 dark:text-purple-300">
            Total Investido
          </CardTitle>
          <Target className="h-4 w-4 text-purple-600 dark:text-purple-400" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-purple-900 dark:text-purple-100">
            {formatCurrency(summary.totalInvested)}
          </div>
          <p className="text-xs text-purple-600 dark:text-purple-400 mt-1">
            Capital inicial
          </p>
        </CardContent>
      </Card>

      <Card className={`bg-gradient-to-br ${
        isProfit 
          ? 'from-green-50 to-green-100 dark:from-green-950 dark:to-green-900 border-green-200 dark:border-green-800'
          : 'from-red-50 to-red-100 dark:from-red-950 dark:to-red-900 border-red-200 dark:border-red-800'
      }`}>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className={`text-sm font-medium ${
            isProfit ? 'text-green-700 dark:text-green-300' : 'text-red-700 dark:text-red-300'
          }`}>
            P&L Total
          </CardTitle>
          {isProfit ? (
            <TrendingUp className="h-4 w-4 text-green-600 dark:text-green-400" />
          ) : (
            <TrendingDown className="h-4 w-4 text-red-600 dark:text-red-400" />
          )}
        </CardHeader>
        <CardContent>
          <div className={`text-2xl font-bold ${
            isProfit ? 'text-green-900 dark:text-green-100' : 'text-red-900 dark:text-red-100'
          }`}>
            {formatCurrency(summary.totalPnL)}
          </div>
          <p className={`text-xs mt-1 flex items-center gap-1 ${
            isProfit ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'
          }`}>
            {formatPercent(summary.totalPnLPercent)}
          </p>
        </CardContent>
      </Card>

      <Card className="bg-gradient-to-br from-amber-50 to-amber-100 dark:from-amber-950 dark:to-amber-900 border-amber-200 dark:border-amber-800">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium text-amber-700 dark:text-amber-300">
            Performance
          </CardTitle>
          <Award className="h-4 w-4 text-amber-600 dark:text-amber-400" />
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {summary.topGainer && (
              <div className="flex items-center justify-between">
                <span className="text-xs text-amber-600 dark:text-amber-400">Melhor:</span>
                <Badge variant="outline" className="text-green-600 border-green-300 bg-green-50 dark:bg-green-950">
                  {summary.topGainer.symbol}
                </Badge>
              </div>
            )}
            {summary.topLoser && (
              <div className="flex items-center justify-between">
                <span className="text-xs text-amber-600 dark:text-amber-400">Pior:</span>
                <Badge variant="outline" className="text-red-600 border-red-300 bg-red-50 dark:bg-red-950">
                  {summary.topLoser.symbol}
                </Badge>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
