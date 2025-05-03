
import React, { useState, useEffect } from 'react';
import PageLayout from '@/components/layout/PageLayout';
import ClientCard, { ClientData } from '@/components/clients/ClientCard';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogTrigger } from '@/components/ui/dialog';
import ClientForm, { ClientFormData } from '@/components/clients/ClientForm';
import { Plus, Search } from 'lucide-react';
import { toast } from 'sonner';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

// Função para carregar clientes do localStorage
const loadClientsFromStorage = (): ClientData[] => {
  const storedClients = localStorage.getItem('clients');
  return storedClients ? JSON.parse(storedClients) : [];
};

// Função para salvar clientes no localStorage
const saveClientsToStorage = (clients: ClientData[]) => {
  localStorage.setItem('clients', JSON.stringify(clients));
};

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

  const clientsByStatus = {
    ongoing: filteredClients.filter(client => client.status === 'ongoing' || !client.status),
    thinking: filteredClients.filter(client => client.status === 'thinking'),
    'no-need': filteredClients.filter(client => client.status === 'no-need'),
    finished: filteredClients.filter(client => client.status === 'finished'),
    call: filteredClients.filter(client => client.status === 'call'),
  };

  const handleAddClient = (data: ClientFormData) => {
    // Map the form's estado value to the client's status
    let clientStatus: 'ongoing' | 'thinking' | 'no-need' | 'finished' | 'call' = 'ongoing';
    
    if (data.estado === 'On Going') clientStatus = 'ongoing';
    else if (data.estado === 'Thinking') clientStatus = 'thinking';
    else if (data.estado === 'No need') clientStatus = 'no-need';
    else if (data.estado === 'Finished') clientStatus = 'finished';
    else if (data.estado === 'call') clientStatus = 'call';
    
    const newClient: ClientData = {
      id: data.id || Date.now().toString(),
      name: data.nome,
      email: data.email,
      phone: data.contato,
      sessionCount: 0,
      nextSession: null,
      totalPaid: 0,
      status: clientStatus,
      birthday: data.dataNascimento || null,
      problemática: data.problematica || '',
      tipoContato: data.tipoContato,
      comoConheceu: data.comoConheceu
    };
    
    // Save to Supabase if connected
    if (typeof window !== 'undefined' && 'supabase' in window) {
      try {
        const { supabase } = window as any;
        supabase.from('clientes').insert({
          id: newClient.id,
          nome: newClient.name,
          email: newClient.email, 
          telefone: newClient.phone,
          data_nascimento: newClient.birthday,
          morada: '',
          notas: '',
          estado: newClient.status
        }).then((result: any) => {
          if (result.error) {
            console.error('Erro ao salvar cliente no Supabase:', result.error);
          }
        });
      } catch (error) {
        console.error('Erro ao acessar Supabase:', error);
      }
    }
    
    setClients(prev => [...prev, newClient]);
    setDialogOpen(false);
    toast.success('Cliente adicionado com sucesso');
  };

  const handleDeleteClient = (clientId: string) => {
    const updatedClients = clients.filter(client => client.id !== clientId);
    setClients(updatedClients);
    saveClientsToStorage(updatedClients); // Ensure deletion persists to localStorage
    toast.success('Cliente eliminado com sucesso');
  };

  return (
    <PageLayout>
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold gradient-heading">Clientes</h1>
          <p className="text-gray-600 dark:text-gray-300 mt-2">Gerir informações dos clientes</p>
        </div>
        
        <div className="mt-4 md:mt-0 flex flex-col sm:flex-row gap-4 w-full md:w-auto">
          <div className="relative w-full sm:w-auto">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
            <Input
              placeholder="Pesquisar clientes..."
              className="pl-9 w-full"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button className="bg-[#3f9094] hover:bg-[#265255] w-full sm:w-auto">
                <Plus className="h-4 w-4 mr-2" />
                Adicionar Cliente
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[600px]">
              <DialogHeader>
                <DialogTitle>Adicionar Novo Cliente</DialogTitle>
                <DialogDescription>
                  Preencha os dados abaixo para adicionar um novo cliente.
                </DialogDescription>
              </DialogHeader>
              <ClientForm onSubmit={handleAddClient} />
            </DialogContent>
          </Dialog>
        </div>
      </div>
      
      <Tabs defaultValue="ongoing" className="w-full">
        <TabsList className="grid grid-cols-5 mb-6">
          <TabsTrigger value="ongoing">On Going</TabsTrigger>
          <TabsTrigger value="thinking">Thinking</TabsTrigger>
          <TabsTrigger value="no-need">No Need</TabsTrigger>
          <TabsTrigger value="finished">Finished</TabsTrigger>
          <TabsTrigger value="call">Call</TabsTrigger>
        </TabsList>
        
        {Object.entries(clientsByStatus).map(([status, clientList]) => (
          <TabsContent key={status} value={status} className="mt-0">
            {clientList.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {clientList.map(client => (
                  <ClientCard 
                    key={client.id} 
                    client={client} 
                    onDelete={handleDeleteClient}
                    statusClass={`client-${status}`}
                  />
                ))}
              </div>
            ) : (
              <div className="text-center py-12 bg-white dark:bg-[#1A1F2C] rounded-lg shadow-sm p-8">
                <h3 className="text-xl font-medium mb-2">Nenhum cliente encontrado</h3>
                <p className="text-gray-600 dark:text-gray-300 mb-6">Adicione seu primeiro cliente para começar</p>
                <Button 
                  className="bg-[#3f9094] hover:bg-[#265255]" 
                  onClick={() => setDialogOpen(true)}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Adicionar Novo Cliente
                </Button>
              </div>
            )}
          </TabsContent>
        ))}
      </Tabs>
    </PageLayout>
  );
};

export default ClientsPage;
