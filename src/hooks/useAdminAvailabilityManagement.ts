import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { logger } from '@/lib/logger';
import type {
  ClientAvailability,
  SuggestedAppointment,
  AvailabilityNotification,
} from '@/types/availability';

interface ClientWithAvailability {
  id: number;
  nome: string;
  email: string | null;
  telefone: string | null;
  estado: string | null;
  total_disponibilidades: number;
  disponibilidades_ativas: number;
  ultima_atualizacao: string | null;
  total_sugestoes: number;
  sugestoes_pendentes: number;
  sugestoes_aceitas: number;
  taxa_aceitacao: number;
}

interface AvailabilityOverview {
  total_clientes: number;
  clientes_com_disponibilidade: number;
  total_disponibilidades: number;
  disponibilidades_ativas: number;
  total_sugestoes: number;
  sugestoes_pendentes: number;
  sugestoes_aceitas: number;
  taxa_aceitacao_geral: number;
  clientes_sem_disponibilidade: number;
}

export const useAdminAvailabilityManagement = () => {
  const [clients, setClients] = useState<ClientWithAvailability[]>([]);
  const [overview, setOverview] = useState<AvailabilityOverview | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // =====================================================
  // FETCH CLIENTS WITH AVAILABILITY DATA
  // =====================================================

  const fetchClientsWithAvailability = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      // Buscar todos os clientes
      const { data: clientsData, error: clientsError } = await supabase
        .from('clientes')
        .select('id, nome, email, telefone, estado')
        .order('nome', { ascending: true });

      if (clientsError) throw clientsError;

      // Para cada cliente, buscar estatísticas de disponibilidade e sugestões
      const clientsWithData: ClientWithAvailability[] = await Promise.all(
        (clientsData || []).map(async (client) => {
          // Disponibilidades
          const { data: availData } = await supabase
            .from('client_availability')
            .select('id, status, updated_at')
            .eq('cliente_id', client.id);

          const totalDisp = availData?.length || 0;
          const activeDisp = availData?.filter((d) => d.status === 'ativo').length || 0;
          const lastUpdate = availData?.length
            ? availData.reduce((latest, current) =>
                new Date(current.updated_at!) > new Date(latest.updated_at!)
                  ? current
                  : latest
              ).updated_at
            : null;

          // Sugestões
          const { data: suggData } = await supabase
            .from('suggested_appointments')
            .select('id, status')
            .eq('cliente_id', client.id);

          const totalSugg = suggData?.length || 0;
          const pendingSugg = suggData?.filter((s) => s.status === 'pendente').length || 0;
          const acceptedSugg = suggData?.filter((s) => s.status === 'aceita').length || 0;
          const acceptanceRate = totalSugg > 0 ? (acceptedSugg / totalSugg) * 100 : 0;

          return {
            ...client,
            total_disponibilidades: totalDisp,
            disponibilidades_ativas: activeDisp,
            ultima_atualizacao: lastUpdate,
            total_sugestoes: totalSugg,
            sugestoes_pendentes: pendingSugg,
            sugestoes_aceitas: acceptedSugg,
            taxa_aceitacao: acceptanceRate,
          };
        })
      );

      setClients(clientsWithData);
      logger.log(`Loaded ${clientsWithData.length} clients with availability data`);

      // Calcular overview
      const totalClients = clientsWithData.length;
      const clientsWithAvail = clientsWithData.filter((c) => c.total_disponibilidades > 0).length;
      const totalDisponibilidades = clientsWithData.reduce((sum, c) => sum + c.total_disponibilidades, 0);
      const activeDisponibilidades = clientsWithData.reduce((sum, c) => sum + c.disponibilidades_ativas, 0);
      const totalSugestoes = clientsWithData.reduce((sum, c) => sum + c.total_sugestoes, 0);
      const pendingSugestoes = clientsWithData.reduce((sum, c) => sum + c.sugestoes_pendentes, 0);
      const acceptedSugestoes = clientsWithData.reduce((sum, c) => sum + c.sugestoes_aceitas, 0);
      const overallAcceptanceRate = totalSugestoes > 0 ? (acceptedSugestoes / totalSugestoes) * 100 : 0;

      setOverview({
        total_clientes: totalClients,
        clientes_com_disponibilidade: clientsWithAvail,
        total_disponibilidades: totalDisponibilidades,
        disponibilidades_ativas: activeDisponibilidades,
        total_sugestoes: totalSugestoes,
        sugestoes_pendentes: pendingSugestoes,
        sugestoes_aceitas: acceptedSugestoes,
        taxa_aceitacao_geral: overallAcceptanceRate,
        clientes_sem_disponibilidade: totalClients - clientsWithAvail,
      });
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro ao carregar dados de disponibilidade';
      setError(errorMessage);
      logger.error('Error fetching clients with availability:', err);
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // =====================================================
  // GET CLIENT AVAILABILITIES
  // =====================================================

  const getClientAvailabilities = useCallback(async (clienteId: number): Promise<ClientAvailability[]> => {
    try {
      const { data, error } = await supabase
        .from('client_availability')
        .select('*')
        .eq('cliente_id', clienteId)
        .order('dia_semana', { ascending: true });

      if (error) throw error;
      return data || [];
    } catch (err) {
      logger.error('Error fetching client availabilities:', err);
      toast.error('Erro ao buscar disponibilidades do cliente');
      return [];
    }
  }, []);

  // =====================================================
  // GET CLIENT SUGGESTIONS
  // =====================================================

  const getClientSuggestions = useCallback(async (clienteId: number): Promise<SuggestedAppointment[]> => {
    try {
      const { data, error } = await supabase
        .from('suggested_appointments')
        .select('*')
        .eq('cliente_id', clienteId)
        .order('compatibilidade_score', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (err) {
      logger.error('Error fetching client suggestions:', err);
      toast.error('Erro ao buscar sugestões do cliente');
      return [];
    }
  }, []);

  // =====================================================
  // DELETE AVAILABILITY
  // =====================================================

  const deleteAvailability = useCallback(async (availabilityId: string) => {
    try {
      const { error } = await supabase
        .from('client_availability')
        .delete()
        .eq('id', availabilityId);

      if (error) throw error;

      toast.success('Disponibilidade removida com sucesso');
      await fetchClientsWithAvailability(); // Recarregar dados
    } catch (err) {
      logger.error('Error deleting availability:', err);
      toast.error('Erro ao remover disponibilidade');
    }
  }, [fetchClientsWithAvailability]);

  // =====================================================
  // BULK DELETE SUGGESTIONS
  // =====================================================

  const bulkDeleteExpiredSuggestions = useCallback(async () => {
    setIsLoading(true);
    try {
      const now = new Date().toISOString();

      const { data, error } = await supabase
        .from('suggested_appointments')
        .delete()
        .lt('expira_em', now)
        .eq('status', 'pendente')
        .select();

      if (error) throw error;

      const count = data?.length || 0;
      toast.success(`${count} sugestões expiradas removidas`);
      await fetchClientsWithAvailability();
    } catch (err) {
      logger.error('Error bulk deleting expired suggestions:', err);
      toast.error('Erro ao remover sugestões expiradas');
    } finally {
      setIsLoading(false);
    }
  }, [fetchClientsWithAvailability]);

  // =====================================================
  // GET AVAILABILITY INSIGHTS
  // =====================================================

  const getAvailabilityInsights = useCallback(async () => {
    try {
      // Dias da semana mais disponíveis
      const { data: dayData } = await supabase
        .from('client_availability')
        .select('dia_semana')
        .eq('status', 'ativo');

      const dayCounts: Record<number, number> = {};
      dayData?.forEach((item) => {
        dayCounts[item.dia_semana] = (dayCounts[item.dia_semana] || 0) + 1;
      });

      const mostAvailableDay = Object.entries(dayCounts).reduce(
        (max, [day, count]) => (count > max.count ? { day: parseInt(day), count } : max),
        { day: 0, count: 0 }
      );

      // Horários mais disponíveis (manhã vs tarde)
      const { data: timeData } = await supabase
        .from('client_availability')
        .select('hora_inicio')
        .eq('status', 'ativo');

      let morning = 0;
      let afternoon = 0;
      let evening = 0;

      timeData?.forEach((item) => {
        const hour = parseInt(item.hora_inicio.split(':')[0]);
        if (hour < 12) morning++;
        else if (hour < 18) afternoon++;
        else evening++;
      });

      return {
        mostAvailableDay,
        timePreferences: { morning, afternoon, evening },
        totalActiveSlots: timeData?.length || 0,
      };
    } catch (err) {
      logger.error('Error getting availability insights:', err);
      return null;
    }
  }, []);

  // =====================================================
  // LOAD ON MOUNT
  // =====================================================

  useEffect(() => {
    fetchClientsWithAvailability();
  }, [fetchClientsWithAvailability]);

  // =====================================================
  // RETURN
  // =====================================================

  return {
    clients,
    overview,
    isLoading,
    error,
    fetchClientsWithAvailability,
    getClientAvailabilities,
    getClientSuggestions,
    deleteAvailability,
    bulkDeleteExpiredSuggestions,
    getAvailabilityInsights,
  };
};

