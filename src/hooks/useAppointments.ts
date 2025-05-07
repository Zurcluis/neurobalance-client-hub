import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
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
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Load appointments from Supabase
  useEffect(() => {
    const loadAppointments = async () => {
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
    };

    loadAppointments();
  }, []);

  // Add new appointment
  const addAppointment = useCallback(async (appointment: NewAppointment) => {
    try {
      const { data, error: insertError } = await supabase
        .from('agendamentos')
        .insert([appointment])
        .select(`
          *,
          clientes (
            nome,
            email,
            telefone
          )
        `)
        .single();

      if (insertError) {
        throw insertError;
      }

      setAppointments(prev => [...prev, data as Appointment]);
      toast.success('Appointment added successfully');
      return data;
    } catch (err) {
      console.error('Error adding appointment:', err);
      toast.error('Failed to add appointment');
      throw err;
    }
  }, []);

  // Update appointment
  const updateAppointment = useCallback(async (id: number, updates: UpdateAppointment) => {
    try {
      const { data, error: updateError } = await supabase
        .from('agendamentos')
        .update(updates)
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

      if (updateError) {
        throw updateError;
      }

      setAppointments(prev => prev.map(appointment => 
        appointment.id === id ? data as Appointment : appointment
      ));
      toast.success('Appointment updated successfully');
      return data;
    } catch (err) {
      console.error('Error updating appointment:', err);
      toast.error('Failed to update appointment');
      throw err;
    }
  }, []);

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
  }, []);

  return {
    appointments,
    isLoading,
    error,
    addAppointment,
    updateAppointment,
    deleteAppointment
  };
}

export default useAppointments; 