import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { CalendarIcon, Clock, Bell, CheckCircle, AlertCircle } from 'lucide-react';
import { ClientDetailData } from '@/types/client';
import { format } from 'date-fns';
import { pt } from 'date-fns/locale';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { toast } from 'sonner';
import { EmptyState } from '@/components/shared/EmptyState';
import { ConfirmDialog } from '@/components/shared/ConfirmDialog';
import { CalendarClock } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ScheduledReportsProps {
  client: ClientDetailData;
}

type Frequency = 'weekly' | 'biweekly' | 'monthly' | 'quarterly';
type ReportType = 'completo' | 'financeiro' | 'progresso' | 'sessoes';
type DeliveryMethod = 'email' | 'download';

interface ScheduledReport {
  id: string;
  name: string;
  frequency: Frequency;
  reportType: ReportType;
  delivery: DeliveryMethod;
  recipients?: string[];
  startDate: string;
  isActive: boolean;
}

const frequencyNames: Record<Frequency, string> = {
  weekly: 'Semanal',
  biweekly: 'Quinzenal',
  monthly: 'Mensal',
  quarterly: 'Trimestral'
};

const reportTypeNames: Record<ReportType, string> = {
  completo: 'Relatório Completo',
  financeiro: 'Relatório Financeiro',
  progresso: 'Relatório de Progresso',
  sessoes: 'Histórico de Sessões'
};

const STORAGE_KEY_PREFIX = 'neurobalance_scheduled_reports_';

const readScheduled = (clientId: number): ScheduledReport[] => {
  try {
    const raw = localStorage.getItem(`${STORAGE_KEY_PREFIX}${clientId}`);
    if (!raw) return [];
    const parsed: unknown = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as ScheduledReport[]) : [];
  } catch {
    return [];
  }
};

const writeScheduled = (clientId: number, reports: ScheduledReport[]) => {
  try {
    localStorage.setItem(`${STORAGE_KEY_PREFIX}${clientId}`, JSON.stringify(reports));
  } catch {
    return;
  }
};

const getNextDateByFrequency = (frequency: Frequency, startDate: Date = new Date()): Date => {
  const date = new Date(startDate);

  switch (frequency) {
    case 'weekly':
      date.setDate(date.getDate() + 7);
      break;
    case 'biweekly':
      date.setDate(date.getDate() + 14);
      break;
    case 'monthly':
      date.setMonth(date.getMonth() + 1);
      break;
    case 'quarterly':
      date.setMonth(date.getMonth() + 3);
      break;
  }

  return date;
};

