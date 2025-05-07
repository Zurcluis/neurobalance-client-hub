import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Database } from '@/integrations/supabase/types';

type Communication = Database['public']['Tables']['comunicacoes']['Row'];
type NewCommunication = Database['public']['Tables']['comunicacoes']['Insert'];
type UpdateCommunication = Database['public']['Tables']['comunicacoes']['Update'];

export function useCommunications(clientId?: number) {
  const [communications, setCommunications] = useState<Communication[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Load communications from Supabase
  useEffect(() => {
    const loadCommunications = async () => {
      if (!clientId) {
        setCommunications([]);
        setIsLoading(false);
        return;
      }

      try {
        setIsLoading(true);
        const { data, error: supabaseError } = await supabase
          .from('comunicacoes')
          .select('*')
          .eq('id_cliente', clientId)
          .order('data', { ascending: false });

        if (supabaseError) {
          throw supabaseError;
        }

        setCommunications(data);
        setError(null);
      } catch (err) {
        setError('Error loading communications');
        console.error('Error loading communications:', err);
        toast.error('Failed to load communications');
      } finally {
        setIsLoading(false);
      }
    };

    loadCommunications();
  }, [clientId]);

  // Add new communication
  const addCommunication = useCallback(async (communication: NewCommunication) => {
    try {
      const { data, error: insertError } = await supabase
        .from('comunicacoes')
        .insert([communication])
        .select()
        .single();

      if (insertError) {
        throw insertError;
      }

      setCommunications(prev => [...prev, data]);
      toast.success('Communication added successfully');
    } catch (err) {
      console.error('Error adding communication:', err);
      toast.error('Failed to add communication');
    }
  }, []);

  // Update communication
  const updateCommunication = useCallback(async (id: number, updates: UpdateCommunication) => {
    try {
      const { data, error: updateError } = await supabase
        .from('comunicacoes')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (updateError) {
        throw updateError;
      }

      setCommunications(prev => prev.map(comm => 
        comm.id === id ? data : comm
      ));
      toast.success('Communication updated successfully');
    } catch (err) {
      console.error('Error updating communication:', err);
      toast.error('Failed to update communication');
    }
  }, []);

  // Delete communication
  const deleteCommunication = useCallback(async (id: number) => {
    try {
      const { error: deleteError } = await supabase
        .from('comunicacoes')
        .delete()
        .eq('id', id);

      if (deleteError) {
        throw deleteError;
      }

      setCommunications(prev => prev.filter(comm => comm.id !== id));
      toast.success('Communication deleted successfully');
    } catch (err) {
      console.error('Error deleting communication:', err);
      toast.error('Failed to delete communication');
    }
  }, []);

  return {
    communications,
    isLoading,
    error,
    addCommunication,
    updateCommunication,
    deleteCommunication
  };
}

export default useCommunications; 