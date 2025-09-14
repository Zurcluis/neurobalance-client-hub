import React, { useState, useMemo } from 'react';
import PageLayout from '@/components/layout/PageLayout';
import { useAdminContext } from '@/contexts/AdminContext';
import ClientCard from '@/components/clients/ClientCard';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogTrigger } from '@/components/ui/dialog';
import ClientForm, { ClientFormData } from '@/components/clients/ClientForm';
import ClientImport from '@/components/clients/ClientImport';
import { Plus, Search, Upload, X, Calendar, Filter, ChevronDown, Download, Users, TrendingUp, BarChart3, Target, PieChart, User, Key, MessageSquare } from 'lucide-react';
import { toast } from 'sonner';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import useClients from '@/hooks/useClients';
import { ClientDetailData } from '@/types/client';
import { Database } from '@/integrations/supabase/types';
import { format, parseISO, isValid, subMonths, subDays, isAfter, isBefore, differenceInYears } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Label } from '@/components/ui/label';
import { DateRangePicker } from '@/components/ui/date-range-picker';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { AlertDialog, AlertDialogTrigger, AlertDialogContent, AlertDialogHeader, AlertDialogTitle, AlertDialogDescription, AlertDialogFooter, AlertDialogCancel, AlertDialogAction } from '@/components/ui/alert-dialog';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ResponsiveContainer, BarChart, CartesianGrid, XAxis, YAxis, Tooltip, Legend, Bar, PieChart as RechartsPieChart, Pie, Cell, LineChart, Line } from 'recharts';
import useAppointments from '@/hooks/useAppointments';
import usePayments from '@/hooks/usePayments';
import ClientTokenManager from '@/components/admin/ClientTokenManager';
import AdminChatPanel from '@/components/admin/AdminChatPanel';

type Client = Database['public']['Tables']['clientes']['Row'];

type DatePeriod = 'all' | 'month' | 'quarter' | 'halfyear' | 'year' | 'custom';

interface DateRange {
  from: Date | undefined;
  to: Date | undefined;
}

