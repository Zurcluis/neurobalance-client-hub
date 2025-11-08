import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { logger } from '@/lib/logger';
import type {
  SuggestedAppointment,
  NewSuggestedAppointment,
  StatusSugestao,
} from '@/types/availability';

export const useSuggestedAppointments = (clienteId?: number) => {
  const [suggestions, setSuggestions] = useState<SuggestedAppointment[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // =====================================================
  // FETCH SUGGESTIONS
  // =====================================================

  const fetchSuggestions = useCallback(
    async (status?: StatusSugestao) => {
      if (!clienteId) return;

      setIsLoading(true);
      setError(null);

      try {
        let query = supabase
          .from('suggested_appointments')
          .select('*')
          .eq('cliente_id', clienteId);

        // Filtrar por status se especificado
        if (status) {
          query = query.eq('status', status);
        } else {
          // Por padrão, buscar apenas pendentes e não expiradas
          query = query
            .eq('status', 'pendente')
            .gte('expira_em', new Date().toISOString());
        }

        // Ordenar por score de compatibilidade (maior primeiro)
        query = query.order('compatibilidade_score', { ascending: false });
        query = query.order('data_sugerida', { ascending: true });

        const { data, error: queryError } = await query;

        if (queryError) throw queryError;

        setSuggestions(data || []);
        logger.log(`Loaded ${data?.length || 0} suggestions for client ${clienteId}`);
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Erro ao carregar sugestões';
        setError(errorMessage);
        logger.error('Error fetching suggestions:', err);
        toast.error(errorMessage);
      } finally {
        setIsLoading(false);
      }
    },
    [clienteId]
  );

  // =====================================================
  // CREATE SUGGESTION
  // =====================================================

  const createSuggestion = useCallback(
    async (newSuggestion: NewSuggestedAppointment) => {
      if (!clienteId) {
        toast.error('Cliente não identificado');
        return null;
      }

      setIsLoading(true);
      setError(null);

      try {
        const { data, error: insertError } = await supabase
          .from('suggested_appointments')
          .insert({ ...newSuggestion, cliente_id: clienteId })
          .select()
          .single();

        if (insertError) throw insertError;

        setSuggestions((prev) => [data, ...prev]);
        toast.success('Sugestão criada com sucesso!');
        logger.log('Suggestion created:', data);
        return data;
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Erro ao criar sugestão';
        setError(errorMessage);
        logger.error('Error creating suggestion:', err);
        toast.error(errorMessage);
        return null;
      } finally {
        setIsLoading(false);
      }
    },
    [clienteId]
  );

  // =====================================================
  // ACCEPT SUGGESTION
  // =====================================================

  const acceptSuggestion = useCallback(async (suggestionId: string) => {
    setIsLoading(true);
    setError(null);

    try {
      const { data, error: updateError } = await supabase
        .from('suggested_appointments')
        .update({
          status: 'aceita',
          respondido_em: new Date().toISOString(),
        })
        .eq('id', suggestionId)
        .select()
        .single();

      if (updateError) throw updateError;

      setSuggestions((prev) =>
        prev.map((sugg) => (sugg.id === suggestionId ? data : sugg))
      );
      
      toast.success('Sugestão aceita! Agora você pode criar o agendamento.');
      logger.log('Suggestion accepted:', data);
      return data;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro ao aceitar sugestão';
      setError(errorMessage);
      logger.error('Error accepting suggestion:', err);
      toast.error(errorMessage);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);

  // =====================================================
  // REJECT SUGGESTION
  // =====================================================

  const rejectSuggestion = useCallback(async (suggestionId: string) => {
    setIsLoading(true);
    setError(null);

    try {
      const { data, error: updateError } = await supabase
        .from('suggested_appointments')
        .update({
          status: 'rejeitada',
          respondido_em: new Date().toISOString(),
        })
        .eq('id', suggestionId)
        .select()
        .single();

      if (updateError) throw updateError;

      setSuggestions((prev) => prev.filter((sugg) => sugg.id !== suggestionId));
      
      toast.success('Sugestão removida.');
      logger.log('Suggestion rejected:', data);
      return data;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro ao rejeitar sugestão';
      setError(errorMessage);
      logger.error('Error rejecting suggestion:', err);
      toast.error(errorMessage);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);

  // =====================================================
  // LINK TO APPOINTMENT
  // =====================================================

  const linkToAppointment = useCallback(
    async (suggestionId: string, appointmentId: number) => {
      setIsLoading(true);
      setError(null);

      try {
        const { data, error: updateError } = await supabase
          .from('suggested_appointments')
          .update({
            agendamento_id: appointmentId,
          })
          .eq('id', suggestionId)
          .select()
          .single();

        if (updateError) throw updateError;

        setSuggestions((prev) =>
          prev.map((sugg) => (sugg.id === suggestionId ? data : sugg))
        );
        
        logger.log('Suggestion linked to appointment:', data);
        return data;
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Erro ao vincular agendamento';
        setError(errorMessage);
        logger.error('Error linking appointment:', err);
        toast.error(errorMessage);
        return null;
      } finally {
        setIsLoading(false);
      }
    },
    []
  );

  // =====================================================
  // LOAD ON MOUNT
  // =====================================================

  useEffect(() => {
    if (clienteId) {
      fetchSuggestions();
    }
  }, [clienteId, fetchSuggestions]);

  // =====================================================
  // RETURN
  // =====================================================

  return {
    suggestions,
    isLoading,
    error,
    fetchSuggestions,
    createSuggestion,
    acceptSuggestion,
    rejectSuggestion,
    linkToAppointment,
  };
};

