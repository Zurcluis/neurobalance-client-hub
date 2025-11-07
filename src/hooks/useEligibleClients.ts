import { useState, useCallback } from 'react';
import { useSupabaseClient } from './useSupabaseClient';
import { EligibleClient, ClientFilter } from '@/types/email-sms-campaign';
import { toast } from 'sonner';
import { logger } from '@/lib/logger';

export const useEligibleClients = () => {
  const supabase = useSupabaseClient();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchEligibleClients = useCallback(
    async (filters?: ClientFilter): Promise<EligibleClient[]> => {
      setIsLoading(true);
      setError(null);

      try {
        let query = supabase
          .from('clientes')
          .select('id, nome, email, telefone, estado, tipo_contato, data_entrada_clinica, criado_em');

        if (filters?.estados && filters.estados.length > 0) {
          query = query.in('estado', filters.estados);
        }

        if (filters?.tipos_contato && filters.tipos_contato.length > 0) {
          query = query.in('tipo_contato', filters.tipos_contato);
        }

        if (filters?.data_inicio) {
          query = query.gte('criado_em', filters.data_inicio);
        }

        if (filters?.data_fim) {
          query = query.lte('criado_em', filters.data_fim);
        }

        const { data, error: queryError } = await query.order('criado_em', { ascending: false });

        if (queryError) throw queryError;

        const eligibleClients = (data || []).filter(
          (client) => client.email || client.telefone
        ) as EligibleClient[];

        logger.log(`Found ${eligibleClients.length} eligible clients`, { filters });
        return eligibleClients;
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Erro ao buscar clientes elegíveis';
        setError(errorMessage);
        logger.error('Error fetching eligible clients:', err);
        toast.error(errorMessage);
        return [];
      } finally {
        setIsLoading(false);
      }
    },
    [supabase]
  );

  const getClientsByCategory = useCallback(
    async (): Promise<{
      avaliacao_sem_continuar: EligibleClient[];
      contato_sem_agendamento: EligibleClient[];
      mensagem_sem_resposta: EligibleClient[];
    }> => {
      setIsLoading(true);
      setError(null);

      try {
        const [avaliacao, contato, mensagem] = await Promise.all([
          fetchEligibleClients({
            estados: ['thinking', 'no-need', 'desistiu'],
          }),
          fetchEligibleClients({
            tipos_contato: ['Contato', 'Lead'],
          }),
          fetchEligibleClients({
            tipos_contato: ['Email'],
          }),
        ]);

        return {
          avaliacao_sem_continuar: avaliacao,
          contato_sem_agendamento: contato,
          mensagem_sem_resposta: mensagem,
        };
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Erro ao buscar clientes por categoria';
        setError(errorMessage);
        logger.error('Error fetching clients by category:', err);
        toast.error(errorMessage);
        return {
          avaliacao_sem_continuar: [],
          contato_sem_agendamento: [],
          mensagem_sem_resposta: [],
        };
      } finally {
        setIsLoading(false);
      }
    },
    [fetchEligibleClients]
  );

  return {
    fetchEligibleClients,
    getClientsByCategory,
    isLoading,
    error,
  };
};

