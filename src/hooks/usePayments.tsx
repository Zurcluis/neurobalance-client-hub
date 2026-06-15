import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Database } from '@/integrations/supabase/types';

type Payment = Database['public']['Tables']['pagamentos']['Row'] & {
  clientes?: {
    nome: string;
    id_manual: string;
  } | null;
};
type NewPayment = Database['public']['Tables']['pagamentos']['Insert'] & {
  nif?: string;
  tipo_servico?: string;
  numero_fatura?: string;
  valor_base?: number;
  valor_iva?: number;
  retencao?: number;
  estado?: string;
  updated_at?: string;
};
type UpdatePayment = Database['public']['Tables']['pagamentos']['Update'] & {
  nif?: string;
  tipo_servico?: string;
  numero_fatura?: string;
  valor_base?: number;
  valor_iva?: number;
  retencao?: number;
  estado?: string;
  updated_at?: string;
};

export function usePayments(clientId?: number) {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Load payments from Supabase
  useEffect(() => {
    const loadPayments = async () => {
      try {
        setIsLoading(true);
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
          
        // Se um clientId for fornecido, filtrar por esse cliente
        if (clientId) {
          query = query.eq('id_cliente', clientId);
        }
        
        const { data, error: supabaseError } = await query;

        if (supabaseError) {
          throw supabaseError;
        }

        setPayments(data);
        setError(null);
      } catch (err) {
        setError('Error loading payments');
        console.error('Error loading payments:', err);
        toast.error('Failed to load payments');
      } finally {
        setIsLoading(false);
      }
    };

    loadPayments();
  }, [clientId]);

  // Add new payment
  const addPayment = useCallback(async (payment: NewPayment) => {
    try {
      const { data, error: insertError } = await supabase
        .from('pagamentos')
        .insert([payment])
        .select()
        .single();

      if (insertError) {
        throw insertError;
      }

      setPayments(prev => [...prev, data]);
      toast.success('Pagamento adicionado com sucesso');
    } catch (err) {
      console.error('Erro ao adicionar pagamento:', err);
      toast.error('Falha ao adicionar pagamento');
    }
  }, []);

  // Update payment
  const updatePayment = useCallback(async (id: number, updates: UpdatePayment) => {
    try {
      const { data, error: updateError } = await supabase
        .from('pagamentos')
        .update(updates)
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
    } catch (err) {
      console.error('Erro ao atualizar pagamento:', err);
      toast.error('Falha ao atualizar pagamento');
    }
  }, []);

  // Delete payment
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
    } catch (err) {
      console.error('Erro ao eliminar pagamento:', err);
      toast.error('Falha ao eliminar pagamento');
    }
  }, []);

  // Calcular receita total
  const getTotalRevenue = useCallback(() => {
    return payments.reduce((total, payment) => total + (payment.valor || 0), 0);
  }, [payments]);

  return {
    payments,
    isLoading,
    error,
    addPayment,
    updatePayment,
    deletePayment,
    getTotalRevenue
  };
}

export default usePayments; 