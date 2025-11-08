import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Edit, Trash2, Power, Clock } from 'lucide-react';
import { ClientAvailability, DIAS_SEMANA, DIAS_SEMANA_CURTO } from '@/types/availability';
import { EmptyState } from '@/components/shared/EmptyState';
import { ConfirmDialog } from '@/components/shared/ConfirmDialog';
import { useState } from 'react';

interface AvailabilityListProps {
  availabilities: ClientAvailability[];
  isLoading: boolean;
  onEdit: (id: string) => void;
  onDelete: (id: string) => void;
  onToggleStatus: (id: string) => void;
}

export const AvailabilityList: React.FC<AvailabilityListProps> = ({
  availabilities,
  isLoading,
  onEdit,
  onDelete,
  onToggleStatus,
}) => {
  const [deletingId, setDeletingId] = useState<string | null>(null);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#3f9094]"></div>
        <span className="ml-3 text-gray-600">Carregando...</span>
      </div>
    );
  }

  if (availabilities.length === 0) {
    return (
      <EmptyState
        icon={<Clock className="h-12 w-12" />}
        title="Nenhum horário cadastrado"
        description="Adicione seus horários disponíveis para começar a receber sugestões de agendamentos"
      />
    );
  }

  // Agrupar por dia da semana
  const groupedByDay = availabilities.reduce((acc, avail) => {
    const day = avail.dia_semana;
    if (!acc[day]) acc[day] = [];
    acc[day].push(avail);
    return acc;
  }, {} as Record<number, ClientAvailability[]>);

  // Ordenar cada grupo por hora
  Object.keys(groupedByDay).forEach((day) => {
    groupedByDay[parseInt(day)].sort((a, b) => 
      a.hora_inicio.localeCompare(b.hora_inicio)
    );
  });

  const getPreferenceIcon = (preferencia: string) => {
    switch (preferencia) {
      case 'alta': return '⭐';
      case 'media': return '◆';
      case 'baixa': return '○';
      default: return '';
    }
  };

  const getPreferenceColor = (preferencia: string) => {
    switch (preferencia) {
      case 'alta': return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      case 'media': return 'text-blue-600 bg-blue-50 border-blue-200';
      case 'baixa': return 'text-gray-600 bg-gray-50 border-gray-200';
      default: return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  return (
    <div className="space-y-4">
      {Object.entries(groupedByDay)
        .sort(([a], [b]) => parseInt(a) - parseInt(b))
        .map(([day, avails]) => (
          <Card key={day} className="overflow-hidden">
            <div className="bg-gradient-to-r from-[#3f9094]/10 to-[#2A5854]/10 px-4 py-3 border-b">
              <h3 className="font-semibold text-[#3f9094] flex items-center gap-2">
                <span className="text-2xl">{DIAS_SEMANA_CURTO[parseInt(day) as keyof typeof DIAS_SEMANA_CURTO]}</span>
                <span>{DIAS_SEMANA[parseInt(day) as keyof typeof DIAS_SEMANA]}</span>
                <Badge variant="secondary" className="ml-auto">
                  {avails.length} horário(s)
                </Badge>
              </h3>
            </div>
            <CardContent className="p-0">
              <div className="divide-y">
                {avails.map((avail) => (
                  <div
                    key={avail.id}
                    className={`p-4 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors ${
                      avail.status !== 'ativo' ? 'opacity-60' : ''
                    }`}
                  >
                    <div className="flex items-start justify-between gap-4">
                      {/* Horário e Informações */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-3 mb-2">
                          {/* Horário */}
                          <div className="flex items-center gap-2">
                            <Clock className="h-4 w-4 text-gray-400" />
                            <span className="font-semibold text-lg">
                              {avail.hora_inicio} - {avail.hora_fim}
                            </span>
                          </div>

                          {/* Preferência */}
                          <Badge 
                            variant="outline"
                            className={`${getPreferenceColor(avail.preferencia)} capitalize`}
                          >
                            {getPreferenceIcon(avail.preferencia)} {avail.preferencia}
                          </Badge>

                          {/* Status */}
                          {avail.status !== 'ativo' && (
                            <Badge variant="secondary" className="capitalize">
                              {avail.status}
                            </Badge>
                          )}

                          {/* Recorrência */}
                          <span className="text-xs text-gray-500 capitalize">
                            {avail.recorrencia}
                          </span>
                        </div>

                        {/* Notas */}
                        {avail.notas && (
                          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                            "{avail.notas}"
                          </p>
                        )}

                        {/* Validade (se temporário) */}
                        {avail.status === 'temporario' && (avail.valido_de || avail.valido_ate) && (
                          <div className="text-xs text-gray-500 mt-2 flex items-center gap-1">
                            📅 Válido:
                            {avail.valido_de && <span>de {new Date(avail.valido_de).toLocaleDateString('pt-PT')}</span>}
                            {avail.valido_ate && <span>até {new Date(avail.valido_ate).toLocaleDateString('pt-PT')}</span>}
                          </div>
                        )}
                      </div>

                      {/* Ações */}
                      <div className="flex items-center gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => onToggleStatus(avail.id)}
                          title={avail.status === 'ativo' ? 'Desativar' : 'Ativar'}
                        >
                          <Power 
                            className={`h-4 w-4 ${
                              avail.status === 'ativo' ? 'text-green-600' : 'text-gray-400'
                            }`} 
                          />
                        </Button>

                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => onEdit(avail.id)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>

                        <ConfirmDialog
                          title="Remover Horário"
                          description="Tem certeza que deseja remover este horário da sua disponibilidade?"
                          onConfirm={() => onDelete(avail.id)}
                          trigger={
                            <Button
                              variant="ghost"
                              size="sm"
                              className="text-red-600 hover:text-red-700 hover:bg-red-50"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          }
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        ))}
    </div>
  );
};

