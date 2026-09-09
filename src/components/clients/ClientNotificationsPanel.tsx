import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { AlertCircle, AlertTriangle, BellOff, CheckCircle, Trash2, Users } from 'lucide-react';
import { toast } from 'sonner';
import { isAfter, parseISO } from 'date-fns';
import type { Database } from '@/integrations/supabase/types';
import type { Appointment } from '@/hooks/useAppointments';
import type { Payment } from '@/hooks/usePayments';
import { useAdminContext } from '@/contexts/AdminContext';

type Client = Database['public']['Tables']['clientes']['Row'];

interface GlobalNotification {
  id: string;
  clientId: number;
  clientName: string;
  type: 'pack_exhausted' | 'pack_ending' | 'treatment_ending' | 'treatment_finished';
  title: string;
  message: string;
  severity: 'danger' | 'warning' | 'info';
}

interface ClientNotificationsPanelProps {
  clients: Client[];
  appointments: Appointment[];
  payments: Payment[];
}

const ClientNotificationsPanel = ({ clients, appointments, payments }: ClientNotificationsPanelProps) => {
  const navigate = useNavigate();
  const { isAdminContext } = useAdminContext();

  const allNotifications = useMemo(() => {
    const list: GlobalNotification[] = [];
    if (!clients || !payments || !appointments) return list;

    clients.forEach(client => {
      const now = new Date();
      const countRealized = appointments.filter(app =>
        app.id_cliente === client.id &&
        (app.estado === 'realizado' || (app.estado !== 'cancelado' && isAfter(now, parseISO(app.data))))
      ).length;

      const clientPayments = payments.filter(p => p.id_cliente === client.id);
      const monthlyPayments = clientPayments.filter(p =>
        p.descricao?.toLowerCase().includes('pack') ||
        p.descricao?.toLowerCase().includes('mensal')
      );

      if (monthlyPayments.length > 0) {
        const totalPackSessions = monthlyPayments.length * 8;

        if (countRealized >= totalPackSessions) {
          list.push({
            id: `pack_exhausted_${client.id}_${totalPackSessions}`,
            clientId: client.id,
            clientName: client.nome,
            type: 'pack_exhausted',
            title: 'Pack Esgotado',
            message: `${client.nome} já realizou ${countRealized} sessões (Limite do pack: ${totalPackSessions}). A próxima sessão será fora do pack.`,
            severity: 'danger'
          });
        } else if (totalPackSessions - countRealized <= 2) {
          list.push({
            id: `pack_ending_${client.id}_${totalPackSessions}`,
            clientId: client.id,
            clientName: client.nome,
            type: 'pack_ending',
            title: 'Pack a Terminar',
            message: `${client.nome} tem apenas ${totalPackSessions - countRealized} sessões restantes no pack (realizou ${countRealized} de ${totalPackSessions}).`,
            severity: 'warning'
          });
        }
      }

      if (client.max_sessoes && client.max_sessoes > 0) {
        const remaining = client.max_sessoes - countRealized;
        if (remaining > 0 && remaining <= 5) {
          list.push({
            id: `treatment_ending_${client.id}_${client.max_sessoes}`,
            clientId: client.id,
            clientName: client.nome,
            type: 'treatment_ending',
            title: 'Tratamento a Terminar',
            message: `${client.nome} tem apenas ${remaining} sessões restantes no plano de tratamento (${countRealized}/${client.max_sessoes} realizadas).`,
            severity: 'warning'
          });
        } else if (remaining <= 0) {
          list.push({
            id: `treatment_finished_${client.id}_${client.max_sessoes}`,
            clientId: client.id,
            clientName: client.nome,
            type: 'treatment_finished',
            title: 'Tratamento Concluído',
            message: `O plano de tratamento indicado de ${client.max_sessoes} sessões para ${client.nome} foi concluído (${countRealized} sessões realizadas).`,
            severity: 'info'
          });
        }
      }
    });

    return list;
  }, [clients, payments, appointments]);

  const [dismissedNotificationIds, setDismissedNotificationIds] = useState<Set<string>>(() => {
    try {
      const saved = localStorage.getItem('dismissed_notifications');
      return saved ? new Set(JSON.parse(saved)) : new Set();
    } catch (e) {
      return new Set();
    }
  });

  const [selectedNotificationIds, setSelectedNotificationIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    try {
      localStorage.setItem('dismissed_notifications', JSON.stringify(Array.from(dismissedNotificationIds)));
    } catch (e) {
      console.error(e);
    }
  }, [dismissedNotificationIds]);

  const visibleNotifications = useMemo(() => {
    return allNotifications.filter(n => !dismissedNotificationIds.has(n.id));
  }, [allNotifications, dismissedNotificationIds]);

  const handleDismissNotification = (id: string) => {
    setDismissedNotificationIds(prev => new Set([...prev, id]));
    setSelectedNotificationIds(prev => {
      const next = new Set(prev);
      next.delete(id);
      return next;
    });
    toast.success('Notificação eliminada');
  };

  const handleToggleSelectNotification = (id: string) => {
    setSelectedNotificationIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const handleToggleSelectAllNotifications = () => {
    if (selectedNotificationIds.size === visibleNotifications.length && visibleNotifications.length > 0) {
      setSelectedNotificationIds(new Set());
    } else {
      setSelectedNotificationIds(new Set(visibleNotifications.map(n => n.id)));
    }
  };

  const handleDeleteSelectedNotifications = () => {
    if (selectedNotificationIds.size === 0) return;
    const count = selectedNotificationIds.size;
    setDismissedNotificationIds(prev => new Set([...prev, ...Array.from(selectedNotificationIds)]));
    setSelectedNotificationIds(new Set());
    toast.success(`${count} notificação(ões) eliminada(s) com sucesso`);
  };

  const handleDeleteAllNotifications = () => {
    if (visibleNotifications.length === 0) return;
    const allIds = visibleNotifications.map(n => n.id);
    setDismissedNotificationIds(prev => new Set([...prev, ...allIds]));
    setSelectedNotificationIds(new Set());
    toast.success('Todas as notificações foram eliminadas');
  };

  const handleRestoreDismissedNotifications = () => {
    setDismissedNotificationIds(new Set());
    setSelectedNotificationIds(new Set());
    try {
      localStorage.removeItem('dismissed_notifications');
    } catch (e) {
      console.error(e);
    }
    toast.success('Notificações restauradas');
  };

  return (
    <Card>
      <CardHeader className="pb-4">
        <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
          <div>
            <CardTitle className="text-base font-semibold">Painel Geral de Notificações</CardTitle>
            <CardDescription className="mt-1">
              Alertas consolidados sobre todos os clientes (packs e plano de tratamento)
            </CardDescription>
          </div>

          {visibleNotifications.length > 0 && (
            <div className="flex flex-wrap items-center gap-2 md:w-auto md:justify-end">
              {selectedNotificationIds.size > 0 && (
                <Button size="sm" variant="destructive" className="gap-1.5" onClick={handleDeleteSelectedNotifications}>
                  <Trash2 className="h-4 w-4" />
                  Eliminar Selecionadas ({selectedNotificationIds.size})
                </Button>
              )}

              <Button
                size="sm"
                variant="outline"
                className="gap-1.5 border-red-200 text-red-600 hover:bg-red-50 hover:text-red-700 dark:border-red-900/50 dark:hover:bg-red-950/30"
                onClick={handleDeleteAllNotifications}
              >
                <Trash2 className="h-4 w-4" />
                Apagar Todas
              </Button>
            </div>
          )}
        </div>

        {visibleNotifications.length > 0 && (
          <div className="mt-4 flex items-center justify-between border-t border-border pt-4">
            <div className="flex items-center space-x-2">
              <Checkbox
                id="select-all-notifs"
                checked={visibleNotifications.length > 0 && selectedNotificationIds.size === visibleNotifications.length}
                onCheckedChange={handleToggleSelectAllNotifications}
              />
              <label htmlFor="select-all-notifs" className="cursor-pointer select-none text-sm font-medium text-foreground">
                Selecionar Todas ({visibleNotifications.length})
              </label>
              {selectedNotificationIds.size > 0 && (
                <Badge variant="secondary" className="bg-primary/10 text-primary">
                  {selectedNotificationIds.size} selecionada(s)
                </Badge>
              )}
            </div>

            {dismissedNotificationIds.size > 0 && (
              <Button variant="ghost" size="sm" className="text-xs text-muted-foreground hover:text-primary" onClick={handleRestoreDismissedNotifications}>
                Restaurar Eliminadas ({dismissedNotificationIds.size})
              </Button>
            )}
          </div>
        )}
      </CardHeader>
      <CardContent>
        {visibleNotifications.length === 0 ? (
          <div className="py-12 text-center">
            <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
              <BellOff className="h-8 w-8" />
            </div>
            <h3 className="mb-1 text-xl font-medium">Sem notificações ativas</h3>
            <p className="mx-auto mb-4 max-w-sm text-sm text-muted-foreground">
              Todas as notificações foram resolvidas ou eliminadas.
            </p>
            {dismissedNotificationIds.size > 0 && (
              <Button variant="outline" size="sm" onClick={handleRestoreDismissedNotifications}>
                Restaurar Notificações Eliminadas ({dismissedNotificationIds.size})
              </Button>
            )}
          </div>
        ) : (
          <div className="space-y-3">
            {visibleNotifications.map(notif => {
              const isSelected = selectedNotificationIds.has(notif.id);
              return (
                <Card key={notif.id} className={`border-l-4 p-4 shadow-xs transition-all hover:shadow-md ${
                  isSelected ? 'ring-2 ring-ring bg-primary/5' : ''
                } ${
                  notif.severity === 'danger' ? 'bg-red-500/5 border-l-red-500' :
                  notif.severity === 'warning' ? 'bg-amber-500/5 border-l-amber-500' :
                  'bg-blue-500/5 border-l-blue-500'
                }`}>
                  <div className="flex flex-wrap items-start justify-between gap-4 sm:flex-nowrap">
                    <div className="flex items-start gap-3">
                      <Checkbox
                        checked={isSelected}
                        onCheckedChange={() => handleToggleSelectNotification(notif.id)}
                        className="mt-1"
                      />

                      <div className="mt-0.5 shrink-0">
                        {notif.severity === 'danger' && <AlertTriangle className="h-5 w-5 text-red-500" />}
                        {notif.severity === 'warning' && <AlertCircle className="h-5 w-5 text-amber-500" />}
                        {notif.severity === 'info' && <CheckCircle className="h-5 w-5 text-blue-500" />}
                      </div>

                      <div>
                        <div className="flex flex-wrap items-center gap-2">
                          <h4 className="text-base font-semibold text-foreground">{notif.title}</h4>
                          <Badge variant="outline" className="text-xs font-medium">
                            {notif.clientName}
                          </Badge>
                        </div>
                        <p className="mt-1.5 text-sm text-muted-foreground">{notif.message}</p>
                      </div>
                    </div>

                    <div className="mt-2 flex w-full shrink-0 items-center justify-end gap-2 sm:mt-0 sm:w-auto">
                      <Button
                        size="sm"
                        variant="outline"
                        className="shrink-0 text-xs"
                        onClick={() => navigate(isAdminContext ? `/admin/clients/${notif.clientId}` : `/clients/${notif.clientId}`)}
                      >
                        <Users className="mr-1.5 h-3.5 w-3.5" />
                        Ver Cliente
                      </Button>

                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-8 w-8 rounded-full p-0 text-muted-foreground hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-950/30"
                        title="Eliminar notificação"
                        onClick={() => handleDismissNotification(notif.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default ClientNotificationsPanel;
