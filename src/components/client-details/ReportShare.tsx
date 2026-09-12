import { useState, useMemo } from 'react';
import { ClientDetailData } from '@/types/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';
import {
  Mail,
  FileText,
  File,
  Send,
  Download
} from 'lucide-react';
import { format } from 'date-fns';
import { toast } from 'sonner';
import { EmptyState } from '@/components/shared/EmptyState';
import { readClientReports } from './reportHistoryStore';
import type { StoredReport, StoredReportFormat } from './reportHistoryStore';

interface ReportShareProps {
  client: ClientDetailData;
}

const formatIcons: Record<StoredReportFormat, typeof File> = {
  pdf: File,
  txt: FileText
};

const ReportShare = ({ client }: ReportShareProps) => {
  const clientId = typeof client.id === 'number' ? client.id : 0;

  const availableReports = useMemo(() => readClientReports(clientId), [clientId]);
  const [selectedReportIds, setSelectedReportIds] = useState<Set<string>>(new Set());
  const [emailAddresses, setEmailAddresses] = useState('');
  const [subject, setSubject] = useState(`Relatório do Cliente - ${client.nome}`);
  const [message, setMessage] = useState(
    `Olá,\n\nSegue em anexo o relatório do cliente ${client.nome}.\n\nMelhores cumprimentos,\nEquipa NeuroBalance`
  );
  const [expiration, setExpiration] = useState<'7' | '30' | 'never'>('7');

  const selectedReports = availableReports.filter(report => selectedReportIds.has(report.id));

  const toggleReport = (id: string, checked: boolean) => {
    setSelectedReportIds(prev => {
      const next = new Set(prev);
      if (checked) {
        next.add(id);
      } else {
        next.delete(id);
      }
      return next;
    });
  };

  const reportMetaText = (report: StoredReport) =>
    `${format(new Date(report.createdAt), 'dd/MM/yyyy')} • ${report.format.toUpperCase()}`;

  const handleEmailShare = () => {
    const recipients = emailAddresses.split(',').map(email => email.trim()).filter(Boolean);

    if (recipients.length === 0) {
      toast.error('Indique pelo menos um destinatário');
      return;
    }

    if (recipients.some(email => !email.includes('@'))) {
      toast.error('Existem endereços de e-mail inválidos');
      return;
    }

    if (selectedReports.length === 0) {
      toast.error('Selecione pelo menos um relatório');
      return;
    }

    const body = [
      message,
      '',
      'Relatórios incluídos:',
      ...selectedReports.map(report => `- ${report.title} (${format(new Date(report.createdAt), 'dd/MM/yyyy')})`),
      expiration === 'never' ? '' : `Esta partilha é válida por ${expiration} dias.`
    ].filter(Boolean).join('\n');

    const mailtoUrl = `mailto:${recipients.join(',')}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    window.location.href = mailtoUrl;

    toast.success('Cliente de e-mail aberto com a mensagem pré-preenchida');
  };

  const downloadReport = (report: StoredReport) => {
    const content = report.content || 'Sem conteúdo disponível';
    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${report.fileName || report.title.replace(/\s+/g, '_')}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleDownloadSelected = () => {
    if (selectedReports.length === 0) {
      toast.error('Selecione pelo menos um relatório');
      return;
    }

    selectedReports.forEach(downloadReport);
    toast.success(`${selectedReports.length} relatório(s) descarregado(s)`);
  };

  if (availableReports.length === 0) {
    return (
      <EmptyState
        icon={<FileText className="h-10 w-10" />}
        title="Sem relatórios disponíveis"
        description="Exporte relatórios na secção Templates para os poder partilhar ou descarregar aqui."
      />
    );
  }

  return (
    <div className="space-y-6 min-w-0">
      <Tabs defaultValue="email">
        <TabsList className="mb-6 flex flex-wrap w-full h-auto">
          <TabsTrigger value="email" className="flex items-center gap-2 flex-1">
            <Mail className="h-4 w-4" />
            <span className="hidden sm:inline">E-mail</span>
          </TabsTrigger>
          <TabsTrigger value="download" className="flex items-center gap-2 flex-1">
            <Download className="h-4 w-4" />
            <span className="hidden sm:inline">Descarregar</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="email">
          <div className="space-y-4 min-w-0">
            <div className="grid gap-2">
              <Label htmlFor="recipients">Destinatários (separados por vírgula)</Label>
              <Input
                id="recipients"
                placeholder="cliente@email.com, colega@clinica.com"
                value={emailAddresses}
                onChange={(e) => setEmailAddresses(e.target.value)}
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="subject">Assunto</Label>
              <Input
                id="subject"
                placeholder="Assunto do e-mail"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="message">Mensagem</Label>
              <Textarea
                id="message"
                placeholder="Escreva uma mensagem..."
                className="min-h-[120px]"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
              />
            </div>

            <div className="space-y-4">
              <h4 className="text-sm font-semibold">Selecione os relatórios a incluir:</h4>
              <div className="grid gap-3">
                {availableReports.map(report => {
                  const FormatIcon = formatIcons[report.format];

                  return (
                    <div
                      key={report.id}
                      className="flex items-center gap-2 rounded-md border bg-card p-3 min-w-0"
                    >
                      <Checkbox
                        id={`report-${report.id}`}
                        checked={selectedReportIds.has(report.id)}
                        onCheckedChange={(checked) => toggleReport(report.id, !!checked)}
                      />
                      <label
                        htmlFor={`report-${report.id}`}
                        className="flex flex-1 min-w-0 items-center gap-2 text-sm font-medium leading-none cursor-pointer"
                      >
                        <FormatIcon className="h-4 w-4 shrink-0" />
                        <span className="truncate">{report.title}</span>
                      </label>
                      <p className="text-xs text-muted-foreground whitespace-nowrap">
                        {reportMetaText(report)}
                      </p>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="expiration">Validade indicada na mensagem</Label>
              <Select value={expiration} onValueChange={(value) => setExpiration(value as '7' | '30' | 'never')}>
                <SelectTrigger id="expiration" className="w-full sm:w-[240px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="7">Válido por 7 dias</SelectItem>
                  <SelectItem value="30">Válido por 30 dias</SelectItem>
                  <SelectItem value="never">Sem prazo indicado</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <Button
              onClick={handleEmailShare}
              className="w-full mt-4"
              disabled={!emailAddresses}
            >
              <Send className="h-4 w-4 mr-2" />
              Preparar e-mail
            </Button>
          </div>
        </TabsContent>

        <TabsContent value="download">
          <div className="space-y-4 min-w-0">
            <div className="rounded-md border bg-card p-4">
              <h3 className="text-sm font-semibold mb-2">Descarregar Relatórios</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Selecione os relatórios que deseja descarregar.
              </p>

              <div className="grid gap-3 mt-4">
                {availableReports.map(report => (
                  <div
                    key={report.id}
                    className="flex flex-col sm:flex-row items-start sm:items-center sm:justify-between p-3 rounded-md border bg-muted/30 min-w-0"
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <Checkbox
                        id={`download-${report.id}`}
                        checked={selectedReportIds.has(report.id)}
                        onCheckedChange={(checked) => toggleReport(report.id, !!checked)}
                      />
                      <label htmlFor={`download-${report.id}`} className="cursor-pointer min-w-0">
                        <span className="block text-sm font-medium truncate">{report.title}</span>
                        <span className="block text-xs text-muted-foreground">
                          {reportMetaText(report)}
                        </span>
                      </label>
                    </div>

                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-8 w-8 p-0 text-muted-foreground shrink-0 sm:ml-2"
                      onClick={() => downloadReport(report)}
                    >
                      <Download className="h-4 w-4" />
                      <span className="sr-only">Descarregar {report.title}</span>
                    </Button>
                  </div>
                ))}
              </div>

              <div className="flex justify-end mt-6">
                <Button
                  className="w-full sm:w-auto"
                  onClick={handleDownloadSelected}
                >
                  <Download className="h-4 w-4 mr-2" />
                  Descarregar Selecionados
                </Button>
              </div>
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default ReportShare;
