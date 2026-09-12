import { useState, useMemo, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import PageLayout from '@/components/layout/PageLayout';
import PageHeader from '@/components/shared/PageHeader';
import QuickCard from '@/components/shared/QuickCard';
import { EmptyState } from '@/components/shared/EmptyState';
import { SkeletonCard } from '@/components/shared/SkeletonCard';
import { useAdminContext } from '@/contexts/AdminContext';
import ClientCard from '@/components/clients/ClientCard';
import ClientsOverview from '@/components/clients/ClientsOverview';
import ClientNotificationsPanel from '@/components/clients/ClientNotificationsPanel';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import ClientForm, { ClientFormData } from '@/components/clients/ClientForm';
import ClientImport from '@/components/clients/ClientImport';
import ConvertLeadDialog, { ConvertedClientData } from '@/components/clients/ConvertLeadDialog';
import LeadsReadyForConversion from '@/components/clients/LeadsReadyForConversion';
import ClientsLeadsTab from '@/components/clients/ClientsLeadsTab';
import {
  Plus, Search, Upload, X, Download,
  Users, BarChart3, Target, Key, MessageSquare,
  AlertCircle, Clock, SlidersHorizontal, Bell,
} from 'lucide-react';
import { toast } from 'sonner';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import useClients from '@/hooks/useClients';
import { useAdminAuth } from '@/hooks/useAdminAuth';
import { useLandingLeads } from '@/hooks/useLandingLeads';
import useAppointments from '@/hooks/useAppointments';
import usePayments from '@/hooks/usePayments';
import { LandingLead } from '@/types/landing-lead';
import { LeadCompra } from '@/types/lead-compra';
import { Database } from '@/integrations/supabase/types';
import { format, parseISO, isValid, subMonths, subDays, isAfter, isBefore, differenceInYears, addDays } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Label } from '@/components/ui/label';
import { AlertDialog, AlertDialogContent, AlertDialogHeader, AlertDialogTitle, AlertDialogDescription, AlertDialogFooter, AlertDialogCancel, AlertDialogAction } from '@/components/ui/alert-dialog';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import ClientTokenManager from '@/components/admin/ClientTokenManager';
import AdminChatPanel from '@/components/admin/AdminChatPanel';
import { STATUS_META, CHART } from '@/utils/chartUtils';

type Client = Database['public']['Tables']['clientes']['Row'];
type DatePeriod = 'all' | 'month' | 'quarter' | 'halfyear' | 'year' | 'custom';

interface DateRange {
  from: Date | undefined;
  to: Date | undefined;
}

