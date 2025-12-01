import { useState, useEffect, useCallback, createContext, useContext } from 'react';
import { useSupabaseClient } from '@/hooks/useSupabaseClient';
import { toast } from 'sonner';
import { ClientSession, ClientAuthRequest, ClientAuthResponse } from '@/types/client-dashboard';
import { logger } from '@/lib/logger';

interface ClientAuthContextType {
  session: ClientSession | null;
  loading: boolean;
  error: string | null;
  login: (request: ClientAuthRequest) => Promise<ClientAuthResponse>;
  logout: () => void;
  refreshSession: () => Promise<boolean>;
  isAuthenticated: boolean;
}

const ClientAuthContext = createContext<ClientAuthContextType | undefined>(undefined);

export const useClientAuth = () => {
  const context = useContext(ClientAuthContext);
  if (!context) {
    throw new Error('useClientAuth deve ser usado dentro de um ClientAuthProvider');
  }
  return context;
};

export const ClientAuthProvider = ({ children }: { children: React.ReactNode }) => {
  const supabase = useSupabaseClient();
  const [session, setSession] = useState<ClientSession | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Verificar se há uma sessão salva no localStorage
  useEffect(() => {
    const savedSession = localStorage.getItem('client_session');
    if (savedSession) {
      try {
        const parsedSession: ClientSession = JSON.parse(savedSession);
        
        // Verificar se a sessão não expirou
        if (new Date(parsedSession.expiresAt) > new Date()) {
          setSession(parsedSession);
          // Validar token no servidor
          validateToken(parsedSession.token);
        } else {
          // Sessão expirada, remover do localStorage
          localStorage.removeItem('client_session');
        }
      } catch (error) {
        logger.error('Erro ao carregar sessão do cliente:', error);
        localStorage.removeItem('client_session');
      }
    }
    setLoading(false);
  }, [supabase]);

  // Validar token no servidor
  const validateToken = useCallback(async (token: string) => {
    try {
      const { data, error } = await supabase.rpc<any, any>('validate_client_token', {
        token_value: token
      });

      if (error) {
        throw error;
      }

      if (data && Array.isArray(data) && data.length > 0) {
        const clientData = data[0];
        if (clientData.is_valid) {
          // Token válido, atualizar sessão
          const updatedSession: ClientSession = {
            token,
            clientId: clientData.client_id,
            clientName: clientData.client_name,
            clientEmail: clientData.client_email,
            expiresAt: session?.expiresAt || new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
            isValid: true
          };
          setSession(updatedSession);
          localStorage.setItem('client_session', JSON.stringify(updatedSession));
        } else {
          setSession(null);
          localStorage.removeItem('client_session');
          setError('Sessão expirada. Por favor, faça login novamente.');
        }
      } else {
        setSession(null);
        localStorage.removeItem('client_session');
        setError('Sessão inválida.');
      }
    } catch (error) {
      setSession(null);
      localStorage.removeItem('client_session');
      setError('Erro ao validar sessão.');
    }
  }, [session]);

  // Função de login
  const login = useCallback(async (request: ClientAuthRequest): Promise<ClientAuthResponse> => {
    try {
      setLoading(true);
      setError(null);

      // Buscar cliente por email
      const { data: clientData, error: clientError } = await supabase
        .from('clientes')
        .select('id, nome, email')
        .eq('email', request.email)
        .single();

      if (clientError || !clientData) {
        return {
          success: false,
          error: 'Cliente não encontrado. Verifique o email fornecido.'
        };
      }

      // Criar token de acesso
      const { data: tokenData, error: tokenError } = await supabase.rpc<any, any>('create_client_access_token', {
        client_id: clientData.id,
        expires_hours: 24
      });

      if (tokenError || !tokenData) {
        return {
          success: false,
          error: 'Erro ao criar token de acesso. Tente novamente.'
        };
      }

      if (!clientData.email) {
        return {
          success: false,
          error: 'Email do cliente não encontrado. Entre em contato com o suporte.'
        };
      }

      const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();
      const newSession: ClientSession = {
        token: tokenData,
        clientId: clientData.id,
        clientName: clientData.nome,
        clientEmail: clientData.email,
        expiresAt,
        isValid: true
      };

      setSession(newSession);
      localStorage.setItem('client_session', JSON.stringify(newSession));

      // Enviar notificação de login
      await supabase.rpc<any, any>('send_client_notification', {
        client_id: clientData.id,
        notification_title: 'Acesso ao Dashboard',
        notification_message: `Você acessou seu dashboard em ${new Date().toLocaleString('pt-PT')}`,
        notification_type: 'info',
        expires_hours: 168 // 7 dias
      });

      return {
        success: true,
        token: tokenData,
        client: {
          id: clientData.id,
          nome: clientData.nome,
          email: clientData.email
        },
        expiresAt
      };

    } catch (error: any) {
      return {
        success: false,
        error: error.message || 'Erro interno do servidor'
      };
    } finally {
      setLoading(false);
    }
  }, [supabase]);

  // Função de logout
  const logout = useCallback(() => {
    setSession(null);
    localStorage.removeItem('client_session');
    setError(null);
    toast.success('Logout realizado com sucesso');
  }, [supabase]);

  // Função para atualizar sessão
  const refreshSession = useCallback(async (): Promise<boolean> => {
    if (!session) return false;

    try {
      await validateToken(session.token);
      return true;
    } catch (error) {
      logger.error('Erro ao atualizar sessão:', error);
      return false;
    }
  }, [session, validateToken]);

  const isAuthenticated = session !== null && session.isValid;

  return (
    <ClientAuthContext.Provider
      value={{
        session,
        loading,
        error,
        login,
        logout,
        refreshSession,
        isAuthenticated
      }}
    >
      {children}
    </ClientAuthContext.Provider>
  );
};

