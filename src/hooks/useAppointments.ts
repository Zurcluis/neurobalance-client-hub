import { useState, useEffect, useCallback } from 'react';
import { useSupabaseClient } from '@/hooks/useSupabaseClient';
import { toast } from 'sonner';
import { Database } from '@/integrations/supabase/types';

type Appointment = Database['public']['Tables']['agendamentos']['Row'] & {
  clientes: {
    nome: string;
    email: string;
    telefone: string;
  };
};

type NewAppointment = Omit<Database['public']['Tables']['agendamentos']['Insert'], 'id' | 'criado_em' | 'updated_at'>;
type UpdateAppointment = Partial<NewAppointment>;

export function useAppointments() {
  const supabase = useSupabaseClient();
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchAppointments = useCallback(async () => {
      try {
        setIsLoading(true);
        const { data, error: supabaseError } = await supabase
          .from('agendamentos')
          .select(`
            *,
            clientes (
              nome,
              email,
              telefone
            )
          `)
          .order('data', { ascending: true });

        if (supabaseError) {
          throw supabaseError;
        }

        setAppointments(data as Appointment[]);
        setError(null);
      } catch (err) {
        setError('Error loading appointments');
        console.error('Error loading appointments:', err);
        toast.error('Failed to load appointments');
      } finally {
        setIsLoading(false);
      }
  }, [supabase]);

  // Load appointments from Supabase
  useEffect(() => {
    fetchAppointments();
  }, [fetchAppointments]);

  // Add new appointment
  const addAppointment = useCallback(async (appointment: {
    titulo: string;
    data: string;
    hora: string;
    id_cliente: number | null;
    tipo: string;
    notas?: string;
    estado: string;
    terapeuta?: string;
    cor?: string;
  }) => {
    try {
      const appointmentToInsert = {
        titulo: appointment.titulo,
        data: appointment.data,
        hora: appointment.hora,
        id_cliente: appointment.id_cliente,
        tipo: appointment.tipo,
        notas: appointment.notas || '',
        estado: appointment.estado,
        terapeuta: appointment.terapeuta || '',
        cor: appointment.cor || '#3B82F6'
      };

      console.log('Inserindo agendamento:', appointmentToInsert);

      const { data, error } = await supabase
        .from('agendamentos')
        .insert([appointmentToInsert])
        .select(`
          *,
          clientes (
            id,
            id_manual,
            nome,
            email,
            telefone
          )
        `)
        .single();

      if (error) {
        console.error('Erro do Supabase:', error);
        throw new Error(error.message || 'Erro ao inserir agendamento na base de dados');
      }
      
      const newAppointment = data as Appointment;
      setAppointments(prev => [...prev, newAppointment]);
      
      toast.success('Agendamento adicionado com sucesso');
      return data;
    } catch (error: any) {
      console.error('Erro ao adicionar agendamento:', error);
      const errorMsg = error?.message || 'Erro desconhecido ao adicionar agendamento';
      toast.error(`Erro: ${errorMsg}`);
      throw error;
    }
  }, [supabase]);

  // Update appointment
  const updateAppointment = useCallback(async (id: number, appointment: {
    titulo?: string;
    data?: string;
    hora?: string;
    id_cliente?: number;
    tipo?: string;
    notas?: string;
    estado?: string;
    terapeuta?: string;
    cor?: string;
  }) => {
    try {
      // Primeiro fazer o update
      const updateData: any = {};
      if (appointment.titulo !== undefined) updateData.titulo = appointment.titulo;
      if (appointment.data !== undefined) updateData.data = appointment.data;
      if (appointment.hora !== undefined) updateData.hora = appointment.hora;
      if (appointment.id_cliente !== undefined) updateData.id_cliente = appointment.id_cliente;
      if (appointment.tipo !== undefined) updateData.tipo = appointment.tipo;
      if (appointment.notas !== undefined) updateData.notas = appointment.notas;
      if (appointment.estado !== undefined) updateData.estado = appointment.estado;
      if (appointment.terapeuta !== undefined) updateData.terapeuta = appointment.terapeuta;
      if (appointment.cor !== undefined) updateData.cor = appointment.cor;

      const { error: updateError } = await supabase
        .from('agendamentos')
        .update(updateData)
        .eq('id', id);

      if (updateError) throw updateError;

      // Depois buscar o agendamento atualizado
      const { data, error: selectError } = await supabase
        .from('agendamentos')
        .select(`
          *,
          clientes (
            nome,
            email,
            telefone
          )
        `)
        .eq('id', id)
        .maybeSingle();

      if (selectError) throw selectError;
      
      if (data) {
        // Atualizar o agendamento no estado local com os dados do cliente
        const updatedAppointment = data as Appointment;
        setAppointments(prev => prev.map(app => 
          app.id === id ? updatedAppointment : app
        ));
        
        toast.success('Agendamento atualizado com sucesso');
        return data;
      } else {
        // Se não encontrou, atualizar localmente mesmo assim
        setAppointments(prev => prev.map(app => 
          app.id === id ? { ...app, ...updateData } : app
        ));
        toast.success('Agendamento atualizado com sucesso');
        return null;
      }
    } catch (error) {
      console.error('Erro ao atualizar agendamento:', error);
      toast.error('Erro ao atualizar agendamento');
      throw error;
    }
  }, [supabase]);

  // Delete appointment
  const deleteAppointment = useCallback(async (id: number) => {
    try {
      const { error: deleteError } = await supabase
        .from('agendamentos')
        .delete()
        .eq('id', id);

      if (deleteError) {
        throw deleteError;
      }

      setAppointments(prev => prev.filter(appointment => appointment.id !== id));
      toast.success('Agendamento eliminado com sucesso');
    } catch (err) {
      console.error('Erro ao eliminar agendamento:', err);
      toast.error('Falha ao eliminar agendamento');
      throw err;
    }
  }, [supabase]);

  return {
    appointments,
    isLoading,
    error,
    addAppointment,
    updateAppointment,
    deleteAppointment,
    refetch: fetchAppointments,
  };
}

export default useAppointments; 