import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { 
  LeadCompra, 
  LeadCompraStatistics, 
  LeadCompraFilters, 
  ImportData, 
  ImportResult 
} from '@/types/lead-compra';

export const useLeadCompra = () => {
  const [leads, setLeads] = useState<LeadCompra[]>([]);
  const [statistics, setStatistics] = useState<LeadCompraStatistics | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchLeads = useCallback(async (filters?: LeadCompraFilters) => {
    setIsLoading(true);
    setError(null);

    try {
      let query = supabase
        .from('lead_compra')
        .select('*');

      // Aplicar filtros
      if (filters?.tipo && filters.tipo !== 'Todos') {
        query = query.eq('tipo', filters.tipo);
      }

      if (filters?.genero) {
        query = query.eq('genero', filters.genero);
      }

      if (filters?.cidade) {
        query = query.eq('cidade', filters.cidade);
      }

      if (filters?.valorMinimo !== undefined) {
        query = query.gte('valor_pago', filters.valorMinimo);
      }

      if (filters?.valorMaximo !== undefined) {
        query = query.lte('valor_pago', filters.valorMaximo);
      }

      if (filters?.dataInicio) {
        query = query.gte('data_evento', filters.dataInicio);
      }

      if (filters?.dataFim) {
        query = query.lte('data_evento', filters.dataFim);
      }

      if (filters?.origemCampanha) {
        query = query.eq('origem_campanha', filters.origemCampanha);
      }

      // Ordenação
      if (filters?.ordenarPor) {
        const ordem = filters.ordem || 'desc';
        query = query.order(filters.ordenarPor, { ascending: ordem === 'asc' });
      } else {
        query = query.order('data_evento', { ascending: false });
      }

      const { data, error } = await query;

      if (error) throw error;

      setLeads(data || []);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro ao buscar leads';
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const addLead = useCallback(async (leadData: Omit<LeadCompra, 'id' | 'created_at' | 'updated_at'>) => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('lead_compra')
        .insert([leadData])
        .select()
        .single();

      if (error) throw error;

      setLeads(prev => [data, ...prev]);
      toast.success('Lead/Compra adicionado com sucesso!');
      return data;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro ao adicionar lead';
      toast.error(errorMessage);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const updateLead = useCallback(async (id: string, updates: Partial<LeadCompra>) => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('lead_compra')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;

      setLeads(prev => prev.map(lead => 
        lead.id === id ? data : lead
      ));
      toast.success('Lead/Compra atualizado com sucesso!');
      return data;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro ao atualizar lead';
      toast.error(errorMessage);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const deleteLead = useCallback(async (id: string) => {
    setIsLoading(true);
    try {
      const { error } = await supabase
        .from('lead_compra')
        .delete()
        .eq('id', id);

      if (error) throw error;

      setLeads(prev => prev.filter(lead => lead.id !== id));
      toast.success('Lead/Compra removido com sucesso!');
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro ao remover lead';
      toast.error(errorMessage);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const calculateStatistics = useCallback((leadsList: LeadCompra[]): LeadCompraStatistics => {
    if (leadsList.length === 0) {
      return {
        totalRegistos: 0,
        comprasRegistadas: 0,
        leadsRegistados: 0,
        valorTotalRegistado: 0,
        estatisticasValores: {
          registosComValor: 0,
          media: 0,
          minimo: 0,
          mediana: 0,
          maximo: 0,
        },
        distribuicaoPorGenero: {
          masculino: 0,
          feminino: 0,
          outro: 0,
        },
        distribuicaoPorCidade: {},
        distribuicaoPorMes: {},
        conversaoLeadParaCompra: 0,
      };
    }

    const compras = leadsList.filter(lead => lead.tipo === 'Compra');
    const leadsOnly = leadsList.filter(lead => lead.tipo === 'Lead');
    const valoresComPagamento = leadsList.filter(lead => lead.valor_pago > 0);
    const valores = valoresComPagamento.map(lead => lead.valor_pago).sort((a, b) => a - b);

    // Calcular mediana
    const mediana = valores.length === 0 ? 0 : 
      valores.length % 2 === 0 
        ? (valores[valores.length / 2 - 1] + valores[valores.length / 2]) / 2
        : valores[Math.floor(valores.length / 2)];

    // Distribuição por gênero
    const distribuicaoPorGenero = leadsList.reduce((acc, lead) => {
      const genero = lead.genero.toLowerCase();
      acc[genero as keyof typeof acc] = (acc[genero as keyof typeof acc] || 0) + 1;
      return acc;
    }, { masculino: 0, feminino: 0, outro: 0 });

    // Distribuição por cidade
    const distribuicaoPorCidade = leadsList.reduce((acc, lead) => {
      acc[lead.cidade] = (acc[lead.cidade] || 0) + 1;
      return acc;
    }, {} as { [cidade: string]: number });

    // Distribuição por mês
    const distribuicaoPorMes = leadsList.reduce((acc, lead) => {
      const data = new Date(lead.data_evento);
      const mesAno = `${data.getMonth() + 1}/${data.getFullYear()}`;
      acc[mesAno] = (acc[mesAno] || 0) + 1;
      return acc;
    }, {} as { [mes: string]: number });

    // Taxa de conversão
    const conversaoLeadParaCompra = leadsOnly.length > 0 
      ? (compras.length / (compras.length + leadsOnly.length)) * 100 
      : 0;

    return {
      totalRegistos: leadsList.length,
      comprasRegistadas: compras.length,
      leadsRegistados: leadsOnly.length,
      valorTotalRegistado: leadsList.reduce((sum, lead) => sum + lead.valor_pago, 0),
      estatisticasValores: {
        registosComValor: valoresComPagamento.length,
        media: valores.length > 0 ? valores.reduce((sum, val) => sum + val, 0) / valores.length : 0,
        minimo: valores.length > 0 ? Math.min(...valores) : 0,
        mediana: mediana,
        maximo: valores.length > 0 ? Math.max(...valores) : 0,
      },
      distribuicaoPorGenero,
      distribuicaoPorCidade,
      distribuicaoPorMes,
      conversaoLeadParaCompra: Math.round(conversaoLeadParaCompra * 100) / 100,
    };
  }, []);

  const importLeads = useCallback(async (data: ImportData[]): Promise<ImportResult> => {
    setIsLoading(true);
    let sucessos = 0;
    let erros = 0;
    const detalhesErros: string[] = [];
    const dadosImportados: LeadCompra[] = [];

    try {
      for (let i = 0; i < data.length; i++) {
        try {
          const item = data[i];
          
          // Validar dados
          if (!item.nome || !item.email || !item.telefone) {
            throw new Error(`Linha ${i + 1}: Campos obrigatórios em falta (nome, email, telefone)`);
          }

          // Preparar dados para inserção
          const leadData = {
            nome: item.nome.trim(),
            email: item.email.trim().toLowerCase(),
            telefone: item.telefone.trim(),
            idade: parseInt(item.idade.toString()),
            genero: item.genero as any,
            cidade: item.cidade.trim(),
            valor_pago: parseFloat(item.valor_pago.toString()) || 0,
            data_evento: item.data_evento,
            tipo: item.tipo as any,
            origem_campanha: item.origem_campanha?.trim() || null,
          };

          // Inserir no banco
          const { data: insertedData, error } = await supabase
            .from('lead_compra')
            .insert([leadData])
            .select()
            .single();

          if (error) throw error;

          dadosImportados.push(insertedData);
          sucessos++;
        } catch (err) {
          erros++;
          detalhesErros.push(
            err instanceof Error ? err.message : `Linha ${i + 1}: Erro desconhecido`
          );
        }
      }

      // Atualizar lista local
      if (dadosImportados.length > 0) {
        setLeads(prev => [...dadosImportados, ...prev]);
        toast.success(`Importação concluída: ${sucessos} sucessos, ${erros} erros`);
      }

      return {
        totalLinhas: data.length,
        sucessos,
        erros,
        detalhesErros,
        dadosImportados,
      };
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro na importação';
      toast.error(errorMessage);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Calcular estatísticas sempre que a lista de leads mudar
  useEffect(() => {
    if (leads.length > 0) {
      const stats = calculateStatistics(leads);
      setStatistics(stats);
    }
  }, [leads, calculateStatistics]);

  // Carregar dados iniciais
  useEffect(() => {
    fetchLeads();
  }, [fetchLeads]);

  return {
    leads,
    statistics,
    isLoading,
    error,
    fetchLeads,
    addLead,
    updateLead,
    deleteLead,
    importLeads,
    calculateStatistics,
  };
};