// Hook para usar dados do cliente autenticado
export const useClientData = () => {
  const { session } = useClientAuth();
  const supabase = useSupabaseClient();
  const [clientData, setClientData] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchClientData = useCallback(async () => {
    if (!session) return;

    try {
      setLoading(true);
      setError(null);

      // Buscar dados do cliente
      const { data, error: fetchError } = await supabase
        .from('clientes')
        .select('*')
        .eq('id', session.clientId)
        .single();

      if (fetchError) {
        throw fetchError;
      }

      // Calcular dinamicamente o número de sessões realizadas
      const { data: realizados, error: agendamentosError } = await supabase
        .from('agendamentos')
        .select('id')
        .eq('id_cliente', session.clientId)
        .eq('estado', 'realizado');

      if (agendamentosError) {
        logger.error('Erro ao buscar agendamentos realizados:', agendamentosError);
      }

      // Buscar próximo agendamento futuro (não realizado e não cancelado)
      const now = new Date().toISOString();
      const { data: proximoAgendamento, error: proximoError } = await supabase
        .from('agendamentos')
        .select('id, titulo, data, hora, tipo, estado, terapeuta')
        .eq('id_cliente', session.clientId)
        .gte('data', now.split('T')[0]) // Data >= hoje
        .not('estado', 'in', '("cancelado","realizado")')
        .order('data', { ascending: true })
        .limit(1)
        .maybeSingle();

      if (proximoError) {
        logger.error('Erro ao buscar próximo agendamento:', proximoError);
      }

      // Usar o valor calculado (mais preciso) se for maior que o armazenado
      const sessoesRealizadas = realizados?.length || 0;
      const sessoesArmazenadas = data?.numero_sessoes || 0;
      const numeroSessoesFinal = Math.max(sessoesRealizadas, sessoesArmazenadas);

      // Atualizar os dados do cliente com valores calculados
      setClientData({
        ...data,
        numero_sessoes: numeroSessoesFinal,
        // Usar o próximo agendamento calculado dinamicamente
        proxima_sessao: proximoAgendamento?.data || null,
        proxima_sessao_titulo: proximoAgendamento?.titulo || null,
        proxima_sessao_tipo: proximoAgendamento?.tipo || null,
        proxima_sessao_estado: proximoAgendamento?.estado || null,
        proxima_sessao_hora: proximoAgendamento?.hora || null,
        proxima_sessao_terapeuta: proximoAgendamento?.terapeuta || null,
        _sessoes_calculadas: sessoesRealizadas
      });

    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Erro desconhecido';
      logger.error('Erro ao buscar dados do cliente:', error);
      setError(message);
    } finally {
      setLoading(false);
    }
  }, [session, supabase]);

  useEffect(() => {
    if (session) {
      fetchClientData();
    }
  }, [session, fetchClientData]);

  return { clientData, loading, error, refetch: fetchClientData };
};

