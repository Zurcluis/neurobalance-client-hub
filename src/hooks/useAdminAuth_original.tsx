import { useState, useEffect, useCallback, createContext, useContext } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { AdminSession, AdminAuthRequest, AdminAuthResponse, ADMIN_PERMISSIONS } from '@/types/admin';

interface AdminAuthContextType {
  session: AdminSession | null;
  loading: boolean;
  error: string | null;
  login: (request: AdminAuthRequest) => Promise<AdminAuthResponse>;
  logout: () => void;
  refreshSession: () => Promise<boolean>;
  isAuthenticated: boolean;
  hasPermission: (permission: string) => boolean;
}

const AdminAuthContext = createContext<AdminAuthContextType | undefined>(undefined);

export const useAdminAuth = () => {
  const context = useContext(AdminAuthContext);
  if (!context) {
    throw new Error('useAdminAuth deve ser usado dentro de um AdminAuthProvider');
  }
  return context;
};

export const AdminAuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [session, setSession] = useState<AdminSession | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Definir permissões baseadas no role
  const getPermissionsByRole = (role: string): string[] => {
    switch (role) {
      case 'admin':
        return Object.values(ADMIN_PERMISSIONS);
      case 'assistant':
        return [
          ADMIN_PERMISSIONS.VIEW_CLIENTS,
          ADMIN_PERMISSIONS.VIEW_CALENDAR,
          ADMIN_PERMISSIONS.MANAGE_APPOINTMENTS,
        ];
      default:
        return [];
    }
  };

  // Validar token no servidor
  const validateToken = useCallback(async (token: string, savedSession?: AdminSession) => {
    try {
      const { data, error } = await supabase.rpc<any, any>('validate_admin_token', {
        token_value: token
      });

      if (error) {
        throw error;
      }

      if (data && Array.isArray(data) && data.length > 0) {
        const adminData = data[0];
        if (adminData.is_valid) {
          // Token válido, atualizar sessão
          const updatedSession: AdminSession = {
            token,
            adminId: adminData.admin_id,
            adminName: adminData.admin_name,
            adminEmail: adminData.admin_email,
            role: adminData.admin_role,
            permissions: getPermissionsByRole(adminData.admin_role),
            expiresAt: adminData.expires_at || savedSession?.expiresAt || new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
            isValid: true
          };
          setSession(updatedSession);
          localStorage.setItem('admin_session', JSON.stringify(updatedSession));
          return true;
        } else {
          setSession(null);
          localStorage.removeItem('admin_session');
          setError('Sessão expirada. Por favor, faça login novamente.');
          return false;
        }
      } else {
        setSession(null);
        localStorage.removeItem('admin_session');
        setError('Sessão inválida.');
        return false;
      }
    } catch (error) {
      console.error('Erro ao validar token:', error);
      setSession(null);
      localStorage.removeItem('admin_session');
      setError('Erro ao validar sessão.');
      return false;
    }
  }, [getPermissionsByRole]);

  // Função de login
  const login = useCallback(async (request: AdminAuthRequest): Promise<AdminAuthResponse> => {
    try {
      setLoading(true);
      setError(null);

      // Buscar admin por email
      const { data: adminData, error: adminError } = await supabase
        .from('admins')
        .select('id, nome, email, role, is_active')
        .eq('email', request.email)
        .eq('is_active', true)
        .single();

      if (adminError || !adminData) {
        return {
          success: false,
          error: 'Administrador não encontrado ou inativo. Verifique o email fornecido.'
        };
      }

      // Criar token de acesso
      const { data: tokenData, error: tokenError } = await supabase.rpc<any, any>('create_admin_access_token', {
        admin_id: adminData.id,
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
      const newSession: AdminSession = {
        token: tokenData,
        adminId: adminData.id,
        adminName: adminData.nome,
        adminEmail: adminData.email,
        role: adminData.role,
        permissions: getPermissionsByRole(adminData.role),
        expiresAt,
        isValid: true
      };

      setSession(newSession);
      localStorage.setItem('admin_session', JSON.stringify(newSession));

      return {
        success: true,
        token: tokenData,
        admin: adminData,
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
  }, []);

  // Função de logout
  const logout = useCallback(() => {
    setSession(null);
    localStorage.removeItem('admin_session');
    setError(null);
    toast.success('Logout realizado com sucesso');
  }, []);

  // Função para atualizar sessão
  const refreshSession = useCallback(async (): Promise<boolean> => {
    if (!session) return false;

    try {
      // Primeiro tentar validar o token atual
      const isCurrentTokenValid = await validateToken(session.token, session);
      
      if (isCurrentTokenValid) {
        return true;
      }

      // Se o token atual não é válido, criar um novo
      const { data: tokenData, error: tokenError } = await supabase.rpc<any, any>('create_admin_access_token', {
        admin_id: session.adminId,
        expires_hours: 24
      });

      if (tokenError || !tokenData) {
        console.error('Erro ao renovar token:', tokenError);
        return false;
      }

      // Atualizar sessão com novo token
      const newExpiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();
      const updatedSession: AdminSession = {
        ...session,
        token: tokenData,
        expiresAt: newExpiresAt,
        isValid: true
      };

      setSession(updatedSession);
      localStorage.setItem('admin_session', JSON.stringify(updatedSession));
      
      return true;
    } catch (error) {
      console.error('Erro ao atualizar sessão:', error);
      return false;
    }
  }, [session, validateToken]);

  // Verificar se tem permissão específica
  const hasPermission = useCallback((permission: string): boolean => {
    if (!session) return false;
    return session.permissions.includes(permission);
  }, [session]);

  const isAuthenticated = session !== null && session.isValid;

  // Verificar se há uma sessão salva no localStorage
  useEffect(() => {
    const initializeSession = async () => {
      const savedSession = localStorage.getItem('admin_session');
      if (savedSession) {
        try {
          const parsedSession: AdminSession = JSON.parse(savedSession);
          
          // Verificar se a sessão não expirou
          if (new Date(parsedSession.expiresAt) > new Date()) {
            // Definir a sessão temporariamente
            setSession(parsedSession);
            // Validar token no servidor
            const isValid = await validateToken(parsedSession.token, parsedSession);
            if (!isValid) {
              setSession(null);
            }
          } else {
            // Sessão expirada, remover do localStorage
            localStorage.removeItem('admin_session');
          }
        } catch (error) {
          console.error('Erro ao carregar sessão do admin:', error);
          localStorage.removeItem('admin_session');
        }
      }
      setLoading(false);
    };

    initializeSession();
  }, [validateToken]);

  // Auto-refresh da sessão quando estiver próxima de expirar
  useEffect(() => {
    if (!session) return;

    const checkSessionExpiry = () => {
      const now = new Date().getTime();
      const expiresAt = new Date(session.expiresAt).getTime();
      const timeUntilExpiry = expiresAt - now;
      
      // Se faltam menos de 5 minutos para expirar, renovar a sessão
      if (timeUntilExpiry < 5 * 60 * 1000 && timeUntilExpiry > 0) {
        refreshSession();
      }
    };

    // Verificar a cada 1 minuto
    const interval = setInterval(checkSessionExpiry, 60 * 1000);
    
    // Verificar imediatamente
    checkSessionExpiry();

    return () => clearInterval(interval);
  }, [session, refreshSession]);

  return (
    <AdminAuthContext.Provider
      value={{
        session,
        loading,
        error,
        login,
        logout,
        refreshSession,
        isAuthenticated,
        hasPermission
      }}
    >
      {children}
    </AdminAuthContext.Provider>
  );
};

// Hook para usar dados do admin autenticado
export const useAdminData = () => {
  const { session } = useAdminAuth();
  const [adminData, setAdminData] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchAdminData = useCallback(async () => {
    if (!session) return;

    try {
      setLoading(true);
      setError(null);

      const { data, error: fetchError } = await supabase
        .from('admins')
        .select('*')
        .eq('id', session.adminId)
        .single();

      if (fetchError) {
        throw fetchError;
      }

      setAdminData(data);
    } catch (error: any) {
      console.error('Erro ao buscar dados do admin:', error);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  }, [session]);

  useEffect(() => {
    if (session) {
      fetchAdminData();
    }
  }, [session, fetchAdminData]);

  return { adminData, loading, error, refetch: fetchAdminData };
};

// Hook para estatísticas do dashboard
export const useAdminDashboardStats = () => {
  const { session } = useAdminAuth();
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchStats = useCallback(async () => {
    if (!session) return;

    try {
      setLoading(true);
      setError(null);

      // Buscar estatísticas básicas
      const [clientsResult, appointmentsResult] = await Promise.all([
        supabase
          .from('clientes')
          .select('id', { count: 'exact' }),
        supabase
          .from('agendamentos')
          .select('id, data, estado', { count: 'exact' })
      ]);

      if (clientsResult.error) throw clientsResult.error;
      if (appointmentsResult.error) throw appointmentsResult.error;

      const today = new Date();
      const todayStart = new Date(today.getFullYear(), today.getMonth(), today.getDate());
      const todayEnd = new Date(todayStart.getTime() + 24 * 60 * 60 * 1000);

      const todayAppointments = appointmentsResult.data?.filter(apt => {
        const aptDate = new Date(apt.data);
        return aptDate >= todayStart && aptDate < todayEnd;
      }).length || 0;

      const pendingAppointments = appointmentsResult.data?.filter(apt => 
        apt.estado === 'pendente'
      ).length || 0;

      setStats({
        totalClients: clientsResult.count || 0,
        todayAppointments,
        weekAppointments: appointmentsResult.count || 0,
        activeClients: clientsResult.count || 0,
        pendingAppointments
      });

    } catch (error: any) {
      console.error('Erro ao buscar estatísticas:', error);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  }, [session]);

  useEffect(() => {
    if (session) {
      fetchStats();
    }
  }, [session, fetchStats]);

  return { stats, loading, error, refetch: fetchStats };
};
