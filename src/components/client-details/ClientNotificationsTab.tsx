import React from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { AlertCircle, AlertTriangle, BellOff, Calendar, CheckCircle2, CreditCard } from 'lucide-react';
import { EmptyState } from '@/components/shared/EmptyState';
import type { ClientDetailData } from '@/types/client';
import { cn } from '@/lib/utils';

export type ClientNotificationType =
  | 'pack_exhausted'
  | 'pack_ending'
  | 'treatment_ending'
  | 'treatment_finished';

export interface ClientNotification {
  id: string;
  type: ClientNotificationType;
  title: string;
  message: string;
  severity: 'danger' | 'warning' | 'info';
}

interface NotificationPayment {
  descricao?: string | null;
  valor: number;
}

interface BuildClientNotificationsParams {
  clientId?: string;
  client: ClientDetailData | null;
  payments: NotificationPayment[];
  realizedSessionsCount: number;
}

const SESSIONS_PER_PACK = 8;

export const buildClientNotifications = ({
  clientId,
  client,
  payments,
  realizedSessionsCount,
}: BuildClientNotificationsParams): ClientNotification[] => {
  const list: ClientNotification[] = [];
  if (!client || !payments) return list;

  const monthlyPayments = payments.filter(
    p =>
      p.descricao?.toLowerCase().includes('pack') ||
      p.descricao?.toLowerCase().includes('mensal')
  );

  if (monthlyPayments.length > 0) {
    const totalPackSessions = monthlyPayments.length * SESSIONS_PER_PACK;
    const remainingPackSessions = totalPackSessions - realizedSessionsCount;

    if (realizedSessionsCount >= totalPackSessions) {
      list.push({
        id: `pack_exhausted_${clientId}_${totalPackSessions}`,
        type: 'pack_exhausted',
        title: 'Pack de Sessões Esgotado',
        message: `O limite do pack de ${totalPackSessions} sessões foi atingido (realizou ${realizedSessionsCount} sessões). A próxima sessão será fora do pack.`,
        severity: 'danger',
      });
    } else if (remainingPackSessions <= 2) {
      list.push({
        id: `pack_ending_${clientId}_${totalPackSessions}`,
        type: 'pack_ending',
        title: 'Pack de Sessões a Terminar',
        message: `Restam apenas ${remainingPackSessions} sessões para esgotar o pack (realizou ${realizedSessionsCount} de ${totalPackSessions} sessões).`,
        severity: 'warning',
      });
    }
  }

  if (client.max_sessoes && client.max_sessoes > 0) {
    const remaining = client.max_sessoes - realizedSessionsCount;
    if (remaining > 0 && remaining <= 5) {
      list.push({
        id: `treatment_ending_${clientId}_${client.max_sessoes}`,
        type: 'treatment_ending',
        title: 'Tratamento a Terminar',
        message: `Faltam apenas ${remaining} sessões para concluir o plano de tratamento indicado (${realizedSessionsCount}/${client.max_sessoes} sessões realizadas).`,
        severity: 'warning',
      });
    } else if (remaining <= 0) {
      list.push({
        id: `treatment_finished_${clientId}_${client.max_sessoes}`,
        type: 'treatment_finished',
        title: 'Tratamento Concluído',
        message: `O plano de tratamento indicado de ${client.max_sessoes} sessões foi concluído (${realizedSessionsCount} sessões realizadas).`,
        severity: 'info',
      });
    }
  }

  return list;
};

interface ClientNotificationsTabProps {
  notifications: ClientNotification[];
  onGoToPayments: () => void;
  onGoToSessions: () => void;
}

const severityStyles: Record<
  ClientNotification['severity'],
  { card: string; tile: string; icon: React.ComponentType<{ className?: string }> }
> = {
  danger: {
    card: 'border-l-destructive bg-destructive/5',
    tile: 'bg-destructive/10 text-destructive',
    icon: AlertTriangle,
  },
  warning: {
    card: 'border-l-amber-500 bg-amber-500/5',
    tile: 'bg-amber-500/10 text-amber-600 dark:text-amber-400',
    icon: AlertCircle,
  },
  info: {
    card: 'border-l-primary bg-primary/5',
    tile: 'bg-primary/10 text-primary',
    icon: CheckCircle2,
  },
};

const ClientNotificationsTab: React.FC<ClientNotificationsTabProps> = ({
  notifications,
  onGoToPayments,
  onGoToSessions,
}) => {
  if (notifications.length === 0) {
    return (
      <Card className="p-4 sm:p-6 shadow-sm">
        <EmptyState
          icon={<BellOff className="h-10 w-10" />}
          title="Sem Notificações"
          description="O cliente está com o plano de tratamento e packs regularizados."
        />
      </Card>
    );
  }

  return (
    <div className="space-y-4 min-w-0">
      {notifications.map(notif => {
        const styles = severityStyles[notif.severity];
        const Icon = styles.icon;

        return (
          <Card
            key={notif.id}
            className={cn('p-4 sm:p-5 border-l-4 shadow-sm hover:shadow-md transition-shadow min-w-0', styles.card)}
          >
            <div className="flex gap-3 min-w-0">
              <div
                className={cn(
                  'h-10 w-10 rounded-lg flex items-center justify-center shrink-0',
                  styles.tile
                )}
              >
                <Icon className="h-5 w-5" />
              </div>
              <div className="flex-1 min-w-0">
                <h4 className="font-semibold text-base text-foreground">{notif.title}</h4>
                <p className="text-sm mt-1 text-muted-foreground">{notif.message}</p>

                <div className="mt-3 flex flex-wrap gap-2">
                  {notif.type.startsWith('pack') && (
                    <Button size="sm" variant="outline" onClick={onGoToPayments}>
                      <CreditCard className="h-3.5 w-3.5 mr-1.5" />
                      Ir para Pagamentos
                    </Button>
                  )}
                  {notif.type.startsWith('treatment') && (
                    <Button size="sm" variant="outline" onClick={onGoToSessions}>
                      <Calendar className="h-3.5 w-3.5 mr-1.5" />
                      Ir para Sessões
                    </Button>
                  )}
                </div>
              </div>
            </div>
          </Card>
        );
      })}
    </div>
  );
};

export default ClientNotificationsTab;
