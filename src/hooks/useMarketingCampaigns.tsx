import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { MarketingCampaign, MarketingMetrics, CampaignFilters, MonthlyReport } from '@/types/marketing';

export const useMarketingCampaigns = () => {
  const [campaigns, setCampaigns] = useState<MarketingCampaign[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchCampaigns = useCallback(async (filters?: CampaignFilters) => {
    setIsLoading(true);
    setError(null);

    try {
      let query = supabase
        .from('marketing_campaigns')
        .select('*');

      if (filters?.origem) {
        query = query.eq('origem', filters.origem);
      }

      if (filters?.anoInicio) {
        query = query.gte('ano', filters.anoInicio);
      }

      if (filters?.anoFim) {
        query = query.lte('ano', filters.anoFim);
      }

      if (filters?.mesInicio && filters?.anoInicio) {
        query = query.or(`ano.gt.${filters.anoInicio},and(ano.eq.${filters.anoInicio},mes.gte.${filters.mesInicio})`);
      }

      if (filters?.mesFim && filters?.anoFim) {
        query = query.or(`ano.lt.${filters.anoFim},and(ano.eq.${filters.anoFim},mes.lte.${filters.mesFim})`);
      }

      if (filters?.ordenarPor) {
        const ordem = filters.ordem || 'desc';
        query = query.order(filters.ordenarPor, { ascending: ordem === 'asc' });
      } else {
        query = query.order('ano', { ascending: false }).order('mes', { ascending: false });
      }

      const { data, error } = await query;

      if (error) throw error;

      setCampaigns(data || []);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro ao buscar campanhas';
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const addCampaign = useCallback(async (campaign: Omit<MarketingCampaign, 'id' | 'created_at' | 'updated_at'>) => {
    setIsLoading(true);
    try {
      // Calcular métricas derivadas
      const cpl = campaign.leads > 0 ? campaign.investimento / campaign.leads : 0;
      const cac = campaign.vendas > 0 ? campaign.investimento / campaign.vendas : 0;
      const taxa_conversao = campaign.leads > 0 ? (campaign.vendas / campaign.leads) * 100 : 0;

      const campaignWithMetrics = {
        ...campaign,
        cpl: Math.round(cpl * 100) / 100,
        cac: Math.round(cac * 100) / 100,
        taxa_conversao: Math.round(taxa_conversao * 100) / 100
      };

      const { data, error } = await supabase
        .from('marketing_campaigns')
        .insert([campaignWithMetrics])
        .select()
        .single();

      if (error) throw error;

      setCampaigns(prev => [data, ...prev]);
      toast.success('Campanha adicionada com sucesso!');
      return data;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro ao adicionar campanha';
      toast.error(errorMessage);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const updateCampaign = useCallback(async (id: string, updates: Partial<MarketingCampaign>) => {
    setIsLoading(true);
    try {
      // Recalcular métricas se necessário
      let updatedData = { ...updates };
      
      if (updates.investimento !== undefined || updates.leads !== undefined || updates.vendas !== undefined) {
        const campaign = campaigns.find(c => c.id === id);
        if (campaign) {
          const investimento = updates.investimento ?? campaign.investimento;
          const leads = updates.leads ?? campaign.leads;
          const vendas = updates.vendas ?? campaign.vendas;
          
          const cpl = leads > 0 ? investimento / leads : 0;
          const cac = vendas > 0 ? investimento / vendas : 0;
          const taxa_conversao = leads > 0 ? (vendas / leads) * 100 : 0;

          updatedData = {
            ...updatedData,
            cpl: Math.round(cpl * 100) / 100,
            cac: Math.round(cac * 100) / 100,
            taxa_conversao: Math.round(taxa_conversao * 100) / 100
          };
        }
      }

      const { data, error } = await supabase
        .from('marketing_campaigns')
        .update(updatedData)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;

      setCampaigns(prev => prev.map(campaign => 
        campaign.id === id ? data : campaign
      ));
      toast.success('Campanha atualizada com sucesso!');
      return data;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro ao atualizar campanha';
      toast.error(errorMessage);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [campaigns]);

  const deleteCampaign = useCallback(async (id: string) => {
    setIsLoading(true);
    try {
      const { error } = await supabase
        .from('marketing_campaigns')
        .delete()
        .eq('id', id);

      if (error) throw error;

      setCampaigns(prev => prev.filter(campaign => campaign.id !== id));
      toast.success('Campanha removida com sucesso!');
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro ao remover campanha';
      toast.error(errorMessage);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const calculateMetrics = useCallback((campaignList: MarketingCampaign[]): MarketingMetrics => {
    if (campaignList.length === 0) {
      return {
        totalInvestimento: 0,
        totalLeads: 0,
        totalReunioes: 0,
        totalVendas: 0,
        totalReceita: 0,
        cplMedio: 0,
        cacMedio: 0,
        taxaConversaoMedia: 0,
        roi: 0,
        roas: 0
      };
    }

    const totals = campaignList.reduce((acc, campaign) => ({
      totalInvestimento: acc.totalInvestimento + campaign.investimento,
      totalLeads: acc.totalLeads + campaign.leads,
      totalReunioes: acc.totalReunioes + campaign.reunioes,
      totalVendas: acc.totalVendas + campaign.vendas,
      totalReceita: acc.totalReceita + campaign.receita,
    }), {
      totalInvestimento: 0,
      totalLeads: 0,
      totalReunioes: 0,
      totalVendas: 0,
      totalReceita: 0,
    });

    const cplMedio = totals.totalLeads > 0 ? totals.totalInvestimento / totals.totalLeads : 0;
    const cacMedio = totals.totalVendas > 0 ? totals.totalInvestimento / totals.totalVendas : 0;
    const taxaConversaoMedia = totals.totalLeads > 0 ? (totals.totalVendas / totals.totalLeads) * 100 : 0;
    const roi = totals.totalInvestimento > 0 ? ((totals.totalReceita - totals.totalInvestimento) / totals.totalInvestimento) * 100 : 0;
    const roas = totals.totalInvestimento > 0 ? totals.totalReceita / totals.totalInvestimento : 0;

    return {
      ...totals,
      cplMedio: Math.round(cplMedio * 100) / 100,
      cacMedio: Math.round(cacMedio * 100) / 100,
      taxaConversaoMedia: Math.round(taxaConversaoMedia * 100) / 100,
      roi: Math.round(roi * 100) / 100,
      roas: Math.round(roas * 100) / 100
    };
  }, []);

  const getMonthlyReport = useCallback(async (mes: number, ano: number): Promise<MonthlyReport> => {
    const currentMonthCampaigns = campaigns.filter(c => c.mes === mes && c.ano === ano);
    
    // Buscar campanhas do mês anterior para comparação
    const previousMonth = mes === 1 ? 12 : mes - 1;
    const previousYear = mes === 1 ? ano - 1 : ano;
    const previousMonthCampaigns = campaigns.filter(c => c.mes === previousMonth && c.ano === previousYear);
    
    const currentMetrics = calculateMetrics(currentMonthCampaigns);
    const previousMetrics = calculateMetrics(previousMonthCampaigns);

    const calculateVariation = (current: number, previous: number) => {
      if (previous === 0) return current > 0 ? 100 : 0;
      return ((current - previous) / previous) * 100;
    };

    return {
      mes,
      ano,
      campanhas: currentMonthCampaigns,
      metricas: currentMetrics,
      comparacaoMesAnterior: {
        investimentoVariacao: Math.round(calculateVariation(currentMetrics.totalInvestimento, previousMetrics.totalInvestimento) * 100) / 100,
        leadsVariacao: Math.round(calculateVariation(currentMetrics.totalLeads, previousMetrics.totalLeads) * 100) / 100,
        receitaVariacao: Math.round(calculateVariation(currentMetrics.totalReceita, previousMetrics.totalReceita) * 100) / 100,
        roiVariacao: Math.round(calculateVariation(currentMetrics.roi, previousMetrics.roi) * 100) / 100,
      }
    };
  }, [campaigns, calculateMetrics]);

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
    calculateMetrics,
    getMonthlyReport
  };
};
