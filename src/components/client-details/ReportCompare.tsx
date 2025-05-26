import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { ClientDetailData } from '@/types/client';
import { format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { GitCompareArrows, ArrowLeftRight, FileText, File, Download } from 'lucide-react';

interface ReportCompareProps {
  client: ClientDetailData;
}

type ReportType = 'completo' | 'financeiro' | 'progresso' | 'sessoes';
type ReportFormat = 'pdf' | 'txt';

interface HistoricalReport {
  id: string;
  title: string;
  type: ReportType;
  format: ReportFormat;
  date: Date;
  fileSize: number;
  previewText?: string;
  data?: {
    sessionsCount?: number;
    paymentsTotal?: number;
    averagePayment?: number;
    completionRate?: number;
  };
}

const ReportCompare = ({ client }: ReportCompareProps) => {
  // Exemplo de dados históricos para comparar
  const availableReports: HistoricalReport[] = [
    {
      id: '1',
      title: 'Relatório Trimestral Q1',
      type: 'completo',
      format: 'pdf',
      date: parseISO('2023-03-31'),
      fileSize: 345600,
      data: {
        sessionsCount: 12,
        paymentsTotal: 720,
        averagePayment: 60,
        completionRate: 40
      }
    },
    {
      id: '2',
      title: 'Relatório Trimestral Q2',
      type: 'completo',
      format: 'pdf',
      date: parseISO('2023-06-30'),
      fileSize: 364800,
      data: {
        sessionsCount: 15,
        paymentsTotal: 900,
        averagePayment: 60,
        completionRate: 50
      }
    },
    {
      id: '3',
      title: 'Relatório Trimestral Q3',
      type: 'completo',
      format: 'pdf',
      date: parseISO('2023-09-30'),
      fileSize: 376320,
      data: {
        sessionsCount: 18,
        paymentsTotal: 1080,
        averagePayment: 60,
        completionRate: 60
      }
    },
    {
      id: '4',
      title: 'Relatório Trimestral Q4',
      type: 'completo',
      format: 'pdf',
      date: parseISO('2023-12-31'),
      fileSize: 401408,
      data: {
        sessionsCount: 24,
        paymentsTotal: 1440,
        averagePayment: 60,
        completionRate: 80
      }
    }
  ];

  const [selectedReportAId, setSelectedReportAId] = useState<string>('1');
  const [selectedReportBId, setSelectedReportBId] = useState<string>('4');
  const [activeCompareTab, setActiveCompareTab] = useState('overview');
  
  // Obter relatórios selecionados
  const reportA = availableReports.find(r => r.id === selectedReportAId);
  const reportB = availableReports.find(r => r.id === selectedReportBId);
  
  // Calcular diferenças
  const calculateDiff = (keyA: number | undefined, keyB: number | undefined) => {
    if (keyA === undefined || keyB === undefined) return null;
    const diff = keyB - keyA;
    const percentage = keyA !== 0 ? (diff / keyA) * 100 : 0;
    
    return {
      value: diff,
      percentage: percentage,
      increased: diff > 0
    };
  };
  
  // Trocar os relatórios selecionados
  const switchReports = () => {
    const tempId = selectedReportAId;
    setSelectedReportAId(selectedReportBId);
    setSelectedReportBId(tempId);
  };
  
  // Formatação de diferenças
  const formatDiff = (diff: { value: number, percentage: number, increased: boolean } | null) => {
    if (diff === null) return 'N/A';
    
    const sign = diff.increased ? '+' : '';
    return (
      <span className={diff.increased ? 'text-green-600' : 'text-red-600'}>
        {sign}{diff.value} ({sign}{diff.percentage.toFixed(1)}%)
      </span>
    );
  };
  
  if (!reportA || !reportB) {
    return <div>Selecione dois relatórios para comparar</div>;
  }
  
  return (
    <div className="space-y-6">
      {/* Seleção de relatórios */}
      <div className="flex items-center gap-2">
        <div className="grid w-full max-w-sm items-center gap-1.5">
          <Select 
            value={selectedReportAId}
            onValueChange={setSelectedReportAId}
          >
            <SelectTrigger>
              <SelectValue placeholder="Selecione o primeiro relatório" />
            </SelectTrigger>
            <SelectContent>
              {availableReports.map(report => (
                <SelectItem key={report.id} value={report.id}>
                  {report.title} ({format(report.date, 'dd/MM/yyyy')})
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        
        <Button 
          variant="ghost" 
          size="icon"
          onClick={switchReports}
          className="h-10 w-10 shrink-0"
        >
          <ArrowLeftRight className="h-4 w-4" />
        </Button>
        
        <div className="grid w-full max-w-sm items-center gap-1.5">
          <Select 
            value={selectedReportBId}
            onValueChange={setSelectedReportBId}
          >
            <SelectTrigger>
              <SelectValue placeholder="Selecione o segundo relatório" />
            </SelectTrigger>
            <SelectContent>
              {availableReports.map(report => (
                <SelectItem key={report.id} value={report.id}>
                  {report.title} ({format(report.date, 'dd/MM/yyyy')})
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
      
      {/* Área de comparação */}
      <div className="bg-white/30 backdrop-blur-sm p-4 rounded-lg border border-white/20">
        <div className="mb-4 flex items-center gap-4">
          <div className="p-3 rounded-md bg-blue-100 text-blue-600">
            <GitCompareArrows className="h-5 w-5" />
          </div>
          <div>
            <h4 className="text-lg font-medium">Comparação de Relatórios</h4>
            <p className="text-sm text-gray-500">
              Comparando {reportA.title} ({format(reportA.date, 'dd/MM/yyyy')}) com {reportB.title} ({format(reportB.date, 'dd/MM/yyyy')})
            </p>
          </div>
        </div>
        
        <Tabs defaultValue="overview" value={activeCompareTab} onValueChange={setActiveCompareTab}>
          <TabsList className="mb-6">
            <TabsTrigger value="overview">Visão Geral</TabsTrigger>
            <TabsTrigger value="sessions">Sessões</TabsTrigger>
            <TabsTrigger value="financial">Financeiro</TabsTrigger>
            <TabsTrigger value="progress">Progresso</TabsTrigger>
          </TabsList>
          
          <TabsContent value="overview">
            <div className="rounded-lg border bg-card text-card-foreground shadow-sm">
              <div className="grid grid-cols-3 divide-x p-4">
                <div className="px-4 py-2">
                  <h3 className="text-sm font-medium text-center mb-4">Métricas</h3>
                </div>
                <div className="px-4 py-2">
                  <h3 className="text-sm font-medium text-center mb-4">{reportA.title}</h3>
                </div>
                <div className="px-4 py-2">
                  <h3 className="text-sm font-medium text-center mb-4">{reportB.title}</h3>
                </div>
              </div>
              
              <div className="border-t">
                <div className="grid grid-cols-3 divide-x">
                  <div className="px-4 py-3 bg-gray-50 font-medium">
                    Número de Sessões
                  </div>
                  <div className="px-4 py-3 text-center">
                    {reportA.data?.sessionsCount || 'N/A'}
                  </div>
                  <div className="px-4 py-3 text-center">
                    {reportB.data?.sessionsCount || 'N/A'} {' '}
                    ({formatDiff(calculateDiff(reportA.data?.sessionsCount, reportB.data?.sessionsCount))})
                  </div>
                </div>
                
                <div className="grid grid-cols-3 divide-x border-t">
                  <div className="px-4 py-3 bg-gray-50 font-medium">
                    Total Pago (€)
                  </div>
                  <div className="px-4 py-3 text-center">
                    {reportA.data?.paymentsTotal ? `€${reportA.data.paymentsTotal}` : 'N/A'}
                  </div>
                  <div className="px-4 py-3 text-center">
                    {reportB.data?.paymentsTotal ? `€${reportB.data.paymentsTotal}` : 'N/A'} {' '}
                    ({formatDiff(calculateDiff(reportA.data?.paymentsTotal, reportB.data?.paymentsTotal))})
                  </div>
                </div>
                
                <div className="grid grid-cols-3 divide-x border-t">
                  <div className="px-4 py-3 bg-gray-50 font-medium">
                    Média por Sessão (€)
                  </div>
                  <div className="px-4 py-3 text-center">
                    {reportA.data?.averagePayment ? `€${reportA.data.averagePayment}` : 'N/A'}
                  </div>
                  <div className="px-4 py-3 text-center">
                    {reportB.data?.averagePayment ? `€${reportB.data.averagePayment}` : 'N/A'} {' '}
                    ({formatDiff(calculateDiff(reportA.data?.averagePayment, reportB.data?.averagePayment))})
                  </div>
                </div>
                
                <div className="grid grid-cols-3 divide-x border-t">
                  <div className="px-4 py-3 bg-gray-50 font-medium">
                    Taxa de Conclusão (%)
                  </div>
                  <div className="px-4 py-3 text-center">
                    {reportA.data?.completionRate ? `${reportA.data.completionRate}%` : 'N/A'}
                  </div>
                  <div className="px-4 py-3 text-center">
                    {reportB.data?.completionRate ? `${reportB.data.completionRate}%` : 'N/A'} {' '}
                    ({formatDiff(calculateDiff(reportA.data?.completionRate, reportB.data?.completionRate))})
                  </div>
                </div>
              </div>
            </div>
            
            <div className="flex justify-end mt-4 gap-4">
              <Button
                variant="outline"
                size="sm"
                className="flex items-center gap-2"
              >
                <Download className="h-4 w-4" />
                <span>Exportar Comparação</span>
              </Button>
            </div>
          </TabsContent>
          
          <TabsContent value="sessions">
            <div className="rounded-lg border bg-card text-card-foreground shadow-sm p-6">
              <div className="text-center py-8">
                <p className="text-muted-foreground">
                  Detalhes de comparação de sessões em desenvolvimento.
                </p>
              </div>
            </div>
          </TabsContent>
          
          <TabsContent value="financial">
            <div className="rounded-lg border bg-card text-card-foreground shadow-sm p-6">
              <div className="text-center py-8">
                <p className="text-muted-foreground">
                  Detalhes de comparação financeira em desenvolvimento.
                </p>
              </div>
            </div>
          </TabsContent>
          
          <TabsContent value="progress">
            <div className="rounded-lg border bg-card text-card-foreground shadow-sm p-6">
              <div className="text-center py-8">
                <p className="text-muted-foreground">
                  Detalhes de comparação de progresso em desenvolvimento.
                </p>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default ReportCompare; 