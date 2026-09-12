import React, { useMemo } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import KpiCard from '@/components/shared/KpiCard';
import { CalendarPlus, Clock, CreditCard, TrendingUp } from 'lucide-react';
import { formatCurrency } from '@/utils/formatUtils';
import type { ClientDetailData } from '@/types/client';
import type { NextAppointmentInfo } from './useClientDetailData';

interface SummaryPayment {
  descricao?: string | null;
  valor: number;
}

interface ClientHeaderSummaryProps {
  client: ClientDetailData;
  realizedSessionsCount: number;
  payments: SummaryPayment[];
  isPartner: boolean;
  nextAppointment: NextAppointmentInfo | null;
  onSchedule: () => void;
}

const ClientHeaderSummary: React.FC<ClientHeaderSummaryProps> = ({
  client,
  realizedSessionsCount,
  payments,
  isPartner,
  nextAppointment,
  onSchedule,
}) => {
  const sessionProgress = client.max_sessoes
    ? Math.min((realizedSessionsCount / client.max_sessoes) * 100, 100)
    : 0;

  const paymentsCount = useMemo(() => (payments || []).length, [payments]);

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3 sm:gap-4">
      <KpiCard
        icon={TrendingUp}
        label="Sessões Realizadas"
        value={
          client.max_sessoes ? `${realizedSessionsCount}/${client.max_sessoes}` : realizedSessionsCount
        }
        sub={client.max_sessoes ? `${Math.round(sessionProgress)}% do plano concluído` : 'Total acumulado'}
        tone="teal"
        className="min-w-0"
      />

      {!isPartner && (
        <KpiCard
          icon={CreditCard}
          label="Total Pago"
          value={formatCurrency(client.total_pago || 0)}
          sub={`${paymentsCount} pagamento(s) registado(s)`}
          tone="emerald"
          className="min-w-0"
        />
      )}

      <Card className="shadow-sm hover:shadow-md transition-shadow min-w-0 sm:col-span-2">
        <CardContent className="p-4 sm:p-5">
          <div className="flex items-start justify-between gap-3 h-full">
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2 mb-2">
                <span className="flex h-10 w-10 rounded-lg bg-blue-50 text-blue-600 dark:bg-blue-950/40 dark:text-blue-300 items-center justify-center shrink-0">
                  <Clock className="h-5 w-5" />
                </span>
                <span className="text-sm font-medium text-muted-foreground">Próxima Sessão</span>
              </div>
              {nextAppointment ? (
                <div className="min-w-0">
                  <p className="text-lg font-semibold text-foreground truncate">
                    {nextAppointment.formattedText}
                  </p>
                  <div className="flex items-center gap-2 mt-1 min-w-0 flex-wrap">
                    {nextAppointment.title && (
                      <span className="text-sm text-muted-foreground truncate">
                        {nextAppointment.title}
                      </span>
                    )}
                    {nextAppointment.type && (
                      <span className="px-1.5 py-0.5 bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-300 rounded text-xs shrink-0">
                        {nextAppointment.type}
                      </span>
                    )}
                    {nextAppointment.status && (
                      <span
                        className={`px-2 py-0.5 rounded-full text-xs font-medium shrink-0 ${
                          nextAppointment.status === 'confirmado'
                            ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300'
                            : nextAppointment.status === 'pendente'
                              ? 'bg-amber-100 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300'
                              : 'bg-muted text-muted-foreground'
                        }`}
                      >
                        {nextAppointment.status}
                      </span>
                    )}
                  </div>
                </div>
              ) : (
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <p className="text-muted-foreground text-sm">Sem sessões agendadas</p>
                  <Button
                    variant="outline"
                    size="sm"
                    className="text-primary border-primary/30 hover:bg-primary/10 w-fit"
                    onClick={onSchedule}
                  >
                    <CalendarPlus className="h-4 w-4 mr-1" />
                    Agendar
                  </Button>
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ClientHeaderSummary;
