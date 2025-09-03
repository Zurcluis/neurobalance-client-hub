import { useDatabase } from '@/contexts/DatabaseContext';
import { supabase } from '@/integrations/supabase/client';

export const useSupabaseClient = () => {
  const { status } = useDatabase();

  if (status === 'offline') {
    throw new Error('A base de dados está offline. As operações foram bloqueadas.');
  }

  return supabase;
};
