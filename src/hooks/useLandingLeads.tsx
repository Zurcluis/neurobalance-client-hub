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

      const sanitized = (data || []).map((lead: LandingLead) => ({
        ...lead,
        email: lead.email?.includes('@neurobalance.local') ? '' : lead.email
      }));

      setLeads(sanitized);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro ao buscar leads';
      setError(errorMessage);
      console.error('Erro ao buscar leads:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const addLead = useCallback(async (leadData: Omit<LandingLead, 'id' | 'created_at' | 'updated_at'>) => {
    try {
      const hasEmail = !!(leadData.email && leadData.email.trim());
      const emailNormalized = hasEmail
        ? leadData.email!.trim().toLowerCase()
        : `sem-email-${(leadData.telefone || '').replace(/\D/g, '') || Date.now()}@neurobalance.local`;

      const payload = {
        ...leadData,
        nome: leadData.nome.trim(),
        telefone: leadData.telefone.trim(),
        email: emailNormalized,
        morada: leadData.morada?.trim() || '',
        observacoes: leadData.observacoes?.trim() || '',
      };

      const { data, error } = await supabase
        .from('landing_leads')
        .insert([payload])
        .select()
        .single();

      if (error) throw error;

      // Sincronizar com lead_compra para aparecer também na vista Lista e Relatórios
      const statusMapToCompra: Record<LandingLeadStatus, string> = {
        'Novo': 'Marcaram avaliação',
        'Contactado': 'Vão marcar consulta mais à frente',
        'Agendou Avaliação': 'Marcaram avaliação',
        'Avaliação Realizada': 'Falta resultados da avaliação',
        'Iniciou Neurofeedback': 'Iniciou Neurofeedback',
        'Não Avança': 'Não vai avançar',
      };

      try {
        await supabase.from('lead_compra').upsert([{
          nome: payload.nome,
          email: emailNormalized,
          telefone: payload.telefone,
          cidade: payload.morada,
          idade: 25,
          genero: 'Feminino',
          valor_pago: 0,
          data_evento: new Date().toISOString().split('T')[0],
          tipo: payload.status === 'Iniciou Neurofeedback' ? 'Compra' : 'Lead',
          status: statusMapToCompra[payload.status] || 'Marcaram avaliação',
          origem_campanha: payload.origem,
          observacoes: payload.observacoes
        }], { onConflict: 'email' });
      } catch (syncErr) {
        console.warn('Sincronização com lead_compra falhou (não bloqueante):', syncErr);
      }

      const sanitized = {
        ...data,
        email: data.email?.includes('@neurobalance.local') ? '' : data.email
      } as LandingLead;

      setLeads(prev => [sanitized, ...prev]);
      toast.success('Lead adicionado com sucesso!');
      return sanitized;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro ao adicionar lead';
      toast.error(errorMessage);
      throw err;
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

      // Sincronizar atualização de status em lead_compra
      const statusMapToCompra: Record<LandingLeadStatus, string> = {
        'Novo': 'Marcaram avaliação',
        'Contactado': 'Vão marcar consulta mais à frente',
        'Agendou Avaliação': 'Marcaram avaliação',
        'Avaliação Realizada': 'Falta resultados da avaliação',
        'Iniciou Neurofeedback': 'Iniciou Neurofeedback',
        'Não Avança': 'Não vai avançar',
      };

      const currentLead = leads.find(l => l.id === id);
      if (currentLead) {
        if (currentLead.email) {
          await supabase.from('lead_compra').update({ status: statusMapToCompra[newStatus] }).eq('email', currentLead.email);
        } else if (currentLead.telefone) {
          await supabase.from('lead_compra').update({ status: statusMapToCompra[newStatus] }).eq('telefone', currentLead.telefone);
        }
      }

      toast.success('Status atualizado!');
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro ao atualizar status';
      toast.error(errorMessage);
      throw err;
    }
  }, [leads]);

  const updateLead = useCallback(async (id: string, updates: Partial<LandingLead>) => {
    try {
      const payload: Record<string, unknown> = {
        ...updates,
        updated_at: new Date().toISOString()
      };

      if (payload.email !== undefined) {
        const hasEmail = !!(payload.email && typeof payload.email === 'string' && payload.email.trim());
        payload.email = hasEmail
          ? (payload.email as string).trim().toLowerCase()
          : `sem-email-${(payload.telefone ? String(payload.telefone) : '').replace(/\D/g, '') || Date.now()}@neurobalance.local`;
      }
      if (payload.morada !== undefined) {
        payload.morada = typeof payload.morada === 'string' ? payload.morada.trim() : '';
      }

      // Tentar atualizar por id sem .single() para evitar erro PGRST116 caso o id venha de outra tabela ou estado desatualizado
      const { data: updatedRows, error: updateError } = await supabase
        .from('landing_leads')
        .update(payload)
        .eq('id', id)
        .select();

      if (updateError) throw updateError;

      let savedData: LandingLead;

      if (updatedRows && updatedRows.length > 0) {
        savedData = updatedRows[0];
      } else {
        // ID não encontrado diretamente em landing_leads (ex: ID de lead_compra)
        // Procurar por email ou telefone antes de criar novo
        let existingId: string | null = null;
        const lookupEmail = payload.email && !String(payload.email).includes('@neurobalance.local')
          ? String(payload.email).trim().toLowerCase()
          : null;
        const lookupPhone = payload.telefone ? String(payload.telefone).trim() : null;

        if (lookupEmail) {
          const { data: byEmail } = await supabase
            .from('landing_leads')
            .select('id')
            .eq('email', lookupEmail)
            .maybeSingle();
          if (byEmail) existingId = byEmail.id;
        }

        if (!existingId && lookupPhone) {
          const { data: byPhone } = await supabase
            .from('landing_leads')
            .select('id')
            .eq('telefone', lookupPhone)
            .maybeSingle();
          if (byPhone) existingId = byPhone.id;
        }

        if (existingId) {
          const { data: reUpdated, error: reErr } = await supabase
            .from('landing_leads')
            .update(payload)
            .eq('id', existingId)
            .select()
            .single();
          if (reErr) throw reErr;
          savedData = reUpdated;
        } else {
          // Não existe em landing_leads: inserir com os dados atualizados
          const insertPayload = {
            ...payload,
            nome: (payload.nome as string)?.trim() || '',
            email: (payload.email as string)?.trim().toLowerCase() || `sem-email-${(payload.telefone ? String(payload.telefone) : '').replace(/\D/g, '') || Date.now()}@neurobalance.local`,
            telefone: (payload.telefone as string)?.trim() || '',
            status: (payload.status as LandingLeadStatus) || 'Novo',
            origem: (payload.origem as string) || 'Instagram',
            morada: (payload.morada as string)?.trim() || '',
            observacoes: (payload.observacoes as string)?.trim() || ''
          };

          const { data: inserted, error: insertError } = await supabase
            .from('landing_leads')
            .insert([insertPayload])
            .select()
            .single();

          if (insertError) throw insertError;
          savedData = inserted;
        }
      }

      // Sincronizar edição em lead_compra
      try {
        const currentLead = leads.find(l => l.id === id || l.id === savedData.id);
        const searchEmail = (payload.email as string) || savedData.email || currentLead?.email;
        const searchPhone = (payload.telefone as string) || savedData.telefone || currentLead?.telefone;

        const updateCompra: Record<string, unknown> = {};
        if (payload.nome) updateCompra.nome = (payload.nome as string).trim();
        if (payload.email) updateCompra.email = (payload.email as string).trim();
        if (payload.telefone) updateCompra.telefone = (payload.telefone as string).trim();
        if (payload.morada !== undefined) updateCompra.cidade = (payload.morada as string).trim() || '';
        if (payload.observacoes !== undefined) updateCompra.observacoes = payload.observacoes;
        if (payload.origem) updateCompra.origem_campanha = payload.origem;

        const statusMapToCompra: Record<LandingLeadStatus, string> = {
          'Novo': 'Marcaram avaliação',
          'Contactado': 'Vão marcar consulta mais à frente',
          'Agendou Avaliação': 'Marcaram avaliação',
          'Avaliação Realizada': 'Falta resultados da avaliação',
          'Iniciou Neurofeedback': 'Iniciou Neurofeedback',
          'Não Avança': 'Não vai avançar',
        };

        if (payload.status) {
          updateCompra.status = statusMapToCompra[payload.status as LandingLeadStatus] || 'Marcaram avaliação';
          updateCompra.tipo = payload.status === 'Iniciou Neurofeedback' ? 'Compra' : 'Lead';
        }

        let updatedCompra = false;
        // Tentar atualizar por id (caso id tenha vindo de lead_compra)
        const { data: ucById } = await supabase.from('lead_compra').update(updateCompra).eq('id', id).select('id');
        if (ucById && ucById.length > 0) updatedCompra = true;

        if (!updatedCompra && searchEmail && !searchEmail.includes('@neurobalance.local')) {
          const { data: ucByEmail } = await supabase.from('lead_compra').update(updateCompra).eq('email', searchEmail.trim().toLowerCase()).select('id');
          if (ucByEmail && ucByEmail.length > 0) updatedCompra = true;
        }

        if (!updatedCompra && searchPhone) {
          const { data: ucByPhone } = await supabase.from('lead_compra').update(updateCompra).eq('telefone', searchPhone.trim()).select('id');
          if (ucByPhone && ucByPhone.length > 0) updatedCompra = true;
        }

        if (!updatedCompra) {
          await supabase.from('lead_compra').upsert([{
            nome: updateCompra.nome || savedData.nome,
            email: searchEmail || savedData.email,
            telefone: updateCompra.telefone || savedData.telefone,
            cidade: updateCompra.cidade !== undefined ? updateCompra.cidade : (savedData.morada || ''),
            idade: 25,
            genero: 'Feminino',
            valor_pago: 0,
            data_evento: new Date().toISOString().split('T')[0],
            tipo: updateCompra.tipo || 'Lead',
            status: updateCompra.status || 'Marcaram avaliação',
            origem_campanha: updateCompra.origem_campanha || savedData.origem || 'Instagram',
            observacoes: updateCompra.observacoes || savedData.observacoes || ''
          }], { onConflict: 'email' });
        }
      } catch (syncErr) {
        console.warn('Erro ao sincronizar edição com lead_compra:', syncErr);
      }

      const sanitized = {
        ...savedData,
        email: savedData.email?.includes('@neurobalance.local') ? '' : savedData.email
      } as LandingLead;

      setLeads(prev => {
        const found = prev.some(l => l.id === id || l.id === savedData.id);
        if (found) {
          return prev.map(lead => (lead.id === id || lead.id === savedData.id) ? sanitized : lead);
        } else {
          return [sanitized, ...prev];
        }
      });

      toast.success('Lead atualizado!');
      return sanitized;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro ao atualizar lead';
      toast.error(errorMessage);
      throw err;
    }
  }, [leads]);

  const deleteLead = useCallback(async (id: string) => {
    try {
      const leadToDelete = leads.find(l => l.id === id);

      const { error } = await supabase
        .from('landing_leads')
        .delete()
        .eq('id', id);

      if (error) throw error;

      // Sincronizar deleção em lead_compra
      if (leadToDelete) {
        if (leadToDelete.email) {
          await supabase.from('lead_compra').delete().eq('email', leadToDelete.email);
        }
        if (leadToDelete.telefone) {
          await supabase.from('lead_compra').delete().eq('telefone', leadToDelete.telefone);
        }
      }

      setLeads(prev => prev.filter(lead => lead.id !== id));
      toast.success('Lead removido!');
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro ao remover lead';
      toast.error(errorMessage);
      throw err;
    }
  }, [leads]);

  // Buscar leads ao montar o componente
  useEffect(() => {
    fetchLeads();
  }, [fetchLeads]);

  // Configurar subscription para atualizações em tempo real
  useEffect(() => {
    const channelId = Math.random().toString(36).substring(2, 9);
    const channel = supabase
      .channel(`landing_leads_changes_${channelId}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'landing_leads' },
        (payload) => {
          if (payload.eventType === 'INSERT') {
            const rawLead = payload.new as LandingLead;
            const sanitized = {
              ...rawLead,
              email: rawLead.email?.includes('@neurobalance.local') ? '' : rawLead.email
            };
            setLeads(prev => [sanitized, ...prev]);
            toast.info('Novo lead recebido!');
          } else if (payload.eventType === 'UPDATE') {
            const rawLead = payload.new as LandingLead;
            const sanitized = {
              ...rawLead,
              email: rawLead.email?.includes('@neurobalance.local') ? '' : rawLead.email
            };
            setLeads(prev => prev.map(lead =>
              lead.id === sanitized.id ? sanitized : lead
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
    addLead,
    updateLeadStatus,
    updateLead,
    deleteLead
  };
};

