import { useState, useMemo } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from '@/components/ui/dialog';
import { Search, Filter, X, Edit, Trash2, Mail, Phone, MapPin, Users, Euro, Calendar, LayoutGrid, List, Plus } from 'lucide-react';
import { toast } from 'sonner';

import { useLeadCompra } from '@/hooks/useLeadCompra';
import { useLandingLeads } from '@/hooks/useLandingLeads';
import { LeadCompra, LeadCompraFilters } from '@/types/lead-compra';
import LeadKanbanBoard from '@/components/marketing/LeadKanbanBoard';
import LeadCompraForm from '@/components/lead-compra/LeadCompraForm';
import { LandingLeadForm } from '@/components/marketing/LandingLeadForm';

export default function ClientsLeadsTab() {
  const {
    leads,
    isLoading: leadsLoading,
    addLead,
    updateLead,
    deleteLead,
  } = useLeadCompra();

  const {
    addLead: addLandingLead,
    isLoading: landingLeadsLoading,
  } = useLandingLeads();

  const [activeTab, setActiveTab] = useState('kanban');
  const [isLeadFormOpen, setIsLeadFormOpen] = useState(false);
  const [editingLead, setEditingLead] = useState<LeadCompra | null>(null);
  const [leadSearchTerm, setLeadSearchTerm] = useState('');
  const [showLeadFilters, setShowLeadFilters] = useState(false);
  const [leadFilters, setLeadFilters] = useState<LeadCompraFilters>({
    tipo: 'Todos'
  });

  const filteredLeads = useMemo(() => {
    let filtered = leads || [];

    if (leadSearchTerm) {
      filtered = filtered.filter(lead =>
        lead.nome?.toLowerCase().includes(leadSearchTerm.toLowerCase()) ||
        lead.email?.toLowerCase().includes(leadSearchTerm.toLowerCase()) ||
        lead.telefone?.toLowerCase().includes(leadSearchTerm.toLowerCase()) ||
        lead.cidade?.toLowerCase().includes(leadSearchTerm.toLowerCase()) ||
        lead.origem_campanha?.toLowerCase().includes(leadSearchTerm.toLowerCase())
      );
    }

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

  const handleSubmitLead = async (data: Omit<LeadCompra, 'id' | 'created_at' | 'updated_at'>) => {
    try {
      const payloadToSave = { ...data };
      if (payloadToSave.email === '') payloadToSave.email = undefined;
      
      if (editingLead) {
        await updateLead(editingLead.id, payloadToSave);
        toast.success('Lead/Compra atualizado com sucesso!');
      } else {
        await addLead(payloadToSave);
        toast.success('Lead/Compra adicionado com sucesso!');
      }
      setIsLeadFormOpen(false);
      setEditingLead(null);
    } catch (error) {
      console.error('Erro ao salvar lead/compra:', error);
    }
  };

  const handleSubmitLandingLead = async (data: any) => {
    try {
      const payloadToSave = { ...data };
      if (payloadToSave.email === '') payloadToSave.email = undefined;
      if (payloadToSave.morada === '') payloadToSave.morada = undefined;
      if (payloadToSave.observacoes === '') payloadToSave.observacoes = undefined;

      await addLandingLead(payloadToSave);
      setIsLeadFormOpen(false);
    } catch (error) {
      console.error('Erro ao salvar lead kanban:', error);
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

  return (
    <div className="space-y-6 mt-6">
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
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

          <div className="flex items-center gap-4">
            <p className="text-sm text-gray-500 hidden sm:block">
              Leads da Landing Page com gestão visual
            </p>
            <Dialog open={isLeadFormOpen} onOpenChange={setIsLeadFormOpen}>
              <DialogTrigger asChild>
                <Button variant="outline" size="sm" className="gap-2">
                  <Plus className="h-4 w-4" />
                  Novo Lead
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>
                    {activeTab === 'kanban' ? 'Novo Lead (Kanban)' : (editingLead ? 'Editar Lead/Compra' : 'Novo Lead/Compra')}
                  </DialogTitle>
                  <DialogDescription className="sr-only">
                    Preencha o formulário para gerir o lead.
                  </DialogDescription>
                </DialogHeader>
                {activeTab === 'kanban' ? (
                  <LandingLeadForm
                    onSubmit={handleSubmitLandingLead}
                    onCancel={handleCancelLeadForm}
                    isLoading={landingLeadsLoading || false}
                  />
                ) : (
                  <LeadCompraForm
                    leadCompra={editingLead || undefined}
                    onSubmit={handleSubmitLead}
                    onCancel={handleCancelLeadForm}
                    isLoading={leadsLoading || false}
                  />
                )}
              </DialogContent>
            </Dialog>
          </div>
        </div>

        {/* Kanban View - Leads da Landing Page */}
        <TabsContent value="kanban" className="mt-4">
          <LeadKanbanBoard />
        </TabsContent>

        {/* Lista View - Leads tradicionais */}
        <TabsContent value="lista" className="space-y-4 mt-4">
          {/* Barra de busca e filtros para leads */}
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  placeholder="Pesquisar por nome, contacto ou email..."
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
}
