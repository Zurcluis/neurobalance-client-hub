import React, { useState, useEffect } from 'react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '../ui/dialog';
import { Mic, MicOff, Calendar, Clock, User, MapPin, Loader2, CheckCircle, AlertCircle, Edit, Trash2, X } from 'lucide-react';
import { toast } from 'sonner';
import { Badge } from '../ui/badge';
import { format, parse, eachDayOfInterval, startOfMonth, endOfMonth, addDays, isBefore, isAfter, addWeeks, startOfDay, parseISO, isValid, nextSaturday, nextSunday, nextMonday, nextTuesday, nextWednesday, nextThursday, nextFriday } from 'date-fns';
import { pt } from 'date-fns/locale';
import useClients from '@/hooks/useClients';
import useAppointments from '@/hooks/useAppointments';
import { smartSchedulingExamples, tips } from '@/data/smartSchedulingExamples';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';

interface ParsedSchedule {
  clientName?: string;
  clientId?: string;
  appointmentType: string;
  days: string[];
  time: string;
  startDate: Date;
  endDate: Date;
  recurring: boolean;
  specificDate?: Date;
  isRelativeDate?: boolean;
}

interface SchedulePreview {
  id: string;
  date: string;
  time: string;
  clientName: string;
  type: string;
  dayOfWeek: string;
  isEditing?: boolean;
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
    switch (type.toLowerCase()) {
      case 'avaliação':
      case 'avaliação inicial':
        return '#8B5CF6';
      case 'sessão':
      case 'neurofeedback':
        return '#3B82F6';
      case 'consulta':
      case 'consulta inicial':
        return '#EAB308';
      case 'reunião':
      case 'reuniao':
        return '#EF4444';
      case 'pagamento':
        return '#10B981';
      case 'follow-up':
      case 'seguimento':
        return '#F59E0B';
      case 'terapia':
        return '#6366F1';
      case 'workshop':
        return '#EC4899';
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

  const parseRelativeDate = (command: string): Date | null => {
    const today = new Date();
    const normalizedCommand = command.toLowerCase();

    // Amanhã
    if (normalizedCommand.includes('amanhã') || normalizedCommand.includes('amanha')) {
      return addDays(today, 1);
    }

    // Hoje
    if (normalizedCommand.includes('hoje')) {
      return today;
    }

    // Próximo + dia da semana
    if (normalizedCommand.includes('próximo') || normalizedCommand.includes('proximo')) {
      if (normalizedCommand.includes('segunda')) return nextMonday(today);
      if (normalizedCommand.includes('terça') || normalizedCommand.includes('terca')) return nextTuesday(today);
      if (normalizedCommand.includes('quarta')) return nextWednesday(today);
      if (normalizedCommand.includes('quinta')) return nextThursday(today);
      if (normalizedCommand.includes('sexta')) return nextFriday(today);
      if (normalizedCommand.includes('sábado') || normalizedCommand.includes('sabado')) return nextSaturday(today);
      if (normalizedCommand.includes('domingo')) return nextSunday(today);
    }

    // Dia específico do mês (ex: dia 15, no dia 20)
    const dayMatch = normalizedCommand.match(/(?:dia|no dia)\s+(\d{1,2})/i);
    if (dayMatch) {
      const day = parseInt(dayMatch[1]);
      const currentMonth = today.getMonth();
      const currentYear = today.getFullYear();
      const targetDate = new Date(currentYear, currentMonth, day);
      
      // Se a data já passou neste mês, usar o próximo mês
      if (targetDate < today) {
        return new Date(currentYear, currentMonth + 1, day);
      }
      return targetDate;
    }

    // Esta semana + dia
    if (normalizedCommand.includes('esta semana')) {
      const startOfWeek = today;
      if (normalizedCommand.includes('segunda')) return addDays(startOfWeek, 1 - today.getDay());
      if (normalizedCommand.includes('terça') || normalizedCommand.includes('terca')) return addDays(startOfWeek, 2 - today.getDay());
      if (normalizedCommand.includes('quarta')) return addDays(startOfWeek, 3 - today.getDay());
      if (normalizedCommand.includes('quinta')) return addDays(startOfWeek, 4 - today.getDay());
      if (normalizedCommand.includes('sexta')) return addDays(startOfWeek, 5 - today.getDay());
      if (normalizedCommand.includes('sábado') || normalizedCommand.includes('sabado')) return addDays(startOfWeek, 6 - today.getDay());
      if (normalizedCommand.includes('domingo')) return addDays(startOfWeek, 7 - today.getDay());
    }

    return null;
  };

  const parseScheduleCommand = (command: string): ParsedSchedule | null => {
    const normalizedCommand = command.toLowerCase().trim();
    
    // Padrões de regex expandidos para extrair informações
    const patterns = {
      // Tipos de agendamento expandidos
      appointmentType: /(sessão|sessões|avaliação|avaliações|consulta|consultas|neurofeedback|reunião|reuniao|pagamento|follow-up|seguimento|terapia|workshop)/i,
      
      // Dias da semana
      days: /(segunda|terça|terca|quarta|quinta|sexta|sábado|sabado|domingo|seg|ter|qua|qui|sex|sab|dom)/gi,
      
      // Horário expandido
      time: /(?:às|as|na|no)\s*(\d{1,2}):?(\d{2})?(?:h|hrs|horas)?(?:\s*(?:da|de)\s*(manhã|manha|tarde|noite))?/i,
      
      // Período
      period: /(até|ao|fim|final)\s+(?:do\s+)?(?:mês\s+)?(?:de\s+)?(janeiro|fevereiro|março|março|abril|maio|junho|julho|agosto|setembro|outubro|novembro|dezembro)/i,
      
      // Cliente (nome ou ID)
      client: /(?:para|do|da|de|com)\s+(?:o\s+|a\s+)?([^,\s]+(?:\s+[^,\s]+)*?)(?:\s+as|\s+às|\s+na|\s+no|\s+hoje|\s+amanhã|\s+dia|$)/i,
      
      // Datas relativas
      relativeDate: /(hoje|amanhã|amanha|próximo|proximo|esta semana|dia \d{1,2}|no dia \d{1,2})/i
    };

    try {
      // Verificar se é um agendamento específico (não recorrente)
      const relativeDateMatch = normalizedCommand.match(patterns.relativeDate);
      const isRelativeDate = !!relativeDateMatch;
      
      // Extrair tipo de agendamento
      const typeMatch = normalizedCommand.match(patterns.appointmentType);
      let appointmentType = 'sessão';
      
      if (typeMatch) {
        appointmentType = typeMatch[1];
      }

      // Extrair horário com contexto de período do dia
      const timeMatch = normalizedCommand.match(patterns.time);
      let time = '18:00';
      
      if (timeMatch) {
        let hours = parseInt(timeMatch[1]);
        const minutes = timeMatch[2] || '00';
        const period = timeMatch[3]?.toLowerCase();
        
        // Ajustar horário baseado no período do dia
        if (period === 'manhã' || period === 'manha') {
          if (hours >= 1 && hours <= 12) {
            // Manhã: 6:00 - 12:00
            if (hours < 6) hours += 6;
          }
        } else if (period === 'tarde') {
          if (hours >= 1 && hours <= 12) {
            // Tarde: 12:00 - 18:00
            if (hours < 12) hours += 12;
          }
        } else if (period === 'noite') {
          if (hours >= 1 && hours <= 12) {
            // Noite: 18:00 - 23:59
            if (hours < 18) hours += 18;
          }
        }
        
        time = `${hours.toString().padStart(2, '0')}:${minutes}`;
      }

      let specificDate: Date | null = null;
      let days: string[] = [];

      if (isRelativeDate) {
        // Para agendamentos específicos, usar data relativa
        specificDate = parseRelativeDate(normalizedCommand);
        if (!specificDate) {
          throw new Error('Não foi possível interpretar a data especificada');
        }
      } else {
        // Para agendamentos recorrentes, extrair dias da semana
        const dayMatches = normalizedCommand.match(patterns.days);
        
        if (dayMatches) {
          dayMatches.forEach(day => {
            const dayLower = day.toLowerCase();
            if (dayLower.includes('seg') || dayLower.includes('segunda')) days.push('segunda');
            if (dayLower.includes('ter') || dayLower.includes('terça') || dayLower.includes('terca')) days.push('terça');
            if (dayLower.includes('qua') || dayLower.includes('quarta')) days.push('quarta');
            if (dayLower.includes('qui') || dayLower.includes('quinta')) days.push('quinta');
            if (dayLower.includes('sex') || dayLower.includes('sexta')) days.push('sexta');
            if (dayLower.includes('sab') || dayLower.includes('sábado') || dayLower.includes('sabado')) days.push('sábado');
            if (dayLower.includes('dom') || dayLower.includes('domingo')) days.push('domingo');
          });
        }
      }

      // Extrair período (só para agendamentos recorrentes)
      let endDate = endOfMonth(new Date());
      
      if (!isRelativeDate) {
        const periodMatch = normalizedCommand.match(patterns.period);
        
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
      }

      // Extrair cliente
      const clientMatch = normalizedCommand.match(patterns.client);
      let clientName = '';
      let clientId = '';
      
      if (clientMatch) {
        const clientInput = clientMatch[1].trim();
        const foundClient = findClientByNameOrId(clientInput);
        
        if (foundClient) {
          clientName = foundClient.nome || '';
          clientId = foundClient.id?.toString() || '';
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
        recurring: !isRelativeDate,
        specificDate,
        isRelativeDate
      };
    } catch (error) {
      console.error('Erro ao processar comando:', error);
      return null;
    }
  };

  const generateSchedulePreview = (schedule: ParsedSchedule): SchedulePreview[] => {
    const preview: SchedulePreview[] = [];

    if (schedule.isRelativeDate && schedule.specificDate) {
      // Agendamento específico
      const dayNames = ['domingo', 'segunda', 'terça', 'quarta', 'quinta', 'sexta', 'sábado'];
      const dayName = dayNames[schedule.specificDate.getDay()];
      
      preview.push({
        id: `preview-${Date.now()}-${Math.random()}`, // ID único para pré-visualização
        date: format(schedule.specificDate, 'yyyy-MM-dd'),
        time: schedule.time,
        clientName: schedule.clientName || 'Cliente não especificado',
        type: schedule.appointmentType,
        dayOfWeek: dayName
      });
    } else {
      // Agendamento recorrente
      const dayMap: { [key: string]: number } = {
        'domingo': 0, 'segunda': 1, 'terça': 2, 'quarta': 3,
        'quinta': 4, 'sexta': 5, 'sábado': 6
      };

      const startDate = new Date();
      const endDate = schedule.endDate;

      // Gerar todas as datas no intervalo
      const allDays = eachDayOfInterval({ start: startDate, end: endDate });

      allDays.forEach((day, index) => {
        const dayOfWeek = day.getDay();
        const dayName = Object.keys(dayMap).find(key => dayMap[key] === dayOfWeek);
        
        if (dayName && schedule.days.includes(dayName)) {
          preview.push({
            id: `preview-${Date.now()}-${index}-${Math.random()}`, // ID único para pré-visualização
            date: format(day, 'yyyy-MM-dd'),
            time: schedule.time,
            clientName: schedule.clientName || 'Cliente não especificado',
            type: schedule.appointmentType,
            dayOfWeek: dayName
          });
        }
      });
    }

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

      if (schedule.days.length === 0 && !schedule.isRelativeDate) {
        toast.error('Nenhum dia da semana foi especificado.');
        setIsProcessing(false);
        return;
      }

      const preview = generateSchedulePreview(schedule);
      
      if (preview.length === 0) {
        toast.error('Nenhum agendamento foi gerado. Verifique o comando.');
        setIsProcessing(false);
        return;
      }
      
      setParsedSchedule(schedule);
      setSchedulePreview(preview);
      setIsProcessing(false);
      
      if (schedule.isRelativeDate) {
        toast.success(`Agendamento específico preparado para ${format(schedule.specificDate!, 'dd/MM/yyyy', { locale: pt })}.`);
      } else {
        toast.success(`${preview.length} agendamentos recorrentes foram preparados para criação.`);
      }
      
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
          // Encontrar cliente pelo nome se não tiver ID
          let clientId = parsedSchedule.clientId ? parseInt(parsedSchedule.clientId) : null;
          if (!clientId && appointment.clientName !== 'Cliente não especificado') {
            const foundClient = findClientByNameOrId(appointment.clientName);
            if (foundClient) {
              clientId = foundClient.id;
            }
          }

          const appointmentData = {
            titulo: `${appointment.type} - ${appointment.clientName}`,
            data: `${appointment.date}T${appointment.time}:00`,
            hora: appointment.time,
            id_cliente: clientId,
            tipo: appointment.type,
            notas: `Agendamento automático criado por comando: "${textInput}"`,
            estado: 'pendente',
            terapeuta: '',
            cor: getDefaultColorForType(appointment.type)
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
    switch (type.toLowerCase()) {
      case 'avaliação': return 'bg-purple-100 text-purple-800';
      case 'sessão': return 'bg-[#e6f2f3] text-[#3f9094]';
      case 'consulta': return 'bg-yellow-100 text-yellow-800';
      case 'reunião': return 'bg-red-100 text-red-800';
      case 'pagamento': return 'bg-green-100 text-green-800';
      case 'follow-up': return 'bg-orange-100 text-orange-800';
      case 'terapia': return 'bg-blue-100 text-blue-800';
      case 'workshop': return 'bg-pink-100 text-pink-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const handleEditAppointment = (id: string) => {
    setSchedulePreview(prev => prev.map(app => 
      app.id === id ? { ...app, isEditing: true } : app
    ));
  };

  const handleSaveEdit = (id: string, updatedData: Partial<SchedulePreview>) => {
    setSchedulePreview(prev => prev.map(app => 
      app.id === id ? { ...app, ...updatedData, isEditing: false } : app
    ));
    toast.success('Agendamento atualizado na pré-visualização');
  };

  const handleCancelEdit = (id: string) => {
    setSchedulePreview(prev => prev.map(app => 
      app.id === id ? { ...app, isEditing: false } : app
    ));
  };

  const handleDeleteAppointment = (id: string) => {
    if (!window.confirm('Tem certeza que deseja remover este agendamento da pré-visualização?')) {
      return;
    }

    setSchedulePreview(prev => prev.filter(app => app.id !== id));
    toast.success('Agendamento removido da pré-visualização');
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
                  placeholder="Ex: Reunião amanhã às 10:00 da manhã com o João, ou Pagamento no próximo sábado às 15:00"
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
                    <div key={appointment.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      {appointment.isEditing ? (
                        <div className="flex-1 space-y-2">
                          <div className="grid grid-cols-2 gap-2">
                            <div>
                              <label className="text-xs font-medium text-gray-600">Data</label>
                              <Input
                                type="date"
                                value={appointment.date}
                                onChange={(e) => handleSaveEdit(appointment.id, { date: e.target.value })}
                                className="text-sm"
                              />
                            </div>
                            <div>
                              <label className="text-xs font-medium text-gray-600">Hora</label>
                              <Input
                                type="time"
                                value={appointment.time}
                                onChange={(e) => handleSaveEdit(appointment.id, { time: e.target.value })}
                                className="text-sm"
                              />
                            </div>
                          </div>
                          <div className="grid grid-cols-2 gap-2">
                            <div>
                              <label className="text-xs font-medium text-gray-600">Cliente</label>
                              <Input
                                value={appointment.clientName}
                                onChange={(e) => handleSaveEdit(appointment.id, { clientName: e.target.value })}
                                className="text-sm"
                              />
                            </div>
                            <div>
                              <label className="text-xs font-medium text-gray-600">Tipo</label>
                              <Select
                                value={appointment.type}
                                onValueChange={(value) => handleSaveEdit(appointment.id, { type: value })}
                              >
                                <SelectTrigger className="text-sm">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="sessão">Sessão</SelectItem>
                                  <SelectItem value="avaliação">Avaliação</SelectItem>
                                  <SelectItem value="consulta">Consulta</SelectItem>
                                  <SelectItem value="reunião">Reunião</SelectItem>
                                  <SelectItem value="pagamento">Pagamento</SelectItem>
                                  <SelectItem value="follow-up">Follow-up</SelectItem>
                                  <SelectItem value="terapia">Terapia</SelectItem>
                                  <SelectItem value="workshop">Workshop</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                          </div>
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              onClick={() => handleSaveEdit(appointment.id, {})}
                              className="bg-green-600 hover:bg-green-700"
                            >
                              Salvar
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleCancelEdit(appointment.id)}
                            >
                              Cancelar
                            </Button>
                          </div>
                        </div>
                      ) : (
                        <>
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
                          <div className="flex items-center gap-1">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleEditAppointment(appointment.id)}
                              className="text-blue-600 hover:text-blue-800"
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleDeleteAppointment(appointment.id)}
                              className="text-red-600 hover:text-red-800"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </>
                      )}
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