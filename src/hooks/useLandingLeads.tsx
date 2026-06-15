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

  const addLead = useCallback(async (leadData: Omit<LandingLead, 'id' | 'created_at' | 'updated_at'>) => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('landing_leads')
        .insert([leadData])
        .select()
        .single();

      if (error) throw error;

      // Broadcast an event so other instances of the hook can update their local state immediately
      window.dispatchEvent(new CustomEvent('landingLeadAdded', { detail: data }));
      
      toast.success('Lead adicionado com sucesso!');
      return data;
    } catch (err: any) {
      console.error('Erro detalhado do Supabase:', JSON.stringify(err, null, 2));
      const errorMessage = err?.message || 'Erro ao adicionar lead';
      toast.error(`Erro: ${errorMessage}`);
      throw err;
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

      window.dispatchEvent(new CustomEvent('landingLeadUpdated', { detail: { id, status: newStatus, updated_at: new Date().toISOString() } }));

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

      window.dispatchEvent(new CustomEvent('landingLeadUpdated', { detail: { id, ...updates, updated_at: new Date().toISOString() } }));

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

      window.dispatchEvent(new CustomEvent('landingLeadDeleted', { detail: { id } }));

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
            const newLead = payload.new as LandingLead;
            setLeads(prev => {
              if (prev.some(lead => lead.id === newLead.id)) return prev;
              setTimeout(() => toast.info('Novo lead recebido!'), 0);
              return [newLead, ...prev];
            });
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

    const handleLocalAdd = (e: Event) => {
      const customEvent = e as CustomEvent<LandingLead>;
      setLeads(prev => {
        if (prev.some(lead => lead.id === customEvent.detail.id)) return prev;
        return [customEvent.detail, ...prev];
      });
    };

    const handleLocalUpdate = (e: Event) => {
      const customEvent = e as CustomEvent<Partial<LandingLead> & { id: string }>;
      setLeads(prev => prev.map(lead =>
        lead.id === customEvent.detail.id ? { ...lead, ...customEvent.detail } : lead
      ));
    };

    const handleLocalDelete = (e: Event) => {
      const customEvent = e as CustomEvent<{ id: string }>;
      setLeads(prev => prev.filter(lead => lead.id !== customEvent.detail.id));
    };

    window.addEventListener('landingLeadAdded', handleLocalAdd);
    window.addEventListener('landingLeadUpdated', handleLocalUpdate);
    window.addEventListener('landingLeadDeleted', handleLocalDelete);

    return () => {
      supabase.removeChannel(channel);
      window.removeEventListener('landingLeadAdded', handleLocalAdd);
      window.removeEventListener('landingLeadUpdated', handleLocalUpdate);
      window.removeEventListener('landingLeadDeleted', handleLocalDelete);
    };
  }, []);

  return {
    leads,
    isLoading,
    error,
    fetchLeads,
    addLead,
    updateLeadStatus,
    updateLead,
    deleteLead
  };
};

