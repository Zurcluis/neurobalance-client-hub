import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { logger } from '@/lib/logger';
import type {
  AvailabilityNotification,
  NewAvailabilityNotification,
  TipoNotificacao,
  StatusNotificacao,
  PrioridadeNotificacao,
} from '@/types/availability';

export const useAvailabilityNotifications = (clienteId?: number) => {
  const [notifications, setNotifications] = useState<AvailabilityNotification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // =====================================================
  // FETCH NOTIFICATIONS
  // =====================================================

  const fetchNotifications = useCallback(
    async (options?: {
      status?: StatusNotificacao;
      tipo?: TipoNotificacao;
      limit?: number;
    }) => {
      if (!clienteId) return;

      setIsLoading(true);
      setError(null);

      try {
        let query = supabase
          .from('availability_notifications')
          .select('*')
          .eq('cliente_id', clienteId);

        // Filtros opcionais
        if (options?.status) {
          query = query.eq('status', options.status);
        }

        if (options?.tipo) {
          query = query.eq('tipo', options.tipo);
        }

        // Ordenar por prioridade e data
        query = query.order('prioridade', { ascending: false });
        query = query.order('enviada_em', { ascending: false });

        // Limitar resultados
        if (options?.limit) {
          query = query.limit(options.limit);
        }

        const { data, error: queryError } = await query;

        if (queryError) throw queryError;

        setNotifications(data || []);

        // Calcular não lidas (status: enviada)
        const unread = (data || []).filter((n) => n.status === 'enviada').length;
        setUnreadCount(unread);

        logger.log(`Loaded ${data?.length || 0} notifications for client ${clienteId}`);
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Erro ao carregar notificações';
        setError(errorMessage);
        logger.error('Error fetching notifications:', err);
        toast.error(errorMessage);
      } finally {
        setIsLoading(false);
      }
    },
    [clienteId]
  );

  // =====================================================
  // CREATE NOTIFICATION
  // =====================================================

  const createNotification = useCallback(
    async (newNotification: Omit<NewAvailabilityNotification, 'cliente_id'>) => {
      if (!clienteId) {
        toast.error('Cliente não identificado');
        return null;
      }

      setIsLoading(true);
      setError(null);

      try {
        const { data, error: insertError } = await supabase
          .from('availability_notifications')
          .insert({
            ...newNotification,
            cliente_id: clienteId,
            enviada_em: new Date().toISOString(),
          })
          .select()
          .single();

        if (insertError) throw insertError;

        setNotifications((prev) => [data, ...prev]);
        setUnreadCount((prev) => prev + 1);

        // Não mostrar toast para cada notificação criada (pode ser automática)
        logger.log('Notification created:', data);
        return data;
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Erro ao criar notificação';
        setError(errorMessage);
        logger.error('Error creating notification:', err);
        toast.error(errorMessage);
        return null;
      } finally {
        setIsLoading(false);
      }
    },
    [clienteId]
  );

  // =====================================================
  // MARK AS READ
  // =====================================================

  const markAsRead = useCallback(async (notificationId: string) => {
    setIsLoading(true);
    setError(null);

    try {
      const { data, error: updateError } = await supabase
        .from('availability_notifications')
        .update({
          status: 'lida',
        })
        .eq('id', notificationId)
        .select()
        .single();

      if (updateError) throw updateError;

      setNotifications((prev) =>
        prev.map((notif) => (notif.id === notificationId ? data : notif))
      );

      setUnreadCount((prev) => Math.max(0, prev - 1));

      logger.log('Notification marked as read:', data);
      return data;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro ao marcar notificação como lida';
      setError(errorMessage);
      logger.error('Error marking notification as read:', err);
      toast.error(errorMessage);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);

  // =====================================================
  // MARK ALL AS READ
  // =====================================================

  const markAllAsRead = useCallback(async () => {
    if (!clienteId) return;

    setIsLoading(true);
    setError(null);

    try {
      const { error: updateError } = await supabase
        .from('availability_notifications')
        .update({ status: 'lida' })
        .eq('cliente_id', clienteId)
        .eq('status', 'enviada');

      if (updateError) throw updateError;

      // Atualizar localmente
      setNotifications((prev) =>
        prev.map((notif) =>
          notif.status === 'enviada' ? { ...notif, status: 'lida' as StatusNotificacao } : notif
        )
      );

      setUnreadCount(0);

      toast.success('Todas as notificações marcadas como lidas');
      logger.log('All notifications marked as read');
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro ao marcar todas como lidas';
      setError(errorMessage);
      logger.error('Error marking all as read:', err);
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  }, [clienteId]);

  // =====================================================
  // DELETE NOTIFICATION
  // =====================================================

  const deleteNotification = useCallback(async (notificationId: string) => {
    setIsLoading(true);
    setError(null);

    try {
      const notif = notifications.find((n) => n.id === notificationId);
      const wasUnread = notif?.status === 'enviada';

      const { error: deleteError } = await supabase
        .from('availability_notifications')
        .delete()
        .eq('id', notificationId);

      if (deleteError) throw deleteError;

      setNotifications((prev) => prev.filter((notif) => notif.id !== notificationId));

      if (wasUnread) {
        setUnreadCount((prev) => Math.max(0, prev - 1));
      }

      toast.success('Notificação removida');
      logger.log('Notification deleted:', notificationId);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro ao remover notificação';
      setError(errorMessage);
      logger.error('Error deleting notification:', err);
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  }, [notifications]);

  // =====================================================
  // LISTEN TO REAL-TIME UPDATES (OPCIONAL)
  // =====================================================

  useEffect(() => {
    if (!clienteId) return;

    // Buscar notificações iniciais
    fetchNotifications({ limit: 50 });

    // Setup real-time subscription
    const channel = supabase
      .channel(`availability_notifications_${clienteId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'availability_notifications',
          filter: `cliente_id=eq.${clienteId}`,
        },
        (payload) => {
          logger.log('Real-time notification update:', payload);

          if (payload.eventType === 'INSERT') {
            setNotifications((prev) => [payload.new as AvailabilityNotification, ...prev]);
            setUnreadCount((prev) => prev + 1);
            
            // Mostrar notificação no sistema
            const notif = payload.new as AvailabilityNotification;
            if (notif.prioridade === 'urgente' || notif.prioridade === 'alta') {
              toast(notif.titulo, {
                description: notif.mensagem,
                duration: 5000,
              });
            }
          } else if (payload.eventType === 'UPDATE') {
            setNotifications((prev) =>
              prev.map((n) =>
                n.id === payload.new.id ? (payload.new as AvailabilityNotification) : n
              )
            );
          } else if (payload.eventType === 'DELETE') {
            setNotifications((prev) => prev.filter((n) => n.id !== payload.old.id));
          }
        }
      )
      .subscribe();

    // Cleanup subscription
    return () => {
      supabase.removeChannel(channel);
    };
  }, [clienteId, fetchNotifications]);

  // =====================================================
  // RETURN
  // =====================================================

  return {
    notifications,
    unreadCount,
    isLoading,
    error,
    fetchNotifications,
    createNotification,
    markAsRead,
    markAllAsRead,
    deleteNotification,
  };
};

