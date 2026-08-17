import { useState, useEffect, useCallback } from 'react';

import { useSupabaseClient } from '@/hooks/useSupabaseClient';
import { toast } from 'sonner';
import { Database } from '@/integrations/supabase/types';

export type Appointment = Database['public']['Tables']['agendamentos']['Row'] & {
  clientes: {
    nome: string;
    email: string;
    telefone: string;
    id_manual?: string;
  } | null;
};

export type NewAppointment = Omit<Database['public']['Tables']['agendamentos']['Insert'], 'id' | 'criado_em' | 'updated_at'>;

const LOCAL_STORAGE_KEY = 'neurobalance_agendamentos_cache';

// Helper to sanitize id_cliente so 0, NaN, "", or invalid numbers become null
const sanitizeClientId = (val: any): number | null => {
  if (val === null || val === undefined || val === '' || val === 'null') return null;
  const num = Number(val);
  return !isNaN(num) && num > 0 ? num : null;
};

const loadFromCache = (): Appointment[] => {
  try {
    const cached = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (cached) {
      const parsed = JSON.parse(cached);
      if (Array.isArray(parsed)) return parsed;
    }
  } catch (e) {
    console.error('Erro ao ler cache do localStorage:', e);
  }
  return [];
};

const saveToCache = (data: Appointment[]) => {
  try {
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(data));
  } catch (e) {
    console.error('Erro ao salvar no cache do localStorage:', e);
  }
};

