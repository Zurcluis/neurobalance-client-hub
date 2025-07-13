import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Bell, 
  CheckCircle, 
  AlertCircle, 
  Info,
  Calendar,
  CreditCard,
  MessageSquare,
  Loader2,
  X
} from 'lucide-react';
import { useClientNotifications } from '@/hooks/useClientAuth';
import { toast } from 'sonner';
import { format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { getNotificationTypeColor } from '@/types/client-dashboard';

const ClientNotifications: React.FC = () => {
  const { notifications, loading, error, markAsRead, unreadCount } = useClientNotifications();

  const handleMarkAsRead = async (notificationId: number) => {
    try {
      await markAsRead(notificationId);
      toast.success('Notificação marcada como lida');
    } catch (error) {
      toast.error('Erro ao marcar notificação como lida');
    }
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'success': return <CheckCircle className="h-5 w-5 text-green-600" />;
      case 'warning': return <AlertCircle className="h-5 w-5 text-yellow-600" />;
      case 'error': return <AlertCircle className="h-5 w-5 text-red-600" />;
      case 'appointment': return <Calendar className="h-5 w-5 text-blue-600" />;
      case 'payment': return <CreditCard className="h-5 w-5 text-purple-600" />;
      case 'message': return <MessageSquare className="h-5 w-5 text-indigo-600" />;
      default: return <Info className="h-5 w-5 text-gray-600" />;
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

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin text-[#3f9094]" />
      </div>
    );
  }

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    );
  }

  const unreadNotifications = notifications.filter(n => !n.is_read);
  const readNotifications = notifications.filter(n => n.is_read);

  return (
    <div className="space-y-6">
      {/* Resumo das Notificações */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell className="h-5 w-5" />
            Centro de Notificações
          </CardTitle>
          <CardDescription>
            Gerencie suas notificações e mantenha-se atualizado
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between p-4 bg-blue-50 rounded-lg">
            <div className="flex items-center gap-3">
              <Bell className="h-6 w-6 text-blue-600" />
              <div>
                <h3 className="font-semibold text-blue-900">
                  {unreadCount > 0 ? `${unreadCount} notificação${unreadCount > 1 ? 'ões' : ''} não lida${unreadCount > 1 ? 's' : ''}` : 'Todas as notificações foram lidas'}
                </h3>
                <p className="text-sm text-blue-700">
                  {notifications.length} notificação{notifications.length !== 1 ? 'ões' : ''} no total
                </p>
              </div>
            </div>
            {unreadCount > 0 && (
              <Badge className="bg-red-500 text-white">
                {unreadCount}
              </Badge>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Notificações Não Lidas */}
      {unreadNotifications.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-red-600" />
              Notificações Não Lidas
            </CardTitle>
            <CardDescription>
              Notificações que requerem sua atenção
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {unreadNotifications.map((notification) => (
                <div
                  key={notification.id}
                  className="p-4 border-2 border-blue-200 bg-blue-50 rounded-lg"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-3 flex-1">
                      {getNotificationIcon(notification.type)}
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="font-semibold text-gray-900">
                            {notification.title}
                          </h3>
                          <Badge className={getNotificationTypeColor(notification.type)}>
                            {getNotificationTypeLabel(notification.type)}
                          </Badge>
                        </div>
                        <p className="text-sm text-gray-700 mb-2">
                          {notification.message}
                        </p>
                        <div className="flex items-center gap-4 text-xs text-gray-500">
                          <span>
                            {format(parseISO(notification.created_at), 'dd/MM/yyyy HH:mm', { locale: ptBR })}
                          </span>
                          {notification.expires_at && (
                            <span>
                              Expira em {format(parseISO(notification.expires_at), 'dd/MM/yyyy', { locale: ptBR })}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleMarkAsRead(notification.id)}
                      className="ml-2"
                    >
                      <CheckCircle className="h-4 w-4 mr-1" />
                      Marcar como lida
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Notificações Lidas */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CheckCircle className="h-5 w-5 text-green-600" />
            Notificações Lidas
          </CardTitle>
          <CardDescription>
            Histórico de notificações já visualizadas
          </CardDescription>
        </CardHeader>
        <CardContent>
          {readNotifications.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <CheckCircle className="h-12 w-12 mx-auto mb-4 text-gray-300" />
              <p>Nenhuma notificação lida ainda</p>
              <p className="text-sm">As notificações lidas aparecerão aqui</p>
            </div>
          ) : (
            <div className="space-y-3">
              {readNotifications.map((notification) => (
                <div
                  key={notification.id}
                  className="p-4 border rounded-lg bg-gray-50"
                >
                  <div className="flex items-start gap-3">
                    {getNotificationIcon(notification.type)}
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-medium text-gray-700">
                          {notification.title}
                        </h3>
                        <Badge variant="outline" className={getNotificationTypeColor(notification.type)}>
                          {getNotificationTypeLabel(notification.type)}
                        </Badge>
                      </div>
                      <p className="text-sm text-gray-600 mb-2">
                        {notification.message}
                      </p>
                      <div className="flex items-center gap-4 text-xs text-gray-500">
                        <span>
                          {format(parseISO(notification.created_at), 'dd/MM/yyyy HH:mm', { locale: ptBR })}
                        </span>
                        {notification.expires_at && (
                          <span>
                            Expira em {format(parseISO(notification.expires_at), 'dd/MM/yyyy', { locale: ptBR })}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Configurações de Notificação */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Info className="h-5 w-5" />
            Sobre as Notificações
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3 text-sm">
            <div className="flex items-start gap-2">
              <Bell className="h-4 w-4 text-blue-600 mt-0.5 flex-shrink-0" />
              <p>Recebe notificações sobre agendamentos, pagamentos e mensagens importantes</p>
            </div>
            <div className="flex items-start gap-2">
              <Calendar className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
              <p>Lembretes de agendamentos são enviados 24 horas antes da sessão</p>
            </div>
            <div className="flex items-start gap-2">
              <CreditCard className="h-4 w-4 text-purple-600 mt-0.5 flex-shrink-0" />
              <p>Confirmações de pagamento são enviadas automaticamente</p>
            </div>
            <div className="flex items-start gap-2">
              <MessageSquare className="h-4 w-4 text-indigo-600 mt-0.5 flex-shrink-0" />
              <p>Notificações de novas mensagens da equipa médica</p>
            </div>
            <div className="flex items-start gap-2">
              <CheckCircle className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
              <p>Marque as notificações como lidas para manter o centro organizado</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ClientNotifications; 