import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useClientAvailability } from '@/hooks/useClientAvailability';
import { 
  Calendar, 
  Clock, 
  Plus, 
  TrendingUp, 
  AlertCircle, 
  CheckCircle2,
  Sparkles
} from 'lucide-react';
import { DIAS_SEMANA } from '@/types/availability';
import { AvailabilityForm } from './AvailabilityForm';
import { AvailabilityList } from './AvailabilityList';
import { AvailabilityStats } from './AvailabilityStats';
import { SuggestedAppointmentsList } from './SuggestedAppointmentsList';

interface ClientAvailabilityManagerProps {
  clienteId: number;
  className?: string;
}

export const ClientAvailabilityManager: React.FC<ClientAvailabilityManagerProps> = ({
  clienteId,
  className = '',
}) => {
  const [activeTab, setActiveTab] = useState<'manage' | 'suggestions'>('manage');
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  const {
    availabilities,
    isLoading,
    statistics,
    addAvailability,
    updateAvailability,
    deleteAvailability,
    toggleStatus,
  } = useClientAvailability(clienteId);

  const handleAdd = () => {
    setEditingId(null);
    setIsFormOpen(true);
  };

  const handleEdit = (id: string) => {
    setEditingId(id);
    setIsFormOpen(true);
  };

  const handleFormClose = () => {
    setIsFormOpen(false);
    setEditingId(null);
  };

  const editingAvailability = editingId
    ? availabilities.find((a) => a.id === editingId)
    : null;

  // Verificar se cliente tem disponibilidades
  const hasAvailabilities = availabilities.length > 0;
  const hasActiveAvailabilities = statistics.horarios_ativos > 0;

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header com Alerta */}
      <Card className="border-l-4 border-l-[#3f9094]">
        <CardHeader>
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <CardTitle className="text-2xl flex items-center gap-2">
                <Calendar className="h-6 w-6 text-[#3f9094]" />
                Minha Disponibilidade de Horários
              </CardTitle>
              <CardDescription className="mt-2">
                Defina quando você está disponível para sessões e receba sugestões automáticas de agendamentos
              </CardDescription>
            </div>
            
            {!hasActiveAvailabilities && (
              <Badge variant="outline" className="flex items-center gap-1 text-orange-600 border-orange-300">
                <AlertCircle className="h-3 w-3" />
                Sem horários ativos
              </Badge>
            )}
          </div>
        </CardHeader>

        {!hasAvailabilities && (
          <CardContent>
            <div className="bg-gradient-to-r from-blue-50 to-cyan-50 dark:from-blue-950 dark:to-cyan-950 p-6 rounded-lg border border-blue-200 dark:border-blue-800">
              <div className="flex items-start gap-4">
                <div className="p-3 bg-blue-100 dark:bg-blue-900 rounded-full">
                  <Sparkles className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-blue-900 dark:text-blue-100 mb-2">
                    🎯 Comece definindo sua disponibilidade!
                  </h3>
                  <p className="text-sm text-blue-800 dark:text-blue-200 mb-4">
                    Informe os dias e horários em que você está disponível para sessões. 
                    Com isso, nosso sistema poderá sugerir automaticamente os melhores horários para você!
                  </p>
                  <Button 
                    onClick={handleAdd}
                    className="bg-blue-600 hover:bg-blue-700"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Adicionar Meu Primeiro Horário
                  </Button>
                </div>
              </div>
            </div>
          </CardContent>
        )}
      </Card>

      {/* Estatísticas (se houver disponibilidades) */}
      {hasAvailabilities && (
        <AvailabilityStats statistics={statistics} />
      )}

      {/* Tabs: Gerenciar vs Sugestões */}
      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as 'manage' | 'suggestions')}>
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="manage" className="flex items-center gap-2">
            <Clock className="h-4 w-4" />
            <span>Gerenciar Horários</span>
            {statistics.horarios_ativos > 0 && (
              <Badge variant="secondary" className="ml-1">
                {statistics.horarios_ativos}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="suggestions" className="flex items-center gap-2">
            <Sparkles className="h-4 w-4" />
            <span>Sugestões</span>
            <Badge variant="secondary" className="ml-1">
              Em breve
            </Badge>
          </TabsTrigger>
        </TabsList>

        {/* Tab: Gerenciar Horários */}
        <TabsContent value="manage" className="space-y-4">
          {/* Botão Adicionar */}
          {hasAvailabilities && (
            <div className="flex justify-between items-center">
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {statistics.horarios_ativos} horário(s) ativo(s) de {statistics.total_horarios} total
              </p>
              <Button onClick={handleAdd} variant="default">
                <Plus className="h-4 w-4 mr-2" />
                Adicionar Horário
              </Button>
            </div>
          )}

          {/* Formulário (Dialog/Inline) */}
          {isFormOpen && (
            <Card className="border-2 border-[#3f9094]">
              <CardHeader>
                <CardTitle>
                  {editingAvailability ? 'Editar Horário' : 'Novo Horário Disponível'}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <AvailabilityForm
                  clienteId={clienteId}
                  availability={editingAvailability || undefined}
                  onSubmit={async (data) => {
                    if (editingAvailability) {
                      await updateAvailability(editingAvailability.id, data);
                    } else {
                      await addAvailability(data);
                    }
                    handleFormClose();
                  }}
                  onCancel={handleFormClose}
                  isLoading={isLoading}
                />
              </CardContent>
            </Card>
          )}

          {/* Lista de Disponibilidades */}
          <AvailabilityList
            availabilities={availabilities}
            isLoading={isLoading}
            onEdit={handleEdit}
            onDelete={deleteAvailability}
            onToggleStatus={toggleStatus}
          />
        </TabsContent>

        {/* Tab: Sugestões Automáticas */}
        <TabsContent value="suggestions" className="space-y-4">
          <SuggestedAppointmentsList clienteId={clienteId} />
        </TabsContent>
      </Tabs>

      {/* Dica Rápida */}
      {hasActiveAvailabilities && statistics.proxima_disponibilidade && (
        <Card className="bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-950 dark:to-emerald-950 border-green-200 dark:border-green-800">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <CheckCircle2 className="h-5 w-5 text-green-600 dark:text-green-400" />
              <div>
                <p className="text-sm font-medium text-green-900 dark:text-green-100">
                  Próxima disponibilidade:
                </p>
                <p className="text-sm text-green-700 dark:text-green-300">
                  {DIAS_SEMANA[statistics.dia_com_mais_disponibilidade]} •{' '}
                  {statistics.proxima_disponibilidade.hora_inicio} -{' '}
                  {statistics.proxima_disponibilidade.hora_fim}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default ClientAvailabilityManager;

