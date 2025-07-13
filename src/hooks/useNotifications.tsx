import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface Notification {
  id: string;
  type: 'chat' | 'appointment' | 'session_milestone';
  title: string;
  message: string;
  client_id?: string;
  client_name?: string;
  created_at: string;
  read: boolean;
  metadata?: {
    appointment_id?: string;
    session_count?: number;
    message_id?: string;
    milestone_id?: string;
    sessions_completed?: number;
  };
}

export const useNotifications = () => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const fetchNotifications = async () => {
    try {
      setIsLoading(true);

      // Buscar mensagens não lidas
      const { data: chatMessages } = await supabase
        .from('client_messages')
        .select(`
          id,
          message,
          created_at,
          is_read,
          clientes (id, nome)
        `)
        .eq('is_read', false)
        .order('created_at', { ascending: false });

      // Buscar marcações pendentes de confirmação
      const { data: appointments } = await supabase
        .from('agendamentos')
        .select(`
          id,
          data,
          hora,
          clientes (id, nome),
          appointment_confirmations (status)
        `)
        .gte('data', new Date().toISOString().split('T')[0])
        .order('data', { ascending: true });

      // Buscar marcos de sessões não processados
      const { data: sessionMilestones } = await supabase.rpc('get_session_milestones' as any);

      const allNotifications: Notification[] = [];

      // Processar notificações de chat
      if (chatMessages) {
        chatMessages.forEach((msg: any) => {
          allNotifications.push({
            id: `chat_${msg.id}`,
            type: 'chat',
            title: 'Nova mensagem',
            message: `${msg.clientes?.nome || 'Cliente'}: ${msg.message.substring(0, 50)}...`,
            client_id: msg.clientes?.id?.toString(),
            client_name: msg.clientes?.nome,
            created_at: msg.created_at,
            read: msg.is_read,
            metadata: {
              message_id: msg.id?.toString()
            }
          });
        });
      }

      // Processar notificações de marcações
      if (appointments) {
        appointments.forEach((apt: any) => {
          const isConfirmed = apt.appointment_confirmations?.some((conf: any) => conf.status === 'confirmed');
          if (!isConfirmed) {
            allNotifications.push({
              id: `appointment_${apt.id}`,
              type: 'appointment',
              title: 'Confirmação pendente',
              message: `${apt.clientes?.nome || 'Cliente'} - ${new Date(apt.data).toLocaleDateString('pt-BR')} às ${apt.hora}`,
              client_id: apt.clientes?.id?.toString(),
              client_name: apt.clientes?.nome,
              created_at: apt.data,
              read: false,
              metadata: {
                appointment_id: apt.id?.toString()
              }
            });
          }
        });
      }

      // Processar notificações de marcos de sessões
      if (sessionMilestones && Array.isArray(sessionMilestones)) {
        sessionMilestones.forEach((milestone: any) => {
          allNotifications.push({
            id: `session_milestone_${milestone.id}`,
            type: 'session_milestone',
            title: 'Marco de sessões atingido',
            message: `${milestone.client_name} completou ${milestone.milestone_number} sessões! Este é um momento ideal para dar feedback sobre o progresso.`,
            client_id: milestone.client_id?.toString(),
            client_name: milestone.client_name,
            created_at: milestone.created_at,
            read: false,
            metadata: {
              milestone_id: milestone.id?.toString(),
              session_count: milestone.milestone_number,
              sessions_completed: milestone.sessions_count
            }
          });
        });
      }

      // Ordenar por data (mais recentes primeiro)
      allNotifications.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

      setNotifications(allNotifications);
      setUnreadCount(allNotifications.filter(n => !n.read).length);
    } catch (error) {
      console.error('Erro ao buscar notificações:', error);
      toast({
        title: "Erro",
        description: "Falha ao carregar notificações",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const markAsRead = async (notificationId: string) => {
    try {
      const notification = notifications.find(n => n.id === notificationId);
      if (!notification) return;

      if (notification.type === 'chat' && notification.metadata?.message_id) {
        await supabase
          .from('client_messages')
          .update({ is_read: true })
          .eq('id', parseInt(notification.metadata.message_id));
      }

      // Atualizar estado local
      setNotifications(prev => 
        prev.map(n => 
          n.id === notificationId ? { ...n, read: true } : n
        )
      );
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (error) {
      console.error('Erro ao marcar notificação como lida:', error);
    }
  };

  const markAllAsRead = async () => {
    try {
      // Marcar todas as mensagens como lidas
      const chatNotifications = notifications.filter(n => n.type === 'chat' && !n.read);
      if (chatNotifications.length > 0) {
        const messageIds = chatNotifications
          .map(n => n.metadata?.message_id)
          .filter(Boolean);
        
        if (messageIds.length > 0) {
          const numericIds = messageIds.map(id => parseInt(id as string)).filter(id => !isNaN(id));
          await supabase
            .from('client_messages')
            .update({ is_read: true })
            .in('id', numericIds);
        }
      }

      // Atualizar estado local
      setNotifications(prev => prev.map(n => ({ ...n, read: true })));
      setUnreadCount(0);
    } catch (error) {
      console.error('Erro ao marcar todas as notificações como lidas:', error);
    }
  };

  const deleteNotification = async (notificationId: string) => {
    setNotifications(prev => prev.filter(n => n.id !== notificationId));
    setUnreadCount(prev => {
      const notification = notifications.find(n => n.id === notificationId);
      return notification && !notification.read ? Math.max(0, prev - 1) : prev;
    });
  };

  useEffect(() => {
    fetchNotifications();

    // Configurar real-time para mensagens
    const chatSubscription = supabase
      .channel('notifications_chat')
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'client_messages' },
        () => fetchNotifications()
      )
      .subscribe();

    // Configurar real-time para marcações
    const appointmentSubscription = supabase
      .channel('notifications_appointments')
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'agendamentos' },
        () => fetchNotifications()
      )
      .subscribe();

    // Configurar real-time para confirmações de marcações
    const confirmationSubscription = supabase
      .channel('notifications_appointment_confirmations')
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'appointment_confirmations' },
        () => fetchNotifications()
      )
      .subscribe();

    // Configurar real-time para sessões ativas (marcos de sessões)
    const sessionsSubscription = supabase
      .channel('notifications_sessions')
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'sessoes_ativas' },
        () => fetchNotifications()
      )
      .subscribe();

    // Configurar real-time para marcos de sessões
    const milestonesSubscription = supabase
      .channel('notifications_milestones')
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'session_milestones' },
        () => fetchNotifications()
      )
      .subscribe();

    // Atualizar a cada 30 segundos
    const interval = setInterval(fetchNotifications, 30000);

    return () => {
      chatSubscription.unsubscribe();
      appointmentSubscription.unsubscribe();
      confirmationSubscription.unsubscribe();
      sessionsSubscription.unsubscribe();
      milestonesSubscription.unsubscribe();
      clearInterval(interval);
    };
  }, []);

  return {
    notifications,
    unreadCount,
    isLoading,
    fetchNotifications,
    markAsRead,
    markAllAsRead,
    deleteNotification
  };
}; 