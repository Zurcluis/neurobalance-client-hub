import React, { useState, useEffect } from 'react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '../ui/dialog';
import { Mic, MicOff, Calendar, Clock, User, MapPin, Loader2, CheckCircle, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';
import { Badge } from '../ui/badge';
import { format, parse, eachDayOfInterval, startOfMonth, endOfMonth, addDays, isBefore, isAfter } from 'date-fns';
import { pt } from 'date-fns/locale';
import useClients from '@/hooks/useClients';
import useAppointments from '@/hooks/useAppointments';
import { smartSchedulingExamples, tips } from '@/data/smartSchedulingExamples';

interface ParsedSchedule {
  clientName?: string;
  clientId?: string;
  appointmentType: 'sessão' | 'avaliação' | 'consulta';
  days: string[];
  time: string;
  startDate: Date;
  endDate: Date;
  recurring: boolean;
}

interface SchedulePreview {
  date: string;
  time: string;
  clientName: string;
  type: string;
  dayOfWeek: string;
}

const SmartScheduling: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [textInput, setTextInput] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [parsedSchedule, setParsedSchedule] = useState<ParsedSchedule | null>(null);
  const [schedulePreview, setSchedulePreview] = useState<SchedulePreview[]>([]);
  const [recognition, setRecognition] = useState<SpeechRecognition | null>(null);

  const { clients } = useClients();
  const { addAppointment } = useAppointments();

  const getDefaultColorForType = (type: string): string => {
    switch (type) {
      case 'avaliação':
        return '#8B5CF6';
      case 'sessão':
        return '#3B82F6';
      case 'consulta':
        return '#EAB308';
      case 'consulta inicial':
        return '#3f9094';
      default:
        return '#3B82F6';
    }
  };

  useEffect(() => {
    if (typeof window !== 'undefined' && 'webkitSpeechRecognition' in window) {
      const SpeechRecognition = window.webkitSpeechRecognition || window.SpeechRecognition;
      const recognitionInstance = new SpeechRecognition();
      
      recognitionInstance.continuous = false;
      recognitionInstance.interimResults = false;
      recognitionInstance.lang = 'pt-PT';
      
      recognitionInstance.onresult = (event) => {
        const transcript = event.results[0][0].transcript;
        setTextInput(transcript);
        setIsListening(false);
      };
      
      recognitionInstance.onerror = (event) => {
        console.error('Erro no reconhecimento de voz:', event.error);
        setIsListening(false);
        toast.error('Erro no reconhecimento de voz. Tente novamente.');
      };
      
      recognitionInstance.onend = () => {
        setIsListening(false);
      };
      
      setRecognition(recognitionInstance);
    }
  }, []);

  const startListening = () => {
    if (recognition) {
      setIsListening(true);
      recognition.start();
    } else {
      toast.error('Reconhecimento de voz não suportado neste navegador.');
    }
  };

  const stopListening = () => {
    if (recognition) {
      recognition.stop();
      setIsListening(false);
    }
  };

  const findClientByNameOrId = (input: string) => {
    const normalizedInput = input.toLowerCase().trim();
    
    // Procurar por ID manual primeiro
    const byId = clients.find(client => 
      client.id_manual?.toLowerCase() === normalizedInput
    );
    
    if (byId) return byId;
    
    // Procurar por nome (correspondência parcial)
    const byName = clients.find(client => 
      client.nome.toLowerCase().includes(normalizedInput) ||
      normalizedInput.includes(client.nome.toLowerCase())
    );
    
    return byName;
  };

  const parseScheduleCommand = (command: string): ParsedSchedule | null => {
    const normalizedCommand = command.toLowerCase().trim();
    
    // Padrões de regex para extrair informações
    const patterns = {
      // Tipos de agendamento
      appointmentType: /(sessão|sessões|avaliação|avaliações|consulta|consultas|neurofeedback)/i,
      
      // Dias da semana
      days: /(segunda|terça|quarta|quinta|sexta|sábado|domingo|seg|ter|qua|qui|sex|sab|dom)/gi,
      
      // Horário
      time: /(\d{1,2}):?(\d{2})?(?:h|hrs|horas)?/i,
      
      // Período
      period: /(até|ao|fim|final)\s+(?:do\s+)?(?:mês\s+)?(?:de\s+)?(janeiro|fevereiro|março|abril|maio|junho|julho|agosto|setembro|outubro|novembro|dezembro)/i,
      
      // Cliente (nome ou ID)
      client: /(?:para|do|da|de)\s+(?:o\s+|a\s+)?([^,\s]+(?:\s+[^,\s]+)*?)(?:\s+as|\s+às|\s+na|\s+no|$)/i
    };

    try {
      // Extrair tipo de agendamento
      const typeMatch = normalizedCommand.match(patterns.appointmentType);
      let appointmentType: 'sessão' | 'avaliação' | 'consulta' = 'sessão';
      
      if (typeMatch) {
        const type = typeMatch[1];
        if (type.includes('avaliação')) appointmentType = 'avaliação';
        else if (type.includes('consulta')) appointmentType = 'consulta';
        else appointmentType = 'sessão';
      }

      // Extrair dias da semana
      const dayMatches = normalizedCommand.match(patterns.days);
      const days: string[] = [];
      
      if (dayMatches) {
        dayMatches.forEach(day => {
          const dayLower = day.toLowerCase();
          if (dayLower.includes('seg') || dayLower.includes('segunda')) days.push('segunda');
          if (dayLower.includes('ter') || dayLower.includes('terça')) days.push('terça');
          if (dayLower.includes('qua') || dayLower.includes('quarta')) days.push('quarta');
          if (dayLower.includes('qui') || dayLower.includes('quinta')) days.push('quinta');
          if (dayLower.includes('sex') || dayLower.includes('sexta')) days.push('sexta');
          if (dayLower.includes('sab') || dayLower.includes('sábado')) days.push('sábado');
          if (dayLower.includes('dom') || dayLower.includes('domingo')) days.push('domingo');
        });
      }

      // Extrair horário
      const timeMatch = normalizedCommand.match(patterns.time);
      let time = '18:00';
      
      if (timeMatch) {
        const hours = timeMatch[1];
        const minutes = timeMatch[2] || '00';
        time = `${hours.padStart(2, '0')}:${minutes}`;
      }

      // Extrair período
      const periodMatch = normalizedCommand.match(patterns.period);
      let endDate = endOfMonth(new Date());
      
      if (periodMatch) {
        const month = periodMatch[2];
        const currentYear = new Date().getFullYear();
        const monthMap: { [key: string]: number } = {
          'janeiro': 0, 'fevereiro': 1, 'março': 2, 'abril': 3,
          'maio': 4, 'junho': 5, 'julho': 6, 'agosto': 7,
          'setembro': 8, 'outubro': 9, 'novembro': 10, 'dezembro': 11
        };
        
        if (monthMap[month] !== undefined) {
          endDate = endOfMonth(new Date(currentYear, monthMap[month]));
        }
      }

      // Extrair cliente
      const clientMatch = normalizedCommand.match(patterns.client);
      let clientName = '';
      let clientId = '';
      
      if (clientMatch) {
        const clientInput = clientMatch[1].trim();
        const foundClient = findClientByNameOrId(clientInput);
        
        if (foundClient) {
          clientName = foundClient.nome;
          clientId = foundClient.id.toString();
        } else {
          clientName = clientInput;
        }
      }

      return {
        clientName,
        clientId,
        appointmentType,
        days: [...new Set(days)], // Remove duplicatas
        time,
        startDate: new Date(),
        endDate,
        recurring: true
      };
    } catch (error) {
      console.error('Erro ao processar comando:', error);
      return null;
    }
  };

  const generateSchedulePreview = (schedule: ParsedSchedule): SchedulePreview[] => {
    const preview: SchedulePreview[] = [];
    const dayMap: { [key: string]: number } = {
      'domingo': 0, 'segunda': 1, 'terça': 2, 'quarta': 3,
      'quinta': 4, 'sexta': 5, 'sábado': 6
    };

    const startDate = new Date();
    const endDate = schedule.endDate;

    // Gerar todas as datas no intervalo
    const allDays = eachDayOfInterval({ start: startDate, end: endDate });

    allDays.forEach(day => {
      const dayOfWeek = day.getDay();
      const dayName = Object.keys(dayMap).find(key => dayMap[key] === dayOfWeek);
      
      if (dayName && schedule.days.includes(dayName)) {
        preview.push({
          date: format(day, 'yyyy-MM-dd'),
          time: schedule.time,
          clientName: schedule.clientName || 'Cliente não especificado',
          type: schedule.appointmentType,
          dayOfWeek: dayName
        });
      }
    });

    return preview.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  };

  const processCommand = async () => {
    if (!textInput.trim()) {
      toast.error('Digite ou fale um comando para processar.');
      return;
    }

    setIsProcessing(true);
    
    try {
      const schedule = parseScheduleCommand(textInput);
      
      if (!schedule) {
        toast.error('Não foi possível interpretar o comando. Tente ser mais específico.');
        setIsProcessing(false);
        return;
      }

      if (schedule.days.length === 0) {
        toast.error('Nenhum dia da semana foi especificado.');
        setIsProcessing(false);
        return;
      }

      const preview = generateSchedulePreview(schedule);
      
      setParsedSchedule(schedule);
      setSchedulePreview(preview);
      setIsProcessing(false);
      
      toast.success(`${preview.length} agendamentos foram preparados para criação.`);
      
    } catch (error) {
      console.error('Erro ao processar comando:', error);
      toast.error('Erro ao processar o comando.');
      setIsProcessing(false);
    }
  };

  const confirmSchedule = async () => {
    if (!parsedSchedule || !schedulePreview.length) return;

    setIsProcessing(true);
    let successCount = 0;
    let errorCount = 0;

    try {
      for (const appointment of schedulePreview) {
        try {
          const appointmentData = {
            titulo: `${parsedSchedule.appointmentType} - ${appointment.clientName}`,
            data: `${appointment.date}T${appointment.time}:00`,
            hora: appointment.time,
            id_cliente: parsedSchedule.clientId ? parseInt(parsedSchedule.clientId) : null,
            tipo: parsedSchedule.appointmentType,
            notas: `Agendamento automático criado por comando: "${textInput}"`,
            estado: 'pendente',
            terapeuta: '',
            cor: getDefaultColorForType(parsedSchedule.appointmentType)
          };

          await addAppointment(appointmentData);
          successCount++;
        } catch (error) {
          console.error('Erro ao criar agendamento:', error);
          errorCount++;
        }
      }

      if (successCount > 0) {
        toast.success(`${successCount} agendamentos criados com sucesso!`);
      }
      
      if (errorCount > 0) {
        toast.error(`${errorCount} agendamentos falharam ao ser criados.`);
      }

      // Limpar estado
      setTextInput('');
      setParsedSchedule(null);
      setSchedulePreview([]);
      setIsOpen(false);
      
    } catch (error) {
      console.error('Erro ao confirmar agendamentos:', error);
      toast.error('Erro ao criar os agendamentos.');
    } finally {
      setIsProcessing(false);
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'avaliação': return 'bg-purple-100 text-purple-800';
      case 'sessão': return 'bg-[#e6f2f3] text-[#3f9094]';
      case 'consulta': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button className="bg-[#3f9094] hover:bg-[#265255] text-white">
          <Mic className="h-4 w-4 mr-2" />
          Agendamento Inteligente
        </Button>
      </DialogTrigger>
      
      <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Agendamento Inteligente
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Input de comando */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Comando de Agendamento</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-2">
                <Input
                  placeholder="Ex: Marcar sessões de neurofeedback para o João as terças e quintas às 18:00h até ao fim de setembro"
                  value={textInput}
                  onChange={(e) => setTextInput(e.target.value)}
                  className="flex-1"
                />
                <Button
                  onClick={isListening ? stopListening : startListening}
                  variant={isListening ? "destructive" : "outline"}
                  size="icon"
                >
                  {isListening ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
                </Button>
              </div>
              
              {isListening && (
                <div className="flex items-center gap-2 text-red-600">
                  <div className="w-2 h-2 bg-red-600 rounded-full animate-pulse"></div>
                  <span className="text-sm">Ouvindo...</span>
                </div>
              )}

              <Button 
                onClick={processCommand} 
                disabled={!textInput.trim() || isProcessing}
                className="w-full bg-[#3f9094] hover:bg-[#265255]"
              >
                {isProcessing ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Processando...
                  </>
                ) : (
                  'Processar Comando'
                )}
              </Button>
            </CardContent>
          </Card>

          {/* Exemplos de comandos */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Exemplos de Comandos</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {smartSchedulingExamples.slice(0, 2).map((category, index) => (
                  <div key={index}>
                    <h4 className="font-medium text-sm text-[#265255] mb-2">{category.category}</h4>
                    <div className="space-y-1">
                      {category.examples.slice(0, 2).map((example, exIndex) => (
                        <p key={exIndex} className="text-xs text-gray-600 pl-2 border-l-2 border-[#3f9094]/20">
                          "{example}"
                        </p>
                      ))}
                    </div>
                  </div>
                ))}
                <div className="mt-3 pt-3 border-t">
                  <h4 className="font-medium text-sm text-[#265255] mb-2">Dicas</h4>
                  <div className="space-y-1">
                    {tips.slice(0, 3).map((tip, tipIndex) => (
                      <p key={tipIndex} className="text-xs text-gray-600">
                        • {tip}
                      </p>
                    ))}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Preview dos agendamentos */}
          {schedulePreview.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <CheckCircle className="h-5 w-5 text-green-600" />
                  Pré-visualização ({schedulePreview.length} agendamentos)
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3 max-h-60 overflow-y-auto">
                  {schedulePreview.slice(0, 10).map((appointment, index) => (
                    <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div className="flex items-center gap-3">
                        <div className="flex flex-col">
                          <span className="font-medium">{format(new Date(appointment.date), 'dd/MM/yyyy (eeee)', { locale: pt })}</span>
                          <span className="text-sm text-gray-600">{appointment.time}</span>
                        </div>
                        <div className="flex flex-col">
                          <span className="font-medium">{appointment.clientName}</span>
                          <Badge className={`text-xs ${getTypeColor(appointment.type)}`}>
                            {appointment.type}
                          </Badge>
                        </div>
                      </div>
                    </div>
                  ))}
                  {schedulePreview.length > 10 && (
                    <div className="text-center text-sm text-gray-500">
                      ... e mais {schedulePreview.length - 10} agendamentos
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        <DialogFooter>
          <div className="flex gap-2 w-full">
            <Button 
              variant="outline" 
              onClick={() => setIsOpen(false)}
              className="flex-1"
            >
              Cancelar
            </Button>
            {schedulePreview.length > 0 && (
              <Button 
                onClick={confirmSchedule}
                disabled={isProcessing}
                className="flex-1 bg-[#3f9094] hover:bg-[#265255]"
              >
                {isProcessing ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Criando...
                  </>
                ) : (
                  `Confirmar ${schedulePreview.length} Agendamentos`
                )}
              </Button>
            )}
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default SmartScheduling; 