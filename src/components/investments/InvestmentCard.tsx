import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { TrendingUp, TrendingDown, Pencil, Trash2 } from 'lucide-react';
import { format } from 'date-fns';
import { formatCurrency, formatPercent } from '@/utils/formatUtils';
import type { Investment } from '@/types/investments';
import { cn } from '@/lib/utils';

const TYPE_BADGE_CLASS: Record<Investment['type'], string> = {
  crypto: 'bg-orange-100 text-orange-800 dark:bg-orange-950/40 dark:text-orange-300 border-transparent',
  stock: 'bg-blue-100 text-blue-800 dark:bg-blue-950/40 dark:text-blue-300 border-transparent',
  etf: 'bg-teal-100 text-teal-800 dark:bg-teal-950/40 dark:text-teal-300 border-transparent',
};

const TYPE_LABEL: Record<Investment['type'], string> = {
  crypto: 'Cripto',
  stock: 'Ação',
  etf: 'ETF',
};

interface InvestmentCardProps {
  investment: Investment;
  onEdit: (investment: Investment) => void;
  onDelete: (id: string) => void;
}

export const InvestmentCard: React.FC<InvestmentCardProps> = ({
  investment,
  onEdit,
  onDelete,
}) => {
  const totalValue = investment.quantity * investment.currentPrice;
  const totalInvested = investment.quantity * investment.buyPrice;
  const pnl = totalValue - totalInvested;
  const pnlPercent = totalInvested > 0 ? (pnl / totalInvested) * 100 : 0;
  const isProfit = pnl >= 0;

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <CardTitle className="text-base font-semibold truncate">
              {investment.symbol.toUpperCase()}
            </CardTitle>
            <p className="text-sm text-muted-foreground mt-0.5 truncate">{investment.name}</p>
          </div>
          <div className="flex items-center gap-1.5 shrink-0">
            <Badge className={TYPE_BADGE_CLASS[investment.type]}>
              {TYPE_LABEL[investment.type]}
            </Badge>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onEdit(investment)}
              className="h-8 w-8 p-0"
              aria-label="Editar investimento"
            >
              <Pencil className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onDelete(investment.id)}
              className="h-8 w-8 p-0 text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/40"
              aria-label="Remover investimento"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-sm text-muted-foreground">Quantidade</p>
            <p className="text-lg font-semibold tabular-nums">
              {investment.quantity.toLocaleString('pt-PT', { maximumFractionDigits: 8 })}
            </p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Preço atual</p>
            <p className="text-lg font-semibold tabular-nums">
              {formatCurrency(investment.currentPrice)}
            </p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Preço de compra</p>
            <p className="text-sm font-medium tabular-nums mt-1">
              {formatCurrency(investment.buyPrice)}
            </p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Data de compra</p>
            <p className="text-sm font-medium mt-1">
              {format(new Date(investment.purchaseDate), 'dd/MM/yyyy')}
            </p>
          </div>
        </div>

        <div className="border-t pt-3 grid grid-cols-2 gap-4">
          <div>
            <p className="text-sm text-muted-foreground">Valor atual</p>
            <p className="text-xl font-bold tabular-nums">{formatCurrency(totalValue)}</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Ganhos/Perdas</p>
            <div
              className={cn(
                'flex items-center gap-1.5 mt-0.5',
                isProfit ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400'
              )}
            >
              {isProfit ? (
                <TrendingUp className="h-4 w-4 shrink-0" />
              ) : (
                <TrendingDown className="h-4 w-4 shrink-0" />
              )}
              <div className="tabular-nums">
                <p className="text-lg font-bold leading-tight">{formatCurrency(pnl)}</p>
                <p className="text-xs font-medium">
                  {pnlPercent >= 0 ? '+' : ''}
                  {formatPercent(pnlPercent, 2)}
                </p>
              </div>
            </div>
          </div>
        </div>

        {investment.notes && (
          <div className="border-t pt-3">
            <p className="text-sm text-muted-foreground">Notas</p>
            <p className="text-sm mt-1">{investment.notes}</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
