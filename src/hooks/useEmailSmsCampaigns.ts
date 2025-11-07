import { useState, useCallback, useEffect } from 'react';
import { useSupabaseClient } from './useSupabaseClient';
import {
  EmailSmsCampaign,
  NewEmailSmsCampaign,
  UpdateEmailSmsCampaign,
  CampaignStats,
} from '@/types/email-sms-campaign';
import { toast } from 'sonner';
import { logger } from '@/lib/logger';

export const useEmailSmsCampaigns = () => {
  const supabase = useSupabaseClient();
  const [campaigns, setCampaigns] = useState<EmailSmsCampaign[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchCampaigns = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const { data, error: queryError } = await supabase
        .from('email_sms_campaigns')
        .select('*')
        .order('created_at', { ascending: false });

      if (queryError) throw queryError;

      setCampaigns((data || []) as EmailSmsCampaign[]);
      logger.log(`Fetched ${data?.length || 0} campaigns`);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro ao buscar campanhas';
      setError(errorMessage);
      logger.error('Error fetching campaigns:', err);
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  }, [supabase]);

  const addCampaign = useCallback(
    async (campaign: NewEmailSmsCampaign): Promise<EmailSmsCampaign | null> => {
      setIsLoading(true);
      setError(null);

      try {
        const { data: sessionData } = await supabase.auth.getSession();
        const userId = sessionData?.session?.user?.id;

        const { data, error: insertError } = await supabase
          .from('email_sms_campaigns')
          .insert({
            ...campaign,
            created_by: userId || null,
          })
          .select()
          .single();

        if (insertError) throw insertError;

        const newCampaign = data as EmailSmsCampaign;
        setCampaigns((prev) => [newCampaign, ...prev]);
        logger.log('Campaign created:', newCampaign.id);
        toast.success('Campanha criada com sucesso!');
        return newCampaign;
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Erro ao criar campanha';
        setError(errorMessage);
        logger.error('Error creating campaign:', err);
        toast.error(errorMessage);
        return null;
      } finally {
        setIsLoading(false);
      }
    },
    [supabase]
  );

  const updateCampaign = useCallback(
    async (id: string, updates: UpdateEmailSmsCampaign): Promise<boolean> => {
      setIsLoading(true);
      setError(null);

      try {
        const { error: updateError } = await supabase
          .from('email_sms_campaigns')
          .update(updates)
          .eq('id', id);

        if (updateError) throw updateError;

        setCampaigns((prev) =>
          prev.map((campaign) => (campaign.id === id ? { ...campaign, ...updates } : campaign))
        );
        logger.log('Campaign updated:', id);
        toast.success('Campanha atualizada com sucesso!');
        return true;
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Erro ao atualizar campanha';
        setError(errorMessage);
        logger.error('Error updating campaign:', err);
        toast.error(errorMessage);
        return false;
      } finally {
        setIsLoading(false);
      }
    },
    [supabase]
  );

  const deleteCampaign = useCallback(
    async (id: string): Promise<boolean> => {
      setIsLoading(true);
      setError(null);

      try {
        const { error: deleteError } = await supabase.from('email_sms_campaigns').delete().eq('id', id);

        if (deleteError) throw deleteError;

        setCampaigns((prev) => prev.filter((campaign) => campaign.id !== id));
        logger.log('Campaign deleted:', id);
        toast.success('Campanha removida com sucesso!');
        return true;
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Erro ao remover campanha';
        setError(errorMessage);
        logger.error('Error deleting campaign:', err);
        toast.error(errorMessage);
        return false;
      } finally {
        setIsLoading(false);
      }
    },
    [supabase]
  );

  const getCampaignStats = useCallback(
    async (campaignId: string): Promise<CampaignStats | null> => {
      try {
        const { data: campaignData, error: campaignError } = await supabase
          .from('email_sms_campaigns')
          .select('total_clientes, enviados, falhas, aberturas, cliques, respostas, conversoes')
          .eq('id', campaignId)
          .single();

        if (campaignError) throw campaignError;

        const campaign = campaignData as EmailSmsCampaign;
        const total = campaign.total_clientes || 0;
        const enviados = campaign.enviados || 0;
        const falhas = campaign.falhas || 0;

        return {
          total,
          enviados,
          falhas,
          taxa_sucesso: enviados > 0 ? ((enviados - falhas) / enviados) * 100 : 0,
          aberturas: campaign.aberturas || 0,
          taxa_abertura: enviados > 0 ? ((campaign.aberturas || 0) / enviados) * 100 : 0,
          cliques: campaign.cliques || 0,
          taxa_clique: enviados > 0 ? ((campaign.cliques || 0) / enviados) * 100 : 0,
          respostas: campaign.respostas || 0,
          taxa_resposta: enviados > 0 ? ((campaign.respostas || 0) / enviados) * 100 : 0,
          conversoes: campaign.conversoes || 0,
          taxa_conversao: enviados > 0 ? ((campaign.conversoes || 0) / enviados) * 100 : 0,
        };
      } catch (err) {
        logger.error('Error fetching campaign stats:', err);
        return null;
      }
    },
    [supabase]
  );

  useEffect(() => {
    fetchCampaigns();
  }, [fetchCampaigns]);

  return {
    campaigns,
    isLoading,
    error,
    fetchCampaigns,
    addCampaign,
    updateCampaign,
    deleteCampaign,
    getCampaignStats,
  };
};

