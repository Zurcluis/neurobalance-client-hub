import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { AlertTriangle, ChevronRight, ShieldCheck } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { pt } from 'date-fns/locale';
import { formatCurrency } from '@/utils/formatUtils';
import type { FinanceAnomaly } from '@/utils/financeInsights';

interface AnomaliesCardProps {
  anomalies: FinanceAnomaly[];
}

const AnomaliesCard = ({ anomalies }: AnomaliesCardProps) => {
  const [selected, setSelected] = useState<FinanceAnomaly | null>(null);

  const detailDate = selected ? parseISO(selected.date) : null;

  return (
    <Card className="min-w-0">
      <CardHeader className="pb-3">
        <CardTitle className="text-base font-semibold flex items-center gap-2 min-w-0">
          <AlertTriangle className="h-4 w-4 text-amber-500 shrink-0" />
          <span className="truncate">Anomalias detetadas</span>
          {anomalies.length > 0 && (
            <Badge variant="secondary" className="text-[10px] shrink-0">
              {anomalies.length}
            </Badge>
          )}
        </CardTitle>
        <CardDescription>Movimentos fora do padrão dos últimos 6 meses</CardDescription>
      </CardHeader>
      <CardContent>
        {anomalies.length === 0 ? (
          <div className="py-8 text-center">
            <ShieldCheck className="h-10 w-10 text-muted-foreground/50 mx-auto mb-3" />
            <p className="text-sm font-medium">Nenhuma anomalia detetada</p>
            <p className="text-xs text-muted-foreground mt-1">
              Despesas e pagamentos dentro do padrão habitual por categoria.
            </p>
          </div>
        ) : (
          <div className="space-y-2 max-h-[360px] overflow-y-auto pr-1">
            {anomalies.map(anomaly => (
              <button
                key={anomaly.id}
                onClick={() => setSelected(anomaly)}
                className="w-full flex items-center justify-between gap-3 rounded-lg border px-3 py-2.5 text-left transition-colors hover:bg-muted/50"
              >
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <Badge
                      variant={anomaly.kind === 'despesa' ? 'destructive' : 'secondary'}
                      className="text-[10px] px-1.5 shrink-0"
                    >
                      {anomaly.kind === 'despesa' ? 'Despesa' : 'Receita'}
                    </Badge>
                    <span className="text-sm font-medium truncate">{anomaly.group}</span>
                  </div>
                  <p className="text-xs text-muted-foreground mt-0.5 truncate">
                    {anomaly.monthLabel} · {anomaly.reason}
                  </p>
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  <span className="text-sm font-semibold tabular-nums">{formatCurrency(anomaly.value)}</span>
                  <ChevronRight className="h-4 w-4 text-muted-foreground" />
                </div>
              </button>
            ))}
          </div>
        )}
      </CardContent>

      <Dialog open={selected !== null} onOpenChange={open => !open && setSelected(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-amber-500" />
              Detalhe da anomalia
            </DialogTitle>
            <DialogDescription>
              {selected ? `${selected.kind === 'despesa' ? 'Despesa' : 'Receita'} · ${selected.group}` : ''}
            </DialogDescription>
          </DialogHeader>
          {selected && (
            <div className="space-y-3 text-sm">
              <div className="grid grid-cols-2 gap-3">
                <div className="rounded-lg border p-3">
                  <p className="text-xs text-muted-foreground">Valor registado</p>
                  <p className="text-lg font-semibold tabular-nums mt-1">{formatCurrency(selected.value)}</p>
                </div>
                <div className="rounded-lg border p-3">
                  <p className="text-xs text-muted-foreground">Valor de referência</p>
                  <p className="text-lg font-semibold tabular-nums mt-1">{formatCurrency(selected.expected)}</p>
                </div>
              </div>
              <div className="rounded-lg border p-3 space-y-2">
                <div className="flex justify-between gap-3">
                  <span className="text-muted-foreground">Mês</span>
                  <span className="font-medium">{selected.monthLabel}</span>
                </div>
                <div className="flex justify-between gap-3">
                  <span className="text-muted-foreground">Data</span>
                  <span className="font-medium">
                    {detailDate ? format(detailDate, "d 'de' MMMM 'de' yyyy", { locale: pt }) : selected.date}
                  </span>
                </div>
                <div className="flex justify-between gap-3">
                  <span className="text-muted-foreground">Rácio sobre a mediana</span>
                  <span className="font-medium tabular-nums">{selected.ratio.toFixed(1)}x</span>
                </div>
              </div>
              <div className="rounded-lg border p-3">
                <p className="text-xs text-muted-foreground mb-1">Motivo</p>
                <p className="text-sm">{selected.reason}</p>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </Card>
  );
};

export default AnomaliesCard;
