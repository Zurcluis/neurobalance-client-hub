import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface Admin {
  id: string;
  nome: string;
  email: string;
  data_nascimento: string;
  morada: string;
  contacto: string;
  role: 'admin' | 'assistant';
  ativo: boolean;
  created_at: string;
  updated_at?: string;
  last_login?: string;
}

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
  const [admins, setAdmins] = useState<Admin[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchAdmins = async () => {
    try {
      setIsLoading(true);
      setError(null);

      const { data, error } = await supabase.rpc('get_admins');

      if (error) {
        console.error('Erro ao buscar administrativas:', error);
        setError(error.message);
        return;
      }

      setAdmins(data || []);
    } catch (err) {
      console.error('Erro ao buscar administrativas:', err);
      setError(err instanceof Error ? err.message : 'Erro desconhecido');
    } finally {
      setIsLoading(false);
    }
  };

  const createAdmin = async (adminData: AdminFormData): Promise<boolean> => {
    try {
      const { data, error } = await supabase.rpc('create_admin', {
        p_nome: adminData.nome,
        p_email: adminData.email,
        p_data_nascimento: adminData.data_nascimento,
        p_morada: adminData.morada,
        p_contacto: adminData.contacto,
        p_role: adminData.role,
        p_ativo: adminData.ativo
      });

      if (error) {
        console.error('Erro ao criar administrativa:', error);
        toast.error(`Erro ao criar administrativa: ${error.message}`);
        return false;
      }

      toast.success('Administrativa criada com sucesso!');
      await fetchAdmins(); // Recarregar lista
      return true;
    } catch (err) {
      console.error('Erro ao criar administrativa:', err);
      toast.error('Erro ao criar administrativa');
      return false;
    }
  };

  const updateAdmin = async (id: string, adminData: AdminFormData): Promise<boolean> => {
    try {
      const { data, error } = await supabase.rpc('update_admin', {
        p_id: id,
        p_nome: adminData.nome,
        p_email: adminData.email,
        p_data_nascimento: adminData.data_nascimento,
        p_morada: adminData.morada,
        p_contacto: adminData.contacto,
        p_role: adminData.role,
        p_ativo: adminData.ativo
      });

      if (error) {
        console.error('Erro ao atualizar administrativa:', error);
        toast.error(`Erro ao atualizar administrativa: ${error.message}`);
        return false;
      }

      toast.success('Administrativa atualizada com sucesso!');
      await fetchAdmins(); // Recarregar lista
      return true;
    } catch (err) {
      console.error('Erro ao atualizar administrativa:', err);
      toast.error('Erro ao atualizar administrativa');
      return false;
    }
  };

  const deleteAdmin = async (id: string): Promise<boolean> => {
    try {
      const { data, error } = await supabase.rpc('delete_admin', {
        p_id: id
      });

      if (error) {
        console.error('Erro ao eliminar administrativa:', error);
        toast.error(`Erro ao eliminar administrativa: ${error.message}`);
        return false;
      }

      toast.success('Administrativa eliminada com sucesso!');
      await fetchAdmins(); // Recarregar lista
      return true;
    } catch (err) {
      console.error('Erro ao eliminar administrativa:', err);
      toast.error('Erro ao eliminar administrativa');
      return false;
    }
  };

  const getAdminStats = () => {
    const totalAdmins = admins.length;
    const activeAdmins = admins.filter(admin => admin.ativo).length;
    const adminRoles = admins.filter(admin => admin.role === 'admin').length;
    const assistantRoles = admins.filter(admin => admin.role === 'assistant').length;

    return {
      total: totalAdmins,
      active: activeAdmins,
      inactive: totalAdmins - activeAdmins,
      admins: adminRoles,
      assistants: assistantRoles
    };
  };

  useEffect(() => {
    fetchAdmins();
  }, []);

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
