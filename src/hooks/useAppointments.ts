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
      const { data, error } = await supabase
        .from('agendamentos')
        .insert([
          {
            titulo: appointment.titulo,
            data: appointment.data,
            hora: appointment.hora,
            id_cliente: appointment.id_cliente,
            tipo: appointment.tipo,
            notas: appointment.notas,
            estado: appointment.estado,
            terapeuta: appointment.terapeuta,
            cor: appointment.cor
          }
        ])
        .select(`
          *,
          clientes (
            nome,
            email,
            telefone
          )
        `)
        .single();

      if (error) throw error;
      
      // Adicionar o novo agendamento ao estado local com os dados do cliente
      const newAppointment = data as Appointment;
      setAppointments(prev => [...prev, newAppointment]);
      
      toast.success('Appointment added successfully');
      return data;
    } catch (error) {
      console.error('Erro ao adicionar agendamento:', error);
      toast.error('Failed to add appointment');
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
  }) => {
    try {
      const { data, error } = await supabase
        .from('agendamentos')
        .update({
          titulo: appointment.titulo,
          data: appointment.data,
          hora: appointment.hora,
          id_cliente: appointment.id_cliente,
          tipo: appointment.tipo,
          notas: appointment.notas,
          estado: appointment.estado,
          terapeuta: appointment.terapeuta
        })
        .eq('id', id)
        .select(`
          *,
          clientes (
            nome,
            email,
            telefone
          )
        `)
        .single();

      if (error) throw error;
      
      // Atualizar o agendamento no estado local com os dados do cliente
      const updatedAppointment = data as Appointment;
      setAppointments(prev => prev.map(app => 
        app.id === id ? updatedAppointment : app
      ));
      
      toast.success('Appointment updated successfully');
      return data;
    } catch (error) {
      console.error('Erro ao atualizar agendamento:', error);
      toast.error('Failed to update appointment');
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
      toast.success('Appointment deleted successfully');
    } catch (err) {
      console.error('Error deleting appointment:', err);
      toast.error('Failed to delete appointment');
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