import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  TrendingUp, 
  Calendar, 
  Clock, 
  Target,
  Sun,
  Sunset,
  Moon
} from 'lucide-react';
import { AvailabilityStats as AvailabilityStatsType, DIAS_SEMANA } from '@/types/availability';

interface AvailabilityStatsProps {
  statistics: AvailabilityStatsType;
}

export const AvailabilityStats: React.FC<AvailabilityStatsProps> = ({ statistics }) => {
  const getPeriodoIcon = (periodo: 'manha' | 'tarde' | 'noite') => {
    switch (periodo) {
      case 'manha': return <Sun className="h-5 w-5" />;
      case 'tarde': return <Sunset className="h-5 w-5" />;
      case 'noite': return <Moon className="h-5 w-5" />;
    }
  };

  const getPeriodoLabel = (periodo: 'manha' | 'tarde' | 'noite') => {
    switch (periodo) {
      case 'manha': return 'Manhã (6h-12h)';
      case 'tarde': return 'Tarde (12h-18h)';
      case 'noite': return 'Noite (18h-24h)';
    }
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {/* Total de Horários */}
      <Card className="border-l-4 border-l-blue-500">
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-sm font-medium text-gray-700 dark:text-gray-300">
            Total de Horários
          </CardTitle>
          <Calendar className="h-5 w-5 text-blue-500" />
        </CardHeader>
        <CardContent>
          <div className="text-3xl font-bold text-blue-600">
            {statistics.total_horarios}
          </div>
          <div className="flex items-center gap-2 mt-2">
            <Badge variant="secondary" className="text-xs">
              {statistics.horarios_ativos} ativos
            </Badge>
            {statistics.horarios_inativos > 0 && (
              <Badge variant="outline" className="text-xs">
                {statistics.horarios_inativos} inativos
              </Badge>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Dia com Mais Disponibilidade */}
      <Card className="border-l-4 border-l-green-500">
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-sm font-medium text-gray-700 dark:text-gray-300">
            Dia Mais Disponível
          </CardTitle>
          <TrendingUp className="h-5 w-5 text-green-500" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-green-600">
            {DIAS_SEMANA[statistics.dia_com_mais_disponibilidade]}
          </div>
          <p className="text-xs text-gray-500 mt-2">
            Dia da semana com mais horários
          </p>
        </CardContent>
      </Card>

      {/* Período Preferido */}
      <Card className="border-l-4 border-l-orange-500">
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-sm font-medium text-gray-700 dark:text-gray-300">
            Período Preferido
          </CardTitle>
          {getPeriodoIcon(statistics.periodo_preferido)}
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-orange-600 capitalize">
            {statistics.periodo_preferido}
          </div>
          <p className="text-xs text-gray-500 mt-2">
            {getPeriodoLabel(statistics.periodo_preferido)}
          </p>
        </CardContent>
      </Card>

      {/* Próxima Disponibilidade */}
      <Card className="border-l-4 border-l-purple-500">
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-sm font-medium text-gray-700 dark:text-gray-300">
            Próxima Disponibilidade
          </CardTitle>
          <Clock className="h-5 w-5 text-purple-500" />
        </CardHeader>
        <CardContent>
          {statistics.proxima_disponibilidade ? (
            <>
              <div className="text-lg font-bold text-purple-600">
                {new Date(statistics.proxima_disponibilidade.data).toLocaleDateString('pt-PT', {
                  day: '2-digit',
                  month: 'short',
                })}
              </div>
              <p className="text-sm text-gray-600 mt-1">
                {statistics.proxima_disponibilidade.hora_inicio} -{' '}
                {statistics.proxima_disponibilidade.hora_fim}
              </p>
            </>
          ) : (
            <p className="text-sm text-gray-500">
              Nenhuma disponibilidade próxima
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

