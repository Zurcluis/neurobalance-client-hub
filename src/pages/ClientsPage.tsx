import React, { useState } from 'react';
import PageLayout from '@/components/layout/PageLayout';
import ClientCard from '@/components/clients/ClientCard';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogTrigger } from '@/components/ui/dialog';
import ClientForm, { ClientFormData } from '@/components/clients/ClientForm';
import { Plus, Search } from 'lucide-react';
import { toast } from 'sonner';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import useClients from '@/hooks/useClients';
import { ClientDetailData } from '@/types/client';
import { Database } from '@/integrations/supabase/types';

type Client = Database['public']['Tables']['clientes']['Row'];

const ClientsPage = () => {
  const { 
    clients, 
    isLoading, 
    addClient, 
    deleteClient, 
    searchClients 
  } = useClients();

  const [searchQuery, setSearchQuery] = useState('');
  const [isAddClientOpen, setIsAddClientOpen] = useState(false);

  const filteredClients = searchQuery ? searchClients(searchQuery) : clients;

  const clientsByStatus = {
    ongoing: filteredClients.filter(client => client.estado === 'ongoing' || !client.estado),
    thinking: filteredClients.filter(client => client.estado === 'thinking'),
    'no-need': filteredClients.filter(client => client.estado === 'no-need'),
    finished: filteredClients.filter(client => client.estado === 'finished'),
    call: filteredClients.filter(client => client.estado === 'call'),
  };

  const handleAddClient = async (data: ClientFormData) => {
    try {
      await addClient({
        nome: data.nome,
        email: data.email,
        telefone: data.telefone,
        data_nascimento: data.data_nascimento ? data.data_nascimento.toISOString() : null,
        genero: data.genero,
        morada: data.morada,
        notas: data.notas || '',
        estado: data.estado,
        tipo_contato: data.tipo_contato,
        como_conheceu: data.como_conheceu,
        numero_sessoes: data.numero_sessoes || 0,
        total_pago: data.total_pago || 0,
        max_sessoes: data.max_sessoes || 0,
      });
      setIsAddClientOpen(false);
    } catch (error) {
      console.error('Error adding client:', error);
      toast.error('Failed to add client');
    }
  };

  const handleDeleteClient = async (id: number) => {
    try {
      await deleteClient(id);
    } catch (error) {
      console.error('Error deleting client:', error);
      toast.error('Failed to delete client');
    }
  };

  if (isLoading) {
    return (
      <PageLayout>
        <div className="flex items-center justify-center h-full">
          <div className="text-center">
            <h2 className="text-xl font-semibold mb-2">Loading clients...</h2>
            <p className="text-gray-500">Please wait while we fetch your clients</p>
          </div>
        </div>
      </PageLayout>
    );
  }

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
          
          <Dialog open={isAddClientOpen} onOpenChange={setIsAddClientOpen}>
            <DialogTrigger asChild>
              <Button className="bg-[#3A726D] hover:bg-[#265255] w-full sm:w-auto">
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
      
      <Tabs defaultValue="all" className="w-full">
        <TabsList className="grid grid-cols-6 mb-6">
          <TabsTrigger value="all">All</TabsTrigger>
          <TabsTrigger value="ongoing">On Going</TabsTrigger>
          <TabsTrigger value="thinking">Thinking</TabsTrigger>
          <TabsTrigger value="no-need">No Need</TabsTrigger>
          <TabsTrigger value="finished">Finished</TabsTrigger>
          <TabsTrigger value="call">Call</TabsTrigger>
        </TabsList>
        
        <TabsContent value="all" className="mt-0">
          {filteredClients.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredClients.map(client => (
                <ClientCard 
                  key={client.id} 
                  client={client} 
                  onDelete={() => handleDeleteClient(client.id)}
                  statusClass={`client-${client.estado || 'ongoing'}`}
                />
              ))}
            </div>
          ) : (
            <div className="text-center py-12 bg-white dark:bg-[#1A1F2C] rounded-lg shadow-sm p-8">
              <h3 className="text-xl font-medium mb-2">Nenhum cliente encontrado</h3>
              <p className="text-gray-600 dark:text-gray-300 mb-6">Adicione seu primeiro cliente para começar</p>
              <Button 
                className="bg-[#3A726D] hover:bg-[#265255]" 
                onClick={() => setIsAddClientOpen(true)}
              >
                <Plus className="h-4 w-4 mr-2" />
                Adicionar Novo Cliente
              </Button>
            </div>
          )}
        </TabsContent>

        {Object.entries(clientsByStatus).map(([status, clientList]) => (
          <TabsContent key={status} value={status} className="mt-0">
            {clientList.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {clientList.map(client => (
                  <ClientCard 
                    key={client.id} 
                    client={client} 
                    onDelete={() => handleDeleteClient(client.id)}
                    statusClass={`client-${status}`}
                  />
                ))}
              </div>
            ) : (
              <div className="text-center py-12 bg-white dark:bg-[#1A1F2C] rounded-lg shadow-sm p-8">
                <h3 className="text-xl font-medium mb-2">Nenhum cliente encontrado</h3>
                <p className="text-gray-600 dark:text-gray-300 mb-6">Adicione seu primeiro cliente para começar</p>
                <Button 
                  className="bg-[#3A726D] hover:bg-[#265255]" 
                  onClick={() => setIsAddClientOpen(true)}
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
