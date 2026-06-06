import { useState, useEffect, useCallback } from 'react';
import { useSupabaseClient } from './useSupabaseClient';
import { toast } from 'sonner';

export interface AdminToken {
  id: string;
  admin_id: string;
  token: string;
  expires_at: string;
  is_active: boolean;
  created_at: string;
}

export const useAdminTokens = () => {
    const supabase = useSupabaseClient();
    const [tokens, setTokens] = useState<AdminToken[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    const fetchTokens = useCallback(async () => {
        try {
            setIsLoading(true);
            const { data, error } = await supabase.from('admin_access_tokens').select('*');
            if (error) throw error;
            setTokens(data || []);
        } catch (err: any) {
            console.error('Erro ao buscar tokens:', err);
            toast.error('Erro ao carregar tokens de acesso.');
        } finally {
            setIsLoading(false);
        }
    }, [supabase]);

    const createToken = useCallback(async (adminId: string, expirationDate: string) => {
        try {
            // Generate a random token
            const randomString = Array.from(crypto.getRandomValues(new Uint8Array(16)))
                .map(b => b.toString(16).padStart(2, '0')).join('');
            const tokenValue = `adm_tok_${randomString}`;

            const insertData = {
                admin_id: adminId,
                token: tokenValue,
                expires_at: expirationDate,
                is_active: true
            };

            const { data, error } = await supabase.from('admin_access_tokens').insert(insertData).select();
            if (error) throw error;
            
            if (data && data.length > 0) {
                setTokens(prev => [...prev, data[0]]);
                toast.success('Token criado com sucesso!');
                return data[0];
            }
            return null;
        } catch (err: any) {
            console.error('Erro ao criar token:', err);
            toast.error(err.message || 'Não foi possível criar o token.');
            return null;
        }
    }, [supabase]);

    const updateTokenStatus = useCallback(async (tokenId: string, isActive: boolean) => {
        try {
            const { error } = await supabase.from('admin_access_tokens').update({ is_active: isActive }).eq('id', tokenId);
            if (error) throw error;
            
            setTokens(prev => prev.map(t => t.id === tokenId ? { ...t, is_active: isActive } : t));
            toast.success(isActive ? 'Token ativado!' : 'Token desativado!');
            return true;
        } catch (err: any) {
            console.error('Erro ao atualizar status do token:', err);
            toast.error('Não foi possível atualizar o token.');
            return false;
        }
    }, [supabase]);

    const deleteToken = useCallback(async (tokenId: string) => {
        try {
            const { error } = await supabase.from('admin_access_tokens').delete().eq('id', tokenId);
            if (error) throw error;
            
            setTokens(prev => prev.filter(t => t.id !== tokenId));
            toast.success('Token eliminado com sucesso!');
            return true;
        } catch (err: any) {
            console.error('Erro ao eliminar token:', err);
            toast.error('Não foi possível eliminar o token.');
            return false;
        }
    }, [supabase]);

    useEffect(() => {
        fetchTokens();
    }, [fetchTokens]);

    return {
        tokens,
        isLoading,
        createToken,
        updateTokenStatus,
        deleteToken,
        refreshTokens: fetchTokens
    };
};
