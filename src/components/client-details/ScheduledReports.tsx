import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CalendarIcon, Clock, Bell, CheckCircle, AlertCircle } from 'lucide-react';
import { ClientDetailData } from '@/types/client';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
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
  nextDate: Date;
  isActive: boolean;
}

const ScheduledReports = ({ client }: ScheduledReportsProps) => {
  const [scheduledReports, setScheduledReports] = useState<ScheduledReport[]>([]);
  const [isCreatingNew, setIsCreatingNew] = useState(false);
  
  // Form state
  const [newReportName, setNewReportName] = useState('Relatório Periódico');
  const [newReportFrequency, setNewReportFrequency] = useState<Frequency>('monthly');
  const [newReportType, setNewReportType] = useState<ReportType>('completo');
  const [newDeliveryMethod, setNewDeliveryMethod] = useState<DeliveryMethod>('email');
  const [newRecipients, setNewRecipients] = useState(client.email || '');
  const [newStartDate, setNewStartDate] = useState<Date | undefined>(new Date());
  
  // Helper para obter a próxima data com base na frequência
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
  
  // Obter nome da frequência em português
  const getFrequencyName = (frequency: Frequency): string => {
    const names = {
      weekly: 'Semanal',
      biweekly: 'Quinzenal',
      monthly: 'Mensal',
      quarterly: 'Trimestral'
    };
    return names[frequency];
  };
  
  // Obter nome do tipo de relatório em português
  const getReportTypeName = (type: ReportType): string => {
    const names = {
      completo: 'Relatório Completo',
      financeiro: 'Relatório Financeiro',
      progresso: 'Relatório de Progresso',
      sessoes: 'Histórico de Sessões'
    };
    return names[type];
  };
  
  // Adicionar novo relatório agendado
  const handleAddScheduledReport = () => {
    if (!newStartDate) return;
    
    const newReport: ScheduledReport = {
      id: `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
      name: newReportName,
      frequency: newReportFrequency,
      reportType: newReportType,
      delivery: newDeliveryMethod,
      recipients: newDeliveryMethod === 'email' ? newRecipients.split(',').map(e => e.trim()) : undefined,
      nextDate: getNextDateByFrequency(newReportFrequency, newStartDate),
      isActive: true
    };
    
    setScheduledReports(prev => [...prev, newReport]);
    setIsCreatingNew(false);
    
    // Reset form
    setNewReportName('Relatório Periódico');
    setNewReportFrequency('monthly');
    setNewReportType('completo');
    setNewDeliveryMethod('email');
    setNewRecipients(client.email || '');
    setNewStartDate(new Date());
  };
  
  // Alternar status ativo/inativo
  const toggleReportActive = (id: string) => {
    setScheduledReports(prev => 
      prev.map(report => 
        report.id === id 
          ? { ...report, isActive: !report.isActive } 
          : report
      )
    );
  };
  
  // Excluir relatório agendado
  const deleteScheduledReport = (id: string) => {
    setScheduledReports(prev => prev.filter(report => report.id !== id));
  };

  return (
    <div className="space-y-6">
      {/* Lista de relatórios agendados */}
      {scheduledReports.length > 0 && (
        <div className="space-y-4">
          <h3 className="text-sm font-medium">Relatórios Agendados</h3>
          <div className="grid gap-3">
            {scheduledReports.map(report => (
              <div 
                key={report.id} 
                className={`p-4 rounded-lg border transition-all ${
                  report.isActive 
                    ? 'bg-white/30 backdrop-blur-sm border-white/20' 
                    : 'bg-gray-100/50 border-gray-200/50 opacity-70'
                }`}
              >
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <h4 className="font-medium flex items-center gap-2">
                      {report.name}
                      {report.isActive 
                        ? <CheckCircle className="h-4 w-4 text-green-500" /> 
                        : <AlertCircle className="h-4 w-4 text-gray-400" />
                      }
                    </h4>
                    <p className="text-sm text-gray-600">
                      {getFrequencyName(report.frequency)} • {getReportTypeName(report.reportType)}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Switch
                      checked={report.isActive}
                      onCheckedChange={() => toggleReportActive(report.id)}
                    />
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-gray-400 hover:text-red-500"
                      onClick={() => deleteScheduledReport(report.id)}
                    >
                      Excluir
                    </Button>
                  </div>
                </div>
                
                <div className="mt-3 pt-3 border-t border-gray-100 flex flex-wrap gap-4 text-sm">
                  <div className="flex items-center gap-1 text-gray-600">
                    <Clock className="h-4 w-4" />
                    <span>Próximo: {format(report.nextDate, 'dd/MM/yyyy')}</span>
                  </div>
                  
                  {report.delivery === 'email' && report.recipients && (
                    <div className="flex items-center gap-1 text-gray-600">
                      <Bell className="h-4 w-4" />
                      <span>Enviar para: {report.recipients.join(', ')}</span>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
      
      {/* Formulário para adicionar novo relatório agendado */}
      {isCreatingNew ? (
        <div className="bg-white/30 backdrop-blur-sm p-6 rounded-lg border border-white/20">
          <h3 className="text-lg font-medium mb-4">Agendar Novo Relatório</h3>
          
          <div className="space-y-4">
            <div className="grid gap-2">
              <Label htmlFor="report-name">Nome do Relatório</Label>
              <Input 
                id="report-name" 
                value={newReportName}
                onChange={(e) => setNewReportName(e.target.value)}
                placeholder="Ex: Relatório Mensal de Progresso" 
              />
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="grid gap-2">
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
              
              <div className="grid gap-2">
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
                    {newStartDate ? format(newStartDate, 'PPP', { locale: ptBR }) : <span>Selecione uma data</span>}
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
                  placeholder="Ex: cliente@email.com, terapeuta@clinica.com" 
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
                className="bg-[#3f9094] hover:bg-[#265255]"
                disabled={!newStartDate}
              >
                Salvar Agendamento
              </Button>
            </div>
          </div>
        </div>
      ) : (
        <Button
          onClick={() => setIsCreatingNew(true)}
          className="bg-[#3f9094] hover:bg-[#265255]"
        >
          Agendar Novo Relatório
        </Button>
      )}
    </div>
  );
};

export default ScheduledReports; 