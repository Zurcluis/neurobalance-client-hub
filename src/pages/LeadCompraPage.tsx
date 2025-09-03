import React, { useState, useMemo } from 'react';
import PageLayout from '@/components/layout/PageLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useLeadCompra } from '@/hooks/useLeadCompra';
import { LeadCompra, LeadCompraFilters } from '@/types/lead-compra';
import LeadCompraForm from '@/components/lead-compra/LeadCompraForm';
import LeadCompraDashboard from '@/components/lead-compra/LeadCompraDashboard';
import ImportManager from '@/components/lead-compra/ImportManager';
import FileImporter from '@/components/shared/FileImporter';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  Plus, 
  Search, 
  BarChart3, 
  Upload,
  Filter,
  X,
  Edit,
  Trash2,
  Users,
  Target,
  Euro,
  Calendar,
  Mail,
  Phone,
  MapPin
} from 'lucide-react';
import { toast } from 'sonner';

const LeadCompraPage = () => {
  const {
    leads,
    statistics,
    isLoading,
    error,
    fetchLeads,
    addLead,
    updateLead,
    deleteLead,
    importLeads
  } = useLeadCompra();

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingLead, setEditingLead] = useState<LeadCompra | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState<LeadCompraFilters>({});
  const [showImporter, setShowImporter] = useState(false);

  // Filtrar leads baseado na busca e filtros
  const filteredLeads = useMemo(() => {
    let filtered = leads;

    // Aplicar busca por texto
    if (searchTerm) {
      filtered = filtered.filter(lead =>
        lead.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
        lead.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        lead.cidade.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Aplicar filtros
    if (filters.tipo && filters.tipo !== 'Todos') {
      filtered = filtered.filter(lead => lead.tipo === filters.tipo);
    }

    if (filters.genero) {
      filtered = filtered.filter(lead => lead.genero === filters.genero);
    }

    if (filters.cidade) {
      filtered = filtered.filter(lead => lead.cidade === filters.cidade);
    }

    if (filters.valorMinimo !== undefined) {
      filtered = filtered.filter(lead => lead.valor_pago >= filters.valorMinimo!);
    }

    if (filters.valorMaximo !== undefined) {
      filtered = filtered.filter(lead => lead.valor_pago <= filters.valorMaximo!);
    }

    if (filters.dataInicio) {
      filtered = filtered.filter(lead => lead.data_evento >= filters.dataInicio!);
    }

    if (filters.dataFim) {
      filtered = filtered.filter(lead => lead.data_evento <= filters.dataFim!);
    }

    // Aplicar ordenação
    if (filters.ordenarPor) {
      filtered.sort((a, b) => {
        let valueA: any, valueB: any;

        switch (filters.ordenarPor) {
          case 'nome':
            valueA = a.nome.toLowerCase();
            valueB = b.nome.toLowerCase();
            break;
          case 'data_evento':
            valueA = new Date(a.data_evento);
            valueB = new Date(b.data_evento);
            break;
          case 'valor_pago':
            valueA = a.valor_pago;
            valueB = b.valor_pago;
            break;
          case 'idade':
            valueA = a.idade;
            valueB = b.idade;
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
  }, [leads, searchTerm, filters]);

  const handleSubmitLead = async (data: any) => {
    try {
      if (editingLead) {
        await updateLead(editingLead.id, data);
        toast.success('Lead/Compra atualizado com sucesso!');
      } else {
        await addLead(data);
        toast.success('Lead/Compra adicionado com sucesso!');
      }
      setIsFormOpen(false);
      setEditingLead(null);
    } catch (error) {
      console.error('Erro ao salvar lead:', error);
    }
  };

  const handleEditLead = (lead: LeadCompra) => {
    setEditingLead(lead);
    setIsFormOpen(true);
  };

  const handleDeleteLead = async (id: string, nome: string) => {
    if (window.confirm(`Tem certeza que deseja excluir o registo de ${nome}?`)) {
      try {
        await deleteLead(id);
        toast.success('Registo removido com sucesso!');
      } catch (error) {
        console.error('Erro ao remover lead:', error);
      }
    }
  };

  const handleDataImported = async (data: any[], type: 'marketing' | 'lead-compra') => {
    if (type !== 'lead-compra') {
      toast.error('Dados importados não são do tipo Lead Compra');
      return;
    }

    let successCount = 0;
    for (const item of data) {
      try {
        await addLead(item);
        successCount++;
      } catch (error) {
        console.error('Erro ao importar lead:', error);
      }
    }

    toast.success(`${successCount} registos importados com sucesso!`);
  };

  const handleCancelForm = () => {
    setIsFormOpen(false);
    setEditingLead(null);
  };

  const handleClearFilters = () => {
    setFilters({});
    setSearchTerm('');
  };

  const updateFilter = (key: keyof LeadCompraFilters, value: any) => {
    setFilters(prev => ({
      ...prev,
      [key]: value || undefined
    }));
  };

  if (error) {
    return (
      <PageLayout>
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <p className="text-red-600 mb-4">Erro ao carregar dados: {error}</p>
            <Button onClick={() => fetchLeads()}>Tentar Novamente</Button>
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
            <h1 className="text-3xl font-bold text-gray-900">Lead Compra - NeuroBalance</h1>
            <p className="text-gray-600">Gestão completa de leads e conversões</p>
          </div>
          
          <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
            <DialogTrigger asChild>
              <Button className="bg-blue-600 hover:bg-blue-700">
                <Plus className="h-4 w-4 mr-2" />
                Novo Registo
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>
                  {editingLead ? 'Editar Lead/Compra' : 'Novo Lead/Compra'}
                </DialogTitle>
              </DialogHeader>
              <LeadCompraForm
                leadCompra={editingLead || undefined}
                onSubmit={handleSubmitLead}
                onCancel={handleCancelForm}
                isLoading={isLoading}
              />
            </DialogContent>
          </Dialog>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="dashboard" className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="dashboard" className="flex items-center gap-2">
              <BarChart3 className="h-4 w-4" />
              Dashboard
            </TabsTrigger>
            <TabsTrigger value="leads" className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              Registos
            </TabsTrigger>
            <TabsTrigger value="import" className="flex items-center gap-2">
              <Upload className="h-4 w-4" />
              Importar
            </TabsTrigger>
            <TabsTrigger value="filters" className="flex items-center gap-2">
              <Filter className="h-4 w-4" />
              Filtros
            </TabsTrigger>
          </TabsList>

          {/* Dashboard */}
          <TabsContent value="dashboard" className="space-y-6">
            {statistics ? (
              <LeadCompraDashboard statistics={statistics} />
            ) : (
              <div className="text-center py-8">
                <Target className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600">Carregando estatísticas...</p>
              </div>
            )}
          </TabsContent>

          {/* Lista de Leads */}
          <TabsContent value="leads" className="space-y-6">
            {/* Barra de Busca */}
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  placeholder="Buscar por nome, email ou cidade..."
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
              <Card>
                <CardHeader>
                  <CardTitle>Filtros Avançados</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Tipo</label>
                      <Select
                        value={filters.tipo || 'Todos'}
                        onValueChange={(value) => updateFilter('tipo', value === 'Todos' ? undefined : value)}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Todos">Todos</SelectItem>
                          <SelectItem value="Lead">Apenas Leads</SelectItem>
                          <SelectItem value="Compra">Apenas Compras</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <label className="text-sm font-medium">Valor Mínimo (€)</label>
                      <Input
                        type="number"
                        placeholder="0"
                        value={filters.valorMinimo || ''}
                        onChange={(e) => updateFilter('valorMinimo', e.target.value ? parseFloat(e.target.value) : undefined)}
                      />
                    </div>

                    <div className="space-y-2">
                      <label className="text-sm font-medium">Valor Máximo (€)</label>
                      <Input
                        type="number"
                        placeholder="1000"
                        value={filters.valorMaximo || ''}
                        onChange={(e) => updateFilter('valorMaximo', e.target.value ? parseFloat(e.target.value) : undefined)}
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Resumo */}
            <div className="bg-blue-50 p-4 rounded-lg">
              <p className="text-sm text-blue-900">
                Mostrando <strong>{filteredLeads.length}</strong> de <strong>{leads.length}</strong> registos
                {(searchTerm || Object.keys(filters).length > 0) && ' (filtrados)'}
              </p>
            </div>

            {/* Lista de Leads */}
            {isLoading ? (
              <div className="flex justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              </div>
            ) : filteredLeads.length === 0 ? (
              <div className="text-center py-8">
                <Target className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600">
                  {leads.length === 0 
                    ? 'Nenhum registo encontrado.' 
                    : 'Nenhum registo corresponde aos filtros aplicados.'
                  }
                </p>
                {leads.length === 0 && (
                  <Button 
                    className="mt-4" 
                    onClick={() => setIsFormOpen(true)}
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Criar Primeiro Registo
                  </Button>
                )}
              </div>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
                {filteredLeads.map((lead) => (
                  <Card key={lead.id} className="hover:shadow-lg transition-shadow">
                    <CardHeader className="pb-3">
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <h3 className="font-semibold text-gray-900">{lead.nome}</h3>
                          <div className="flex items-center gap-2 mt-1">
                            <Badge 
                              className={lead.tipo === 'Compra' ? 'bg-green-100 text-green-800' : 'bg-orange-100 text-orange-800'}
                            >
                              {lead.tipo}
                            </Badge>
                            {lead.valor_pago > 0 && (
                              <span className="text-sm font-medium text-green-600">
                                €{lead.valor_pago.toFixed(2)}
                              </span>
                            )}
                          </div>
                        </div>
                        <div className="flex gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleEditLead(lead)}
                            className="h-8 w-8 p-0"
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDeleteLead(lead.id, lead.nome)}
                            className="h-8 w-8 p-0 text-red-600 hover:text-red-700"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="pt-0">
                      <div className="space-y-2 text-sm">
                        <div className="flex items-center gap-2">
                          <Mail className="h-3 w-3 text-gray-400" />
                          <span className="text-gray-600">{lead.email}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Phone className="h-3 w-3 text-gray-400" />
                          <span className="text-gray-600">{lead.telefone}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <MapPin className="h-3 w-3 text-gray-400" />
                          <span className="text-gray-600">{lead.cidade}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Calendar className="h-3 w-3 text-gray-400" />
                          <span className="text-gray-600">
                            {new Date(lead.data_evento).toLocaleDateString('pt-PT')}
                          </span>
                        </div>
                        {lead.origem_campanha && (
                          <div className="text-xs text-gray-500 mt-2">
                            Origem: {lead.origem_campanha}
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          {/* Importação */}
          <TabsContent value="import" className="space-y-6">
            <FileImporter
              onDataImported={handleDataImported}
              expectedType="lead-compra"
              title="Importar Dados de Lead Compra"
              description="Importe dados de leads e compras de arquivos Excel, Word ou PDF"
            />
            <div className="mt-6">
              <ImportManager onImport={importLeads} />
            </div>
          </TabsContent>

          {/* Filtros Dedicados */}
          <TabsContent value="filters" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Filtros Avançados</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label>Tipo</Label>
                    <Select
                      value={filters.tipo || 'Todos'}
                      onValueChange={(value) => updateFilter('tipo', value === 'Todos' ? undefined : value)}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Todos">Todos</SelectItem>
                        <SelectItem value="Lead">Apenas Leads</SelectItem>
                        <SelectItem value="Compra">Apenas Compras</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label>Data Início</Label>
                    <Input
                      type="date"
                      value={filters.dataInicio || ''}
                      onChange={(e) => updateFilter('dataInicio', e.target.value)}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Data Fim</Label>
                    <Input
                      type="date"
                      value={filters.dataFim || ''}
                      onChange={(e) => updateFilter('dataFim', e.target.value)}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Valor Mínimo (€)</Label>
                    <Input
                      type="number"
                      placeholder="0"
                      value={filters.valorMinimo || ''}
                      onChange={(e) => updateFilter('valorMinimo', e.target.value ? parseFloat(e.target.value) : undefined)}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Valor Máximo (€)</Label>
                    <Input
                      type="number"
                      placeholder="1000"
                      value={filters.valorMaximo || ''}
                      onChange={(e) => updateFilter('valorMaximo', e.target.value ? parseFloat(e.target.value) : undefined)}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Ordenar Por</Label>
                    <Select
                      value={filters.ordenarPor || 'data'}
                      onValueChange={(value) => updateFilter('ordenarPor', value === 'data' ? undefined : value)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Data (mais recente)" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="data">Data (mais recente)</SelectItem>
                        <SelectItem value="nome">Nome</SelectItem>
                        <SelectItem value="idade">Idade</SelectItem>
                        <SelectItem value="valor_pago">Valor Pago</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <Button onClick={handleClearFilters} variant="outline" className="w-full">
                  <X className="h-4 w-4 mr-2" />
                  Limpar Todos os Filtros
                </Button>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </PageLayout>
  );
};

export default LeadCompraPage;
