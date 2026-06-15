import { useState, useMemo } from 'react';
import PageLayout from '@/components/layout/PageLayout';
import { useMarketingContext } from '@/contexts/MarketingContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';

import { useMarketingCampaigns } from '@/hooks/useMarketingCampaigns';
import { useLeadCompra } from '@/hooks/useLeadCompra';
import { useEmailSmsCampaigns } from '@/hooks/useEmailSmsCampaigns';
import { MarketingCampaign, CampaignFilters } from '@/types/marketing';
import { EmailSmsCampaign } from '@/types/email-sms-campaign';
import CampaignForm from '@/components/marketing/CampaignForm';
import CampaignCard from '@/components/marketing/CampaignCard';
import CampaignFiltersComponent from '@/components/marketing/CampaignFilters';
import MarketingDashboard from '@/components/marketing/MarketingDashboard';
import ExportManager from '@/components/marketing/ExportManager';
import LeadCompraDashboard from '@/components/lead-compra/LeadCompraDashboard';
import FileImporter from '@/components/shared/FileImporter';
import { EmailSmsCampaignForm } from '@/components/marketing/EmailSmsCampaignForm';
import { EmailSmsCampaignCard } from '@/components/marketing/EmailSmsCampaignCard';
import { SmsAutomationSettings } from '@/components/marketing/SmsAutomationSettings';
import ClientsLeadsTab from '@/components/clients/ClientsLeadsTab';
import {
  Plus,
  Search,
  BarChart3,
  Calendar,
  Download,
  Filter,
  X,
  Upload,
  Users,
  Target,
  Mail,
  Settings2
} from 'lucide-react';
import { toast } from 'sonner';
import TimeRangeSelector, { TimeRange } from '@/components/dashboard/TimeRangeSelector';
import { useLanguage } from '@/hooks/use-language';

const MarketingReportsPage = () => {
  const { isMarketingContext } = useMarketingContext();
  const { t } = useLanguage();

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
    statistics,
    error: leadsError,
    fetchLeads,
    addLead
  } = useLeadCompra();

  // Marketing Campaigns states
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingCampaign, setEditingCampaign] = useState<MarketingCampaign | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState<CampaignFilters>({});

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

  // Filtrar campanhas baseado na busca e filtros
  const filteredCampaigns = useMemo(() => {
    let filtered = campaigns || [];

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
        let valueA: any, valueB: any;

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
  }, [campaigns, searchTerm, filters]);


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


  const handleDataImported = async (data: any[], type: 'marketing' | 'lead-compra') => {
    let successCount = 0;
    let errorCount = 0;

    if (type === 'marketing') {
      for (const item of data) {
        try {
          await addCampaign(item);
          successCount++;
        } catch (error) {
          console.error('Erro ao importar campanha:', error);
          errorCount++;
        }
      }

      if (successCount > 0) {
        toast.success(`${successCount} campanhas importadas com sucesso!`);
      }

      if (errorCount > 0) {
        toast.error(`${errorCount} campanhas falharam ao importar.`);
      }
    } else if (type === 'lead-compra') {
      for (const item of data) {
        try {
          await addLead(item);
          successCount++;
        } catch (error) {
          console.error('Erro ao importar lead:', error);
          errorCount++;
        }
      }

      if (successCount > 0) {
        toast.success(`${successCount} leads importados com sucesso!`);
      }

      if (errorCount > 0) {
        toast.error(`${errorCount} leads falharam ao importar.`);
      }
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
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">{t('marketing')}</h1>
          <p className="text-gray-600">Gerencie campanhas, leads e análises de marketing</p>
        </div>

        <div className="flex gap-2 items-center">
          <TimeRangeSelector
            selectedRange={periodFilter}
            onRangeChange={setPeriodFilter}
          />
          <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
            <DialogTrigger asChild>
              <Button size="sm" className="gap-2 bg-gradient-to-r from-[#3f9094] to-[#2A5854] hover:opacity-90">
                <Plus className="h-4 w-4" />
                {t('newCampaign')}
              </Button>
            </DialogTrigger>
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


          <Dialog open={isEmailSmsFormOpen} onOpenChange={setIsEmailSmsFormOpen}>
            <DialogTrigger asChild>
              <Button size="sm" variant="outline" className="gap-2">
                <Mail className="h-4 w-4" />
                Email/SMS
              </Button>
            </DialogTrigger>
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
        </div>
      </div>

      {/* Tabs Reorganizadas: 8 → 4 */}
      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="grid w-full grid-cols-2 md:grid-cols-4 h-auto md:h-10">
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
              {/* Barra de Busca */}
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
                  className={showFilters ? 'bg-blue-50 border-blue-200' : ''}
                >
                  <Filter className="h-4 w-4 mr-2" />
                  Filtros
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
              <div className="bg-blue-50 dark:bg-blue-950 p-4 rounded-lg">
                <p className="text-sm text-blue-900 dark:text-blue-100">
                  Mostrando <strong>{filteredCampaigns.length}</strong> de <strong>{campaigns.length}</strong> campanhas
                  {(searchTerm || Object.keys(filters).length > 0) && ' (filtradas)'}
                </p>
              </div>

              {/* Lista de Campanhas */}
              {campaignsLoading ? (
                <div className="flex justify-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
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
              {/* Barra de Busca */}
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
              </div>

              {/* Resumo */}
              <div className="bg-purple-50 dark:bg-purple-950 p-4 rounded-lg">
                <p className="text-sm text-purple-900 dark:text-purple-100">
                  Mostrando <strong>{emailSmsCampaigns.filter(c =>
                    !emailSmsSearchTerm || c.nome.toLowerCase().includes(emailSmsSearchTerm.toLowerCase())
                  ).length}</strong> de <strong>{emailSmsCampaigns.length}</strong> campanhas
                </p>
              </div>

              {/* Lista de Campanhas Email/SMS */}
              {emailSmsLoading ? (
                <div className="flex justify-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
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

        {/* 🎯 Leads */}
        <TabsContent value="leads" className="space-y-6 mt-6">
          <ClientsLeadsTab />
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
