import { useState, useEffect, useCallback } from 'react';
import { useSupabaseClient } from './useSupabaseClient';
import { toast } from 'sonner';
import { Database } from '@/integrations/supabase/types';

type Client = Database['public']['Tables']['clientes']['Row'];
type NewClient = Database['public']['Tables']['clientes']['Insert'];
type UpdateClient = Database['public']['Tables']['clientes']['Update'];

export function useClients() {
  const supabase = useSupabaseClient();
  const [clients, setClients] = useState<Client[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Load clients from Supabase
  const loadClients = useCallback(async () => {
    try {
      setIsLoading(true);
      const { data, error: supabaseError } = await supabase
        .from('clientes')
        .select('*')
        .order('nome', { ascending: true });

      if (supabaseError) {
        throw supabaseError;
      }

      setClients(data);
      setError(null);
    } catch (err) {
      setError('Error loading clients');
      console.error('Error loading clients:', err);
      toast.error('Failed to load clients');
    } finally {
      setIsLoading(false);
    }
  }, [supabase]);

  // Initial load
  useEffect(() => {
    loadClients();
  }, [loadClients]);

  // Add new client
  const addClient = useCallback(async (client: NewClient) => {
    try {
      // Start a transaction
      const { data: newClient, error: insertError } = await supabase
        .from('clientes')
        .insert([client])
        .select()
        .single();

      if (insertError) {
        throw insertError;
      }

      // If there's a payment amount, create a payment record
      if (client.total_pago && client.total_pago > 0) {
        const initialPayment = {
          id_cliente: newClient.id,
          data: new Date().toISOString(),
          valor: client.total_pago,
          descricao: client.total_pago === 85 ? 'Avaliação Inicial' : 
                    client.total_pago === 400 ? 'Pack Mensal Neurofeedback' : 
                    client.total_pago === 55 ? 'Sessão Individual Neurofeedback' : 'Pagamento Inicial',
          tipo: 'Multibanco',
          criado_em: new Date().toISOString()
        };

        const { error: paymentError } = await supabase
          .from('pagamentos')
          .insert([initialPayment]);

        if (paymentError) {
          console.error('Error adding initial payment:', paymentError);
          // Don't throw here, as the client was already created
        }
      }

      // Update the clients state with the new client
      setClients(prev => [...prev, newClient]);
      toast.success('Client added successfully');
    } catch (err) {
      console.error('Error adding client:', err);
      toast.error('Failed to add client');
    }
  }, [supabase]);

  // Update client
  const updateClient = useCallback(async (id: number, updates: UpdateClient) => {
    try {
      const { error: updateError } = await supabase
        .from('clientes')
        .update(updates)
        .eq('id', id);

      if (updateError) {
        throw updateError;
      }

      // Refresh the clients list
      await loadClients();
      toast.success('Client updated successfully');
    } catch (err) {
      console.error('Error updating client:', err);
      toast.error('Failed to update client');
    }
  }, [loadClients, supabase]);

  // Delete client
  const deleteClient = useCallback(async (id: number) => {
    try {
      const { error: deleteError } = await supabase
        .from('clientes')
        .delete()
        .eq('id', id);

      if (deleteError) {
        throw deleteError;
      }

      // Refresh the clients list
      await loadClients();
      toast.success('Client deleted successfully');
    } catch (err) {
      console.error('Error deleting client:', err);
      toast.error('Failed to delete client');
    }
  }, [loadClients, supabase]);

  // Search clients
  const searchClients = useCallback((query: string) => {
    const searchTerm = query.toLowerCase();
    return clients.filter(client => 
      client.nome.toLowerCase().includes(searchTerm) ||
      client.email.toLowerCase().includes(searchTerm)
    );
  }, [clients]);

  return {
    clients,
    isLoading,
    error,
    addClient,
    updateClient,
    deleteClient,
    searchClients,
    refresh: loadClients
  };
}

export default useClients; 