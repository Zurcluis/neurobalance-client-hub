import React, { useState, useEffect, useRef } from 'react';
import { Button } from '../ui/button';
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '../ui/dialog';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '../ui/form';
import { Input } from '../ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Textarea } from '../ui/textarea';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { addDays, format, isSameDay, parseISO, startOfMonth, endOfMonth, startOfWeek, endOfWeek, eachDayOfInterval, isToday, getDay, isSameMonth, compareAsc } from 'date-fns';
import { pt } from 'date-fns/locale';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { ClientDetailData } from '@/types/client';
import { useIsMobile } from '@/hooks/use-mobile';
import { Plus, Search, Calendar, ChevronLeft, ChevronRight, Menu, MoreHorizontal, Settings, HelpCircle } from 'lucide-react';
import useAppointments from '@/hooks/useAppointments';
import useClients from '@/hooks/useClients';
import { supabase } from '@/integrations/supabase/client';
import { Database } from '@/integrations/supabase/types';
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
import TimeGridView from './TimeGridView';

type AppointmentType = 'sessão' | 'avaliação' | 'consulta' | 'consulta inicial';
type AppointmentStatus = 'confirmado' | 'pendente';
type CalendarView = 'month' | 'week' | 'day' | 'agenda';

type Appointment = Database['public']['Tables']['agendamentos']['Row'] & {
  clientes: {
    nome: string;
    email: string;
    telefone: string;
  } | null;
  cor?: string | null;
};

interface AppointmentFormValues {
  titulo: string;
  data: string;
  hora: string;
  id_cliente: number | null;
  tipo: AppointmentType;
  notas: string;
  estado: string;
  terapeuta: string;
  cor: string;
}

interface CalendarData {
  [key: string]: string[];
}

