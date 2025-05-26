import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { FileText, Download, File, Calendar, Filter } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ClientDetailData, Session, Payment } from '@/types/client';
import { format, isValid, parseISO, subMonths, subDays, startOfMonth, endOfMonth, isBefore, isAfter } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Textarea } from '@/components/ui/textarea';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubTrigger,
  DropdownMenuSubContent,
  DropdownMenuPortal,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
} from "@/components/ui/dropdown-menu";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import ClientCharts from './ClientCharts';
import AttachmentUploader from './AttachmentUploader';
import ScheduledReports from './ScheduledReports';
import ReportHistory from './ReportHistory';
import ReportCompare from './ReportCompare';
import ReportShare from './ReportShare';
import { Label } from '@/components/ui/label';
import { DateRangePicker } from "@/components/ui/date-range-picker";

interface ClientReportsProps {
  client: ClientDetailData;
  sessions: Session[];
  payments: Payment[];
}

// Fazendo cast de jsPDF para ter o método autoTable
interface JsPDFWithAutoTable extends jsPDF {
  autoTable: (options: any) => void;
}

// Definindo tipos de relatórios disponíveis
type ReportType = 'completo' | 'financeiro' | 'progresso' | 'sessoes';

interface ReportTemplate {
  id: ReportType;
  title: string;
  description: string;
  icon: React.ReactNode;
}

// Tipo para período de datas
type DatePeriod = 'all' | 'month' | 'quarter' | 'halfyear' | 'year' | 'custom';

interface DateRange {
  from: Date | undefined;
  to: Date | undefined;
}

