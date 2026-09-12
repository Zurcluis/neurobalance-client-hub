import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { FileText, Download, File, Calendar, Loader2, LucideIcon, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ClientDetailData, Session, Payment } from '@/types/client';
import { format, isValid, parseISO, subMonths, isBefore, isAfter, startOfDay, endOfDay } from 'date-fns';
import { pt } from 'date-fns/locale';
import { Textarea } from '@/components/ui/textarea';
import type jsPDF from 'jspdf';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import ClientCharts from './ClientCharts';
import AttachmentUploader from './AttachmentUploader';
import ScheduledReports from './ScheduledReports';
import SessionSummaryDialog from './SessionSummaryDialog';
import { readClientMoods } from '@/utils/sessionSummary';
import ReportHistory from './ReportHistory';
import ReportCompare from './ReportCompare';
import ReportShare from './ReportShare';
import { Label } from '@/components/ui/label';
import { Calendar as CalendarPicker } from '@/components/ui/calendar';
import { toast } from 'sonner';
import KpiCard from '@/components/shared/KpiCard';
import { formatCurrency } from '@/utils/formatUtils';
import { recordClientReport } from './reportHistoryStore';
import type { StoredReportType, StoredReportFormat } from './reportHistoryStore';

interface ClientReportsProps {
  client: ClientDetailData;
  sessions: Session[];
  payments: Payment[];
}

interface JsPDFWithAutoTable extends jsPDF {
  autoTable: (options: Record<string, unknown>) => jsPDF;
}

type ReportType = StoredReportType;

interface ReportTemplate {
  id: ReportType;
  title: string;
  description: string;
  icon: LucideIcon;
}

type DatePeriod = 'all' | 'month' | 'quarter' | 'halfyear' | 'year' | 'custom';

interface DateRange {
  from: Date | undefined;
  to: Date | undefined;
}

const periodOptions: { value: DatePeriod; label: string }[] = [
  { value: 'all', label: 'Todo histórico' },
  { value: 'month', label: 'Último mês' },
  { value: 'quarter', label: 'Último trimestre' },
  { value: 'halfyear', label: 'Último semestre' },
  { value: 'year', label: 'Último ano' },
  { value: 'custom', label: 'Personalizado' }
];

const reportTemplates: ReportTemplate[] = [
  {
    id: 'completo',
    title: 'Relatório Completo',
    description: 'Inclui todos os dados do cliente, sessões e pagamentos',
    icon: FileText
  },
  {
    id: 'financeiro',
    title: 'Relatório Financeiro',
    description: 'Foco nos pagamentos e resumo financeiro',
    icon: File
  },
  {
    id: 'progresso',
    title: 'Relatório de Progresso',
    description: 'Resumo do progresso e evolução do cliente',
    icon: FileText
  },
  {
    id: 'sessoes',
    title: 'Histórico de Sessões',
    description: 'Detalhes apenas das sessões realizadas',
    icon: FileText
  }
];

const TabPanel = ({ title, description, children }: { title: string; description: string; children: React.ReactNode }) => (
  <div className="rounded-lg border bg-muted/40 p-4 md:p-6 min-w-0">
    <h3 className="text-base font-semibold mb-1">{title}</h3>
    <p className="text-sm text-muted-foreground mb-4 max-w-3xl">{description}</p>
    {children}
  </div>
);