const AppointmentCalendar = () => {
  const { appointments, isLoading: isLoadingAppointments, addAppointment, updateAppointment, deleteAppointment } = useAppointments();
  const { clients, isLoading: isLoadingClients } = useClients();
  
  const [currentDate, setCurrentDate] = useState<Date>(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null);
  const [currentView, setCurrentView] = useState<CalendarView>('month');
  const isMobile = useIsMobile();
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [clientSearchQuery, setClientSearchQuery] = useState<string>('');
  const [clientAvailabilities, setClientAvailabilities] = useState<Record<number, any[]>>({});
  const [showAvailabilities, setShowAvailabilities] = useState(true);

  const holidays = getAllHolidaysUntil2040();

  const form = useForm<AppointmentFormValues>({
    defaultValues: {
      titulo: '',
      data: '',
      hora: '09:00',
      id_cliente: null,
      tipo: 'sessão',
      notas: '',
      estado: 'pendente',
      terapeuta: '',
      cor: '#3B82F6'
    },
  });

  const openNewAppointmentDialog = (date?: Date) => {
    setSelectedAppointment(null);
    const today = date || new Date();
    
    form.reset({
      titulo: '',
      data: format(today, 'yyyy-MM-dd'),
      hora: date ? format(date, 'HH:mm') : '09:00',
      id_cliente: null,
      tipo: 'sessão',
      notas: '',
      estado: 'pendente',
      terapeuta: '',
      cor: '#3B82F6'
    });
    
    setIsDialogOpen(true);
  };

  const handleDateClick = (date: Date) => {
    setSelectedDate(date);
    if (currentView === 'month') {
        setCurrentView('day');
    }
  };

  const handleEventClick = (appointment: Appointment) => {
      setSelectedAppointment(appointment);
      form.reset({
        titulo: appointment.titulo,
        data: format(parseISO(appointment.data), 'yyyy-MM-dd'),
        hora: appointment.hora,
        id_cliente: appointment.id_cliente,
        tipo: (appointment.tipo || 'sessão') as AppointmentType,
        notas: appointment.notas || '',
        estado: appointment.estado,
        terapeuta: appointment.terapeuta || '',
        cor: appointment.cor || '#3B82F6'
      });
      setIsDialogOpen(true);
  };

  const handleDeleteAppointment = async () => {
    if (selectedAppointment) {
      try {
        await deleteAppointment(selectedAppointment.id);
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
      const clientId = data.id_cliente === null || data.id_cliente === undefined ? null : Number(data.id_cliente);
      
      const appointmentData = {
        titulo: data.titulo || 'Novo Agendamento',
        data: `${data.data}T${data.hora}:00`,
        hora: data.hora,
        id_cliente: clientId,
        tipo: data.tipo,
        notas: data.notas || '',
        estado: data.estado,
        terapeuta: data.terapeuta || '',
        cor: data.cor || '#3B82F6'
      };

      console.log('Dados a serem enviados:', appointmentData);

      if (selectedAppointment) {
        await updateAppointment(selectedAppointment.id, appointmentData);
      } else {
        await addAppointment(appointmentData);
      }

      setIsDialogOpen(false);
      setSelectedAppointment(null);
      setClientSearchQuery('');
      form.reset();
      toast.success('Agendamento salvo com sucesso!');
    } catch (error: any) {
      console.error('Erro ao salvar agendamento:', error);
      const errorMessage = error?.message || 'Erro desconhecido ao salvar agendamento';
      toast.error(`Erro: ${errorMessage}`);
    }
  };

  // Buscar disponibilidades dos clientes
  useEffect(() => {
    const fetchAvailabilities = async () => {
      try {
        const { data, error } = await supabase
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
  }, [showAvailabilities]);

  const getDayAppointments = (day: Date) => {
    if (!day) return [];
    
    return appointments.filter(appointment => {
      const appointmentDate = parseISO(appointment.data);
      return isSameDay(appointmentDate, day);
    });
  };

  const getDayAvailabilities = (day: Date) => {
    if (!day || !showAvailabilities) return [];
    
    const dayOfWeek = day.getDay();
    const dateString = format(day, 'yyyy-MM-dd');
    const availabilities: any[] = [];
    
    Object.values(clientAvailabilities).forEach((clientAvails) => {
      clientAvails.forEach((avail: any) => {
        if (avail.status !== 'ativo') return;
        
        if (avail.recorrencia === 'diaria') {
          if (avail.valido_de === dateString) {
            availabilities.push(avail);
          }
        } else if (avail.dia_semana === dayOfWeek) {
          availabilities.push(avail);
        }
      });
    });
    
    return availabilities;
  };

  const getDayHoliday = (day: Date) => {
    const dateString = format(day, 'yyyy-MM-dd');
    return isHoliday(dateString);
  };

  const getHolidayColor = (holidayType: string) => {
    switch (holidayType) {
      case 'feriado':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'feriado_municipal':
        return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'religioso':
        return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'tradicao':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'cultural':
        return 'bg-[#e6f2f3] text-[#3f9094] border-[#3f9094]';
      case 'dia_importante':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getAppointmentTypeColor = (type: AppointmentType, customColor?: string | null) => {
    if (customColor) {
      return `text-white border-none`;
    }
    
    switch (type) {
      case 'avaliação':
        return 'bg-purple-500 text-white';
      case 'sessão':
        return 'bg-[#3f9094] text-white';
      case 'consulta':
        return 'bg-yellow-500 text-white';
      case 'consulta inicial':
        return 'bg-[#3f9094] text-white';
      default:
        return 'bg-[#3f9094] text-white';
    }
  };
  
  const getAppointmentStatusColor = (status: string) => {
    switch (status) {
      case 'confirmado':
      case 'agendado':
        return 'border-l-4 border-blue-500';
      case 'pendente':
        return 'border-l-4 border-orange-500';
      case 'cancelado':
        return 'border-l-4 border-red-500';
      case 'realizado':
        return 'border-l-4 border-green-500';
      default:
        return 'border-l-4 border-orange-500';
    }
  };

  const navigateMonth = (direction: 'prev' | 'next') => {
    setCurrentDate(prev => {
      const newDate = new Date(prev);
      if (direction === 'prev') {
        newDate.setMonth(newDate.getMonth() - 1);
      } else {
        newDate.setMonth(newDate.getMonth() + 1);
      }
      return newDate;
    });
  };

  const goToToday = () => {
    const today = new Date();
    setCurrentDate(today);
    setSelectedDate(today);
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
      <div className="p-4 bg-white rounded-lg border border-gray-200 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-medium text-gray-900">
            {format(currentDate, 'MMMM yyyy', { locale: pt })}
          </h3>
          <div className="flex gap-1">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigateMonth('prev')}
              className="h-8 w-8 p-0 hover:bg-gray-100 rounded-full"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigateMonth('next')}
              className="h-8 w-8 p-0 hover:bg-gray-100 rounded-full"
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
        
        <div className="grid grid-cols-7 gap-1 text-xs mb-2">
          {weekDays.map((day, index) => (
            <div key={`${day}-${index}`} className="text-center text-gray-500 font-medium py-2">
              {day}
            </div>
          ))}
        </div>
        
        <div className="grid grid-cols-7 gap-1 text-xs">
          {days.map(day => {
            const isCurrentMonth = isSameMonth(day, currentDate);
            const isDayToday = isToday(day);
            const isSelected = selectedDate && isSameDay(day, selectedDate);
            const dayHoliday = getDayHoliday(day);
            
      return (
              <button
                key={format(day, 'yyyy-MM-dd')}
                onClick={() => setSelectedDate(day)}
                className={`
                  h-8 w-8 text-xs rounded-full flex items-center justify-center hover:bg-[#e6f2f3] transition-colors relative font-medium
                  ${!isCurrentMonth ? 'text-gray-300' : 'text-gray-700'}
                  ${isDayToday ? 'bg-[#3f9094] text-white hover:bg-[#2d7a7e]' : ''}
                  ${isSelected && !isDayToday ? 'bg-[#e6f2f3] text-[#3f9094]' : ''}
                  ${dayHoliday && !isDayToday && !isSelected ? 'bg-red-50 text-red-600 font-semibold' : ''}
                `}
                title={dayHoliday ? `${dayHoliday.name} (${dayHoliday.type})` : ''}
              >
                {format(day, 'd')}
                {dayHoliday && dayHoliday.type === 'feriado' && (
                  <div className="absolute -top-0.5 -right-0.5 w-2 h-2 bg-red-500 rounded-full"></div>
                )}
              </button>
            );
          })}
          </div>
        </div>
    );
  };

  const DayEventsPanel = () => {
    if (!selectedDate) {
      return (
        <Card className="mt-4">
          <CardContent className="p-4 text-center text-sm text-gray-500">
            Selecione um dia para ver os eventos.
          </CardContent>
        </Card>
      );
    }

    const dayEvents = getDayAppointments(selectedDate).sort((a, b) =>
      compareAsc(parseISO(a.data), parseISO(b.data))
    );
    
    const dayHoliday = getDayHoliday(selectedDate);
    
    return (
      <div className="mt-4">
        <h3 className="text-sm font-medium text-[#265255] mb-3">
          Eventos de {format(selectedDate, 'd MMM', { locale: pt })}
        </h3>
        <div className="space-y-2">
          {dayHoliday && (
            <div className={`p-2 rounded-lg border ${getHolidayColor(dayHoliday.type)} opacity-60`}>
              <p className="font-semibold text-sm opacity-70">{dayHoliday.name}</p>
              <p className="text-xs opacity-50 capitalize">{dayHoliday.type.replace('_', ' ')}</p>
              {dayHoliday.description && (
                <p className="text-xs opacity-40 mt-1">{dayHoliday.description}</p>
              )}
            </div>
          )}
          
          {dayEvents.length > 0 ? (
            dayEvents.map((appointment, index) => (
              <div
                key={`day-panel-${appointment.id}-${index}`}
                onClick={() => handleEventClick(appointment)}
                className={`p-2 rounded-lg cursor-pointer transition-all hover:shadow-md ${getAppointmentTypeColor(appointment.tipo as AppointmentType, (appointment as any).cor)} ${getAppointmentStatusColor(appointment.estado)}`}
                style={(appointment as any).cor ? { backgroundColor: (appointment as any).cor } : {}}
              >
                <p className="font-semibold text-sm">{appointment.titulo}</p>
                <p className="text-xs opacity-90">{format(parseISO(appointment.data), 'HH:mm')}</p>
              </div>
            ))
          ) : !dayHoliday ? (
            <p className="text-sm text-gray-500 text-center p-4 bg-white rounded-lg border border-gray-200">
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

    const weekDays = ['DOM', 'SEG', 'TER', 'QUA', 'QUI', 'SEX', 'SÁB'];
    const weeks = [];
    for (let i = 0; i < days.length; i += 7) {
      weeks.push(days.slice(i, i + 7));
    }

    return (
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        <div className="grid grid-cols-7 border-b border-gray-200">
          {weekDays.map(day => (
            <div key={day} className="p-2 text-center text-sm font-medium text-gray-500 border-r border-gray-200 last:border-r-0">
              {day}
            </div>
          ))}
        </div>
        
        {weeks.map((week, weekIndex) => (
          <div key={weekIndex} className="grid grid-cols-7 border-b border-gray-200 last:border-b-0 min-h-[120px]">
            {week.map(day => {
              const dayAppointments = getDayAppointments(day);
              const isCurrentMonth = isSameMonth(day, currentDate);
              const isDayToday = isToday(day);
              const dayHoliday = getDayHoliday(day);
                  
              return (
                <div 
                  key={format(day, 'yyyy-MM-dd')}
                  className={`
                    p-2 border-r border-gray-200 last:border-r-0 cursor-pointer hover:bg-gray-50 relative
                    ${!isCurrentMonth ? 'bg-gray-50' : ''}
                    ${isDayToday ? 'bg-[#e6f2f3]' : ''}
                    ${dayHoliday && dayHoliday.type === 'feriado' ? 'bg-red-50' : ''}
                  `}
                  onClick={() => openNewAppointmentDialog(day)}
                >
                  <div className={`
                    text-sm font-medium mb-1 text-right relative
                    ${!isCurrentMonth ? 'text-gray-400' : 'text-gray-700'}
                    ${isDayToday ? 'text-[#3f9094] font-bold' : ''}
                    ${dayHoliday && dayHoliday.type === 'feriado' ? 'text-red-600 font-bold' : ''}
                  `}>
                    {format(day, 'd')}
                    {dayHoliday && dayHoliday.type === 'feriado' && (
                      <div className="absolute -top-1 -right-1 w-2 h-2 bg-red-500 rounded-full"></div>
                    )}
                  </div>
                  <div className="space-y-1">
                    {dayHoliday && (
                      <div className={`text-xs px-1 py-0.5 rounded truncate border ${getHolidayColor(dayHoliday.type)} opacity-50`}>
                        <span className="opacity-70">{dayHoliday.name}</span>
                      </div>
                    )}
                    
                    {dayAppointments.slice(0, dayHoliday ? 1 : 2).map((appointment, index) => {
                      const statusConfig = {
                        pendente: { label: 'Pendente', bg: 'bg-orange-500', text: 'text-white' },
                        confirmado: { label: 'Confirmado', bg: 'bg-blue-500', text: 'text-white' },
                        agendado: { label: 'Confirmado', bg: 'bg-blue-500', text: 'text-white' },
                        realizado: { label: 'Realizado', bg: 'bg-green-500', text: 'text-white' },
                        cancelado: { label: 'Cancelado', bg: 'bg-red-500', text: 'text-white' },
                      };
                      const status = statusConfig[appointment.estado as keyof typeof statusConfig] || statusConfig.pendente;
                      
                      return (
                        <div
                          key={`main-${appointment.id}-${index}`}
                          onClick={(e) => {
                            e.stopPropagation();
                            handleEventClick(appointment);
                          }}
                          className={`relative text-xs px-2 py-1 rounded truncate cursor-pointer hover:opacity-80 ${getAppointmentTypeColor(appointment.tipo as AppointmentType, (appointment as any).cor)} ${getAppointmentStatusColor(appointment.estado)}`}
                          style={(appointment as any).cor ? { backgroundColor: (appointment as any).cor } : {}}
                        >
                          {/* Badge de Status no Topo */}
                          <div className={`absolute -top-1.5 left-1 px-1.5 py-0.5 rounded text-[10px] font-bold ${status.bg} ${status.text} shadow-sm z-10`}>
                            {status.label}
                          </div>
                          <div className="pt-1">{appointment.titulo}</div>
                        </div>
                      );
                    })}
                    
                    {/* Mostrar Disponibilidades */}
                    {showAvailabilities && getDayAvailabilities(day).length > 0 && (
                      <div className="mt-1 space-y-0.5">
                        {getDayAvailabilities(day).slice(0, 2).map((avail: any, idx: number) => (
                          <div
                            key={`avail-${avail.id}-${idx}`}
                            className="text-[10px] px-1.5 py-0.5 rounded bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 text-blue-700 dark:text-blue-300 truncate cursor-help transition-all hover:bg-blue-100 dark:hover:bg-blue-900"
                            title={`${avail.hora_inicio} - ${avail.hora_fim}`}
                          >
                            ID: {avail.clientes?.id_manual || avail.cliente_id} - {avail.clientes?.nome || 'Cliente'}
                          </div>
                        ))}
                        {getDayAvailabilities(day).length > 2 && (
                          <div className="text-[10px] text-blue-600 dark:text-blue-400 px-1">
                            +{getDayAvailabilities(day).length - 2} disponíveis
                          </div>
                        )}
                      </div>
                    )}
                    {dayAppointments.length > (dayHoliday ? 1 : 2) && (
                      <div className="text-xs text-gray-500 px-2">
                        +{dayAppointments.length - (dayHoliday ? 1 : 2)} mais
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        ))}
      </div>
    );
  };
  
  const renderDayView = () => {
    if (!selectedDate) return null;
    
    const dayAppointments = getDayAppointments(selectedDate).sort((a, b) =>
      compareAsc(parseISO(a.data), parseISO(b.data))
    );
    const dayHoliday = getDayHoliday(selectedDate);

    return (
      <TimeGridView
        days={[selectedDate]}
        appointments={appointments}
        onTimeSlotClick={openNewAppointmentDialog}
        onEventClick={handleEventClick}
        onDateChange={(newDate) => setSelectedDate(newDate)}
        isDailyView={true}
        availabilities={clientAvailabilities}
        showAvailabilities={showAvailabilities}
        holidays={holidays}
      />
    );
  };

    const renderWeekView = () => {
    const weekStart = startOfWeek(selectedDate || currentDate, { weekStartsOn: 0 });
    const weekEnd = endOfWeek(selectedDate || currentDate, { weekStartsOn: 0 });
    const weekDays = eachDayOfInterval({ start: weekStart, end: weekEnd });

    return (
      <TimeGridView
        days={weekDays}
        appointments={appointments}
        onTimeSlotClick={openNewAppointmentDialog}
        onEventClick={handleEventClick}
        onDateChange={(newDate) => setSelectedDate(newDate)}
        availabilities={clientAvailabilities}
        showAvailabilities={showAvailabilities}
        holidays={holidays}
      />
    );
  };
  
  const renderAgendaView = () => {
    const today = new Date();
    const nextSevenDays = eachDayOfInterval({
        start: today,
        end: addDays(today, 6),
    });

    const upcomingAppointments = nextSevenDays.flatMap(day => {
        const appointmentsForDay = getDayAppointments(day);
        return appointmentsForDay.map(app => ({...app, day: day}));
    }).sort((a, b) => compareAsc(parseISO(a.data), parseISO(b.data)));

    return (
      <Card>
        <CardHeader>
            <CardTitle className="text-xl text-[#265255]">Próximos 7 Dias</CardTitle>
        </CardHeader>
        <CardContent>
            {upcomingAppointments.length > 0 ? (
                <ul className="space-y-4">
                    {upcomingAppointments.map((appointment, index) => {
                        const showDateHeader = index === 0 || !isSameDay(parseISO(appointment.data), parseISO(upcomingAppointments[index - 1].data));
                        return (
                            <React.Fragment key={`${appointment.id}-${index}`}>
                                {showDateHeader && (
                                    <h3 className="text-lg font-semibold pt-4 text-[#265255] border-t mt-4 first:mt-0 first:border-t-0">
                                        {format(appointment.day, "eeee, dd/MM/yyyy", { locale: pt })}
                                    </h3>
                                )}
                                <li onClick={() => handleEventClick(appointment)} className={`flex items-center space-x-4 p-3 rounded-lg cursor-pointer ${getAppointmentTypeColor(appointment.tipo as AppointmentType)} ${getAppointmentStatusColor(appointment.estado)}`}>
                                     <div className="font-bold">{format(parseISO(appointment.data), 'HH:mm')}</div>
                                     <div>
                                         <p className="font-semibold">{appointment.titulo}</p>
                                         <p className="text-sm opacity-90">{appointment.clientes?.nome || 'Cliente não associado'}</p>
            </div>
                                 </li>
                            </React.Fragment>
                        )
                    })}
                </ul>
            ) : (
              <div className="text-center text-gray-500 py-8">
                <Calendar className="mx-auto h-12 w-12 text-gray-400" />
                <p className="mt-2">Nenhum agendamento para os próximos 7 dias.</p>
          </div>
            )}
        </CardContent>
      </Card>
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
          <h2 className="text-xl font-semibold mb-2">Carregando calendário...</h2>
          <p className="text-gray-500">Aguarde enquanto buscamos os seus agendamentos</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 p-3 shrink-0">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Button variant="ghost" size="sm" className="md:hidden">
              <Menu className="h-5 w-5" />
            </Button>
            <div className="flex items-center space-x-2">
              <Calendar className="h-6 w-6 text-[#3f9094]" />
              <h1 className="text-xl font-medium text-[#265255]">Calendário</h1>
            </div>
                        <div className="hidden md:flex items-center space-x-4 pl-4">
        <Button 
          onClick={() => openNewAppointmentDialog()}
                className="bg-[#3f9094] hover:bg-[#2d7a7e] text-white rounded-full px-6 py-2 font-medium shadow-sm"
        >
          <Plus className="h-4 w-4 mr-2" />
                Criar
                </Button>
                
                <SmartScheduling />
                
                <Button
                variant="outline"
                onClick={goToToday}
                className="border-gray-300 font-medium"
                >
                Hoje
                </Button>
                
                <div className="flex items-center space-x-1">
                <Button variant="ghost" size="icon" onClick={() => navigateMonth('prev')} className="h-9 w-9 hover:bg-gray-100 rounded-full">
                    <ChevronLeft className="h-5 w-5" />
                </Button>
                <Button variant="ghost" size="icon" onClick={() => navigateMonth('next')} className="h-9 w-9 hover:bg-gray-100 rounded-full">
                    <ChevronRight className="h-5 w-5" />
        </Button>
      </div>
      
                <h2 className="text-2xl font-normal text-gray-700 min-w-[200px]">
                {format(currentDate, 'MMMM yyyy', { locale: pt })}
                </h2>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <div className="relative hidden md:block">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Pesquisar..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 w-48"
              />
            </div>
            <Select value={currentView} onValueChange={(value: CalendarView) => setCurrentView(value)}>
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="day">Dia</SelectItem>
                <SelectItem value="week">Semana</SelectItem>
                <SelectItem value="month">Mês</SelectItem>
                <SelectItem value="agenda">Agenda</SelectItem>
              </SelectContent>
            </Select>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-gray-100">
                  <MoreHorizontal className="h-5 w-5" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem>
                  <Settings className="h-4 w-4 mr-2" />
                  Definições
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden">
                {/* Sidebar */}
        <aside className="w-64 bg-gray-50 border-r border-gray-200 p-4 space-y-4 overflow-y-auto hidden md:block">
          {renderMiniCalendar()}
        <DayEventsPanel />
          
          {/* Legenda de Cores */}
          <div className="p-4 bg-white rounded-lg border border-gray-200">
            <h3 className="text-sm font-medium text-[#265255] mb-3">Tipos de Eventos</h3>
            <div className="space-y-2">
              <div className="flex items-center space-x-2">
                <div className="w-4 h-4 bg-purple-500 rounded"></div>
                <span className="text-xs text-gray-700">Avaliação</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-4 h-4 bg-[#3f9094] rounded"></div>
                <span className="text-xs text-gray-700">Neurofeedback</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-4 h-4 bg-yellow-500 rounded"></div>
                <span className="text-xs text-gray-700">Discussão</span>
              </div>
      </div>

            <h3 className="text-sm font-medium text-[#265255] mb-3 mt-4">Status de Eventos</h3>
            <div className="space-y-2">
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 rounded-full bg-orange-500 border border-orange-600"></div>
                <span className="text-xs text-gray-700">Pendente</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 rounded-full bg-blue-500 border border-blue-600"></div>
                <span className="text-xs text-gray-700">Confirmado</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 rounded-full bg-green-500 border border-green-600"></div>
                <span className="text-xs text-gray-700">Realizado</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 rounded-full bg-red-500 border border-red-600"></div>
                <span className="text-xs text-gray-700">Cancelado</span>
              </div>
            </div>
            <p className="text-xs text-gray-500 mt-2 italic">
              * Badge de status aparece no topo de cada agendamento
            </p>

            <h3 className="text-sm font-medium text-[#265255] mb-3 mt-4">Disponibilidades</h3>
            <div className="flex items-center space-x-2">
              <Checkbox
                id="show-availabilities"
                checked={showAvailabilities}
                onCheckedChange={(checked) => setShowAvailabilities(checked === true)}
              />
              <label htmlFor="show-availabilities" className="text-xs text-gray-700 cursor-pointer">
                Mostrar disponibilidades dos clientes
              </label>
            </div>
            {showAvailabilities && (
              <div className="mt-2 space-y-1">
                <div className="flex items-center space-x-2">
                  <div className="w-3 h-3 bg-blue-100 border border-blue-300 rounded"></div>
                  <span className="text-xs text-gray-700">Horários disponíveis</span>
                </div>
              </div>
            )}

            <h3 className="text-sm font-medium text-[#265255] mb-3 mt-4">Feriados e Datas Especiais</h3>
            <div className="space-y-2">
              <div className="flex items-center space-x-2">
                <div className="w-4 h-4 bg-red-100 border border-red-200 rounded"></div>
                <span className="text-xs text-gray-700">Feriado Nacional</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-4 h-4 bg-orange-100 border border-orange-200 rounded"></div>
                <span className="text-xs text-gray-700">Feriado Municipal</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-4 h-4 bg-purple-100 border border-purple-200 rounded"></div>
                <span className="text-xs text-gray-700">Religioso</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-4 h-4 bg-green-100 border border-green-200 rounded"></div>
                <span className="text-xs text-gray-700">Tradição</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-4 h-4 bg-[#e6f2f3] border border-[#3f9094] rounded"></div>
                <span className="text-xs text-gray-700">Cultural</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-4 h-4 bg-yellow-100 border border-yellow-200 rounded"></div>
                <span className="text-xs text-gray-700">Dia Importante</span>
              </div>
            </div>
          </div>
        </aside>

        {/* Calendar */}
        <main className="flex-1 p-4 overflow-y-auto">
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

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="data"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Data</FormLabel>
                      <FormControl>
                        <Input type="date" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="hora"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Hora</FormLabel>
                      <FormControl>
                        <Input type="time" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
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

                  console.log('Total de clientes carregados:', clients.length);
                  console.log('Clientes a exibir:', displayClients.length);

                  return (
                    <FormItem>
                      <FormLabel>Cliente (Opcional)</FormLabel>
                      <div className="space-y-2">
                        <div className="relative">
                          <Input
                            type="text"
                            placeholder={isLoadingClients ? "Carregando clientes..." : "🔍 Pesquisar por nome ou ID..."}
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
                            console.log('Cliente selecionado no Select:', value);
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
                                  ? "Carregando clientes..." 
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
                                Nenhum cliente cadastrado
                              </div>
                            )}
                          </SelectContent>
                        </Select>

                        {selectedClient && (
                          <div className="px-3 py-2 bg-blue-50 border border-blue-200 rounded-md flex items-center justify-between">
                            <span className="text-sm font-medium text-blue-900">
                              ✓ {selectedClient.id_manual ? `[${selectedClient.id_manual}] ` : `[ID: ${selectedClient.id}] `}
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
                              ✕ Remover
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
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Tipo de agendamento" />
                        </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="sessão">Sessão</SelectItem>
                          <SelectItem value="avaliação">Avaliação</SelectItem>
                          <SelectItem value="consulta">Consulta</SelectItem>
                          <SelectItem value="consulta inicial">Consulta Inicial</SelectItem>
                        </SelectContent>
                      </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              </div>

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
                            '#D50000', '#E67C73', '#F4511E', '#F6BF26', '#33B679', 
                            '#0B8043', '#039BE5', '#3F51B5', '#7986CB', '#8E24AA', '#616161'
                          ].map((color) => (
                            <button
                              key={color}
                              type="button"
                              className={`w-8 h-8 rounded-full border-2 hover:scale-110 transition-transform ${
                                field.value === color ? 'border-gray-800' : 'border-gray-300'
                              }`}
                              style={{ backgroundColor: color }}
                              onClick={() => field.onChange(color)}
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
                            placeholder="#3B82F6"
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

              <DialogFooter className="flex justify-between w-full">
                <div>
                {selectedAppointment && (
                  <Button 
                    type="button" 
                    variant="destructive" 
                    onClick={handleDeleteAppointment}
                  >
                    Eliminar
                  </Button>
                )}
                </div>
                <div className="flex space-x-2">
                  <DialogClose asChild>
                    <Button type="button" variant="outline">
                      Cancelar
                    </Button>
                  </DialogClose>
                  <Button type="submit" className="bg-[#3f9094] hover:bg-[#265255]">
                    {selectedAppointment ? 'Atualizar' : 'Criar'}
                  </Button>
                </div>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AppointmentCalendar;
