import { useState, useEffect, useCallback, useMemo } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { logger } from '@/lib/logger';
import type {
  ClientAvailability,
  NewClientAvailability,
  UpdateClientAvailability,
  AvailabilityFilters,
  AvailabilitySortOptions,
  DiaSemana,
  AvailabilityStats,
} from '@/types/availability';

export const useClientAvailability = (clienteId?: number) => {
  const [availabilities, setAvailabilities] = useState<ClientAvailability[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // =====================================================
  // FETCH AVAILABILITIES
  // =====================================================

  const fetchAvailabilities = useCallback(
    async (filters?: AvailabilityFilters, sortOptions?: AvailabilitySortOptions) => {
      if (!clienteId) return;

      setIsLoading(true);
      setError(null);

      try {
        let query = supabase
          .from('client_availability')
          .select('*')
          .eq('cliente_id', clienteId);

        // Aplicar filtros
        if (filters?.status && filters.status.length > 0) {
          query = query.in('status', filters.status);
        }

        if (filters?.dias_semana && filters.dias_semana.length > 0) {
          query = query.in('dia_semana', filters.dias_semana);
        }

        if (filters?.preferencia && filters.preferencia.length > 0) {
          query = query.in('preferencia', filters.preferencia);
        }

        if (filters?.data_inicio) {
          query = query.or(`valido_de.is.null,valido_de.gte.${filters.data_inicio}`);
        }

        if (filters?.data_fim) {
          query = query.or(`valido_ate.is.null,valido_ate.lte.${filters.data_fim}`);
        }

        if (filters?.apenas_validos) {
          const hoje = new Date().toISOString().split('T')[0];
          query = query.or(`valido_ate.is.null,valido_ate.gte.${hoje}`);
        }

        // Aplicar ordenação
        if (sortOptions) {
          const { sortBy, order } = sortOptions;
          query = query.order(sortBy, { ascending: order === 'asc' });
        } else {
          // Ordenação padrão
          query = query.order('dia_semana', { ascending: true });
          query = query.order('hora_inicio', { ascending: true });
        }

        const { data, error: queryError } = await query;

        if (queryError) throw queryError;

        setAvailabilities(data || []);
        logger.log(`Loaded ${data?.length || 0} availabilities for client ${clienteId}`);
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Erro ao carregar disponibilidades';
        setError(errorMessage);
        logger.error('Error fetching availabilities:', err);
        toast.error(errorMessage);
      } finally {
        setIsLoading(false);
      }
    },
    [clienteId]
  );

  // =====================================================
  // ADD AVAILABILITY
  // =====================================================

  const addAvailability = useCallback(
    async (newAvailability: NewClientAvailability) => {
      if (!clienteId) {
        toast.error('Cliente não identificado');
        return null;
      }

      setIsLoading(true);
      setError(null);

      try {
        const { data, error: insertError } = await supabase
          .from('client_availability')
          .insert({ ...newAvailability, cliente_id: clienteId })
          .select()
          .single();

        if (insertError) throw insertError;

        setAvailabilities((prev) => [...prev, data]);
        toast.success('Disponibilidade adicionada com sucesso!');
        logger.log('Availability added:', data);
        return data;
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Erro ao adicionar disponibilidade';
        setError(errorMessage);
        logger.error('Error adding availability:', err);
        toast.error(errorMessage);
        return null;
      } finally {
        setIsLoading(false);
      }
    },
    [clienteId]
  );

  // =====================================================
  // UPDATE AVAILABILITY
  // =====================================================

  const updateAvailability = useCallback(
    async (id: string, updates: UpdateClientAvailability) => {
      setIsLoading(true);
      setError(null);

      try {
        const { data, error: updateError } = await supabase
          .from('client_availability')
          .update(updates)
          .eq('id', id)
          .select()
          .single();

        if (updateError) throw updateError;

        setAvailabilities((prev) =>
          prev.map((avail) => (avail.id === id ? data : avail))
        );
        toast.success('Disponibilidade atualizada com sucesso!');
        logger.log('Availability updated:', data);
        return data;
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Erro ao atualizar disponibilidade';
        setError(errorMessage);
        logger.error('Error updating availability:', err);
        toast.error(errorMessage);
        return null;
      } finally {
        setIsLoading(false);
      }
    },
    []
  );

  // =====================================================
  // DELETE AVAILABILITY
  // =====================================================

  const deleteAvailability = useCallback(async (id: string) => {
    setIsLoading(true);
    setError(null);

    try {
      const { error: deleteError } = await supabase
        .from('client_availability')
        .delete()
        .eq('id', id);

      if (deleteError) throw deleteError;

      setAvailabilities((prev) => prev.filter((avail) => avail.id !== id));
      toast.success('Disponibilidade removida com sucesso!');
      logger.log('Availability deleted:', id);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro ao remover disponibilidade';
      setError(errorMessage);
      logger.error('Error deleting availability:', err);
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // =====================================================
  // TOGGLE STATUS
  // =====================================================

  const toggleStatus = useCallback(
    async (id: string) => {
      const availability = availabilities.find((a) => a.id === id);
      if (!availability) return;

      const newStatus = availability.status === 'ativo' ? 'inativo' : 'ativo';
      return updateAvailability(id, { status: newStatus });
    },
    [availabilities, updateAvailability]
  );

  // =====================================================
  // GET AVAILABILITIES BY DAY
  // =====================================================

  const getAvailabilitiesByDay = useCallback(
    (diaSemana: DiaSemana) => {
      return availabilities.filter(
        (avail) => avail.dia_semana === diaSemana && avail.status === 'ativo'
      );
    },
    [availabilities]
  );

  // =====================================================
  // CALCULATE STATISTICS
  // =====================================================

  const statistics: AvailabilityStats = useMemo(() => {
    const ativos = availabilities.filter((a) => a.status === 'ativo');
    const inativos = availabilities.filter((a) => a.status === 'inativo');

    // Dia com mais disponibilidade
    const diasCount = new Map<DiaSemana, number>();
    ativos.forEach((avail) => {
      diasCount.set(avail.dia_semana, (diasCount.get(avail.dia_semana) || 0) + 1);
    });
    const diaComMais = Array.from(diasCount.entries()).sort((a, b) => b[1] - a[1])[0]?.[0] || 0;

    // Período preferido (manhã: 6-12, tarde: 12-18, noite: 18-24)
    const periodos = { manha: 0, tarde: 0, noite: 0 };
    ativos.forEach((avail) => {
      const hora = parseInt(avail.hora_inicio.split(':')[0]);
      if (hora >= 6 && hora < 12) periodos.manha++;
      else if (hora >= 12 && hora < 18) periodos.tarde++;
      else periodos.noite++;
    });
    const periodoPreferido = Object.entries(periodos).sort((a, b) => b[1] - a[1])[0]?.[0] as 'manha' | 'tarde' | 'noite' || 'manha';

    // Próxima disponibilidade
    const hoje = new Date();
    const diaHoje = hoje.getDay();
    let proximaDisponibilidade: AvailabilityStats['proxima_disponibilidade'] = undefined;

    for (let i = 0; i < 7; i++) {
      const diaVerificar = (diaHoje + i) % 7;
      const disponiveis = ativos.filter((a) => a.dia_semana === diaVerificar);
      
      if (disponiveis.length > 0) {
        const proxima = disponiveis[0];
        const dataProxima = new Date(hoje);
        dataProxima.setDate(dataProxima.getDate() + i);
        
        proximaDisponibilidade = {
          data: dataProxima.toISOString().split('T')[0],
          hora_inicio: proxima.hora_inicio,
          hora_fim: proxima.hora_fim,
        };
        break;
      }
    }

    return {
      total_horarios: availabilities.length,
      horarios_ativos: ativos.length,
      horarios_inativos: inativos.length,
      dia_com_mais_disponibilidade: diaComMais,
      periodo_preferido: periodoPreferido,
      proxima_disponibilidade: proximaDisponibilidade,
    };
  }, [availabilities]);

  // =====================================================
  // LOAD ON MOUNT
  // =====================================================

  useEffect(() => {
    if (clienteId) {
      fetchAvailabilities();
    }
  }, [clienteId, fetchAvailabilities]);

  // =====================================================
  // RETURN
  // =====================================================

  return {
    availabilities,
    isLoading,
    error,
    statistics,
    fetchAvailabilities,
    addAvailability,
    updateAvailability,
    deleteAvailability,
    toggleStatus,
    getAvailabilitiesByDay,
  };
};