const formatDateSafe = (dateStr: string | undefined | null) => {
  if (!dateStr) return '';
  try {
    const date = parseISO(dateStr);
    if (!isValid(date)) return 'Data inválida';
    return format(date, 'dd/MM/yyyy');
  } catch {
    return 'Data inválida';
  }
};

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
  const [isSummaryOpen, setIsSummaryOpen] = useState(false);

  const summarySessions = useMemo(
    () =>
      sessions.map(session => ({
        date: session.date,
        notes: session.notes,
        status: session.status,
      })),
    [sessions]
  );

  const handleSaveSummary = (summaryText: string) => {
    if (typeof client.id !== 'number') {
      toast.error('Não foi possível guardar o resumo');
      return;
    }

    recordClientReport({
      id: `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
      clientId: client.id,
      title: 'Resumo Automático',
      type: 'progresso',
      format: 'txt',
      createdAt: new Date().toISOString(),
      fileName: `Resumo_Automatico_${format(new Date(), 'yyyy-MM-dd')}`,
      fileSize: new Blob([summaryText]).size,
      content: summaryText,
      metrics: buildMetrics()
    });
    toast.success('Resumo guardado no histórico de relatórios');
    setIsSummaryOpen(false);
  };

  const handleSaveNotes = () => {
    try {
      const clients = JSON.parse(localStorage.getItem('clients') || '[]') as ClientDetailData[];
      const updatedClients = clients.map((c) => {
        if (c.id === client.id) {
          return { ...c, notas: notes };
        }
        return c;
      });
      localStorage.setItem('clients', JSON.stringify(updatedClients));
      toast.success('Notas guardadas com sucesso');
    } catch {
      toast.error('Não foi possível guardar as notas');
    }
  };

  const getPeriodTitle = (): string => {
    switch (datePeriod) {
      case 'all':
        return 'Todo o Histórico';
      case 'month':
        return 'Último Mês';
      case 'quarter':
        return 'Último Trimestre';
      case 'halfyear':
        return 'Último Semestre';
      case 'year':
        return 'Último Ano';
      case 'custom':
        if (dateRange.from && dateRange.to) {
          return `De ${format(dateRange.from, 'dd/MM/yyyy')} até ${format(dateRange.to, 'dd/MM/yyyy')}`;
        }
        return 'Período Personalizado';
    }
  };

  const { filteredSessions, filteredPayments } = useMemo(() => {
    if (datePeriod === 'all') {
      return { filteredSessions: sessions, filteredPayments: payments };
    }

    let fromDate: Date | undefined;
    let toDate: Date = endOfDay(new Date());

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
        toDate = dateRange.to ? endOfDay(dateRange.to) : endOfDay(new Date());
        if (!fromDate && !dateRange.to) {
          return { filteredSessions: sessions, filteredPayments: payments };
        }
        break;
    }

    const inRange = (date: Date) => {
      const afterFrom = fromDate ? isAfter(date, startOfDay(fromDate)) : true;
      const beforeTo = isValid(toDate) ? isBefore(date, toDate) : true;
      return afterFrom && beforeTo;
    };

    return {
      filteredSessions: sessions.filter((session) => {
        const sessionDate = session.date ? parseISO(session.date) : null;
        return sessionDate && isValid(sessionDate) ? inRange(sessionDate) : false;
      }),
      filteredPayments: payments.filter((payment) => {
        const paymentDate = payment.data ? parseISO(payment.data) : null;
        return paymentDate && isValid(paymentDate) ? inRange(paymentDate) : false;
      })
    };
  }, [sessions, payments, datePeriod, dateRange]);

  const totals = useMemo(() => {
    const totalPaid = filteredPayments.reduce((sum, payment) => sum + (payment.valor || 0), 0);
    const averagePerSession = filteredSessions.length > 0 ? totalPaid / filteredSessions.length : 0;
    return { totalPaid, averagePerSession };
  }, [filteredSessions, filteredPayments]);

  const buildMetrics = () => ({
    sessionsCount: filteredSessions.length,
    paymentsTotal: Number(totals.totalPaid.toFixed(2)),
    averagePayment: Number(totals.averagePerSession.toFixed(2)),
    completionRate: client.max_sessoes && client.max_sessoes > 0
      ? Number(((filteredSessions.length / client.max_sessoes) * 100).toFixed(1))
      : 0
  });

  const generateReportContent = (type: ReportType): string => {
    const completionRate = client.max_sessoes && client.max_sessoes > 0
      ? (filteredSessions.length / client.max_sessoes) * 100
      : 0;

    const currentDate = format(new Date(), 'dd MMMM yyyy', { locale: pt });
    const periodTitle = getPeriodTitle();

    let content = '';

    content += `RELATÓRIO ${reportTemplates.find(t => t.id === type)?.title.toUpperCase()}\n\n`;
    content += `Data: ${currentDate}\n`;
    content += `Período: ${periodTitle}\n\n`;

    if (type !== 'financeiro') {
      content += `Nome do Cliente: ${client.nome || ''}\n`;
      content += `Email: ${client.email || ''}\n`;
      content += `Telefone: ${client.telefone || ''}\n`;

      if (client.data_nascimento) {
        content += `Data de Nascimento: ${formatDateSafe(client.data_nascimento)}\n`;
      }
    }

    if (type !== 'financeiro') {
      content += `\nRESUMO DE SESSÕES\n`;
      content += `Total de Sessões Realizadas: ${filteredSessions.length}\n`;

      if (client.max_sessoes) {
        content += `Sessões Planeadas: ${client.max_sessoes}\n`;
        content += `Taxa de Conclusão: ${completionRate.toFixed(1)}%\n`;
      }
    }

    if (type === 'completo' || type === 'financeiro') {
      content += `\nRESUMO FINANCEIRO\n`;
      content += `Total Pago: ${formatCurrency(totals.totalPaid)}\n`;
      content += `Média por Sessão: ${formatCurrency(totals.averagePerSession)}\n\n`;
    }

    if (type === 'completo' || type === 'progresso') {
      content += `NOTAS DO CLIENTE:\n${notes || 'Sem notas'}\n\n`;
    }

    if (type === 'completo' || type === 'sessoes') {
      content += `DETALHES DAS SESSÕES:\n`;
      filteredSessions.forEach((session, index) => {
        content += `\nSessão #${index + 1} - ${formatDateSafe(session.date)}\n`;
        content += `${session.paid ? 'Pago' : 'Não Pago'}\n`;
        content += session.notes ? `Notas: ${session.notes}\n` : 'Sem notas\n';
      });
    }

    if (type === 'completo' || type === 'financeiro') {
      content += `\nHISTÓRICO DE PAGAMENTOS:\n`;
      filteredPayments.forEach((payment) => {
        content += `\n${formatDateSafe(payment.data)} - ${formatCurrency(payment.valor)}\n`;
        content += `${payment.descricao || ''} (${payment.tipo || ''})\n`;
      });
    }

    return content;
  };

  const handleAttachmentAdd = (file: File) => {
    setAttachments(prev => [...prev, file]);
  };

  const recordGeneratedReport = (reportType: ReportType, reportFormat: StoredReportFormat, content: string) => {
    if (typeof client.id !== 'number') return;

    recordClientReport({
      id: `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
      clientId: client.id,
      title: reportTemplates.find(t => t.id === reportType)?.title || 'Relatório',
      type: reportType,
      format: reportFormat,
      createdAt: new Date().toISOString(),
      fileName: `${reportTemplates.find(t => t.id === reportType)?.title || 'Relatorio'}_${format(new Date(), 'yyyy-MM-dd')}`,
      fileSize: reportFormat === 'txt' ? new Blob([content]).size : 0,
      content,
      metrics: buildMetrics()
    });
  };

  const generateTextReportWithAttachments = () => {
    setIsGenerating(true);
    try {
      let content = generateReportContent(selectedReportType);

      if (attachments.length > 0) {
        content += '\nANEXOS:\n';
        attachments.forEach((file, index) => {
          content += `${index + 1}. ${file.name} (${(file.size / 1024).toFixed(2)} KB)\n`;
        });
      }

      const blob = new Blob([content], { type: 'text/plain' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${reportTemplates.find(t => t.id === selectedReportType)?.title}_${client.nome || 'Cliente'}_${format(new Date(), 'yyyy-MM-dd')}.txt`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      recordGeneratedReport(selectedReportType, 'txt', content);
      toast.success('Relatório de texto exportado com sucesso');
    } catch {
      toast.error('Erro ao gerar o relatório de texto');
    } finally {
      setIsGenerating(false);
    }
  };

  const generatePdfReportWithAttachments = async () => {
    setIsGenerating(true);
    try {
      // Carrega jsPDF + plugin de tabelas apenas quando o utilizador exporta
      const [{ default: JsPDF }] = await Promise.all([
        import('jspdf'),
        import('jspdf-autotable'),
      ]);
      const doc = new JsPDF() as JsPDFWithAutoTable;
      const pageWidth = doc.internal.pageSize.getWidth();
      const margin = 20;
      let y = 20;

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

      const reportTitle = reportTemplates.find(t => t.id === selectedReportType)?.title.toUpperCase() || 'RELATÓRIO';
      addText(reportTitle, 18, true);
      y += 10;

      const currentDate = format(new Date(), 'dd MMMM yyyy', { locale: pt });
      addText(`Data: ${currentDate}`);
      addText(`Período: ${getPeriodTitle()}`);

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

      if (selectedReportType !== 'financeiro') {
        addText('RESUMO DE SESSÕES', 14, true);

        const completionRate = client.max_sessoes && client.max_sessoes > 0
          ? (filteredSessions.length / client.max_sessoes) * 100
          : 0;

        addText(`Total de Sessões Realizadas: ${filteredSessions.length}`);
        if (client.max_sessoes) {
          addText(`Sessões Planeadas: ${client.max_sessoes}`);
          addText(`Taxa de Conclusão: ${completionRate.toFixed(1)}%`);
        }

        y += 10;
        addLine();
      }

      if (selectedReportType === 'completo' || selectedReportType === 'financeiro') {
        addText('RESUMO FINANCEIRO', 14, true);

        addText(`Total Pago: ${formatCurrency(totals.totalPaid)}`);
        addText(`Média por Sessão: ${formatCurrency(totals.averagePerSession)}`);

        y += 10;
        addLine();
      }

      if (selectedReportType === 'completo' || selectedReportType === 'progresso') {
        addText('NOTAS DO CLIENTE', 14, true);

        const notesText = notes || 'Sem notas';
        const splitNotes = doc.splitTextToSize(notesText, pageWidth - 2 * margin);

        splitNotes.forEach((line: string) => {
          if (y > doc.internal.pageSize.getHeight() - 20) {
            doc.addPage();
            y = 20;
          }

          addText(line, 10);
        });

        y += 10;
        addLine();
      }

      if (y > doc.internal.pageSize.getHeight() - 80) {
        doc.addPage();
        y = 20;
      }

      if (selectedReportType === 'completo' || selectedReportType === 'sessoes') {
        addText('DETALHES DAS SESSÕES', 14, true);

        if (filteredSessions.length > 0) {
          doc.autoTable({
            startY: y,
            head: [['Sessão', 'Data', 'Estado', 'Notas']],
            body: filteredSessions.map((session, index) => [
              `#${index + 1}`,
              formatDateSafe(session.date),
              session.paid ? 'Pago' : 'Não Pago',
              session.notes || 'Sem notas'
            ]),
            margin: { left: margin, right: margin },
            headStyles: { fillColor: [63, 144, 148] },
            didDrawPage: (data: { cursor: { y: number } }) => {
              y = data.cursor.y + 10;
            }
          });
        } else {
          addText('Nenhuma sessão registada.');
          y += 10;
        }
      }

      if ((selectedReportType === 'completo' || selectedReportType === 'financeiro') &&
          y > doc.internal.pageSize.getHeight() - 80) {
        doc.addPage();
        y = 20;
      }

      if (selectedReportType === 'completo' || selectedReportType === 'financeiro') {
        addText('HISTÓRICO DE PAGAMENTOS', 14, true);

        if (filteredPayments.length > 0) {
          doc.autoTable({
            startY: y,
            head: [['Data', 'Valor', 'Descrição', 'Método']],
            body: filteredPayments.map(payment => [
              formatDateSafe(payment.data),
              formatCurrency(payment.valor),
              payment.descricao || '',
              payment.tipo || ''
            ]),
            margin: { left: margin, right: margin },
            headStyles: { fillColor: [63, 144, 148] }
          });
        } else {
          addText('Nenhum pagamento registado.');
        }
      }

      const pageCount = doc.internal.pages.length - 1;
      for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i);

        doc.setFontSize(10);
        doc.text(`Página ${i} de ${pageCount}`, pageWidth - margin, doc.internal.pageSize.getHeight() - 10);
        doc.text('NeuroBalance - Relatório Clínico', margin, doc.internal.pageSize.getHeight() - 10);
      }

      doc.save(`${reportTemplates.find(t => t.id === selectedReportType)?.title}_${client.nome || 'Cliente'}_${format(new Date(), 'dd-MM-yyyy')}.pdf`);

      recordGeneratedReport(selectedReportType, 'pdf', generateReportContent(selectedReportType));
      toast.success('Relatório PDF exportado com sucesso');
    } catch {
      toast.error('Erro ao gerar o relatório PDF');
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <Card className="glassmorphism">
      <CardHeader className="flex flex-row items-center gap-3">
        <div className="h-10 w-10 rounded-lg flex items-center justify-center shrink-0 bg-primary/10 text-primary">
          <FileText className="h-5 w-5" />
        </div>
        <CardTitle className="text-base font-semibold">Relatórios</CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="templates" value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="mb-6 flex flex-wrap h-auto">
            <TabsTrigger value="templates">Templates</TabsTrigger>
            <TabsTrigger value="charts">Gráficos</TabsTrigger>
            <TabsTrigger value="attachments">Anexos</TabsTrigger>
            <TabsTrigger value="scheduled">Agendados</TabsTrigger>
            <TabsTrigger value="history">Histórico</TabsTrigger>
            <TabsTrigger value="compare">Comparar</TabsTrigger>
            <TabsTrigger value="share">Partilhar</TabsTrigger>
            <TabsTrigger value="notes">Notas</TabsTrigger>
          </TabsList>

          <TabsContent value="templates">
            <div className="space-y-6 min-w-0">
              <div className="rounded-lg border bg-muted/40 p-4 md:p-6">
                <div className="mb-6">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4">
                    <h3 className="text-base font-semibold">Templates de Relatórios</h3>

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
                    <div className="p-4 mb-4 rounded-md border bg-card">
                      <h4 className="text-sm font-semibold mb-3">Selecione o período do relatório</h4>

                      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-2 mb-4">
                        {periodOptions.map((option) => (
                          <Button
                            key={option.value}
                            variant={datePeriod === option.value ? 'default' : 'outline'}
                            size="sm"
                            onClick={() => setDatePeriod(option.value)}
                          >
                            {option.label}
                          </Button>
                        ))}
                      </div>

                      {datePeriod === 'custom' && (
                        <div className="mt-4">
                          <Label className="text-sm mb-2 block">Intervalo de datas</Label>
                          <div className="flex flex-col sm:flex-row gap-2 sm:items-center">
                            <Popover>
                              <PopoverTrigger asChild>
                                <Button variant="outline" className="w-[160px] text-left font-normal">
                                  {dateRange.from ? format(dateRange.from, 'dd/MM/yyyy') : 'Data inicial'}
                                </Button>
                              </PopoverTrigger>
                              <PopoverContent className="w-auto p-0">
                                <CalendarPicker
                                  mode="single"
                                  selected={dateRange.from}
                                  onSelect={(date) => setDateRange(prev => ({ ...prev, from: date }))}
                                  initialFocus
                                />
                              </PopoverContent>
                            </Popover>
                            <div className="text-center text-sm text-muted-foreground">até</div>
                            <Popover>
                              <PopoverTrigger asChild>
                                <Button variant="outline" className="w-[160px] text-left font-normal">
                                  {dateRange.to ? format(dateRange.to, 'dd/MM/yyyy') : 'Data final'}
                                </Button>
                              </PopoverTrigger>
                              <PopoverContent className="w-auto p-0">
                                <CalendarPicker
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

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
                  {reportTemplates.map((template) => {
                    const Icon = template.icon;
                    const isSelected = selectedReportType === template.id;

                    return (
                      <button
                        key={template.id}
                        type="button"
                        className={`p-4 rounded-lg border text-left transition-colors min-w-0 ${
                          isSelected
                            ? 'border-primary bg-primary/5'
                            : 'border-border hover:border-primary/50'
                        }`}
                        onClick={() => setSelectedReportType(template.id)}
                      >
                        <div className="flex items-center gap-3 mb-2">
                          <div className={`p-2 rounded-lg flex items-center justify-center ${
                            isSelected
                              ? 'bg-primary text-primary-foreground'
                              : 'bg-muted text-muted-foreground'
                          }`}>
                            <Icon className="h-4 w-4" />
                          </div>
                          <h4 className="font-medium text-sm">{template.title}</h4>
                        </div>
                        <p className="text-sm text-muted-foreground">{template.description}</p>
                      </button>
                    );
                  })}
                </div>

                <h3 className="text-sm font-semibold mb-2">Exportar Relatório</h3>
                <div className="flex flex-wrap items-center gap-2 mb-4">
                  <p className="text-sm text-muted-foreground">
                    Modelo: <span className="font-medium text-foreground">{reportTemplates.find(t => t.id === selectedReportType)?.title}</span>
                  </p>
                  <div className="mx-2 h-1 w-1 rounded-full bg-muted-foreground/40 hidden sm:block" />
                  <p className="text-sm text-muted-foreground">
                    Período: <span className="font-medium text-foreground">{getPeriodTitle()}</span>
                  </p>
                </div>

                <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                  <Button
                    variant="outline"
                    className="flex items-center gap-2 w-full sm:w-auto"
                    onClick={() => setIsSummaryOpen(true)}
                  >
                    <Sparkles className="h-4 w-4" />
                    <span>Gerar resumo</span>
                  </Button>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        className="flex items-center gap-2 w-full sm:w-auto"
                        disabled={isGenerating}
                      >
                        {isGenerating ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <Download className="h-4 w-4" />
                        )}
                        <span>{isGenerating ? 'A exportar...' : 'Exportar Relatório'}</span>
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
              </div>

              {sessions.length > 0 && (
                <div>
                  <h3 className="text-sm font-semibold mb-3">Resumo de Progresso</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                    <KpiCard
                      icon={Calendar}
                      label="Sessões Realizadas"
                      value={sessions.length}
                      sub={datePeriod !== 'all' ? `${filteredSessions.length} no período selecionado` : undefined}
                      tone="teal"
                    />
                    <KpiCard
                      icon={File}
                      label="Total Pago"
                      value={formatCurrency(totals.totalPaid)}
                      sub={datePeriod !== 'all' ? `Total histórico: ${formatCurrency(client.total_pago || 0)}` : undefined}
                      tone="blue"
                    />
                    <KpiCard
                      icon={Calendar}
                      label="Próxima Sessão"
                      value={client.proxima_sessao ? formatDateSafe(client.proxima_sessao) : 'Não agendada'}
                      tone="purple"
                    />
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
            <TabPanel
              title="Anexos de Relatório"
              description="Adicione ficheiros que deseja anexar aos seus relatórios. Os ficheiros serão listados na secção de anexos do relatório gerado."
            >
              <AttachmentUploader
                client={client}
                onAttachmentAdd={handleAttachmentAdd}
              />
            </TabPanel>
          </TabsContent>

          <TabsContent value="scheduled">
            <TabPanel
              title="Relatórios Agendados"
              description="Configure relatórios para serem gerados automaticamente em intervalos específicos. Pode agendar diferentes tipos de relatórios com frequências variadas."
            >
              <ScheduledReports client={client} />
            </TabPanel>
          </TabsContent>

          <TabsContent value="history">
            <TabPanel
              title="Histórico de Relatórios"
              description="Visualize e gere relatórios gerados anteriormente para este cliente."
            >
              <ReportHistory client={client} />
            </TabPanel>
          </TabsContent>

          <TabsContent value="compare">
            <TabPanel
              title="Comparação de Relatórios"
              description="Compare dois relatórios para visualizar diferenças e a evolução do cliente."
            >
              <ReportCompare client={client} />
            </TabPanel>
          </TabsContent>

          <TabsContent value="share">
            <TabPanel
              title="Partilhar Relatórios"
              description="Partilhe relatórios com o cliente ou outros profissionais através de diferentes métodos."
            >
              <ReportShare client={client} />
            </TabPanel>
          </TabsContent>

          <TabsContent value="notes">
            <TabPanel title="Notas do Cliente" description="Notas clínicas gerais sobre o cliente, incluídas nos relatórios completo e de progresso.">
              <Textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Adicione notas sobre o cliente aqui..."
                className="min-h-[250px] mb-4 bg-card"
              />
              <Button
                onClick={handleSaveNotes}
              >
                Guardar Notas
              </Button>
            </TabPanel>
          </TabsContent>
        </Tabs>
      </CardContent>

      <SessionSummaryDialog
        open={isSummaryOpen}
        onOpenChange={setIsSummaryOpen}
        clientName={client.nome || ''}
        sessions={summarySessions}
        moods={isSummaryOpen ? readClientMoods(client.id) : []}
        onSave={handleSaveSummary}
      />
    </Card>
  );
};

export default ClientReports;
