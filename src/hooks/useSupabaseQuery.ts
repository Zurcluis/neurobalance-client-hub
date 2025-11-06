import { useQuery, useMutation, useQueryClient, UseQueryOptions, UseMutationOptions } from '@tanstack/react-query';
import { PostgrestError } from '@supabase/supabase-js';
import { toast } from 'sonner';
import { logger } from '@/lib/logger';

type QueryKeyType = readonly unknown[];

export function useSupabaseQuery<TData = unknown>(
  queryKey: QueryKeyType,
  queryFn: () => Promise<TData>,
  options?: Omit<UseQueryOptions<TData, PostgrestError>, 'queryKey' | 'queryFn'>
) {
  return useQuery<TData, PostgrestError>({
    queryKey,
    queryFn: async () => {
      try {
        const data = await queryFn();
        return data;
      } catch (error) {
        logger.error('Erro na query do Supabase:', error);
        throw error;
      }
    },
    ...options,
  });
}

interface MutationOptions<TData, TVariables> 
  extends Omit<UseMutationOptions<TData, PostgrestError, TVariables>, 'mutationFn'> {
  showSuccessToast?: boolean;
  showErrorToast?: boolean;
  successMessage?: string;
  errorMessage?: string;
}

export function useSupabaseMutation<TData = unknown, TVariables = unknown>(
  mutationFn: (variables: TVariables) => Promise<TData>,
  options?: MutationOptions<TData, TVariables>
) {
  const queryClient = useQueryClient();

  const {
    showSuccessToast = true,
    showErrorToast = true,
    successMessage = 'Operação realizada com sucesso',
    errorMessage = 'Erro ao realizar operação',
    ...mutationOptions
  } = options || {};

  return useMutation<TData, PostgrestError, TVariables>({
    mutationFn: async (variables: TVariables) => {
      try {
        const data = await mutationFn(variables);
        if (showSuccessToast) {
          toast.success(successMessage);
        }
        return data;
      } catch (error) {
        logger.error('Erro na mutation do Supabase:', error);
        if (showErrorToast) {
          const message = error instanceof Error ? error.message : errorMessage;
          toast.error(message);
        }
        throw error;
      }
    },
    onSuccess: (data, variables, context) => {
      mutationOptions.onSuccess?.(data, variables, context);
      queryClient.invalidateQueries();
    },
    ...mutationOptions,
  });
}


