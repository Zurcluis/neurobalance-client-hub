import React, { useState, useMemo } from 'react';
import PageLayout from '@/components/layout/PageLayout';
import { useAdminContext } from '@/contexts/AdminContext';
import ClientCard from '@/components/clients/ClientCard';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogTrigger } from '@/components/ui/dialog';
import ClientForm, { ClientFormData } from '@/components/clients/ClientForm';
import ClientImport from '@/components/clients/ClientImport';
import { 
  Plus, Search, Upload, X, Calendar, Filter, ChevronDown, Download, 
  Users, TrendingUp, BarChart3, Target, PieChart, User, Key, MessageSquare,
  AlertCircle, Clock, Zap, SlidersHorizontal
} from 'lucide-react';
import { toast } from 'sonner';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import useClients from '@/hooks/useClients';
import { ClientDetailData } from '@/types/client';
import { Database } from '@/integrations/supabase/types';
import { format, parseISO, isValid, subMonths, subDays, isAfter, isBefore, differenceInYears, addDays } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Label } from '@/components/ui/label';
import { DateRangePicker } from '@/components/ui/date-range-picker';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { AlertDialog, AlertDialogTrigger, AlertDialogContent, AlertDialogHeader, AlertDialogTitle, AlertDialogDescription, AlertDialogFooter, AlertDialogCancel, AlertDialogAction } from '@/components/ui/alert-dialog';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
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
  const [activeTab, setActiveTab] = useState<string>('overview');
  const [clientView, setClientView] = useState<'all' | 'ongoing' | 'thinking' | 'no-need' | 'finished' | 'desistiu'>('all');

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

    // Clientes que precisam de atenção
    const clientsNeedingAttention = filteredAndSortedClients.filter(client => {
      // Lógica: clientes "thinking" há mais de 7 dias
      if (client.estado === 'thinking' && client.criado_em) {
        const clientDate = parseISO(client.criado_em);
        const sevenDaysAgo = subDays(new Date(), 7);
        return isBefore(clientDate, sevenDaysAgo);
      }
      return false;
    }).length;

    // Próximas sessões (próximos 7 dias)
    const upcomingSessions = appointments.filter(apt => {
      if (!apt.data_hora) return false;
      const aptDate = parseISO(apt.data_hora);
      const today = new Date();
      const sevenDaysLater = addDays(today, 7);
      return isAfter(aptDate, today) && isBefore(aptDate, sevenDaysLater);
    }).length;
    
    return {
      total,
      activeClients,
      newClientsThisMonth,
      conversionRate: total > 0 ? (activeClients / total) * 100 : 0,
      genderDistribution: Object.entries(genderDistribution).map(([name, value]) => ({ name, value })),
      ageDistribution: Object.entries(ageDistribution).map(([name, value]) => ({ name, value })),
      statusDistribution: Object.entries(statusDistribution).map(([name, value]) => ({ name, value })),
      monthlyEvolution,
      topClientsByRevenue,
      clientsNeedingAttention,
      upcomingSessions
    };
  }, [filteredAndSortedClients, clients, appointments, payments]);

  const clientsByStatus = useMemo(() => ({
    all: filteredAndSortedClients,
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

  const hasActiveFilters = searchQuery || selectedStatus !== 'all' || selectedGender !== 'all' || ageRange !== 'all' || datePeriod !== 'all';

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
        {/* Header com ações rápidas */}
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
        <div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-[#3f9094] to-[#2A5854] bg-clip-text text-transparent">
              Gestão de Clientes
            </h1>
            <p className="text-gray-600 mt-1">Controle completo dos seus clientes e suas jornadas</p>
          </div>
          
        <div className="flex flex-wrap gap-2">
            <Button variant="outline" size="sm" className="gap-2" onClick={() => setIsImportDialogOpen(true)}>
              <Upload className="h-4 w-4" />
              Importar
            </Button>
            <Button variant="outline" size="sm" className="gap-2" onClick={handleExportData}>
              <Download className="h-4 w-4" />
              Exportar
            </Button>
            <Button size="sm" className="gap-2 bg-gradient-to-r from-[#3f9094] to-[#2A5854] hover:opacity-90" onClick={() => setIsAddClientOpen(true)}>
              <Plus className="h-4 w-4" />
              Novo Cliente
            </Button>
          </div>
        </div>

      {/* Alertas em Destaque */}
      {(clientAnalytics.clientsNeedingAttention > 0 || clientAnalytics.upcomingSessions > 0) && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {clientAnalytics.clientsNeedingAttention > 0 && (
              <Card className="border-l-4 border-l-orange-500 bg-gradient-to-r from-orange-50 to-white dark:from-orange-950/20 dark:to-gray-900">
              <CardHeader className="pb-3">
                <div className="flex items-center gap-2">
                    <AlertCircle className="h-5 w-5 text-orange-500" />
                    <CardTitle className="text-lg">Clientes Precisam de Atenção</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-2xl font-bold text-orange-600">
                        {clientAnalytics.clientsNeedingAttention}
                      </p>
                      <p className="text-sm text-gray-600 mt-1">
                        Clientes "Pensando" há mais de 7 dias
                      </p>
                    </div>
                    <Button size="sm" variant="outline" onClick={() => {
                      setSelectedStatus('thinking');
                      setActiveTab('clients');
                    }}>
                      Ver Clientes
                    </Button>
                  </div>
              </CardContent>
            </Card>
          )}

          {clientAnalytics.upcomingSessions > 0 && (
              <Card className="border-l-4 border-l-blue-500 bg-gradient-to-r from-blue-50 to-white dark:from-blue-950/20 dark:to-gray-900">
              <CardHeader className="pb-3">
                <div className="flex items-center gap-2">
                    <Clock className="h-5 w-5 text-blue-500" />
                    <CardTitle className="text-lg">Próximas Sessões</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-2xl font-bold text-blue-600">
                        {clientAnalytics.upcomingSessions}
                      </p>
                      <p className="text-sm text-gray-600 mt-1">
                        Agendamentos nos próximos 7 dias
                      </p>
                    </div>
                    <Button size="sm" variant="outline" onClick={() => window.location.href = '/calendar'}>
                      Ver Calendário
                    </Button>
                  </div>
              </CardContent>
            </Card>
          )}
        </div>
      )}

        {/* Tabs Principais - Reorganizadas */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-2 md:grid-cols-4 h-auto md:h-10">
            <TabsTrigger value="overview" className="flex items-center gap-2">
              <BarChart3 className="h-4 w-4" />
              <span className="hidden sm:inline">Visão Geral</span>
            </TabsTrigger>
            <TabsTrigger value="clients" className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              <span className="hidden sm:inline">Clientes</span>
            </TabsTrigger>
            <TabsTrigger value="tokens" className="flex items-center gap-2">
              <Key className="h-4 w-4" />
              <span className="hidden sm:inline">Tokens</span>
            </TabsTrigger>
            <TabsTrigger value="chat" className="flex items-center gap-2">
              <MessageSquare className="h-4 w-4" />
              <span className="hidden sm:inline">Chat</span>
            </TabsTrigger>
          </TabsList>

          {/* 📊 Visão Geral */}
          <TabsContent value="overview" className="space-y-6 mt-6">
            {/* Cards de Resumo - Maiores e Mais Visuais */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <Card className="bg-gradient-to-br from-green-50 to-white dark:from-green-950/20 dark:to-gray-900 border-t-4 border-t-green-500">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center gap-2">
                    <Users className="h-4 w-4 text-green-600" />
                    Total de Clientes
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-green-600">
                    {clientAnalytics.total}
                  </div>
                  <div className="flex items-center gap-1 mt-2">
                    <Badge variant="secondary" className="text-xs">
                      {clientAnalytics.activeClients} ativos
                    </Badge>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-br from-blue-50 to-white dark:from-blue-950/20 dark:to-gray-900 border-t-4 border-t-blue-500">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center gap-2">
                    <TrendingUp className="h-4 w-4 text-blue-600" />
                    Novos este Mês
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-blue-600">
                    {clientAnalytics.newClientsThisMonth}
                  </div>
                  <div className="flex items-center gap-1 mt-2">
                    <TrendingUp className="h-4 w-4 text-blue-600" />
                    <span className="text-xs text-blue-600 font-medium">
                      +{((clientAnalytics.newClientsThisMonth / (clientAnalytics.total || 1)) * 100).toFixed(1)}% do total
                    </span>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-br from-purple-50 to-white dark:from-purple-950/20 dark:to-gray-900 border-t-4 border-t-purple-500">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center gap-2">
                    <Target className="h-4 w-4 text-purple-600" />
                    Taxa de Conversão
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-purple-600">
                    {clientAnalytics.conversionRate.toFixed(1)}%
                  </div>
                  <div className="flex items-center gap-1 mt-2">
                    <Badge variant="secondary" className="text-xs">
                      Clientes ativos
                    </Badge>
                  </div>
                </CardContent>
              </Card>

            </div>

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
                    <div key={client.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
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
          </TabsContent>

          {/* 👥 Clientes */}
          <TabsContent value="clients" className="space-y-6 mt-6">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <Users className="h-5 w-5" />
                      Lista de Clientes
                    </CardTitle>
                    <CardDescription className="mt-1">
                      Gerencie e visualize todos os seus clientes
                    </CardDescription>
                  </div>
                  <div className="flex gap-2">
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button variant="outline" size="sm" className="gap-2">
                          <SlidersHorizontal className="h-4 w-4" />
                          Filtros
                          {hasActiveFilters && (
                            <Badge variant="destructive" className="ml-1 h-5 w-5 p-0 flex items-center justify-center rounded-full">
                              !
                            </Badge>
                          )}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-80">
                        <div className="space-y-4">
                          <h4 className="font-medium leading-none">Filtros Avançados</h4>
                          
                          <div className="space-y-2">
                            <Label>Status</Label>
                            <Select value={selectedStatus} onValueChange={setSelectedStatus}>
                              <SelectTrigger>
                                <SelectValue />
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
                          </div>

                          <div className="space-y-2">
                            <Label>Gênero</Label>
                            <Select value={selectedGender} onValueChange={setSelectedGender}>
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="all">Todos</SelectItem>
                                <SelectItem value="masculino">Masculino</SelectItem>
                                <SelectItem value="feminino">Feminino</SelectItem>
                                <SelectItem value="outro">Outro</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>

                          <div className="space-y-2">
                            <Label>Faixa Etária</Label>
                            <Select value={ageRange} onValueChange={setAgeRange}>
                              <SelectTrigger>
                                <SelectValue />
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
                          </div>

                          <div className="space-y-2">
                            <Label>Ordenar por</Label>
                            <Select value={sortBy} onValueChange={setSortBy}>
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="name">Nome</SelectItem>
                                <SelectItem value="date">Data</SelectItem>
                                <SelectItem value="sessions">Sessões</SelectItem>
                                <SelectItem value="revenue">Receita</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>

                          <Button variant="outline" size="sm" className="w-full" onClick={clearFilters}>
                            <X className="h-4 w-4 mr-2" />
                            Limpar Filtros
                          </Button>
                        </div>
                      </PopoverContent>
                    </Popover>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {/* Busca */}
                <div className="mb-4">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                    <Input
                      placeholder="Pesquisar clientes por nome, email ou telefone..."
                      className="pl-10"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                    />
                  </div>
                </div>

                {/* Tabs por Status */}
                <Tabs value={clientView} onValueChange={(v) => setClientView(v as typeof clientView)} className="w-full">
                  <TabsList className="grid w-full grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 mb-6">
                    <TabsTrigger value="all">Todos ({clientsByStatus.all.length})</TabsTrigger>
                    <TabsTrigger value="ongoing">Em Andamento ({clientsByStatus.ongoing.length})</TabsTrigger>
                    <TabsTrigger value="thinking">Pensando ({clientsByStatus.thinking.length})</TabsTrigger>
                    <TabsTrigger value="no-need">Sem Necessidade ({clientsByStatus['no-need'].length})</TabsTrigger>
                    <TabsTrigger value="finished">Finalizado ({clientsByStatus.finished.length})</TabsTrigger>
                    <TabsTrigger value="desistiu">Desistiu ({clientsByStatus.desistiu.length})</TabsTrigger>
                  </TabsList>
                  
                  {Object.entries(clientsByStatus).map(([status, clientList]) => (
                    <TabsContent key={status} value={status} className="mt-0">
                      {clientList.length > 0 ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                          {clientList.map(client => (
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
                            {searchQuery || hasActiveFilters ? 
                              'Tente ajustar seus filtros de pesquisa' : 
                              status === 'all' ? 'Adicione seu primeiro cliente para começar' : 'Não há clientes com este status no momento'
                            }
                          </p>
                          <div className="flex flex-col sm:flex-row gap-4 justify-center">
                            {status === 'all' && (
                              <Button 
                                className="bg-[#3f9094] hover:bg-[#2A5854]" 
                                onClick={() => setIsAddClientOpen(true)}
                              >
                                <Plus className="h-4 w-4 mr-2" />
                                Adicionar Novo Cliente
                              </Button>
                            )}
                            {(searchQuery || hasActiveFilters) && (
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
                  ))}
                </Tabs>
              </CardContent>
            </Card>
          </TabsContent>

          {/* 🔑 Tokens */}
          <TabsContent value="tokens" className="space-y-6 mt-6">
            <ClientTokenManager />
          </TabsContent>

          {/* 💬 Chat */}
          <TabsContent value="chat" className="space-y-6 mt-6">
            <AdminChatPanel />
          </TabsContent>
        </Tabs>
      
      {/* Dialogs */}
      <Dialog open={isAddClientOpen} onOpenChange={setIsAddClientOpen}>
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

      <Dialog open={isImportDialogOpen} onOpenChange={setIsImportDialogOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Importar Clientes</DialogTitle>
            <DialogDescription>
              Importe múltiplos clientes de um arquivo CSV ou JSON
            </DialogDescription>
          </DialogHeader>
          <ClientImport onImport={handleImportClients} />
        </DialogContent>
      </Dialog>

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

