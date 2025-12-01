import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface MarketingAccessToken {
    id: string;
    token: string;
    name: string;
    email: string;
    role: 'marketing_manager' | 'marketing_assistant';
    validity_period: string;
    created_at: string;
    expires_at: string;
    created_by: string;
    is_active: boolean;
    usage_count: number;
    last_used_at: string | null;
}

export interface CreateTokenData {
    name: string;
    email: string;
    role: 'marketing_manager' | 'marketing_assistant';
    validityPeriod: string;
}

// Gerar token de acesso único
export const generateAccessToken = (): string => {
    const prefix = 'MKT';
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let token = prefix + '_';
    for (let i = 0; i < 20; i++) {
        token += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return token;
};

// Calcular data de expiração baseada no período
export const calculateExpirationDate = (period: string): string => {
    const now = new Date();
    
    switch (period) {
        case '1d':
            now.setDate(now.getDate() + 1);
            break;
        case '7d':
            now.setDate(now.getDate() + 7);
            break;
        case '30d':
            now.setDate(now.getDate() + 30);
            break;
        case '90d':
            now.setDate(now.getDate() + 90);
            break;
        case '365d':
            now.setDate(now.getDate() + 365);
            break;
        case 'unlimited':
            now.setFullYear(now.getFullYear() + 100);
            break;
        default:
            now.setDate(now.getDate() + 7);
    }
    
    return now.toISOString();
};

export const useMarketingTokens = () => {
    const [tokens, setTokens] = useState<MarketingAccessToken[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // Carregar tokens do Supabase
    const fetchTokens = useCallback(async () => {
        setLoading(true);
        try {
            const { data, error } = await supabase
                .from('marketing_access_tokens')
                .select('*')
                .order('created_at', { ascending: false });

            if (error) throw error;

            setTokens(data || []);
            setError(null);
        } catch (err: any) {
            console.error('Erro ao carregar tokens:', err);
            setError(err.message);
            
            // Fallback para localStorage se a tabela não existir
            const savedTokens = localStorage.getItem('marketing_access_tokens');
            if (savedTokens) {
                try {
                    const parsed = JSON.parse(savedTokens);
                    // Mapear formato antigo para novo
                    const mappedTokens = parsed.map((t: any) => ({
                        id: t.id,
                        token: t.token,
                        name: t.name,
                        email: t.email,
                        role: t.role,
                        validity_period: t.validityPeriod || t.validity_period,
                        created_at: t.createdAt || t.created_at,
                        expires_at: t.expiresAt || t.expires_at,
                        created_by: t.createdBy || t.created_by || 'admin@neurobalance.pt',
                        is_active: t.isActive !== undefined ? t.isActive : t.is_active,
                        usage_count: t.usageCount || t.usage_count || 0,
                        last_used_at: t.lastUsedAt || t.last_used_at || null
                    }));
                    setTokens(mappedTokens);
                } catch (e) {
                    console.error('Erro ao processar localStorage:', e);
                }
            }
        } finally {
            setLoading(false);
        }
    }, []);

    // Criar novo token
    const createToken = useCallback(async (data: CreateTokenData): Promise<MarketingAccessToken | null> => {
        try {
            const newToken: Partial<MarketingAccessToken> = {
                token: generateAccessToken(),
                name: data.name,
                email: data.email,
                role: data.role,
                validity_period: data.validityPeriod,
                expires_at: calculateExpirationDate(data.validityPeriod),
                created_by: 'admin@neurobalance.pt',
                is_active: true,
                usage_count: 0
            };

            const { data: insertedData, error } = await supabase
                .from('marketing_access_tokens')
                .insert(newToken)
                .select()
                .single();

            if (error) throw error;

            // Atualizar lista local
            setTokens(prev => [insertedData, ...prev]);

            // Também salvar no localStorage como backup
            const allTokens = [insertedData, ...tokens];
            localStorage.setItem('marketing_access_tokens', JSON.stringify(allTokens));

            return insertedData;
        } catch (err: any) {
            console.error('Erro ao criar token:', err);
            
            // Fallback: criar apenas no localStorage
            const newToken: MarketingAccessToken = {
                id: `token_${Date.now()}`,
                token: generateAccessToken(),
                name: data.name,
                email: data.email,
                role: data.role,
                validity_period: data.validityPeriod,
                created_at: new Date().toISOString(),
                expires_at: calculateExpirationDate(data.validityPeriod),
                created_by: 'admin@neurobalance.pt',
                is_active: true,
                usage_count: 0,
                last_used_at: null
            };

            const updatedTokens = [newToken, ...tokens];
            localStorage.setItem('marketing_access_tokens', JSON.stringify(updatedTokens));
            setTokens(updatedTokens);

            toast.warning('Token criado localmente. A tabela no banco de dados pode não existir ainda.');
            return newToken;
        }
    }, [tokens]);

    // Deletar token
    const deleteToken = useCallback(async (tokenId: string): Promise<boolean> => {
        try {
            const { error } = await supabase
                .from('marketing_access_tokens')
                .delete()
                .eq('id', tokenId);

            if (error) throw error;

            // Atualizar lista local
            const updatedTokens = tokens.filter(t => t.id !== tokenId);
            setTokens(updatedTokens);
            localStorage.setItem('marketing_access_tokens', JSON.stringify(updatedTokens));

            return true;
        } catch (err: any) {
            console.error('Erro ao deletar token:', err);
            
            // Fallback: deletar apenas do localStorage
            const updatedTokens = tokens.filter(t => t.id !== tokenId);
            localStorage.setItem('marketing_access_tokens', JSON.stringify(updatedTokens));
            setTokens(updatedTokens);

            return true;
        }
    }, [tokens]);

    // Validar token (usado no login)
    const validateToken = useCallback(async (token: string, email: string): Promise<{
        isValid: boolean;
        tokenData?: MarketingAccessToken;
    }> => {
        try {
            // Tentar validar via função do Supabase
            const { data, error } = await supabase.rpc('validate_marketing_token', {
                p_token: token,
                p_email: email
            });

            if (error) throw error;

            if (data && data.length > 0 && data[0].is_valid) {
                return {
                    isValid: true,
                    tokenData: {
                        id: data[0].token_id,
                        token: token,
                        name: data[0].token_name,
                        email: data[0].token_email,
                        role: data[0].token_role as 'marketing_manager' | 'marketing_assistant',
                        validity_period: '',
                        created_at: '',
                        expires_at: data[0].expires_at,
                        created_by: '',
                        is_active: true,
                        usage_count: 0,
                        last_used_at: null
                    }
                };
            }

            // Se não encontrou no banco, tentar no localStorage
            return validateTokenFromLocalStorage(token, email);
        } catch (err: any) {
            console.error('Erro ao validar token via Supabase:', err);
            // Fallback para localStorage
            return validateTokenFromLocalStorage(token, email);
        }
    }, []);

    // Validar token do localStorage (fallback)
    const validateTokenFromLocalStorage = (token: string, email: string): {
        isValid: boolean;
        tokenData?: MarketingAccessToken;
    } => {
        const savedTokensStr = localStorage.getItem('marketing_access_tokens');
        if (!savedTokensStr) return { isValid: false };

        try {
            const savedTokens = JSON.parse(savedTokensStr);
            const foundToken = savedTokens.find((t: any) => {
                const tokenMatch = t.token === token;
                const emailMatch = t.email === email;
                const isActive = t.is_active !== false && t.isActive !== false;
                const expiresAt = new Date(t.expires_at || t.expiresAt);
                const notExpired = expiresAt > new Date();
                
                return tokenMatch && emailMatch && isActive && notExpired;
            });

            if (foundToken) {
                return {
                    isValid: true,
                    tokenData: {
                        id: foundToken.id,
                        token: foundToken.token,
                        name: foundToken.name,
                        email: foundToken.email,
                        role: foundToken.role,
                        validity_period: foundToken.validity_period || foundToken.validityPeriod,
                        created_at: foundToken.created_at || foundToken.createdAt,
                        expires_at: foundToken.expires_at || foundToken.expiresAt,
                        created_by: foundToken.created_by || foundToken.createdBy || 'admin@neurobalance.pt',
                        is_active: true,
                        usage_count: foundToken.usage_count || foundToken.usageCount || 0,
                        last_used_at: foundToken.last_used_at || foundToken.lastUsedAt || null
                    }
                };
            }
        } catch (e) {
            console.error('Erro ao processar localStorage:', e);
        }

        return { isValid: false };
    };

    // Carregar tokens na montagem
    useEffect(() => {
        fetchTokens();
    }, [fetchTokens]);

    return {
        tokens,
        loading,
        error,
        createToken,
        deleteToken,
        validateToken,
        refreshTokens: fetchTokens
    };
};

