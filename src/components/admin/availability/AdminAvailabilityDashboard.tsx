import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Users,
  Calendar,
  CheckCircle2,
  Clock,
  TrendingUp,
  Search,
  Eye,
  RefreshCw,
  Trash2,
  AlertCircle,
  Activity,
} from 'lucide-react';
import { useAdminAvailabilityManagement } from '@/hooks/useAdminAvailabilityManagement';
import { LoadingSpinner } from '@/components/shared/LoadingSpinner';
import { EmptyState } from '@/components/shared/EmptyState';
import { format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import type { ClientAvailability, SuggestedAppointment } from '@/types/availability';

const DIAS_SEMANA = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'];

export const AdminAvailabilityDashboard: React.FC = () => {
  const {
    clients,
    overview,
    isLoading,
    fetchClientsWithAvailability,
    getClientAvailabilities,
    getClientSuggestions,
    bulkDeleteExpiredSuggestions,
  } = useAdminAvailabilityManagement();

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedClient, setSelectedClient] = useState<number | null>(null);
  const [clientDetails, setClientDetails] = useState<{
    availabilities: ClientAvailability[];
    suggestions: SuggestedAppointment[];
  } | null>(null);
  const [isDetailsDialogOpen, setIsDetailsDialogOpen] = useState(false);
  const [isLoadingDetails, setIsLoadingDetails] = useState(false);

  // =====================================================
  // FILTER CLIENTS
  // =====================================================

  const filteredClients = clients.filter(
    (client) =>
      client.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
      client.email?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // =====================================================
  // HANDLE VIEW DETAILS
  // =====================================================

  const handleViewDetails = async (clientId: number) => {
    setSelectedClient(clientId);
    setIsDetailsDialogOpen(true);
    setIsLoadingDetails(true);

    try {
      const [availabilities, suggestions] = await Promise.all([
        getClientAvailabilities(clientId),
        getClientSuggestions(clientId),
      ]);

      setClientDetails({ availabilities, suggestions });
    } catch (error) {
      console.error('Error loading client details:', error);
    } finally {
      setIsLoadingDetails(false);
    }
  };

  // =====================================================
  // GET STATUS BADGE
  // =====================================================

  const getStatusBadge = (client: typeof clients[0]) => {
    if (client.disponibilidades_ativas === 0) {
      return (
        <Badge variant="secondary" className="bg-gray-100 text-gray-800">
          Sem Disponibilidade
        </Badge>
      );
    }

    if (client.sugestoes_pendentes > 0) {
      return (
        <Badge variant="default" className="bg-blue-100 text-blue-800">
          {client.sugestoes_pendentes} Sugestões Pendentes
        </Badge>
      );
    }

    return (
      <Badge variant="default" className="bg-green-100 text-green-800">
        Configurado
      </Badge>
    );
  };

  // =====================================================
  // RENDER OVERVIEW CARDS
  // =====================================================

  const renderOverviewCards = () => {
    if (!overview) return null;

    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <Card className="border-l-4 border-l-[#3f9094]">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-700">Total de Clientes</CardTitle>
            <Users className="h-5 w-5 text-[#3f9094]" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{overview.total_clientes}</div>
            <p className="text-xs text-gray-500 mt-1">
              {overview.clientes_com_disponibilidade} com disponibilidade
            </p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-blue-500">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-700">Disponibilidades</CardTitle>
            <Calendar className="h-5 w-5 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{overview.total_disponibilidades}</div>
            <p className="text-xs text-gray-500 mt-1">
              {overview.disponibilidades_ativas} ativas
            </p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-green-500">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-700">Sugestões</CardTitle>
            <Activity className="h-5 w-5 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{overview.total_sugestoes}</div>
            <p className="text-xs text-gray-500 mt-1">
              {overview.sugestoes_pendentes} pendentes, {overview.sugestoes_aceitas} aceitas
            </p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-purple-500">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-700">Taxa de Aceitação</CardTitle>
            <TrendingUp className="h-5 w-5 text-purple-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{overview.taxa_aceitacao_geral.toFixed(1)}%</div>
            <p className="text-xs text-gray-500 mt-1">Média geral</p>
          </CardContent>
        </Card>
      </div>
    );
  };

  // =====================================================
  // RENDER
  // =====================================================

  if (isLoading && clients.length === 0) {
    return (
      <Card>
        <CardContent className="py-12">
          <LoadingSpinner />
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {renderOverviewCards()}

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Gerenciamento de Disponibilidades</CardTitle>
              <CardDescription>
                Visualize e gerencie as disponibilidades de todos os clientes
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={bulkDeleteExpiredSuggestions}
                disabled={isLoading}
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Limpar Expiradas
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={fetchClientsWithAvailability}
                disabled={isLoading}
              >
                <RefreshCw className={cn('h-4 w-4', isLoading && 'animate-spin')} />
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {/* Search */}
          <div className="mb-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                placeholder="Buscar por nome ou email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>

          {/* Table */}
          {filteredClients.length === 0 ? (
            <EmptyState
              icon={<Users className="h-12 w-12" />}
              title="Nenhum Cliente Encontrado"
              description={
                searchTerm
                  ? 'Nenhum cliente corresponde à sua busca.'
                  : 'Nenhum cliente cadastrado no sistema.'
              }
            />
          ) : (
            <div className="border rounded-lg">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Cliente</TableHead>
                    <TableHead>Contato</TableHead>
                    <TableHead>Disponibilidades</TableHead>
                    <TableHead>Sugestões</TableHead>
                    <TableHead>Taxa de Aceitação</TableHead>
                    <TableHead>Última Atualização</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredClients.map((client) => (
                    <TableRow key={client.id}>
                      <TableCell className="font-medium">{client.nome}</TableCell>
                      <TableCell>
                        <div className="text-sm">
                          {client.email && <div>{client.email}</div>}
                          {client.telefone && <div className="text-gray-500">{client.telefone}</div>}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">
                          <div className="font-medium">
                            {client.total_disponibilidades} total
                          </div>
                          <div className="text-gray-500">
                            {client.disponibilidades_ativas} ativas
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">
                          <div className="font-medium">{client.total_sugestoes} total</div>
                          <div className="text-gray-500">
                            {client.sugestoes_pendentes} pendentes
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={client.taxa_aceitacao >= 50 ? 'default' : 'secondary'}
                          className={
                            client.taxa_aceitacao >= 50
                              ? 'bg-green-100 text-green-800'
                              : 'bg-gray-100 text-gray-800'
                          }
                        >
                          {client.taxa_aceitacao.toFixed(0)}%
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {client.ultima_atualizacao ? (
                          <span className="text-sm text-gray-600">
                            {format(parseISO(client.ultima_atualizacao), 'dd/MM/yyyy', {
                              locale: ptBR,
                            })}
                          </span>
                        ) : (
                          <span className="text-sm text-gray-400">N/A</span>
                        )}
                      </TableCell>
                      <TableCell>{getStatusBadge(client)}</TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleViewDetails(client.id)}
                        >
                          <Eye className="h-4 w-4 mr-2" />
                          Ver Detalhes
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Details Dialog */}
      <Dialog open={isDetailsDialogOpen} onOpenChange={setIsDetailsDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              Detalhes de Disponibilidade -{' '}
              {clients.find((c) => c.id === selectedClient)?.nome}
            </DialogTitle>
            <DialogDescription>
              Visualize todas as disponibilidades e sugestões deste cliente
            </DialogDescription>
          </DialogHeader>

          {isLoadingDetails ? (
            <LoadingSpinner />
          ) : clientDetails ? (
            <div className="space-y-6">
              {/* Availabilities */}
              <div>
                <h3 className="font-semibold mb-3 flex items-center gap-2">
                  <Calendar className="h-5 w-5 text-[#3f9094]" />
                  Disponibilidades ({clientDetails.availabilities.length})
                </h3>
                {clientDetails.availabilities.length === 0 ? (
                  <EmptyState
                    icon={<Clock className="h-8 w-8" />}
                    title="Sem Disponibilidades"
                    description="Este cliente ainda não configurou suas disponibilidades."
                  />
                ) : (
                  <div className="space-y-2">
                    {clientDetails.availabilities.map((avail) => (
                      <Card key={avail.id} className="p-3">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <span className="font-medium">
                                {DIAS_SEMANA[avail.dia_semana]}
                              </span>
                              <Badge
                                variant={avail.status === 'ativo' ? 'default' : 'secondary'}
                              >
                                {avail.status}
                              </Badge>
                            </div>
                            <div className="text-sm text-gray-600">
                              {avail.hora_inicio} - {avail.hora_fim}
                            </div>
                            <div className="text-xs text-gray-500 mt-1">
                              Preferência: <strong>{avail.preferencia}</strong>
                            </div>
                          </div>
                        </div>
                      </Card>
                    ))}
                  </div>
                )}
              </div>

              {/* Suggestions */}
              <div>
                <h3 className="font-semibold mb-3 flex items-center gap-2">
                  <Activity className="h-5 w-5 text-green-600" />
                  Sugestões ({clientDetails.suggestions.length})
                </h3>
                {clientDetails.suggestions.length === 0 ? (
                  <EmptyState
                    icon={<AlertCircle className="h-8 w-8" />}
                    title="Sem Sugestões"
                    description="Nenhuma sugestão foi gerada para este cliente ainda."
                  />
                ) : (
                  <div className="space-y-2 max-h-[300px] overflow-y-auto">
                    {clientDetails.suggestions.map((sugg) => (
                      <Card key={sugg.id} className="p-3">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <span className="font-medium">
                                {format(parseISO(sugg.data_sugerida), 'dd/MM/yyyy', {
                                  locale: ptBR,
                                })}
                              </span>
                              <Badge
                                variant={
                                  sugg.status === 'aceita'
                                    ? 'default'
                                    : sugg.status === 'pendente'
                                    ? 'secondary'
                                    : 'outline'
                                }
                              >
                                {sugg.status}
                              </Badge>
                              <Badge variant="outline">
                                {sugg.compatibilidade_score}% Match
                              </Badge>
                            </div>
                            <div className="text-sm text-gray-600">
                              {sugg.hora_inicio} - {sugg.hora_fim}
                            </div>
                          </div>
                        </div>
                      </Card>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ) : null}
        </DialogContent>
      </Dialog>
    </div>
  );
};

