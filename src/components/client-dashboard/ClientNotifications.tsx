import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Bell,
  CheckCircle,
  AlertCircle,
  AlertTriangle,
  Info,
  Calendar,
  CalendarClock,
  CreditCard,
  MessageSquare,
  Package,
  PackageX,
  CheckCircle2,
  Loader2,
  RotateCcw
} from 'lucide-react';
import { useClientNotifications } from '@/hooks/useClientAuth';
import { toast } from 'sonner';
import { format, parseISO, formatDistanceToNow, formatDistance } from 'date-fns';
import { pt } from 'date-fns/locale';
import { EmptyState } from '@/components/shared/EmptyState';
import { TableSkeleton } from '@/components/shared/SkeletonCard';

type Severity = 'danger' | 'warning' | 'success' | 'info';

const severityStyles: Record<Severity, { container: string; border: string; badge: string; icon: string }> = {
  danger: {
    container: 'bg-red-50/60 dark:bg-red-950/20',
    border: 'border-l-4 border-l-red-500',
    badge: 'bg-red-100 text-red-700 border-0 hover:bg-red-100 dark:bg-red-950/40 dark:text-red-300',
    icon: 'text-red-600',
  },
  warning: {
    container: 'bg-amber-50/60 dark:bg-amber-950/20',
    border: 'border-l-4 border-l-amber-500',
    badge: 'bg-amber-100 text-amber-700 border-0 hover:bg-amber-100 dark:bg-amber-950/40 dark:text-amber-300',
    icon: 'text-amber-600',
  },
  success: {
    container: 'bg-emerald-50/60 dark:bg-emerald-950/20',
    border: 'border-l-4 border-l-emerald-500',
    badge: 'bg-emerald-100 text-emerald-700 border-0 hover:bg-emerald-100 dark:bg-emerald-950/40 dark:text-emerald-300',
    icon: 'text-emerald-600',
  },
  info: {
    container: 'bg-blue-50/60 dark:bg-blue-950/20',
    border: 'border-l-4 border-l-blue-500',
    badge: 'bg-blue-100 text-blue-700 border-0 hover:bg-blue-100 dark:bg-blue-950/40 dark:text-blue-300',
    icon: 'text-blue-600',
  },
};

const getSeverity = (type: string): Severity => {
  switch (type) {
    case 'error': return 'danger';
    case 'warning': return 'warning';
    case 'success': return 'success';
    default: return 'info';
  }
};

const getNotificationTypeLabel = (type: string) => {
  switch (type) {
    case 'success': return 'Sucesso';
    case 'warning': return 'Aviso';
    case 'error': return 'Erro';
    case 'appointment': return 'Agendamento';
    case 'payment': return 'Pagamento';
    case 'message': return 'Mensagem';
    default: return 'Informação';
  }
};

const getNotificationIcon = (notification: { title: string; message: string; type: string }) => {
  const severity = getSeverity(notification.type);
  const iconClass = `h-5 w-5 ${severityStyles[severity].icon}`;
  const text = `${notification.title || ''} ${notification.message || ''}`.toLowerCase();

  if (text.includes('esgotado') || text.includes('esgotada')) {
    return <PackageX className={iconClass} />;
  }
  if (text.includes('pack') && (text.includes('terminar') || text.includes('termina') || text.includes('restam'))) {
    return <Package className={iconClass} />;
  }
  if (text.includes('tratamento') && (text.includes('terminado') || text.includes('conclu'))) {
    return <CheckCircle2 className={iconClass} />;
  }
  if (text.includes('tratamento')) {
    return <CalendarClock className={iconClass} />;
  }

  switch (notification.type) {
    case 'success': return <CheckCircle2 className={iconClass} />;
    case 'warning': return <AlertTriangle className={iconClass} />;
    case 'error': return <AlertCircle className={iconClass} />;
    case 'appointment': return <Calendar className={iconClass} />;
    case 'payment': return <CreditCard className={iconClass} />;
    case 'message': return <MessageSquare className={iconClass} />;
    default: return <Info className={iconClass} />;
  }
};