const ClientsPage = () => {
  const isPartner = useAdminAuth().session?.role === 'partner';
  const { isAdminContext } = useAdminContext();
  const navigate = useNavigate();
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
  const [datePeriod, setDatePeriod] = useState<DatePeriod>('all');
  const [dateRange, setDateRange] = useState<DateRange>({
    from: undefined,
    to: undefined
  });
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [clientToDelete, setClientToDelete] = useState<Client | null>(null);
  const [selectedGender, setSelectedGender] = useState<string>('all');
  const [ageRange, setAgeRange] = useState<string>('all');
  const [sortBy, setSortBy] = useState<string>('name');
  const [activeTab, setActiveTab] = useState<string>('overview');
  const [clientView, setClientView] = useState<'all' | 'ongoing' | 'thinking' | 'no-need' | 'finished' | 'desistiu'>('all');
  const [packEndingFilter, setPackEndingFilter] = useState(false);
  const [searchParams] = useSearchParams();

  useEffect(() => {
    const tabParam = searchParams.get('tab');
    const validTabs = ['overview', 'clients', 'leads', 'tokens', 'chat', 'notifications'];
    if (tabParam && validTabs.includes(tabParam)) {
      setActiveTab(tabParam);
    }

    const statusParam = searchParams.get('status');
    if (statusParam && ['all', 'ongoing', 'thinking', 'no-need', 'finished', 'desistiu'].includes(statusParam)) {
      setClientView(statusParam as typeof clientView);
      setActiveTab('clients');
    }

    if (searchParams.get('filter') === 'pack-ending') {
      setPackEndingFilter(true);
      setActiveTab('clients');
    }
  }, [searchParams]);

  // Estado para conversão de leads
  const [convertDialogOpen, setConvertDialogOpen] = useState(false);
  const [selectedLead, setSelectedLead] = useState<LandingLead | LeadCompra | null>(null);
  const [selectedLeadType, setSelectedLeadType] = useState<'landing' | 'compra'>('landing');
  const [isConverting, setIsConverting] = useState(false);

  // Hook para atualizar status de landing leads após conversão
  const { updateLeadStatus } = useLandingLeads();

  // Filtros avançados
  const filteredAndSortedClients = useMemo(() => {
    let filtered = clients;

    // Filtro por texto
    if (searchQuery) {
      filtered = searchClients(searchQuery);
    }

    // Filtro por packs a acabar
    if (packEndingFilter) {
      filtered = filtered.filter(client => {
        const maxSessions = client.max_sessoes ?? 0;
        const remaining = maxSessions - (client.numero_sessoes ?? 0);
        return maxSessions > 0 && remaining <= 2;
      });
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
        case 'date': {
          const dateA = a.criado_em ? new Date(a.criado_em).getTime() : 0;
          const dateB = b.criado_em ? new Date(b.criado_em).getTime() : 0;
          return dateB - dateA;
        }
        case 'sessions': {
          const sessionsA = appointments.filter(apt => apt.id_cliente === a.id).length;
          const sessionsB = appointments.filter(apt => apt.id_cliente === b.id).length;
          return sessionsB - sessionsA;
        }
        case 'revenue': {
          const revenueA = payments.filter(pay => pay.id_cliente === a.id).reduce((sum, pay) => sum + (pay.valor || 0), 0);
          const revenueB = payments.filter(pay => pay.id_cliente === b.id).reduce((sum, pay) => sum + (pay.valor || 0), 0);
          return revenueB - revenueA;
        }
        default:
          return 0;
      }
    });

    return sorted;
  }, [clients, searchQuery, datePeriod, dateRange, selectedGender, ageRange, sortBy, searchClients, appointments, payments, packEndingFilter]);

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
    const statusCount = filteredAndSortedClients.reduce((acc, client) => {
      const status = client.estado || 'ongoing';
      acc[status] = (acc[status] || 0) + 1;
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
        month: format(month, 'MMM', { locale: ptBR }).replace('.', ''),
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
      if (!apt.data) return false;
      const aptDate = parseISO(apt.data);
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
      statusDistribution: Object.entries(statusCount).map(([key, value]) => ({
        key,
        label: STATUS_META[key]?.label || key,
        value,
        color: STATUS_META[key]?.color || CHART.primary,
      })),
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

  // Handler para abrir dialog de conversão
  const handleOpenConvertDialog = (lead: LandingLead | LeadCompra, type: 'landing' | 'compra') => {
    setSelectedLead(lead);
    setSelectedLeadType(type);
    setConvertDialogOpen(true);
  };

  // Handler para converter lead em cliente
  const handleConvertLead = async (clientData: ConvertedClientData) => {
    setIsConverting(true);
    try {
      // Criar o cliente
      await addClient({
        nome: clientData.nome,
        email: clientData.email || '',
        telefone: clientData.telefone,
        data_nascimento: clientData.data_nascimento ? clientData.data_nascimento.toISOString() : null,
        genero: clientData.genero,
        morada: clientData.morada,
        notas: clientData.notas || `Convertido de ${clientData.lead_type === 'landing' ? 'Landing Lead' : 'Lead Compra'}`,
        estado: clientData.estado,
        tipo_contato: clientData.tipo_contato,
        como_conheceu: clientData.como_conheceu,
        numero_sessoes: clientData.numero_sessoes || 0,
        total_pago: clientData.total_pago || 0,
        max_sessoes: clientData.max_sessoes || 0,
        responsavel: clientData.responsavel || null,
        motivo: clientData.motivo || null,
        id_manual: clientData.id_manual
      });

      // Se for landing lead, atualizar o status para "Iniciou Neurofeedback"
      if (clientData.lead_type === 'landing' && clientData.lead_id) {
        await updateLeadStatus(clientData.lead_id, 'Iniciou Neurofeedback');
      }

      toast.success('Lead convertida em cliente com sucesso!');
    } catch (error) {
      console.error('Erro ao converter lead:', error);
      toast.error('Falha ao converter lead em cliente');
      throw error;
    } finally {
      setIsConverting(false);
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
    setSelectedGender('all');
    setAgeRange('all');
    setSortBy('name');
    setPackEndingFilter(false);
  };

  const hasActiveFilters = searchQuery !== '' || selectedGender !== 'all' || ageRange !== 'all' || datePeriod !== 'all' || packEndingFilter;

  if (isLoading) {
    const loadingContent = (
      <div className="space-y-6">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {[1, 2, 3, 4].map((i) => <SkeletonCard key={i} />)}
        </div>
        <SkeletonCard />
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
      <PageHeader
        title="Gestão de Clientes"
        description="Controle completo dos seus clientes e suas jornadas"
        icon={<Users className="h-5 w-5" />}
        actions={
          <>
            {!isPartner && (
              <Button variant="outline" size="sm" className="gap-2" onClick={() => setIsImportDialogOpen(true)}>
                <Upload className="h-4 w-4" />
                Importar
              </Button>
            )}
            <Button variant="outline" size="sm" className="gap-2" onClick={handleExportData}>
              <Download className="h-4 w-4" />
              Exportar
            </Button>
            {!isPartner && (
              <Button size="sm" className="gap-2" onClick={() => setIsAddClientOpen(true)}>
                <Plus className="h-4 w-4" />
                Novo Cliente
              </Button>
            )}
          </>
        }
      />

      {/* Alertas */}
      {(clientAnalytics.clientsNeedingAttention > 0 || clientAnalytics.upcomingSessions > 0) && (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {clientAnalytics.clientsNeedingAttention > 0 && (
            <QuickCard
              icon={<AlertCircle className="h-5 w-5" />}
              tint="bg-amber-500/10 text-amber-600 dark:text-amber-400"
              title="Clientes por Atenção"
              description={`${clientAnalytics.clientsNeedingAttention} ${clientAnalytics.clientsNeedingAttention === 1 ? 'cliente' : 'clientes'} "Pensando" há mais de 7 dias`}
              actionLabel="Ver clientes"
              onAction={() => {
                setClientView('thinking');
                setActiveTab('clients');
              }}
            />
          )}

          {clientAnalytics.upcomingSessions > 0 && (
            <QuickCard
              icon={<Clock className="h-5 w-5" />}
              tint="bg-blue-500/10 text-blue-600 dark:text-blue-400"
              title="Próximas Sessões"
              description={`${clientAnalytics.upcomingSessions} ${clientAnalytics.upcomingSessions === 1 ? 'agendamento' : 'agendamentos'} nos próximos 7 dias`}
              actionLabel="Ver calendário"
              onAction={() => navigate('/calendar')}
            />
          )}
        </div>
      )}

      {/* Leads Prontas para Conversão */}
      {!isPartner && <LeadsReadyForConversion onConvertLead={handleOpenConvertDialog} />}

      {/* Tabs Principais */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="flex w-full justify-start overflow-x-auto scrollbar-hide">
          <TabsTrigger value="overview" className="shrink-0 gap-2">
            <BarChart3 className="h-4 w-4" />
            Geral
          </TabsTrigger>
          <TabsTrigger value="clients" className="shrink-0 gap-2">
            <Users className="h-4 w-4" />
            Clientes
          </TabsTrigger>
          <TabsTrigger value="leads" className="shrink-0 gap-2">
            <Target className="h-4 w-4" />
            Leads
          </TabsTrigger>
          <TabsTrigger value="tokens" className="shrink-0 gap-2">
            <Key className="h-4 w-4" />
            Tokens
          </TabsTrigger>
          <TabsTrigger value="chat" className="shrink-0 gap-2">
            <MessageSquare className="h-4 w-4" />
            Chat
          </TabsTrigger>
          <TabsTrigger value="notifications" className="relative shrink-0 gap-2">
            <Bell className="h-4 w-4" />
            Avisos
          </TabsTrigger>
        </TabsList>

        {/* Visão Geral */}
        <TabsContent value="overview" className="mt-6">
          <ClientsOverview analytics={clientAnalytics} />
        </TabsContent>

        {/* Clientes */}
        <TabsContent value="clients" className="mt-6 space-y-6">
          <Card>
            <CardHeader className="pb-4">
              <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
                <div>
                  <CardTitle className="text-base font-semibold">Lista de Clientes</CardTitle>
                  <CardDescription className="mt-1">
                    Gerencie e visualize todos os seus clientes
                  </CardDescription>
                </div>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" size="sm" className="shrink-0 gap-2 self-start sm:self-auto">
                      <SlidersHorizontal className="h-4 w-4" />
                      Filtros
                      {hasActiveFilters && (
                        <span className="flex h-4 w-4 items-center justify-center rounded-full bg-destructive text-[10px] font-bold text-destructive-foreground">
                          !
                        </span>
                      )}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-80" align="end">
                    <div className="space-y-4">
                      <h4 className="font-medium leading-none">Filtros Avançados</h4>

                      <div className="space-y-2">
                        <Label>Género</Label>
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
                        <X className="mr-2 h-4 w-4" />
                        Limpar Filtros
                      </Button>
                    </div>
                  </PopoverContent>
                </Popover>
              </div>
            </CardHeader>
            <CardContent>
              {/* Busca */}
              <div className="relative mb-4">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Pesquisar por nome, contacto, NIF ou ID..."
                  className="pl-10"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>

              {/* Tabs por Status */}
              <Tabs value={clientView} onValueChange={(v) => setClientView(v as typeof clientView)} className="w-full">
                <TabsList className="mb-6 flex w-full justify-start overflow-x-auto scrollbar-hide">
                  <TabsTrigger value="all" className="shrink-0 whitespace-nowrap">Todos ({clientsByStatus.all.length})</TabsTrigger>
                  <TabsTrigger value="ongoing" className="shrink-0 whitespace-nowrap">Em Andamento ({clientsByStatus.ongoing.length})</TabsTrigger>
                  <TabsTrigger value="thinking" className="shrink-0 whitespace-nowrap">Pensando ({clientsByStatus.thinking.length})</TabsTrigger>
                  <TabsTrigger value="no-need" className="shrink-0 whitespace-nowrap">Sem Necessidade ({clientsByStatus['no-need'].length})</TabsTrigger>
                  <TabsTrigger value="finished" className="shrink-0 whitespace-nowrap">Finalizado ({clientsByStatus.finished.length})</TabsTrigger>
                  <TabsTrigger value="desistiu" className="shrink-0 whitespace-nowrap">Desistiu ({clientsByStatus.desistiu.length})</TabsTrigger>
                </TabsList>

                {Object.entries(clientsByStatus).map(([status, clientList]) => (
                  <TabsContent key={status} value={status} className="mt-0">
                    {clientList.length > 0 ? (
                      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
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
                      <EmptyState
                        icon={<Users className="h-12 w-12" />}
                        title="Nenhum cliente encontrado"
                        description={
                          searchQuery || hasActiveFilters
                            ? 'Tente ajustar os seus filtros de pesquisa'
                            : status === 'all'
                              ? 'Adicione o seu primeiro cliente para começar'
                              : 'Não há clientes com este estado neste momento'
                        }
                        action={
                          status === 'all' && !isPartner
                            ? {
                                label: 'Adicionar Novo Cliente',
                                onClick: () => setIsAddClientOpen(true),
                                icon: <Plus className="h-4 w-4" />
                              }
                            : undefined
                        }
                        secondaryAction={
                          (searchQuery || hasActiveFilters)
                            ? {
                                label: 'Limpar Filtros',
                                onClick: clearFilters,
                                icon: <X className="h-4 w-4" />
                              }
                            : undefined
                        }
                      />
                    )}
                  </TabsContent>
                ))}
              </Tabs>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tokens */}
        <TabsContent value="tokens" className="mt-6 space-y-6">
          <ClientTokenManager />
        </TabsContent>

        {/* Chat */}
        <TabsContent value="chat" className="mt-6 space-y-6">
          <AdminChatPanel />
        </TabsContent>

        {/* Leads */}
        <TabsContent value="leads" className="mt-6 space-y-6">
          <ClientsLeadsTab />
        </TabsContent>

        {/* Notificações Globais */}
        <TabsContent value="notifications" className="mt-6">
          <ClientNotificationsPanel clients={clients} appointments={appointments} payments={payments} />
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
          <ClientImport onImportComplete={handleImportClients} />
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

      {/* Dialog de Conversão de Lead */}
      <ConvertLeadDialog
        open={convertDialogOpen}
        onOpenChange={setConvertDialogOpen}
        lead={selectedLead}
        leadType={selectedLeadType}
        onConvert={handleConvertLead}
        isLoading={isConverting}
      />
    </div>
  );

  return isAdminContext ? pageContent : (
    <PageLayout>
      {pageContent}
    </PageLayout>
  );
};

export default ClientsPage;
