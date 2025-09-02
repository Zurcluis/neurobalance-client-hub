import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Database } from '@/integrations/supabase/types';
import { Session } from '@/types/client';

type SessionRow = Database['public']['Tables']['sessoes_ativas']['Row'];
type NewSession = Database['public']['Tables']['sessoes_ativas']['Insert'];
type UpdateSession = Database['public']['Tables']['sessoes_ativas']['Update'];

export function useSessions(clientId?: number) {
  const [sessions, setSessions] = useState<Session[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Load sessions from Supabase
  useEffect(() => {
    const loadSessions = async () => {
      if (!clientId) {
        setSessions([]);
        setIsLoading(false);
        return;
      }

      try {
        setIsLoading(true);
        const { data, error: supabaseError } = await supabase
          .from('sessoes_ativas')
          .select('*')
          .eq('id_cliente', clientId)
          .order('inicio', { ascending: false });

        if (supabaseError) {
          throw supabaseError;
        }

        // Transform database rows to Session type
        const transformedSessions: Session[] = data.map(row => ({
          id: row.id?.toString() || '',
          clientId: row.id_cliente?.toString() || '',
          date: row.inicio || '',
          notes: row.notas || '',
          paid: false,
          terapeuta: '',
          type: '',
          status: '',
          duracao: row.duracao || 0,
          endDate: row.fim || ''
        }));

        setSessions(transformedSessions);
        setError(null);
      } catch (err) {
        setError('Error loading sessions');
        console.error('Error loading sessions:', err);
        toast.error('Failed to load sessions');
      } finally {
        setIsLoading(false);
      }
    };

    loadSessions();
  }, [clientId]);

  // Add new session
  const addSession = useCallback(async (session: NewSession) => {
    try {
      const { data, error: insertError } = await supabase
        .from('sessoes_ativas')
        .insert([session])
        .select()
        .single();

      if (insertError) {
        throw insertError;
      }

      // Transform database row to Session type
      const transformedSession: Session = {
        id: data.id?.toString() || '',
        clientId: data.id_cliente?.toString() || '',
        date: data.inicio || '',
        notes: data.notas || '',
        paid: false,
        terapeuta: '',
        type: '',
        status: '',
        duracao: data.duracao || 0,
        endDate: data.fim || ''
      };

      setSessions(prev => [...prev, transformedSession]);
      toast.success('Session added successfully');
      return transformedSession;
    } catch (err) {
      console.error('Error adding session:', err);
      toast.error('Failed to add session');
      throw err;
    }
  }, []);

  // Update session
  const updateSession = useCallback(async (id: number, updates: UpdateSession) => {
    try {
      const { data, error: updateError } = await supabase
        .from('sessoes_ativas')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (updateError) {
        throw updateError;
      }

      // Transform database row to Session type
      const transformedSession: Session = {
        id: data.id?.toString() || '',
        clientId: data.id_cliente?.toString() || '',
        date: data.inicio || '',
        notes: data.notas || '',
        paid: false,
        terapeuta: '',
        type: '',
        status: '',
        duracao: data.duracao || 0,
        endDate: data.fim || ''
      };

      setSessions(prev => prev.map(session => 
        session.id === id.toString() ? transformedSession : session
      ));
      toast.success('Session updated successfully');
      return transformedSession;
    } catch (err) {
      console.error('Error updating session:', err);
      toast.error('Failed to update session');
      throw err;
    }
  }, []);

  // Delete session
  const deleteSession = useCallback(async (id: number) => {
    try {
      const { error: deleteError } = await supabase
        .from('sessoes_ativas')
        .delete()
        .eq('id', id);

      if (deleteError) {
        throw deleteError;
      }

      setSessions(prev => prev.filter(session => session.id !== id.toString()));
      toast.success('Session deleted successfully');
    } catch (err) {
      console.error('Error deleting session:', err);
      toast.error('Failed to delete session');
      throw err;
    }
  }, []);

  return {
    sessions,
    isLoading,
    error,
    addSession,
    updateSession,
    deleteSession
  };
}

export default useSessions; 