// Hook para gerenciar mensagens do cliente
export const useClientMessages = () => {
  const { session } = useClientAuth();
  const supabase = useSupabaseClient();
  const [messages, setMessages] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchMessages = useCallback(async () => {
    if (!session) return;

    try {
      setLoading(true);
      setError(null);

      const { data, error: fetchError } = await supabase
        .from('client_messages')
        .select('*')
        .eq('id_cliente', session.clientId)
        .order('created_at', { ascending: false });

      if (fetchError) {
        throw fetchError;
      }

      setMessages(data || []);
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Erro desconhecido';
      setError(message);
    } finally {
      setLoading(false);
    }
  }, [session, supabase]);

  const sendMessage = useCallback(async (message: string) => {
    if (!session) return false;

    try {
      const { error } = await supabase
        .from('client_messages')
        .insert({
          id_cliente: session.clientId,
          sender_type: 'client',
          message,
          is_read: false
        });

      if (error) {
        throw error;
      }

      await fetchMessages();
      return true;
    } catch (error: unknown) {
      logger.error('Erro ao enviar mensagem:', error);
      return false;
    }
  }, [session, fetchMessages, supabase]);

  const markAsRead = useCallback(async (messageId: number) => {
    try {
      const { error } = await supabase
        .from('client_messages')
        .update({ is_read: true })
        .eq('id', messageId);

      if (error) {
        throw error;
      }

      await fetchMessages();
    } catch (error: unknown) {
      logger.error('Erro ao marcar mensagem como lida:', error);
    }
  }, [fetchMessages, supabase]);

  useEffect(() => {
    if (session) {
      fetchMessages();
    }
  }, [session, fetchMessages]);

  const unreadCount = messages.filter(m => !m.is_read && m.sender_type === 'admin').length;

  return {
    messages,
    loading,
    error,
    sendMessage,
    markAsRead,
    refetch: fetchMessages,
    unreadCount,
  };
};

// Hook para gerenciar notificações do cliente
export const useClientNotifications = () => {
  const { session } = useClientAuth();
  const supabase = useSupabaseClient();
  const [notifications, setNotifications] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pendingConfirmations, setPendingConfirmations] = useState<any[]>([]);

  // Verificar e enviar lembretes automáticos
  const checkAndSendReminders = useCallback(async () => {
    if (!session) return;
    
    try {
      // Chamar função que envia lembretes para sessões próximas
      await supabase.rpc<any, any>('check_and_send_reminders');
    } catch (error) {
      // Silencioso - não é crítico se falhar
      logger.error('Erro ao verificar lembretes:', error);
    }
  }, [session, supabase]);

  // Buscar confirmações pendentes
  const fetchPendingConfirmations = useCallback(async () => {
    if (!session) return;
    
    try {
      const { data, error: fetchError } = await supabase.rpc<any, any>('get_pending_confirmations', {
        p_client_id: session.clientId
      });
      
      if (!fetchError && data) {
        setPendingConfirmations(data);
      }
    } catch (error) {
      logger.error('Erro ao buscar confirmações pendentes:', error);
    }
  }, [session, supabase]);

  const fetchNotifications = useCallback(async () => {
    if (!session) return;

    try {
      setLoading(true);
      setError(null);

      // Verificar e enviar lembretes antes de buscar notificações
      await checkAndSendReminders();

      const { data, error: fetchError } = await supabase
        .from('client_notifications')
        .select('*')
        .eq('id_cliente', session.clientId)
        .or('expires_at.is.null,expires_at.gt.now()')
        .order('created_at', { ascending: false });

      if (fetchError) {
        throw fetchError;
      }

      setNotifications(data || []);
      
      // Também buscar confirmações pendentes
      await fetchPendingConfirmations();
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Erro desconhecido';
      logger.error('Erro ao buscar notificações:', error);
      setError(message);
    } finally {
      setLoading(false);
    }
  }, [session, supabase, checkAndSendReminders, fetchPendingConfirmations]);

  const markAsRead = useCallback(async (notificationId: number) => {
    try {
      const { error } = await supabase
        .from('client_notifications')
        .update({ is_read: true })
        .eq('id', notificationId);

      if (error) {
        throw error;
      }

      // Atualizar lista de notificações
      await fetchNotifications();
    } catch (error: unknown) {
      logger.error('Erro ao marcar notificação como lida:', error);
    }
  }, [fetchNotifications, supabase]);

  const unreadCount = notifications.filter(n => !n.is_read).length;

  useEffect(() => {
    if (session) {
      fetchNotifications();
    }
  }, [session, fetchNotifications]);

  // Contagem de confirmações pendentes urgentes (próximas 24h)
  const urgentConfirmationsCount = pendingConfirmations.filter(
    p => p.needs_confirmation && p.hours_until_appointment <= 24 && p.hours_until_appointment > 0
  ).length;

  return {
    notifications,
    loading,
    error,
    markAsRead,
    unreadCount,
    pendingConfirmations,
    urgentConfirmationsCount,
    refetch: fetchNotifications
  };
}; 