import { useState, useEffect, useCallback, createContext, useContext } from 'react';
import { useSupabaseClient } from '@/hooks/useSupabaseClient';
import { toast } from 'sonner';
import { ClientSession, ClientAuthRequest, ClientAuthResponse } from '@/types/client-dashboard';

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
        console.error('Erro ao carregar sessão do cliente:', error);
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

      // Criar sessão
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
        client: clientData,
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
      console.error('Erro ao atualizar sessão:', error);
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

      const { data, error: fetchError } = await supabase
        .from('clientes')
        .select('*')
        .eq('id', session.clientId)
        .single();

      if (fetchError) {
        throw fetchError;
      }

      setClientData(data);
    } catch (error: any) {
      console.error('Erro ao buscar dados do cliente:', error);
      setError(error.message);
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
    } catch (error: any) {
      setError(error.message);
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
    } catch (error: any) {
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
    } catch (error: any) {}
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

  const fetchNotifications = useCallback(async () => {
    if (!session) return;

    try {
      setLoading(true);
      setError(null);

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
    } catch (error: any) {
      console.error('Erro ao buscar notificações:', error);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  }, [session, supabase]);

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
    } catch (error: any) {
      console.error('Erro ao marcar notificação como lida:', error);
    }
  }, [fetchNotifications, supabase]);

  const unreadCount = notifications.filter(n => !n.is_read).length;

  useEffect(() => {
    if (session) {
      fetchNotifications();
    }
  }, [session, fetchNotifications]);

  return {
    notifications,
    loading,
    error,
    markAsRead,
    unreadCount,
    refetch: fetchNotifications
  };
}; 