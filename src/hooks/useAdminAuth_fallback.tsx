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

  // Gerar token simples
  const generateToken = () => {
    return btoa(Math.random().toString(36).substr(2) + Date.now().toString(36));
  };

  // Validar token usando query direta
  const validateToken = useCallback(async (token: string, savedSession?: AdminSession) => {
    try {
      // Buscar token na base de dados
      const { data: tokenData, error } = await supabase
        .from('admin_access_tokens')
        .select(`
          *,
          admins (
            id,
            nome,
            email,
            role,
            is_active
          )
        `)
        .eq('token', token)
        .eq('is_active', true)
        .single();

      if (error || !tokenData || !tokenData.admins) {
        setSession(null);
        localStorage.removeItem('admin_session');
        return false;
      }

      const admin = tokenData.admins;
      const now = new Date();
      const expiresAt = new Date(tokenData.expires_at);

      if (expiresAt <= now || !admin.is_active) {
        setSession(null);
        localStorage.removeItem('admin_session');
        return false;
      }

      // Token válido, atualizar sessão
      const updatedSession: AdminSession = {
        token,
        adminId: admin.id,
        adminName: admin.nome,
        adminEmail: admin.email,
        role: admin.role,
        permissions: getPermissionsByRole(admin.role),
        expiresAt: tokenData.expires_at,
        isValid: true
      };

      setSession(updatedSession);
      localStorage.setItem('admin_session', JSON.stringify(updatedSession));

      // Atualizar último uso
      await supabase
        .from('admin_access_tokens')
        .update({ last_used_at: new Date().toISOString() })
        .eq('token', token);

      return true;
    } catch (error) {
      console.error('Erro ao validar token:', error);
      setSession(null);
      localStorage.removeItem('admin_session');
      return false;
    }
  }, [getPermissionsByRole]);

  // Função de login usando queries diretas
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

      // Criar token manualmente
      const token = generateToken();
      const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();

      // Inserir token na base de dados
      const { error: tokenError } = await supabase
        .from('admin_access_tokens')
        .insert({
          id_admin: adminData.id,
          token,
          expires_at: expiresAt,
          is_active: true
        });

      if (tokenError) {
        return {
          success: false,
          error: 'Erro ao criar token de acesso. Tente novamente.'
        };
      }

      // Criar sessão
      const newSession: AdminSession = {
        token,
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
        token,
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
  }, [getPermissionsByRole]);

  // Função de logout
  const logout = useCallback(() => {
    if (session) {
      // Desativar token na base de dados
      supabase
        .from('admin_access_tokens')
        .update({ is_active: false })
        .eq('token', session.token)
        .then(() => {
          console.log('Token desativado na base de dados');
        });
    }
    
    setSession(null);
    localStorage.removeItem('admin_session');
    setError(null);
    toast.success('Logout realizado com sucesso');
  }, [session]);

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
      const token = generateToken();
      const newExpiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();

      const { error: tokenError } = await supabase
        .from('admin_access_tokens')
        .insert({
          id_admin: session.adminId,
          token,
          expires_at: newExpiresAt,
          is_active: true
        });

      if (tokenError) {
        console.error('Erro ao renovar token:', tokenError);
        return false;
      }

      // Atualizar sessão com novo token
      const updatedSession: AdminSession = {
        ...session,
        token,
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

// Hook de estatísticas do dashboard (versão simples)
export const useAdminDashboardStats = () => {
  const [stats, setStats] = useState({
    totalClients: 0,
    todayAppointments: 0,
    weekAppointments: 0,
    activeClients: 0,
    pendingAppointments: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        // Buscar estatísticas básicas
        const { data: clients } = await supabase
          .from('clientes')
          .select('id, ativo')
          .eq('ativo', true);

        const { data: appointments } = await supabase
          .from('agendamentos')
          .select('id, data_agendamento, status');

        const now = new Date();
        const today = now.toISOString().split('T')[0];
        const weekStart = new Date(now.setDate(now.getDate() - now.getDay()));

        const todayAppointments = appointments?.filter(apt => 
          apt.data_agendamento?.startsWith(today)
        ).length || 0;

        const weekAppointments = appointments?.filter(apt => 
          new Date(apt.data_agendamento) >= weekStart
        ).length || 0;

        const pendingAppointments = appointments?.filter(apt => 
          apt.status === 'pendente'
        ).length || 0;

        setStats({
          totalClients: clients?.length || 0,
          todayAppointments,
          weekAppointments,
          activeClients: clients?.length || 0,
          pendingAppointments
        });
      } catch (error) {
        console.error('Erro ao buscar estatísticas:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, []);

  return { stats, loading };
};