const ClientNotifications: React.FC = () => {
  const { notifications, loading, error, refetch, markAsRead, unreadCount } = useClientNotifications();
  const [markingId, setMarkingId] = useState<number | null>(null);

  const handleMarkAsRead = async (notificationId: number) => {
    try {
      setMarkingId(notificationId);
      await markAsRead(notificationId);
      toast.success('Aviso marcado como lido');
    } catch {
      toast.error('Erro ao marcar o aviso como lido');
    } finally {
      setMarkingId(null);
    }
  };

  const getRelativeDate = (dateStr: string) => {
    try {
      return formatDistanceToNow(parseISO(dateStr), { addSuffix: true, locale: pt });
    } catch {
      return '—';
    }
  };

  const getAbsoluteDate = (dateStr: string) => {
    try {
      return format(parseISO(dateStr), "d 'de' MMMM 'às' HH:mm", { locale: pt });
    } catch {
      return '—';
    }
  };

  const getExpiryLabel = (dateStr: string) => {
    try {
      return `Expira em ${formatDistance(parseISO(dateStr), new Date(), { locale: pt })}`;
    } catch {
      return null;
    }
  };

  if (loading) {
    return (
      <div className="space-y-6 min-w-0">
        <TableSkeleton rows={4} />
      </div>
    );
  }

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription className="flex items-center justify-between gap-3 flex-wrap">
          <span>{error}</span>
          <Button size="sm" variant="outline" onClick={() => refetch()} className="h-8">
            <RotateCcw className="h-3.5 w-3.5 mr-1" />
            Tentar novamente
          </Button>
        </AlertDescription>
      </Alert>
    );
  }

  const unreadNotifications = notifications.filter(n => !n.is_read);
  const readNotifications = notifications.filter(n => n.is_read);

  if (notifications.length === 0) {
    return (
      <div className="min-w-0">
        <EmptyState
          icon={<Bell className="h-10 w-10" />}
          title="Sem avisos"
          description="Os avisos da equipa sobre packs, tratamentos e agendamentos aparecem aqui."
        />
      </div>
    );
  }

  return (
    <div className="space-y-6 min-w-0">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
              <Bell className="h-4 w-4 text-primary" />
            </div>
            Centro de Avisos
          </CardTitle>
          <CardDescription>
            Faça a gestão dos seus avisos e mantenha-se atualizado
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between gap-3 p-4 bg-primary/5 rounded-lg border border-primary/20">
            <div className="flex items-center gap-3 min-w-0">
              <Bell className="h-6 w-6 text-primary flex-shrink-0" />
              <div className="min-w-0">
                <h3 className="font-semibold text-foreground">
                  {unreadCount > 0
                    ? `${unreadCount} aviso${unreadCount > 1 ? 's' : ''} não lido${unreadCount > 1 ? 's' : ''}`
                    : 'Todos os avisos foram lidos'}
                </h3>
                <p className="text-sm text-muted-foreground">
                  {notifications.length} aviso{notifications.length !== 1 ? 's' : ''} no total
                </p>
              </div>
            </div>
            {unreadCount > 0 && (
              <Badge className="bg-destructive text-destructive-foreground border-0">
                {unreadCount}
              </Badge>
            )}
          </div>
        </CardContent>
      </Card>

      {unreadNotifications.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-primary" />
              Avisos Não Lidos
            </CardTitle>
            <CardDescription>
              Avisos que requerem a sua atenção
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {unreadNotifications.map((notification) => {
                const severity = getSeverity(notification.type);
                const styles = severityStyles[severity];
                const expiryLabel = notification.expires_at ? getExpiryLabel(notification.expires_at) : null;
                const isMarking = markingId === notification.id;
                return (
                  <div
                    key={notification.id}
                    className={`p-4 rounded-lg border border-border ${styles.container} ${styles.border}`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-start gap-3 flex-1 min-w-0">
                        {getNotificationIcon(notification)}
                        <div className="flex-1 min-w-0">
                          <div className="flex flex-wrap items-center gap-2 mb-1">
                            <h3 className="font-semibold text-foreground">{notification.title}</h3>
                            <Badge className={styles.badge}>
                              {getNotificationTypeLabel(notification.type)}
                            </Badge>
                          </div>
                          <p className="text-sm text-foreground/80 mb-2">
                            {notification.message}
                          </p>
                          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
                            <Badge variant="outline" className="font-normal">
                              {getRelativeDate(notification.created_at)}
                            </Badge>
                            <span>{getAbsoluteDate(notification.created_at)}</span>
                            {expiryLabel && <span>{expiryLabel}</span>}
                          </div>
                        </div>
                      </div>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleMarkAsRead(notification.id)}
                        disabled={isMarking}
                        className="flex-shrink-0"
                      >
                        {isMarking ? (
                          <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                        ) : (
                          <CheckCircle className="h-4 w-4 mr-1" />
                        )}
                        <span className="hidden sm:inline">Marcar como lida</span>
                        <span className="sm:hidden">Lida</span>
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CheckCircle2 className="h-5 w-5 text-emerald-600" />
            Avisos Lidos
          </CardTitle>
          <CardDescription>
            Histórico de avisos já visualizados
          </CardDescription>
        </CardHeader>
        <CardContent>
          {readNotifications.length === 0 ? (
            <EmptyState
              icon={<CheckCircle2 className="h-10 w-10" />}
              title="Nenhum aviso lido"
              description="Os avisos marcados como lidos aparecerão aqui."
              className="py-8"
            />
          ) : (
            <div className="space-y-3">
              {readNotifications.map((notification) => {
                const severity = getSeverity(notification.type);
                const styles = severityStyles[severity];
                const expiryLabel = notification.expires_at ? getExpiryLabel(notification.expires_at) : null;
                return (
                  <div
                    key={notification.id}
                    className="p-4 border border-border rounded-lg bg-muted/50"
                  >
                    <div className="flex items-start gap-3">
                      {getNotificationIcon(notification)}
                      <div className="flex-1 min-w-0">
                        <div className="flex flex-wrap items-center gap-2 mb-1">
                          <h3 className="font-medium text-foreground/80">
                            {notification.title}
                          </h3>
                          <Badge variant="outline" className={styles.badge}>
                            {getNotificationTypeLabel(notification.type)}
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground mb-2">
                          {notification.message}
                        </p>
                        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
                          <Badge variant="outline" className="font-normal">
                            {getRelativeDate(notification.created_at)}
                          </Badge>
                          <span>{getAbsoluteDate(notification.created_at)}</span>
                          {expiryLabel && <span>{expiryLabel}</span>}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Info className="h-5 w-5 text-primary" />
            Sobre os Avisos
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3 text-sm">
            <div className="flex items-start gap-2">
              <Bell className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
              <p>Recebe avisos sobre agendamentos, pagamentos e mensagens importantes</p>
            </div>
            <div className="flex items-start gap-2">
              <Calendar className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
              <p>Os lembretes de agendamento são enviados 24 horas antes da sessão</p>
            </div>
            <div className="flex items-start gap-2">
              <CreditCard className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
              <p>As confirmações de pagamento são enviadas automaticamente</p>
            </div>
            <div className="flex items-start gap-2">
              <MessageSquare className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
              <p>Avisos de novas mensagens da equipa</p>
            </div>
            <div className="flex items-start gap-2">
              <CheckCircle2 className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
              <p>Marque os avisos como lidos para manter o centro organizado</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ClientNotifications;