const ClientReports = ({ client, sessions, payments }: ClientReportsProps) => {
  const [notes, setNotes] = useState<string>(client.notas || '');
  const [isGenerating, setIsGenerating] = useState(false);
  const [selectedReportType, setSelectedReportType] = useState<ReportType>('completo');
  const [activeTab, setActiveTab] = useState('templates');
  const [attachments, setAttachments] = useState<File[]>([]);
  const [datePeriod, setDatePeriod] = useState<DatePeriod>('all');
  const [dateRange, setDateRange] = useState<DateRange>({ 
    from: undefined, 
    to: undefined 
  });
  const [showPeriodSelector, setShowPeriodSelector] = useState(false);

  // Templates de relatórios disponíveis
  const reportTemplates: ReportTemplate[] = [
    {
      id: 'completo',
      title: 'Relatório Completo',
      description: 'Inclui todos os dados do cliente, sessões e pagamentos',
      icon: <FileText className="h-4 w-4" />
    },
    {
      id: 'financeiro',
      title: 'Relatório Financeiro',
      description: 'Foco nos pagamentos e resumo financeiro',
      icon: <File className="h-4 w-4" />
    },
    {
      id: 'progresso',
      title: 'Relatório de Progresso',
      description: 'Resumo do progresso e evolução do cliente',
      icon: <FileText className="h-4 w-4" />
    },
    {
      id: 'sessoes',
      title: 'Histórico de Sessões',
      description: 'Detalhes apenas das sessões realizadas',
      icon: <FileText className="h-4 w-4" />
    }
  ];

  const handleSaveNotes = () => {
    // Update client notes in localStorage
    const clients = JSON.parse(localStorage.getItem('clients') || '[]');
    const updatedClients = clients.map((c: ClientDetailData) => {
      if (c.id === client.id) {
        return { ...c, notas: notes };
      }
      return c;
    });
    localStorage.setItem('clients', JSON.stringify(updatedClients));
    
    // Show toast or some feedback
    alert('Notas salvas com sucesso');
  };
  
  // Função segura para formatar datas
  const formatDateSafe = (dateStr: string | undefined | null) => {
    if (!dateStr) return '';
    try {
      const date = parseISO(dateStr);
      if (!isValid(date)) return 'Data inválida';
      return format(date, 'dd/MM/yyyy');
    } catch (error) {
      console.error('Erro ao formatar data:', dateStr, error);
      return 'Data inválida';
    }
  };
  
  // Função para aplicar filtragem por período aos dados
  const filterDataByPeriod = (
    sessions: Session[],
    payments: Payment[]
  ): { filteredSessions: Session[], filteredPayments: Payment[] } => {
    if (datePeriod === 'all') {
      return { filteredSessions: sessions, filteredPayments: payments };
    }

    let fromDate: Date | undefined;
    let toDate: Date = new Date();

    // Definir datas com base no período selecionado
    switch (datePeriod) {
      case 'month':
        fromDate = subMonths(new Date(), 1);
        break;
      case 'quarter':
        fromDate = subMonths(new Date(), 3);
        break;
      case 'halfyear':
        fromDate = subMonths(new Date(), 6);
        break;
      case 'year':
        fromDate = subMonths(new Date(), 12);
        break;
      case 'custom':
        fromDate = dateRange.from;
        toDate = dateRange.to || new Date();
        break;
    }

    // Filtrar sessões e pagamentos
    const filteredSessions = sessions.filter(session => {
      const sessionDate = session.date ? parseISO(session.date) : null;
      if (!sessionDate) return false;
      
      const isAfterFrom = fromDate ? isAfter(sessionDate, fromDate) : true;
      const isBeforeTo = isValid(toDate) ? isBefore(sessionDate, toDate) : true;
      
      return isAfterFrom && isBeforeTo;
    });

    const filteredPayments = payments.filter(payment => {
      const paymentDate = payment.data ? parseISO(payment.data) : null;
      if (!paymentDate) return false;
      
      const isAfterFrom = fromDate ? isAfter(paymentDate, fromDate) : true;
      const isBeforeTo = isValid(toDate) ? isBefore(paymentDate, toDate) : true;
      
      return isAfterFrom && isBeforeTo;
    });

    return { filteredSessions, filteredPayments };
  };

  // Obter dados filtrados pelo período
  const { filteredSessions, filteredPayments } = filterDataByPeriod(sessions, payments);

  // Função para obter o título do período selecionado
  const getPeriodTitle = (): string => {
    switch (datePeriod) {
      case 'all':
        return "Todo o Histórico";
      case 'month':
        return "Último Mês";
      case 'quarter':
        return "Último Trimestre";
      case 'halfyear':
        return "Último Semestre";
      case 'year':
        return "Último Ano";
      case 'custom':
        if (dateRange.from && dateRange.to) {
          return `De ${format(dateRange.from, 'dd/MM/yyyy')} até ${format(dateRange.to, 'dd/MM/yyyy')}`;
        }
        return "Período Personalizado";
    }
  };
  
  // Função para gerar o conteúdo do relatório baseado no tipo selecionado
  const generateReportContent = (type: ReportType): string => {
    const totalSessions = filteredSessions.length;
    const totalPaid = filteredPayments.reduce((sum, payment) => sum + (payment.valor || 0), 0);
    const averagePerSession = totalSessions > 0 ? totalPaid / totalSessions : 0;
    const completionRate = client.max_sessoes && client.max_sessoes > 0 ? 
      (totalSessions / client.max_sessoes) * 100 : 0;
    
    const currentDate = format(new Date(), 'dd MMMM yyyy', { locale: ptBR });
    const periodTitle = getPeriodTitle();
    
    let content = '';
    
    // Cabeçalho comum para todos os relatórios
    content += `RELATÓRIO ${reportTemplates.find(t => t.id === type)?.title.toUpperCase()}\n\n`;
    content += `Data: ${currentDate}\n`;
    content += `Período: ${periodTitle}\n\n`;
    
    // Dados do cliente (incluído em todos, exceto no relatório financeiro puro)
    if (type !== 'financeiro') {
      content += `Nome do Cliente: ${client.nome || ''}\n`;
      content += `Email: ${client.email || ''}\n`;
      content += `Telefone: ${client.telefone || ''}\n`;
      
      // Lidar com data de nascimento de forma segura
      if (client.data_nascimento) {
        content += `Data de Nascimento: ${formatDateSafe(client.data_nascimento)}\n`;
      }
    }
    
    // Resumo de sessões (incluído em todos, exceto no relatório financeiro)
    if (type !== 'financeiro') {
      content += `\nRESUMO DE SESSÕES\n`;
      content += `Total de Sessões Realizadas: ${totalSessions}\n`;
      
      if (client.max_sessoes) {
        content += `Sessões Planeadas: ${client.max_sessoes}\n`;
        content += `Taxa de Conclusão: ${completionRate.toFixed(1)}%\n`;
      }
    }
    
    // Resumo financeiro (incluído no completo e financeiro)
    if (type === 'completo' || type === 'financeiro') {
      content += `\nRESUMO FINANCEIRO\n`;
      content += `Total Pago: €${totalPaid.toFixed(2)}\n`;
      content += `Média por Sessão: €${averagePerSession.toFixed(2)}\n\n`;
    }
    
    // Notas do cliente (incluído no completo e progresso)
    if (type === 'completo' || type === 'progresso') {
      content += `NOTAS DO CLIENTE:\n${notes || 'Sem notas'}\n\n`;
    }
    
    // Detalhes das sessões (incluído no completo e sessões)
    if (type === 'completo' || type === 'sessoes') {
      content += `DETALHES DAS SESSÕES:\n`;
      filteredSessions.forEach((session, index) => {
        content += `\nSessão #${index + 1} - ${formatDateSafe(session.date)}\n`;
        content += `${session.paid ? 'Pago' : 'Não Pago'}\n`;
        content += session.notes ? `Notas: ${session.notes}\n` : 'Sem notas\n';
      });
    }
    
    // Histórico de pagamentos (incluído no completo e financeiro)
    if (type === 'completo' || type === 'financeiro') {
      content += `\nHISTÓRICO DE PAGAMENTOS:\n`;
      filteredPayments.forEach((payment) => {
        content += `\n${formatDateSafe(payment.data)} - €${payment.valor.toFixed(2)}\n`;
        content += `${payment.descricao || ''} (${payment.tipo || ''})\n`;
      });
    }
    
    return content;
  };
  
  // Manipular anexos
  const handleAttachmentAdd = (file: File) => {
    setAttachments(prev => [...prev, file]);
  };

  // Incluir anexos nos relatórios
  const generateTextReportWithAttachments = () => {
    setIsGenerating(true);
    try {
      let content = generateReportContent(selectedReportType);
      
      // Adicionar lista de anexos ao final do relatório
      if (attachments.length > 0) {
        content += '\nANEXOS:\n';
        attachments.forEach((file, index) => {
          content += `${index + 1}. ${file.name} (${(file.size / 1024).toFixed(2)} KB)\n`;
        });
      }
      
      // Create and download the file
      const blob = new Blob([content], { type: 'text/plain' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${reportTemplates.find(t => t.id === selectedReportType)?.title}_${client.nome || 'Cliente'}_${format(new Date(), 'yyyy-MM-dd')}.txt`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Erro ao gerar relatório de texto:', error);
      alert('Erro ao gerar relatório');
    } finally {
      setIsGenerating(false);
    }
  };
  
  const generatePdfReportWithAttachments = () => {
    setIsGenerating(true);
    try {
      // Criar documento PDF
      const doc = new jsPDF() as JsPDFWithAutoTable;
      const pageWidth = doc.internal.pageSize.getWidth();
      const margin = 20;
      let y = 20; // posição vertical atual
      
      // Funções auxiliares
      const addText = (text: string, size = 12, isBold = false) => {
        doc.setFontSize(size);
        doc.setFont('helvetica', isBold ? 'bold' : 'normal');
        doc.text(text, margin, y);
        y += size / 3 + 4;
      };
      
      const addLine = () => {
        doc.setDrawColor(200, 200, 200);
        doc.line(margin, y - 2, pageWidth - margin, y - 2);
        y += 8;
      };
      
      // Título e cabeçalho - depende do tipo de relatório
      const reportTitle = reportTemplates.find(t => t.id === selectedReportType)?.title.toUpperCase() || 'RELATÓRIO';
      addText(`${reportTitle}`, 18, true);
      y += 10;
      
      // Data atual e período
      const currentDate = format(new Date(), 'dd MMMM yyyy', { locale: ptBR });
      addText(`Data: ${currentDate}`);
      addText(`Período: ${getPeriodTitle()}`);
      
      // Dados do cliente (incluído em todos, exceto no relatório financeiro puro)
      if (selectedReportType !== 'financeiro') {
        addText(`Nome do Cliente: ${client.nome || ''}`, 12, true);
        addText(`Email: ${client.email || ''}`);
        addText(`Telefone: ${client.telefone || ''}`);
        
        if (client.data_nascimento) {
          addText(`Data de Nascimento: ${formatDateSafe(client.data_nascimento)}`);
        }
      }
      
      y += 10;
      addLine();
      
      // Resumo de sessões (incluído em todos, exceto no relatório financeiro)
      if (selectedReportType !== 'financeiro') {
        addText('RESUMO DE SESSÕES', 14, true);
        
        const totalSessions = filteredSessions.length;
        const completionRate = client.max_sessoes && client.max_sessoes > 0 ? 
          (totalSessions / client.max_sessoes) * 100 : 0;
        
        addText(`Total de Sessões Realizadas: ${totalSessions}`);
        if (client.max_sessoes) {
          addText(`Sessões Planeadas: ${client.max_sessoes}`);
          addText(`Taxa de Conclusão: ${completionRate.toFixed(1)}%`);
        }
        
        y += 10;
        addLine();
      }
      
      // Resumo financeiro (incluído no completo e financeiro)
      if (selectedReportType === 'completo' || selectedReportType === 'financeiro') {
        addText('RESUMO FINANCEIRO', 14, true);
        
        const totalSessions = filteredSessions.length;
        const totalPaid = filteredPayments.reduce((sum, payment) => sum + (payment.valor || 0), 0);
        const averagePerSession = totalSessions > 0 ? totalPaid / totalSessions : 0;
        
        addText(`Total Pago: €${totalPaid.toFixed(2)}`);
        addText(`Média por Sessão: €${averagePerSession.toFixed(2)}`);
        
        y += 10;
        addLine();
      }
      
      // Notas (incluído no completo e progresso)
      if (selectedReportType === 'completo' || selectedReportType === 'progresso') {
        addText('NOTAS DO CLIENTE', 14, true);
        
        // Quebrar notas em múltiplas linhas se necessário
        const notesText = notes || 'Sem notas';
        const splitNotes = doc.splitTextToSize(notesText, pageWidth - 2 * margin);
        
        splitNotes.forEach((line: string) => {
          // Verificar se precisamos de uma nova página
          if (y > doc.internal.pageSize.getHeight() - 20) {
            doc.addPage();
            y = 20;
          }
          
          addText(line, 10);
        });
        
        y += 10;
        addLine();
      }
      
      // Verificar se precisamos de uma nova página para sessões
      if (y > doc.internal.pageSize.getHeight() - 80) {
        doc.addPage();
        y = 20;
      }
      
      // Detalhes das sessões (incluído no completo e sessões)
      if (selectedReportType === 'completo' || selectedReportType === 'sessoes') {
        addText('DETALHES DAS SESSÕES', 14, true);
        
        if (filteredSessions.length > 0) {
          doc.autoTable({
            startY: y,
            head: [['Sessão', 'Data', 'Status', 'Notas']],
            body: filteredSessions.map((session, index) => [
              `#${index + 1}`,
              formatDateSafe(session.date),
              session.paid ? 'Pago' : 'Não Pago',
              session.notes || 'Sem notas'
            ]),
            margin: { left: margin, right: margin },
            headStyles: { fillColor: [63, 144, 148] },
            didDrawPage: (data: any) => {
              // Atualizar posição Y após a tabela
              y = data.cursor.y + 10;
            }
          });
        } else {
          addText('Nenhuma sessão registrada.');
          y += 10;
        }
      }
      
      // Verificar se precisamos de uma nova página para pagamentos
      if ((selectedReportType === 'completo' || selectedReportType === 'financeiro') && 
          y > doc.internal.pageSize.getHeight() - 80) {
        doc.addPage();
        y = 20;
      }
      
      // Histórico de pagamentos (incluído no completo e financeiro)
      if (selectedReportType === 'completo' || selectedReportType === 'financeiro') {
        addText('HISTÓRICO DE PAGAMENTOS', 14, true);
        
        if (filteredPayments.length > 0) {
          doc.autoTable({
            startY: y,
            head: [['Data', 'Valor', 'Descrição', 'Método']],
            body: filteredPayments.map(payment => [
              formatDateSafe(payment.data),
              `€${payment.valor.toFixed(2)}`,
              payment.descricao || '',
              payment.tipo || ''
            ]),
            margin: { left: margin, right: margin },
            headStyles: { fillColor: [63, 144, 148] }
          });
        } else {
          addText('Nenhum pagamento registrado.');
        }
      }
      
      // Rodapé - ajustado para evitar o erro de getNumberOfPages
      // Usar internal.pages.length em vez de getNumberOfPages()
      const pageCount = doc.internal.pages.length - 1; // -1 porque a contagem começa em 1
      for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i);
        
        // Adicionar número da página
        doc.setFontSize(10);
        doc.text(`Página ${i} de ${pageCount}`, pageWidth - margin, doc.internal.pageSize.getHeight() - 10);
        
        // Adicionar nome da clínica no rodapé
        doc.text('NeuroBalance - Relatório Clínico', margin, doc.internal.pageSize.getHeight() - 10);
      }
      
      // Salvar o PDF
      doc.save(`${reportTemplates.find(t => t.id === selectedReportType)?.title}_${client.nome || 'Cliente'}_${format(new Date(), 'dd-MM-yyyy')}.pdf`);
    } catch (error) {
      console.error('Erro ao gerar relatório PDF:', error);
      alert('Erro ao gerar relatório PDF');
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <Card className="glassmorphism">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="flex items-center gap-2">
          <FileText className="h-5 w-5" />
          <span>Relatórios</span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="templates" value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="mb-6 flex flex-wrap">
            <TabsTrigger value="templates">Templates</TabsTrigger>
            <TabsTrigger value="charts">Gráficos</TabsTrigger>
            <TabsTrigger value="attachments">Anexos</TabsTrigger>
            <TabsTrigger value="scheduled">Agendados</TabsTrigger>
            <TabsTrigger value="history">Histórico</TabsTrigger>
            <TabsTrigger value="compare">Comparar</TabsTrigger>
            <TabsTrigger value="share">Compartilhar</TabsTrigger>
            <TabsTrigger value="notes">Notas</TabsTrigger>
          </TabsList>
          
          <TabsContent value="templates">
            <div className="space-y-6">
              <div className="bg-white/30 backdrop-blur-sm p-4 md:p-6 rounded-lg border border-white/20">
                {/* Seletor de período */}
                <div className="mb-6">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4">
                    <h3 className="text-lg font-medium">Templates de Relatórios</h3>
                    
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex items-center gap-2 self-start"
                      onClick={() => setShowPeriodSelector(!showPeriodSelector)}
                    >
                      <Calendar className="h-4 w-4" />
                      <span>Período: {getPeriodTitle()}</span>
                    </Button>
                  </div>
                  
                  {showPeriodSelector && (
                    <div className="p-4 mb-4 border rounded-md bg-white/60">
                      <h4 className="font-medium mb-3 text-sm">Selecione o período do relatório</h4>
                      
                      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-2 mb-4">
                        <Button
                          variant={datePeriod === 'all' ? 'default' : 'outline'}
                          className={datePeriod === 'all' ? 'bg-[#3f9094] hover:bg-[#265255]' : ''}
                          size="sm"
                          onClick={() => setDatePeriod('all')}
                        >
                          Todo histórico
                        </Button>
                        
                        <Button
                          variant={datePeriod === 'month' ? 'default' : 'outline'}
                          className={datePeriod === 'month' ? 'bg-[#3f9094] hover:bg-[#265255]' : ''}
                          size="sm"
                          onClick={() => setDatePeriod('month')}
                        >
                          Último mês
                        </Button>
                        
                        <Button
                          variant={datePeriod === 'quarter' ? 'default' : 'outline'}
                          className={datePeriod === 'quarter' ? 'bg-[#3f9094] hover:bg-[#265255]' : ''}
                          size="sm"
                          onClick={() => setDatePeriod('quarter')}
                        >
                          Último trimestre
                        </Button>
                        
                        <Button
                          variant={datePeriod === 'halfyear' ? 'default' : 'outline'}
                          className={datePeriod === 'halfyear' ? 'bg-[#3f9094] hover:bg-[#265255]' : ''}
                          size="sm"
                          onClick={() => setDatePeriod('halfyear')}
                        >
                          Último semestre
                        </Button>
                        
                        <Button
                          variant={datePeriod === 'year' ? 'default' : 'outline'}
                          className={datePeriod === 'year' ? 'bg-[#3f9094] hover:bg-[#265255]' : ''}
                          size="sm"
                          onClick={() => setDatePeriod('year')}
                        >
                          Último ano
                        </Button>
                        
                        <Button
                          variant={datePeriod === 'custom' ? 'default' : 'outline'}
                          className={datePeriod === 'custom' ? 'bg-[#3f9094] hover:bg-[#265255]' : ''}
                          size="sm"
                          onClick={() => setDatePeriod('custom')}
                        >
                          Personalizado
                        </Button>
                      </div>
                      
                      {datePeriod === 'custom' && (
                        <div className="mt-4">
                          <Label className="text-sm mb-2 block">Intervalo de datas</Label>
                          <div className="flex flex-col sm:flex-row gap-2 sm:items-center">
                            <Popover>
                              <PopoverTrigger asChild>
                                <Button
                                  variant="outline"
                                  className="w-[160px] text-left"
                                >
                                  {dateRange.from ? format(dateRange.from, 'dd/MM/yyyy') : "Data inicial"}
                                </Button>
                              </PopoverTrigger>
                              <PopoverContent className="w-auto p-0">
                                <Calendar
                                  mode="single"
                                  selected={dateRange.from}
                                  onSelect={(date) => setDateRange(prev => ({ ...prev, from: date }))}
                                  initialFocus
                                />
                              </PopoverContent>
                            </Popover>
                            <div className="text-center">até</div>
                            <Popover>
                              <PopoverTrigger asChild>
                                <Button
                                  variant="outline"
                                  className="w-[160px] text-left"
                                >
                                  {dateRange.to ? format(dateRange.to, 'dd/MM/yyyy') : "Data final"}
                                </Button>
                              </PopoverTrigger>
                              <PopoverContent className="w-auto p-0">
                                <Calendar
                                  mode="single"
                                  selected={dateRange.to}
                                  onSelect={(date) => setDateRange(prev => ({ ...prev, to: date }))}
                                  initialFocus
                                />
                              </PopoverContent>
                            </Popover>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
                
                {/* Templates existentes */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
                  {reportTemplates.map((template) => (
                    <div 
                      key={template.id}
                      className={`p-4 rounded-lg border cursor-pointer transition-all ${
                        selectedReportType === template.id 
                          ? 'border-[#3f9094] bg-[#3f9094]/10' 
                          : 'border-gray-200 hover:border-[#3f9094]/50'
                      }`}
                      onClick={() => setSelectedReportType(template.id)}
                    >
                      <div className="flex items-center gap-3 mb-2">
                        <div className={`p-2 rounded-full ${
                          selectedReportType === template.id 
                            ? 'bg-[#3f9094] text-white' 
                            : 'bg-gray-100'
                        }`}>
                          {template.icon}
                        </div>
                        <h4 className="font-medium">{template.title}</h4>
                      </div>
                      <p className="text-sm text-gray-600">{template.description}</p>
                    </div>
                  ))}
                </div>
                
                <h3 className="text-sm font-semibold mb-2">Exportar Relatório</h3>
                <div className="flex flex-wrap items-center gap-2 mb-4">
                  <p className="text-gray-700 text-sm">
                    Modelo: <span className="font-medium">{reportTemplates.find(t => t.id === selectedReportType)?.title}</span>
                  </p>
                  <div className="mx-2 h-1 w-1 rounded-full bg-gray-300 hidden sm:block"></div>
                  <p className="text-gray-700 text-sm">
                    Período: <span className="font-medium">{getPeriodTitle()}</span>
                  </p>
                </div>
                
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button 
                      className="bg-[#3f9094] hover:bg-[#265255] flex items-center gap-2 w-full sm:w-auto"
                      disabled={isGenerating}
                    >
                      {isGenerating ? (
                        <span className="animate-spin mr-2">⏳</span>
                      ) : (
                        <Download className="h-4 w-4" />
                      )}
                      <span>Exportar Relatório</span>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={generateTextReportWithAttachments} className="flex items-center gap-2">
                      <FileText className="h-4 w-4" />
                      <span>Texto (.txt)</span>
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={generatePdfReportWithAttachments} className="flex items-center gap-2">
                      <File className="h-4 w-4" />
                      <span>PDF (.pdf)</span>
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>

              {sessions.length > 0 && (
                <div>
                  <h3 className="text-sm font-semibold mb-3">Resumo de Progresso</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                    <div className="bg-[#9e50b3]/10 p-4 rounded-lg">
                      <h4 className="text-xs text-[#9e50b3] font-medium mb-1">Sessões Realizadas</h4>
                      <p className="text-xl font-semibold">{sessions.length}</p>
                      {datePeriod !== 'all' && (
                        <p className="text-xs text-gray-500 mt-1">
                          {filteredSessions.length} no período selecionado
                        </p>
                      )}
                    </div>
                    <div className="bg-[#1088c4]/10 p-4 rounded-lg">
                      <h4 className="text-xs text-[#1088c4] font-medium mb-1">Total Pago</h4>
                      <p className="text-xl font-semibold">€{(client.total_pago || 0).toLocaleString()}</p>
                      {datePeriod !== 'all' && (
                        <p className="text-xs text-gray-500 mt-1">
                          €{filteredPayments.reduce((sum, p) => sum + (p.valor || 0), 0).toLocaleString()} no período
                        </p>
                      )}
                    </div>
                    <div className="bg-[#ecc249]/10 p-4 rounded-lg">
                      <h4 className="text-xs text-[#ecc249] font-medium mb-1">Próxima Sessão</h4>
                      <p className="text-sm font-medium">
                        {client.proxima_sessao ? formatDateSafe(client.proxima_sessao) : "Não agendada"}
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </TabsContent>
          
          <TabsContent value="charts">
            <ClientCharts 
              client={client} 
              sessions={datePeriod === 'all' ? sessions : filteredSessions} 
              payments={datePeriod === 'all' ? payments : filteredPayments} 
            />
          </TabsContent>
          
          <TabsContent value="attachments">
            <div className="bg-white/30 backdrop-blur-sm p-4 md:p-6 rounded-lg border border-white/20">
              <h3 className="text-lg font-medium mb-4">Anexos de Relatório</h3>
              <p className="text-gray-600 mb-4">
                Adicione arquivos que deseja anexar aos seus relatórios. Os arquivos serão listados na seção de anexos do relatório gerado.
              </p>
              <AttachmentUploader 
                client={client} 
                onAttachmentAdd={handleAttachmentAdd} 
              />
            </div>
          </TabsContent>
          
          <TabsContent value="scheduled">
            <div className="bg-white/30 backdrop-blur-sm p-4 md:p-6 rounded-lg border border-white/20">
              <h3 className="text-lg font-medium mb-4">Relatórios Agendados</h3>
              <p className="text-gray-600 mb-6">
                Configure relatórios para serem gerados automaticamente em intervalos específicos. Você pode agendar diferentes tipos de relatórios com frequências variadas.
              </p>
              <ScheduledReports client={client} />
            </div>
          </TabsContent>
          
          <TabsContent value="history">
            <div className="bg-white/30 backdrop-blur-sm p-4 md:p-6 rounded-lg border border-white/20">
              <h3 className="text-lg font-medium mb-4">Histórico de Relatórios</h3>
              <p className="text-gray-600 mb-6">
                Visualize e gerencie relatórios gerados anteriormente para este cliente.
              </p>
              <ReportHistory client={client} />
            </div>
          </TabsContent>
          
          <TabsContent value="compare">
            <div className="bg-white/30 backdrop-blur-sm p-4 md:p-6 rounded-lg border border-white/20">
              <h3 className="text-lg font-medium mb-4">Comparação de Relatórios</h3>
              <p className="text-gray-600 mb-6">
                Compare dois relatórios para visualizar diferenças e evolução do cliente.
              </p>
              <ReportCompare client={client} />
            </div>
          </TabsContent>
          
          <TabsContent value="share">
            <div className="bg-white/30 backdrop-blur-sm p-4 md:p-6 rounded-lg border border-white/20">
              <h3 className="text-lg font-medium mb-4">Compartilhar Relatórios</h3>
              <p className="text-gray-600 mb-6">
                Compartilhe relatórios com o cliente ou outros profissionais através de diferentes métodos.
              </p>
              <ReportShare client={client} />
            </div>
          </TabsContent>
          
          <TabsContent value="notes">
            <div className="bg-white/30 backdrop-blur-sm p-4 md:p-6 rounded-lg border border-white/20">
              <h3 className="text-lg font-medium mb-4">Notas do Cliente</h3>
              <Textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Adicione notas sobre o cliente aqui..."
                className="min-h-[250px] mb-4"
              />
              <Button 
                onClick={handleSaveNotes}
                className="bg-[#3f9094] hover:bg-[#265255]"
              >
                Salvar Notas
              </Button>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};

export default ClientReports;