const ClientsPage = () => {
  const { isAdminContext } = useAdminContext();
  const { 
    clients, 
    isLoading, 
    addClient, 
    deleteClient, 
    searchClients 
  } = useClients();
  
  const { appointments } = useAppointments();
  const { payments } = usePayments();

  const [searchQuery, setSearchQuery] = useState('');
  const [isAddClientOpen, setIsAddClientOpen] = useState(false);
  const [isImportDialogOpen, setIsImportDialogOpen] = useState(false);
  const [activeDialog, setActiveDialog] = useState<'form' | 'import'>('form');
  const [datePeriod, setDatePeriod] = useState<DatePeriod>('all');
  const [dateRange, setDateRange] = useState<DateRange>({ 
    from: undefined, 
    to: undefined 
  });
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [clientToDelete, setClientToDelete] = useState<Client | null>(null);
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [selectedGender, setSelectedGender] = useState<string>('all');
  const [ageRange, setAgeRange] = useState<string>('all');
  const [sortBy, setSortBy] = useState<string>('name');
  const [viewMode, setViewMode] = useState<'grid' | 'analytics' | 'tokens' | 'chat'>('grid');

  // Filtros avançados
  const filteredAndSortedClients = useMemo(() => {
    let filtered = clients;
    
    // Filtro por texto
    if (searchQuery) {
      filtered = searchClients(searchQuery);
    }
    
    // Filtro por período
    if (datePeriod !== 'all') {
    let fromDate: Date | undefined;
    let toDate: Date = new Date();

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

      filtered = filtered.filter(client => {
      const clientDate = client.criado_em ? parseISO(client.criado_em) : null;
        if (!clientDate) return true;
      
      const isAfterFrom = fromDate ? isAfter(clientDate, fromDate) : true;
      const isBeforeTo = isValid(toDate) ? isBefore(clientDate, toDate) : true;
      
      return isAfterFrom && isBeforeTo;
    });
    }
    
    // Filtro por status
    if (selectedStatus !== 'all') {
      filtered = filtered.filter(client => client.estado === selectedStatus);
    }
    
    // Filtro por gênero
    if (selectedGender !== 'all') {
      filtered = filtered.filter(client => client.genero === selectedGender);
    }
    
    // Filtro por idade
    if (ageRange !== 'all') {
      filtered = filtered.filter(client => {
        if (!client.data_nascimento) return false;
        const age = differenceInYears(new Date(), parseISO(client.data_nascimento));
        
        switch (ageRange) {
          case '18-25':
            return age >= 18 && age <= 25;
          case '26-35':
            return age >= 26 && age <= 35;
          case '36-45':
            return age >= 36 && age <= 45;
          case '46-60':
            return age >= 46 && age <= 60;
          case '60+':
            return age > 60;
          default:
            return true;
        }
      });
    }
    
    // Ordenação
    const sorted = [...filtered].sort((a, b) => {
      switch (sortBy) {
        case 'name':
          return a.nome.localeCompare(b.nome);
        case 'date':
          const dateA = a.criado_em ? new Date(a.criado_em).getTime() : 0;
          const dateB = b.criado_em ? new Date(b.criado_em).getTime() : 0;
          return dateB - dateA;
        case 'sessions':
          const sessionsA = appointments.filter(apt => apt.id_cliente === a.id).length;
          const sessionsB = appointments.filter(apt => apt.id_cliente === b.id).length;
          return sessionsB - sessionsA;
        case 'revenue':
          const revenueA = payments.filter(pay => pay.id_cliente === a.id).reduce((sum, pay) => sum + (pay.valor || 0), 0);
          const revenueB = payments.filter(pay => pay.id_cliente === b.id).reduce((sum, pay) => sum + (pay.valor || 0), 0);
          return revenueB - revenueA;
        default:
          return 0;
      }
    });
    
    return sorted;
  }, [clients, searchQuery, datePeriod, dateRange, selectedStatus, selectedGender, ageRange, sortBy, searchClients, appointments, payments]);

  // Analytics dos clientes
  const clientAnalytics = useMemo(() => {
    const total = filteredAndSortedClients.length;
    const activeClients = filteredAndSortedClients.filter(client => client.estado === 'ongoing' || !client.estado).length;
    const newClientsThisMonth = filteredAndSortedClients.filter(client => {
      if (!client.criado_em) return false;
      const clientDate = parseISO(client.criado_em);
      const oneMonthAgo = subMonths(new Date(), 1);
      return clientDate >= oneMonthAgo;
    }).length;
    
    // Distribuição por gênero
    const genderDistribution = filteredAndSortedClients.reduce((acc, client) => {
      const gender = client.genero || 'Não especificado';
      acc[gender] = (acc[gender] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    
    // Distribuição por idade
    const ageDistribution = filteredAndSortedClients.reduce((acc, client) => {
      if (!client.data_nascimento) {
        acc['Não especificado'] = (acc['Não especificado'] || 0) + 1;
        return acc;
      }
      
      const age = differenceInYears(new Date(), parseISO(client.data_nascimento));
      let ageGroup = 'Não especificado';
      
      if (age >= 18 && age <= 25) ageGroup = '18-25';
      else if (age >= 26 && age <= 35) ageGroup = '26-35';
      else if (age >= 36 && age <= 45) ageGroup = '36-45';
      else if (age >= 46 && age <= 60) ageGroup = '46-60';
      else if (age > 60) ageGroup = '60+';
      
      acc[ageGroup] = (acc[ageGroup] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    
    // Distribuição por status
    const statusDistribution = filteredAndSortedClients.reduce((acc, client) => {
      const status = client.estado || 'ongoing';
      const statusLabels = {
        ongoing: 'Em Andamento',
        thinking: 'Pensando',
        'no-need': 'Sem Necessidade',
        finished: 'Finalizado',
        call: 'Ligar'
      };
      const label = statusLabels[status] || status;
      acc[label] = (acc[label] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    
    // Evolução mensal
    const monthlyEvolution = [];
    for (let i = 5; i >= 0; i--) {
      const month = subMonths(new Date(), i);
      const monthStart = new Date(month.getFullYear(), month.getMonth(), 1);
      const monthEnd = new Date(month.getFullYear(), month.getMonth() + 1, 0);
      
      const monthClients = clients.filter(client => {
        if (!client.criado_em) return false;
        const clientDate = parseISO(client.criado_em);
        return clientDate >= monthStart && clientDate <= monthEnd;
      }).length;
      
      monthlyEvolution.push({
        month: format(month, 'MMM', { locale: ptBR }),
        clientes: monthClients
      });
    }
    
    // Top clientes por receita
    const topClientsByRevenue = filteredAndSortedClients.map(client => {
      const clientRevenue = payments.filter(pay => pay.id_cliente === client.id).reduce((sum, pay) => sum + (pay.valor || 0), 0);
      const clientSessions = appointments.filter(apt => apt.id_cliente === client.id).length;
      return {
        ...client,
        revenue: clientRevenue,
        sessions: clientSessions
      };
    }).sort((a, b) => b.revenue - a.revenue).slice(0, 10);
    
    return {
      total,
      activeClients,
      newClientsThisMonth,
      conversionRate: total > 0 ? (activeClients / total) * 100 : 0,
      genderDistribution: Object.entries(genderDistribution).map(([name, value]) => ({ name, value })),
      ageDistribution: Object.entries(ageDistribution).map(([name, value]) => ({ name, value })),
      statusDistribution: Object.entries(statusDistribution).map(([name, value]) => ({ name, value })),
      monthlyEvolution,
      topClientsByRevenue
    };
  }, [filteredAndSortedClients, clients, appointments, payments]);

  const clientsByStatus = useMemo(() => ({
    ongoing: filteredAndSortedClients.filter(client => client.estado === 'ongoing' || !client.estado),
    thinking: filteredAndSortedClients.filter(client => client.estado === 'thinking'),
    'no-need': filteredAndSortedClients.filter(client => client.estado === 'no-need'),
    finished: filteredAndSortedClients.filter(client => client.estado === 'finished'),
    desistiu: filteredAndSortedClients.filter(client => client.estado === 'desistiu'),
  }), [filteredAndSortedClients]);

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
      let successCount = 0;

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

  const handleRequestDeleteClient = (client: Client) => {
    setClientToDelete(client);
    setDeleteDialogOpen(true);
  };

  const handleConfirmDeleteClient = async () => {
    if (clientToDelete) {
      await handleDeleteClient(clientToDelete.id);
      setDeleteDialogOpen(false);
      setClientToDelete(null);
    }
  };

  const handleExportData = () => {
    const exportData = {
      clientes: filteredAndSortedClients.map(client => ({
        nome: client.nome,
        email: client.email,
        telefone: client.telefone,
        genero: client.genero,
        estado: client.estado,
        dataCriacao: client.criado_em,
        sessoes: appointments.filter(apt => apt.id_cliente === client.id).length,
        receita: payments.filter(pay => pay.id_cliente === client.id).reduce((sum, pay) => sum + (pay.valor || 0), 0)
      })),
      analytics: clientAnalytics,
      dataExportacao: new Date().toISOString()
    };
    
    const dataStr = JSON.stringify(exportData, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
    
    const exportFileDefaultName = `clientes-data-${format(new Date(), 'yyyy-MM-dd')}.json`;
    
    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    linkElement.click();
    
    toast.success('Dados exportados com sucesso!');
  };

  const clearFilters = () => {
    setSearchQuery('');
    setDatePeriod('all');
    setDateRange({ from: undefined, to: undefined });
    setSelectedStatus('all');
    setSelectedGender('all');
    setAgeRange('all');
    setSortBy('name');
  };

  if (isLoading) {
    const loadingContent = (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#3f9094] mx-auto mb-4"></div>
          <h2 className="text-xl font-semibold mb-2">Carregando clientes...</h2>
          <p className="text-gray-500">Aguarde enquanto buscamos seus clientes</p>
        </div>
      </div>
    );

    return isAdminContext ? loadingContent : (
      <PageLayout>
        {loadingContent}
      </PageLayout>
    );
  }

  const pageContent = (
    <div className="space-y-6">
        {/* Cabeçalho */}
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
            <h1 className="text-3xl font-bold text-[#3f9094]">Gestão de Clientes</h1>
            <p className="text-gray-600 mt-2">Gerir informações e analytics dos clientes</p>
          </div>
          
          <div className="flex gap-3">
            <Button
              variant={viewMode === 'grid' ? 'default' : 'outline'}
              onClick={() => setViewMode('grid')}
              className="flex items-center gap-2"
            >
              <Users className="h-4 w-4" />
              Clientes
            </Button>
            <Button
              variant={viewMode === 'analytics' ? 'default' : 'outline'}
              onClick={() => setViewMode('analytics')}
              className="flex items-center gap-2"
            >
              <BarChart3 className="h-4 w-4" />
              Analytics
            </Button>
            <Button
              variant={viewMode === 'tokens' ? 'default' : 'outline'}
              onClick={() => setViewMode('tokens')}
              className="flex items-center gap-2"
            >
              <Key className="h-4 w-4" />
              Tokens
            </Button>
            <Button
              variant={viewMode === 'chat' ? 'default' : 'outline'}
              onClick={() => setViewMode('chat')}
              className="flex items-center gap-2"
            >
              <MessageSquare className="h-4 w-4" />
              Chat
            </Button>
          </div>
        </div>

        {/* KPIs */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="bg-gradient-to-br from-white to-[#E6ECEA]/30 border-l-4 border-l-[#3f9094]">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-gray-700">Total de Clientes</CardTitle>
              <Users className="h-5 w-5 text-[#3f9094]" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-[#3f9094]">{clientAnalytics.total}</div>
              <p className="text-xs text-gray-500 mt-1">
                {clientAnalytics.activeClients} ativos
              </p>
            </CardContent>
          </Card>
          
          <Card className="bg-gradient-to-br from-white to-[#E6ECEA]/30 border-l-4 border-l-[#5DA399]">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-gray-700">Novos este Mês</CardTitle>
              <TrendingUp className="h-5 w-5 text-[#5DA399]" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-[#5DA399]">{clientAnalytics.newClientsThisMonth}</div>
              <p className="text-xs text-gray-500 mt-1">
                {clientAnalytics.newClientsThisMonth > 0 ? '+' : ''}
                {((clientAnalytics.newClientsThisMonth / (clientAnalytics.total || 1)) * 100).toFixed(1)}%
              </p>
            </CardContent>
          </Card>
          
          <Card className="bg-gradient-to-br from-white to-[#E6ECEA]/30 border-l-4 border-l-[#8AC1BB]">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-gray-700">Taxa de Conversão</CardTitle>
              <Target className="h-5 w-5 text-[#8AC1BB]" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-[#8AC1BB]">{clientAnalytics.conversionRate.toFixed(1)}%</div>
              <p className="text-xs text-gray-500 mt-1">
                Clientes ativos
              </p>
            </CardContent>
          </Card>
          
          <Card className="bg-gradient-to-br from-white to-[#E6ECEA]/30 border-l-4 border-l-[#B1D4CF]">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-gray-700">Top Cliente</CardTitle>
              <User className="h-5 w-5 text-[#B1D4CF]" />
            </CardHeader>
            <CardContent>
              <div className="text-lg font-bold text-[#B1D4CF]">
                {clientAnalytics.topClientsByRevenue[0]?.nome.split(' ')[0] || 'N/A'}
              </div>
              <p className="text-xs text-gray-500 mt-1">
                €{clientAnalytics.topClientsByRevenue[0]?.revenue.toFixed(2) || '0.00'}
              </p>
            </CardContent>
          </Card>
        </div>
        
        {/* Filtros e Ações */}
        <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center justify-between">
          <div className="flex flex-col md:flex-row gap-3 flex-1">
            <div className="relative flex-1 md:max-w-md">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
              <Input
                placeholder="Pesquisar clientes..."
                className="pl-9"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>

            <div className="flex gap-2">
              <Select value={selectedStatus} onValueChange={setSelectedStatus}>
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os Status</SelectItem>
                  <SelectItem value="ongoing">Em Andamento</SelectItem>
                  <SelectItem value="thinking">Pensando</SelectItem>
                  <SelectItem value="no-need">Sem Necessidade</SelectItem>
                  <SelectItem value="finished">Finalizado</SelectItem>
                  <SelectItem value="desistiu">Desistiu</SelectItem>
                </SelectContent>
              </Select>
              
              <Select value={selectedGender} onValueChange={setSelectedGender}>
                <SelectTrigger className="w-32">
                  <SelectValue placeholder="Gênero" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  <SelectItem value="masculino">Masculino</SelectItem>
                  <SelectItem value="feminino">Feminino</SelectItem>
                  <SelectItem value="outro">Outro</SelectItem>
                </SelectContent>
              </Select>
              
              <Select value={ageRange} onValueChange={setAgeRange}>
                <SelectTrigger className="w-32">
                  <SelectValue placeholder="Idade" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas</SelectItem>
                  <SelectItem value="18-25">18-25</SelectItem>
                  <SelectItem value="26-35">26-35</SelectItem>
                  <SelectItem value="36-45">36-45</SelectItem>
                  <SelectItem value="46-60">46-60</SelectItem>
                  <SelectItem value="60+">60+</SelectItem>
                </SelectContent>
              </Select>
              
              <Select value={sortBy} onValueChange={setSortBy}>
                <SelectTrigger className="w-36">
                  <SelectValue placeholder="Ordenar" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="name">Nome</SelectItem>
                  <SelectItem value="date">Data</SelectItem>
                  <SelectItem value="sessions">Sessões</SelectItem>
                  <SelectItem value="revenue">Receita</SelectItem>
                </SelectContent>
              </Select>
                </div>
          </div>
          
          <div className="flex gap-2">
            <Button variant="outline" onClick={clearFilters} className="flex items-center gap-2">
              <X className="h-4 w-4" />
              Limpar
            </Button>
            <Button onClick={handleExportData} variant="outline" className="flex items-center gap-2">
              <Download className="h-4 w-4" />
              Exportar
            </Button>
            <Dialog open={isAddClientOpen} onOpenChange={setIsAddClientOpen}>
              <DialogTrigger asChild>
                <Button className="bg-[#3f9094] hover:bg-[#2A5854] flex items-center gap-2">
                  <Plus className="h-4 w-4" />
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

        {/* Conteúdo Principal */}
        {viewMode === 'chat' ? (
          <div className="space-y-6">
            <AdminChatPanel />
          </div>
        ) : viewMode === 'tokens' ? (
          <div className="space-y-6">
            <ClientTokenManager />
          </div>
        ) : viewMode === 'analytics' ? (
          <div className="space-y-6">
            {/* Gráficos Analytics */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card className="bg-gradient-to-br from-white to-[#E6ECEA]/20">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <PieChart className="h-5 w-5" />
                    Distribuição por Status
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-[300px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <RechartsPieChart>
                        <Pie
                          data={clientAnalytics.statusDistribution}
                          cx="50%"
                          cy="50%"
                          labelLine={false}
                          label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                          outerRadius={80}
                          fill="#8884d8"
                          dataKey="value"
                        >
                          {clientAnalytics.statusDistribution.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={['#3f9094', '#5DA399', '#8AC1BB', '#B1D4CF', '#E6ECEA'][index % 5]} />
                          ))}
                        </Pie>
                        <Tooltip />
                      </RechartsPieChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>
              
              <Card className="bg-gradient-to-br from-white to-[#E6ECEA]/20">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <BarChart3 className="h-5 w-5" />
                    Distribuição por Gênero
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-[300px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={clientAnalytics.genderDistribution}>
                        <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
                        <XAxis dataKey="name" fontSize={12} />
                        <YAxis fontSize={12} />
                        <Tooltip />
                        <Bar dataKey="value" fill="#3f9094" />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>
              
              <Card className="bg-gradient-to-br from-white to-[#E6ECEA]/20">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <TrendingUp className="h-5 w-5" />
                    Evolução Mensal
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-[300px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={clientAnalytics.monthlyEvolution}>
                        <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
                        <XAxis dataKey="month" fontSize={12} />
                        <YAxis fontSize={12} />
                        <Tooltip />
                        <Line type="monotone" dataKey="clientes" stroke="#3f9094" strokeWidth={3} />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>
              
              <Card className="bg-gradient-to-br from-white to-[#E6ECEA]/20">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Users className="h-5 w-5" />
                    Distribuição por Idade
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-[300px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={clientAnalytics.ageDistribution}>
                        <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
                        <XAxis dataKey="name" fontSize={12} />
                        <YAxis fontSize={12} />
                        <Tooltip />
                        <Bar dataKey="value" fill="#5DA399" />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>
      </div>
      
            {/* Top Clientes */}
            <Card className="bg-gradient-to-br from-white to-[#E6ECEA]/20">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Target className="h-5 w-5" />
                  Top 10 Clientes por Receita
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {clientAnalytics.topClientsByRevenue.map((client, index) => (
                    <div key={client.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-gradient-to-br from-[#3f9094] to-[#5DA399] rounded-full flex items-center justify-center text-white font-bold text-sm">
                          {index + 1}
                        </div>
                        <div>
                          <p className="font-medium">{client.nome}</p>
                          <p className="text-sm text-gray-600">{client.sessions} sessões</p>
                        </div>
        </div>
                      <div className="text-right">
                        <p className="font-bold text-[#3f9094]">€{client.revenue.toFixed(2)}</p>
                        <p className="text-xs text-gray-500">
                          €{client.sessions > 0 ? (client.revenue / client.sessions).toFixed(2) : '0.00'}/sessão
                        </p>
        </div>
      </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        ) : (
          <div>
      <Tabs defaultValue="all" className="w-full">
        <TabsList className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 mb-6">
                <TabsTrigger value="all">Todos ({filteredAndSortedClients.length})</TabsTrigger>
                <TabsTrigger value="ongoing">Em Andamento ({clientsByStatus.ongoing.length})</TabsTrigger>
                <TabsTrigger value="thinking">Pensando ({clientsByStatus.thinking.length})</TabsTrigger>
                <TabsTrigger value="no-need">Sem Necessidade ({clientsByStatus['no-need'].length})</TabsTrigger>
                <TabsTrigger value="finished">Finalizado ({clientsByStatus.finished.length})</TabsTrigger>
                <TabsTrigger value="desistiu">Desistiu ({clientsByStatus.desistiu.length})</TabsTrigger>
        </TabsList>
        
        <TabsContent value="all" className="mt-0">
                {filteredAndSortedClients.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filteredAndSortedClients.map(client => (
                <ClientCard 
                  key={client.id} 
                  client={client} 
                  onDelete={() => handleRequestDeleteClient(client)}
                  statusClass={`client-${client.estado || 'ongoing'}`}
                />
              ))}
            </div>
          ) : (
                  <div className="text-center py-12 bg-gradient-to-br from-white to-[#E6ECEA]/30 rounded-lg shadow-sm p-8">
                    <Users className="h-16 w-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-xl font-medium mb-2">Nenhum cliente encontrado</h3>
                    <p className="text-gray-600 mb-6">
                      {searchQuery || selectedStatus !== 'all' || selectedGender !== 'all' || ageRange !== 'all' ? 
                  'Tente ajustar seus filtros de pesquisa' : 
                  'Adicione seu primeiro cliente para começar'}
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button 
                        className="bg-[#3f9094] hover:bg-[#2A5854]" 
                        onClick={() => setIsAddClientOpen(true)}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Adicionar Novo Cliente
                </Button>
                      {(searchQuery || selectedStatus !== 'all' || selectedGender !== 'all' || ageRange !== 'all') && (
                <Button 
                  variant="outline" 
                          onClick={clearFilters}
                >
                          <X className="h-4 w-4 mr-2" />
                          Limpar Filtros
                </Button>
                      )}
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
                    onDelete={() => handleRequestDeleteClient(client)}
                    statusClass={`client-${status}`}
                  />
                ))}
              </div>
            ) : (
                    <div className="text-center py-12 bg-gradient-to-br from-white to-[#E6ECEA]/30 rounded-lg shadow-sm p-8">
                      <Users className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-xl font-medium mb-2">Nenhum cliente encontrado</h3>
                      <p className="text-gray-600 mb-6">
                        Não há clientes com este status no momento
                      </p>
                  <Button 
                        className="bg-[#3f9094] hover:bg-[#2A5854]" 
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
          </div>
        )}
      
      {/* Dialogs */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar exclusão</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja eliminar o cliente <b>{clientToDelete?.nome}</b>? Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmDeleteClient}>Eliminar</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );

  return isAdminContext ? pageContent : (
    <PageLayout>
      {pageContent}
    </PageLayout>
  );
};

export default ClientsPage;