const ScheduledReports = ({ client }: ScheduledReportsProps) => {
  const clientId = typeof client.id === 'number' ? client.id : 0;
  const [scheduledReports, setScheduledReports] = useState<ScheduledReport[]>(() => readScheduled(clientId));
  const [isCreatingNew, setIsCreatingNew] = useState(false);
  const [reportToDelete, setReportToDelete] = useState<ScheduledReport | null>(null);

  const [newReportName, setNewReportName] = useState('Relatório Periódico');
  const [newReportFrequency, setNewReportFrequency] = useState<Frequency>('monthly');
  const [newReportType, setNewReportType] = useState<ReportType>('completo');
  const [newDeliveryMethod, setNewDeliveryMethod] = useState<DeliveryMethod>('email');
  const [newRecipients, setNewRecipients] = useState(client.email || '');
  const [newStartDate, setNewStartDate] = useState<Date | undefined>(new Date());

  useEffect(() => {
    writeScheduled(clientId, scheduledReports);
  }, [clientId, scheduledReports]);

  const handleAddScheduledReport = () => {
    if (!newStartDate) return;

    const recipients = newRecipients.split(',').map(email => email.trim()).filter(Boolean);

    if (newDeliveryMethod === 'email' && recipients.length === 0) {
      toast.error('Indique pelo menos um destinatário');
      return;
    }

    const newReport: ScheduledReport = {
      id: `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
      name: newReportName.trim() || 'Relatório Periódico',
      frequency: newReportFrequency,
      reportType: newReportType,
      delivery: newDeliveryMethod,
      recipients: newDeliveryMethod === 'email' ? recipients : undefined,
      startDate: newStartDate.toISOString(),
      isActive: true
    };

    setScheduledReports(prev => [...prev, newReport]);
    setIsCreatingNew(false);
    toast.success('Agendamento criado com sucesso');

    setNewReportName('Relatório Periódico');
    setNewReportFrequency('monthly');
    setNewReportType('completo');
    setNewDeliveryMethod('email');
    setNewRecipients(client.email || '');
    setNewStartDate(new Date());
  };

  const toggleReportActive = (id: string) => {
    setScheduledReports(prev =>
      prev.map(report =>
        report.id === id
          ? { ...report, isActive: !report.isActive }
          : report
      )
    );
  };

  const handleDeleteConfirm = () => {
    if (reportToDelete) {
      setScheduledReports(prev => prev.filter(report => report.id !== reportToDelete.id));
      setReportToDelete(null);
      toast.success('Agendamento eliminado com sucesso');
    }
  };

  return (
    <div className="space-y-6 min-w-0">
      {scheduledReports.length > 0 ? (
        <div className="space-y-4 min-w-0">
          <h3 className="text-sm font-semibold">Relatórios Agendados</h3>
          <div className="grid gap-3">
            {scheduledReports.map(report => {
              const nextDate = getNextDateByFrequency(report.frequency, new Date(report.startDate));

              return (
                <div
                  key={report.id}
                  className={cn(
                    'p-4 rounded-lg border min-w-0',
                    report.isActive ? 'bg-card' : 'bg-muted/40 opacity-70'
                  )}
                >
                  <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-2">
                    <div className="min-w-0">
                      <h4 className="font-medium flex items-center gap-2 flex-wrap">
                        <span className="truncate">{report.name}</span>
                        {report.isActive
                          ? <CheckCircle className="h-4 w-4 text-emerald-500 shrink-0" />
                          : <AlertCircle className="h-4 w-4 text-muted-foreground shrink-0" />}
                      </h4>
                      <p className="text-sm text-muted-foreground">
                        {frequencyNames[report.frequency]} • {reportTypeNames[report.reportType]}
                      </p>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <Switch
                        checked={report.isActive}
                        onCheckedChange={() => toggleReportActive(report.id)}
                        aria-label="Ativar/desativar agendamento"
                      />
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-muted-foreground hover:text-destructive"
                        onClick={() => setReportToDelete(report)}
                      >
                        Eliminar
                      </Button>
                    </div>
                  </div>

                  <div className="mt-3 pt-3 border-t border-border flex flex-wrap gap-4 text-sm text-muted-foreground">
                    <div className="flex items-center gap-1">
                      <Clock className="h-4 w-4" />
                      <span>Próximo: {format(nextDate, 'dd/MM/yyyy')}</span>
                    </div>

                    {report.delivery === 'email' && report.recipients && (
                      <div className="flex items-center gap-1 min-w-0">
                        <Bell className="h-4 w-4 shrink-0" />
                        <span className="truncate">Enviar para: {report.recipients.join(', ')}</span>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ) : !isCreatingNew ? (
        <EmptyState
          icon={<CalendarClock className="h-10 w-10" />}
          title="Sem relatórios agendados"
          description="Agende relatórios para serem gerados e enviados automaticamente ao cliente."
          action={{
            label: 'Agendar Novo Relatório',
            onClick: () => setIsCreatingNew(true)
          }}
        />
      ) : null}

      {isCreatingNew ? (
        <div className="rounded-lg border bg-card p-4 sm:p-6 min-w-0">
          <h3 className="text-base font-semibold mb-4">Agendar Novo Relatório</h3>

          <div className="space-y-4">
            <div className="grid gap-2">
              <Label htmlFor="report-name">Nome do Relatório</Label>
              <Input
                id="report-name"
                value={newReportName}
                onChange={(e) => setNewReportName(e.target.value)}
                placeholder="Ex.: Relatório Mensal de Progresso"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="grid gap-2 min-w-0">
                <Label htmlFor="report-type">Tipo de Relatório</Label>
                <Select
                  value={newReportType}
                  onValueChange={(value) => setNewReportType(value as ReportType)}
                >
                  <SelectTrigger id="report-type">
                    <SelectValue placeholder="Selecione o tipo" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="completo">Relatório Completo</SelectItem>
                    <SelectItem value="financeiro">Relatório Financeiro</SelectItem>
                    <SelectItem value="progresso">Relatório de Progresso</SelectItem>
                    <SelectItem value="sessoes">Histórico de Sessões</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="grid gap-2 min-w-0">
                <Label htmlFor="report-frequency">Frequência</Label>
                <Select
                  value={newReportFrequency}
                  onValueChange={(value) => setNewReportFrequency(value as Frequency)}
                >
                  <SelectTrigger id="report-frequency">
                    <SelectValue placeholder="Selecione a frequência" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="weekly">Semanal</SelectItem>
                    <SelectItem value="biweekly">Quinzenal</SelectItem>
                    <SelectItem value="monthly">Mensal</SelectItem>
                    <SelectItem value="quarterly">Trimestral</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="start-date">Data de Início</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    id="start-date"
                    variant="outline"
                    className="justify-start text-left font-normal"
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {newStartDate ? format(newStartDate, 'PPP', { locale: pt }) : <span>Selecione uma data</span>}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={newStartDate}
                    onSelect={setNewStartDate}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="delivery-method">Método de Entrega</Label>
              <Select
                value={newDeliveryMethod}
                onValueChange={(value) => setNewDeliveryMethod(value as DeliveryMethod)}
              >
                <SelectTrigger id="delivery-method">
                  <SelectValue placeholder="Selecione o método" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="email">Enviar por E-mail</SelectItem>
                  <SelectItem value="download">Download Manual</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {newDeliveryMethod === 'email' && (
              <div className="grid gap-2">
                <Label htmlFor="recipients">Destinatários (separados por vírgula)</Label>
                <Input
                  id="recipients"
                  value={newRecipients}
                  onChange={(e) => setNewRecipients(e.target.value)}
                  placeholder="Ex.: cliente@email.com, terapeuta@clinica.com"
                />
              </div>
            )}

            <div className="flex justify-end gap-2 mt-4">
              <Button
                variant="outline"
                onClick={() => setIsCreatingNew(false)}
              >
                Cancelar
              </Button>
              <Button
                onClick={handleAddScheduledReport}
                disabled={!newStartDate}
              >
                Guardar Agendamento
              </Button>
            </div>
          </div>
        </div>
      ) : (
        scheduledReports.length > 0 && (
          <div className="flex justify-end">
            <Button
              onClick={() => setIsCreatingNew(true)}
            >
              Agendar Novo Relatório
            </Button>
          </div>
        )
      )}

      <ConfirmDialog
        open={!!reportToDelete}
        onOpenChange={(open) => !open && setReportToDelete(null)}
        onConfirm={handleDeleteConfirm}
        title="Eliminar agendamento"
        description={`Tem a certeza que deseja eliminar "${reportToDelete?.name ?? ''}"? Esta ação não pode ser desfeita.`}
        confirmText="Eliminar"
      />
    </div>
  );
};

export default ScheduledReports;
