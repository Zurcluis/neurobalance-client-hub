import React, { useState, useEffect, useCallback, createContext, useContext } from 'react';
import { MarketingSession, MarketingAuthRequest, MarketingAuthResponse, MARKETING_PERMISSIONS } from '@/types/marketing-auth';
import { logger } from '@/lib/logger';
import { DEV_MARKETING_USERS } from '@/config/dev-credentials';
import { supabase } from '@/integrations/supabase/client';

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

  // Validar token no Supabase
  const validateTokenInSupabase = async (token: string, email: string): Promise<MarketingSession | null> => {
    try {
      const { data, error } = await supabase.rpc('validate_marketing_token', {
        p_token: token,
        p_email: email
      });

      if (error) {
        console.log('Erro ao validar no Supabase, tentando localStorage:', error);
        return null;
      }

      if (data && data.length > 0 && data[0].is_valid) {
        const tokenData = data[0];
        const permissions = tokenData.token_role === 'marketing_manager'
          ? Object.values(MARKETING_PERMISSIONS)
          : [MARKETING_PERMISSIONS.VIEW_CAMPAIGNS, MARKETING_PERMISSIONS.VIEW_LEADS, MARKETING_PERMISSIONS.VIEW_ANALYTICS];

        const sessionToken = generateToken();

        return {
          marketingId: tokenData.token_id,
          marketingName: tokenData.token_name,
          marketingEmail: tokenData.token_email,
          role: tokenData.token_role,
          permissions,
          token: sessionToken,
          expiresAt: tokenData.expires_at
        };
      }

      return null;
    } catch (error) {
      console.error('Erro ao validar token no Supabase:', error);
      return null;
    }
  };

  // Validar token no localStorage (fallback)
  const validateTokenInLocalStorage = (token: string, email: string): MarketingSession | null => {
    const savedTokensStr = localStorage.getItem('marketing_access_tokens');
    if (!savedTokensStr) return null;

    try {
      const savedTokens = JSON.parse(savedTokensStr);
      const accessToken = savedTokens.find((t: any) => {
        const tokenMatch = t.token === token;
        const emailMatch = t.email === email;
        // Suportar ambos os formatos (camelCase e snake_case)
        const isActive = t.isActive !== false && t.is_active !== false;
        const expiresAt = new Date(t.expiresAt || t.expires_at);
        const notExpired = expiresAt > new Date();
        
        return tokenMatch && emailMatch && isActive && notExpired;
      });

      if (accessToken) {
        // Atualizar contagem de uso
        const updatedTokens = savedTokens.map((t: any) =>
          t.token === token
            ? { 
                ...t, 
                usageCount: (t.usageCount || t.usage_count || 0) + 1, 
                usage_count: (t.usageCount || t.usage_count || 0) + 1,
                lastUsedAt: new Date().toISOString(),
                last_used_at: new Date().toISOString()
              }
            : t
        );
        localStorage.setItem('marketing_access_tokens', JSON.stringify(updatedTokens));

        const permissions = accessToken.role === 'marketing_manager'
          ? Object.values(MARKETING_PERMISSIONS)
          : [MARKETING_PERMISSIONS.VIEW_CAMPAIGNS, MARKETING_PERMISSIONS.VIEW_LEADS, MARKETING_PERMISSIONS.VIEW_ANALYTICS];

        const sessionToken = generateToken();
        const sessionExpiresAt = new Date(accessToken.expiresAt || accessToken.expires_at);

        return {
          marketingId: accessToken.id,
          marketingName: accessToken.name,
          marketingEmail: accessToken.email,
          role: accessToken.role,
          permissions,
          token: sessionToken,
          expiresAt: sessionExpiresAt.toISOString()
        };
      }
    } catch (error) {
      console.error('Erro ao processar localStorage:', error);
    }

    return null;
  };

  // Validar token (tenta Supabase primeiro, depois localStorage, depois credenciais de dev)
  const validateToken = useCallback(async (token: string, email: string): Promise<MarketingSession | null> => {
    try {
      // 1. Tentar validar no Supabase
      const supabaseResult = await validateTokenInSupabase(token, email);
      if (supabaseResult) {
        return supabaseResult;
      }

      // 2. Fallback: verificar no localStorage
      const localStorageResult = validateTokenInLocalStorage(token, email);
      if (localStorageResult) {
        return localStorageResult;
      }

      // 3. Fallback: verificar credenciais de desenvolvimento
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
      expiresAt.setFullYear(expiresAt.getFullYear() + 100);

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
        // Nunca expira - sempre aceitar sessão salva
        setSession(parsedSession);
      } catch (error) {
        logger.error('Erro ao carregar sessão salva:', error);
        localStorage.removeItem('marketing_session');
      }
    }
    setLoading(false);
  }, []);

  // Removido: Auto-refresh não é mais necessário pois tokens nunca expiram

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
