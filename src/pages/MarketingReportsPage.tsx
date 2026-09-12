import { useState, useMemo } from 'react';
import PageLayout from '@/components/layout/PageLayout';
import { useMarketingContext } from '@/contexts/MarketingContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useMarketingCampaigns } from '@/hooks/useMarketingCampaigns';
import { useLeadCompra } from '@/hooks/useLeadCompra';
import { useEmailSmsCampaigns } from '@/hooks/useEmailSmsCampaigns';
import { MarketingCampaign, CampaignFilters } from '@/types/marketing';
import { LeadCompra, LeadCompraFilters } from '@/types/lead-compra';
import { EmailSmsCampaign } from '@/types/email-sms-campaign';
import CampaignForm from '@/components/marketing/CampaignForm';
import CampaignCard from '@/components/marketing/CampaignCard';
import CampaignFiltersComponent from '@/components/marketing/CampaignFilters';
import MarketingDashboard from '@/components/marketing/MarketingDashboard';
import ExportManager from '@/components/marketing/ExportManager';
import { LandingLeadForm, LandingLeadFormData } from '@/components/marketing/LandingLeadForm';
import { useLandingLeads } from '@/hooks/useLandingLeads';
import { LandingLead, LandingLeadStatus } from '@/types/landing-lead';
import LeadCompraDashboard from '@/components/lead-compra/LeadCompraDashboard';
import FileImporter from '@/components/shared/FileImporter';
import { EmailSmsCampaignForm } from '@/components/marketing/EmailSmsCampaignForm';
import { EmailSmsCampaignCard } from '@/components/marketing/EmailSmsCampaignCard';
import LeadKanbanBoard from '@/components/marketing/LeadKanbanBoard';
import { SmsAutomationSettings } from '@/components/marketing/SmsAutomationSettings';
import MarketingIntelligence from '@/components/marketing/MarketingIntelligence';
import PageHeader from '@/components/shared/PageHeader';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Plus,
  Search,
  BarChart3,
  Calendar,
  Download,
  Filter,
  X,
  Upload,
  Edit,
  Trash2,
  Users,
  Target,
  Euro,
  Mail,
  Phone,
  MapPin,
  LayoutGrid,
  List,
  Settings2,
  Megaphone,
  Sparkles
} from 'lucide-react';
import { toast } from 'sonner';
import TimeRangeSelector, { TimeRange } from '@/components/dashboard/TimeRangeSelector';
import { useLanguage } from '@/hooks/use-language';
import { useActivityLogger } from '@/hooks/useActivityLogger';

