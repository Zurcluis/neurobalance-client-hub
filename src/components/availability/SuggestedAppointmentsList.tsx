import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Sparkles, Calendar, Clock, CheckCircle2, X, TrendingUp, RefreshCw, Loader2, AlertCircle } from 'lucide-react';
import { EmptyState } from '@/components/shared/EmptyState';
import { LoadingSpinner } from '@/components/shared/LoadingSpinner';
import { useSuggestedAppointments } from '@/hooks/useSuggestedAppointments';
import { generateSuggestionsForClient } from '@/lib/suggestionAlgorithm';
import { useAdminAuth } from '@/hooks/useAdminAuth';
import { toast } from 'sonner';
import { format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { cn } from '@/lib/utils';

interface SuggestedAppointmentsListProps {
  clienteId: number;
  onSuggestionAccepted?: (suggestionId: string) => void;
}

export const SuggestedAppointmentsList: React.FC<SuggestedAppointmentsListProps> = ({
  clienteId,
  onSuggestionAccepted,
}) => {
  const { admin } = useAdminAuth();
  const {
    suggestions,
    isLoading,
    acceptSuggestion,
    rejectSuggestion,
    createSuggestion,
    fetchSuggestions,
  } = useSuggestedAppointments(clienteId);

  const [isGenerating, setIsGenerating] = useState(false);

  // =====================================================
  // GENERATE NEW SUGGESTIONS
  // =====================================================

  const handleGenerateSuggestions = async () => {
    if (!admin?.id) {
      toast.error('Não foi possível identificar o administrador');
      return;
    }

    setIsGenerating(true);
    try {
      const newSuggestions = await generateSuggestionsForClient(clienteId, admin.id, {
        daysAhead: 14,
        maxSuggestions: 5,
      });

      if (newSuggestions.length === 0) {
        toast.info('Nenhuma sugestão disponível no momento. Verifique a disponibilidade do cliente.');
        return;
      }

      // Criar sugestões no banco de dados
      for (const { suggestion } of newSuggestions) {
        await createSuggestion(suggestion);
      }

      toast.success(`${newSuggestions.length} sugestões geradas com sucesso!`);
      await fetchSuggestions(); // Recarregar lista
    } catch (error) {
      console.error('Error generating suggestions:', error);
      toast.error('Erro ao gerar sugestões. Tente novamente.');
    } finally {
      setIsGenerating(false);
    }
  };

  // =====================================================
  // HANDLE ACCEPT
  // =====================================================

  const handleAccept = async (suggestionId: string) => {
    const result = await acceptSuggestion(suggestionId);
    if (result && onSuggestionAccepted) {
      onSuggestionAccepted(suggestionId);
    }
  };

  // =====================================================
  // HANDLE REJECT
  // =====================================================

  const handleReject = async (suggestionId: string) => {
    await rejectSuggestion(suggestionId);
  };

  // =====================================================
  // GET SCORE COLOR
  // =====================================================

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'bg-green-100 text-green-800 border-green-300';
    if (score >= 60) return 'bg-yellow-100 text-yellow-800 border-yellow-300';
    return 'bg-orange-100 text-orange-800 border-orange-300';
  };

  // =====================================================
  // RENDER LOADING
  // =====================================================

  if (isLoading && suggestions.length === 0) {
    return (
      <Card>
        <CardContent className="py-12">
          <LoadingSpinner />
        </CardContent>
      </Card>
    );
  }

  // =====================================================
  // RENDER EMPTY STATE
  // =====================================================

  if (!isLoading && suggestions.length === 0) {
    return (
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-[#3f9094]" />
              Sugestões Inteligentes
            </CardTitle>
            <Button
              onClick={handleGenerateSuggestions}
              disabled={isGenerating}
              size="sm"
              className="bg-gradient-to-r from-[#3f9094] to-[#2A5854]"
            >
              {isGenerating ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Gerando...
                </>
              ) : (
                <>
                  <Sparkles className="h-4 w-4 mr-2" />
                  Gerar Sugestões
                </>
              )}
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <EmptyState
            icon={<Calendar className="h-12 w-12" />}
            title="Nenhuma Sugestão Disponível"
            description="Clique no botão acima para gerar sugestões inteligentes baseadas na disponibilidade e histórico do cliente."
          />
        </CardContent>
      </Card>
    );
  }

  // =====================================================
  // RENDER SUGGESTIONS
  // =====================================================

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-[#3f9094]" />
            Sugestões Inteligentes ({suggestions.length})
          </CardTitle>
          <div className="flex items-center gap-2">
            <Button
              onClick={() => fetchSuggestions()}
              disabled={isLoading}
              size="sm"
              variant="outline"
            >
              <RefreshCw className={cn("h-4 w-4", isLoading && "animate-spin")} />
            </Button>
            <Button
              onClick={handleGenerateSuggestions}
              disabled={isGenerating}
              size="sm"
              className="bg-gradient-to-r from-[#3f9094] to-[#2A5854]"
            >
              {isGenerating ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Gerando...
                </>
              ) : (
                <>
                  <Sparkles className="h-4 w-4 mr-2" />
                  Nova Sugestão
                </>
              )}
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {suggestions.map((suggestion) => {
            const date = parseISO(suggestion.data_sugerida);
            const formattedDate = format(date, "EEEE, dd 'de' MMMM 'de' yyyy", { locale: ptBR });
            const reasons = suggestion.razoes_sugestao?.split(';').map((r) => r.trim()) || [];

            return (
              <Card key={suggestion.id} className="border-l-4 border-l-[#3f9094]">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <Calendar className="h-4 w-4 text-[#3f9094]" />
                        <span className="font-semibold capitalize">{formattedDate}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Clock className="h-4 w-4 text-gray-400" />
                        <span className="text-lg font-bold">
                          {suggestion.hora_inicio} - {suggestion.hora_fim}
                        </span>
                      </div>
                    </div>
                    <Badge variant="secondary" className={getScoreColor(suggestion.compatibilidade_score)}>
                      <TrendingUp className="h-3 w-3 mr-1" />
                      {suggestion.compatibilidade_score}% Match
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  {reasons.length > 0 && (
                    <div className="space-y-2">
                      <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
                        Por que sugerimos este horário?
                      </p>
                      <ul className="space-y-1 text-sm text-gray-600 dark:text-gray-400">
                        {reasons.map((reason, index) => (
                          <li key={index} className="flex items-start gap-2">
                            <CheckCircle2 className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                            <span>{reason}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  <div className="flex gap-2 pt-2">
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1"
                      onClick={() => handleReject(suggestion.id!)}
                      disabled={isLoading || isGenerating}
                    >
                      <X className="h-4 w-4 mr-2" />
                      Não Interessa
                    </Button>
                    <Button
                      size="sm"
                      className="flex-1 bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800"
                      onClick={() => handleAccept(suggestion.id!)}
                      disabled={isLoading || isGenerating}
                    >
                      <CheckCircle2 className="h-4 w-4 mr-2" />
                      Aceitar
                    </Button>
                  </div>

                  {suggestion.expira_em && (
                    <div className="flex items-center gap-2 text-xs text-gray-500 pt-2">
                      <AlertCircle className="h-3 w-3" />
                      <span>
                        Expira em: {format(parseISO(suggestion.expira_em), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                      </span>
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
};
