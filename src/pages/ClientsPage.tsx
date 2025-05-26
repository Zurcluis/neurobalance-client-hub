import React, { useState } from 'react';
import PageLayout from '@/components/layout/PageLayout';
import ClientCard from '@/components/clients/ClientCard';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogTrigger } from '@/components/ui/dialog';
import ClientForm, { ClientFormData } from '@/components/clients/ClientForm';
import ClientImport from '@/components/clients/ClientImport';
import { Plus, Search, Upload, X, Calendar, Filter, ChevronDown } from 'lucide-react';
import { toast } from 'sonner';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import useClients from '@/hooks/useClients';
import { ClientDetailData } from '@/types/client';
import { Database } from '@/integrations/supabase/types';
import { format, parseISO, isValid, subMonths, subDays, isAfter, isBefore } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Label } from '@/components/ui/label';
import { DateRangePicker } from '@/components/ui/date-range-picker';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';

type Client = Database['public']['Tables']['clientes']['Row'];

// Tipo para período de datas
type DatePeriod = 'all' | 'month' | 'quarter' | 'halfyear' | 'year' | 'custom';

interface DateRange {
  from: Date | undefined;
  to: Date | undefined;
}

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
  const [isImportDialogOpen, setIsImportDialogOpen] = useState(false);
  const [activeDialog, setActiveDialog] = useState<'form' | 'import'>('form');
  const [datePeriod, setDatePeriod] = useState<DatePeriod>('all');
  const [dateRange, setDateRange] = useState<DateRange>({ 
    from: undefined, 
    to: undefined 
  });
  const [showPeriodSelector, setShowPeriodSelector] = useState(false);

  // Primeiro filtramos por texto
  const textFilteredClients = searchQuery ? searchClients(searchQuery) : clients;
  
  // Função para aplicar filtragem por período aos clientes
  const filterClientsByPeriod = (clients: Client[]): Client[] => {
    if (datePeriod === 'all') {
      return clients;
    }

    let fromDate: Date | undefined;
    let toDate: Date = new Date();

    // Definir datas com base no período selecionado
    switch (datePeriod) {
      case 'month':
        fromDate = subMonths(new Date(), 1);
        break;
      case 'quarter':
        fromDate = subMonths(new Date(), 3);
        break;
      case 'halfyear':
        fromDate = subMonths(new Date(), 6);
        break;
      case 'year':
        fromDate = subMonths(new Date(), 12);
        break;
      case 'custom':
        fromDate = dateRange.from;
        toDate = dateRange.to || new Date();
        break;
    }

    // Filtrar clientes com base no período
    return clients.filter(client => {
      // Se não tivermos um campo de data para filtrar, usamos a data de criação
      const clientDate = client.criado_em ? parseISO(client.criado_em) : null;
      
      if (!clientDate) return true; // Se não há data, incluímos
      
      const isAfterFrom = fromDate ? isAfter(clientDate, fromDate) : true;
      const isBeforeTo = isValid(toDate) ? isBefore(clientDate, toDate) : true;
      
      return isAfterFrom && isBeforeTo;
    });
  };

  // Aplicar ambos os filtros
  const filteredClients = filterClientsByPeriod(textFilteredClients);

  // Função para obter o título do período selecionado
  const getPeriodTitle = (): string => {
    switch (datePeriod) {
      case 'all':
        return "Todos os períodos";
      case 'month':
        return "Último Mês";
      case 'quarter':
        return "Último Trimestre";
      case 'halfyear':
        return "Último Semestre";
      case 'year':
        return "Último Ano";
      case 'custom':
        if (dateRange.from && dateRange.to) {
          return `De ${format(dateRange.from, 'dd/MM/yyyy')} até ${format(dateRange.to, 'dd/MM/yyyy')}`;
        }
        return "Período Personalizado";
    }
  };

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
        email: data.email || '',
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
        responsavel: data.responsavel || null,
        motivo: data.motivo || null,
        id_manual: data.id_manual || null
      });
      setIsAddClientOpen(false);
      toast.success('Cliente adicionado com sucesso!');
    } catch (error) {
      console.error('Error adding client:', error);
      toast.error('Falha ao adicionar cliente');
    }
  };

  const handleImportClients = async (clients: ClientFormData[]) => {
    try {
      // Contador para clientes adicionados com sucesso
      let successCount = 0;

      // Processar cada cliente
      for (const client of clients) {
        try {
          await addClient({
            nome: client.nome,
            email: client.email,
            telefone: client.telefone,
            data_nascimento: client.data_nascimento ? client.data_nascimento.toISOString() : null,
            genero: client.genero,
            morada: client.morada || '',
            notas: client.notas || '',
            estado: client.estado,
            tipo_contato: client.tipo_contato,
            como_conheceu: client.como_conheceu,
            numero_sessoes: client.numero_sessoes || 0,
            total_pago: client.total_pago || 0,
            max_sessoes: client.max_sessoes || 0,
          });
          successCount++;
        } catch (error) {
          console.error(`Erro ao importar cliente ${client.nome}:`, error);
        }
      }

      setIsImportDialogOpen(false);
      if (successCount === clients.length) {
        toast.success(`${successCount} cliente(s) importado(s) com sucesso!`);
      } else {
        toast.success(`${successCount} de ${clients.length} cliente(s) importado(s) com sucesso.`);
      }
    } catch (error) {
      console.error('Erro ao importar clientes:', error);
      toast.error('Falha ao importar clientes');
    }
  };

  const handleDeleteClient = async (id: number) => {
    try {
      await deleteClient(id);
    } catch (error) {
      console.error('Error deleting client:', error);
      toast.error('Falha ao excluir cliente');
    }
  };

  const openAddClientDialog = () => {
    setActiveDialog('form');
    setIsAddClientOpen(true);
    setIsImportDialogOpen(false);
  };

  const openImportDialog = () => {
    setActiveDialog('import');
    setIsImportDialogOpen(true);
    setIsAddClientOpen(false);
  };

  if (isLoading) {
    return (
      <PageLayout>
        <div className="flex items-center justify-center h-full">
          <div className="text-center">
            <h2 className="text-xl font-semibold mb-2">Carregando clientes...</h2>
            <p className="text-gray-500">Aguarde enquanto buscamos seus clientes</p>
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
          <div className="flex flex-col md:flex-row gap-2 w-full md:w-auto">
            <div className="relative w-full sm:w-auto">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
              <Input
                placeholder="Pesquisar clientes..."
                className="pl-9 w-full"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button 
                  variant="outline" 
                  className="flex items-center gap-2 w-full md:w-auto"
                >
                  <Calendar className="h-4 w-4" />
                  <span className="text-sm truncate">Período: {getPeriodTitle()}</span>
                  <ChevronDown className="h-4 w-4 ml-auto md:ml-2" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-72">
                <div className="p-2">
                  <h4 className="text-sm font-medium mb-3">Filtrar por período</h4>
                  <div className="grid grid-cols-2 gap-1 mb-2">
                    <DropdownMenuItem onClick={() => setDatePeriod('all')}>
                      Todos os períodos
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => setDatePeriod('month')}>
                      Último mês
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => setDatePeriod('quarter')}>
                      Último trimestre
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => setDatePeriod('halfyear')}>
                      Último semestre
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => setDatePeriod('year')}>
                      Último ano
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => setDatePeriod('custom')}>
                      Personalizado
                    </DropdownMenuItem>
                  </div>
                  
                  {datePeriod === 'custom' && (
                    <div className="mt-4 space-y-2">
                      <Label className="text-xs">Selecione o intervalo de datas</Label>
                      <DateRangePicker
                        value={
                          dateRange.from
                            ? { from: dateRange.from, to: dateRange.to }
                            : undefined
                        }
                        onChange={(date) => {
                          setDateRange({ from: date?.from, to: date?.to });
                        }}
                      />
                    </div>
                  )}
                </div>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
          
          <div className="flex gap-2">
            <Dialog open={isAddClientOpen} onOpenChange={setIsAddClientOpen}>
              <DialogTrigger asChild>
                <Button 
                  className="bg-[#3A726D] hover:bg-[#265255] flex-1 sm:flex-auto"
                  onClick={openAddClientDialog}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Adicionar Cliente
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[600px]">
                <DialogHeader>
                  <div className="flex justify-between items-center">
                    <DialogTitle>Adicionar Novo Cliente</DialogTitle>
                    <Tabs defaultValue="form" className="w-[260px]">
                      <TabsList className="grid grid-cols-2">
                        <TabsTrigger 
                          value="form" 
                          onClick={() => setActiveDialog('form')}
                        >
                          Formulário
                        </TabsTrigger>
                        <TabsTrigger 
                          value="import" 
                          onClick={() => setActiveDialog('import')}
                        >
                          Importar
                        </TabsTrigger>
                      </TabsList>
                    </Tabs>
                  </div>
                  <DialogDescription>
                    {activeDialog === 'form' 
                      ? 'Preencha os dados abaixo para adicionar um novo cliente.'
                      : 'Importe dados de clientes a partir de arquivos.'}
                  </DialogDescription>
                </DialogHeader>
                {activeDialog === 'form' ? (
                  <ClientForm onSubmit={handleAddClient} />
                ) : (
                  <ClientImport onImportComplete={handleImportClients} />
                )}
              </DialogContent>
            </Dialog>
            
            <Dialog open={isImportDialogOpen} onOpenChange={setIsImportDialogOpen}>
              <DialogTrigger asChild>
                <Button 
                  variant="outline" 
                  className="flex-1 sm:flex-auto"
                  onClick={openImportDialog}
                >
                  <Upload className="h-4 w-4 mr-2" />
                  Importar
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[700px]">
                <DialogHeader>
                  <DialogTitle>Importar Clientes</DialogTitle>
                  <DialogDescription>
                    Importe dados de clientes a partir de arquivos.
                  </DialogDescription>
                </DialogHeader>
                <ClientImport onImportComplete={handleImportClients} />
              </DialogContent>
            </Dialog>
          </div>
        </div>
      </div>
      
      <div className="mb-6 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div className="flex items-center gap-2">
          <h1 className="text-3xl font-bold gradient-heading">Clientes</h1>
          {datePeriod !== 'all' && (
            <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-xs font-medium">
              {getPeriodTitle()}
            </span>
          )}
        </div>
        <div className="text-lg font-semibold text-gray-700 dark:text-gray-200">
          Total: {filteredClients.length}
        </div>
      </div>
      
      <Tabs defaultValue="all" className="w-full">
        <TabsList className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 mb-6">
          <TabsTrigger value="all">Todos ({filteredClients.length})</TabsTrigger>
          <TabsTrigger value="ongoing">On Going ({clientsByStatus.ongoing.length})</TabsTrigger>
          <TabsTrigger value="thinking">Thinking ({clientsByStatus.thinking.length})</TabsTrigger>
          <TabsTrigger value="no-need">No Need ({clientsByStatus['no-need'].length})</TabsTrigger>
          <TabsTrigger value="finished">Finished ({clientsByStatus.finished.length})</TabsTrigger>
          <TabsTrigger value="call">Call ({clientsByStatus.call.length})</TabsTrigger>
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
              <p className="text-gray-600 dark:text-gray-300 mb-6">
                {searchQuery || datePeriod !== 'all' ? 
                  'Tente ajustar seus filtros de pesquisa' : 
                  'Adicione seu primeiro cliente para começar'}
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button 
                  className="bg-[#3A726D] hover:bg-[#265255]" 
                  onClick={openAddClientDialog}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Adicionar Novo Cliente
                </Button>
                <Button 
                  variant="outline" 
                  onClick={openImportDialog}
                >
                  <Upload className="h-4 w-4 mr-2" />
                  Importar Clientes
                </Button>
              </div>
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
                <p className="text-gray-600 dark:text-gray-300 mb-6">
                  {searchQuery || datePeriod !== 'all' ? 
                    'Tente ajustar seus filtros de pesquisa' : 
                    'Adicione seu primeiro cliente para começar'}
                </p>
                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                  <Button 
                    className="bg-[#3A726D] hover:bg-[#265255]" 
                    onClick={openAddClientDialog}
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Adicionar Novo Cliente
                  </Button>
                  <Button 
                    variant="outline" 
                    onClick={openImportDialog}
                  >
                    <Upload className="h-4 w-4 mr-2" />
                    Importar Clientes
                  </Button>
                </div>
              </div>
            )}
          </TabsContent>
        ))}
      </Tabs>
    </PageLayout>
  );
};

export default ClientsPage;
