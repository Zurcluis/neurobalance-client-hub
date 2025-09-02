import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Investment } from '@/types/investments';
import { TrendingUp, TrendingDown, Edit, Trash2 } from 'lucide-react';
import { format } from 'date-fns';
import { pt } from 'date-fns/locale';

interface InvestmentCardProps {
  investment: Investment;
  onEdit: (investment: Investment) => void;
  onDelete: (id: string) => void;
}

export const InvestmentCard: React.FC<InvestmentCardProps> = ({
  investment,
  onEdit,
  onDelete
}) => {
  const totalValue = investment.quantity * investment.currentPrice;
  const totalInvested = investment.quantity * investment.buyPrice;
  const pnl = totalValue - totalInvested;
  const pnlPercent = totalInvested > 0 ? (pnl / totalInvested) * 100 : 0;
  const isProfit = pnl >= 0;

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'crypto':
        return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'stock':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'etf':
        return 'bg-green-100 text-green-800 border-green-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'crypto':
        return 'Crypto';
      case 'stock':
        return 'Ação';
      case 'etf':
        return 'ETF';
      default:
        return type;
    }
  };

  return (
    <Card className="hover:shadow-lg transition-shadow duration-200">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div>
              <CardTitle className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                {investment.symbol.toUpperCase()}
              </CardTitle>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                {investment.name}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Badge className={getTypeColor(investment.type)}>
              {getTypeLabel(investment.type)}
            </Badge>
            <div className="flex gap-1">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onEdit(investment)}
                className="h-8 w-8 p-0"
              >
                <Edit className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onDelete(investment.id)}
                className="h-8 w-8 p-0 text-red-500 hover:text-red-700"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-sm text-gray-600 dark:text-gray-400">Quantidade</p>
            <p className="text-lg font-semibold">{investment.quantity}</p>
          </div>
          <div>
            <p className="text-sm text-gray-600 dark:text-gray-400">Preço Atual</p>
            <p className="text-lg font-semibold">€{investment.currentPrice.toFixed(2)}</p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-sm text-gray-600 dark:text-gray-400">Preço de Compra</p>
            <p className="text-base">€{investment.buyPrice.toFixed(2)}</p>
          </div>
          <div>
            <p className="text-sm text-gray-600 dark:text-gray-400">Data de Compra</p>
            <p className="text-base">
              {format(new Date(investment.purchaseDate), 'dd/MM/yyyy', { locale: pt })}
            </p>
          </div>
        </div>

        <div className="border-t pt-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Valor Total</p>
              <p className="text-xl font-bold">€{totalValue.toFixed(2)}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">P&L</p>
              <div className="flex items-center gap-2">
                {isProfit ? (
                  <TrendingUp className="h-4 w-4 text-green-500" />
                ) : (
                  <TrendingDown className="h-4 w-4 text-red-500" />
                )}
                <div className={`text-right ${isProfit ? 'text-green-600' : 'text-red-600'}`}>
                  <p className="text-lg font-bold">
                    {isProfit ? '+' : ''}€{pnl.toFixed(2)}
                  </p>
                  <p className="text-sm">
                    {isProfit ? '+' : ''}{pnlPercent.toFixed(2)}%
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {investment.notes && (
          <div className="border-t pt-3">
            <p className="text-sm text-gray-600 dark:text-gray-400">Notas</p>
            <p className="text-sm mt-1">{investment.notes}</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
