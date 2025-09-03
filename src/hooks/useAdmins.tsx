import { useState, useEffect, useCallback } from 'react';
import { useSupabaseClient } from './useSupabaseClient';
import { toast } from 'sonner';
import { Database } from '@/types/supabase';

export type Admin = Database['public']['Tables']['admins']['Row'];
export type NewAdmin = Database['public']['Tables']['admins']['Insert'];
export type UpdateAdmin = Database['public']['Tables']['admins']['Update'];

export interface AdminFormData {
  nome: string;
  email: string;
  data_nascimento: string;
  morada: string;
  contacto: string;
  role: 'admin' | 'assistant';
  ativo: boolean;
}

export const useAdmins = () => {
    const supabase = useSupabaseClient();
    const [admins, setAdmins] = useState < Admin[] > ([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState < string | null > (null);

    const fetchAdmins = useCallback(async () => {
        try {
            setIsLoading(true);
            const {
                data,
                error
            } = await supabase.from('admins').select('*');
            if (error) throw error;
            setAdmins(data || []);
        } catch (err: any) {
            console.error('Erro ao buscar administrativas:', err);
            setError(err instanceof Error ? err.message : 'Erro desconhecido');
        } finally {
            setIsLoading(false);
        }
    }, [supabase]);

    const createAdmin = useCallback(async (newAdmin: NewAdmin) => {
        try {
            const {
                data,
                error
            } = await supabase.from('admins').insert(newAdmin).select();
            if (error) throw error;
            setAdmins(prev => [...prev, ...data]);
            toast.success("Administrador adicionado com sucesso!");
            return true;
        } catch (err: any) {
            console.error('Erro ao criar administrativa:', err);
            toast.error(err.message || "Não foi possível adicionar o administrador.");
            return false;
        }
    }, [supabase]);

    const updateAdmin = useCallback(async (id: string, updatedAdmin: UpdateAdmin) => {
        try {
            const {
                data,
                error
            } = await supabase.from('admins').update(updatedAdmin).eq('id', id).select();
            if (error) throw error;
            setAdmins(prev => prev.map(admin => admin.id === id ? data[0] : admin));
            toast.success("Administrador atualizado com sucesso!");
            return true;
        } catch (err: any) {
            console.error('Erro ao atualizar administrativa:', err);
            toast.error(err.message || "Não foi possível atualizar o administrador.");
            return false;
        }
    }, [supabase]);

    const deleteAdmin = useCallback(async (id: string) => {
        try {
            const {
                error
            } = await supabase.from('admins').delete().eq('id', id);
            if (error) throw error;
            setAdmins(prev => prev.filter(admin => admin.id !== id));
            toast.success("Administrador removido com sucesso!");
            return true;
        } catch (err: any) {
            console.error('Erro ao eliminar administrativa:', err);
            toast.error(err.message || "Não foi possível remover o administrador.");
            return false;
        }
    }, [supabase]);


    const getAdminStats = useCallback(async () => {
        try {
            const {
                data,
                error
            } = await supabase.rpc('get_admin_stats');
            if (error) throw error;
            return data;
        } catch (err: any) {
            console.error("Error fetching admin stats:", err);
            return null;
        }
    }, [supabase]);


    useEffect(() => {
        fetchAdmins();
    }, [fetchAdmins]);

    return {
        admins,
        isLoading,
        error,
        createAdmin,
        updateAdmin,
        deleteAdmin,
        refreshAdmins: fetchAdmins,
        getAdminStats
    };
};