const MarketingReportsPage = () => {
  const { isMarketingContext } = useMarketingContext();
  const { t } = useLanguage();
  const { logActivity } = useActivityLogger();

  // Marketing Campaigns hooks
  const {
    campaigns,
    isLoading: campaignsLoading,
    error: campaignsError,
    fetchCampaigns,
    addCampaign,
    updateCampaign,
    deleteCampaign,
    calculateMetrics
  } = useMarketingCampaigns();

  // Lead Compra hooks
  const {
    leads,
    statistics,
    isLoading: leadsLoading,
    error: leadsError,
    fetchLeads,
    addLead,
    deleteLead
  } = useLeadCompra();

  // Landing Leads (Quadro Kanban) hooks
  const {
    leads: landingLeads,
    isLoading: landingLeadsLoading,
    fetchLeads: fetchLandingLeads,
    addLead: addLandingLead,
    updateLeadStatus: updateLandingLeadStatus,
    updateLead: updateLandingLead,
    deleteLead: deleteLandingLead,
  } = useLandingLeads();

  // Marketing Campaigns states
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingCampaign, setEditingCampaign] = useState<MarketingCampaign | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState<CampaignFilters>({});
  const [, setShowImporter] = useState(false);

  // Lead Compra & Quadro states
  const [isLeadFormOpen, setIsLeadFormOpen] = useState(false);
  const [editingLandingLead, setEditingLandingLead] = useState<LandingLead | null>(null);
  const [leadSearchTerm, setLeadSearchTerm] = useState('');
  const [showLeadFilters, setShowLeadFilters] = useState(false);
  const [leadFilters, setLeadFilters] = useState<LeadCompraFilters>({
    tipo: 'Todos'
  });
  const [showLeadImporter, setShowLeadImporter] = useState(false);

  // Email/SMS Campaigns hooks
  const {
    campaigns: emailSmsCampaigns,
    isLoading: emailSmsLoading,
    addCampaign: addEmailSmsCampaign,
    updateCampaign: updateEmailSmsCampaign,
    deleteCampaign: deleteEmailSmsCampaign,
  } = useEmailSmsCampaigns();

  // Email/SMS Campaigns states
  const [isEmailSmsFormOpen, setIsEmailSmsFormOpen] = useState(false);
  const [editingEmailSmsCampaign, setEditingEmailSmsCampaign] = useState<EmailSmsCampaign | null>(null);
  const [emailSmsSearchTerm, setEmailSmsSearchTerm] = useState('');

  // Time range filter
  const [periodFilter, setPeriodFilter] = useState<TimeRange>('all');

  // Data de corte do período selecionado (null = tudo)
  const periodCutoff = useMemo(() => {
    if (periodFilter === 'all') return null;
    const now = new Date();
    if (periodFilter === '1y') return new Date(now.getFullYear() - 1, now.getMonth(), 1);
    const days = periodFilter === '7d' ? 7 : periodFilter === '30d' ? 30 : 90;
    return new Date(now.getFullYear(), now.getMonth(), now.getDate() - days);
  }, [periodFilter]);

  // Filtrar campanhas baseado na busca e filtros
  const filteredCampaigns = useMemo(() => {
    let filtered = campaigns || [];

    // Aplicar período selecionado
    if (periodCutoff) {
      filtered = filtered.filter(campaign => new Date(campaign.ano, campaign.mes - 1, 1) >= periodCutoff);
    }

    // Aplicar busca por texto
    if (searchTerm) {
      filtered = filtered.filter(campaign =>
        campaign.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        campaign.origem?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Aplicar filtros
    if (filters.origem) {
      filtered = filtered.filter(campaign => campaign.origem === filters.origem);
    }

    if (filters.anoInicio) {
      filtered = filtered.filter(campaign => campaign.ano >= filters.anoInicio!);
    }

    if (filters.anoFim) {
      filtered = filtered.filter(campaign => campaign.ano <= filters.anoFim!);
    }

    if (filters.mesInicio && filters.anoInicio) {
      filtered = filtered.filter(campaign => {
        const campaignDate = new Date(campaign.ano, campaign.mes - 1);
        const startDate = new Date(filters.anoInicio!, filters.mesInicio! - 1);
        return campaignDate >= startDate;
      });
    }

    if (filters.mesFim && filters.anoFim) {
      filtered = filtered.filter(campaign => {
        const campaignDate = new Date(campaign.ano, campaign.mes - 1);
        const endDate = new Date(filters.anoFim!, filters.mesFim! - 1);
        return campaignDate <= endDate;
      });
    }

    // Aplicar ordenação
    if (filters.ordenarPor) {
      filtered.sort((a, b) => {
        let valueA: string | number | Date = 0;
        let valueB: string | number | Date = 0;

        switch (filters.ordenarPor) {
          case 'nome':
            valueA = a.name.toLowerCase();
            valueB = b.name.toLowerCase();
            break;
          case 'mes':
            valueA = new Date(a.ano, a.mes - 1);
            valueB = new Date(b.ano, b.mes - 1);
            break;
          case 'investimento':
            valueA = a.investimento;
            valueB = b.investimento;
            break;
          case 'leads':
            valueA = a.leads;
            valueB = b.leads;
            break;
          case 'receita':
            valueA = a.receita;
            valueB = b.receita;
            break;
          case 'roi':
            valueA = a.investimento > 0 ? ((a.receita - a.investimento) / a.investimento) * 100 : 0;
            valueB = b.investimento > 0 ? ((b.receita - b.investimento) / b.investimento) * 100 : 0;
            break;
          default:
            return 0;
        }

        if (valueA < valueB) return filters.ordem === 'asc' ? -1 : 1;
        if (valueA > valueB) return filters.ordem === 'asc' ? 1 : -1;
        return 0;
      });
    }

    return filtered;
  }, [campaigns, searchTerm, filters, periodCutoff]);

  // Filtrar leads baseado na busca e filtros
  const filteredLeads = useMemo(() => {
    let filtered = leads || [];

    // Aplicar período selecionado
    if (periodCutoff) {
      filtered = filtered.filter(lead => new Date(lead.data_evento) >= periodCutoff);
    }

    // Aplicar busca por texto
    if (leadSearchTerm) {
      filtered = filtered.filter(lead =>
        lead.nome?.toLowerCase().includes(leadSearchTerm.toLowerCase()) ||
        lead.email?.toLowerCase().includes(leadSearchTerm.toLowerCase()) ||
        lead.cidade?.toLowerCase().includes(leadSearchTerm.toLowerCase()) ||
        lead.origem_campanha?.toLowerCase().includes(leadSearchTerm.toLowerCase())
      );
    }

    // Aplicar filtros
    if (leadFilters.tipo && leadFilters.tipo !== 'Todos') {
      filtered = filtered.filter(lead => lead.tipo === leadFilters.tipo);
    }

    if (leadFilters.cidade) {
      filtered = filtered.filter(lead => lead.cidade === leadFilters.cidade);
    }

    if (leadFilters.genero) {
      filtered = filtered.filter(lead => lead.genero === leadFilters.genero);
    }

    if (leadFilters.dataInicio) {
      filtered = filtered.filter(lead =>
        new Date(lead.data_evento) >= new Date(leadFilters.dataInicio!)
      );
    }

    if (leadFilters.dataFim) {
      filtered = filtered.filter(lead =>
        new Date(lead.data_evento) <= new Date(leadFilters.dataFim!)
      );
    }

    return filtered;
  }, [leads, leadSearchTerm, leadFilters, periodCutoff]);

  const metrics = useMemo(() => {
    return calculateMetrics(filteredCampaigns);
  }, [filteredCampaigns, calculateMetrics]);

  const handleSubmitCampaign = async (data: Omit<MarketingCampaign, 'id' | 'created_at' | 'updated_at' | 'cpl' | 'cac' | 'taxa_conversao'>) => {
    try {
      if (editingCampaign) {
        await updateCampaign(editingCampaign.id, data);
        toast.success('Campanha atualizada com sucesso!');
      } else {
        await addCampaign(data);
        toast.success('Campanha adicionada com sucesso!');
      }
      setIsFormOpen(false);
      setEditingCampaign(null);
    } catch (error) {
      console.error('Erro ao salvar campanha:', error);
    }
  };

  const handleEditCampaign = (campaign: MarketingCampaign) => {
    setEditingCampaign(campaign);
    setIsFormOpen(true);
  };

  const handleDeleteCampaign = async (id: string) => {
    if (window.confirm('Tem certeza que deseja excluir esta campanha?')) {
      try {
        await deleteCampaign(id);
        toast.success('Campanha removida com sucesso!');
      } catch (error) {
        console.error('Erro ao remover campanha:', error);
      }
    }
  };

  const handleCancelForm = () => {
    setIsFormOpen(false);
    setEditingCampaign(null);
  };

  const handleClearFilters = () => {
    setFilters({});
    setSearchTerm('');
  };

  // Funções unificadas para Leads (Quadro Kanban + Lista)
  const handleSubmitLandingLead = async (formData: LandingLeadFormData) => {
    try {
      if (editingLandingLead) {
        await updateLandingLead(editingLandingLead.id, formData);
        toast.success('Lead atualizado com sucesso!');
      } else {
        await addLandingLead({ ...formData, email: formData.email ?? '' });
      }
      // Atualizar ambas as listas para manter sincronia instantânea
      await Promise.all([fetchLandingLeads(), fetchLeads()]);
      setIsLeadFormOpen(false);
      setEditingLandingLead(null);
    } catch (error) {
      console.error('Erro ao salvar lead:', error);
    }
  };

  const handleEditLeadFromList = (lead: LeadCompra) => {
    const existingLanding = landingLeads.find(l =>
      (lead.email && l.email && l.email.toLowerCase() === lead.email.toLowerCase()) ||
      (lead.telefone && l.telefone && l.telefone.trim() === lead.telefone.trim()) ||
      l.id === lead.id
    );

    const statusMapToLanding: Record<string, LandingLeadStatus> = {
      'Marcaram avaliação': 'Agendou Avaliação',
      'Vão marcar consulta mais à frente': 'Contactado',
      'Falta resultados da avaliação': 'Avaliação Realizada',
      'Iniciou Neurofeedback': 'Iniciou Neurofeedback',
      'Não vai avançar': 'Não Avança',
      'Novo': 'Novo',
      'Contactado': 'Contactado',
      'Agendou Avaliação': 'Agendou Avaliação',
      'Avaliação Realizada': 'Avaliação Realizada',
      'Não Avança': 'Não Avança',
    };

    if (existingLanding) {
      setEditingLandingLead(existingLanding);
    } else {
      setEditingLandingLead({
        id: lead.id,
        nome: lead.nome,
        email: lead.email || '',
        telefone: lead.telefone,
        status: (lead.status && statusMapToLanding[lead.status]) || 'Novo',
        origem: lead.origem_campanha || 'Instagram',
        morada: lead.cidade || '',
        observacoes: lead.observacoes || '',
        created_at: lead.created_at,
        updated_at: lead.updated_at,
      });
    }
    setIsLeadFormOpen(true);
  };

  const handleDeleteLeadFromList = async (id: string) => {
    if (window.confirm('Tem certeza que deseja excluir este lead?')) {
      try {
        const leadToDelete = leads.find(l => l.id === id);
        await deleteLead(id);

        if (leadToDelete) {
          const matchLanding = landingLeads.find(l =>
            (leadToDelete.email && l.email && l.email.toLowerCase() === leadToDelete.email.toLowerCase()) ||
            (leadToDelete.telefone && l.telefone && l.telefone.trim() === leadToDelete.telefone.trim()) ||
            l.id === id
          );
          if (matchLanding) {
            await deleteLandingLead(matchLanding.id);
          }
        }
        await Promise.all([fetchLandingLeads(), fetchLeads()]);
        toast.success('Lead removido com sucesso!');
      } catch (error) {
        console.error('Erro ao remover lead:', error);
      }
    }
  };

  const handleCancelLeadForm = () => {
    setIsLeadFormOpen(false);
    setEditingLandingLead(null);
  };

  const handleClearLeadFilters = () => {
    setLeadFilters({
      tipo: 'Todos'
    });
    setLeadSearchTerm('');
  };

  const handleDataImported = async (data: Record<string, unknown>[], type: 'marketing' | 'lead-compra') => {
    let successCount = 0;
    let errorCount = 0;

    if (type === 'marketing') {
      for (const item of data) {
        try {
          await addCampaign(item as Omit<MarketingCampaign, 'id' | 'updated_at' | 'created_at' | 'cpl' | 'cac' | 'taxa_conversao'>);
          successCount++;
        } catch (error) {
          console.error('Erro ao importar campanha:', error);
          errorCount++;
        }
      }

      if (successCount > 0) {
        toast.success(`${successCount} campanhas importadas com sucesso!`);
        logActivity('import_performed', 'campanhas', undefined, `${successCount} campanhas importadas via ficheiro`);
      }

      if (errorCount > 0) {
        toast.error(`${errorCount} campanhas falharam ao importar.`);
      }

      setShowImporter(false);
    } else if (type === 'lead-compra') {
      for (const item of data) {
        try {
          await addLead(item as Omit<LeadCompra, 'id' | 'updated_at' | 'created_at'>);
          successCount++;
        } catch (error) {
          console.error('Erro ao importar lead:', error);
          errorCount++;
        }
      }

      if (successCount > 0) {
        toast.success(`${successCount} leads importados com sucesso!`);
        logActivity('import_performed', 'leads', undefined, `${successCount} leads importados via ficheiro`);
      }

      if (errorCount > 0) {
        toast.error(`${errorCount} leads falharam ao importar.`);
      }

      await Promise.all([fetchLandingLeads(), fetchLeads()]);
      setShowLeadImporter(false);
    }
  };

  if (campaignsError || leadsError) {
    return (
      <PageLayout>
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <p className="text-red-600 mb-4">
              Erro ao carregar dados: {campaignsError || leadsError}
            </p>
            <div className="space-x-2">
              <Button onClick={() => fetchCampaigns()}>Recarregar Campanhas</Button>
              <Button onClick={() => fetchLeads()}>Recarregar Leads</Button>
            </div>
          </div>
        </div>
      </PageLayout>
    );
  }

  const content = (
    <div className="space-y-6">
      {/* Cabeçalho */}
      <PageHeader
        title={t('marketing')}
        description="Gerencie campanhas, leads e análises de marketing"
        icon={<Megaphone className="h-5 w-5" />}
        actions={
          <>
            <TimeRangeSelector
              selectedRange={periodFilter}
              onRangeChange={setPeriodFilter}
            />
            <Button size="sm" className="gap-2 bg-gradient-to-r from-[#3f9094] to-[#2A5854] hover:opacity-90" onClick={() => setIsFormOpen(true)}>
              <Plus className="h-4 w-4" />
              {t('newCampaign')}
            </Button>
          </>
        }
      />

      {/* Dialog: Nova/Editar Campanha */}
      <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingCampaign ? 'Editar Campanha' : 'Nova Campanha'}
            </DialogTitle>
          </DialogHeader>
          <CampaignForm
            campaign={editingCampaign || undefined}
            onSubmit={handleSubmitCampaign}
            onCancel={handleCancelForm}
            isLoading={campaignsLoading || false}
          />
        </DialogContent>
      </Dialog>

      {/* Dialog: Novo/Editar Lead */}
      <Dialog open={isLeadFormOpen} onOpenChange={(open) => {
        setIsLeadFormOpen(open);
        if (!open) setEditingLandingLead(null);
      }}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingLandingLead ? 'Editar Lead' : 'Novo Lead'}
            </DialogTitle>
            <DialogDescription>
              {editingLandingLead ? 'Atualize as informações do lead e a sua fase no quadro.' : 'Preencha as informações para registar um novo lead diretamente no quadro.'}
            </DialogDescription>
          </DialogHeader>
          <LandingLeadForm
            initialData={editingLandingLead || undefined}
            onSubmit={handleSubmitLandingLead}
            onCancel={handleCancelLeadForm}
            isLoading={landingLeadsLoading || leadsLoading}
          />
        </DialogContent>
      </Dialog>

      {/* Dialog: Importar Leads */}
      <Dialog open={showLeadImporter} onOpenChange={setShowLeadImporter}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Importar Leads (PDF, Excel, CSV)</DialogTitle>
            <DialogDescription>
              Carregue a folha de leads em PDF ou ficheiro Excel/CSV para registar automaticamente todos os contactos no sistema e no quadro.
            </DialogDescription>
          </DialogHeader>
          <FileImporter
            onDataImported={handleDataImported}
            expectedType="lead-compra"
            title="Carregar Folha de Leads (PDF / Excel)"
            description="Arraste o PDF de leads ou clique para selecionar"
          />
        </DialogContent>
      </Dialog>

      {/* Dialog: Nova/Editar Campanha Email/SMS */}
      <Dialog open={isEmailSmsFormOpen} onOpenChange={setIsEmailSmsFormOpen}>
        <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingEmailSmsCampaign ? 'Editar Campanha Email/SMS' : 'Nova Campanha Email/SMS'}
            </DialogTitle>
            <DialogDescription>
              {editingEmailSmsCampaign
                ? 'Atualize as informações da campanha de email/SMS e os clientes destinatários.'
                : 'Crie uma nova campanha de email ou SMS para enviar aos seus clientes.'}
            </DialogDescription>
          </DialogHeader>
          <EmailSmsCampaignForm
            campaign={editingEmailSmsCampaign || undefined}
            onSubmit={async (data) => {
              try {
                if (editingEmailSmsCampaign) {
                  await updateEmailSmsCampaign(editingEmailSmsCampaign.id, data);
                  toast.success('Campanha atualizada com sucesso!');
                } else {
                  await addEmailSmsCampaign(data);
                  toast.success('Campanha criada com sucesso!');
                }
                setIsEmailSmsFormOpen(false);
                setEditingEmailSmsCampaign(null);
              } catch (error) {
                console.error('Erro ao salvar campanha:', error);
              }
            }}
            onCancel={() => {
              setIsEmailSmsFormOpen(false);
              setEditingEmailSmsCampaign(null);
            }}
            isLoading={emailSmsLoading || false}
          />
        </DialogContent>
      </Dialog>

      {/* Tabs Reorganizadas: 8 → 4 */}
      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="grid w-full grid-cols-2 md:grid-cols-5 h-auto md:h-10">
          <TabsTrigger value="overview" className="flex items-center gap-2">
            <BarChart3 className="h-4 w-4" />
            <span className="hidden sm:inline">Visão Geral</span>
          </TabsTrigger>
          <TabsTrigger value="campaigns" className="flex items-center gap-2">
            <Calendar className="h-4 w-4" />
            <span className="hidden sm:inline">Campanhas</span>
          </TabsTrigger>
          <TabsTrigger value="leads" className="flex items-center gap-2">
            <Target className="h-4 w-4" />
            <span className="hidden sm:inline">Leads</span>
          </TabsTrigger>
          <TabsTrigger value="intelligence" className="flex items-center gap-2">
            <Sparkles className="h-4 w-4" />
            <span className="hidden sm:inline">Inteligência</span>
          </TabsTrigger>
          <TabsTrigger value="tools" className="flex items-center gap-2">
            <Upload className="h-4 w-4" />
            <span className="hidden sm:inline">Ferramentas</span>
          </TabsTrigger>
        </TabsList>

        {/* 📊 Visão Geral - Combinando dashboard + lead analytics */}
        <TabsContent value="overview" className="space-y-6 mt-6">
          {/* Dashboard de Campanhas */}
          <MarketingDashboard
            campaigns={filteredCampaigns}
            metrics={metrics || {
              totalInvestimento: 0,
              totalLeads: 0,
              totalReunioes: 0,
              totalVendas: 0,
              totalReceita: 0,
              cplMedio: 0,
              cacMedio: 0,
              taxaConversaoMedia: 0,
              roi: 0,
              roas: 0
            }}
          />

          {/* Analytics de Leads */}
          <div className="mt-8">
            <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
              <Users className="h-5 w-5 text-[#3f9094]" />
              Analytics de Leads
            </h3>
            <LeadCompraDashboard
              statistics={statistics || {
                totalRegistos: 0,
                comprasRegistadas: 0,
                leadsRegistados: 0,
                valorTotalRegistado: 0,
                estatisticasValores: {
                  registosComValor: 0,
                  media: 0,
                  minimo: 0,
                  mediana: 0,
                  maximo: 0
                },
                distribuicaoPorGenero: { masculino: 0, feminino: 0, outro: 0 },
                distribuicaoPorCidade: {},
                distribuicaoPorMes: {},
                conversaoLeadParaCompra: 0
              }}
            />
          </div>
        </TabsContent>

        {/* 📋 Campanhas - Marketing + Email/SMS juntos */}
        <TabsContent value="campaigns" className="space-y-6 mt-6">
          <Tabs defaultValue="marketing" className="w-full">
            <TabsList className="grid w-full max-w-md grid-cols-2">
              <TabsTrigger value="marketing" className="gap-2">
                <Calendar className="h-4 w-4" />
                Marketing
              </TabsTrigger>
              <TabsTrigger value="email-sms" className="gap-2">
                <Mail className="h-4 w-4" />
                Email/SMS
              </TabsTrigger>
            </TabsList>

            {/* Campanhas de Marketing */}
            <TabsContent value="marketing" className="space-y-6 mt-4">
              {/* Barra de ações contextual */}
              <div className="flex flex-col sm:flex-row gap-4">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                  <Input
                    placeholder="Buscar campanhas por nome ou origem..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
                <Button
                  variant="outline"
                  onClick={() => setShowFilters(!showFilters)}
                  className={showFilters ? 'bg-[#E6F2F1] border-[#3f9094]/30' : ''}
                >
                  <Filter className="h-4 w-4 mr-2" />
                  Filtros
                </Button>
                <Button className="gap-2 bg-gradient-to-r from-[#3f9094] to-[#2A5854] hover:opacity-90" onClick={() => setIsFormOpen(true)}>
                  <Plus className="h-4 w-4" />
                  Nova Campanha
                </Button>
                {(searchTerm || Object.keys(filters).length > 0) && (
                  <Button variant="outline" onClick={handleClearFilters}>
                    <X className="h-4 w-4 mr-2" />
                    Limpar
                  </Button>
                )}
              </div>

              {/* Filtros Expandidos */}
              {showFilters && (
                <CampaignFiltersComponent
                  filters={filters}
                  onFiltersChange={setFilters}
                  onClearFilters={handleClearFilters}
                />
              )}

              {/* Resumo */}
              <div className="bg-muted/70 text-muted-foreground p-3 rounded-lg text-sm">
                Mostrando <strong className="text-foreground">{filteredCampaigns.length}</strong> de <strong className="text-foreground">{campaigns.length}</strong> campanhas
                {(searchTerm || Object.keys(filters).length > 0) && ' (filtradas)'}
              </div>

              {/* Lista de Campanhas */}
              {campaignsLoading ? (
                <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
                  {Array.from({ length: 6 }).map((_, i) => (
                    <Card key={i} className="p-5 space-y-3">
                      <Skeleton className="h-5 w-2/3" />
                      <Skeleton className="h-4 w-1/3" />
                      <Skeleton className="h-20 w-full" />
                    </Card>
                  ))}
                </div>
              ) : filteredCampaigns.length === 0 ? (
                <div className="text-center py-8">
                  <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600 dark:text-gray-400">
                    {campaigns.length === 0
                      ? 'Nenhuma campanha cadastrada ainda.'
                      : 'Nenhuma campanha encontrada com os filtros aplicados.'
                    }
                  </p>
                  {campaigns.length === 0 && (
                    <Button
                      className="mt-4"
                      onClick={() => setIsFormOpen(true)}
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Criar Primeira Campanha
                    </Button>
                  )}
                </div>
              ) : (
                <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
                  {filteredCampaigns.map((campaign) => (
                    <CampaignCard
                      key={campaign.id}
                      campaign={campaign}
                      onEdit={handleEditCampaign}
                      onDelete={handleDeleteCampaign}
                    />
                  ))}
                </div>
              )}
            </TabsContent>

            {/* Email/SMS Campanhas */}
            <TabsContent value="email-sms" className="space-y-6 mt-4">
              {/* Barra de ações contextual */}
              <div className="flex flex-col sm:flex-row gap-4">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                  <Input
                    placeholder="Buscar campanhas por nome..."
                    value={emailSmsSearchTerm}
                    onChange={(e) => setEmailSmsSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
                <Button
                  className="gap-2 bg-purple-600 hover:bg-purple-700 text-white"
                  onClick={() => setIsEmailSmsFormOpen(true)}
                >
                  <Plus className="h-4 w-4" />
                  Nova Campanha Email/SMS
                </Button>
              </div>

              {/* Resumo */}
              <div className="bg-muted/70 text-muted-foreground p-3 rounded-lg text-sm">
                Mostrando <strong className="text-foreground">{emailSmsCampaigns.filter(c =>
                  !emailSmsSearchTerm || c.nome.toLowerCase().includes(emailSmsSearchTerm.toLowerCase())
                ).length}</strong> de <strong className="text-foreground">{emailSmsCampaigns.length}</strong> campanhas
              </div>

              {/* Lista de Campanhas Email/SMS */}
              {emailSmsLoading ? (
                <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
                  {Array.from({ length: 3 }).map((_, i) => (
                    <Card key={i} className="p-5 space-y-3">
                      <Skeleton className="h-5 w-2/3" />
                      <Skeleton className="h-4 w-1/3" />
                      <Skeleton className="h-20 w-full" />
                    </Card>
                  ))}
                </div>
              ) : emailSmsCampaigns.filter(c =>
                !emailSmsSearchTerm || c.nome.toLowerCase().includes(emailSmsSearchTerm.toLowerCase())
              ).length === 0 ? (
                <div className="text-center py-8">
                  <Mail className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600 dark:text-gray-400">
                    {emailSmsCampaigns.length === 0
                      ? 'Nenhuma campanha de email/SMS cadastrada ainda.'
                      : 'Nenhuma campanha encontrada com os filtros aplicados.'
                    }
                  </p>
                  {emailSmsCampaigns.length === 0 && (
                    <Button
                      className="mt-4 bg-purple-600 hover:bg-purple-700"
                      onClick={() => setIsEmailSmsFormOpen(true)}
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Criar Primeira Campanha
                    </Button>
                  )}
                </div>
              ) : (
                <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
                  {emailSmsCampaigns
                    .filter(c =>
                      !emailSmsSearchTerm || c.nome.toLowerCase().includes(emailSmsSearchTerm.toLowerCase())
                    )
                    .map((campaign) => (
                      <EmailSmsCampaignCard
                        key={campaign.id}
                        campaign={campaign}
                        onEdit={(campaign) => {
                          setEditingEmailSmsCampaign(campaign);
                          setIsEmailSmsFormOpen(true);
                        }}
                        onDelete={async (id) => {
                          if (window.confirm('Tem certeza que deseja excluir esta campanha?')) {
                            await deleteEmailSmsCampaign(id);
                          }
                        }}
                      />
                    ))}
                </div>
              )}
            </TabsContent>
          </Tabs>
        </TabsContent>

        {/* ⚙️ Ferramentas - Import, Export, Filtros Consolidados */}
        <TabsContent value="tools" className="space-y-6 mt-6">
          <Tabs defaultValue="import" className="w-full">
            <TabsList className="grid w-full max-w-2xl grid-cols-2 md:grid-cols-4">
              <TabsTrigger value="import" className="gap-2">
                <Upload className="h-4 w-4" />
                Importar
              </TabsTrigger>
              <TabsTrigger value="export" className="gap-2">
                <Download className="h-4 w-4" />
                Exportar
              </TabsTrigger>
              <TabsTrigger value="filters" className="gap-2">
                <Filter className="h-4 w-4" />
                Filtros
              </TabsTrigger>
              <TabsTrigger value="automation" className="gap-2 text-purple-600">
                <Settings2 className="h-4 w-4" />
                Automação
              </TabsTrigger>
            </TabsList>

            {/* Import */}
            <TabsContent value="import" className="space-y-6 mt-4">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <FileImporter
                  onDataImported={handleDataImported}
                  expectedType="marketing"
                  title="Importar Campanhas de Marketing"
                  description="Importe campanhas de marketing de arquivos Excel, Word ou PDF"
                />
                <FileImporter
                  onDataImported={handleDataImported}
                  expectedType="lead-compra"
                  title="Importar Leads e Compras"
                  description="Importe dados de leads e compras de arquivos Excel, Word ou PDF"
                />
              </div>
            </TabsContent>

            {/* Export */}
            <TabsContent value="export" className="space-y-6 mt-4">
              <ExportManager campaigns={filteredCampaigns} />
            </TabsContent>

            {/* Filtros */}
            <TabsContent value="filters" className="space-y-6 mt-4">
              <CampaignFiltersComponent
                filters={filters}
                onFiltersChange={setFilters}
                onClearFilters={handleClearFilters}
              />
            </TabsContent>

            {/* Automação */}
            <TabsContent value="automation" className="space-y-6 mt-4">
              <SmsAutomationSettings />
            </TabsContent>
          </Tabs>
        </TabsContent>

        {/* Leads */}
        {/* 🎯 Leads - Com Kanban Board e Lista */}
        <TabsContent value="leads" className="space-y-6 mt-6">
          <Tabs defaultValue="kanban" className="w-full">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-4">
              <TabsList className="grid w-full max-w-xs grid-cols-2">
                <TabsTrigger value="kanban" className="gap-2">
                  <LayoutGrid className="h-4 w-4" />
                  Kanban
                </TabsTrigger>
                <TabsTrigger value="lista" className="gap-2">
                  <List className="h-4 w-4" />
                  Lista
                </TabsTrigger>
              </TabsList>

              <p className="text-sm text-gray-500">
                Leads da Landing Page com gestão visual
              </p>
            </div>

            {/* Kanban View - Leads da Landing Page */}
            <TabsContent value="kanban" className="mt-4">
              <LeadKanbanBoard
                leads={landingLeads}
                isLoading={landingLeadsLoading}
                onRefresh={async () => {
                  await Promise.all([fetchLandingLeads(), fetchLeads()]);
                }}
                onImportClick={() => setShowLeadImporter(true)}
                onAddLead={async (data) => {
                  const res = await addLandingLead(data);
                  await fetchLeads();
                  return res;
                }}
                onUpdateStatus={async (id, status) => {
                  await updateLandingLeadStatus(id, status);
                  await fetchLeads();
                }}
                onUpdateLead={async (id, data) => {
                  const res = await updateLandingLead(id, data);
                  await fetchLeads();
                  return res;
                }}
                onDeleteLead={async (id) => {
                  await deleteLandingLead(id);
                  await fetchLeads();
                }}
              />
            </TabsContent>

            {/* Lista View - Leads tradicionais */}
            <TabsContent value="lista" className="space-y-4 mt-4">
              {/* Barra de ações contextual */}
              <div className="flex flex-col sm:flex-row gap-4">
                <div className="flex-1">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                    <Input
                      placeholder="Buscar leads..."
                      value={leadSearchTerm}
                      onChange={(e) => setLeadSearchTerm(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>
                <Button
                  variant="outline"
                  onClick={() => setShowLeadFilters(!showLeadFilters)}
                  className="flex items-center gap-2"
                >
                  <Filter className="h-4 w-4" />
                  Filtros
                  {showLeadFilters && <X className="h-4 w-4" />}
                </Button>
                <Button
                  variant="outline"
                  className="gap-2"
                  onClick={() => setShowLeadImporter(true)}
                >
                  <Upload className="h-4 w-4" />
                  Importar Leads
                </Button>
                <Button className="gap-2 bg-gradient-to-r from-[#3f9094] to-[#2A5854] hover:opacity-90" onClick={() => setIsLeadFormOpen(true)}>
                  <Plus className="h-4 w-4" />
                  Novo Lead
                </Button>
              </div>

              {/* Filtros de leads (quando visível) */}
              {showLeadFilters && (
                <Card className="p-4">
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div>
                      <Label>Tipo</Label>
                      <Select
                        value={leadFilters.tipo || 'Todos'}
                        onValueChange={(value) => setLeadFilters({ ...leadFilters, tipo: value as 'Compra' | 'Lead' | 'Todos' })}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Todos" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Todos">Todos</SelectItem>
                          <SelectItem value="Lead">Lead</SelectItem>
                          <SelectItem value="Compra">Compra</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label>Cidade</Label>
                      <Input
                        placeholder="Filtrar por cidade"
                        value={leadFilters.cidade || ''}
                        onChange={(e) => setLeadFilters({ ...leadFilters, cidade: e.target.value })}
                      />
                    </div>
                    <div>
                      <Label>Gênero</Label>
                      <Select
                        value={leadFilters.genero || 'todos'}
                        onValueChange={(value) => setLeadFilters({ ...leadFilters, genero: value === 'todos' ? undefined : value as 'Masculino' | 'Feminino' | 'Outro' })}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Todos os gêneros" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="todos">Todos</SelectItem>
                          <SelectItem value="Masculino">Masculino</SelectItem>
                          <SelectItem value="Feminino">Feminino</SelectItem>
                          <SelectItem value="Outro">Outro</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="flex items-end">
                      <Button variant="outline" onClick={handleClearLeadFilters} className="w-full">
                        Limpar Filtros
                      </Button>
                    </div>
                  </div>
                </Card>
              )}

              {/* Lista de leads */}
              {leadsLoading ? (
                <div className="space-y-3">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Card key={i} className="p-4 space-y-2">
                      <Skeleton className="h-5 w-1/3" />
                      <Skeleton className="h-4 w-2/3" />
                      <Skeleton className="h-4 w-1/2" />
                    </Card>
                  ))}
                </div>
              ) : filteredLeads.length === 0 ? (
                <div className="text-center py-8">
                  <Target className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600 dark:text-gray-400">
                    {leads.length === 0
                      ? 'Nenhum lead registado ainda.'
                      : 'Nenhum lead encontrado com os filtros aplicados.'
                    }
                  </p>
                </div>
              ) : (
                <>
                  {/* Tabela densa (desktop) */}
                  <Card className="hidden md:block overflow-hidden">
                    <Table>
                      <TableHeader>
                        <TableRow className="bg-muted/50">
                          <TableHead>Nome</TableHead>
                          <TableHead>Contacto</TableHead>
                          <TableHead>Cidade</TableHead>
                          <TableHead>Estado</TableHead>
                          <TableHead className="text-right">Valor</TableHead>
                          <TableHead>Data</TableHead>
                          <TableHead className="text-right">Ações</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {filteredLeads.map((lead) => (
                          <TableRow key={lead.id} className="hover:bg-muted/40">
                            <TableCell>
                              <div className="flex items-center gap-2">
                                <span className="font-medium">{lead.nome}</span>
                                <Badge variant={lead.tipo === 'Compra' ? 'default' : 'secondary'} className="text-[10px] px-1.5 py-0">
                                  {lead.tipo}
                                </Badge>
                              </div>
                              {lead.origem_campanha && (
                                <span className="text-xs text-muted-foreground">{lead.origem_campanha}</span>
                              )}
                            </TableCell>
                            <TableCell>
                              <div className="space-y-0.5 text-xs text-muted-foreground">
                                {lead.email && <div className="flex items-center gap-1.5"><Mail className="h-3 w-3" />{lead.email}</div>}
                                {lead.telefone && <div className="flex items-center gap-1.5"><Phone className="h-3 w-3" />{lead.telefone}</div>}
                              </div>
                            </TableCell>
                            <TableCell className="text-sm text-muted-foreground">{lead.cidade || '—'}</TableCell>
                            <TableCell>
                              {lead.status ? (
                                <Badge variant="outline" className="border-teal-300 text-teal-700 bg-teal-50 dark:bg-teal-950/40 dark:text-teal-300 font-medium text-[10px] px-1.5 py-0">
                                  {lead.status}
                                </Badge>
                              ) : (
                                <span className="text-muted-foreground text-xs">—</span>
                              )}
                            </TableCell>
                            <TableCell className="text-right tabular-nums">
                              {lead.valor_pago && lead.valor_pago > 0
                                ? `€${lead.valor_pago}`
                                : <span className="text-muted-foreground">—</span>}
                            </TableCell>
                            <TableCell className="text-sm text-muted-foreground whitespace-nowrap">
                              {lead.data_evento ? new Date(lead.data_evento).toLocaleDateString('pt-PT') : '—'}
                            </TableCell>
                            <TableCell className="text-right">
                              <div className="flex items-center justify-end gap-1">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="h-8 w-8 p-0"
                                  onClick={() => handleEditLeadFromList(lead)}
                                  title="Editar Lead"
                                >
                                  <Edit className="h-4 w-4" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="h-8 w-8 p-0 text-red-600 hover:text-red-700 hover:bg-red-50"
                                  onClick={() => handleDeleteLeadFromList(lead.id)}
                                  title="Eliminar Lead"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </Card>

                  {/* Cards (mobile) */}
                  <div className="grid gap-4 md:hidden">
                    {filteredLeads.map((lead) => (
                      <Card key={lead.id} className="p-4">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-3 mb-2 flex-wrap">
                              <h3 className="font-semibold text-lg">{lead.nome}</h3>
                              <Badge variant={lead.tipo === 'Compra' ? 'default' : 'secondary'}>
                                {lead.tipo}
                              </Badge>
                              {lead.status && (
                                <Badge variant="outline" className="border-teal-300 text-teal-700 bg-teal-50 font-medium">
                                  {lead.status}
                                </Badge>
                              )}
                              {lead.genero && (
                                <Badge variant="outline">
                                  {lead.genero}
                                </Badge>
                              )}
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-gray-600">
                              {lead.email && (
                                <div className="flex items-center gap-2">
                                  <Mail className="h-4 w-4" />
                                  {lead.email}
                                </div>
                              )}
                              {lead.telefone && (
                                <div className="flex items-center gap-2">
                                  <Phone className="h-4 w-4" />
                                  {lead.telefone}
                                </div>
                              )}
                              {lead.cidade && (
                                <div className="flex items-center gap-2">
                                  <MapPin className="h-4 w-4" />
                                  {lead.cidade}
                                </div>
                              )}
                              {lead.idade && (
                                <div className="flex items-center gap-2">
                                  <Users className="h-4 w-4" />
                                  {lead.idade} anos
                                </div>
                              )}
                              {lead.valor_pago && lead.valor_pago > 0 && (
                                <div className="flex items-center gap-2">
                                  <Euro className="h-4 w-4" />
                                  €{lead.valor_pago}
                                </div>
                              )}
                              {lead.data_evento && (
                                <div className="flex items-center gap-2">
                                  <Calendar className="h-4 w-4" />
                                  {new Date(lead.data_evento).toLocaleDateString('pt-PT')}
                                </div>
                              )}
                            </div>
                            {lead.origem_campanha && (
                              <p className="mt-2 text-sm text-gray-700">
                                <strong>Campanha:</strong> {lead.origem_campanha}
                              </p>
                            )}
                          </div>
                          <div className="flex items-center gap-2 ml-4">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleEditLeadFromList(lead)}
                              title="Editar Lead"
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleDeleteLeadFromList(lead.id)}
                              className="text-red-600 hover:text-red-700"
                              title="Eliminar Lead"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      </Card>
                    ))}
                  </div>
                </>
              )}
            </TabsContent>
          </Tabs>
        </TabsContent>

        <TabsContent value="intelligence" className="space-y-6 mt-6">
          <MarketingIntelligence
            landingLeads={landingLeads}
            registros={leads}
            campaigns={campaigns}
            emailCampaigns={emailSmsCampaigns}
            isLoading={landingLeadsLoading || leadsLoading || campaignsLoading}
          />
        </TabsContent>

      </Tabs>
    </div>
  );

  // Se estamos no contexto de marketing (área protegida), não usar PageLayout
  if (isMarketingContext) {
    return content;
  }

  // Caso contrário, usar PageLayout (acesso normal via menu principal)
  return (
    <PageLayout>
      {content}
    </PageLayout>
  );
};

export default MarketingReportsPage;
