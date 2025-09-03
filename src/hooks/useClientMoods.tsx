import { useState, useEffect, useCallback } from 'react';
import { useSupabaseClient } from '@/hooks/useSupabaseClient';
import { toast } from 'sonner';
import { Database } from '@/integrations/supabase/types';

type ClientMood = Database['public']['Tables']['humor_cliente']['Row'];
type NewClientMood = Database['public']['Tables']['humor_cliente']['Insert'];
type UpdateClientMood = Database['public']['Tables']['humor_cliente']['Update'];

export function useClientMoods(clientId?: number) {
  const supabase = useSupabaseClient();
  const [moods, setMoods] = useState<ClientMood[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Load client moods from Supabase
  useEffect(() => {
    const loadMoods = async () => {
      if (!clientId) {
        setMoods([]);
        setIsLoading(false);
        return;
      }

      try {
        setIsLoading(true);
        const { data, error: supabaseError } = await supabase
          .from('humor_cliente')
          .select('*')
          .eq('id_cliente', clientId)
          .order('data', { ascending: false });

        if (supabaseError) {
          throw supabaseError;
        }

        setMoods(data);
        setError(null);
      } catch (err) {
        setError('Error loading client moods');
        console.error('Error loading client moods:', err);
        toast.error('Failed to load client moods');
      } finally {
        setIsLoading(false);
      }
    };

    loadMoods();
  }, [clientId, supabase]);

  // Add new mood entry
  const addMood = useCallback(async (mood: NewClientMood) => {
    try {
      const { data, error: insertError } = await supabase
        .from('humor_cliente')
        .insert([mood])
        .select()
        .single();

      if (insertError) {
        throw insertError;
      }

      setMoods(prev => [...prev, data]);
      toast.success('Mood entry added successfully');
    } catch (err) {
      console.error('Error adding mood entry:', err);
      toast.error('Failed to add mood entry');
    }
  }, [supabase]);

  // Update mood entry
  const updateMood = useCallback(async (id: number, updates: UpdateClientMood) => {
    try {
      const { data, error: updateError } = await supabase
        .from('humor_cliente')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (updateError) {
        throw updateError;
      }

      setMoods(prev => prev.map(m => 
        m.id === id ? data : m
      ));
      toast.success('Mood entry updated successfully');
    } catch (err) {
      console.error('Error updating mood entry:', err);
      toast.error('Failed to update mood entry');
    }
  }, [supabase]);

  // Delete mood entry
  const deleteMood = useCallback(async (id: number) => {
    try {
      const { error: deleteError } = await supabase
        .from('humor_cliente')
        .delete()
        .eq('id', id);

      if (deleteError) {
        throw deleteError;
      }

      setMoods(prev => prev.filter(m => m.id !== id));
      toast.success('Mood entry deleted successfully');
    } catch (err) {
      console.error('Error deleting mood entry:', err);
      toast.error('Failed to delete mood entry');
    }
  }, [supabase]);

  return {
    moods,
    isLoading,
    error,
    addMood,
    updateMood,
    deleteMood
  };
}

export default useClientMoods; 