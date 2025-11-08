import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Sparkles, Calendar, Clock, CheckCircle2, X, TrendingUp } from 'lucide-react';
import { EmptyState } from '@/components/shared/EmptyState';

interface SuggestedAppointmentsListProps {
  clienteId: number;
}

export const SuggestedAppointmentsList: React.FC<SuggestedAppointmentsListProps> = ({
  clienteId,
}) => {
  // TODO: Criar hook useSuggestedAppointments para buscar sugestões do banco
  // const { suggestions, isLoading, acceptSuggestion, rejectSuggestion } = useSuggestedAppointments(clienteId);

  // Por enquanto, mostrar estado vazio com mensagem
  const isLoading = false;
  const suggestions: any[] = [];

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#3f9094]"></div>
        <span className="ml-3 text-gray-600">Buscando sugestões...</span>
      </div>
    );
  }

  if (suggestions.length === 0) {
    return (
      <Card>
        <CardContent className="pt-6">
          <EmptyState
            icon={<Sparkles className="h-12 w-12" />}
            title="Sugestões em Desenvolvimento"
            description="Estamos trabalhando no algoritmo inteligente de sugestões de agendamentos. Em breve você receberá sugestões automáticas baseadas na sua disponibilidade e histórico!"
            action={{
              label: 'Entendi',
              onClick: () => {},
            }}
          />
          
          {/* Pré-visualização de como será */}
          <div className="mt-8 p-6 bg-gradient-to-r from-blue-50 to-cyan-50 dark:from-blue-950 dark:to-cyan-950 rounded-lg border-2 border-dashed border-blue-300 dark:border-blue-800">
            <h4 className="font-semibold text-blue-900 dark:text-blue-100 mb-4 flex items-center gap-2">
              <Sparkles className="h-5 w-5" />
              Pré-visualização: Como Funcionará
            </h4>
            
            {/* Exemplo de Sugestão */}
            <Card className="bg-white dark:bg-gray-900">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <Calendar className="h-4 w-4 text-[#3f9094]" />
                      <span className="font-semibold">Segunda-feira, 15 Jan 2025</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4 text-gray-400" />
                      <span className="text-lg font-bold">09:00 - 10:00</span>
                    </div>
                  </div>
                  <Badge variant="secondary" className="bg-green-100 text-green-800 border-green-300">
                    <TrendingUp className="h-3 w-3 mr-1" />
                    95% Match
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="space-y-2">
                  <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    Por que sugerimos este horário?
                  </p>
                  <ul className="space-y-1 text-sm text-gray-600 dark:text-gray-400">
                    <li className="flex items-start gap-2">
                      <CheckCircle2 className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                      <span>Coincide com sua disponibilidade de alta preferência</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle2 className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                      <span>80% de comparecimento em horários similares</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle2 className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                      <span>Continuidade: Última sessão há 8 dias</span>
                    </li>
                  </ul>
                </div>

                <div className="flex gap-2 pt-2">
                  <Button variant="outline" size="sm" className="flex-1" disabled>
                    <X className="h-4 w-4 mr-2" />
                    Não Interessa
                  </Button>
                  <Button size="sm" className="flex-1" disabled>
                    <CheckCircle2 className="h-4 w-4 mr-2" />
                    Agendar Agora
                  </Button>
                </div>

                <p className="text-xs text-gray-500 text-center">
                  Esta é apenas uma pré-visualização. Sugestões reais virão em breve!
                </p>
              </CardContent>
            </Card>
          </div>
        </CardContent>
      </Card>
    );
  }

  // TODO: Renderizar sugestões reais quando o backend estiver pronto
  return (
    <div className="space-y-4">
      {/* Aqui virão as sugestões reais */}
    </div>
  );
};

