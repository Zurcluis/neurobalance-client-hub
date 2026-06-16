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
type NewPayment = Database['public']['Tables']['pagamentos']['Insert'];
type UpdatePayment = Database['public']['Tables']['pagamentos']['Update'];

export function usePayments(clientId?: number) {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Load payments from Supabase and subscribe to real-time changes
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
        setError('Erro ao carregar pagamentos');
        console.error('Erro ao carregar pagamentos:', err);
        toast.error('Falha ao carregar pagamentos');
      } finally {
        setIsLoading(false);
      }
    };

    loadPayments();

    // Configurar escuta em tempo real para atualizações
    const channelId = Math.random().toString(36).substring(2, 9);
    let filterString = '';
    if (clientId) {
      filterString = `id_cliente=eq.${clientId}`;
    }
    const channel = supabase
      .channel(`client-payment-changes_${channelId}`)
      .on(
        'postgres_changes',
        { 
          event: '*', 
          schema: 'public', 
          table: 'pagamentos',
          filter: filterString || undefined
        },
        () => {
          console.log('Alterações detectadas na tabela pagamentos (cliente específica)');
          loadPayments();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [clientId]);

  // Add new payment
  const addPayment = useCallback(async (payment: NewPayment) => {
    try {
      const { com_iva, ...paymentToInsert } = payment as any;
      const { data, error: insertError } = await supabase
        .from('pagamentos')
        .insert([paymentToInsert])
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