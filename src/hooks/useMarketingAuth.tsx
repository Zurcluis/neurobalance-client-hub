import React, { useState, useEffect, useCallback, createContext, useContext } from 'react';
import { MarketingSession, MarketingAuthRequest, MarketingAuthResponse, MARKETING_PERMISSIONS } from '@/types/marketing-auth';
import { logger } from '@/lib/logger';
import { DEV_MARKETING_USERS } from '@/config/dev-credentials';

interface MarketingAuthContextType {
  session: MarketingSession | null;
  loading: boolean;
  error: string | null;
  login: (request: MarketingAuthRequest) => Promise<MarketingAuthResponse>;
  logout: () => void;
  refreshSession: () => Promise<boolean>;
  isAuthenticated: boolean;
  hasPermission: (permission: string) => boolean;
}

const MarketingAuthContext = createContext<MarketingAuthContextType | undefined>(undefined);

export const useMarketingAuth = () => {
  const context = useContext(MarketingAuthContext);
  if (!context) {
    throw new Error('useMarketingAuth deve ser usado dentro de um MarketingAuthProvider');
  }
  return context;
};


export const MarketingAuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [session, setSession] = useState<MarketingSession | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Gerar token simples
  const generateToken = () => {
    return btoa(Math.random().toString(36).substr(2) + Date.now().toString(36));
  };

  // Validar token
  const validateToken = useCallback(async (token: string, email: string): Promise<MarketingSession | null> => {
    try {
      const user = DEV_MARKETING_USERS.find(u => 
        u.email === email && u.tokens.includes(token)
      );

      if (!user) {
        return null;
      }

      const permissions = user.role === 'marketing_manager' 
        ? Object.values(MARKETING_PERMISSIONS)
        : [MARKETING_PERMISSIONS.VIEW_CAMPAIGNS, MARKETING_PERMISSIONS.VIEW_LEADS, MARKETING_PERMISSIONS.VIEW_ANALYTICS];

      const sessionToken = generateToken();
      const expiresAt = new Date();
      expiresAt.setHours(expiresAt.getHours() + 8); // 8 horas de validade

      return {
        marketingId: user.id,
        marketingName: user.name,
        marketingEmail: user.email,
        role: user.role,
        permissions,
        token: sessionToken,
        expiresAt: expiresAt.toISOString()
      };
    } catch (error) {
      console.error('Erro ao validar token:', error);
      return null;
    }
  }, []);

  // Verificar se há uma sessão salva no localStorage
  useEffect(() => {
    const savedSession = localStorage.getItem('marketing_session');
    if (savedSession) {
      try {
        const parsedSession = JSON.parse(savedSession);
        const expiresAt = new Date(parsedSession.expiresAt);
        
        if (expiresAt > new Date()) {
          setSession(parsedSession);
        } else {
          localStorage.removeItem('marketing_session');
        }
      } catch (error) {
        logger.error('Erro ao carregar sessão salva:', error);
        localStorage.removeItem('marketing_session');
      }
    }
    setLoading(false);
  }, []);

  // Auto-refresh do token (renovar se falta menos de 5 minutos para expirar)
  useEffect(() => {
    if (!session) return;

    const checkTokenExpiry = () => {
      const expiresAt = new Date(session.expiresAt);
      const now = new Date();
      const fiveMinutesFromNow = new Date(now.getTime() + 5 * 60 * 1000);

      if (expiresAt <= fiveMinutesFromNow) {
        refreshSession();
      }
    };

    const interval = setInterval(checkTokenExpiry, 60000); // Verificar a cada minuto
    return () => clearInterval(interval);
  }, [session]);

  const login = useCallback(async (request: MarketingAuthRequest): Promise<MarketingAuthResponse> => {
    setLoading(true);
    setError(null);

    try {
      const validatedSession = await validateToken(request.token, request.email);
      
      if (validatedSession) {
        setSession(validatedSession);
        localStorage.setItem('marketing_session', JSON.stringify(validatedSession));
        
        return {
          success: true,
          session: validatedSession,
          message: 'Login realizado com sucesso!'
        };
      } else {
        const errorMessage = 'Token ou email inválidos';
        setError(errorMessage);
        return {
          success: false,
          message: errorMessage
        };
      }
    } catch (error) {
      const errorMessage = 'Erro interno do servidor';
      logger.error('Erro no login:', error);
      setError(errorMessage);
      return {
        success: false,
        message: errorMessage
      };
    } finally {
      setLoading(false);
    }
  }, [validateToken]);

  const logout = useCallback(() => {
    setSession(null);
    setError(null);
    localStorage.removeItem('marketing_session');
  }, []);

  const refreshSession = useCallback(async (): Promise<boolean> => {
    if (!session) return false;

    try {
      const user = DEV_MARKETING_USERS.find(u => u.id === session.marketingId);
      if (!user) return false;

      const newToken = generateToken();
      const expiresAt = new Date();
      expiresAt.setHours(expiresAt.getHours() + 8);

      const refreshedSession: MarketingSession = {
        ...session,
        token: newToken,
        expiresAt: expiresAt.toISOString()
      };

      setSession(refreshedSession);
      localStorage.setItem('marketing_session', JSON.stringify(refreshedSession));
      return true;
    } catch (error) {
      logger.error('Erro ao renovar sessão:', error);
      logout();
      return false;
    }
  }, [session, logout]);

  const hasPermission = useCallback((permission: string): boolean => {
    return session?.permissions.includes(permission) || false;
  }, [session]);

  const value: MarketingAuthContextType = {
    session,
    loading,
    error,
    login,
    logout,
    refreshSession,
    isAuthenticated: !!session,
    hasPermission
  };

  return (
    <MarketingAuthContext.Provider value={value}>
      {children}
    </MarketingAuthContext.Provider>
  );
};
