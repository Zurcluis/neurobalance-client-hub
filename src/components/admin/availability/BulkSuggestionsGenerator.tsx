import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Sparkles,
  Users,
  Search,
  Loader2,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Play,
  Filter,
} from 'lucide-react';
import { useAdminAvailabilityManagement } from '@/hooks/useAdminAvailabilityManagement';
import { useAdminAuth } from '@/hooks/useAdminAuth';
import { generateSuggestionsForClient } from '@/lib/suggestionAlgorithm';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { EmptyState } from '@/components/shared/EmptyState';

interface BulkGenerationResult {
  clienteId: number;
  clienteNome: string;
  status: 'pending' | 'success' | 'error' | 'skipped';
  suggestionsCount: number;
  error?: string;
}

export const BulkSuggestionsGenerator: React.FC = () => {
  const { admin } = useAdminAuth();
  const { clients, fetchClientsWithAvailability } = useAdminAvailabilityManagement();

  const [selectedClients, setSelectedClients] = useState<Set<number>>(new Set());
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'with-availability' | 'without-suggestions'>('all');
  const [isGenerating, setIsGenerating] = useState(false);
  const [progress, setProgress] = useState(0);
  const [results, setResults] = useState<BulkGenerationResult[]>([]);

  // Config
  const [daysAhead, setDaysAhead] = useState(14);
  const [maxSuggestionsPerClient, setMaxSuggestionsPerClient] = useState(5);

  // =====================================================
  // FILTER CLIENTS
  // =====================================================

  const filteredClients = clients.filter((client) => {
    // Search filter
    const matchesSearch =
      client.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
      client.email?.toLowerCase().includes(searchTerm.toLowerCase());

    // Status filter
    let matchesFilter = true;
    if (filterStatus === 'with-availability') {
      matchesFilter = client.disponibilidades_ativas > 0;
    } else if (filterStatus === 'without-suggestions') {
      matchesFilter = client.total_sugestoes === 0 && client.disponibilidades_ativas > 0;
    }

    return matchesSearch && matchesFilter;
  });

  // =====================================================
  // TOGGLE CLIENT SELECTION
  // =====================================================

  const toggleClientSelection = (clientId: number) => {
    const newSet = new Set(selectedClients);
    if (newSet.has(clientId)) {
      newSet.delete(clientId);
    } else {
      newSet.add(clientId);
    }
    setSelectedClients(newSet);
  };

  // =====================================================
  // SELECT ALL / DESELECT ALL
  // =====================================================

  const selectAll = () => {
    const newSet = new Set(filteredClients.map((c) => c.id));
    setSelectedClients(newSet);
  };

  const deselectAll = () => {
    setSelectedClients(new Set());
  };

  // =====================================================
  // GENERATE BULK SUGGESTIONS
  // =====================================================

  const handleGenerateBulk = async () => {
    if (!admin?.id) {
      toast.error('Não foi possível identificar o administrador');
      return;
    }

    if (selectedClients.size === 0) {
      toast.error('Selecione pelo menos um cliente');
      return;
    }

    setIsGenerating(true);
    setProgress(0);
    setResults([]);

    const clientsToProcess = Array.from(selectedClients);
    const totalClients = clientsToProcess.length;
    const generationResults: BulkGenerationResult[] = [];

    for (let i = 0; i < totalClients; i++) {
      const clientId = clientsToProcess[i];
      const client = clients.find((c) => c.id === clientId);

      if (!client) continue;

      try {
        // Verificar se cliente tem disponibilidade
        if (client.disponibilidades_ativas === 0) {
          generationResults.push({
            clienteId,
            clienteNome: client.nome,
            status: 'skipped',
            suggestionsCount: 0,
            error: 'Cliente sem disponibilidades ativas',
          });
          setProgress(((i + 1) / totalClients) * 100);
          setResults([...generationResults]);
          continue;
        }

        // Gerar sugestões
        const newSuggestions = await generateSuggestionsForClient(clientId, admin.id, {
          daysAhead,
          maxSuggestions: maxSuggestionsPerClient,
        });

        if (newSuggestions.length === 0) {
          generationResults.push({
            clienteId,
            clienteNome: client.nome,
            status: 'skipped',
            suggestionsCount: 0,
            error: 'Nenhuma sugestão disponível (sem gaps no calendário)',
          });
        } else {
          // Criar sugestões no banco de dados
          for (const { suggestion } of newSuggestions) {
            await supabase.from('suggested_appointments').insert(suggestion);
          }

          generationResults.push({
            clienteId,
            clienteNome: client.nome,
            status: 'success',
            suggestionsCount: newSuggestions.length,
          });
        }
      } catch (error) {
        console.error(`Error generating for client ${clientId}:`, error);
        generationResults.push({
          clienteId,
          clienteNome: client.nome,
          status: 'error',
          suggestionsCount: 0,
          error: error instanceof Error ? error.message : 'Erro desconhecido',
        });
      }

      setProgress(((i + 1) / totalClients) * 100);
      setResults([...generationResults]);
    }

    setIsGenerating(false);

    // Resumo
    const success = generationResults.filter((r) => r.status === 'success').length;
    const total = generationResults.reduce((sum, r) => sum + r.suggestionsCount, 0);

    if (success > 0) {
      toast.success(`✅ ${total} sugestões geradas para ${success} clientes!`);
    } else {
      toast.warning('Nenhuma sugestão foi gerada. Verifique os resultados.');
    }

    // Recarregar dados
    await fetchClientsWithAvailability();
  };

  // =====================================================
  // GET RESULT ICON
  // =====================================================

  const getResultIcon = (status: BulkGenerationResult['status']) => {
    switch (status) {
      case 'success':
        return <CheckCircle2 className="h-5 w-5 text-green-600" />;
      case 'error':
        return <XCircle className="h-5 w-5 text-red-600" />;
      case 'skipped':
        return <AlertCircle className="h-5 w-5 text-yellow-600" />;
      default:
        return <Loader2 className="h-5 w-5 text-gray-400 animate-spin" />;
    }
  };

  // =====================================================
  // RENDER
  // =====================================================

  return (
    <div className="space-y-6">
      {/* Configuration */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-[#3f9094]" />
            Gerador de Sugestões em Massa
          </CardTitle>
          <CardDescription>
            Gere sugestões de agendamentos para múltiplos clientes de uma só vez
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Config Options */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="daysAhead">Dias à Frente</Label>
              <Input
                id="daysAhead"
                type="number"
                value={daysAhead}
                onChange={(e) => setDaysAhead(parseInt(e.target.value) || 14)}
                min={7}
                max={60}
              />
              <p className="text-xs text-gray-500">Analisar próximos N dias</p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="maxSuggestions">Sugestões por Cliente</Label>
              <Input
                id="maxSuggestions"
                type="number"
                value={maxSuggestionsPerClient}
                onChange={(e) => setMaxSuggestionsPerClient(parseInt(e.target.value) || 5)}
                min={1}
                max={10}
              />
              <p className="text-xs text-gray-500">Máximo de sugestões geradas</p>
            </div>
          </div>

          <Separator />

          {/* Filters */}
          <div className="space-y-4">
            <div className="flex items-center gap-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                  <Input
                    placeholder="Buscar clientes..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>

              <Select value={filterStatus} onValueChange={(v: any) => setFilterStatus(v)}>
                <SelectTrigger className="w-[250px]">
                  <Filter className="h-4 w-4 mr-2" />
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os Clientes</SelectItem>
                  <SelectItem value="with-availability">Com Disponibilidade</SelectItem>
                  <SelectItem value="without-suggestions">Sem Sugestões</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center justify-between">
              <p className="text-sm text-gray-600">
                {selectedClients.size} de {filteredClients.length} clientes selecionados
              </p>
              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm" onClick={selectAll}>
                  Selecionar Todos
                </Button>
                <Button variant="outline" size="sm" onClick={deselectAll}>
                  Desmarcar Todos
                </Button>
              </div>
            </div>
          </div>

          {/* Client List */}
          {filteredClients.length === 0 ? (
            <EmptyState
              icon={<Users className="h-12 w-12" />}
              title="Nenhum Cliente Encontrado"
              description="Ajuste os filtros para ver mais clientes."
            />
          ) : (
            <ScrollArea className="h-[400px] border rounded-lg p-4">
              <div className="space-y-2">
                {filteredClients.map((client) => (
                  <div
                    key={client.id}
                    className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                  >
                    <Checkbox
                      checked={selectedClients.has(client.id)}
                      onCheckedChange={() => toggleClientSelection(client.id)}
                    />
                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate">{client.nome}</p>
                      <p className="text-sm text-gray-500 truncate">{client.email}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="text-xs">
                        {client.disponibilidades_ativas} disp.
                      </Badge>
                      <Badge variant="outline" className="text-xs">
                        {client.total_sugestoes} sugest.
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
          )}

          {/* Action Button */}
          <Button
            onClick={handleGenerateBulk}
            disabled={isGenerating || selectedClients.size === 0}
            className="w-full bg-gradient-to-r from-[#3f9094] to-[#2A5854] hover:opacity-90"
            size="lg"
          >
            {isGenerating ? (
              <>
                <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                Gerando... {progress.toFixed(0)}%
              </>
            ) : (
              <>
                <Play className="h-5 w-5 mr-2" />
                Gerar Sugestões ({selectedClients.size} {selectedClients.size === 1 ? 'cliente' : 'clientes'})
              </>
            )}
          </Button>

          {/* Progress Bar */}
          {isGenerating && (
            <div className="space-y-2">
              <Progress value={progress} className="w-full" />
              <p className="text-sm text-center text-gray-600">
                Processando {Math.ceil(progress / (100 / Array.from(selectedClients).length))} de{' '}
                {selectedClients.size} clientes
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Results */}
      {results.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Resultados</CardTitle>
            <CardDescription>
              Resumo da geração de sugestões para {results.length} clientes
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-[300px]">
              <div className="space-y-2">
                {results.map((result) => (
                  <div
                    key={result.clienteId}
                    className="flex items-start gap-3 p-3 rounded-lg border"
                  >
                    {getResultIcon(result.status)}
                    <div className="flex-1 min-w-0">
                      <p className="font-medium">{result.clienteNome}</p>
                      {result.status === 'success' && (
                        <p className="text-sm text-green-600">
                          ✅ {result.suggestionsCount} sugestões geradas
                        </p>
                      )}
                      {result.status === 'error' && (
                        <p className="text-sm text-red-600">❌ Erro: {result.error}</p>
                      )}
                      {result.status === 'skipped' && (
                        <p className="text-sm text-yellow-600">⚠️ {result.error}</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>

            {/* Summary */}
            <div className="mt-4 grid grid-cols-3 gap-4">
              <Card className="bg-green-50 dark:bg-green-950 border-green-200">
                <CardContent className="pt-4">
                  <p className="text-sm font-medium text-green-900 dark:text-green-100">
                    Sucesso
                  </p>
                  <p className="text-2xl font-bold text-green-900 dark:text-green-100">
                    {results.filter((r) => r.status === 'success').length}
                  </p>
                </CardContent>
              </Card>

              <Card className="bg-yellow-50 dark:bg-yellow-950 border-yellow-200">
                <CardContent className="pt-4">
                  <p className="text-sm font-medium text-yellow-900 dark:text-yellow-100">
                    Ignorados
                  </p>
                  <p className="text-2xl font-bold text-yellow-900 dark:text-yellow-100">
                    {results.filter((r) => r.status === 'skipped').length}
                  </p>
                </CardContent>
              </Card>

              <Card className="bg-red-50 dark:bg-red-950 border-red-200">
                <CardContent className="pt-4">
                  <p className="text-sm font-medium text-red-900 dark:text-red-100">Erros</p>
                  <p className="text-2xl font-bold text-red-900 dark:text-red-100">
                    {results.filter((r) => r.status === 'error').length}
                  </p>
                </CardContent>
              </Card>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

