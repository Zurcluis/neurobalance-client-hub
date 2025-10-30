import React, { useState, useMemo } from 'react';
import PageLayout from '@/components/layout/PageLayout';
import { useMarketingContext } from '@/contexts/MarketingContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useMarketingCampaigns } from '@/hooks/useMarketingCampaigns';
import { useLeadCompra } from '@/hooks/useLeadCompra';
import { MarketingCampaign, CampaignFilters } from '@/types/marketing';
import { LeadCompra, LeadCompraFilters } from '@/types/lead-compra';
import CampaignForm from '@/components/marketing/CampaignForm';
import CampaignCard from '@/components/marketing/CampaignCard';
import CampaignFiltersComponent from '@/components/marketing/CampaignFilters';
import MarketingDashboard from '@/components/marketing/MarketingDashboard';
import ExportManager from '@/components/marketing/ExportManager';
import LeadCompraForm from '@/components/lead-compra/LeadCompraForm';
import LeadCompraDashboard from '@/components/lead-compra/LeadCompraDashboard';
import ImportManager from '@/components/lead-compra/ImportManager';
import FileImporter from '@/components/shared/FileImporter';
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
  MapPin
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
    leads,
    statistics,
    isLoading: leadsLoading,
    error: leadsError,
    fetchLeads,
    addLead,
    updateLead,
    deleteLead,
    importLeads
  } = useLeadCompra();

  // Marketing Campaigns states
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingCampaign, setEditingCampaign] = useState<MarketingCampaign | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState<CampaignFilters>({});
  const [showImporter, setShowImporter] = useState(false);

  // Lead Compra states
  const [isLeadFormOpen, setIsLeadFormOpen] = useState(false);
  const [editingLead, setEditingLead] = useState<LeadCompra | null>(null);
  const [leadSearchTerm, setLeadSearchTerm] = useState('');
  const [showLeadFilters, setShowLeadFilters] = useState(false);
  const [leadFilters, setLeadFilters] = useState<LeadCompraFilters>({
    tipo: 'Todos'
  });
  const [showLeadImporter, setShowLeadImporter] = useState(false);

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

  // Filtrar leads baseado na busca e filtros
  const filteredLeads = useMemo(() => {
    let filtered = leads || [];

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
  }, [leads, leadSearchTerm, leadFilters]);

  const metrics = useMemo(() => {
    return calculateMetrics(filteredCampaigns);
  }, [filteredCampaigns, calculateMetrics]);

  const handleSubmitCampaign = async (data: Omit<MarketingCampaign, 'id' | 'created_at' | 'updated_at'>) => {
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

  // Funções para Lead Compra
  const handleSubmitLead = async (data: Omit<LeadCompra, 'id' | 'created_at' | 'updated_at'>) => {
    try {
      if (editingLead) {
        await updateLead(editingLead.id, data);
        toast.success('Lead atualizado com sucesso!');
      } else {
        await addLead(data);
        toast.success('Lead adicionado com sucesso!');
      }
      setIsLeadFormOpen(false);
      setEditingLead(null);
    } catch (error) {
      console.error('Erro ao salvar lead:', error);
    }
  };

  const handleEditLead = (lead: LeadCompra) => {
    setEditingLead(lead);
    setIsLeadFormOpen(true);
  };

  const handleDeleteLead = async (id: string) => {
    if (window.confirm('Tem certeza que deseja excluir este lead?')) {
      try {
        await deleteLead(id);
        toast.success('Lead removido com sucesso!');
      } catch (error) {
        console.error('Erro ao remover lead:', error);
      }
    }
  };

  const handleCancelLeadForm = () => {
    setIsLeadFormOpen(false);
    setEditingLead(null);
  };

  const handleClearLeadFilters = () => {
    setLeadFilters({
      tipo: 'Todos'
    });
    setLeadSearchTerm('');
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

      setShowImporter(false);
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
                <Button className="bg-blue-600 hover:bg-blue-700">
                  <Plus className="h-4 w-4 mr-2" />
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

            <Dialog open={isLeadFormOpen} onOpenChange={setIsLeadFormOpen}>
              <DialogTrigger asChild>
                <Button className="bg-green-600 hover:bg-green-700">
                  <Plus className="h-4 w-4 mr-2" />
                  Novo Lead
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>
                    {editingLead ? 'Editar Lead' : 'Novo Lead'}
                  </DialogTitle>
                </DialogHeader>
                <LeadCompraForm
                  leadCompra={editingLead || undefined}
                  onSubmit={handleSubmitLead}
                  onCancel={handleCancelLeadForm}
                  isLoading={leadsLoading || false}
                />
              </DialogContent>
            </Dialog>
          </div>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="dashboard" className="w-full">
          <TabsList className="grid w-full grid-cols-7">
            <TabsTrigger value="dashboard" className="flex items-center gap-2">
              <BarChart3 className="h-4 w-4" />
              {t('dashboard')}
            </TabsTrigger>
            <TabsTrigger value="campaigns" className="flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              {t('campaigns')}
            </TabsTrigger>
            <TabsTrigger value="leads" className="flex items-center gap-2">
              <Target className="h-4 w-4" />
              {t('leads')}
            </TabsTrigger>
            <TabsTrigger value="lead-dashboard" className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              {t('leadAnalytics')}
            </TabsTrigger>
            <TabsTrigger value="import" className="flex items-center gap-2">
              <Upload className="h-4 w-4" />
              {t('import')}
            </TabsTrigger>
            <TabsTrigger value="filters" className="flex items-center gap-2">
              <Filter className="h-4 w-4" />
              {t('filters')}
            </TabsTrigger>
            <TabsTrigger value="export" className="flex items-center gap-2">
              <Download className="h-4 w-4" />
              {t('export')}
            </TabsTrigger>
          </TabsList>

          {/* Dashboard */}
          <TabsContent value="dashboard" className="space-y-6">
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
          </TabsContent>

          {/* Lista de Campanhas */}
          <TabsContent value="campaigns" className="space-y-6">
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
            <div className="bg-blue-50 p-4 rounded-lg">
              <p className="text-sm text-blue-900">
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
                <p className="text-gray-600">
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

          {/* Lead Analytics Dashboard */}
          <TabsContent value="lead-dashboard" className="space-y-6">
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
          </TabsContent>

          {/* Importação */}
          <TabsContent value="import" className="space-y-6">
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

          {/* Filtros Dedicados */}
          <TabsContent value="filters" className="space-y-6">
            <CampaignFiltersComponent
              filters={filters}
              onFiltersChange={setFilters}
              onClearFilters={handleClearFilters}
            />
          </TabsContent>

          {/* Exportação */}
          <TabsContent value="export" className="space-y-6">
            <ExportManager campaigns={filteredCampaigns} />
          </TabsContent>

          {/* Leads */}
          <TabsContent value="leads" className="space-y-6">
            {/* Barra de busca e filtros para leads */}
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
              <div className="flex items-center justify-center py-8">
                <div className="text-gray-500">Carregando leads...</div>
              </div>
            ) : (
              <div className="grid gap-4">
                {filteredLeads.map((lead) => (
                  <Card key={lead.id} className="p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="font-semibold text-lg">{lead.nome}</h3>
                          <Badge variant={lead.tipo === 'Compra' ? 'default' : 'secondary'}>
                            {lead.tipo}
                          </Badge>
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
                          onClick={() => handleEditLead(lead)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDeleteLead(lead.id)}
                          className="text-red-600 hover:text-red-700"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            )}
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
