import React, { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useEligibleClients } from '@/hooks/useEligibleClients';
import { EligibleClient, ClientFilter } from '@/types/email-sms-campaign';
import { Search, Users, Mail, Phone, CheckCircle2, AlertCircle } from 'lucide-react';
import { LoadingSpinner } from '@/components/shared/LoadingSpinner';
import { EmptyState } from '@/components/shared/EmptyState';

interface EligibleClientsSelectorProps {
  onSelectionChange: (selectedIds: number[]) => void;
  initialSelection?: number[];
  filters?: ClientFilter;
}

export const EligibleClientsSelector: React.FC<EligibleClientsSelectorProps> = ({
  onSelectionChange,
  initialSelection = [],
  filters,
}) => {
  const { fetchEligibleClients, getClientsByCategory, isLoading } = useEligibleClients();
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set(initialSelection));
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState<'all' | 'avaliacao' | 'contato' | 'mensagem'>('all');
  const [clients, setClients] = useState<EligibleClient[]>([]);
  const [categoryClients, setCategoryClients] = useState<{
    avaliacao_sem_continuar: EligibleClient[];
    contato_sem_agendamento: EligibleClient[];
    mensagem_sem_resposta: EligibleClient[];
  }>({
    avaliacao_sem_continuar: [],
    contato_sem_agendamento: [],
    mensagem_sem_resposta: [],
  });

  useEffect(() => {
    const loadClients = async () => {
      if (filters) {
        const filtered = await fetchEligibleClients(filters);
        setClients(filtered);
      } else {
        const categories = await getClientsByCategory();
        setCategoryClients(categories);
        
        // Remove duplicate clients using a Map (by client ID)
        const uniqueClientsMap = new Map<number, EligibleClient>();
        [
          ...categories.avaliacao_sem_continuar,
          ...categories.contato_sem_agendamento,
          ...categories.mensagem_sem_resposta,
        ].forEach(client => {
          if (!uniqueClientsMap.has(client.id)) {
            uniqueClientsMap.set(client.id, client);
          }
        });
        
        setClients(Array.from(uniqueClientsMap.values()));
      }
    };

    loadClients();
  }, [filters, fetchEligibleClients, getClientsByCategory]);

  useEffect(() => {
    setSelectedIds(new Set(initialSelection));
  }, [initialSelection]);

  const currentClients = useMemo(() => {
    let filtered = clients;

    if (activeTab === 'avaliacao') {
      filtered = categoryClients.avaliacao_sem_continuar;
    } else if (activeTab === 'contato') {
      filtered = categoryClients.contato_sem_agendamento;
    } else if (activeTab === 'mensagem') {
      filtered = categoryClients.mensagem_sem_resposta;
    }

    if (searchTerm) {
      filtered = filtered.filter(
        (client) =>
          client.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
          client.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          client.telefone?.includes(searchTerm)
      );
    }

    return filtered;
  }, [clients, categoryClients, activeTab, searchTerm]);

  const handleToggleSelection = (clientId: number) => {
    const newSelection = new Set(selectedIds);
    if (newSelection.has(clientId)) {
      newSelection.delete(clientId);
    } else {
      newSelection.add(clientId);
    }
    setSelectedIds(newSelection);
    onSelectionChange(Array.from(newSelection));
  };

  const handleSelectAll = () => {
    const allIds = new Set(currentClients.map((c) => c.id));
    setSelectedIds(allIds);
    onSelectionChange(Array.from(allIds));
  };

  const handleDeselectAll = () => {
    setSelectedIds(new Set());
    onSelectionChange([]);
  };

  const getStatusBadge = (client: EligibleClient) => {
    if (client.estado === 'thinking') return <Badge variant="outline">Pensando</Badge>;
    if (client.estado === 'no-need') return <Badge variant="secondary">Sem Necessidade</Badge>;
    if (client.estado === 'desistiu') return <Badge variant="destructive">Desistiu</Badge>;
    return null;
  };

  const getContactTypeBadge = (client: EligibleClient) => {
    if (client.tipo_contato === 'Lead') return <Badge variant="default">Lead</Badge>;
    if (client.tipo_contato === 'Contato') return <Badge variant="default">Contato</Badge>;
    if (client.tipo_contato === 'Email') return <Badge variant="default">Email</Badge>;
    return null;
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-8">
          <LoadingSpinner />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Selecionar Clientes</CardTitle>
            <CardDescription>
              {selectedIds.size > 0
                ? `${selectedIds.size} cliente(s) selecionado(s)`
                : 'Selecione os clientes para a campanha'}
            </CardDescription>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={handleSelectAll}>
              Selecionar Todos
            </Button>
            <Button variant="outline" size="sm" onClick={handleDeselectAll}>
              Desmarcar Todos
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
          <Input
            placeholder="Buscar clientes..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>

        {!filters && (
          <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as typeof activeTab)}>
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="all">Todos ({clients.length})</TabsTrigger>
              <TabsTrigger value="avaliacao">
                Avaliação ({categoryClients.avaliacao_sem_continuar.length})
              </TabsTrigger>
              <TabsTrigger value="contato">
                Contato ({categoryClients.contato_sem_agendamento.length})
              </TabsTrigger>
              <TabsTrigger value="mensagem">
                Mensagem ({categoryClients.mensagem_sem_resposta.length})
              </TabsTrigger>
            </TabsList>
          </Tabs>
        )}

        {currentClients.length === 0 ? (
          <EmptyState
            icon={<Users className="h-12 w-12" />}
            title="Nenhum cliente encontrado"
            description={
              searchTerm
                ? 'Nenhum cliente corresponde à sua busca.'
                : 'Não há clientes elegíveis para esta categoria.'
            }
          />
        ) : (
          <div className="space-y-2 max-h-[400px] overflow-y-auto">
            {currentClients.map((client) => (
              <div
                key={client.id}
                className={`flex items-start gap-3 p-3 rounded-lg border transition-colors ${
                  selectedIds.has(client.id)
                    ? 'bg-blue-50 border-blue-200 dark:bg-blue-950 dark:border-blue-800'
                    : 'hover:bg-gray-50 dark:hover:bg-gray-800'
                }`}
              >
                <Checkbox
                  checked={selectedIds.has(client.id)}
                  onCheckedChange={() => handleToggleSelection(client.id)}
                  className="mt-1"
                />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-medium">{client.nome}</span>
                    {getStatusBadge(client)}
                    {getContactTypeBadge(client)}
                  </div>
                  <div className="flex flex-wrap gap-3 text-sm text-gray-600 dark:text-gray-400">
                    {client.email && (
                      <div className="flex items-center gap-1">
                        <Mail className="h-3 w-3" />
                        <span className="truncate">{client.email}</span>
                      </div>
                    )}
                    {client.telefone && (
                      <div className="flex items-center gap-1">
                        <Phone className="h-3 w-3" />
                        <span>{client.telefone}</span>
                      </div>
                    )}
                  </div>
                </div>
                {selectedIds.has(client.id) && (
                  <CheckCircle2 className="h-5 w-5 text-blue-600 flex-shrink-0" />
                )}
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

