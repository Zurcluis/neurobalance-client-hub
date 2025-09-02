import React, { useState, useMemo } from 'react';
import PageLayout from '@/components/layout/PageLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useMarketingCampaigns } from '@/hooks/useMarketingCampaigns';
import { MarketingCampaign, CampaignFilters } from '@/types/marketing';
import CampaignForm from '@/components/marketing/CampaignForm';
import CampaignCard from '@/components/marketing/CampaignCard';
import CampaignFiltersComponent from '@/components/marketing/CampaignFilters';
import MarketingDashboard from '@/components/marketing/MarketingDashboard';
import ExportManager from '@/components/marketing/ExportManager';
import FileImporter from '@/components/shared/FileImporter';
import { 
  Plus, 
  Search, 
  BarChart3, 
  Calendar, 
  Download,
  Filter,
  X,
  Upload
} from 'lucide-react';
import { toast } from 'sonner';

const MarketingReportsPage = () => {
  const {
    campaigns,
    isLoading,
    error,
    fetchCampaigns,
    addCampaign,
    updateCampaign,
    deleteCampaign,
    calculateMetrics
  } = useMarketingCampaigns();

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingCampaign, setEditingCampaign] = useState<MarketingCampaign | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState<CampaignFilters>({});
  const [showImporter, setShowImporter] = useState(false);

  // Filtrar campanhas baseado na busca e filtros
  const filteredCampaigns = useMemo(() => {
    let filtered = campaigns;

    // Aplicar busca por texto
    if (searchTerm) {
      filtered = filtered.filter(campaign =>
        campaign.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        campaign.origem.toLowerCase().includes(searchTerm.toLowerCase())
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

  const handleDataImported = async (data: any[], type: 'marketing' | 'lead-compra') => {
    if (type !== 'marketing') {
      toast.error('Dados importados não são do tipo Marketing');
      return;
    }

    let successCount = 0;
    for (const item of data) {
      try {
        await addCampaign(item);
        successCount++;
      } catch (error) {
        console.error('Erro ao importar campanha:', error);
      }
    }

    toast.success(`${successCount} campanhas importadas com sucesso!`);
  };

  if (error) {
    return (
      <PageLayout>
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <p className="text-red-600 mb-4">Erro ao carregar campanhas: {error}</p>
            <Button onClick={() => fetchCampaigns()}>Tentar Novamente</Button>
          </div>
        </div>
      </PageLayout>
    );
  }

  return (
    <PageLayout>
      <div className="space-y-6">
        {/* Cabeçalho */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Relatórios de Marketing</h1>
            <p className="text-gray-600">Gerencie e analise suas campanhas de marketing</p>
          </div>
          
          <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
            <DialogTrigger asChild>
              <Button className="bg-blue-600 hover:bg-blue-700">
                <Plus className="h-4 w-4 mr-2" />
                Nova Campanha
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
                isLoading={isLoading}
              />
            </DialogContent>
          </Dialog>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="dashboard" className="w-full">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="dashboard" className="flex items-center gap-2">
              <BarChart3 className="h-4 w-4" />
              Dashboard
            </TabsTrigger>
            <TabsTrigger value="campaigns" className="flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              Campanhas
            </TabsTrigger>
            <TabsTrigger value="import" className="flex items-center gap-2">
              <Upload className="h-4 w-4" />
              Importar
            </TabsTrigger>
            <TabsTrigger value="filters" className="flex items-center gap-2">
              <Filter className="h-4 w-4" />
              Filtros
            </TabsTrigger>
            <TabsTrigger value="export" className="flex items-center gap-2">
              <Download className="h-4 w-4" />
              Exportar
            </TabsTrigger>
          </TabsList>

          {/* Dashboard */}
          <TabsContent value="dashboard" className="space-y-6">
            <MarketingDashboard campaigns={filteredCampaigns} metrics={metrics} />
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
            {isLoading ? (
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

          {/* Importação */}
          <TabsContent value="import" className="space-y-6">
            <FileImporter
              onDataImported={handleDataImported}
              expectedType="marketing"
              title="Importar Campanhas de Marketing"
              description="Importe campanhas de marketing de arquivos Excel, Word ou PDF"
            />
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
        </Tabs>
      </div>
    </PageLayout>
  );
};

export default MarketingReportsPage;
