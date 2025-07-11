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

type AppointmentType = 'sessão' | 'avaliação' | 'consulta';
type AppointmentStatus = 'confirmado' | 'pendente';
type CalendarView = 'month' | 'week' | 'day' | 'agenda';

type Appointment = Database['public']['Tables']['agendamentos']['Row'] & {
  clientes: {
    nome: string;
    email: string;
    telefone: string;
  };
};

interface AppointmentFormValues {
  titulo: string;
  data: string;
  hora: string;
  id_cliente: number;
  tipo: AppointmentType;
  notas: string;
  estado: string;
  terapeuta: string;
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

  const holidays = getAllHolidaysUntil2040();

  const form = useForm<AppointmentFormValues>({
    defaultValues: {
      titulo: '',
      data: '',
      hora: '09:00',
      id_cliente: 0,
      tipo: 'sessão',
      notas: '',
      estado: 'pendente',
      terapeuta: ''
    },
  });

  const openNewAppointmentDialog = (date?: Date) => {
    setSelectedAppointment(null);
    const today = date || new Date();
    
    form.reset({
      titulo: '',
      data: format(today, 'yyyy-MM-dd'),
      hora: '09:00',
      id_cliente: 0,
      tipo: 'sessão',
      notas: '',
      estado: 'pendente',
      terapeuta: ''
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
        terapeuta: appointment.terapeuta || ''
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
      const appointmentData = {
        titulo: data.titulo,
        data: `${data.data}T${data.hora}:00`,
        hora: data.hora,
        id_cliente: data.id_cliente,
        tipo: data.tipo,
        notas: data.notas,
        estado: data.estado,
        terapeuta: data.terapeuta
      };

      if (selectedAppointment) {
        await updateAppointment(selectedAppointment.id, appointmentData);
      } else {
        await addAppointment(appointmentData);
      }

      setIsDialogOpen(false);
      setSelectedAppointment(null);
      form.reset();
    } catch (error) {
      console.error('Error saving appointment:', error);
    }
  };

  const getDayAppointments = (day: Date) => {
    if (!day) return [];
    
    return appointments.filter(appointment => {
      const appointmentDate = parseISO(appointment.data);
      return isSameDay(appointmentDate, day);
    });
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
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'dia_importante':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getAppointmentTypeColor = (type: AppointmentType) => {
    switch (type) {
      case 'avaliação':
        return 'bg-purple-500 text-white';
      case 'sessão':
        return 'bg-blue-500 text-white';
      case 'consulta':
        return 'bg-yellow-500 text-white';
      default:
        return 'bg-blue-500 text-white';
    }
  };

  const getAppointmentStatusColor = (status: string) => {
    switch (status) {
      case 'confirmado':
        return 'border-l-4 border-green-500';
      case 'pendente':
        return 'border-l-4 border-red-500';
      case 'cancelado':
        return 'border-l-4 border-gray-500';
      case 'concluido':
        return 'border-l-4 border-blue-500';
      default:
        return 'border-l-4 border-red-500';
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
      <div className="p-4 bg-white rounded-lg border border-gray-200">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-medium text-[#265255]">
            {format(currentDate, 'MMMM yyyy', { locale: pt })}
          </h3>
          <div className="flex gap-1">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigateMonth('prev')}
              className="h-6 w-6 p-0 hover:bg-gray-100"
            >
              <ChevronLeft className="h-3 w-3" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigateMonth('next')}
              className="h-6 w-6 p-0 hover:bg-gray-100"
            >
              <ChevronRight className="h-3 w-3" />
            </Button>
          </div>
        </div>
        
        <div className="grid grid-cols-7 gap-1 text-xs">
          {weekDays.map(day => (
            <div key={day} className="text-center text-gray-500 font-medium py-1">
              {day}
            </div>
          ))}
          {days.map(day => {
            const isCurrentMonth = isSameMonth(day, currentDate);
            const isDayToday = isToday(day);
            const isSelected = selectedDate && isSameDay(day, selectedDate);
            const dayHoliday = getDayHoliday(day);
            
      return (
              <button
                key={day.toISOString()}
                onClick={() => setSelectedDate(day)}
                className={`
                  h-6 w-6 text-xs rounded-full flex items-center justify-center hover:bg-gray-100 transition-colors relative
                  ${!isCurrentMonth ? 'text-gray-300' : 'text-gray-700'}
                  ${isDayToday ? 'bg-[#3f9094] text-white hover:bg-[#265255]' : ''}
                  ${isSelected && !isDayToday ? 'bg-[#c5cfce] text-[#265255]' : ''}
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
            <div className={`p-2 rounded-lg border ${getHolidayColor(dayHoliday.type)}`}>
              <p className="font-semibold text-sm">{dayHoliday.name}</p>
              <p className="text-xs opacity-90 capitalize">{dayHoliday.type.replace('_', ' ')}</p>
              {dayHoliday.description && (
                <p className="text-xs opacity-75 mt-1">{dayHoliday.description}</p>
              )}
            </div>
          )}
          
          {dayEvents.length > 0 ? (
            dayEvents.map(appointment => (
              <div
                key={appointment.id}
                onClick={() => handleEventClick(appointment)}
                className={`p-2 rounded-lg cursor-pointer transition-all hover:shadow-md ${getAppointmentTypeColor(appointment.tipo as AppointmentType)} ${getAppointmentStatusColor(appointment.estado)}`}
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
                  key={day.toISOString()}
                  className={`
                    p-2 border-r border-gray-200 last:border-r-0 cursor-pointer hover:bg-gray-50 relative
                    ${!isCurrentMonth ? 'bg-gray-50' : ''}
                    ${isDayToday ? 'bg-blue-50' : ''}
                    ${dayHoliday && dayHoliday.type === 'feriado' ? 'bg-red-50' : ''}
                  `}
                  onClick={() => handleDateClick(day)}
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
                      <div className={`text-xs px-1 py-0.5 rounded truncate border ${getHolidayColor(dayHoliday.type)}`}>
                        {dayHoliday.name}
                      </div>
                    )}
                    
                    {dayAppointments.slice(0, dayHoliday ? 1 : 2).map(appointment => (
                      <div
                        key={appointment.id}
                        onClick={(e) => {
                          e.stopPropagation();
                          handleEventClick(appointment);
                        }}
                        className={`text-xs px-2 py-1 rounded truncate cursor-pointer hover:opacity-80 ${getAppointmentTypeColor(appointment.tipo as AppointmentType)} ${getAppointmentStatusColor(appointment.estado)}`}
                      >
                         {appointment.titulo}
                      </div>
                    ))}
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
      <Card>
        <CardHeader>
          <CardTitle className="text-xl text-[#265255]">{format(selectedDate, "eeee, dd 'de' MMMM", { locale: pt })}</CardTitle>
        </CardHeader>
        <CardContent className="p-4">
          <div className="space-y-4">
            {dayHoliday && (
              <div className={`p-4 rounded-lg border ${getHolidayColor(dayHoliday.type)}`}>
                <h3 className="font-bold text-lg mb-2">{dayHoliday.name}</h3>
                <p className="text-sm opacity-90 capitalize mb-1">{dayHoliday.type.replace('_', ' ')}</p>
                {dayHoliday.description && (
                  <p className="text-sm opacity-75">{dayHoliday.description}</p>
                )}
              </div>
            )}

            {dayAppointments.length > 0 ? (
              <ul className="space-y-3">
                {dayAppointments.map(appointment => (
                  <li
                    key={appointment.id}
                    onClick={() => handleEventClick(appointment)}
                    className={`flex items-center space-x-4 p-3 rounded-lg cursor-pointer transition-shadow hover:shadow-md ${getAppointmentTypeColor(appointment.tipo as AppointmentType)} ${getAppointmentStatusColor(appointment.estado)}`}
                  >
                    <div className="font-bold text-lg">{format(parseISO(appointment.data), 'HH:mm')}</div>
                    <div>
                      <p className="font-semibold">{appointment.titulo}</p>
                      <p className="text-sm opacity-90">{appointment.clientes?.nome || 'Cliente não associado'}</p>
                    </div>
                  </li>
                ))}
              </ul>
            ) : !dayHoliday ? (
              <div className="text-center text-gray-500 py-8">
                <Calendar className="mx-auto h-12 w-12 text-gray-400" />
                <p className="mt-2">Nenhum agendamento para este dia.</p>
              </div>
            ) : null}
          </div>
        </CardContent>
      </Card>
    );
  };

  const renderWeekView = () => {
    if (!selectedDate) return null;
    const weekStart = startOfWeek(currentDate, { weekStartsOn: 0 });
    const weekEnd = endOfWeek(currentDate, { weekStartsOn: 0 });
    const weekDays = eachDayOfInterval({ start: weekStart, end: weekEnd });

    return (
      <div className="space-y-4">
        {weekDays.map(day => {
          const dayAppointments = getDayAppointments(day).sort((a, b) =>
            compareAsc(parseISO(a.data), parseISO(b.data))
          );
          const dayHoliday = getDayHoliday(day);
          
          return (
            <Card key={day.toISOString()} className="bg-white">
              <CardHeader className={`p-3 border-b ${dayHoliday && dayHoliday.type === 'feriado' ? 'bg-red-50' : 'bg-gray-50'}`}>
                <CardTitle className={`text-md font-medium ${dayHoliday && dayHoliday.type === 'feriado' ? 'text-red-600' : 'text-[#265255]'}`}>
                  {format(day, "eeee, dd/MM", { locale: pt })}
                  {dayHoliday && dayHoliday.type === 'feriado' && (
                    <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                      Feriado
                    </span>
                  )}
                </CardTitle>
              </CardHeader>
              <CardContent className="p-3">
                <div className="space-y-2">
                  {dayHoliday && (
                    <div className={`p-2 rounded text-xs border ${getHolidayColor(dayHoliday.type)}`}>
                      <p className="font-semibold">{dayHoliday.name}</p>
                      <p className="opacity-75 capitalize">{dayHoliday.type.replace('_', ' ')}</p>
                    </div>
                  )}
                  
                  {dayAppointments.length > 0 ? (
                    <ul className="space-y-2">
                      {dayAppointments.map(appointment => (
                        <li
                          key={appointment.id}
                          onClick={() => handleEventClick(appointment)}
                          className={`flex items-center space-x-3 p-2 rounded cursor-pointer ${getAppointmentTypeColor(appointment.tipo as AppointmentType)} ${getAppointmentStatusColor(appointment.estado)}`}
                        >
                          <div className="font-semibold text-xs">{format(parseISO(appointment.data), 'HH:mm')}</div>
                          <div className="text-sm truncate">{appointment.titulo}</div>
                        </li>
                      ))}
                    </ul>
                  ) : !dayHoliday ? (
                    <p className="text-xs text-gray-400 py-2">Sem eventos agendados.</p>
                  ) : null}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
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
                            <React.Fragment key={appointment.id}>
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
                className="bg-[#3f9094] hover:bg-[#265255] text-white"
                >
                <Plus className="h-4 w-4 mr-2" />
                Criar
                </Button>
                
                <SmartScheduling />
                
                <Button
                variant="outline"
                onClick={goToToday}
                className="border-gray-300"
                >
                Hoje
                </Button>
                
                <div className="flex items-center space-x-1">
                <Button variant="ghost" size="icon" onClick={() => navigateMonth('prev')} className="h-8 w-8 hover:bg-gray-100">
                    <ChevronLeft className="h-4 w-4" />
                </Button>
                <Button variant="ghost" size="icon" onClick={() => navigateMonth('next')} className="h-8 w-8 hover:bg-gray-100">
                    <ChevronRight className="h-4 w-4" />
        </Button>
      </div>
      
                <h2 className="text-xl font-medium text-gray-600">
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
                <div className="w-4 h-4 bg-blue-500 rounded"></div>
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
                <div className="w-4 h-2 bg-green-500 rounded"></div>
                <span className="text-xs text-gray-700">Confirmado</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-4 h-2 bg-red-500 rounded"></div>
                <span className="text-xs text-gray-700">Pendente</span>
              </div>
            </div>

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
                <div className="w-4 h-4 bg-blue-100 border border-blue-200 rounded"></div>
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
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Cliente</FormLabel>
                      <Select onValueChange={(value) => field.onChange(parseInt(value))} value={field.value?.toString()}>
                    <FormControl>
                          <SelectTrigger>
                          <SelectValue placeholder="Selecione um cliente" />
                        </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {clients.map(client => (
                            <SelectItem key={client.id} value={client.id.toString()}>
                              {client.nome}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    <FormMessage />
                  </FormItem>
                )}
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
                        <SelectItem value="concluido">Concluído</SelectItem>
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
