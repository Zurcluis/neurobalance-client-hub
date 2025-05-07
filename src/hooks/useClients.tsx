import { useState, useEffect, useCallback } from 'react';
import { ClientDetailData } from '@/types/client';
import { toast } from 'sonner';

// Função para carregar clientes do localStorage
const loadClientsFromStorage = (): ClientDetailData[] => {
  if (typeof window === 'undefined') return [];
  
  try {
    const storedClients = localStorage.getItem('clients');
    return storedClients ? JSON.parse(storedClients) : [];
  } catch (error) {
    console.error('Erro ao carregar clientes do localStorage:', error);
    return [];
  }
};

// Função para salvar clientes no localStorage
const saveClientsToStorage = (clients: ClientDetailData[]) => {
  if (typeof window === 'undefined') return;
  
  try {
    localStorage.setItem('clients', JSON.stringify(clients));
  } catch (error) {
    console.error('Erro ao salvar clientes no localStorage:', error);
    toast.error('Erro ao salvar clientes. Tente novamente.');
  }
};

export function useClients() {
  const [clients, setClients] = useState<ClientDetailData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Carregar clientes ao montar o componente
  useEffect(() => {
    try {
      setIsLoading(true);
      const loadedClients = loadClientsFromStorage();
      setClients(loadedClients);
      setError(null);
    } catch (err) {
      setError('Erro ao carregar clientes');
      console.error('Erro ao carregar clientes:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Salvar clientes no localStorage sempre que houver alterações
  useEffect(() => {
    if (!isLoading && clients.length > 0) {
      saveClientsToStorage(clients);
    }
  }, [clients, isLoading]);

  // Função para adicionar um novo cliente
  const addClient = useCallback((newClient: ClientDetailData) => {
    setClients(prev => {
      // Verifica se o cliente já existe
      const exists = prev.some(client => client.id === newClient.id);
      if (exists) {
        toast.error('Cliente já existe');
        return prev;
      }
      
      const updatedClients = [...prev, newClient];
      saveClientsToStorage(updatedClients);
      return updatedClients;
    });
  }, []);

  // Função para atualizar um cliente existente
  const updateClient = useCallback((updatedClient: ClientDetailData) => {
    setClients(prev => {
      const updatedClients = prev.map(client => 
        client.id === updatedClient.id ? updatedClient : client
      );
      saveClientsToStorage(updatedClients);
      return updatedClients;
    });
  }, []);

  // Função para remover um cliente
  const removeClient = useCallback((clientId: string) => {
    setClients(prev => {
      const updatedClients = prev.filter(client => client.id !== clientId);
      saveClientsToStorage(updatedClients);
      return updatedClients;
    });
  }, []);

  // Função para buscar clientes por nome ou ID
  const searchClients = useCallback((query: string) => {
    if (!query.trim()) return clients;
    
    const lowerQuery = query.toLowerCase().trim();
    return clients.filter(client => 
      client.id.toLowerCase().includes(lowerQuery) ||
      client.name.toLowerCase().includes(lowerQuery) ||
      client.email.toLowerCase().includes(lowerQuery) ||
      client.phone.includes(lowerQuery)
    );
  }, [clients]);

  return {
    clients,
    isLoading,
    error,
    addClient,
    updateClient,
    removeClient,
    searchClients
  };
}

export default useClients; 