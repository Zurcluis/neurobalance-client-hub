import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { MessageCircle, Calendar, Trophy, User, Clock, CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { type Notification } from '@/hooks/useNotifications';

interface NotificationDetailProps {
  notification: Notification | null;
  isOpen: boolean;
  onClose: () => void;
  onMarkAsRead: (id: string) => void;
}

const getNotificationIcon = (type: Notification['type']) => {
  switch (type) {
    case 'chat':
      return <MessageCircle className="h-6 w-6 text-blue-500" />;
    case 'appointment':
      return <Calendar className="h-6 w-6 text-orange-500" />;
    case 'session_milestone':
      return <Trophy className="h-6 w-6 text-green-500" />;
    default:
      return <User className="h-6 w-6" />;
  }
};

const formatDateTime = (dateString: string) => {
  const date = new Date(dateString);
  return {
    date: date.toLocaleDateString('pt-BR'),
    time: date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
  };
};

export const NotificationDetail = ({ 
  notification, 
  isOpen, 
  onClose, 
  onMarkAsRead 
}: NotificationDetailProps) => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [feedback, setFeedback] = useState('');
  const navigate = useNavigate();
  const { toast } = useToast();

  if (!notification) return null;

  const { date, time } = formatDateTime(notification.created_at);

  const handleNavigateToClient = () => {
    if (notification.client_id) {
      navigate(`/clients/${notification.client_id}`);
      onClose();
    }
  };

  const handleNavigateToChat = () => {
    if (notification.client_id) {
      navigate(`/clients`);
      onClose();
      // Abrir chat após navegação
      setTimeout(() => {
        const chatButton = document.querySelector(`[data-client-id="${notification.client_id}"] .chat-button`);
        if (chatButton) {
          (chatButton as HTMLElement).click();
        }
      }, 500);
    }
  };

  const handleConfirmAppointment = async () => {
    if (!notification.metadata?.appointment_id) return;
    
    setIsProcessing(true);
    try {
      const { error } = await supabase
        .from('appointment_confirmations')
        .insert({
          id_agendamento: parseInt(notification.metadata.appointment_id),
          id_cliente: parseInt(notification.client_id!),
          status: 'confirmed',
          confirmed_at: new Date().toISOString()
        });

      if (error) throw error;

      toast({
        title: "Sucesso",
        description: "Marcação confirmada com sucesso",
      });

      onMarkAsRead(notification.id);
      onClose();
    } catch (error) {
      console.error('Erro ao confirmar marcação:', error);
      toast({
        title: "Erro",
        description: "Falha ao confirmar marcação",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleGiveFeedback = async () => {
    if (!notification.client_id || !notification.metadata?.session_count) return;
    
    setIsProcessing(true);
    try {
      // Marcar marco como processado
      await supabase.rpc('mark_milestone_feedback_given' as any, {
        p_client_id: parseInt(notification.client_id!),
        p_milestone_number: notification.metadata.session_count,
        p_feedback_text: feedback.trim() || null
      });

      // Se feedback foi fornecido, salvar como notificação do cliente
      if (feedback.trim()) {
        const { error: noteError } = await supabase
          .from('client_notifications')
          .insert({
            id_cliente: parseInt(notification.client_id!),
            title: `Feedback do marco de ${notification.metadata.session_count} sessões`,
            message: feedback,
            type: 'feedback',
            is_read: false,
            created_at: new Date().toISOString()
          });

        if (noteError) {
          console.error('Erro ao salvar feedback:', noteError);
        }
      }

      toast({
        title: "Sucesso",
        description: feedback.trim() 
          ? "Feedback registrado com sucesso" 
          : "Marco marcado como processado",
      });

      onMarkAsRead(notification.id);
      onClose();
      setFeedback('');
    } catch (error) {
      console.error('Erro ao processar feedback:', error);
      toast({
        title: "Erro",
        description: "Falha ao processar feedback",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const renderActions = () => {
    switch (notification.type) {
      case 'chat':
        return (
          <div className="flex gap-2">
            <Button onClick={handleNavigateToChat} className="flex-1">
              <MessageCircle className="h-4 w-4 mr-2" />
              Responder
            </Button>
            <Button 
              variant="outline" 
              onClick={handleNavigateToClient}
              className="flex-1"
            >
              <User className="h-4 w-4 mr-2" />
              Ver Cliente
            </Button>
          </div>
        );

      case 'appointment':
        return (
          <div className="flex gap-2">
            <Button 
              onClick={handleConfirmAppointment}
              disabled={isProcessing}
              className="flex-1"
            >
              <CheckCircle className="h-4 w-4 mr-2" />
              {isProcessing ? 'Confirmando...' : 'Confirmar'}
            </Button>
            <Button 
              variant="outline" 
              onClick={handleNavigateToClient}
              className="flex-1"
            >
              <User className="h-4 w-4 mr-2" />
              Ver Cliente
            </Button>
          </div>
        );

      case 'session_milestone':
        return (
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium text-foreground mb-2 block">
                Feedback para o cliente (opcional):
              </label>
              <Textarea
                value={feedback}
                onChange={(e) => setFeedback(e.target.value)}
                placeholder="Escreva um feedback sobre o progresso do cliente..."
                className="min-h-20"
              />
            </div>
            <div className="flex gap-2">
              <Button 
                onClick={handleGiveFeedback}
                disabled={isProcessing}
                className="flex-1"
              >
                <Trophy className="h-4 w-4 mr-2" />
                {isProcessing ? 'Processando...' : 'Marcar como Processado'}
              </Button>
              <Button 
                variant="outline" 
                onClick={handleNavigateToClient}
                className="flex-1"
              >
                <User className="h-4 w-4 mr-2" />
                Ver Cliente
              </Button>
            </div>
          </div>
        );

      default:
        return (
          <Button onClick={handleNavigateToClient} className="w-full">
            <User className="h-4 w-4 mr-2" />
            Ver Cliente
          </Button>
        );
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3">
            {getNotificationIcon(notification.type)}
            {notification.title}
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <User className="h-4 w-4 text-muted-foreground" />
                  <span className="font-medium">{notification.client_name || 'Cliente'}</span>
                </div>
                {!notification.read && (
                  <Badge variant="secondary" className="text-xs">
                    Não lida
                  </Badge>
                )}
              </div>
            </CardHeader>
            <CardContent className="pt-0">
              <p className="text-sm text-muted-foreground mb-3">
                {notification.message}
              </p>
              
              <Separator className="my-3" />
              
              <div className="flex items-center gap-4 text-xs text-muted-foreground">
                <div className="flex items-center gap-1">
                  <Calendar className="h-3 w-3" />
                  {date}
                </div>
                <div className="flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  {time}
                </div>
              </div>

              {notification.type === 'session_milestone' && notification.metadata?.session_count && (
                <div className="mt-3 p-3 bg-green-50 dark:bg-green-950/20 rounded-lg">
                  <div className="flex items-center gap-2 text-green-700 dark:text-green-300">
                    <Trophy className="h-4 w-4" />
                    <span className="text-sm font-medium">
                      Marco de {notification.metadata.session_count} sessões atingido!
                    </span>
                  </div>
                  <p className="text-xs text-green-600 dark:text-green-400 mt-1">
                    Este é um bom momento para dar feedback ao cliente sobre seu progresso.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          {renderActions()}
        </div>
      </DialogContent>
    </Dialog>
  );
}; 