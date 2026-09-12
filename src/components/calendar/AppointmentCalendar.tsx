import React, { useCallback, useMemo, useRef, useState, useEffect } from 'react';
import { Button } from '../ui/button';
import { Switch } from '../ui/switch';
import { Label } from '../ui/label';
import { useSms } from '@/hooks/useSms';
import { useSupabaseClient } from '@/hooks/useSupabaseClient';
import { Send, MessageSquare } from 'lucide-react';
import { Textarea } from '../ui/textarea';
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '../ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '../ui/alert-dialog';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '../ui/form';
import { Input } from '../ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { addDays, addMonths, addYears, format, isSameDay, startOfMonth, endOfMonth, startOfWeek, endOfWeek, eachDayOfInterval, isToday, isSameMonth, compareAsc } from 'date-fns';
import { pt } from 'date-fns/locale';
import { useIsMobile } from '@/hooks/use-mobile';
import { Plus, Search, Calendar, ChevronLeft, ChevronRight, MoreHorizontal, Settings, Upload, Copy, Menu } from 'lucide-react';
import useAppointments, { Appointment } from '@/hooks/useAppointments';
import useClients from '@/hooks/useClients';
import { parseLocalISO } from '@/utils/dateUtils';
import { getEventColors, isValidHex as isValidHexColor } from '@/utils/eventColors';

const parseISO = parseLocalISO;


import { getAllHolidaysUntil2040, isHoliday } from '@/data/portugueseHolidays';
import { Checkbox } from '../ui/checkbox';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator
} from '../ui/dropdown-menu';
import SmartScheduling from './SmartScheduling';
import TimeGridView, { isAllDayAppointment } from './TimeGridView';
import QuickCreatePopover, { APPOINTMENT_TYPES, getAutoColorForType, QuickCreatePayload } from './QuickCreatePopover';
import CalendarImport from './CalendarImport';
import WaitlistFillPanel, { WaitlistSlot } from './WaitlistFillPanel';
import { Popover, PopoverContent, PopoverTrigger } from '../ui/popover';
import { Info } from 'lucide-react';

type AppointmentType = 'sessão' | 'avaliação' | 'reavaliação' | 'consulta' | 'consulta de psicologia' | 'constelações familiares' | 'discussão de resultados' | 'neurofeedback' | 'ioga' | 'ofes' | 'biorresonância magnética';
type CalendarView = 'month' | 'week' | 'day' | 'agenda';



interface AppointmentFormValues {
  titulo: string;
  data_inicio: string;
  hora_inicio: string;
  data_fim: string;
  hora_fim: string;
  id_cliente: number | null;
  tipo: AppointmentType;
  notas: string;
  estado: string;
  terapeuta: string;
  cor: string;
}

