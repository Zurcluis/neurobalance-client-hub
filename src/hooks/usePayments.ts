import { useState, useEffect, useCallback } from 'react';
import { useSupabaseClient } from '@/hooks/useSupabaseClient';
import { toast } from 'sonner';
import { Database } from '@/integrations/supabase/types';
import { useActivityLogger } from '@/hooks/useActivityLogger';
import { formatCurrency } from '@/utils/formatUtils';

type PaymentRow = Database['public']['Tables']['pagamentos']['Row'];
type NewPayment = Database['public']['Tables']['pagamentos']['Insert'];
type UpdatePayment = Database['public']['Tables']['pagamentos']['Update'];

type PaymentWithClient = PaymentRow & {
  clientes?: {
    nome: string | null;
    id_manual?: string | null;
  } | null;
};

export type Payment = PaymentRow & {
  cliente_nome?: string;
  cliente_id_manual?: string | null;
};

// Função para criar a tabela de pagamentos se não existir
const ensurePaymentsTable = async (supabase: any) => {
  try {
    // Tentar verificar se a tabela existe
    const { error: checkError } = await supabase
      .from('pagamentos')
      .select('id')
      .limit(1);

    // Se receber um erro indicando que a tabela não existe (código 42P01)
    if (checkError && checkError.code === '42P01') {
      // Verificar se o cliente tem outras tabelas existentes
      const { error: tablesError } = await supabase
        .from('clientes')
        .select('id')
        .limit(1);

      if (tablesError) {
        console.error('Sem permissões suficientes para acessar tabelas:', tablesError);
        toast.error('Sem permissões para acessar o banco de dados');
        return false;
      }

      toast.error('A tabela de pagamentos não existe no banco de dados');
      console.error('É necessário criar a tabela de pagamentos no painel do Supabase');
      return false;
    }

    return true; // Tabela existe
  } catch (err) {
    console.error('Erro ao verificar tabela de pagamentos:', err);
    toast.error('Falha na estrutura do banco de dados');
    return false;
  }
};

// Função global para criar pagamento de teste
export const createSamplePayment = async (supabase: any) => {
  try {
    // Primeiro garantir que a tabela existe
    const tableExists = await ensurePaymentsTable(supabase);
    if (!tableExists) {
      return null;
    }

    // Verificar se existem clientes
    const { data: clients, error: clientError } = await supabase
      .from('clientes')
      .select('id')
      .limit(1);

    if (clientError) {
      console.error('Erro ao verificar clientes:', clientError);
      return null;
    }

    if (!clients || clients.length === 0) {
      toast.error('Não há clientes para associar um pagamento de teste');
      return null;
    }

    const clientId = clients[0].id;

    // Criar pagamento de teste
    const samplePayment = {
      id_cliente: clientId,
      valor: 75.00,
      data: new Date().toISOString().split('T')[0],
      tipo: 'Dinheiro',
      descricao: 'Pagamento de teste'
    };

    const { data, error } = await supabase
      .from('pagamentos')
      .insert(samplePayment)
      .select();

    if (error) {
      console.error('Erro ao criar pagamento de teste:', error);
      toast.error('Erro ao criar pagamento de teste: ' + error.message);
      return null;
    }

    toast.success('Pagamento de teste criado para demonstração');
    return data[0];
  } catch (err) {
    console.error('Erro ao criar pagamento de teste:', err);
    toast.error('Erro ao criar pagamento de teste');
    return null;
  }
};

// Partilha pedidos idênticos concorrentes (vários componentes montados em simultâneo)
const paymentsFetchInFlight = new Map<string, Promise<PaymentWithClient[]>>();

const fetchPaymentsShared = (
  supabase: ReturnType<typeof useSupabaseClient>,
  clientId?: number
): Promise<PaymentWithClient[]> => {
  const key = clientId == null ? 'all' : String(clientId);
  let request = paymentsFetchInFlight.get(key);

  if (!request) {
    request = (async () => {
      const tableExists = await ensurePaymentsTable(supabase);
      if (!tableExists) {
        throw new Error('Falha ao acessar tabela de pagamentos');
      }

      let query = supabase
        .from('pagamentos')
        .select(`
          *,
          clientes (
            nome,
            id_manual
          )
        `)
        .order('data', { ascending: false });

      if (clientId) {
        query = query.eq('id_cliente', clientId);
      }

      const { data, error: paymentError } = await query;

      if (paymentError) {
        console.error('Erro ao buscar pagamentos:', paymentError);
        throw new Error('Erro ao carregar pagamentos: ' + paymentError.message);
      }

      return (data || []) as PaymentWithClient[];
    })().finally(() => {
      paymentsFetchInFlight.delete(key);
    });
    paymentsFetchInFlight.set(key, request);
  }

  return request;
};