export function useAppointments() {
  const supabase = useSupabaseClient();
  const [appointments, setAppointments] = useState<Appointment[]>(() => loadFromCache());
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchAppointments = useCallback(async () => {
    try {
      setIsLoading(true);
      let allFetched: Appointment[] = [];
      let page = 0;
      const pageSize = 1000;
      let hasMore = true;

      while (hasMore) {
        const from = page * pageSize;
        const to = from + pageSize - 1;

        const { data, error: supabaseError } = await supabase
          .from('agendamentos')
          .select(`
              *,
              clientes (
                nome,
                email,
                telefone,
                id_manual
              )
            `)
          .order('data', { ascending: true })
          .range(from, to);

        if (supabaseError) {
          throw supabaseError;
        }

        if (data && data.length > 0) {
          allFetched = allFetched.concat(data as Appointment[]);
          if (data.length < pageSize) {
            hasMore = false;
          } else {
            page++;
          }
        } else {
          hasMore = false;
        }
      }

      // Mesclar agendamentos do Supabase com agendamentos locais porventura ainda não sincronizados
      const cached = loadFromCache();
      const localOnly = cached.filter(c => typeof c.id === 'string' || (typeof c.id === 'number' && c.id < 0 && !allFetched.some(f => f.id === c.id)));
      const merged = [...allFetched, ...localOnly];
      setAppointments(merged);
      saveToCache(merged);
      setError(null);
    } catch (err) {
      console.warn('Falha ao carregar agendamentos do Supabase, recorrendo ao cache local:', err);
      const cached = loadFromCache();
      if (cached.length > 0) {
        setAppointments(cached);
      }
      setError('Error loading appointments');
    } finally {
      setIsLoading(false);
    }
  }, [supabase]);

  // Load appointments and subscribe to real-time changes
  useEffect(() => {
    fetchAppointments();

    const channelId = Math.random().toString(36).substring(2, 9);
    const channel = supabase
      .channel(`agendamentos-changes_${channelId}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'agendamentos' },
        () => {
          console.log('Alterações detectadas na tabela agendamentos');
          fetchAppointments();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchAppointments, supabase]);

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
    const cleanClientId = sanitizeClientId(appointment.id_cliente);
    const appointmentToInsert = {
      titulo: appointment.titulo,
      data: appointment.data,
      hora: appointment.hora,
      id_cliente: cleanClientId,
      tipo: appointment.tipo,
      notas: appointment.notas || '',
      estado: appointment.estado,
      terapeuta: appointment.terapeuta || '',
      cor: appointment.cor || '#3B82F6'
    };

    console.log('Inserindo agendamento:', appointmentToInsert);

    try {
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
      setAppointments(prev => {
        const next = [...prev, newAppointment];
        saveToCache(next);
        return next;
      });

      toast.success('Agendamento adicionado com sucesso');
      return data;
    } catch (error: any) {
      console.warn('Erro ao inserir agendamento no Supabase, salvando localmente:', error);
      
      // Fallback local se o Supabase falhar
      const fallbackAppt: Appointment = {
        id: -Date.now() as any,
        criado_em: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        ...appointmentToInsert,
        clientes: null
      };

      setAppointments(prev => {
        const next = [...prev, fallbackAppt];
        saveToCache(next);
        return next;
      });

      toast.success('Agendamento salvo localmente');
      return fallbackAppt;
    }
  }, [supabase]);

  // Add multiple appointments (batch)
  const addAppointmentsBatch = useCallback(async (appointmentsList: Array<{
    titulo: string;
    data: string;
    hora: string;
    id_cliente: number | null;
    tipo: string;
    notas?: string;
    estado: string;
    terapeuta?: string;
    cor?: string;
  }>) => {
    const inserts = appointmentsList.map(apt => ({
      titulo: apt.titulo,
      data: apt.data,
      hora: apt.hora,
      id_cliente: sanitizeClientId(apt.id_cliente),
      tipo: apt.tipo,
      notas: apt.notas || '',
      estado: apt.estado,
      terapeuta: apt.terapeuta || '',
      cor: apt.cor || '#3B82F6'
    }));

    console.log('Inserindo lote de agendamentos:', inserts);

    try {
      const { data, error } = await supabase
        .from('agendamentos')
        .insert(inserts)
        .select(`
          *,
          clientes (
            id,
            id_manual,
            nome,
            email,
            telefone
          )
        `);

      if (error) {
        console.error('Erro do Supabase ao inserir lote:', error);
        throw new Error(error.message || 'Erro ao inserir lote de agendamentos na base de dados');
      }

      const newAppointments = data as Appointment[];
      setAppointments(prev => {
        const next = [...prev, ...newAppointments];
        saveToCache(next);
        return next;
      });

      toast.success(`${inserts.length} agendamentos adicionados com sucesso`);
      return data;
    } catch (error: any) {
      console.warn('Erro ao adicionar lote no Supabase, salvando localmente:', error);
      
      const fallbackAppts: Appointment[] = inserts.map((ins, idx) => ({
        id: (-Date.now() - idx) as any,
        criado_em: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        ...ins,
        clientes: null
      }));

      setAppointments(prev => {
        const next = [...prev, ...fallbackAppts];
        saveToCache(next);
        return next;
      });

      toast.success(`${inserts.length} agendamentos salvos localmente`);
      return fallbackAppts;
    }
  }, [supabase]);

  // Update appointment
  const updateAppointment = useCallback(async (id: number, appointment: {
    titulo?: string;
    data?: string;
    hora?: string;
    id_cliente?: number | null;
    tipo?: string;
    notas?: string;
    estado?: string;
    terapeuta?: string;
    cor?: string;
  }) => {
    try {
      const updateData: any = {};
      if (appointment.titulo !== undefined) updateData.titulo = appointment.titulo;
      if (appointment.data !== undefined) updateData.data = appointment.data;
      if (appointment.hora !== undefined) updateData.hora = appointment.hora;
      if (appointment.id_cliente !== undefined) updateData.id_cliente = sanitizeClientId(appointment.id_cliente);
      if (appointment.tipo !== undefined) updateData.tipo = appointment.tipo;
      if (appointment.notas !== undefined) updateData.notas = appointment.notas;
      if (appointment.estado !== undefined) updateData.estado = appointment.estado;
      if (appointment.terapeuta !== undefined) updateData.terapeuta = appointment.terapeuta;
      if (appointment.cor !== undefined) updateData.cor = appointment.cor;

      const { error: updateError } = await supabase
        .from('agendamentos')
        .update(updateData)
        .eq('id', id);

      if (updateError) console.warn('Aviso Supabase ao atualizar:', updateError);

      const { data } = await supabase
        .from('agendamentos')
        .select(`
          *,
          clientes (
            nome,
            email,
            telefone,
            id_manual
          )
        `)
        .eq('id', id)
        .maybeSingle();

      const updatedAppointment = data as Appointment;
      setAppointments(prev => {
        const next = prev.map(app =>
          app.id === id ? (updatedAppointment || { ...app, ...updateData }) : app
        );
        saveToCache(next);
        return next;
      });

      toast.success('Agendamento atualizado com sucesso');
      return data;
    } catch (error) {
      console.error('Erro ao atualizar agendamento:', error);
      setAppointments(prev => {
        const next = prev.map(app =>
          app.id === id ? { ...app, ...appointment, id_cliente: sanitizeClientId(appointment.id_cliente) } : app
        );
        saveToCache(next);
        return next;
      });
      toast.success('Agendamento atualizado localmente');
      return null;
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
        console.warn('Aviso Supabase ao eliminar:', deleteError);
      }

      setAppointments(prev => {
        const next = prev.filter(appointment => appointment.id !== id);
        saveToCache(next);
        return next;
      });
      toast.success('Agendamento eliminado com sucesso');
    } catch (err) {
      console.error('Erro ao eliminar agendamento:', err);
      setAppointments(prev => {
        const next = prev.filter(appointment => appointment.id !== id);
        saveToCache(next);
        return next;
      });
      toast.success('Agendamento eliminado localmente');
    }
  }, [supabase]);

  return {
    appointments,
    isLoading,
    error,
    addAppointment,
    addAppointmentsBatch,
    updateAppointment,
    deleteAppointment,
    refetch: fetchAppointments,
  };
}

export default useAppointments;