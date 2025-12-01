import { useState, useEffect, useCallback } from 'react';
import { useSupabaseClient } from '@/hooks/useSupabaseClient';
import { toast } from 'sonner';

type Payment = {
  id: number;
  id_cliente: number;
  valor: number;
  data: string;
  tipo: string;
  descricao: string;
  cliente_nome?: string;
};

type PaymentWithClient = Payment & {
  clientes?: {
    nome: string | null;
    id_manual?: string | null;
  } | null;
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
      console.log('Tabela de pagamentos não existe - verificando acesso admin');
      
      // Verificar se o cliente tem outras tabelas existentes
      const { data: tablesData, error: tablesError } = await supabase
        .from('clientes')
        .select('id')
        .limit(1);
      
      if (tablesError) {
        console.error('Sem permissões suficientes para acessar tabelas:', tablesError);
        toast.error('Sem permissões para acessar o banco de dados');
        return false;
      }
      
      // Se chegamos aqui, o problema é específico da tabela de pagamentos
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
    
    console.log('Criando pagamento de exemplo para teste...');
    
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
      console.log('Nenhum cliente encontrado para criar pagamento de teste');
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
    
    console.log('Pagamento de teste criado com sucesso:', data);
    toast.success('Pagamento de teste criado para demonstração');
    
    return data[0];
  } catch (err) {
    console.error('Erro ao criar pagamento de teste:', err);
    toast.error('Erro ao criar pagamento de teste');
    return null;
  }
};

export function usePayments() {
  const supabase = useSupabaseClient();
  const [payments, setPayments] = useState<Payment[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchPayments = useCallback(async () => {
    try {
      console.log('Iniciando carregamento de pagamentos...');
      setIsLoading(true);
      setError(null);
      
      // Garantir que a tabela existe
      const tableExists = await ensurePaymentsTable(supabase);
      if (!tableExists) {
        throw new Error('Falha ao acessar tabela de pagamentos');
      }
      
      // Buscar pagamentos
      const { data, error: paymentError } = await supabase
        .from('pagamentos')
        .select(`
          *,
          clientes (
            nome,
            id_manual
          )
        `)
        .order('data', { ascending: false });
      
      if (paymentError) {
        console.error('Erro ao buscar pagamentos:', paymentError);
        throw new Error('Erro ao carregar pagamentos: ' + paymentError.message);
      }
      
      console.log('Resposta do Supabase (pagamentos):', data);
      
      if (!data || data.length === 0) {
        console.log('Nenhum pagamento encontrado no banco de dados');
        setPayments([]);
        return;
      }
      
      // Log do primeiro pagamento para debug
      if (data.length > 0) {
        console.log('Primeiro pagamento (raw):', data[0]);
        console.log('Cliente do primeiro pagamento:', data[0].clientes);
      }
      
      const formattedPayments = data.map((payment: PaymentWithClient) => {
        const clienteNome = payment.clientes?.nome || 'Cliente Desconhecido';
        const clienteIdManual = payment.clientes?.id_manual || null;
        
        console.log(`Pagamento ${payment.id} - cliente_id_manual:`, clienteIdManual);
        
        return {
          ...payment,
          cliente_nome: clienteNome,
          cliente_id_manual: clienteIdManual
        };
      });
      
      console.log('Pagamentos formatados:', formattedPayments.length);
      console.log('Primeiro pagamento formatado:', formattedPayments[0]);
      setPayments(formattedPayments);
    } catch (err) {
      console.error('Erro ao carregar pagamentos:', err);
      setError(err instanceof Error ? err : new Error('Erro desconhecido'));
      toast.error('Falha ao carregar dados de pagamentos');
    } finally {
      setIsLoading(false);
    }
  }, [supabase]);

  useEffect(() => {
    fetchPayments();
    
    // Configurar escuta em tempo real para atualizações
    const channel = supabase
      .channel('payment-changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'pagamentos' },
        () => {
          console.log('Alterações detectadas na tabela pagamentos');
          fetchPayments();
        }
      )
      .subscribe();
    
    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchPayments]);

  const addPayment = async (newPayment: Omit<Payment, 'id' | 'cliente_nome'>) => {
    try {
      console.log('Adicionando novo pagamento:', newPayment);
      
      // Garantir que a tabela existe
      const tableExists = await ensurePaymentsTable(supabase);
      if (!tableExists) {
        throw new Error('Falha ao acessar tabela de pagamentos');
      }
      
      const { data, error } = await supabase
        .from('pagamentos')
        .insert(newPayment)
        .select('*')
        .single();
      
      if (error) {
        console.error('Erro ao inserir pagamento:', error);
        throw error;
      }
      
      toast.success('Pagamento registrado com sucesso');
      
      // Atualizar lista de pagamentos
      fetchPayments();
      return data;
    } catch (err) {
      console.error('Erro ao adicionar pagamento:', err);
      toast.error('Falha ao registrar pagamento');
      throw err;
    }
  };

  // Função para calcular a receita total
  const getTotalRevenue = () => {
    return payments.reduce((total, payment) => total + (payment.valor || 0), 0);
  };

  return {
    payments,
    isLoading,
    error,
    fetchPayments,
    addPayment,
    createSamplePayment,
    getTotalRevenue
  };
}

export default usePayments; 