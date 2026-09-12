import { useState, useEffect, useCallback } from 'react';
import type { PostgrestError } from '@supabase/supabase-js';
import { useSupabaseClient } from '@/hooks/useSupabaseClient';
import { toast } from 'sonner';
import { useActivityLogger } from '@/hooks/useActivityLogger';
import { formatCurrency } from '@/utils/formatUtils';

// Definição de tipos
// A tabela 'despesas' ainda não está refletida nos tipos gerados do Supabase,
// pelo que a sua forma é declarada localmente (colunas: id, tipo, categoria, data, valor, notas, criado_em).
export type Expense = {
  id: number;
  tipo: string;
  categoria: string;
  data: string;
  valor: number;
  notas?: string;
  criado_em: string;
};
type NewExpense = Omit<Expense, 'id' | 'criado_em'>;
type UpdateExpense = Partial<NewExpense>;

// Criar tabela despesas usando a função SQL que está no Supabase
const createExpensesTable = async (supabaseClient: ReturnType<typeof useSupabaseClient>) => {
    try {
      // Usar a função create_despesas_table diretamente via RPC
      const { error } = await supabaseClient.rpc('create_despesas_table');

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

// Partilha pedidos idênticos concorrentes (vários componentes montados em simultâneo)
type ExpensesQueryResult = { data: Expense[] | null; error: PostgrestError | null };

const expensesFetchInFlight = new Map<string, Promise<ExpensesQueryResult>>();

const fetchExpensesShared = (supabaseClient: ReturnType<typeof useSupabaseClient>): Promise<ExpensesQueryResult> => {
  const key = 'all';
  let request = expensesFetchInFlight.get(key);

  if (!request) {
    request = (async () => {
      // Verificar se a tabela existe
      try {
        const { error: tableCheckError } = await supabaseClient
          .from('despesas')
          .select('id')
          .limit(1);

        if (tableCheckError) {
          // Tabela não existe ou erro de permissão
          if (tableCheckError.code === '42P01' || tableCheckError.code === '42501') {
            // Tabela não existe ou erro de RLS, criar/recriar tabela
            const created = await createExpensesTable(supabaseClient);
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

      return supabaseClient
        .from('despesas')
        .select('*')
        .order('data', { ascending: false });
    })().finally(() => {
      expensesFetchInFlight.delete(key);
    });
    expensesFetchInFlight.set(key, request);
  }

  return request;
};

export function useExpenses() {
  const supabase = useSupabaseClient();
  const { logActivity } = useActivityLogger();
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Carregar despesas do Supabase
  const fetchExpenses = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      const { data, error } = await fetchExpensesShared(supabase);

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
          const created = await createExpensesTable(supabase);
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
            logActivity(
              'expense_created',
              'despesa',
              (retryData as Expense)?.id,
              `Despesa de ${formatCurrency(Number(expense.valor ?? 0))} (${expense.categoria}) registada`
            );
            return retryData;
          }
        }
        throw error;
      }

      setExpenses(prev => [data as Expense, ...prev]);
      toast.success('Despesa adicionada com sucesso');
      logActivity(
        'expense_created',
        'despesa',
        (data as Expense)?.id,
        `Despesa de ${formatCurrency(Number(expense.valor ?? 0))} (${expense.categoria}) registada`
      );
      return data;
    } catch (err) {
      console.error('Erro ao adicionar despesa:', err);
      toast.error('Falha ao adicionar despesa');
      throw err;
    }
  }, [supabase, logActivity]);

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