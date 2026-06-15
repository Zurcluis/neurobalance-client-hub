import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { LandingLead, LandingLeadStatus } from '@/types/landing-lead';

export const useLandingLeads = () => {
  const [leads, setLeads] = useState<LandingLead[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchLeads = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const { data, error } = await supabase
        .from('landing_leads')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      setLeads(data || []);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro ao buscar leads';
      setError(errorMessage);
      console.error('Erro ao buscar leads:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const updateLeadStatus = useCallback(async (id: string, newStatus: LandingLeadStatus) => {
    try {
      const { error } = await supabase
        .from('landing_leads')
        .update({ 
          status: newStatus,
          updated_at: new Date().toISOString()
        })
        .eq('id', id);

      if (error) throw error;

      setLeads(prev => prev.map(lead =>
        lead.id === id ? { ...lead, status: newStatus, updated_at: new Date().toISOString() } : lead
      ));

      toast.success('Status atualizado!');
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro ao atualizar status';
      toast.error(errorMessage);
      throw err;
    }
  }, []);

  const updateLead = useCallback(async (id: string, updates: Partial<LandingLead>) => {
    try {
      const { error } = await supabase
        .from('landing_leads')
        .update({
          ...updates,
          updated_at: new Date().toISOString()
        })
        .eq('id', id);

      if (error) throw error;

      setLeads(prev => prev.map(lead =>
        lead.id === id ? { ...lead, ...updates, updated_at: new Date().toISOString() } : lead
      ));

      toast.success('Lead atualizado!');
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro ao atualizar lead';
      toast.error(errorMessage);
      throw err;
    }
  }, []);

  const deleteLead = useCallback(async (id: string) => {
    try {
      const { error } = await supabase
        .from('landing_leads')
        .delete()
        .eq('id', id);

      if (error) throw error;

      setLeads(prev => prev.filter(lead => lead.id !== id));
      toast.success('Lead removido!');
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro ao remover lead';
      toast.error(errorMessage);
      throw err;
    }
  }, []);

  // Buscar leads ao montar o componente
  useEffect(() => {
    fetchLeads();
  }, [fetchLeads]);

  // Configurar subscription para atualizações em tempo real
  useEffect(() => {
    const channel = supabase
      .channel('landing_leads_changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'landing_leads' },
        (payload) => {
          if (payload.eventType === 'INSERT') {
            setLeads(prev => [payload.new as LandingLead, ...prev]);
            toast.info('Novo lead recebido!');
          } else if (payload.eventType === 'UPDATE') {
            setLeads(prev => prev.map(lead =>
              lead.id === payload.new.id ? payload.new as LandingLead : lead
            ));
          } else if (payload.eventType === 'DELETE') {
            setLeads(prev => prev.filter(lead => lead.id !== payload.old.id));
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  return {
    leads,
    isLoading,
    error,
    fetchLeads,
    updateLeadStatus,
    updateLead,
    deleteLead
  };
};

