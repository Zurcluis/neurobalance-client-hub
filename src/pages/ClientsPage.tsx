
import React, { useState, useEffect } from 'react';
import PageLayout from '@/components/layout/PageLayout';
import ClientCard, { ClientData } from '@/components/clients/ClientCard';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import ClientForm, { ClientFormData } from '@/components/clients/ClientForm';
import { Plus, Search } from 'lucide-react';
import { toast } from 'sonner';

// Função para carregar clientes do localStorage
const loadClientsFromStorage = (): ClientData[] => {
  const storedClients = localStorage.getItem('clients');
  return storedClients ? JSON.parse(storedClients) : sampleClients;
};

// Função para salvar clientes no localStorage
const saveClientsToStorage = (clients: ClientData[]) => {
  localStorage.setItem('clients', JSON.stringify(clients));
};

// Dados de exemplo para novos utilizadores
const sampleClients: ClientData[] = [
  {
    id: '1',
    name: 'Maria Silva',
    email: 'maria.silva@example.com',
    phone: '912345678',
    sessionCount: 12,
    nextSession: '28 Abr, 10:00',
    totalPaid: 1440
  },
  {
    id: '2',
    name: 'João Santos',
    email: 'joao.santos@example.com',
    phone: '923456789',
    sessionCount: 5,
    nextSession: '28 Abr, 14:00',
    totalPaid: 600
  },
  {
    id: '3',
    name: 'Ana Costa',
    email: 'ana.costa@example.com',
    phone: '934567890',
    sessionCount: 8,
    nextSession: '29 Abr, 11:00',
    totalPaid: 960
  }
];

const ClientsPage = () => {
  const [clients, setClients] = useState<ClientData[]>(loadClientsFromStorage);
  const [searchQuery, setSearchQuery] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);

  // Salvar clientes no localStorage sempre que houver alterações
  useEffect(() => {
    saveClientsToStorage(clients);
  }, [clients]);

  const filteredClients = clients.filter(client => 
    client.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
    client.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
    client.phone.includes(searchQuery)
  );

  const handleAddClient = (data: ClientFormData) => {
    const newClient: ClientData = {
      id: data.id,
      name: data.nome,
      email: data.email,
      phone: data.contato,
      sessionCount: 0,
      nextSession: null,
      totalPaid: 0
    };
    
    setClients([...clients, newClient]);
    setDialogOpen(false);
    toast.success('Cliente adicionado com sucesso');
  };

  const handleDeleteClient = (clientId: string) => {
    setClients(clients.filter(client => client.id !== clientId));
    toast.success('Cliente eliminado com sucesso');
  };

  return (
    <PageLayout>
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold gradient-heading">Clientes</h1>
          <p className="text-gray-600 mt-2">Gerir informações dos clientes</p>
        </div>
        
        <div className="mt-4 md:mt-0 flex flex-col sm:flex-row gap-4">
          <div className="relative">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
            <Input
              placeholder="Pesquisar clientes..."
              className="pl-9 w-full sm:w-[250px]"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button className="bg-[#3f9094] hover:bg-[#265255]">
                <Plus className="h-4 w-4 mr-2" />
                Adicionar Cliente
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[600px]">
              <DialogHeader>
                <DialogTitle>Adicionar Novo Cliente</DialogTitle>
              </DialogHeader>
              <ClientForm onSubmit={handleAddClient} />
            </DialogContent>
          </Dialog>
        </div>
      </div>
      
      {filteredClients.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredClients.map(client => (
            <ClientCard 
              key={client.id} 
              client={client} 
              onDelete={handleDeleteClient}
            />
          ))}
        </div>
      ) : (
        <div className="text-center py-12">
          <h3 className="text-xl font-medium mb-2">Nenhum cliente encontrado</h3>
          <p className="text-gray-600">Tente ajustar a sua pesquisa ou adicione um novo cliente</p>
        </div>
      )}
    </PageLayout>
  );
};

export default ClientsPage;
