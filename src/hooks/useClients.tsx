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

  // Initial load and Realtime setup
  useEffect(() => {
    loadClients();

    const channelId = Math.random().toString(36).substring(2, 9);
    const channel = supabase
      .channel(`clientes_changes_${channelId}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'clientes' },
        (payload) => {
          if (payload.eventType === 'INSERT') {
            setClients(prev => {
              if (prev.some(c => c.id === payload.new.id)) return prev;
              return [...prev, payload.new as Client].sort((a, b) => a.nome.localeCompare(b.nome));
            });
          } else if (payload.eventType === 'UPDATE') {
            setClients(prev => prev.map(c =>
              c.id === payload.new.id ? (payload.new as Client) : c
            ).sort((a, b) => a.nome.localeCompare(b.nome)));
          } else if (payload.eventType === 'DELETE') {
            setClients(prev => prev.filter(c => c.id !== payload.old.id));
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [loadClients, supabase]);

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
      // 1. Get the client details first (before we delete them) so we have their email, telefone, and nome
      const { data: clientToDelete } = await supabase
        .from('clientes')
        .select('nome, email, telefone')
        .eq('id', id)
        .maybeSingle();

      // 2. Delete the client from the database
      const { error: deleteError } = await supabase
        .from('clientes')
        .delete()
        .eq('id', id);

      if (deleteError) {
        throw deleteError;
      }

      // 3. Immediately update local client state
      setClients(prev => prev.filter(c => c.id !== id));
      toast.success('Cliente eliminado com sucesso!');

      // 4. Delete corresponding leads in landing_leads & lead_compra
      if (clientToDelete) {
        const email = clientToDelete.email?.trim();
        const telefone = clientToDelete.telefone?.trim();
        const nome = clientToDelete.nome?.trim();

        if (email) {
          await supabase.from('landing_leads').delete().eq('email', email);
          await supabase.from('lead_compra').delete().eq('email', email);
        } else if (telefone) {
          await supabase.from('landing_leads').delete().eq('telefone', telefone);
          await supabase.from('lead_compra').delete().eq('telefone', telefone);
        } else if (nome) {
          await supabase.from('landing_leads').delete().eq('nome', nome);
          await supabase.from('lead_compra').delete().eq('nome', nome);
        }
      }
    } catch (err) {
      console.error('Error deleting client:', err);
      toast.error('Erro ao eliminar cliente');
    }
  }, [supabase]);

  // Search clients
  const searchClients = useCallback((query: string) => {
    const searchTerm = query.toLowerCase();
    return clients.filter(client =>
      client.nome.toLowerCase().includes(searchTerm) ||
      (client.email && client.email.toLowerCase().includes(searchTerm)) ||
      (client.id_manual && client.id_manual.toLowerCase().includes(searchTerm))
    );
  }, [clients]);

  // Gerar próximo ID disponível (formato NB-XXX)
  const generateNextId = useCallback(() => {
    const prefix = 'NB-';
    const existingIds = clients
      .map(c => c.id_manual)
      .filter(id => id && id.startsWith(prefix))
      .map(id => parseInt(id!.replace(prefix, ''), 10))
      .filter(num => !isNaN(num));

    const maxId = existingIds.length > 0 ? Math.max(...existingIds) : 0;
    const nextNum = maxId + 1;
    return `${prefix}${nextNum.toString().padStart(3, '0')}`;
  }, [clients]);

  return {
    clients,
    isLoading,
    error,
    addClient,
    updateClient,
    deleteClient,
    searchClients,
    generateNextId,
    refresh: loadClients
  };
}

export default useClients; 