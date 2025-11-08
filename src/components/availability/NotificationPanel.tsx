import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Bell, BellOff, Check, CheckCheck, Trash2, Mail, MessageSquare, Smartphone, AlertCircle } from 'lucide-react';
import { useAvailabilityNotifications } from '@/hooks/useAvailabilityNotifications';
import { LoadingSpinner } from '@/components/shared/LoadingSpinner';
import { EmptyState } from '@/components/shared/EmptyState';
import { format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import type { TipoNotificacao, PrioridadeNotificacao } from '@/types/availability';

interface NotificationPanelProps {
  clienteId: number;
  maxHeight?: string;
  showActions?: boolean;
}

export const NotificationPanel: React.FC<NotificationPanelProps> = ({
  clienteId,
  maxHeight = '500px',
  showActions = true,
}) => {
  const {
    notifications,
    unreadCount,
    isLoading,
    markAsRead,
    markAllAsRead,
    deleteNotification,
  } = useAvailabilityNotifications(clienteId);

  // =====================================================
  // GET ICON BY TYPE
  // =====================================================

  const getIconByType = (tipo: TipoNotificacao) => {
    switch (tipo) {
      case 'email':
        return <Mail className="h-4 w-4" />;
      case 'sms':
        return <MessageSquare className="h-4 w-4" />;
      case 'push':
        return <Smartphone className="h-4 w-4" />;
      case 'in-app':
        return <Bell className="h-4 w-4" />;
      default:
        return <Bell className="h-4 w-4" />;
    }
  };

  // =====================================================
  // GET PRIORITY COLOR
  // =====================================================

  const getPriorityColor = (prioridade: PrioridadeNotificacao) => {
    switch (prioridade) {
      case 'urgente':
        return 'text-red-600 bg-red-50 border-red-200';
      case 'alta':
        return 'text-orange-600 bg-orange-50 border-orange-200';
      case 'media':
        return 'text-blue-600 bg-blue-50 border-blue-200';
      case 'baixa':
        return 'text-gray-600 bg-gray-50 border-gray-200';
      default:
        return 'text-blue-600 bg-blue-50 border-blue-200';
    }
  };

  // =====================================================
  // RENDER
  // =====================================================

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Bell className="h-5 w-5 text-[#3f9094]" />
            Notificações
            {unreadCount > 0 && (
              <Badge variant="destructive" className="ml-2">
                {unreadCount}
              </Badge>
            )}
          </CardTitle>
          {showActions && notifications.length > 0 && (
            <div className="flex items-center gap-2">
              {unreadCount > 0 && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={markAllAsRead}
                  disabled={isLoading}
                >
                  <CheckCheck className="h-4 w-4 mr-2" />
                  Marcar todas como lidas
                </Button>
              )}
            </div>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {isLoading && notifications.length === 0 ? (
          <LoadingSpinner />
        ) : notifications.length === 0 ? (
          <EmptyState
            icon={<BellOff className="h-12 w-12" />}
            title="Nenhuma Notificação"
            description="Você não tem notificações no momento. Novas sugestões e atualizações aparecerão aqui."
          />
        ) : (
          <ScrollArea className="pr-4" style={{ maxHeight }}>
            <div className="space-y-3">
              {notifications.map((notification) => {
                const isUnread = notification.status === 'enviada';

                return (
                  <Card
                    key={notification.id}
                    className={cn(
                      'relative transition-all',
                      isUnread && 'border-l-4 border-l-[#3f9094] bg-blue-50/30 dark:bg-blue-950/30'
                    )}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-start gap-3">
                        {/* Icon */}
                        <div
                          className={cn(
                            'p-2 rounded-lg',
                            getPriorityColor(notification.prioridade)
                          )}
                        >
                          {getIconByType(notification.tipo)}
                        </div>

                        {/* Content */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-2 mb-1">
                            <h4 className="font-semibold text-sm">{notification.titulo}</h4>
                            {isUnread && (
                              <Badge variant="default" className="text-xs">
                                Nova
                              </Badge>
                            )}
                          </div>

                          <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                            {notification.mensagem}
                          </p>

                          <div className="flex items-center justify-between">
                            <p className="text-xs text-gray-500">
                              {format(parseISO(notification.enviada_em!), "dd/MM/yyyy 'às' HH:mm", {
                                locale: ptBR,
                              })}
                            </p>

                            <div className="flex items-center gap-2">
                              {isUnread && (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => markAsRead(notification.id!)}
                                  disabled={isLoading}
                                  className="h-7 px-2 text-xs"
                                >
                                  <Check className="h-3 w-3 mr-1" />
                                  Marcar como lida
                                </Button>
                              )}
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => deleteNotification(notification.id!)}
                                disabled={isLoading}
                                className="h-7 px-2 text-xs text-red-600 hover:text-red-700 hover:bg-red-50"
                              >
                                <Trash2 className="h-3 w-3" />
                              </Button>
                            </div>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </ScrollArea>
        )}
      </CardContent>
    </Card>
  );
};