const AppointmentCalendar = () => {
  const { appointments, isLoading: isLoadingAppointments, addAppointment, addAppointmentsBatch, updateAppointment, deleteAppointment } = useAppointments();
  const { clients, isLoading: isLoadingClients } = useClients();

  const [currentDate, setCurrentDate] = useState<Date>(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [overflowDay, setOverflowDay] = useState<{ date: Date; appointments: Appointment[] } | null>(null);
  const [isImportDialogOpen, setIsImportDialogOpen] = useState(false);
  const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null);
  const [currentView, setCurrentView] = useState<CalendarView>('month');
  const isMobile = useIsMobile();
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [clientSearchQuery, setClientSearchQuery] = useState<string>('');
  const [clientAvailabilities, setClientAvailabilities] = useState<Record<number, any[]>>({});
  const [showAvailabilities, setShowAvailabilities] = useState(true);
  
  const [isAllDay, setIsAllDay] = useState(false);
  const [recurrenceType, setRecurrenceType] = useState<string>('none');
  const [recurrenceCount, setRecurrenceCount] = useState<number>(8);

  // Quick-create estilo Google (popover nas células/slots vazios)
  const [quickCreate, setQuickCreate] = useState<{ date: Date; anchorPoint: { x: number; y: number } } | null>(null);
  const [isQuickCreating, setIsQuickCreating] = useState(false);

  // Lista de espera: slot libertado por um cancelamento
  const [waitlistSlot, setWaitlistSlot] = useState<WaitlistSlot | null>(null);

  const getWeeklyRecurrenceLabel = (dateStr?: string) => {
    if (!dateStr) return 'Semanalmente';
    try {
      const d = parseISO(`${dateStr}T00:00:00`);
      const dayName = format(d, 'eeee', { locale: pt });
      return `Semanalmente à ${dayName.charAt(0).toUpperCase() + dayName.slice(1)}`;
    } catch (e) {
      return 'Semanalmente';
    }
  };

  const getYearlyRecurrenceLabel = (dateStr?: string) => {
    if (!dateStr) return 'Anualmente';
    try {
      const d = parseISO(`${dateStr}T00:00:00`);
      return `Anual em ${format(d, "d 'de' MMMM", { locale: pt })}`;
    } catch (e) {
      return 'Anualmente';
    }
  };

  const [smsPreviewOpen, setSmsPreviewOpen] = useState(false);
  const [smsMessage, setSmsMessage] = useState('');

  const { sendManualSms, isSending } = useSms();
  const [isAutomationEnabled, setIsAutomationEnabled] = useState(false);

  const supabase = useSupabaseClient();

  // Carregar estado da automação
  useEffect(() => {
    const fetchAutomationState = async () => {
      const { data } = await supabase
        .from('app_configs')
        .select('value')
        .eq('key', 'sms_automation_enabled')
        .maybeSingle();

      if (data) setIsAutomationEnabled(!!data.value);
    };
    fetchAutomationState();
  }, [supabase]);

  const toggleAutomation = async (enabled: boolean) => {
    setIsAutomationEnabled(enabled);
    try {
      await supabase
        .from('app_configs')
        .upsert({ key: 'sms_automation_enabled', value: enabled });
      toast.success(`Automação de SMS ${enabled ? 'ativada' : 'desativada'}`);
    } catch (err) {
      toast.error("Erro ao atualizar automação");
    }
  };

  const openSmsPreview = () => {
    if (!selectedAppointment) return;

    const client = (selectedAppointment as any).clientes;
    if (!client) return;

    // Gerar mensagem padrão com dados do agendamento
    const apptDate = selectedAppointment.data ? format(parseISO(selectedAppointment.data), 'dd/MM/yyyy') : '';
    const apptTime = selectedAppointment.hora || '';
    const defaultMessage = `Olá ${client.nome || 'Estimado Cliente'},\n\nLembrete da sua sessão:\nData: ${apptDate}\nHora: ${apptTime}\n\nNeuroBalance`;

    setSmsMessage(defaultMessage);
    setSmsPreviewOpen(true);
  };

  const handleSendManualSms = async () => {
    if (!selectedAppointment) return;

    const client = (selectedAppointment as any).clientes;
    if (!client?.telefone) {
      toast.error("Cliente sem número de telefone");
      return;
    }

    const result = await sendManualSms(
      client.telefone,
      smsMessage,
      selectedAppointment.id,
      selectedAppointment.id_cliente || undefined
    );

    if (result.success) {
      setSmsPreviewOpen(false);
      toast.success('SMS enviado com sucesso!');
    }
  };

  const holidays = useMemo(() => getAllHolidaysUntil2040(), []);

  // Arrays de dias memoizados para as vistas dia/semana (identidade estável evita
  // re-renders desnecessários do TimeGridView)
  const dayViewDays = useMemo(() => (selectedDate ? [selectedDate] : []), [selectedDate]);

  const weekViewDays = useMemo(() => {
    const weekStart = startOfWeek(selectedDate || currentDate, { weekStartsOn: 0 });
    const weekEnd = endOfWeek(weekStart, { weekStartsOn: 0 });
    return eachDayOfInterval({ start: weekStart, end: weekEnd });
  }, [selectedDate, currentDate]);

  const form = useForm<AppointmentFormValues>({
    defaultValues: {
      titulo: '',
      data_inicio: '',
      hora_inicio: '09:00',
      data_fim: '',
      hora_fim: '10:00',
      id_cliente: null,
      tipo: 'sessão',
      notas: '',
      estado: 'pendente',
      terapeuta: '',
      cor: '#039be5'
    },
  });

  const openNewAppointmentDialog = (date?: Date) => {
    setSelectedAppointment(null);
    const today = date || new Date();

    setIsAllDay(false);
    setRecurrenceType('none');
    setRecurrenceCount(8);

    const startTimeStr = date ? format(date, 'HH:mm') : '09:00';
    const [startH, startM] = startTimeStr.split(':').map(Number);
    const endH = (startH + 1) % 24;
    const endTimeStr = `${endH.toString().padStart(2, '0')}:${(startM || 0).toString().padStart(2, '0')}`;
    const dateStr = format(today, 'yyyy-MM-dd');

    form.reset({
      titulo: '',
      data_inicio: dateStr,
      hora_inicio: startTimeStr,
      data_fim: dateStr,
      hora_fim: endTimeStr,
      id_cliente: null,
      tipo: 'sessão',
      notas: '',
      estado: 'pendente',
      terapeuta: '',
      cor: '#039be5'
    });

    setIsDialogOpen(true);
  };

  const openQuickCreate = useCallback((date: Date, anchorPoint?: { x: number; y: number }) => {
    setSelectedDate(date);
    setQuickCreate({
      date,
      anchorPoint: anchorPoint || { x: window.innerWidth / 2, y: window.innerHeight / 3 },
    });
  }, []);

  const handleQuickCreate = async (payload: QuickCreatePayload) => {
    setIsQuickCreating(true);
    try {
      const dateStr = format(payload.date, 'yyyy-MM-dd');
      const startTime = format(payload.date, 'HH:mm');
      const endTime = format(new Date(payload.date.getTime() + 60 * 60 * 1000), 'HH:mm');

      await addAppointment({
        titulo: payload.titulo,
        data: `${dateStr}T${startTime}:00`,
        hora: `${startTime} - ${endTime}`,
        id_cliente: null,
        tipo: payload.tipo,
        notas: '',
        estado: 'pendente',
        terapeuta: '',
        cor: getAutoColorForType(payload.tipo),
      });

      toast.success('Novo agendamento criado!', {
        description: `${payload.titulo} - ${format(payload.date, "dd/MM/yyyy 'às' HH:mm", { locale: pt })}`,
        duration: 4000
      });
      setQuickCreate(null);
    } catch (error: any) {
      console.error('Erro ao criar agendamento (quick-create):', error);
      toast.error(`Erro: ${error?.message || 'Erro desconhecido ao criar agendamento'}`);
    } finally {
      setIsQuickCreating(false);
    }
  };

  const handleWaitlistCreate = async (client: { id: number; nome: string }) => {
    if (!waitlistSlot) return;
    try {
      const [h, m] = waitlistSlot.hora.split(':').map(Number);
      const endH = Number.isNaN(h) ? 10 : (h + 1) % 24;
      const endM = Number.isNaN(m) ? 0 : m;
      const endTime = `${endH.toString().padStart(2, '0')}:${endM.toString().padStart(2, '0')}`;

      await addAppointment({
        titulo: `${waitlistSlot.tipo} - ${client.nome}`,
        data: `${waitlistSlot.dateStr}T${waitlistSlot.hora}:00`,
        hora: `${waitlistSlot.hora} - ${endTime}`,
        id_cliente: client.id,
        tipo: waitlistSlot.tipo,
        notas: 'Preenchimento via lista de espera',
        estado: 'pendente',
        terapeuta: '',
        cor: getAutoColorForType(waitlistSlot.tipo),
      });
      toast.success(
        `Sessão de ${client.nome} agendada para ${format(parseISO(`${waitlistSlot.dateStr}T00:00:00`), 'dd/MM (eeee)', { locale: pt })} às ${waitlistSlot.hora}`,
      );
      setWaitlistSlot(null);
    } catch (error) {
      console.error('Erro ao criar agendamento da lista de espera:', error);
      toast.error('Erro ao criar agendamento da lista de espera');
    }
  };

  const handleEventClick = useCallback((appointment: Appointment) => {
    setSelectedAppointment(appointment);
    setRecurrenceType('none');

    const aptDate = parseISO(appointment.data);
    const dateStr = format(aptDate, 'yyyy-MM-dd');

    let startTimeStr = '09:00';
    let endTimeStr = '10:00';
    let endDateStr = dateStr;

    const horaStr = appointment.hora || '';
    const isAllDayAppt = horaStr === 'Todo o dia' || horaStr.startsWith('Todo o dia') || (startTimeStr === '00:00' && endTimeStr === '23:59');
    setIsAllDay(isAllDayAppt);

    if (horaStr.includes('|')) {
      const [timePart, datePart] = horaStr.split('|').map(s => s.trim());
      if (datePart && /^\d{4}-\d{2}-\d{2}$/.test(datePart)) {
        endDateStr = datePart;
      }
      if (timePart.includes('-')) {
        const parts = timePart.split('-').map(s => s.trim());
        if (parts[0]) startTimeStr = parts[0];
        if (parts[1]) endTimeStr = parts[1];
      }
    } else if (horaStr.includes('-')) {
      const parts = horaStr.split('-').map(s => s.trim());
      if (parts[0]) startTimeStr = parts[0];
      if (parts[1]) endTimeStr = parts[1];
    } else if (horaStr.includes(':')) {
      startTimeStr = horaStr.trim();
      const [h, m] = startTimeStr.split(':').map(Number);
      if (!isNaN(h)) {
        endTimeStr = `${((h + 1) % 24).toString().padStart(2, '0')}:${(m || 0).toString().padStart(2, '0')}`;
      }
    }

    form.reset({
      titulo: appointment.titulo,
      data_inicio: dateStr,
      hora_inicio: startTimeStr,
      data_fim: endDateStr,
      hora_fim: endTimeStr,
      id_cliente: appointment.id_cliente,
      tipo: (appointment.tipo || 'sessão') as AppointmentType,
      notas: appointment.notas || '',
      estado: appointment.estado,
      terapeuta: appointment.terapeuta || '',
      cor: appointment.cor || '#039be5'
    });
    setIsDialogOpen(true);
  }, [form]);

  const handleDeleteAppointment = async () => {
    if (selectedAppointment) {
      try {
        await deleteAppointment(selectedAppointment.id);
        setIsDeleteDialogOpen(false);
        setIsDialogOpen(false);
        setSelectedAppointment(null);
        form.reset();
      } catch (error) {
        console.error('Error deleting appointment:', error);
      }
    }
  };

  const onSubmit = async (data: AppointmentFormValues) => {
    try {
      const rawId = data.id_cliente;
      const parsedNum = Number(rawId);
      const clientId = (rawId === null || rawId === undefined || rawId === '' as any || rawId === 'null' as any || isNaN(parsedNum) || parsedNum <= 0) ? null : parsedNum;
      const isMultiDay = data.data_fim && data.data_fim !== data.data_inicio;

      const timeRangeOnly = isAllDay ? 'Todo o dia' : `${data.hora_inicio} - ${data.hora_fim}`;
      const horaRange = isMultiDay
        ? `${timeRangeOnly} | ${data.data_fim}`
        : timeRangeOnly;

      const isoData = `${data.data_inicio}T${isAllDay ? '00:00' : data.hora_inicio}:00`;

      const baseData = {
        titulo: data.titulo || 'Novo Agendamento',
        tipo: data.tipo,
        notas: data.notas || '',
        estado: data.estado,
        terapeuta: data.terapeuta || '',
        cor: data.cor || '#039be5'
      };

      if (selectedAppointment) {
        const previousEstado = selectedAppointment.estado;
        await updateAppointment(selectedAppointment.id, {
          ...baseData,
          data: isoData,
          hora: horaRange,
          id_cliente: clientId === null ? undefined : clientId
        });

        if (data.estado === 'cancelado' && previousEstado !== 'cancelado' && !isAllDay) {
          setWaitlistSlot({ dateStr: data.data_inicio, hora: data.hora_inicio, tipo: data.tipo });
          toast.info('Agendamento cancelado. Sugestões da lista de espera disponíveis.');
        }

        if (isMultiDay) {
          const startDateObj = parseISO(`${data.data_inicio}T00:00:00`);
          const endDateObj = parseISO(`${data.data_fim}T00:00:00`);
          if (compareAsc(startDateObj, endDateObj) <= 0) {
            const daysInterval = eachDayOfInterval({ start: startDateObj, end: endDateObj });
            const additionalDays = daysInterval.slice(1);

            if (additionalDays.length > 0) {
              const batchInserts = additionalDays.map(dayDate => ({
                ...baseData,
                data: `${format(dayDate, 'yyyy-MM-dd')}T${isAllDay ? '00:00' : data.hora_inicio}:00`,
                hora: horaRange,
                id_cliente: clientId
              }));
              await addAppointmentsBatch(batchInserts);
            }
          }
        }
        toast.success('Agendamento atualizado com sucesso!');
      } else {
        if (isMultiDay && recurrenceType === 'none') {
          const startDateObj = parseISO(`${data.data_inicio}T00:00:00`);
          const endDateObj = parseISO(`${data.data_fim}T00:00:00`);
          if (compareAsc(startDateObj, endDateObj) <= 0) {
            const daysInterval = eachDayOfInterval({ start: startDateObj, end: endDateObj });
            const batchInserts = daysInterval.map(dayDate => ({
              ...baseData,
              data: `${format(dayDate, 'yyyy-MM-dd')}T${isAllDay ? '00:00' : data.hora_inicio}:00`,
              hora: horaRange,
              id_cliente: clientId
            }));

            await addAppointmentsBatch(batchInserts);
            toast.success('Agendamento criado para o intervalo de datas!', {
              description: `${baseData.titulo} (${format(startDateObj, 'dd/MM')} até ${format(endDateObj, 'dd/MM/yyyy')})`,
              duration: 4000
            });
          }
        } else if (recurrenceType !== 'none') {
          const appointmentsList = [];
          const count = recurrenceCount || 8;
          const baseStartObj = parseISO(`${data.data_inicio}T${isAllDay ? '00:00' : data.hora_inicio}:00`);

          for (let i = 0; i < count; i++) {
            let targetDate = new Date(baseStartObj);

            if (recurrenceType === 'daily') {
              targetDate = addDays(baseStartObj, i);
            } else if (recurrenceType === 'weekly') {
              targetDate = addDays(baseStartObj, i * 7);
            } else if (recurrenceType === 'weekdays') {
              let added = 0;
              let curr = new Date(baseStartObj);
              while (added < i) {
                curr = addDays(curr, 1);
                const day = curr.getDay();
                if (day !== 0 && day !== 6) {
                  added++;
                }
              }
              targetDate = curr;
            } else if (recurrenceType === 'monthly') {
              targetDate = addMonths(baseStartObj, i);
            } else if (recurrenceType === 'yearly') {
              targetDate = addYears(baseStartObj, i);
            }

            const dateStr = format(targetDate, 'yyyy-MM-dd');
            appointmentsList.push({
              ...baseData,
              data: `${dateStr}T${isAllDay ? '00:00' : data.hora_inicio}:00`,
              hora: horaRange,
              id_cliente: clientId
            });
          }

          await addAppointmentsBatch(appointmentsList);
          toast.success(`${count} agendamentos recorrentes criados com sucesso!`);
        } else {
          await addAppointment({
            ...baseData,
            data: isoData,
            hora: horaRange,
            id_cliente: clientId
          });
          toast.success('Novo agendamento criado!', {
            description: `${baseData.titulo} - ${format(parseISO(isoData), 'dd/MM/yyyy', { locale: pt })} (${timeRangeOnly})`,
            duration: 4000
          });
        }
      }

      setIsDialogOpen(false);
      setSelectedAppointment(null);
      setClientSearchQuery('');
      setRecurrenceType('none');
      form.reset();
    } catch (error: any) {
      console.error('Erro ao salvar agendamento:', error);
      const errorMessage = error?.message || 'Erro desconhecido ao salvar agendamento';
      toast.error(`Erro: ${errorMessage}`);
    }
  };

  const handleEventDrop = useCallback(async (appointment: Appointment, newDate: Date) => {
    try {
      const dataStr = format(newDate, 'yyyy-MM-dd');
      const isAllDayAppt = isAllDayAppointment(appointment);
      // Eventos "Todo o dia" mantêm a hora original ao arrastar
      const horaStr = isAllDayAppt ? (appointment.hora || 'Todo o dia') : format(newDate, 'HH:mm');

      await updateAppointment(appointment.id, {
        data: `${dataStr}T${isAllDayAppt ? '00:00' : horaStr}:00`,
        hora: horaStr
      });

      toast.success('Agendamento movido com sucesso!', {
        description: `${appointment.titulo} movido para ${format(newDate, isAllDayAppt ? "dd/MM" : "dd/MM 'às' HH:mm", { locale: pt })}`
      });
    } catch (error) {
      console.error('Erro ao mover agendamento:', error);
      toast.error('Erro ao mover agendamento');
    }
  }, [updateAppointment]);

  const handleTimeSlotClick = useCallback(
    (date: Date, anchorPoint?: { x: number; y: number }) => openQuickCreate(date, anchorPoint),
    [openQuickCreate]
  );

  // Função para importar agendamentos do ficheiro
  const handleImportAppointments = async (importedAppointments: Array<{
    titulo: string;
    data: string;
    hora: string;
    tipo: string;
    terapeuta?: string;
    id_manual?: string;
    estado?: string;
    cor?: string;
    notas?: string;
    clientName?: string;
  }>) => {
    try {
      for (const apt of importedAppointments) {
        const appointmentData = {
          titulo: apt.titulo || 'Sessão Importada',
          data: `${apt.data}T${apt.hora}:00`,
          hora: apt.hora,
          id_cliente: null as number | null,
          tipo: apt.tipo as AppointmentType || 'sessão',
          notas: apt.notas || 'Importado automaticamente',
          estado: apt.estado || 'pendente',
          terapeuta: apt.terapeuta || '',
          cor: apt.cor || '#3B82F6'
        };

        // Tentar encontrar cliente pelo ID manual primeiro, depois pelo nome
        if (clients) {
          if (apt.id_manual) {
            const matchingClient = clients.find(c =>
              (c.id_manual && c.id_manual.toLowerCase() === apt.id_manual!.toLowerCase()) ||
              c.id.toString() === apt.id_manual
            );
            if (matchingClient) {
              appointmentData.id_cliente = matchingClient.id;
            }
          } else if (apt.clientName) {
            const matchingClient = clients.find(c =>
              c.nome.toLowerCase().includes(apt.clientName!.toLowerCase())
            );
            if (matchingClient) {
              appointmentData.id_cliente = matchingClient.id;
            }
          }
        }

        await addAppointment(appointmentData);
      }
    } catch (error) {
      console.error('Erro ao importar agendamentos:', error);
      throw error;
    }
  };

  // Buscar disponibilidades dos clientes
  useEffect(() => {
    const fetchAvailabilities = async () => {
      try {
        const { data, error } = await (supabase as any)
          .from('client_availability')
          .select('*, clientes(id, nome)')
          .eq('status', 'ativo');

        if (error) throw error;

        // Agrupar por cliente
        const grouped: Record<number, any[]> = {};
        data?.forEach((avail: any) => {
          const clienteId = avail.cliente_id;
          if (!grouped[clienteId]) {
            grouped[clienteId] = [];
          }
          grouped[clienteId].push(avail);
        });

        setClientAvailabilities(grouped);
      } catch (error) {
        console.error('Erro ao buscar disponibilidades:', error);
      }
    };

    if (showAvailabilities) {
      fetchAvailabilities();
    }
  }, [showAvailabilities, supabase]);

  // Agrupamento por dia (O(1) por célula em vez de filtrar tudo a cada render)
  const appointmentsByDay = useMemo(() => {
    const map = new Map<string, Appointment[]>();
    appointments.forEach(apt => {
      const key = format(parseISO(apt.data), 'yyyy-MM-dd');
      const arr = map.get(key);
      if (arr) arr.push(apt);
      else map.set(key, [apt]);
    });
    map.forEach(arr => arr.sort((a, b) => a.data.localeCompare(b.data)));
    return map;
  }, [appointments]);

  const getDayAppointments = (day: Date | undefined) => {
    if (!day) return [];
    const dayAppointments = appointmentsByDay.get(format(day, 'yyyy-MM-dd')) || [];

    if (!searchQuery || searchQuery.trim() === '') return dayAppointments;

    // Filtrar por pesquisa (case-insensitive): nome do cliente, ID manual, título, terapeuta, tipo
    const query = searchQuery.toLowerCase().trim();
    return dayAppointments.filter(appointment => {
      const clientInfo = appointment.clientes;
      return (
        clientInfo?.nome?.toLowerCase().includes(query) ||
        clientInfo?.id_manual?.toLowerCase().includes(query) ||
        appointment.titulo?.toLowerCase().includes(query) ||
        appointment.terapeuta?.toLowerCase().includes(query) ||
        appointment.tipo?.toLowerCase().includes(query)
      );
    });
  };

  // Indexar disponibilidades por dia da semana e por data exata
  const availabilityIndex = useMemo(() => {
    const byWeekday = new Map<number, any[]>();
    const byDate = new Map<string, any[]>();
    Object.values(clientAvailabilities).flat().forEach((avail: any) => {
      if (avail.status !== 'ativo') return;
      if (avail.recorrencia === 'diaria' && avail.valido_de) {
        const arr = byDate.get(avail.valido_de);
        if (arr) arr.push(avail);
        else byDate.set(avail.valido_de, [avail]);
      } else if (typeof avail.dia_semana === 'number') {
        const arr = byWeekday.get(avail.dia_semana);
        if (arr) arr.push(avail);
        else byWeekday.set(avail.dia_semana, [avail]);
      }
    });
    return { byWeekday, byDate };
  }, [clientAvailabilities]);

  const getDayAvailabilities = (day: Date) => {
    if (!day || !showAvailabilities) return [];
    const dateString = format(day, 'yyyy-MM-dd');
    return [
      ...(availabilityIndex.byWeekday.get(day.getDay()) || []),
      ...(availabilityIndex.byDate.get(dateString) || []),
    ];
  };

  const getDayHoliday = (day: Date) => {
    const dateString = format(day, 'yyyy-MM-dd');
    return isHoliday(dateString);
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'confirmado':
      case 'agendado':
        return 'Confirmado';
      case 'realizado':
        return 'Realizado';
      case 'cancelado':
        return 'Cancelado';
      default:
        return 'Pendente';
    }
  };

  const getStatusChipStyle = (status: string) => {
    switch (status) {
      case 'confirmado':
      case 'agendado':
        return 'bg-blue-100 text-blue-800';
      case 'realizado':
        return 'bg-green-100 text-green-800';
      case 'cancelado':
        return 'bg-red-100 text-red-700';
      default:
        return 'bg-orange-100 text-orange-800';
    }
  };

  const navigatePeriod = (direction: 'prev' | 'next') => {
    const step = direction === 'prev' ? -1 : 1;
    setCurrentDate(prev => {
      const newDate = new Date(prev);
      if (currentView === 'day') {
        newDate.setDate(newDate.getDate() + step);
      } else if (currentView === 'week' || currentView === 'agenda') {
        newDate.setDate(newDate.getDate() + step * 7);
      } else {
        newDate.setMonth(newDate.getMonth() + step);
      }
      return newDate;
    });
    if (currentView === 'day' || currentView === 'week') {
      setSelectedDate(prev => {
        const newDate = new Date(prev || currentDate);
        if (currentView === 'day') {
          newDate.setDate(newDate.getDate() + step);
        } else {
          newDate.setDate(newDate.getDate() + step * 7);
        }
        return newDate;
      });
    }
  };

  // Atalhos de teclado estilo Google Calendar (D/S/M/A, T, setas) — handler via ref,
  // registado uma única vez mas sempre com closures frescas
  const keyboardHandlerRef = useRef<(e: KeyboardEvent) => void>(() => {});
  keyboardHandlerRef.current = (e: KeyboardEvent) => {
    const target = e.target as HTMLElement;
    if (target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable || target.tagName === 'SELECT')) return;
    if (e.metaKey || e.ctrlKey || e.altKey) return;

    const key = e.key.toLowerCase();
    if (key === 'd') setCurrentView('day');
    else if (key === 's') setCurrentView('week');
    else if (key === 'm') setCurrentView('month');
    else if (key === 'a') setCurrentView('agenda');
    else if (key === 't') goToToday();
    else if (e.key === 'ArrowLeft') navigatePeriod('prev');
    else if (e.key === 'ArrowRight') navigatePeriod('next');
  };

  useEffect(() => {
    const handler = (e: KeyboardEvent) => keyboardHandlerRef.current(e);
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);

  const goToToday = () => {
    const today = new Date();
    setCurrentDate(today);
    setSelectedDate(today);
  };

  const getToolbarTitle = () => {
    if (currentView === 'day' && selectedDate) {
      return format(selectedDate, "d 'de' MMMM 'de' yyyy", { locale: pt });
    }
    if (currentView === 'week') {
      const ws = startOfWeek(selectedDate || currentDate, { weekStartsOn: 0 });
      const we = endOfWeek(ws, { weekStartsOn: 0 });
      return `${format(ws, 'd MMM', { locale: pt })} – ${format(we, 'd MMM yyyy', { locale: pt })}`;
    }
    if (currentView === 'agenda') return 'Agenda';
    return format(currentDate, 'MMMM yyyy', { locale: pt });
  };

  const renderMiniCalendar = () => {
    const monthStart = startOfMonth(currentDate);
    const monthEnd = endOfMonth(currentDate);
    const calendarStart = startOfWeek(monthStart, { weekStartsOn: 0 });
    const calendarEnd = endOfWeek(monthEnd, { weekStartsOn: 0 });

    const days = eachDayOfInterval({
      start: calendarStart,
      end: calendarEnd
    });

    const weekDays = ['D', 'S', 'T', 'Q', 'Q', 'S', 'S'];

    return (
      <div className="p-3 rounded-lg hover:bg-gray-100/60">
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-sm font-medium text-gray-800">
            {format(currentDate, 'MMMM yyyy', { locale: pt })}
          </h3>
          <div className="flex gap-0.5">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigatePeriod('prev')}
              className="h-7 w-7 p-0 hover:bg-gray-200/70 rounded-full"
            >
              <ChevronLeft className="h-3.5 w-3.5" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigatePeriod('next')}
              className="h-7 w-7 p-0 hover:bg-gray-200/70 rounded-full"
            >
              <ChevronRight className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-7 gap-y-0.5 text-[11px]">
          {weekDays.map((day, index) => (
            <div key={`${day}-${index}`} className="text-center text-gray-500 py-1.5">
              {day}
            </div>
          ))}
        </div>

        <div className="grid grid-cols-7 gap-y-0.5 text-xs">
          {days.map(day => {
            const isCurrentMonth = isSameMonth(day, currentDate);
            const isDayToday = isToday(day);
            const isSelected = selectedDate && isSameDay(day, selectedDate);
            const dayHoliday = getDayHoliday(day);
            const hasEvents = getDayAppointments(day).length > 0;

            return (
              <button
                key={format(day, 'yyyy-MM-dd')}
                onClick={() => setSelectedDate(day)}
                className="relative flex items-center justify-center"
                title={dayHoliday ? `${dayHoliday.name} (${dayHoliday.type})` : ''}
              >
                <span
                  className={`
                    h-7 w-7 text-[11px] rounded-full flex items-center justify-center transition-colors font-medium
                    ${!isCurrentMonth ? 'text-gray-300' : 'text-gray-700'}
                    ${isDayToday ? 'bg-[#1a73e8] text-white' : ''}
                    ${isSelected && !isDayToday ? 'bg-[#d3e3fd] text-[#185abc]' : ''}
                    ${!isDayToday && !isSelected ? 'hover:bg-gray-200/70' : ''}
                    ${dayHoliday && dayHoliday.type === 'feriado' && !isDayToday && !isSelected ? 'text-red-600' : ''}
                  `}
                >
                  {format(day, 'd')}
                </span>
                {hasEvents && (
                  <span className={`absolute bottom-0.5 w-1 h-1 rounded-full ${isDayToday ? 'bg-white' : 'bg-[#1a73e8]'}`}></span>
                )}
              </button>
            );
          })}
        </div>
      </div>
    );
  };

  const renderDayEventsPanel = () => {
    if (!selectedDate) {
      return (
        <div className="mt-4 px-3 text-sm text-gray-500">
          Selecione um dia para ver os eventos.
        </div>
      );
    }

    // Já vêm ordenados cronologicamente pelo índice appointmentsByDay
    const dayEvents = getDayAppointments(selectedDate);

    const dayHoliday = getDayHoliday(selectedDate);

    return (
      <div className="mt-4 px-1">
        <h3 className="text-sm font-medium text-gray-800 mb-2 px-2">
          {format(selectedDate, "d 'de' MMMM", { locale: pt })}
        </h3>
        <div className="space-y-0.5">
          {dayHoliday && (
            <div className="flex items-center gap-2 px-2 py-1.5 rounded-md bg-red-50/70">
              <span className="w-2 h-2 rounded-full bg-red-500 shrink-0"></span>
              <span className="text-xs text-red-700 truncate" title={dayHoliday.name}>
                {dayHoliday.name}
              </span>
            </div>
          )}

          {dayEvents.length > 0 ? (
            dayEvents.map((appointment, index) => {
              const colors = getEventColors((appointment as any).cor, appointment.estado);
              const clientInfo = (appointment as any).clientes;
              const clientId = clientInfo?.id_manual;

              return (
                <button
                  key={`day-panel-${appointment.id}-${index}`}
                  onClick={() => handleEventClick(appointment)}
                  className="w-full text-left flex items-center gap-2 px-2 py-1.5 rounded-md hover:bg-gray-100 transition-colors"
                >
                  <span
                    className="w-2.5 h-2.5 rounded-full shrink-0"
                    style={{ backgroundColor: colors.isCancelled ? '#5f6368' : (isValidHexColor((appointment as any).cor) ? (appointment as any).cor : '#3f9094') }}
                  ></span>
                  <span className={`text-xs text-gray-800 truncate ${colors.isCancelled ? 'line-through text-gray-500' : ''}`}>
                    {clientId || clientInfo?.nome || appointment.titulo}
                  </span>
                  <span className="ml-auto text-[11px] text-gray-500 shrink-0">
                    {format(parseISO(appointment.data), 'HH:mm')}
                  </span>
                </button>
              );
            })
          ) : !dayHoliday ? (
            <p className="text-xs text-gray-500 px-2 py-3">
              Nenhum evento para este dia.
            </p>
          ) : null}
        </div>
      </div>
    );
  };

  const renderMainCalendar = () => {
    const monthStart = startOfMonth(currentDate);
    const monthEnd = endOfMonth(currentDate);
    const calendarStart = startOfWeek(monthStart, { weekStartsOn: 0 });
    const calendarEnd = endOfWeek(monthEnd, { weekStartsOn: 0 });

    const days = eachDayOfInterval({
      start: calendarStart,
      end: calendarEnd
    });

    const weekDays = isMobile ? ['D', 'S', 'T', 'Q', 'Q', 'S', 'S'] : ['DOM.', 'SEG.', 'TER.', 'QUA.', 'QUI.', 'SEX.', 'SÁB.'];
    const weeks = [];
    for (let i = 0; i < days.length; i += 7) {
      weeks.push(days.slice(i, i + 7));
    }

    const maxVisible = isMobile ? 1 : 3;

    return (
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden shadow-xs flex flex-col h-full">
        <div className="grid grid-cols-7 border-b border-gray-200 bg-white shrink-0">
          {weekDays.map((day, idx) => (
            <div key={`${day}-${idx}`} className={`text-center font-medium text-gray-500 ${isMobile ? 'p-1 text-[10px]' : 'p-2 text-[11px] uppercase tracking-wider'}`}>
              {day}
            </div>
          ))}
        </div>

        <div className="flex-1 flex flex-col min-h-0">
        {weeks.map((week, weekIndex) => (
          <div key={weekIndex} className={`grid grid-cols-7 flex-1 border-b border-gray-200 last:border-b-0 ${isMobile ? 'min-h-[64px]' : 'min-h-[110px]'}`}>
            {week.map(day => {
              const dayAppointments = getDayAppointments(day);
              const dayAvailabilities = getDayAvailabilities(day);
              const isCurrentMonth = isSameMonth(day, currentDate);
              const isDayToday = isToday(day);
              const dayHoliday = getDayHoliday(day);
              const visibleCount = dayHoliday && !isMobile ? maxVisible - 1 : maxVisible;
              const overflow = dayAppointments.length - visibleCount;

              return (
                <div
                  key={format(day, 'yyyy-MM-dd')}
                  className={`
                    border-r border-gray-200 last:border-r-0 cursor-pointer relative transition-colors min-w-0
                    ${isMobile ? 'p-0.5' : 'p-1'}
                    ${isDayToday ? 'bg-[#e8f0fe]/50' : 'bg-white hover:bg-gray-50'}
                    ${!isCurrentMonth ? 'bg-gray-50/60' : ''}
                  `}
                  onClick={(e) => {
                    openQuickCreate(day, { x: e.clientX, y: e.clientY });
                  }}
                  onDragOver={(e) => {
                    e.preventDefault();
                    e.currentTarget.classList.add('bg-[#d3e3fd]');
                  }}
                  onDragLeave={(e) => {
                    e.currentTarget.classList.remove('bg-[#d3e3fd]');
                  }}
                  onDrop={(e) => {
                    e.preventDefault();
                    e.currentTarget.classList.remove('bg-[#d3e3fd]');
                    const appointmentId = e.dataTransfer.getData('appointmentId');
                    if (appointmentId) {
                      const appointment = appointments.find(a => a.id.toString() === appointmentId);
                      if (appointment) {
                        const currentApptDate = parseISO(appointment.data);
                        const newDate = new Date(day);
                        newDate.setHours(currentApptDate.getHours(), currentApptDate.getMinutes());
                        handleEventDrop(appointment, newDate);
                      }
                    }
                  }}
                >
                  <div className="flex mb-0.5">
                    <div
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedDate(day);
                      }}
                      className={`
                        font-medium relative flex items-center justify-center cursor-pointer
                        ${isMobile ? 'text-[10px]' : 'text-xs'}
                        ${isDayToday ? 'bg-[#1a73e8] text-white w-6 h-6 rounded-full font-semibold' : ''}
                        ${!isDayToday ? (isCurrentMonth ? 'text-gray-700 hover:bg-gray-100 w-6 h-6 rounded-full' : 'text-gray-400 w-6 h-6 rounded-full hover:bg-gray-100') : ''}
                        ${dayHoliday && dayHoliday.type === 'feriado' && !isDayToday ? 'text-red-600' : ''}
                      `}
                    >
                      {format(day, 'd')}
                    </div>
                  </div>
                  <div className={isMobile ? 'space-y-0.5' : 'space-y-[2px]'}>
                    {dayHoliday && !isMobile && (
                      <div className="text-[11px] px-1.5 py-[1px] rounded bg-red-50 text-red-700 truncate" title={dayHoliday.name}>
                        {dayHoliday.name}
                      </div>
                    )}

                    {dayAppointments.slice(0, visibleCount).map((appointment, index) => {
                      const colors = getEventColors((appointment as any).cor, appointment.estado);
                      const clientInfo = (appointment as any).clientes;
                      const clientId = clientInfo?.id_manual;
                      const allDay = isAllDayAppointment(appointment);
                      const timeStr = allDay ? null : format(parseISO(appointment.data), 'HH:mm');

                      return (
                        <div
                          key={`main-${appointment.id}-${index}`}
                          onClick={(e) => {
                            e.stopPropagation();
                            handleEventClick(appointment);
                          }}
                          draggable
                          onDragStart={(e) => {
                            e.dataTransfer.setData('appointmentId', appointment.id.toString());
                            e.dataTransfer.effectAllowed = 'move';
                          }}
                          className="relative flex items-center gap-1 rounded px-1.5 py-[1px] text-[11px] leading-4 cursor-pointer hover:brightness-95 transition-all"
                          style={{
                            backgroundColor: colors.backgroundColor,
                            color: colors.color,
                            borderLeft: `3px solid ${colors.statusColor}`,
                          }}
                        >
                          {timeStr && <span className={`shrink-0 ${colors.isCancelled ? 'line-through' : ''}`}>{timeStr}</span>}
                          <span className={`font-medium truncate ${allDay ? 'font-semibold' : ''} ${colors.isCancelled ? 'line-through' : ''}`}>
                            {clientId || appointment.titulo}
                          </span>
                        </div>
                      );
                    })}

                    {/* Mostrar Disponibilidades - apenas desktop */}
                    {!isMobile && showAvailabilities && dayAvailabilities.length > 0 && (
                      <div className="mt-0.5 space-y-0.5">
                        {dayAvailabilities.slice(0, 2).map((avail: any, idx: number) => (
                          <div
                            key={`avail-${avail.id}-${idx}`}
                            className="text-[10px] px-1.5 py-0.5 rounded bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 text-blue-700 dark:text-blue-300 truncate cursor-help transition-all hover:bg-blue-100 dark:hover:bg-blue-900"
                            title={`${avail.hora_inicio} - ${avail.hora_fim}`}
                          >
                            {avail.clientes?.id_manual && `${avail.clientes.id_manual} - `}{avail.clientes?.nome || 'Cliente'}
                          </div>
                        ))}
                        {dayAvailabilities.length > 2 && (
                          <div className="text-[10px] text-blue-600 dark:text-blue-400 px-1">
                            +{dayAvailabilities.length - 2} disponíveis
                          </div>
                        )}
                      </div>
                    )}
                    {overflow > 0 && (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setOverflowDay({ date: day, appointments: dayAppointments });
                        }}
                        className="text-xs text-[#1a73e8] dark:text-blue-400 font-medium hover:bg-blue-50 dark:hover:bg-blue-900/40 rounded px-1.5 py-[1px] transition-colors cursor-pointer text-left w-full"
                      >
                        +{overflow} mais
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        ))}
        </div>
      </div>
    );
  };

  const renderDayView = () => {
    if (dayViewDays.length === 0) return null;

    return (
      <TimeGridView
        days={dayViewDays}
        appointments={appointments}
        onTimeSlotClick={handleTimeSlotClick}
        onEventClick={handleEventClick}
        isDailyView={true}
        availabilities={clientAvailabilities}
        showAvailabilities={showAvailabilities}
        holidays={holidays}
        onEventDrop={handleEventDrop}
      />
    );
  };

  const renderWeekView = () => {
    return (
      <TimeGridView
        days={weekViewDays}
        appointments={appointments}
        onTimeSlotClick={handleTimeSlotClick}
        onEventClick={handleEventClick}
        availabilities={clientAvailabilities}
        showAvailabilities={showAvailabilities}
        holidays={holidays}
        onEventDrop={handleEventDrop}
      />
    );
  };

  const renderAgendaView = () => {
    // Janela de 7 dias a partir da data atual (navegável com ‹ ›)
    const windowStart = currentDate;
    const nextSevenDays = eachDayOfInterval({
      start: windowStart,
      end: addDays(windowStart, 6),
    });

    const upcomingAppointments = nextSevenDays.flatMap(day => {
      const appointmentsForDay = getDayAppointments(day);
      return appointmentsForDay.map(app => ({ ...app, day: day }));
    });

    if (upcomingAppointments.length === 0) {
      return (
        <div className="bg-white rounded-lg border border-gray-200 flex flex-col items-center justify-center py-16 text-gray-500">
          <Calendar className="h-12 w-12 text-gray-300" />
          <p className="mt-3 text-sm">Nenhum agendamento para os próximos 7 dias.</p>
        </div>
      );
    }

    return (
      <div className="bg-white rounded-lg border border-gray-200 p-4 sm:p-6 overflow-y-auto h-full">
        <div className="max-w-3xl mx-auto">
          {upcomingAppointments.map((appointment, index) => {
            const showDateHeader = index === 0 || !isSameDay(parseISO(appointment.data), parseISO(upcomingAppointments[index - 1].data));
            const colors = getEventColors((appointment as any).cor, appointment.estado);
            const clientInfo = (appointment as any).clientes;
            const clientId = clientInfo?.id_manual;

            return (
              <React.Fragment key={`${appointment.id}-${index}`}>
                {showDateHeader && (
                  <h3 className="text-xs font-medium text-gray-500 uppercase tracking-wider pt-5 pb-2 border-b border-gray-200 mt-2 first:mt-0 first:pt-0">
                    {format(appointment.day, "eeee, d 'de' MMMM 'de' yyyy", { locale: pt })}
                  </h3>
                )}
                <div
                  onClick={() => handleEventClick(appointment)}
                  className="flex items-center gap-3 py-2.5 px-2 rounded-lg hover:bg-gray-100 cursor-pointer transition-colors"
                >
                  <span
                    className="w-3 h-3 rounded-full shrink-0"
                    style={{ backgroundColor: colors.isCancelled ? '#5f6368' : (isValidHexColor((appointment as any).cor) ? (appointment as any).cor : '#3f9094') }}
                  ></span>
                  <span className={`text-sm text-gray-700 w-24 shrink-0 ${colors.isCancelled ? 'line-through' : ''}`}>
                    {format(parseISO(appointment.data), 'HH:mm')}
                  </span>
                  <span className={`flex-1 min-w-0 text-sm text-gray-900 truncate ${colors.isCancelled ? 'line-through text-gray-500' : 'font-medium'}`}>
                    {clientId && <span className="font-semibold mr-1.5">{clientId}</span>}
                    {clientId ? appointment.titulo : (clientInfo?.nome || appointment.titulo)}
                  </span>
                  <span className={`hidden sm:inline-flex px-2 py-0.5 rounded-full text-[10px] font-medium shrink-0 ${getStatusChipStyle(appointment.estado)}`}>
                    {getStatusLabel(appointment.estado)}
                  </span>
                </div>
              </React.Fragment>
            );
          })}
        </div>
      </div>
    );
  };

  const renderCurrentView = () => {
    switch (currentView) {
      case 'day':
        return renderDayView();
      case 'week':
        return renderWeekView();
      case 'agenda':
        return renderAgendaView();
      case 'month':
      default:
        return renderMainCalendar();
    }
  };


  if (isLoadingAppointments || isLoadingClients) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <h2 className="text-xl font-semibold mb-2">A carregar o calendário...</h2>
          <p className="text-gray-500">Aguarde enquanto procuramos os seus agendamentos</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col bg-white">
      {/* Toolbar */}
      <header className="bg-white border-b border-gray-200 p-2 sm:px-4 shrink-0">
        <div className="flex flex-wrap items-center gap-2 sm:gap-3">
          {/* Toggle da barra lateral */}
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
            className="h-9 w-9 rounded-full hover:bg-gray-100 text-gray-600 shrink-0 hidden md:flex"
            title={isSidebarOpen ? 'Recolher menu lateral' : 'Expandir menu lateral'}
            aria-label={isSidebarOpen ? 'Recolher menu lateral' : 'Expandir menu lateral'}
          >
            <Menu className="h-5 w-5" />
          </Button>

          {/* Criar */}
          <Button
            onClick={() => openNewAppointmentDialog()}
            className="bg-neurobalance-teal hover:bg-neurobalance-secondary text-white rounded-full pl-3 pr-4 h-10 font-medium shadow-sm"
            title="Criar (C)"
          >
            <Plus className="h-5 w-5" />
            <span className="hidden sm:inline ml-1">Criar</span>
          </Button>

          {/* Hoje + navegação + título */}
          <div className="flex items-center gap-1">
            <Button
              variant="outline"
              onClick={goToToday}
              className="rounded-full h-9 px-4 border-gray-300 font-medium text-gray-700"
            >
              Hoje
            </Button>
            <Button variant="ghost" size="icon" onClick={() => navigatePeriod('prev')} className="h-9 w-9 hover:bg-gray-100 rounded-full" aria-label="Período anterior">
              <ChevronLeft className="h-5 w-5 text-gray-600" />
            </Button>
            <Button variant="ghost" size="icon" onClick={() => navigatePeriod('next')} className="h-9 w-9 hover:bg-gray-100 rounded-full" aria-label="Período seguinte">
              <ChevronRight className="h-5 w-5 text-gray-600" />
            </Button>
            <h2 className="text-base sm:text-xl font-normal text-gray-800 ml-1 capitalize truncate max-w-[180px] sm:max-w-none" title={getToolbarTitle()}>
              {getToolbarTitle()}
            </h2>
          </div>

          <div className="flex-1 min-w-2" />

          {/* Ações à direita */}
          <div className="flex items-center gap-2">
            <div className="relative hidden lg:block">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Pesquisar..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 w-44 rounded-full bg-gray-50 border-gray-200 focus:bg-white"
              />
            </div>

            <Select value={currentView} onValueChange={(value: CalendarView) => setCurrentView(value)}>
              <SelectTrigger className="w-[110px] h-9 rounded-full border-gray-300 text-sm text-gray-700">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="day">Dia</SelectItem>
                <SelectItem value="week">Semana</SelectItem>
                <SelectItem value="month">Mês</SelectItem>
                <SelectItem value="agenda">Agenda</SelectItem>
              </SelectContent>
            </Select>

            <div className="hidden md:block">
              <SmartScheduling />
            </div>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-9 w-9 hover:bg-gray-100 rounded-full" aria-label="Mais opções">
                  <MoreHorizontal className="h-5 w-5 text-gray-600" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => setIsImportDialogOpen(true)}>
                  <Upload className="h-4 w-4 mr-2" />
                  Importar de Ficheiro
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <div className="flex items-center justify-between px-2 py-1.5 hover:bg-gray-100 cursor-default">
                  <div className="flex items-center gap-2">
                    <Settings className="h-4 w-4" />
                    <span className="text-sm">SMS Automático</span>
                  </div>
                  <Switch
                    checked={isAutomationEnabled}
                    onCheckedChange={toggleAutomation}
                    className="scale-75"
                  />
                </div>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Sidebar */}
        <aside className={`
          transition-all duration-300 ease-in-out bg-white border-r border-gray-200 overflow-y-auto hidden md:block shrink-0
          ${isSidebarOpen ? 'w-[260px] p-3 opacity-100' : 'w-0 p-0 border-none opacity-0 overflow-hidden'}
        `}>
          {renderMiniCalendar()}
          {renderDayEventsPanel()}

          <div className="mt-4 px-1 space-y-2">
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="ghost" className="w-full justify-start h-8 text-xs text-gray-600 hover:bg-gray-100">
                  <Info className="h-3.5 w-3.5 mr-2" />
                  Legenda de cores
                </Button>
              </PopoverTrigger>
              <PopoverContent side="right" align="start" className="w-64 p-3 text-xs">
                <p className="font-medium text-gray-700 mb-1.5">Tipos de Eventos</p>
                <div className="grid grid-cols-2 gap-1.5 mb-3">
                  {[
                    { c: '#039BE5', n: 'Sessão' },
                    { c: '#3F51B5', n: 'Reavaliação' },
                    { c: '#7986CB', n: 'Avaliação' },
                    { c: '#F4511E', n: 'Psicologia' },
                    { c: '#8E24AA', n: 'Constelações' },
                    { c: '#F6BF26', n: 'Discussão' },
                    { c: '#0B8043', n: 'Consulta' },
                    { c: '#7CB342', n: 'Biorresonância' },
                    { c: '#33B679', n: 'Yoga Nidra' },
                    { c: '#D50000', n: 'OFES / Bloqueio' },
                  ].map(({ c, n }) => (
                    <div key={n} className="flex items-center gap-1.5">
                      <span className="w-3 h-3 rounded-sm" style={{ backgroundColor: c }}></span>
                      <span className="text-gray-600 truncate">{n}</span>
                    </div>
                  ))}
                </div>
                <p className="font-medium text-gray-700 mb-1.5">Estado</p>
                <div className="space-y-1">
                  <div className="flex items-center gap-1.5"><span className="w-1 h-3 bg-[#e8710a]"></span><span className="text-gray-600">Pendente</span></div>
                  <div className="flex items-center gap-1.5"><span className="w-1 h-3 bg-[#1a73e8]"></span><span className="text-gray-600">Confirmado</span></div>
                  <div className="flex items-center gap-1.5"><span className="w-1 h-3 bg-[#188038]"></span><span className="text-gray-600">Realizado</span></div>
                  <div className="flex items-center gap-1.5"><span className="w-1 h-3 bg-[#d93025]"></span><span className="text-gray-600">Cancelado (riscado)</span></div>
                </div>
              </PopoverContent>
            </Popover>

            <div className="flex items-center px-2">
              <Checkbox
                id="show-availabilities"
                checked={showAvailabilities}
                onCheckedChange={(checked) => setShowAvailabilities(checked === true)}
              />
              <label htmlFor="show-availabilities" className="ml-2 text-xs text-gray-700 cursor-pointer select-none">
                Mostrar disponibilidades
              </label>
            </div>

            <p className="text-[10px] text-gray-400 px-2 leading-4">
              Atalhos: <kbd className="font-sans">D</kbd> dia · <kbd className="font-sans">S</kbd> semana · <kbd className="font-sans">M</kbd> mês · <kbd className="font-sans">A</kbd> agenda · <kbd className="font-sans">T</kbd> hoje · <kbd className="font-sans">←→</kbd> navegar
            </p>
          </div>
        </aside>

        {/* Calendar */}
        <main className="flex-1 p-2 sm:p-4 overflow-hidden flex flex-col min-h-0 transition-all duration-300">
          {renderCurrentView()}
        </main>
      </div>

      {/* Dialog for creating/editing appointments */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>
              {selectedAppointment ? 'Editar Agendamento' : 'Novo Agendamento'}
            </DialogTitle>
            <DialogDescription>
              {selectedAppointment ? 'Edite os detalhes do agendamento' : 'Crie um novo agendamento'}
            </DialogDescription>
          </DialogHeader>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              {/* Scrollable Container for Fields */}
              <div className="max-h-[60vh] overflow-y-auto pr-2 space-y-4 scrollbar-thin">
                <FormField
                  control={form.control}
                  name="titulo"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Título</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="Título do agendamento" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Data e Hora de Início */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="data_inicio"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Data de Início *</FormLabel>
                        <FormControl>
                          <Input
                            type="date"
                            {...field}
                            onChange={(e) => {
                              field.onChange(e);
                              const val = e.target.value;
                              const endVal = form.getValues('data_fim');
                              if (!endVal || endVal < val) {
                                form.setValue('data_fim', val);
                              }
                            }}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="hora_inicio"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Hora de Início *</FormLabel>
                        <FormControl>
                          <Input
                            type="time"
                            {...field}
                            disabled={isAllDay}
                            className={isAllDay ? 'opacity-50 bg-gray-100' : ''}
                            onChange={(e) => {
                              field.onChange(e);
                              const val = e.target.value;
                              if (val) {
                                const [h, m] = val.split(':').map(Number);
                                if (!isNaN(h)) {
                                  const endH = (h + 1) % 24;
                                  const endFormatted = `${endH.toString().padStart(2, '0')}:${(m || 0).toString().padStart(2, '0')}`;
                                  form.setValue('hora_fim', endFormatted);
                                }
                              }
                            }}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                {/* Data e Hora de Fim */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="data_fim"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Data de Fim *</FormLabel>
                        <FormControl>
                          <Input type="date" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="hora_fim"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Hora de Fim *</FormLabel>
                        <FormControl>
                          <Input
                            type="time"
                            {...field}
                            disabled={isAllDay}
                            className={isAllDay ? 'opacity-50 bg-gray-100' : ''}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                {/* Opções estilo Google Calendar: Todo o dia & Recorrência */}
                <div className="flex flex-wrap items-center gap-4 py-3 px-3.5 border border-gray-200 bg-gray-50/80 rounded-lg">
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="todo_o_dia"
                      checked={isAllDay}
                      onCheckedChange={(checked) => {
                        setIsAllDay(!!checked);
                        if (checked) {
                          form.setValue('hora_inicio', '00:00');
                          form.setValue('hora_fim', '23:59');
                        }
                      }}
                    />
                    <label htmlFor="todo_o_dia" className="text-sm font-medium text-gray-700 cursor-pointer select-none">
                      Todo o dia
                    </label>
                  </div>

                  <div className="flex items-center gap-2 flex-1 min-w-[240px]">
                    <Select
                      value={recurrenceType}
                      onValueChange={(val: string) => setRecurrenceType(val)}
                    >
                      <SelectTrigger className="h-9 w-full text-xs sm:text-sm bg-white border-gray-300">
                        <SelectValue placeholder="Selecione a recorrência" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">Não se repete</SelectItem>
                        <SelectItem value="daily">Todos os dias</SelectItem>
                        <SelectItem value="weekly">{getWeeklyRecurrenceLabel(form.watch('data_inicio'))}</SelectItem>
                        <SelectItem value="weekdays">Todos os dias da semana (de segunda a sexta)</SelectItem>
                        <SelectItem value="monthly">Mensalmente neste dia</SelectItem>
                        <SelectItem value="yearly">{getYearlyRecurrenceLabel(form.watch('data_inicio'))}</SelectItem>
                      </SelectContent>
                    </Select>
                    {recurrenceType !== 'none' && (
                      <div className="flex items-center gap-1.5 shrink-0">
                        <Input
                          type="number"
                          min={2}
                          max={50}
                          value={recurrenceCount}
                          onChange={(e) => setRecurrenceCount(Math.max(2, Number(e.target.value)))}
                          className="w-16 h-9 text-center"
                        />
                        <span className="text-xs text-gray-500 whitespace-nowrap">sessões</span>
                      </div>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="id_cliente"
                    render={({ field }) => {
                      const filteredClients = clients.filter(client => {
                        if (!clientSearchQuery || clientSearchQuery.trim() === '') return true;
                        const searchLower = clientSearchQuery.toLowerCase().trim();
                        return (
                          (client.nome && client.nome.toLowerCase().includes(searchLower)) ||
                          (client.id_manual && client.id_manual.toLowerCase().includes(searchLower)) ||
                          (client.id && client.id.toString().includes(searchLower))
                        );
                      });

                      const selectedClient = clients.find(c => c.id === field.value);
                      const displayClients = clientSearchQuery ? filteredClients : clients;

                      return (
                        <FormItem>
                          <FormLabel>Cliente (Opcional)</FormLabel>
                          <div className="space-y-2">
                            <div className="relative">
                              <Input
                                type="text"
                                placeholder={isLoadingClients ? "A carregar clientes..." : "Pesquisar por nome ou ID..."}
                                value={clientSearchQuery}
                                onChange={(e) => {
                                  setClientSearchQuery(e.target.value);
                                }}
                                disabled={isLoadingClients}
                                className="w-full"
                              />
                              {isLoadingClients && (
                                <div className="absolute right-3 top-1/2 -translate-y-1/2">
                                  <div className="animate-spin h-4 w-4 border-2 border-blue-500 border-t-transparent rounded-full"></div>
                                </div>
                              )}
                            </div>

                            <Select
                              onValueChange={(value) => {
                                field.onChange(value === "null" ? null : parseInt(value));
                                setClientSearchQuery('');
                              }}
                              value={field.value?.toString() || "null"}
                              disabled={isLoadingClients}
                            >
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder={
                                    isLoadingClients
                                      ? "A carregar clientes..."
                                      : selectedClient
                                        ? `${selectedClient.id_manual ? `[${selectedClient.id_manual}]` : `[ID: ${selectedClient.id}]`} ${selectedClient.nome}`
                                        : clientSearchQuery
                                          ? `${displayClients.length} cliente(s) filtrado(s)`
                                          : `Selecionar cliente (${clients.length} disponíveis)`
                                  } />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent className="max-h-[300px] overflow-y-auto">
                                <SelectItem value="null">
                                  <span className="font-normal text-gray-600">Sem cliente associado</span>
                                </SelectItem>
                                {displayClients.length > 0 && displayClients.map(client => (
                                  <SelectItem key={client.id} value={client.id.toString()}>
                                    {client.id_manual ? `[${client.id_manual}] ` : `[ID: ${client.id}] `}
                                    {client.nome || 'Cliente sem nome'}
                                  </SelectItem>
                                ))}
                                {displayClients.length === 0 && clientSearchQuery && (
                                  <div className="px-2 py-3 text-center text-sm text-gray-500">
                                    Nenhum cliente encontrado para "{clientSearchQuery}"
                                  </div>
                                )}
                                {clients.length === 0 && !clientSearchQuery && !isLoadingClients && (
                                  <div className="px-2 py-3 text-center text-sm text-gray-500">
                                    Nenhum cliente registado
                                  </div>
                                )}
                              </SelectContent>
                            </Select>

                            {selectedClient && (
                              <div className="px-3 py-2 bg-blue-50 border border-blue-200 rounded-md flex items-center justify-between">
                                <span className="text-sm font-medium text-blue-900">
                                  {selectedClient.id_manual ? `[${selectedClient.id_manual}] ` : `[ID: ${selectedClient.id}] `}
                                  {selectedClient.nome}
                                </span>
                                <button
                                  type="button"
                                  onClick={() => {
                                    field.onChange(null);
                                    setClientSearchQuery('');
                                  }}
                                  className="text-blue-600 hover:text-blue-800 text-xs font-medium"
                                >
                                  Remover
                                </button>
                              </div>
                            )}

                            {!isLoadingClients && (
                              <p className="text-xs text-gray-500">
                                {clientSearchQuery ? (
                                  <>{filteredClients.length} de {clients.length} cliente(s) {filteredClients.length === 1 ? 'encontrado' : 'encontrados'}</>
                                ) : (
                                  <>{clients.length} cliente(s) disponível{clients.length === 1 ? '' : 'eis'}</>
                                )}
                              </p>
                            )}
                          </div>
                          <FormMessage />
                        </FormItem>
                      );
                    }}
                  />

                  <FormField
                    control={form.control}
                    name="tipo"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Tipo</FormLabel>
                        <Select
                          onValueChange={(val) => {
                            field.onChange(val);
                            form.setValue('cor', getAutoColorForType(val));
                          }}
                          value={field.value}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Tipo de agendamento" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {APPOINTMENT_TYPES.map((t) => (
                              <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="estado"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Estado</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Estado do agendamento" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="pendente">Pendente</SelectItem>
                            <SelectItem value="confirmado">Confirmado</SelectItem>
                            <SelectItem value="cancelado">Cancelado</SelectItem>
                            <SelectItem value="realizado">Realizado</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="terapeuta"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Terapeuta</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="Nome do terapeuta" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="cor"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Cor</FormLabel>
                      <FormControl>
                        <div className="space-y-3">
                          {/* Paleta de cores predefinidas */}
                          <div className="flex flex-wrap gap-2">
                            {[
                              { hex: '#039BE5', name: 'Neurofeedback / Sessão' },
                              { hex: '#3F51B5', name: 'Reavaliação' },
                              { hex: '#7986CB', name: 'Avaliação' },
                              { hex: '#F4511E', name: 'Consulta de Psicologia' },
                              { hex: '#8E24AA', name: 'Constelações Familiares' },
                              { hex: '#F6BF26', name: 'Discussão de Resultados' },
                              { hex: '#0B8043', name: 'Consulta' },
                              { hex: '#7CB342', name: 'Biorresonância Magnética' },
                              { hex: '#33B679', name: 'Yoga Nidra' },
                              { hex: '#D50000', name: 'OFES / Bloqueio' },
                              { hex: '#616161', name: 'Almoço / Intervalo' }
                            ].map((colorObj) => (
                              <button
                                key={colorObj.hex}
                                type="button"
                                title={colorObj.name}
                                className={`w-8 h-8 rounded-full border-2 hover:scale-110 transition-transform ${field.value === colorObj.hex ? 'border-gray-800 ring-2 ring-offset-2 ring-gray-400' : 'border-gray-300'
                                  }`}
                                style={{ backgroundColor: colorObj.hex }}
                                onClick={() => field.onChange(colorObj.hex)}
                              />
                            ))}
                          </div>

                          {/* Campo de cor personalizada */}
                          <div className="flex items-center gap-2">
                            <Input
                              type="color"
                              value={field.value}
                              onChange={(e) => field.onChange(e.target.value)}
                              className="w-12 h-8 p-0 border-0"
                            />
                            <Input
                              type="text"
                              value={field.value}
                              onChange={(e) => field.onChange(e.target.value)}
                              placeholder="#3f9094"
                              className="flex-1"
                            />
                          </div>
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="notas"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Notas</FormLabel>
                      <FormControl>
                        <Textarea {...field} placeholder="Notas adicionais" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <DialogFooter className="flex justify-between w-full">
                <div className="flex gap-2">
                  {selectedAppointment && (
                    <Button
                      type="button"
                      variant="destructive"
                      onClick={() => setIsDeleteDialogOpen(true)}
                    >
                      Eliminar
                    </Button>
                  )}
                  {selectedAppointment && (
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => {
                        setSelectedAppointment(null);
                        toast.info("Cópia do agendamento carregada. Selecione a nova data/hora e clique em 'Criar'.");
                      }}
                      className="gap-2"
                    >
                      <Copy className="h-3.5 w-3.5" />
                      Duplicar
                    </Button>
                  )}
                  {selectedAppointment && (selectedAppointment as any).clientes?.telefone && (
                    <Button
                      type="button"
                      variant="outline"
                      onClick={openSmsPreview}
                      className="gap-2"
                    >
                      <MessageSquare className="h-3 w-3" />
                      Enviar SMS
                    </Button>
                  )}
                </div>
                <div className="flex space-x-2">
                  <DialogClose asChild>
                    <Button type="button" variant="outline">
                      Cancelar
                    </Button>
                  </DialogClose>
                  <Button type="submit" className="bg-neurobalance-teal hover:bg-neurobalance-secondary">
                    {selectedAppointment ? 'Atualizar' : 'Criar'}
                  </Button>
                </div>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Diálogo de importação */}
      <CalendarImport
        isOpen={isImportDialogOpen}
        onClose={() => setIsImportDialogOpen(false)}
        onImport={handleImportAppointments}
        clients={clients}
      />

      {/* Diálogo de pré-visualização de SMS */}
      <Dialog open={smsPreviewOpen} onOpenChange={setSmsPreviewOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <MessageSquare className="h-5 w-5 text-neurobalance-teal" />
              Pré-visualização do SMS
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="text-sm text-gray-600">
              <strong>Destinatário:</strong> {selectedAppointment && (selectedAppointment as any).clientes?.telefone}
            </div>
            <div className="space-y-2">
              <Label htmlFor="sms-message">Mensagem</Label>
              <Textarea
                id="sms-message"
                value={smsMessage}
                onChange={(e) => setSmsMessage(e.target.value)}
                className="min-h-[150px] resize-none"
                placeholder="Escreva a sua mensagem..."
              />
              <p className="text-xs text-gray-500 text-right">
                {smsMessage.length} caracteres
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setSmsPreviewOpen(false)}>
              Cancelar
            </Button>
            <Button
              onClick={handleSendManualSms}
              disabled={isSending || !smsMessage.trim()}
              className="bg-neurobalance-teal hover:bg-neurobalance-secondary gap-2"
            >
              {isSending ? (
                <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full" />
              ) : (
                <Send className="h-4 w-4" />
              )}
              {isSending ? 'A enviar...' : 'Enviar SMS'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Diálogo de confirmação de eliminação de agendamento */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Tem a certeza que quer eliminar este agendamento?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta ação não pode ser desfeita. O agendamento "{selectedAppointment?.titulo || ''}" será permanentemente removido.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setIsDeleteDialogOpen(false)}>
              Cancelar
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteAppointment}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              Sim, eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Lista de espera: preencher vazio de cancelamento */}
      {waitlistSlot && (
        <WaitlistFillPanel
          open
          onOpenChange={(open) => { if (!open) setWaitlistSlot(null); }}
          slot={waitlistSlot}
          appointments={appointments}
          clients={clients}
          onCreate={handleWaitlistCreate}
        />
      )}
      {/* Pop-up de agendamentos do dia (Estilo Google Calendar) */}
      <Dialog open={!!overflowDay} onOpenChange={(open) => !open && setOverflowDay(null)}>
        <DialogContent className="sm:max-w-[340px] p-0 overflow-hidden rounded-2xl border border-gray-200 dark:border-gray-800 shadow-2xl bg-white dark:bg-gray-900">
          {overflowDay && (
            <div className="p-4 space-y-3">
              <DialogTitle className="sr-only">
                Agendamentos de {format(overflowDay.date, "d 'de' MMMM", { locale: pt })}
              </DialogTitle>
              {/* Header com dia da semana e número grande */}
              <div className="flex items-center justify-between border-b pb-2 dark:border-gray-800 pr-8">
                <div className="flex flex-col items-start">
                  <span className="text-[11px] font-bold tracking-wider text-gray-500 uppercase">
                    {format(overflowDay.date, 'EEE.', { locale: pt }).toUpperCase()}
                  </span>
                  <span className="text-2xl font-black text-gray-900 dark:text-white leading-none mt-0.5">
                    {format(overflowDay.date, 'd')}
                  </span>
                </div>
              </div>

              {/* Lista de agendamentos do dia */}
              <div className="max-h-[320px] overflow-y-auto space-y-1.5 pr-1">
                {overflowDay.appointments.map((appointment, idx) => {
                  const clientInfo = (appointment as any).clientes;
                  const clientId = clientInfo?.id_manual;
                  const startTime = format(parseISO(appointment.data), 'HH:mm');

                  return (
                    <div
                      key={`overflow-${appointment.id}-${idx}`}
                      onClick={() => {
                        handleEventClick(appointment);
                        setOverflowDay(null);
                      }}
                      className="group flex items-center gap-2.5 p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors cursor-pointer border border-transparent hover:border-gray-200 dark:hover:border-gray-700"
                    >
                      {/* Ponto indicador de cor */}
                      <div
                        className="w-3 h-3 rounded-full shrink-0 shadow-xs"
                        style={{ backgroundColor: (appointment as any).cor || '#1a73e8' }}
                      />

                      {/* Hora e Título */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-1">
                          <span className="text-xs font-semibold text-gray-900 dark:text-gray-100 truncate">
                            {clientId ? `${clientId} - ${appointment.titulo}` : appointment.titulo}
                          </span>
                          <span className="text-[10px] font-medium text-gray-500 shrink-0">
                            {startTime}
                          </span>
                        </div>
                        {appointment.notas && (
                          <p className="text-[10px] text-gray-400 truncate mt-0.5">
                            {appointment.notas}
                          </p>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Rodapé com botão de adicionar agendamento para este dia */}
              <div className="pt-2 border-t dark:border-gray-800 flex justify-end">
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  className="text-xs gap-1.5 h-8 border-neurobalance-teal text-neurobalance-teal hover:bg-neurobalance-teal hover:text-white"
                  onClick={() => {
                    const targetDate = overflowDay.date;
                    setOverflowDay(null);
                    openNewAppointmentDialog(targetDate);
                  }}
                >
                  <Plus className="h-3.5 w-3.5" />
                  Novo Agendamento
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
      {/* Quick-create estilo Google (célula/slot vazio) */}
      {quickCreate && (
        <QuickCreatePopover
          open
          onOpenChange={(o) => { if (!o) setQuickCreate(null); }}
          anchorPoint={quickCreate.anchorPoint}
          date={quickCreate.date}
          isSubmitting={isQuickCreating}
          onCreate={handleQuickCreate}
          onMoreOptions={(date, draft) => {
            openNewAppointmentDialog(date);
            if (draft?.titulo) form.setValue('titulo', draft.titulo);
            if (draft) {
              form.setValue('tipo', draft.tipo as AppointmentType);
              form.setValue('cor', getAutoColorForType(draft.tipo));
            }
          }}
        />
      )}
    </div>
  );
};

export default AppointmentCalendar;
