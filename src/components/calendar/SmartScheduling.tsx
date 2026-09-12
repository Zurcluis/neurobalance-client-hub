import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '../ui/dialog';
import { Mic, MicOff, Calendar, CalendarClock, Loader2, CheckCircle, Zap, X, AlertTriangle } from 'lucide-react';
import { toast } from 'sonner';
import { Badge } from '../ui/badge';
import { addDays, format, startOfDay } from 'date-fns';
import { pt } from 'date-fns/locale';
import useClients from '@/hooks/useClients';
import useAppointments, { Appointment } from '@/hooks/useAppointments';
import { useSupabaseClient } from '@/hooks/useSupabaseClient';
import { smartSchedulingExamples, tips } from '@/data/smartSchedulingExamples';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import {
  parseScheduleCommand,
  generateDatesForCommand,
  APPOINTMENT_TYPES,
  normalizeText,
  ParsedScheduleCommand,
  ScheduleClient,
} from '@/utils/scheduleCommandParser';
import {
  checkSlotConflict,
  getClientPattern,
  isActiveAppointment,
  normalizeAvailabilityRows,
  planSeries,
  suggestSlotAlternatives,
  AdminAvailability,
  SlotSuggestion,
} from '@/utils/slotSuggestions';
import { parseLocalISO } from '@/utils/dateUtils';
import SlotSuggestionsPanel from './SlotSuggestionsPanel';
import { useDictation } from '@/hooks/useDictation';
import { useDictationContext } from '@/components/dictation/DictationProvider';

interface ReviewState {
  clientId: string;
  type: string;
  time: string;
  dateStr: string;
  weekdays: string[];
  recurring: boolean;
  endDateStr: string;
}

interface LooseQuery {
  select: (columns: string) => LooseQuery;
  eq: (column: string, value: string) => LooseQuery;
  then: <T>(onFulfilled: (value: { data: unknown[] | null; error: unknown }) => T) => Promise<{ data: unknown[] | null; error: unknown }>;
}

interface LooseSupabase {
  from: (table: string) => LooseQuery;
}

interface ConflictState {
  client: ScheduleClient;
  type: string;
  time: string;
  command: string;
  requestedDates: Date[];
  conflictingDates: Date[];
  freeDates: Date[];
  reason: string;
  suggestions: SlotSuggestion[];
}

interface RescheduleState {
  appointment: Appointment;
  client: ScheduleClient;
  targetDate: Date;
  targetTime: string;
  busy: boolean;
  suggestions: SlotSuggestion[];
}

interface SeriesState {
  client: ScheduleClient;
  type: string;
  time: string;
  command: string;
  month: Date;
  existingCount: number;
  plannedDates: Date[];
  requestedCount: number;
}

const WEEKDAY_OPTIONS = [
  { label: 'segunda', short: 'Seg' },
  { label: 'terça', short: 'Ter' },
  { label: 'quarta', short: 'Qua' },
  { label: 'quinta', short: 'Qui' },
  { label: 'sexta', short: 'Sex' },
  { label: 'sábado', short: 'Sáb' },
  { label: 'domingo', short: 'Dom' },
];

const WEEKDAY_JS: Record<string, number> = {
  segunda: 1,
  terça: 2,
  quarta: 3,
  quinta: 4,
  sexta: 5,
  sábado: 6,
  domingo: 0,
};

