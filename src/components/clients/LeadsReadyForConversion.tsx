import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { 
  UserPlus, 
  Mail, 
  Phone, 
  Calendar, 
  ArrowRight,
  Sparkles,
  CheckCircle2,
  Clock,
  Target,
  ChevronUp,
  ChevronDown
} from 'lucide-react';
import { useLandingLeads } from '@/hooks/useLandingLeads';
import { useLeadCompra } from '@/hooks/useLeadCompra';
import { LandingLead } from '@/types/landing-lead';
import { LeadCompra } from '@/types/lead-compra';
import { format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface LeadsReadyForConversionProps {
  onConvertLead: (lead: LandingLead | LeadCompra, type: 'landing' | 'compra') => void;
}

interface ReadyLead {
  lead: LandingLead | LeadCompra;
  type: 'landing' | 'compra';
  priority: 'high' | 'medium' | 'low';
}

const LeadsReadyForConversion: React.FC<LeadsReadyForConversionProps> = ({ onConvertLead }) => {
  const { leads: landingLeads, isLoading: landingLoading } = useLandingLeads();
  const { leads: compraLeads, isLoading: compraLoading } = useLeadCompra();
  const [isExpanded, setIsExpanded] = useState(true);

  // Filtrar leads prontas para conversão
  const readyLeads = useMemo<ReadyLead[]>(() => {
    const ready: ReadyLead[] = [];

    // Landing leads com avaliação realizada ou vai iniciar
    landingLeads.forEach(lead => {
      if (lead.status === 'Avaliação Realizada') {
        ready.push({ lead, type: 'landing', priority: 'high' });
      } else if (lead.status === 'Vai Iniciar') {
        ready.push({ lead, type: 'landing', priority: 'high' });
      } else if (lead.status === 'Iniciou Neurofeedback') {
        ready.push({ lead, type: 'landing', priority: 'medium' });
      }
    });

    // Lead compra com status relevante
    compraLeads.forEach(lead => {
      if (lead.tipo === 'Compra' || 
          (lead as any).status === 'Marcaram avaliação' ||
          (lead as any).status === 'Falta resultados da avaliação' ||
          (lead as any).status === 'Iniciou Neurofeedback') {
        // Verificar se tem valor pago (indica conversão)
        if (lead.valor_pago > 0) {
          ready.push({ lead, type: 'compra', priority: 'medium' });
        }
      }
    });

    // Ordenar por prioridade
    return ready.sort((a, b) => {
      const priorityOrder = { high: 0, medium: 1, low: 2 };
      return priorityOrder[a.priority] - priorityOrder[b.priority];
    });
  }, [landingLeads, compraLeads]);

  const isLoading = landingLoading || compraLoading;

  if (isLoading) {
    return (
      <Card className="bg-gradient-to-br from-[#E6ECEA]/30 to-white">
        <CardContent className="py-8">
          <div className="flex items-center justify-center gap-3">
            <div className="h-5 w-5 border-2 border-[#3f9094] border-t-transparent rounded-full animate-spin" />
            <span className="text-gray-600">A carregar leads...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (readyLeads.length === 0) {
    return null;
  }

  const getStatusBadge = (lead: ReadyLead) => {
    if (lead.type === 'landing') {
      const landingLead = lead.lead as LandingLead;
      const statusColors: Record<string, string> = {
        'Avaliação Realizada': 'bg-green-100 text-green-800 border-green-200',
        'Vai Iniciar': 'bg-blue-100 text-blue-800 border-blue-200',
        'Iniciou Neurofeedback': 'bg-purple-100 text-purple-800 border-purple-200',
      };
      return (
        <Badge className={`text-xs ${statusColors[landingLead.status] || 'bg-gray-100 text-gray-800'}`}>
          {landingLead.status}
        </Badge>
      );
    } else {
      const compraLead = lead.lead as LeadCompra;
      return (
        <Badge className="text-xs bg-emerald-100 text-emerald-800 border-emerald-200">
          {compraLead.tipo} - €{compraLead.valor_pago}
        </Badge>
      );
    }
  };

  const getPriorityIcon = (priority: 'high' | 'medium' | 'low') => {
    switch (priority) {
      case 'high':
        return <Sparkles className="h-4 w-4 text-amber-500" />;
      case 'medium':
        return <Target className="h-4 w-4 text-blue-500" />;
      default:
        return <Clock className="h-4 w-4 text-gray-400" />;
    }
  };

  const highPriorityCount = readyLeads.filter(l => l.priority === 'high').length;

  return (
    <Collapsible open={isExpanded} onOpenChange={setIsExpanded}>
      <Card className="border-l-4 border-l-[#3f9094] bg-gradient-to-r from-[#E6ECEA]/40 to-white dark:from-[#3f9094]/10 dark:to-gray-900">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="p-2 bg-[#3f9094]/10 rounded-lg">
                <UserPlus className="h-5 w-5 text-[#3f9094]" />
              </div>
              <div>
                <CardTitle className="text-lg">Leads Prontas para Conversão</CardTitle>
                <CardDescription className="text-sm">
                  {readyLeads.length} lead{readyLeads.length !== 1 ? 's' : ''} com avaliação realizada ou pronta{readyLeads.length !== 1 ? 's' : ''} para converter
                </CardDescription>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="secondary" className="gap-1">
                <Sparkles className="h-3 w-3" />
                {highPriorityCount} prioritária{highPriorityCount !== 1 ? 's' : ''}
              </Badge>
              <CollapsibleTrigger asChild>
                <Button variant="ghost" size="sm" className="h-8 w-8 p-0 hover:bg-[#3f9094]/10">
                  {isExpanded ? (
                    <ChevronUp className="h-4 w-4 text-[#3f9094]" />
                  ) : (
                    <ChevronDown className="h-4 w-4 text-[#3f9094]" />
                  )}
                </Button>
              </CollapsibleTrigger>
            </div>
          </div>
        </CardHeader>
        
        <CollapsibleContent className="transition-all data-[state=closed]:animate-accordion-up data-[state=open]:animate-accordion-down">
          <CardContent className="pt-0">
            <ScrollArea className="w-full">
              <div className="flex gap-4 pb-4">
                {readyLeads.slice(0, 6).map((readyLead, index) => (
                  <Card 
                    key={`${readyLead.type}-${readyLead.lead.id}`}
                    className="min-w-[280px] max-w-[300px] flex-shrink-0 hover:shadow-lg transition-all duration-200 hover:border-[#3f9094]/30 group"
                  >
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex items-center gap-2">
                          {getPriorityIcon(readyLead.priority)}
                          <span className="font-semibold text-gray-900 truncate max-w-[150px]">
                            {readyLead.lead.nome}
                          </span>
                        </div>
                        {getStatusBadge(readyLead)}
                      </div>

                      <div className="space-y-2 text-sm text-gray-600 mb-4">
                        <div className="flex items-center gap-2">
                          <Mail className="h-3.5 w-3.5 flex-shrink-0" />
                          <span className="truncate">{readyLead.lead.email}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Phone className="h-3.5 w-3.5 flex-shrink-0" />
                          <span>{readyLead.lead.telefone}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Calendar className="h-3.5 w-3.5 flex-shrink-0" />
                          <span>
                            {format(
                              parseISO(readyLead.type === 'landing' 
                                ? (readyLead.lead as LandingLead).created_at 
                                : (readyLead.lead as LeadCompra).data_evento
                              ), 
                              "dd MMM yyyy", 
                              { locale: ptBR }
                            )}
                          </span>
                        </div>
                      </div>

                      <Button
                        size="sm"
                        className="w-full bg-gradient-to-r from-[#3f9094] to-[#2A5854] hover:opacity-90 group-hover:shadow-md transition-all"
                        onClick={() => onConvertLead(readyLead.lead, readyLead.type)}
                      >
                        <UserPlus className="h-4 w-4 mr-2" />
                        Converter para Cliente
                        <ArrowRight className="h-4 w-4 ml-2 opacity-0 group-hover:opacity-100 transition-opacity" />
                      </Button>
                    </CardContent>
                  </Card>
                ))}

                {readyLeads.length > 6 && (
                  <Card className="min-w-[200px] flex-shrink-0 border-dashed border-2 border-[#3f9094]/30 bg-[#3f9094]/5">
                    <CardContent className="p-4 h-full flex flex-col items-center justify-center text-center">
                      <div className="p-3 bg-[#3f9094]/10 rounded-full mb-3">
                        <Target className="h-6 w-6 text-[#3f9094]" />
                      </div>
                      <p className="font-medium text-[#3f9094]">
                        +{readyLeads.length - 6} leads
                      </p>
                      <p className="text-sm text-gray-500 mt-1">
                        disponíveis
                      </p>
                    </CardContent>
                  </Card>
                )}
              </div>
              <ScrollBar orientation="horizontal" />
            </ScrollArea>
          </CardContent>
        </CollapsibleContent>
      </Card>
    </Collapsible>
  );
};

export default LeadsReadyForConversion;
