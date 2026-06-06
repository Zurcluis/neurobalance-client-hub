import { useState, useEffect, useCallback, createContext, useContext } from 'react';
import { toast } from 'sonner';
import { AdminSession, AdminAuthRequest, AdminAuthResponse, ADMIN_PERMISSIONS, AdminRole } from '@/types/admin';
import { logger } from '@/lib/logger';
import { DEV_ADMINS } from '@/config/dev-credentials';
import { supabase } from '@/integrations/supabase/client';

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

// Função para gerar hash SHA-256 de forma assíncrona na Web
export async function hashPassword(password: string): Promise<string> {
  const msgBuffer = new TextEncoder().encode(password);
  const hashBuffer = await crypto.subtle.digest('SHA-256', msgBuffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  return hashHex;
}

// Obter permissões com base na função
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

export const AdminAuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [session, setSession] = useState<AdminSession | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Validar token na base de dados
  const validateToken = useCallback(async (token: string, savedSession?: AdminSession) => {
    try {
      const { data: tokenData, error } = await supabase
        .from('admin_access_tokens')
        .select(`
          *,
          admins!admin_access_tokens_admin_id_fkey (
            id,
            nome,
            email,
            role,
            ativo
          )
        `)
        .eq('token', token)
        .eq('is_active', true)
        .single();

      if (error || !tokenData || !tokenData.admins) {
        // Em caso de erro de rede ou token inválido, se a sessão local ainda não expirou, mantemos temporariamente (tolerância offline)
        if (savedSession) {
          const now = new Date();
          const expiresAt = new Date(savedSession.expiresAt);
          if (expiresAt > now) {
            return true;
          }
        }
        setSession(null);
        localStorage.removeItem('admin_session');
        return false;
      }

      const admin = tokenData.admins;
      const now = new Date();
      const expiresAt = new Date(tokenData.expires_at);

      if (expiresAt <= now || !admin.ativo) {
        setSession(null);
        localStorage.removeItem('admin_session');
        return false;
      }

      // Token válido, atualizar sessão
      const updatedSession: AdminSession = {
        token,
        adminId: admin.id as any, // ID na BD pode ser string/UUID
        adminName: admin.nome,
        adminEmail: admin.email,
        role: admin.role as AdminRole,
        permissions: getPermissionsByRole(admin.role),
        expiresAt: tokenData.expires_at,
        isValid: true
      };

      setSession(updatedSession);
      localStorage.setItem('admin_session', JSON.stringify(updatedSession));

      // Atualizar data de último uso do token
      await supabase
        .from('admin_access_tokens')
        .update({ last_used_at: new Date().toISOString() } as any)
        .eq('token', token);

      return true;
    } catch (error) {
      console.error('Erro ao validar token:', error);
      if (savedSession) {
        const now = new Date();
        const expiresAt = new Date(savedSession.expiresAt);
        if (expiresAt > now) {
          return true;
        }
      }
      setSession(null);
      localStorage.removeItem('admin_session');
      return false;
    }
  }, []);

  // Função de login (Email + Password + Token URL opcional)
  const login = useCallback(async (request: AdminAuthRequest): Promise<AdminAuthResponse> => {
    try {
      setLoading(true);
      setError(null);

      // 1. Validar se foi fornecido um Token de Acesso da URL
      if (request.token) {
        const { data: tokenData, error: tokenError } = await supabase
          .from('admin_access_tokens')
          .select(`
            *,
            admins!admin_access_tokens_admin_id_fkey (
              id,
              nome,
              email,
              role,
              ativo,
              password_hash
            )
          `)
          .eq('token', request.token)
          .eq('is_active', true)
          .single();

        if (tokenError || !tokenData || !tokenData.admins) {
          return {
            success: false,
            error: 'O link de acesso utilizado é inválido ou já foi revogado.'
          };
        }

        const admin = tokenData.admins;
        const now = new Date();
        const expiresAt = new Date(tokenData.expires_at);

        if (expiresAt <= now) {
          return {
            success: false,
            error: 'O link de acesso utilizado já expirou.'
          };
        }

        if (!admin.ativo) {
          return {
            success: false,
            error: 'Esta conta administrativa encontra-se inativa.'
          };
        }

        // Se introduzir email, validar se corresponde ao token
        if (request.email && admin.email.toLowerCase() !== request.email.toLowerCase()) {
          return {
            success: false,
            error: 'O e-mail introduzido não corresponde ao e-mail deste link de acesso.'
          };
        }

        // Se o admin tiver password definida na BD, exige validação de password adicional
        if (admin.password_hash) {
          if (!request.password) {
            return {
              success: false,
              error: 'Este link exige a introdução da palavra-passe correspondente.'
            };
          }

          const hashedInput = await hashPassword(request.password);
          if (hashedInput !== admin.password_hash) {
            return {
              success: false,
              error: 'A palavra-passe introduzida está incorreta.'
            };
          }
        }

        // Criar a sessão com o token existente
        const newSession: AdminSession = {
          token: request.token,
          adminId: admin.id as any,
          adminName: admin.nome,
          adminEmail: admin.email,
          role: admin.role as AdminRole,
          permissions: getPermissionsByRole(admin.role),
          expiresAt: tokenData.expires_at,
          isValid: true
        };

        setSession(newSession);
        localStorage.setItem('admin_session', JSON.stringify(newSession));
        toast.success(`Bem-vindo(a), ${admin.nome}!`);

        // Atualizar último uso do token e último login do admin
        await Promise.all([
          supabase.from('admin_access_tokens').update({ last_used_at: new Date().toISOString() } as any).eq('token', request.token),
          supabase.from('admins').update({ last_login: new Date().toISOString() }).eq('id', admin.id)
        ]);

        return {
          success: true,
          token: request.token,
          admin: {
            id: admin.id as any,
            nome: admin.nome,
            email: admin.email,
            role: admin.role as AdminRole,
            permissions: getPermissionsByRole(admin.role)
          },
          expiresAt: tokenData.expires_at
        };
      }

      // 2. Login Direto (Email + Password) sem Token da URL
      const { data: dbAdmin, error: dbError } = await supabase
        .from('admins')
        .select('*')
        .eq('email', request.email)
        .eq('ativo', true)
        .single();

      if (!dbError && dbAdmin) {
        // Validar palavra-passe se existir na BD
        if (dbAdmin.password_hash) {
          if (!request.password) {
            return {
              success: false,
              error: 'Por favor, introduza a sua palavra-passe.'
            };
          }

          const hashedInput = await hashPassword(request.password);
          if (hashedInput !== dbAdmin.password_hash) {
            return {
              success: false,
              error: 'A palavra-passe introduzida está incorreta.'
            };
          }
        } else if (request.password) {
          // Se o utilizador digitou uma password mas o registo não tem hash, bloqueamos por segurança
          return {
            success: false,
            error: 'Esta conta ainda não possui palavra-passe definida. Contacte o administrador principal.'
          };
        }

        // Gerar um novo token de acesso persistente
        const token = btoa(Math.random().toString(36).substr(2) + Date.now().toString(36));
        const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(); // 24 horas

        const { error: tokenInsertError } = await supabase
          .from('admin_access_tokens')
          .insert({
            admin_id: dbAdmin.id,
            token,
            expires_at: expiresAt,
            is_active: true
          });

        if (tokenInsertError) {
          console.error('Erro ao registar token de acesso:', tokenInsertError);
          return {
            success: false,
            error: 'Não foi possível estabelecer uma sessão de administrador.'
          };
        }

        // Criar sessão de utilizador
        const newSession: AdminSession = {
          token,
          adminId: dbAdmin.id as any,
          adminName: dbAdmin.nome,
          adminEmail: dbAdmin.email,
          role: dbAdmin.role as AdminRole,
          permissions: getPermissionsByRole(dbAdmin.role),
          expiresAt,
          isValid: true
        };

        setSession(newSession);
        localStorage.setItem('admin_session', JSON.stringify(newSession));
        toast.success(`Bem-vindo(a), ${dbAdmin.nome}!`);

        // Atualizar último login
        await supabase.from('admins').update({ last_login: new Date().toISOString() }).eq('id', dbAdmin.id);

        return {
          success: true,
          token,
          admin: {
            id: dbAdmin.id as any,
            nome: dbAdmin.nome,
            email: dbAdmin.email,
            role: dbAdmin.role as AdminRole,
            permissions: getPermissionsByRole(dbAdmin.role)
          },
          expiresAt
        };
      }

      // 3. Fallback para utilizadores de desenvolvimento (DEV_ADMINS) se em DEV
      if (import.meta.env.DEV) {
        const devAdmin = DEV_ADMINS.find(admin => 
          admin.email.toLowerCase() === request.email.toLowerCase() && admin.is_active
        );

        if (devAdmin) {
          // No desenvolvimento, aceitamos uma password default 'admin123' ou 'assistente123'
          const defaultDevPass = devAdmin.role === 'admin' ? 'admin123' : 'assistente123';
          
          if (request.password && request.password !== defaultDevPass) {
            return {
              success: false,
              error: 'Palavra-passe incorreta para credenciais de desenvolvimento local.'
            };
          }

          const token = 'dev_tok_' + btoa(devAdmin.email);
          const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();

          const newSession: AdminSession = {
            token,
            adminId: devAdmin.id,
            adminName: devAdmin.nome,
            adminEmail: devAdmin.email,
            role: devAdmin.role,
            permissions: devAdmin.permissions,
            expiresAt,
            isValid: true
          };

          setSession(newSession);
          localStorage.setItem('admin_session', JSON.stringify(newSession));
          toast.success(`Bem-vindo(a) (Desenvolvimento), ${devAdmin.nome}!`);

          return {
            success: true,
            token,
            admin: {
              id: devAdmin.id,
              nome: devAdmin.nome,
              email: devAdmin.email,
              role: devAdmin.role,
              permissions: devAdmin.permissions
            },
            expiresAt
          };
        }
      }

      return {
        success: false,
        error: 'Administrador não encontrado ou inativo. Por favor, valide os dados introduzidos.'
      };
    } catch (error: any) {
      console.error('Erro geral no login de admin:', error);
      return {
        success: false,
        error: error.message || 'Ocorreu um erro interno do servidor.'
      };
    } finally {
      setLoading(false);
    }
  }, []);

  // Terminar sessão (Logout)
  const logout = useCallback(() => {
    if (session) {
      // Opcionalmente, revogar na base de dados
      supabase
        .from('admin_access_tokens')
        .update({ is_active: false })
        .eq('token', session.token)
        .then(() => {
          logger.log('Sessão revogada na base de dados.');
        });
    }

    setSession(null);
    localStorage.removeItem('admin_session');
    setError(null);
    toast.success('Sessão terminada com sucesso.');
  }, [session]);

  // Atualizar/renovar sessão
  const refreshSession = useCallback(async (): Promise<boolean> => {
    if (!session) return false;

    try {
      const isTokenValid = await validateToken(session.token, session);
      if (isTokenValid) {
        return true;
      }
      return false;
    } catch (error) {
      console.error('Erro ao renovar a sessão:', error);
      return false;
    }
  }, [session, validateToken]);

  // Validar permissão
  const hasPermission = useCallback((permission: string): boolean => {
    if (!session) return false;
    return session.permissions.includes(permission);
  }, [session]);

  const isAuthenticated = session !== null && session.isValid;

  // Efeito de inicialização
  useEffect(() => {
    const initializeSession = async () => {
      const savedSession = localStorage.getItem('admin_session');
      if (savedSession) {
        try {
          const parsedSession: AdminSession = JSON.parse(savedSession);
          const now = new Date();
          const expiresAt = new Date(parsedSession.expiresAt);

          if (expiresAt > now) {
            setSession(parsedSession);
            await validateToken(parsedSession.token, parsedSession);
          } else {
            localStorage.removeItem('admin_session');
          }
        } catch (error) {
          logger.error('Erro ao carregar sessão administrativa:', error);
          localStorage.removeItem('admin_session');
        }
      }
      setLoading(false);
    };

    initializeSession();
  }, [validateToken]);

  // Auto-renovação de tokens prestes a expirar (menos de 5 min)
  useEffect(() => {
    if (!session) return;

    const checkSessionExpiry = () => {
      const now = new Date().getTime();
      const expiresAt = new Date(session.expiresAt).getTime();
      const timeUntilExpiry = expiresAt - now;

      if (timeUntilExpiry < 5 * 60 * 1000 && timeUntilExpiry > 0) {
        refreshSession();
      }
    };

    const interval = setInterval(checkSessionExpiry, 60 * 1000);
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

// Hook complementar de estatísticas simples
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
        const { data: clients } = await supabase
          .from('clientes')
          .select('id, estado')
          .eq('estado', 'ativo');

        const { data: appointments } = await supabase
          .from('agendamentos')
          .select('id, data, estado');

        const now = new Date();
        const todayStr = now.toISOString().split('T')[0];
        
        // Calcular início da semana
        const diff = now.getDate() - now.getDay() + (now.getDay() === 0 ? -6 : 1);
        const weekStart = new Date(now.setDate(diff));
        weekStart.setHours(0, 0, 0, 0);

        const todayAppointments = appointments?.filter(apt => apt.data === todayStr).length || 0;
        
        const weekAppointments = appointments?.filter(apt => {
          const aptDate = new Date(apt.data);
          return aptDate >= weekStart;
        }).length || 0;

        const pendingAppointments = appointments?.filter(apt => apt.estado === 'pendente').length || 0;

        setStats({
          totalClients: clients?.length || 0,
          todayAppointments,
          weekAppointments,
          activeClients: clients?.length || 0,
          pendingAppointments
        });
      } catch (error) {
        console.error('Erro a carregar estatísticas do admin:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, []);

  return { stats, loading };
};
