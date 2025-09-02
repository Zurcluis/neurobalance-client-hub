import { useState, useEffect, useCallback, createContext, useContext } from 'react';
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

// Admins hardcoded para funcionar sem base de dados
const HARDCODED_ADMINS = [
  {
    id: 1,
    nome: 'Admin Principal',
    email: 'admin@neurobalance.pt',
    role: 'admin' as const,
    permissions: Object.values(ADMIN_PERMISSIONS),
    is_active: true
  },
  {
    id: 2,
    nome: 'Assistente',
    email: 'assistente@neurobalance.pt',
    role: 'assistant' as const,
    permissions: [
      ADMIN_PERMISSIONS.VIEW_CLIENTS,
      ADMIN_PERMISSIONS.VIEW_CALENDAR,
      ADMIN_PERMISSIONS.MANAGE_APPOINTMENTS,
    ],
    is_active: true
  }
];

export const AdminAuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [session, setSession] = useState<AdminSession | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Gerar token simples
  const generateToken = () => {
    return btoa(Math.random().toString(36).substr(2) + Date.now().toString(36));
  };

  // Validar sessão (apenas verifica se não expirou)
  const validateSession = useCallback((savedSession: AdminSession) => {
    const now = new Date();
    const expiresAt = new Date(savedSession.expiresAt);
    
    if (expiresAt <= now) {
      return false;
    }
    
    return true;
  }, []);

  // Função de login simplificada
  const login = useCallback(async (request: AdminAuthRequest): Promise<AdminAuthResponse> => {
    try {
      setLoading(true);
      setError(null);

      // Simular delay de rede
      await new Promise(resolve => setTimeout(resolve, 500));

      // Buscar admin nos dados hardcoded
      const adminData = HARDCODED_ADMINS.find(admin => 
        admin.email === request.email && admin.is_active
      );

      if (!adminData) {
        return {
          success: false,
          error: 'Administrador não encontrado ou inativo. Verifique o email fornecido.'
        };
      }

      // Criar sessão
      const token = generateToken();
      const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();
      
      const newSession: AdminSession = {
        token,
        adminId: adminData.id,
        adminName: adminData.nome,
        adminEmail: adminData.email,
        role: adminData.role,
        permissions: adminData.permissions,
        expiresAt,
        isValid: true
      };

      setSession(newSession);
      localStorage.setItem('admin_session', JSON.stringify(newSession));

      toast.success(`Bem-vindo, ${adminData.nome}!`);

      return {
        success: true,
        token,
        admin: {
          id: adminData.id,
          nome: adminData.nome,
          email: adminData.email,
          role: adminData.role,
          permissions: adminData.permissions
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
      // Verificar se a sessão ainda é válida
      if (validateSession(session)) {
        // Estender a sessão por mais 24 horas
        const newExpiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();
        const updatedSession: AdminSession = {
          ...session,
          expiresAt: newExpiresAt,
          isValid: true
        };

        setSession(updatedSession);
        localStorage.setItem('admin_session', JSON.stringify(updatedSession));
        
        return true;
      }
      
      return false;
    } catch (error) {
      console.error('Erro ao atualizar sessão:', error);
      return false;
    }
  }, [session, validateSession]);

  // Verificar se tem permissão específica
  const hasPermission = useCallback((permission: string): boolean => {
    if (!session) return false;
    return session.permissions.includes(permission);
  }, [session]);

  const isAuthenticated = session !== null && session.isValid;

  // Verificar se há uma sessão salva no localStorage
  useEffect(() => {
    const initializeSession = () => {
      const savedSession = localStorage.getItem('admin_session');
      if (savedSession) {
        try {
          const parsedSession: AdminSession = JSON.parse(savedSession);
          
          // Verificar se a sessão não expirou
          if (validateSession(parsedSession)) {
            setSession(parsedSession);
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
  }, [validateSession]);

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

// Hook de estatísticas do dashboard (versão simplificada)
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
    // Simular carregamento de estatísticas
    const fetchStats = async () => {
      try {
        // Simular delay
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        // Dados simulados
        setStats({
          totalClients: 25,
          todayAppointments: 3,
          weekAppointments: 12,
          activeClients: 23,
          pendingAppointments: 2
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