/**
 * Hook unificado de pagamentos.
 * - Sem clientId: carrega todos os pagamentos (Finanças, Estatísticas, Relatórios)
 * - Com clientId: filtra os pagamentos desse cliente (perfil do cliente)
 */
export function usePayments(clientId?: number) {
  const supabase = useSupabaseClient();
  const { logActivity } = useActivityLogger();
  const [payments, setPayments] = useState<Payment[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<Error | null>(null);

  const formatPayments = (data: PaymentWithClient[]): Payment[] =>
    data.map((payment) => ({
      ...payment,
      cliente_nome: payment.clientes?.nome || 'Cliente Desconhecido',
      cliente_id_manual: payment.clientes?.id_manual || null
    }));

  const fetchPayments = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      const data = await fetchPaymentsShared(supabase, clientId);
      setPayments(formatPayments((data || []) as PaymentWithClient[]));
    } catch (err) {
      console.error('Erro ao carregar pagamentos:', err);
      setError(err instanceof Error ? err : new Error('Erro desconhecido'));
      toast.error('Falha ao carregar dados de pagamentos');
    } finally {
      setIsLoading(false);
    }
  }, [supabase, clientId]);

  useEffect(() => {
    fetchPayments();

    // Configurar escuta em tempo real para atualizações
    const channelId = Math.random().toString(36).substring(2, 9);
    const filterString = clientId ? `id_cliente=eq.${clientId}` : undefined;
    const channel = supabase
      .channel(`payment-changes_${channelId}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'pagamentos', filter: filterString },
        () => {
          fetchPayments();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchPayments, supabase, clientId]);

  const addPayment = async (newPayment: NewPayment) => {
    try {
      // Garantir que a tabela existe
      const tableExists = await ensurePaymentsTable(supabase);
      if (!tableExists) {
        throw new Error('Falha ao acessar tabela de pagamentos');
      }

      const { com_iva, ...paymentToInsert } = newPayment as any;
      const { data, error } = await supabase
        .from('pagamentos')
        .insert([paymentToInsert])
        .select('*')
        .single();

      if (error) {
        console.error('Erro ao inserir pagamento:', error);
        throw error;
      }

      toast.success('Pagamento registrado com sucesso');
      logActivity(
        'payment_created',
        'pagamento',
        data?.id,
        `Pagamento de ${formatCurrency(Number(newPayment.valor ?? 0))} registado`
      );

      // Atualizar lista de pagamentos
      fetchPayments();
      return data;
    } catch (err) {
      console.error('Erro ao adicionar pagamento:', err);
      toast.error('Falha ao registrar pagamento');
      return null;
    }
  };

  const updatePayment = useCallback(async (id: number, updates: UpdatePayment) => {
    try {
      const { com_iva, ...updatesToApply } = updates as any;
      const { data, error: updateError } = await supabase
        .from('pagamentos')
        .update(updatesToApply)
        .eq('id', id)
        .select()
        .single();

      if (updateError) {
        throw updateError;
      }

      setPayments(prev => prev.map(payment =>
        payment.id === id ? data : payment
      ));
      toast.success('Pagamento atualizado com sucesso');
      return data;
    } catch (err) {
      console.error('Erro ao atualizar pagamento:', err);
      toast.error('Falha ao atualizar pagamento');
      return null;
    }
  }, [supabase]);

  const deletePayment = useCallback(async (id: number) => {
    try {
      const { error: deleteError } = await supabase
        .from('pagamentos')
        .delete()
        .eq('id', id);

      if (deleteError) {
        throw deleteError;
      }

      setPayments(prev => prev.filter(payment => payment.id !== id));
      toast.success('Pagamento eliminado com sucesso');
      return true;
    } catch (err) {
      console.error('Erro ao eliminar pagamento:', err);
      toast.error('Falha ao eliminar pagamento');
      return false;
    }
  }, [supabase]);

  // Função para calcular a receita total
  const getTotalRevenue = useCallback(() => {
    return payments.reduce((total, payment) => total + (payment.valor || 0), 0);
  }, [payments]);

  return {
    payments,
    isLoading,
    error,
    fetchPayments,
    addPayment,
    updatePayment,
    deletePayment,
    getTotalRevenue
  };
}

export default usePayments;