const SmartScheduling: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [textInput, setTextInput] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [review, setReview] = useState<ReviewState | null>(null);
  const [conflictState, setConflictState] = useState<ConflictState | null>(null);
  const [rescheduleState, setRescheduleState] = useState<RescheduleState | null>(null);
  const [seriesState, setSeriesState] = useState<SeriesState | null>(null);
  const [adminAvailabilities, setAdminAvailabilities] = useState<AdminAvailability[]>([]);

  const isProcessingRef = useRef(false);
  const processAndScheduleRef = useRef<(command: string) => Promise<void>>(async () => {});

  const { isListening, transcript, isSupported, start, stop } = useDictation({
    onFinal: (text: string) => processAndScheduleRef.current(text),
    onError: (msg: string) => toast.error(msg),
  });
  const { pendingCommand, clearPendingCommand } = useDictationContext();

  const { clients } = useClients();
  const { appointments, addAppointmentsBatch, updateAppointment } = useAppointments();
  const supabase = useSupabaseClient();

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      let rows: unknown[] = [];
      try {
        const loose = supabase as unknown as LooseSupabase;
        const { data, error } = await loose.from('disponibilidades').select('*');
        if (!error && Array.isArray(data)) rows = data;
      } catch {
        rows = [];
      }
      if (rows.length === 0) {
        try {
          const loose = supabase as unknown as LooseSupabase;
          const { data } = await loose.from('client_availability').select('*').eq('status', 'ativo');
          if (Array.isArray(data)) rows = data;
        } catch {
          rows = [];
        }
      }
      if (!cancelled) setAdminAvailabilities(normalizeAvailabilityRows(rows));
    };
    load();
    return () => {
      cancelled = true;
    };
  }, [supabase]);

  // Enquanto ouve, o campo reflete a transcrição (texto base + fala em direto)
  useEffect(() => {
    if (isListening) setTextInput(transcript);
  }, [transcript, isListening]);

  // Comando global (duplo Ctrl em qualquer página) consumido uma única vez
  useEffect(() => {
    if (!pendingCommand) return;
    clearPendingCommand();
    setIsOpen(true);
    setTextInput(pendingCommand);
    processAndScheduleRef.current(pendingCommand);
  }, [pendingCommand, clearPendingCommand]);

  const getDefaultColorForType = (type: string): string => {
    switch (type.toLowerCase()) {
      case 'avaliação':
      case 'avaliação inicial':
        return '#7986CB';
      case 'neurofeedback':
        return '#039BE5';
      case 'discussão de resultados':
      case 'discussão':
        return '#F6BF26';
      case 'ioga':
      case 'yoga':
      case 'yoga nidra':
        return '#33B679';
      case 'biorresonância magnética':
      case 'biorressonância magnética':
      case 'biorresonância':
      case 'biorressonância':
        return '#7CB342';
      case 'ofes':
        return '#D50000';
      case 'consulta de psicologia':
      case 'psicologia':
        return '#F4511E';
      case 'constelações familiares':
      case 'constelacoes familiares':
      case 'constelações':
        return '#8E24AA';
      case 'sessão':
        return '#039BE5';
      case 'consulta':
        return '#0B8043';
      case 'reunião':
        return '#EF4444';
      case 'pagamento':
        return '#10B981';
      case 'follow-up':
        return '#F59E0B';
      case 'terapia':
        return '#6366F1';
      case 'workshop':
        return '#EC4899';
      default:
        return '#3f9094';
    }
  };

  const buildItems = (
    client: ScheduleClient,
    type: string,
    slots: Array<{ date: Date; time: string }>,
    command: string,
  ) =>
    slots.map(({ date, time }) => ({
      titulo: `${type} - ${client.nome}`,
      data: `${format(date, 'yyyy-MM-dd')}T${time}:00`,
      hora: time,
      id_cliente: client.id,
      tipo: type,
      notas: `Agendamento automático: "${command}"`,
      estado: 'pendente',
      terapeuta: '',
      cor: getDefaultColorForType(type),
    }));

  const createAppointments = async (
    client: ScheduleClient,
    type: string,
    slots: Array<{ date: Date; time: string }>,
    command: string,
  ) => {
    if (slots.length === 0) {
      toast.error('Nenhuma data válida encontrada para criar os agendamentos.');
      return;
    }

    setIsProcessing(true);
    isProcessingRef.current = true;
    try {
      const items = buildItems(client, type, slots, command);
      await addAppointmentsBatch(items);

      const clientLabel = client.id_manual ? `${client.nome} (${client.id_manual})` : client.nome;
      const first = slots[0];
      const summary =
        slots.length === 1
          ? `${format(first.date, "dd/MM/yyyy (eeee)", { locale: pt })} às ${first.time}`
          : `${slots.length} sessões até ${format(slots[slots.length - 1].date, 'dd/MM/yyyy')}`;
      toast.success(`${type} — ${clientLabel}: ${summary}`);

      setTextInput('');
      setReview(null);
      setConflictState(null);
      setRescheduleState(null);
      setSeriesState(null);
      setIsOpen(false);
    } catch (error) {
      console.error('Erro ao criar agendamentos:', error);
      toast.error('Erro ao criar os agendamentos.');
    } finally {
      setIsProcessing(false);
      isProcessingRef.current = false;
    }
  };

  const buildConflictState = (
    client: ScheduleClient,
    type: string,
    time: string,
    command: string,
    dates: Date[],
  ): ConflictState => {
    const conflictingDates: Date[] = [];
    const freeDates: Date[] = [];
    let reason = 'a janela já está ocupada';
    dates.forEach((date) => {
      const conflict = checkSlotConflict(appointments, date, time, client.id);
      if (conflict) {
        conflictingDates.push(date);
        if (conflict.isClientBusy) reason = 'o cliente já tem sessão marcada nesse horário';
      } else {
        freeDates.push(date);
      }
    });
    const suggestions = conflictingDates.length
      ? suggestSlotAlternatives({
          appointments,
          clientId: client.id,
          requestedDate: conflictingDates[0],
          requestedTime: time,
          availabilities: adminAvailabilities,
          max: 3,
          priority: 'sameDay',
        })
      : [];
    return { client, type, time, command, requestedDates: dates, conflictingDates, freeDates, reason, suggestions };
  };

  const handleConflictSuggestion = async (suggestion: SlotSuggestion) => {
    if (!conflictState) return;
    const state = conflictState;
    setConflictState(null);
    const slots = [
      ...state.freeDates.map((date) => ({ date, time: state.time })),
      { date: suggestion.date, time: suggestion.time },
    ];
    await createAppointments(state.client, state.type, slots, state.command);
    const skipped = state.conflictingDates.length - 1;
    if (skipped > 0) {
      toast.info(`${skipped} ${skipped === 1 ? 'data em conflito ficou' : 'datas em conflito ficaram'} sem agendamento.`);
    }
  };

  const handleScheduleFreeOnly = async () => {
    if (!conflictState) return;
    const state = conflictState;
    setConflictState(null);
    await createAppointments(
      state.client,
      state.type,
      state.freeDates.map((date) => ({ date, time: state.time })),
      state.command,
    );
  };

  const handleReschedule = (parsed: ParsedScheduleCommand) => {
    const client = parsed.client as ScheduleClient;
    const today = startOfDay(new Date());
    const upcoming = appointments
      .filter((appointment) => {
        if (appointment.id_cliente !== client.id) return false;
        if (!isActiveAppointment(appointment)) return false;
        return parseLocalISO(appointment.data) >= today;
      })
      .sort((a, b) => a.data.localeCompare(b.data));

    const target = upcoming[0];
    if (!target) {
      toast.error('Este cliente não tem sessões futuras para reagendar.');
      return;
    }

    if (parsed.missing.includes('date')) {
      toast.error('Indique a nova data. Ex.: "remarcar para quinta 10:00".');
      return;
    }
    if (parsed.missing.includes('time')) {
      toast.error('Indique a nova hora. Ex.: "remarcar para quinta 10:00".');
      return;
    }

    let targetDate = parsed.specificDate;
    if (!targetDate && parsed.weekdays.length > 0) {
      const jsDay = WEEKDAY_JS[parsed.weekdays[0]];
      if (jsDay !== undefined) {
        const diff = (jsDay - today.getDay() + 7) % 7;
        targetDate = addDays(today, diff === 0 ? 7 : diff);
      }
    }
    if (!targetDate) {
      toast.error('Não foi possível identificar a nova data do reagendamento.');
      return;
    }

    const conflict = checkSlotConflict(appointments, targetDate, parsed.time, client.id);
    setRescheduleState({
      appointment: target,
      client,
      targetDate,
      targetTime: parsed.time,
      busy: conflict !== null,
      suggestions: conflict
        ? suggestSlotAlternatives({
            appointments,
            clientId: client.id,
            requestedDate: targetDate,
            requestedTime: parsed.time,
            availabilities: adminAvailabilities,
            max: 3,
            priority: 'sameDay',
          })
        : [],
    });
    toast.info('Confirme o reagendamento no painel abaixo.');
  };

  const handleConfirmReschedule = async () => {
    if (!rescheduleState) return;
    const state = rescheduleState;
    setIsProcessing(true);
    isProcessingRef.current = true;
    try {
      const dateStr = format(state.targetDate, 'yyyy-MM-dd');
      await updateAppointment(state.appointment.id, {
        data: `${dateStr}T${state.targetTime}:00`,
        hora: state.targetTime,
      });
      const clientLabel = state.client.id_manual ? `${state.client.nome} (${state.client.id_manual})` : state.client.nome;
      toast.success(
        `Sessão de ${clientLabel} reagendada para ${format(state.targetDate, 'dd/MM (eeee)', { locale: pt })} às ${state.targetTime}`,
      );
      setRescheduleState(null);
      setTextInput('');
      setIsOpen(false);
    } finally {
      setIsProcessing(false);
      isProcessingRef.current = false;
    }
  };

  const handleRescheduleSuggestion = (suggestion: SlotSuggestion) => {
    setRescheduleState((prev) =>
      prev
        ? {
            ...prev,
            targetDate: suggestion.date,
            targetTime: suggestion.time,
            busy: checkSlotConflict(appointments, suggestion.date, suggestion.time, prev.client.id) !== null,
            suggestions: [],
          }
        : prev,
    );
  };

  const handleSeries = async (parsed: ParsedScheduleCommand, command: string) => {
    const client = parsed.client as ScheduleClient;
    const month = parsed.seriesMonth as Date;
    let weekday: number | null = null;
    if (parsed.weekdays.length > 0 && WEEKDAY_JS[parsed.weekdays[0]] !== undefined) {
      weekday = WEEKDAY_JS[parsed.weekdays[0]];
    } else if (parsed.specificDate) {
      weekday = parsed.specificDate.getDay();
    } else {
      const pattern = getClientPattern(appointments, client.id);
      if (pattern) weekday = pattern.weekday;
    }

    if (weekday === null) {
      toast.info('Indique o dia da semana da série. Ex.: "marcar 4 sessões de outubro do 21A às segundas 16:00".');
      setReview({
        clientId: client.id.toString(),
        type: parsed.appointmentType,
        time: parsed.time,
        dateStr: `${format(month, 'yyyy-MM')}-01`,
        weekdays: [],
        recurring: true,
        endDateStr: `${format(month, 'yyyy-MM')}-28`,
      });
      return;
    }

    const plan = planSeries(
      appointments,
      client.id,
      parsed.appointmentType,
      parsed.time,
      month,
      weekday,
      parsed.seriesCount as number,
      adminAvailabilities,
    );

    if (!plan) {
      toast.error('Não foi possível planear a série.');
      return;
    }

    if (plan.toCreate.length === 0) {
      toast.info(
        plan.existing.length > 0
          ? `A série já está completa: ${plan.existing.length} sessões existentes contam para o total.`
          : 'Não foi possível encontrar slots livres para a série nesse mês.',
      );
      return;
    }

    setSeriesState({
      client,
      type: parsed.appointmentType,
      time: parsed.time,
      command,
      month,
      existingCount: plan.existing.length,
      plannedDates: plan.toCreate,
      requestedCount: parsed.seriesCount as number,
    });
  };

  const handleConfirmSeries = async () => {
    if (!seriesState) return;
    const state = seriesState;
    setSeriesState(null);
    await createAppointments(
      state.client,
      state.type,
      state.plannedDates.map((date) => ({ date, time: state.time })),
      state.command,
    );
  };

  const processAndSchedule = async (command: string) => {
    if (!command.trim()) {
      toast.error('Diga ou escreva um comando para processar.');
      return;
    }

    setIsProcessing(true);
    isProcessingRef.current = true;
    try {
      const parsed = parseScheduleCommand(command, clients);
      const isComplete = parsed.missing.length === 0 && parsed.client !== null;

      if (parsed.action === 'reschedule' && parsed.client) {
        handleReschedule(parsed);
        return;
      }

      if (isComplete && parsed.client && parsed.seriesCount) {
        await handleSeries(parsed, command);
        return;
      }

      if (isComplete && parsed.client) {
        const client = parsed.client;
        const dates = generateDatesForCommand(parsed);
        if (dates.length === 0) {
          toast.error('Nenhuma data válida encontrada no comando.');
          return;
        }
        const hasConflict = dates.some(
          (date) => checkSlotConflict(appointments, date, parsed.time, client.id) !== null,
        );
        if (hasConflict) {
          const state = buildConflictState(client, parsed.appointmentType, parsed.time, command, dates);
          setConflictState(state);
          toast.error('Conflito detetado: o horário pedido está ocupado. Veja as alternativas sugeridas.');
          return;
        }
        await createAppointments(
          client,
          parsed.appointmentType,
          dates.map((date) => ({ date, time: parsed.time })),
          command,
        );
        return;
      }

      // Informação incompleta ou cliente não reconhecido: abrir revisão pré-preenchida
      const todayStr = format(new Date(), 'yyyy-MM-dd');
      setReview({
        clientId: parsed.client ? parsed.client.id.toString() : '',
        type: parsed.appointmentType,
        time: parsed.time,
        dateStr: parsed.specificDate ? format(parsed.specificDate, 'yyyy-MM-dd') : todayStr,
        weekdays: parsed.weekdays,
        recurring: parsed.recurring,
        endDateStr: format(parsed.endDate, 'yyyy-MM-dd'),
      });

      if (!parsed.client) {
        toast.info('Cliente não reconhecido. Selecione o cliente na janela de revisão.');
      } else if (parsed.missing.includes('date')) {
        toast.info('Data não identificada. Complete os detalhes na janela de revisão.');
      } else if (parsed.missing.includes('time')) {
        toast.info('Hora não identificada. Complete os detalhes na janela de revisão.');
      }
    } catch (error) {
      console.error('Erro ao processar comando:', error);
      toast.error('Erro ao processar o comando. Tente ser mais específico.');
    } finally {
      setIsProcessing(false);
      isProcessingRef.current = false;
    }
  };

  processAndScheduleRef.current = processAndSchedule;

  const handleSubmit = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (isListening) {
      stop(true);
      return;
    }
    await processAndSchedule(textInput);
  };

  const reviewDates = useMemo(() => {
    if (!review) return [];
    if (review.recurring) {
      return generateDatesForCommand({
        recurring: true,
        specificDate: null,
        weekdays: review.weekdays,
        endDate: new Date(`${review.endDateStr}T00:00:00`),
      });
    }
    return [new Date(`${review.dateStr}T00:00:00`)];
  }, [review]);

  // Sugestões baseadas no padrão do cliente quando falta data no comando
  const reviewSuggestions = useMemo(() => {
    if (!review || review.recurring) return null;
    const client = clients.find((c) => c.id.toString() === review.clientId);
    if (!client) return null;
    const pattern = getClientPattern(appointments, client.id);
    if (!pattern) return [];
    return suggestSlotAlternatives({
      appointments,
      clientId: client.id,
      requestedDate: new Date(`${review.dateStr}T00:00:00`),
      requestedTime: review.time,
      availabilities: adminAvailabilities,
      max: 3,
      priority: 'pattern',
    });
  }, [review, clients, appointments, adminAvailabilities]);

  const handleConfirmReview = async () => {
    if (!review) return;

    const client = clients.find((c) => c.id.toString() === review.clientId);
    if (!client) {
      toast.error('Selecione um cliente.');
      return;
    }

    if (review.recurring && review.weekdays.length === 0) {
      toast.error('Selecione pelo menos um dia da semana.');
      return;
    }

    const dates = reviewDates;
    const hasConflict = dates.some(
      (date) => checkSlotConflict(appointments, date, review.time, client.id) !== null,
    );
    if (hasConflict) {
      const state = buildConflictState(
        client,
        review.type,
        review.time,
        textInput || `${review.type} ${client.nome}`,
        dates,
      );
      setConflictState(state);
      toast.error('Conflito detetado: o horário pedido está ocupado. Veja as alternativas sugeridas.');
      return;
    }

    await createAppointments(
      client,
      review.type,
      dates.map((date) => ({ date, time: review.time })),
      textInput,
    );
  };

  const toggleWeekday = (weekday: string) => {
    setReview((prev) =>
      prev
        ? {
            ...prev,
            weekdays: prev.weekdays.includes(weekday)
              ? prev.weekdays.filter((wd) => wd !== weekday)
              : [...prev.weekdays, weekday],
          }
        : prev,
    );
  };

  const getTypeColor = (type: string) => {
    const t = normalizeText(type);
    if (t.includes('avaliação')) return 'bg-blue-100 text-blue-800';
    if (t.includes('neurofeedback') || t.includes('discussão')) return 'bg-yellow-100 text-yellow-800';
    if (t.includes('ioga') || t.includes('yoga')) return 'bg-green-100 text-green-800';
    if (t.includes('biorresonância')) return 'bg-[#A4B734] text-white';
    if (t.includes('ofes')) return 'bg-red-100 text-red-800';
    if (t.includes('psicologia')) return 'bg-orange-100 text-orange-800';
    if (t.includes('constelações')) return 'bg-purple-100 text-purple-800';
    switch (t) {
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

  return (
    <Dialog open={isOpen} onOpenChange={(open) => { setIsOpen(open); if (!open) { setReview(null); setConflictState(null); setRescheduleState(null); setSeriesState(null); } }}>
      <DialogTrigger asChild>
        <Button className="bg-[#3f9094] hover:bg-[#265255] text-white">
          <Zap className="h-4 w-4 mr-2" />
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
              <form onSubmit={(e) => handleSubmit(e)} className="space-y-4">
                <div className="flex gap-2">
                  <Input
                    placeholder="Fale ou escreva: 21A neurofeedback segunda 16:00"
                    value={textInput}
                    onChange={(e) => setTextInput(e.target.value)}
                    className="flex-1"
                  />
                  <Button
                    type="button"
                    onClick={isListening ? () => stop(true) : () => start(textInput)}
                    variant={isListening ? "destructive" : "outline"}
                    size="icon"
                    title="Ditar comando (duplo Ctrl em qualquer página)"
                    disabled={!isSupported}
                  >
                    {isListening ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
                  </Button>
                </div>

                {isListening && (
                  <div className="inline-flex items-center gap-3 rounded-full border border-[#3f9094]/30 bg-[#3f9094]/10 px-3 py-1.5">
                    <span className="flex items-end gap-[3px]" aria-hidden="true">
                      <span className="h-2.5 w-1 rounded-sm bg-[#3f9094] animate-pulse" />
                      <span className="h-3.5 w-1 rounded-sm bg-[#3f9094] animate-pulse [animation-delay:150ms]" />
                      <span className="h-2.5 w-1 rounded-sm bg-[#3f9094] animate-pulse [animation-delay:300ms]" />
                    </span>
                    <span className="text-sm text-[#265255]">
                      A ouvir... pare de falar para agendar automaticamente.
                    </span>
                    <button
                      type="button"
                      onClick={() => stop(false)}
                      title="Cancelar ditado"
                      className="rounded-full p-0.5 text-[#3f9094] transition-colors hover:bg-[#3f9094]/20 hover:text-[#265255]"
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  </div>
                )}

                {isSupported ? (
                  <p className="text-xs text-muted-foreground">
                    <kbd className="mr-1 rounded border bg-muted px-1.5 py-0.5 font-mono text-[10px] font-semibold text-[#265255]">
                      Ctrl 2×
                    </kbd>
                    para ditar em qualquer página da aplicação
                  </p>
                ) : (
                  <p className="text-xs text-amber-600">
                    Ditado não suportado neste navegador. Use Chrome ou Edge.
                  </p>
                )}

                <Button
                  type="submit"
                  disabled={!textInput.trim() || isProcessing}
                  className="w-full bg-[#3f9094] hover:bg-[#265255]"
                >
                  {isProcessing ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Processando...
                    </>
                  ) : (
                    'Agendar'
                  )}
                </Button>
              </form>
            </CardContent>
          </Card>

          {/* Conflito detetado + alternativas */}
          {conflictState && (
            <Card className="border-destructive">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <AlertTriangle className="h-5 w-5 text-destructive" />
                  Conflito detetado
                </CardTitle>
                <p className="text-sm text-muted-foreground">
                  {conflictState.conflictingDates.length === 1
                    ? `${format(conflictState.conflictingDates[0], "dd/MM (eeee)", { locale: pt })} às ${conflictState.time}: ${conflictState.reason}.`
                    : `${conflictState.conflictingDates.length} de ${conflictState.requestedDates.length} slots com conflito: ${conflictState.reason}.`}
                </p>
              </CardHeader>
              <CardContent className="space-y-4">
                <SlotSuggestionsPanel
                  title="Alternativas imediatas"
                  description="Mesmo dia noutro horário livre ou padrão do cliente na semana seguinte."
                  suggestions={conflictState.suggestions}
                  onSelect={handleConflictSuggestion}
                  emptyMessage="Sem histórico suficiente para sugerir horários."
                />
                {conflictState.freeDates.length > 0 && (
                  <Button variant="outline" className="w-full" onClick={handleScheduleFreeOnly}>
                    Agendar apenas os {conflictState.freeDates.length} dias livres
                  </Button>
                )}
              </CardContent>
            </Card>
          )}

          {/* Reagendamento */}
          {rescheduleState && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <CalendarClock className="h-5 w-5" />
                  Reagendar sessão
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="rounded-md border border-border p-3 text-sm space-y-1">
                  <p>
                    <span className="text-muted-foreground">Atual:</span>{' '}
                    {format(parseLocalISO(rescheduleState.appointment.data), "dd/MM/yyyy (eeee)", { locale: pt })}
                    {rescheduleState.appointment.hora ? ` às ${rescheduleState.appointment.hora}` : ''}
                  </p>
                  <p>
                    <span className="text-muted-foreground">Nova:</span>{' '}
                    {format(rescheduleState.targetDate, "dd/MM/yyyy (eeee)", { locale: pt })} às {rescheduleState.targetTime}
                  </p>
                </div>
                {rescheduleState.busy && (
                  <SlotSuggestionsPanel
                    title="Novo horário ocupado"
                    description="Escolha uma alternativa para o reagendamento."
                    suggestions={rescheduleState.suggestions}
                    onSelect={handleRescheduleSuggestion}
                    emptyMessage="Sem histórico suficiente para sugerir horários."
                  />
                )}
                <Button
                  className="w-full bg-[#3f9094] hover:bg-[#265255]"
                  disabled={rescheduleState.busy || isProcessing}
                  onClick={handleConfirmReschedule}
                >
                  {isProcessing ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      A reagendar...
                    </>
                  ) : (
                    'Confirmar reagendamento'
                  )}
                </Button>
              </CardContent>
            </Card>
          )}

          {/* Série mensal */}
          {seriesState && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <CalendarClock className="h-5 w-5" />
                  Série de sessões
                </CardTitle>
                <p className="text-sm text-muted-foreground">
                  {seriesState.existingCount > 0
                    ? `${seriesState.existingCount} de ${seriesState.requestedCount} sessões já existem e contam para o total.`
                    : `Nenhuma sessão existente desta série em ${format(seriesState.month, 'MMMM', { locale: pt })}.`}
                </p>
              </CardHeader>
              <CardContent className="space-y-4">
                <ul className="space-y-1">
                  {seriesState.plannedDates.map((date) => (
                    <li key={format(date, 'yyyy-MM-dd')} className="text-sm capitalize">
                      {format(date, "eeee, dd/MM 'às'", { locale: pt })} {seriesState.time}
                    </li>
                  ))}
                </ul>
                <Button
                  className="w-full bg-[#3f9094] hover:bg-[#265255]"
                  disabled={isProcessing}
                  onClick={handleConfirmSeries}
                >
                  Criar {seriesState.plannedDates.length}{' '}
                  {seriesState.plannedDates.length === 1 ? 'agendamento' : 'agendamentos'}
                </Button>
              </CardContent>
            </Card>
          )}

          {/* Revisão manual (aparece só quando falta informação) */}
          {review && (
            <Card className="border-amber-300">
              <CardHeader>
                <CardTitle className="text-lg">Completar Agendamento</CardTitle>
                <p className="text-sm text-muted-foreground">
                  Confirme ou ajuste os detalhes antes de marcar no calendário.
                </p>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-xs font-medium text-gray-600">Cliente</Label>
                    <Select
                      value={review.clientId}
                      onValueChange={(value) => setReview({ ...review, clientId: value })}
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Selecionar cliente" />
                      </SelectTrigger>
                      <SelectContent>
                        {clients.map((client) => (
                          <SelectItem key={client.id} value={client.id.toString()}>
                            {client.id_manual ? `[${client.id_manual}] ` : ''}{client.nome}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-xs font-medium text-gray-600">Tipo</Label>
                    <Select
                      value={review.type}
                      onValueChange={(value) => setReview({ ...review, type: value })}
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {APPOINTMENT_TYPES.map((type) => (
                          <SelectItem key={type} value={type}>{type}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {review.recurring ? (
                  <div className="space-y-3">
                    <Label className="text-xs font-medium text-gray-600">Dias da semana</Label>
                    <div className="flex flex-wrap gap-2">
                      {WEEKDAY_OPTIONS.map((wd) => (
                        <Button
                          key={wd.label}
                          type="button"
                          size="sm"
                          variant={review.weekdays.includes(wd.label) ? "default" : "outline"}
                          className={review.weekdays.includes(wd.label) ? "bg-[#3f9094] hover:bg-[#265255]" : ""}
                          onClick={() => toggleWeekday(wd.label)}
                        >
                          {wd.short}
                        </Button>
                      ))}
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label className="text-xs font-medium text-gray-600">Repetir até</Label>
                        <Input
                          type="date"
                          value={review.endDateStr}
                          onChange={(e) => setReview({ ...review, endDateStr: e.target.value })}
                        />
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label className="text-xs font-medium text-gray-600">Data</Label>
                      <Input
                        type="date"
                        value={review.dateStr}
                        onChange={(e) => setReview({ ...review, dateStr: e.target.value })}
                      />
                    </div>
                  </div>
                )}

                {reviewSuggestions !== null && !review.recurring && (
                  <SlotSuggestionsPanel
                    title="Sugestões com base no padrão do cliente"
                    suggestions={reviewSuggestions}
                    onSelect={(suggestion) =>
                      setReview({
                        ...review,
                        dateStr: format(suggestion.date, 'yyyy-MM-dd'),
                        time: suggestion.time,
                      })
                    }
                    emptyMessage="Sem histórico suficiente para sugerir horários."
                  />
                )}

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-xs font-medium text-gray-600">Hora</Label>
                    <Input
                      type="time"
                      value={review.time}
                      onChange={(e) => setReview({ ...review, time: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-xs font-medium text-gray-600">Resumo</Label>
                    <div className="flex items-center gap-2 h-10">
                      <Badge className={getTypeColor(review.type)}>{review.type}</Badge>
                      <span className="text-sm text-gray-600">
                        {reviewDates.length === 1
                          ? format(reviewDates[0], "dd/MM (eeee)", { locale: pt })
                          : `${reviewDates.length} sessões`}
                      </span>
                    </div>
                  </div>
                </div>

                <Button
                  onClick={handleConfirmReview}
                  disabled={isProcessing || reviewDates.length === 0}
                  className="w-full bg-[#3f9094] hover:bg-[#265255]"
                >
                  {isProcessing ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Criando...
                    </>
                  ) : (
                    `Marcar ${reviewDates.length === 1 ? 'Agendamento' : `${reviewDates.length} Agendamentos`}`
                  )}
                </Button>
              </CardContent>
            </Card>
          )}

          {/* Exemplos de comandos */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Exemplos de Comandos</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {smartSchedulingExamples.map((category, index) => (
                  <div key={index}>
                    <h4 className="font-medium text-sm text-[#265255] mb-2">{category.category}</h4>
                    <div className="space-y-1">
                      {category.examples.slice(0, 2).map((example, exIndex) => (
                        <button
                          key={exIndex}
                          type="button"
                          onClick={() => setTextInput(example)}
                          className="block w-full text-left text-xs text-gray-600 pl-2 border-l-2 border-[#3f9094]/20 hover:text-[#3f9094] hover:border-[#3f9094]"
                        >
                          "{example}"
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
                <div className="mt-3 pt-3 border-t">
                  <h4 className="font-medium text-sm text-[#265255] mb-2">Dicas</h4>
                  <div className="space-y-1">
                    {tips.slice(0, 5).map((tip, tipIndex) => (
                      <p key={tipIndex} className="text-xs text-gray-600">
                        • {tip}
                      </p>
                    ))}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {review && (
            <div className="flex items-center gap-2 text-xs text-gray-500">
              <CheckCircle className="h-3 w-3" />
              Tudo completo? O agendamento é marcado automaticamente no calendário.
            </div>
          )}
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => { setIsOpen(false); setReview(null); }}
            className="w-full"
          >
            Fechar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default SmartScheduling;
