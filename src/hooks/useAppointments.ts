import { useCallback, useEffect, useSyncExternalStore } from 'react';
import type { RealtimeChannel, SupabaseClient } from '@supabase/supabase-js';

import { useSupabaseClient } from '@/hooks/useSupabaseClient';
import { toast } from 'sonner';
import { Database } from '@/integrations/supabase/types';
import { useActivityLogger } from '@/hooks/useActivityLogger';
import { format } from 'date-fns';

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

const formatDayMonth = (date: string) => {
  try {
    return format(new Date(`${date}T00:00:00`), 'dd/MM');
  } catch {
    return date;
  }
};

const sanitizeClientId = (val: unknown): number | null => {
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

interface StoreState {
  appointments: Appointment[];
  isLoading: boolean;
  error: string | null;
}

let storeState: StoreState = { appointments: loadFromCache(), isLoading: true, error: null };
const listeners = new Set<() => void>();

const notify = () => {
  listeners.forEach(listener => listener());
};

const setStore = (patch: Partial<StoreState>) => {
  storeState = { ...storeState, ...patch };
  notify();
};

const setAppointments = (updater: (prev: Appointment[]) => Appointment[]) => {
  const next = updater(storeState.appointments);
  storeState = { ...storeState, appointments: next };
  saveToCache(next);
  notify();
};

let activeFetch: Promise<void> | null = null;
let hasInitialFetch = false;

const fetchAppointments = async (supabase: SupabaseClient): Promise<void> => {
  if (activeFetch) return activeFetch;
  activeFetch = (async () => {
    try {
      if (!hasInitialFetch) setStore({ isLoading: true });
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

      const cached = loadFromCache();
      const localOnly = cached.filter(c => typeof c.id === 'string' || (typeof c.id === 'number' && c.id < 0 && !allFetched.some(f => f.id === c.id)));
      const merged = [...allFetched, ...localOnly];
      hasInitialFetch = true;
      setStore({ appointments: merged, error: null, isLoading: false });
      saveToCache(merged);
    } catch (err) {
      console.warn('Falha ao carregar agendamentos do Supabase, recorrendo ao cache local:', err);
      setStore({ error: 'Error loading appointments', isLoading: false });
    } finally {
      activeFetch = null;
    }
  })();
  return activeFetch;
};

let realtimeChannel: RealtimeChannel | null = null;

const ensureRealtime = (supabase: SupabaseClient) => {
  if (realtimeChannel) return;
  realtimeChannel = supabase
    .channel('agendamentos-changes')
    .on(
      'postgres_changes',
      { event: '*', schema: 'public', table: 'agendamentos' },
      () => {
        void fetchAppointments(supabase);
      }
    )
    .subscribe();
};

export function useAppointments() {
  const supabase = useSupabaseClient();
  const { logActivity } = useActivityLogger();

  const subscribe = useCallback((onStoreChange: () => void) => {
    listeners.add(onStoreChange);
    return () => {
      listeners.delete(onStoreChange);
    };
  }, []);

  const getSnapshot = useCallback(() => storeState, []);

  const { appointments, isLoading, error } = useSyncExternalStore(subscribe, getSnapshot, getSnapshot);

  useEffect(() => {
    void fetchAppointments(supabase);
    ensureRealtime(supabase);
  }, [supabase]);

  const refetch = useCallback(() => fetchAppointments(supabase), [supabase]);

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
      setAppointments(prev => [...prev, newAppointment]);

      toast.success('Agendamento adicionado com sucesso');
      logActivity(
        'appointment_created',
        'agendamento',
        newAppointment?.id,
        `Agendamento de ${formatDayMonth(appointment.data)} às ${appointment.hora} criado${newAppointment?.clientes?.nome ? ` (${newAppointment.clientes.nome})` : ''}`
      );
      return data;
    } catch (error) {
      console.warn('Erro ao inserir agendamento no Supabase, salvando localmente:', error);

      const fallbackAppt: Appointment = {
        id: -Date.now(),
        criado_em: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        ...appointmentToInsert,
        clientes: null
      };

      setAppointments(prev => [...prev, fallbackAppt]);

      toast.success('Agendamento salvo localmente');
      return fallbackAppt;
    }
  }, [supabase, logActivity]);

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
      setAppointments(prev => [...prev, ...newAppointments]);

      toast.success(`${inserts.length} agendamentos adicionados com sucesso`);
      logActivity(
        'appointment_created',
        'agendamento',
        undefined,
        `${inserts.length} agendamentos criados em lote`
      );
      return data;
    } catch (error) {
      console.warn('Erro ao adicionar lote no Supabase, salvando localmente:', error);

      const fallbackAppts: Appointment[] = inserts.map((ins, idx) => ({
        id: -Date.now() - idx,
        criado_em: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        ...ins,
        clientes: null
      }));

      setAppointments(prev => [...prev, ...fallbackAppts]);

      toast.success(`${inserts.length} agendamentos salvos localmente`);
      return fallbackAppts;
    }
  }, [supabase, logActivity]);

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
    const previous = storeState.appointments.find(app => app.id === id);
    const when = previous?.data ? ` de ${formatDayMonth(previous.data)}${previous.hora ? ` às ${previous.hora}` : ''}` : '';
    const who = previous?.clientes?.nome || previous?.titulo || '';

    try {
      const updateData: Partial<Database['public']['Tables']['agendamentos']['Update']> = {};
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
      setAppointments(prev =>
        prev.map(app => (app.id === id ? (updatedAppointment || { ...app, ...updateData }) : app))
      );

      toast.success('Agendamento atualizado com sucesso');
      if (appointment.estado && previous && previous.estado !== appointment.estado) {
        logActivity(
          'appointment_status_changed',
          'agendamento',
          id,
          `Agendamento${when}${who ? ` (${who})` : ''} marcado como ${appointment.estado}`
        );
      } else {
        logActivity('appointment_updated', 'agendamento', id, `Agendamento${when}${who ? ` (${who})` : ''} atualizado`);
      }
      return data;
    } catch (error) {
      console.error('Erro ao atualizar agendamento:', error);
      setAppointments(prev =>
        prev.map(app =>
          app.id === id ? { ...app, ...appointment, id_cliente: sanitizeClientId(appointment.id_cliente) } : app
        )
      );
      toast.success('Agendamento atualizado localmente');
      return null;
    }
  }, [supabase, logActivity]);

  const deleteAppointment = useCallback(async (id: number) => {
    try {
      const { error: deleteError } = await supabase
        .from('agendamentos')
        .delete()
        .eq('id', id);

      if (deleteError) {
        console.warn('Aviso Supabase ao eliminar:', deleteError);
      }

      setAppointments(prev => prev.filter(appointment => appointment.id !== id));
      toast.success('Agendamento eliminado com sucesso');
      const target = storeState.appointments.find(app => app.id === id);
      const when = target?.data ? ` de ${formatDayMonth(target.data)}${target.hora ? ` às ${target.hora}` : ''}` : '';
      const who = target?.clientes?.nome || target?.titulo || '';
      logActivity('appointment_deleted', 'agendamento', id, `Agendamento${when}${who ? ` (${who})` : ''} eliminado`);
    } catch (err) {
      console.error('Erro ao eliminar agendamento:', err);
      setAppointments(prev => prev.filter(appointment => appointment.id !== id));
      toast.success('Agendamento eliminado localmente');
    }
  }, [supabase, logActivity]);

  return {
    appointments,
    isLoading,
    error,
    addAppointment,
    addAppointmentsBatch,
    updateAppointment,
    deleteAppointment,
    refetch,
  };
}

export default useAppointments;
