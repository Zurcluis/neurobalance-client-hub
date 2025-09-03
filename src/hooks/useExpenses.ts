import { useState, useEffect, useCallback } from 'react';
import { useSupabaseClient } from '@/hooks/useSupabaseClient';
import { toast } from 'sonner';
import { Database } from '@/integrations/supabase/types';

// Definição de tipos
type Expense = Database['public']['Tables']['despesas']['Row'];
type NewExpense = Omit<Database['public']['Tables']['despesas']['Insert'], 'id' | 'criado_em'>;
type UpdateExpense = Partial<NewExpense>;

export function useExpenses() {
  const supabase = useSupabaseClient();
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Criar tabela despesas usando a função SQL que está no Supabase
  const createExpensesTable = async () => {
    try {
      // Usar a função create_despesas_table diretamente via RPC
      const { data, error } = await supabase.rpc('create_despesas_table');
      
      if (error) {
        console.error('Erro ao criar tabela despesas:', error);
        
        // Se a função create_despesas_table não existir
        if (error.code === '42883') { // função inexistente
          toast.error('A função para criar tabela não existe no banco de dados. Entre em contato com o administrador.');
          return false;
        }
        
        throw error;
      }
      
      toast.success('Tabela de despesas criada com sucesso');
      return true;
    } catch (err) {
      console.error('Erro ao criar tabela despesas:', err);
      toast.error('Falha ao criar estrutura de despesas');
      return false;
    }
  };

  // Carregar despesas do Supabase
  const fetchExpenses = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      // Verificar se a tabela existe
      try {
        const { error: tableCheckError } = await supabase
          .from('despesas')
          .select('id')
          .limit(1);
        
        if (tableCheckError) {
          // Tabela não existe ou erro de permissão
          if (tableCheckError.code === '42P01' || tableCheckError.code === '42501') {
            // Tabela não existe ou erro de RLS, criar/recriar tabela
            console.log('Tabela não existe ou erro de permissão, tentando criar/recriar');
            const created = await createExpensesTable();
            if (!created) {
              throw new Error('Falha ao criar tabela de despesas');
            }
          } else {
            throw tableCheckError;
          }
        }
      } catch (err) {
        console.error('Erro ao verificar tabela:', err);
      }
      
      const { data, error } = await supabase
        .from('despesas')
        .select('*')
        .order('data', { ascending: false });
      
      if (error) {
        if (error.code === '42P01') {
          // Ainda temos problemas com a tabela, exibir mensagem de erro específica
          setError('A tabela de despesas não existe no banco de dados. Por favor, entre em contato com o administrador do sistema.');
          return;
        } else if (error.code === '42501') {
          // Problema de permissão/RLS
          setError('Erro de permissão ao acessar a tabela de despesas. Por favor, entre em contato com o administrador do sistema.');
          return;
        }
        throw error;
      }
      
      setExpenses(data || []);
      setError(null);
    } catch (err) {
      setError('Erro ao carregar despesas');
      console.error('Erro ao carregar despesas:', err);
      toast.error('Falha ao carregar despesas');
    } finally {
      setIsLoading(false);
    }
  }, [supabase]);

  // Carregar despesas ao inicializar
  useEffect(() => {
    fetchExpenses();
  }, [fetchExpenses]);

  // Adicionar nova despesa
  const addExpense = useCallback(async (expense: NewExpense) => {
    try {
      const { data, error } = await supabase
        .from('despesas')
        .insert([expense])
        .select()
        .single();

      if (error) {
        // Se for erro de RLS, tentar recriar a tabela
        if (error.code === '42501') {
          console.log('Erro de política RLS, tentando recriar as políticas');
          const created = await createExpensesTable();
          if (created) {
            // Tentar novamente após recriar
            const { data: retryData, error: retryError } = await supabase
              .from('despesas')
              .insert([expense])
              .select()
              .single();
              
            if (retryError) {
              throw retryError;
            }
            
            setExpenses(prev => [retryData as Expense, ...prev]);
            toast.success('Despesa adicionada com sucesso');
            return retryData;
          }
        }
        throw error;
      }

      setExpenses(prev => [data as Expense, ...prev]);
      toast.success('Despesa adicionada com sucesso');
      return data;
    } catch (err) {
      console.error('Erro ao adicionar despesa:', err);
      toast.error('Falha ao adicionar despesa');
      throw err;
    }
  }, [supabase]);

  // Atualizar despesa
  const updateExpense = useCallback(async (id: number, updates: UpdateExpense) => {
    try {
      const { data, error } = await supabase
        .from('despesas')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) {
        throw error;
      }

      setExpenses(prev => prev.map(expense => 
        expense.id === id ? data as Expense : expense
      ));
      toast.success('Despesa atualizada com sucesso');
      return data;
    } catch (err) {
      console.error('Erro ao atualizar despesa:', err);
      toast.error('Falha ao atualizar despesa');
      throw err;
    }
  }, [supabase]);

  // Excluir despesa
  const deleteExpense = useCallback(async (id: number) => {
    try {
      const { error } = await supabase
        .from('despesas')
        .delete()
        .eq('id', id);

      if (error) {
        throw error;
      }

      setExpenses(prev => prev.filter(expense => expense.id !== id));
      toast.success('Despesa excluída com sucesso');
    } catch (err) {
      console.error('Erro ao excluir despesa:', err);
      toast.error('Falha ao excluir despesa');
      throw err;
    }
  }, [supabase]);

  // Buscar despesas por tipo
  const getExpensesByType = useCallback((type: string) => {
    return expenses.filter(expense => expense.tipo === type);
  }, [expenses]);

  // Buscar despesas por categoria
  const getExpensesByCategory = useCallback((category: string) => {
    return expenses.filter(expense => expense.categoria === category);
  }, [expenses]);

  // Calcular total de despesas
  const getTotalExpenses = useCallback(() => {
    return expenses.reduce((total, expense) => total + expense.valor, 0);
  }, [expenses]);

  return {
    expenses,
    isLoading,
    error,
    fetchExpenses,
    addExpense,
    updateExpense,
    deleteExpense,
    getExpensesByType,
    getExpensesByCategory,
    getTotalExpenses
  };
}

export default useExpenses; 