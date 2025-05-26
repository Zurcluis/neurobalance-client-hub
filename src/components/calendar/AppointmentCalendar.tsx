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
import { addDays, format, isSameDay, parseISO, getYear, startOfWeek, endOfWeek, startOfYear, endOfYear } from 'date-fns';
import { pt } from 'date-fns/locale';
import { Card, CardContent } from '../ui/card';
import { ClientDetailData } from '@/types/client';
import { useIsMobile } from '@/hooks/use-mobile';
import { Plus, Search, Calendar } from 'lucide-react';
import useAppointments from '@/hooks/useAppointments';
import useClients from '@/hooks/useClients';
import { Database } from '@/integrations/supabase/types';
import { getAllHolidaysUntil2040 } from '@/data/portugueseHolidays';

// Importações do FullCalendar
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction';

type AppointmentType = 'sessão' | 'avaliação' | 'consulta';
type AppointmentStatus = 'confirmado' | 'pendente';
type CalendarView = 'dayGridMonth' | 'timeGridWeek' | 'timeGridDay';

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

interface AppointmentData {
  titulo: string;
  data: string;
  hora: string;
  id_cliente: number;
  tipo: string;
  notas: string;
  estado: string;
  terapeuta?: string;
}

const AppointmentCalendar = () => {
  const calendarRef = useRef<FullCalendar>(null);
  const { appointments, isLoading: isLoadingAppointments, addAppointment, updateAppointment, deleteAppointment } = useAppointments();
  const { clients, isLoading: isLoadingClients } = useClients();
  
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null);
  const [currentView, setCurrentView] = useState<CalendarView>('dayGridMonth');
  const isMobile = useIsMobile();
  const [searchDate, setSearchDate] = useState<string>('');
  const [searchType, setSearchType] = useState<'day' | 'week' | 'year'>('day');

  // Obter feriados para todos os anos até 2040
  const holidays = getAllHolidaysUntil2040();

  // Converter feriados para o formato do FullCalendar
  const holidayEvents = holidays.map(holiday => ({
    id: `holiday-${holiday.date}`,
    title: holiday.name,
    start: holiday.date,
    allDay: true,
    display: 'background',
    classNames: [
      holiday.type === 'feriado' ? 'holiday-bg' : 'important-day-bg',
      'holiday-event'
    ],
    extendedProps: {
      type: holiday.type,
      isHoliday: true
    }
  }));

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

  const handleDateClick = (info: any) => {
    const clickedDate = new Date(info.date);
    setSelectedDate(clickedDate);
  };

  const handleEventClick = (info: any) => {
    const appointment = appointments.find(apt => apt.id.toString() === info.event.id);
    if (appointment) {
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
    }
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

  const getAppointmentTypeColor = (type: AppointmentType) => {
    switch (type) {
      case 'avaliação':
        return 'bg-[#9e50b3] text-white';
      case 'sessão':
        return 'bg-[#1088c4] text-white';
      case 'consulta':
        return 'bg-[#ecc249] text-[#3A2B00]';
      default:
        return 'bg-gray-200 text-[#265255]';
    }
  };

  const getAppointmentTypeBoxShadow = (type: AppointmentType) => {
    switch (type) {
      case 'avaliação':
        return 'shadow-[0_4px_12px_rgba(158,80,179,0.25)]';
      case 'sessão':
        return 'shadow-[0_4px_12px_rgba(16,136,196,0.25)]';
      case 'consulta':
        return 'shadow-[0_4px_12px_rgba(236,194,73,0.25)]';
      default:
        return 'shadow-md';
    }
  };

  const getAppointmentBackgroundColor = (type: AppointmentType) => {
    switch (type) {
      case 'avaliação':
        return '#9e50b3';
      case 'sessão':
        return '#1088c4';
      case 'consulta':
        return '#ecc249';
      default:
        return '#3f9094';
    }
  };
  
  const getAppointmentBorderColor = (type: AppointmentType) => {
    switch (type) {
      case 'avaliação':
        return '#7a3e8c';
      case 'sessão':
        return '#0a6999';
      case 'consulta':
        return '#c9a53a';
      default:
        return '#2a6366';
    }
  };
  
  const getAppointmentTextColor = (type: AppointmentType) => {
    if (type === 'consulta') return '#3A2B00';
    return '#ffffff';
  };

  // Função para obter a classe CSS baseada no status do evento
  const getAppointmentStatusClass = (status: string) => {
    switch (status) {
      case 'confirmado':
        return 'sidebar-status-confirmado';
      case 'pendente':
        return 'sidebar-status-pendente';
      default:
        return 'sidebar-status-pendente';
    }
  };

  // Função para renderizar o indicador de status
  const renderStatusIndicator = (status: string) => {
    return <span className={`status-indicator status-indicator-${status}`}></span>;
  };

  const eventContent = (eventInfo: any) => {
    const type = eventInfo.event.extendedProps.type;
    const time = eventInfo.timeText;
    const title = eventInfo.event.title;
    const clientName = eventInfo.event.extendedProps.clientName;
    const status = eventInfo.event.extendedProps.estado || 'pendente';
    const isSmallEvent = eventInfo.view.type === 'dayGridMonth';
    
    if (isSmallEvent) {
      return (
        <div className="px-0 py-0 overflow-hidden w-full text-ellipsis">
          <div className="font-medium truncate text-xs flex items-center">
            {renderStatusIndicator(status)}
            {title}
          </div>
        </div>
      );
    }
    
    return (
      <div className="px-1 py-0.5 overflow-hidden">
        {time && <div className="text-xs font-semibold mb-0.5">{time}</div>}
        <div className="font-medium truncate flex items-center">
          {renderStatusIndicator(status)}
          {title}
        </div>
        {clientName && (
          <div className="text-xs truncate opacity-80 flex items-center">
            <span className="text-xs mr-1">•</span>
            {clientName}
          </div>
        )}
        <div className="text-xs opacity-70 flex items-center mt-0.5">
          <span className="text-[0.65rem] capitalize">{type}</span>
        </div>
      </div>
    );
  };

  const calendarEvents = [
    ...appointments.map(appointment => {
      const appointmentType = appointment.tipo as AppointmentType;
      const appointmentStatus = appointment.estado || 'pendente';
      
      return {
        id: appointment.id.toString(),
        title: appointment.titulo,
        start: appointment.data,
        extendedProps: {
          clientName: appointment.clientes?.nome || 'Cliente não definido',
          clientId: appointment.id_cliente.toString(),
          type: appointmentType,
          notes: appointment.notas,
          estado: appointmentStatus
        },
        classNames: [
          'rounded-lg', 
          'py-1', 
          'px-2', 
          'border', 
          'border-white/20', 
          `event-${appointmentType}`,
          `status-${appointmentStatus}`
        ],
      };
    }),
    ...holidayEvents
  ];

  // Opções para personalizar o FullCalendar
  const calendarOptions = {
    plugins: [dayGridPlugin, timeGridPlugin, interactionPlugin],
    initialView: isMobile ? 'timeGridDay' : currentView,
    headerToolbar: {
      left: isMobile ? 'prev,next' : 'prev,next today',
      center: 'title',
      right: isMobile ? 'dayGridMonth,timeGridDay' : 'dayGridMonth,timeGridWeek,timeGridDay'
    },
    titleFormat: {
      month: 'long' as 'long',
      year: 'numeric' as 'numeric',
    },
    buttonText: {
      today: 'Hoje',
      month: isMobile ? 'Mês' : 'Mês',
      week: 'Semana',
      day: isMobile ? 'Dia' : 'Dia'
    },
    dayHeaderFormat: { weekday: isMobile ? 'narrow' : 'short' as 'narrow' | 'short' },
    locale: 'pt-br',
    events: calendarEvents,
    eventClick: handleEventClick,
    dateClick: handleDateClick,
    eventContent: eventContent,
    eventTimeFormat: {
      hour: '2-digit' as '2-digit',
      minute: '2-digit' as '2-digit',
      hour12: false
    },
    slotLabelFormat: {
      hour: '2-digit' as '2-digit',
      minute: '2-digit' as '2-digit',
      hour12: false
    },
    customButtons: {
      today: {
        text: 'Hoje',
        click: function() {
          if (calendarRef.current) {
            const calendarApi = calendarRef.current.getApi();
            calendarApi.today();
            setSelectedDate(new Date());
          }
        }
      }
    },
    allDaySlot: false,
    height: 'auto',
    aspectRatio: isMobile ? 1.2 : 1.5,
    contentHeight: isMobile ? 450 : 800,
    slotMinTime: '08:00',
    slotMaxTime: '20:00',
    slotDuration: isMobile ? '01:00:00' : '00:30:00',
    slotLabelInterval: isMobile ? '01:00:00' : undefined,
    nowIndicator: true,
    eventOverlap: true,
    stickyHeaderDates: true,
    dayMaxEventRows: isMobile ? 3 : 8,
    moreLinkClick: 'popover',
    moreLinkClassNames: 'text-xs bg-[#3f9094] text-white rounded px-1 py-0.5',
    eventMaxStack: isMobile ? 3 : 10,
    expandRows: true,
    fixedWeekCount: false,
    handleWindowResize: true,
    themeSystem: 'standard',
    views: {
      dayGridMonth: {
        dayMaxEventRows: isMobile ? 3 : 8,
        eventTimeFormat: {
          hour: '2-digit' as '2-digit',
          minute: '2-digit' as '2-digit',
          omitZeroMinute: true
        }
      },
      timeGridWeek: {
        slotDuration: isMobile ? '01:00:00' : '00:30:00',
        slotLabelInterval: isMobile ? '01:00:00' : undefined,
      },
      timeGridDay: {
        slotDuration: isMobile ? '01:00:00' : '00:30:00',
        nowIndicator: true,
        dayHeaderFormat: { weekday: 'long' as 'long', month: 'long' as 'long', day: 'numeric' as 'numeric' }
      },
      listDay: {
        displayEventTime: true,
        displayEventEnd: true,
      },
      listWeek: {
        displayEventTime: true,
        displayEventEnd: true,
      }
    },
    datesSet: (dateInfo: any) => {
      if (calendarRef.current) {
        const view = calendarRef.current.getApi().view;
        setCurrentView(view.type as CalendarView);
        setSelectedDate(dateInfo.start);
      }
    },
    windowResize: (arg: any) => {
      // Adaptação dinâmica baseada na largura da tela
      if (arg.view.calendar) {
        const width = window.innerWidth;
        if (width < 768 && currentView !== 'timeGridDay') {
          arg.view.calendar.changeView('timeGridDay');
        }
      }
    }
  };

  const DayEventsPanel = () => {
    const todayEvents = getDayAppointments(selectedDate || new Date());

    return (
      <Card className={`glassmorphism ${isMobile ? 'mt-2' : ''}`}>
        <CardContent className="p-3 sm:p-4">
          <h3 className="text-xl font-medium mb-3 text-[#265255]">
            Eventos do dia {selectedDate ? format(selectedDate, 'd MMM', { locale: pt }) : ''}
          </h3>
          {selectedDate ? (
            <div className="space-y-2 sm:space-y-3">
              {todayEvents.length > 0 ? (
                todayEvents.map(appointment => {
                  const appointmentType = appointment.tipo as AppointmentType;
                  const status = appointment.estado || 'pendente';
                  
                  return (
                    <div 
                      key={appointment.id} 
                      className={`p-3 sm:p-4 rounded-lg cursor-pointer transition-all hover:translate-y-[-2px] ${getAppointmentTypeColor(appointmentType)} shadow-sm hover:shadow-md`}
                      style={{ borderRight: status === 'confirmado' ? '3px solid #28a745' : '3px solid #dc3545' }}
                      onClick={() => {
                        setSelectedAppointment(appointment);
                        const [datePart, timePart] = appointment.data.split('T');
                        
                        form.reset({
                          titulo: appointment.titulo,
                          data: datePart,
                          hora: timePart ? timePart.substring(0, 5) : '09:00',
                          id_cliente: appointment.id_cliente,
                          tipo: appointment.tipo as AppointmentType,
                          notas: appointment.notas || '',
                          estado: status
                        });
                        
                        setIsDialogOpen(true);
                      }}
                    >
                      <div className="flex justify-between items-center">
                        <div>
                          <h4 className="font-medium line-clamp-1 flex items-center">
                            {renderStatusIndicator(status)}
                            {appointment.titulo}
                          </h4>
                          <p className="text-sm line-clamp-1 opacity-80">{appointment.clientes?.nome || 'Cliente não definido'}</p>
                          <div className="flex justify-between items-center mt-1">
                            <span className="text-xs capitalize px-2 py-0.5 rounded-full bg-white/30">
                              {appointmentType}
                            </span>
                            <span className="text-xs px-2 py-0.5 rounded-full bg-white/20">
                              {appointment.data.split('T')[1] ? appointment.data.split('T')[1].substring(0, 5) : '09:00'}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })
              ) : (
                <p className="text-center py-6 text-gray-500">Sem agendamentos para este dia</p>
              )}
            </div>
          ) : (
            <p className="text-center py-6 text-gray-500">Selecione uma data para ver os agendamentos</p>
          )}
          
          <div className="mt-4 sm:mt-8 space-y-2">
            <h4 className="font-medium text-[#265255]">Tipos de Eventos</h4>
            <div className="flex flex-wrap gap-3">
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 sm:w-4 sm:h-4 rounded-sm bg-[#9e50b3]"></div>
                <span className="text-xs sm:text-sm text-[#265255]">Avaliação</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 sm:w-4 sm:h-4 rounded-sm bg-[#1088c4]"></div>
                <span className="text-xs sm:text-sm text-[#265255]">Neurofeedback</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 sm:w-4 sm:h-4 rounded-sm bg-[#ecc249]"></div>
                <span className="text-xs sm:text-sm text-[#265255]">Discussão</span>
              </div>
            </div>
            
            <h4 className="font-medium text-[#265255] mt-4">Status de Eventos</h4>
            <div className="flex flex-wrap gap-3">
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 sm:w-4 sm:h-4 rounded-full bg-[#28a745]"></div>
                <span className="text-xs sm:text-sm text-[#265255]">Confirmado</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 sm:w-4 sm:h-4 rounded-full bg-[#dc3545]"></div>
                <span className="text-xs sm:text-sm text-[#265255]">Pendente</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  };

  const handleSearch = () => {
    if (!searchDate) return;

    try {
      const date = new Date(searchDate);
      const calendarApi = calendarRef.current?.getApi();
      
      if (!calendarApi) return;

      switch (searchType) {
        case 'day':
          calendarApi.gotoDate(date);
          calendarApi.changeView('timeGridDay');
          break;
        case 'week':
          calendarApi.gotoDate(date);
          calendarApi.changeView('timeGridWeek');
          break;
        case 'year':
          calendarApi.gotoDate(date);
          calendarApi.changeView('dayGridMonth');
          break;
      }

      setSelectedDate(date);
    } catch (error) {
      toast.error('Data inválida. Por favor, use o formato YYYY-MM-DD');
    }
  };

  const SearchPanel = () => (
    <Card className="glassmorphism mb-4">
      <CardContent className="p-4">
        <div className="flex flex-col sm:flex-row gap-4 items-end">
          <div className="flex-1">
            <label className="text-sm font-medium text-[#265255] mb-2 block">
              Pesquisar por Data
            </label>
            <div className="flex gap-2">
              <Input
                type="date"
                value={searchDate}
                onChange={(e) => setSearchDate(e.target.value)}
                className="flex-1"
              />
              <Select
                value={searchType}
                onValueChange={(value: 'day' | 'week' | 'year') => setSearchType(value)}
              >
                <SelectTrigger className="w-[120px]">
                  <SelectValue placeholder="Tipo" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="day">Dia</SelectItem>
                  <SelectItem value="week">Semana</SelectItem>
                  <SelectItem value="year">Ano</SelectItem>
                </SelectContent>
              </Select>
              <Button 
                onClick={handleSearch}
                className="bg-[#3f9094] hover:bg-[#265255]"
              >
                <Search className="h-4 w-4 mr-2" />
                Pesquisar
              </Button>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );

  if (isLoadingAppointments || isLoadingClients) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <h2 className="text-xl font-semibold mb-2">Loading calendar...</h2>
          <p className="text-gray-500">Please wait while we fetch your appointments</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 mb-2 sm:mb-6">
        <h2 className="text-2xl sm:text-3xl font-bold gradient-heading mb-2 sm:mb-0">
          Calendário
        </h2>
        <Button 
          className="bg-[#3f9094] hover:bg-[#265255] w-full sm:w-auto h-10 whitespace-nowrap" 
          onClick={() => openNewAppointmentDialog()}
        >
          <Plus className="h-4 w-4 mr-2" />
          Novo Agendamento
        </Button>
      </div>
      
      <SearchPanel />
      
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-3 sm:gap-4">
        <Card className={`glassmorphism ${isMobile ? '' : 'lg:col-span-3'} p-1 sm:p-4 min-h-[400px] sm:min-h-[800px] overflow-hidden`}>
          <CardContent className="p-0 sm:p-1 h-full">
            <div className="calendar-container -mx-2 sm:mx-0">
              <FullCalendar
                ref={calendarRef}
                {...calendarOptions}
              />
            </div>
          </CardContent>
        </Card>

        <DayEventsPanel />
      </div>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>
              {selectedAppointment ? 'Editar Agendamento' : 'Novo Agendamento'}
            </DialogTitle>
            <DialogDescription>
              {selectedAppointment 
                ? 'Atualize as informações do agendamento'
                : 'Preencha os dados para criar um novo agendamento'}
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
                        <Input type="date" {...field} required className="mobile-date-input" />
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
                        <Input type="time" {...field} required className="mobile-time-input" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              
              <FormField
                control={form.control}
                name="id_cliente"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Cliente</FormLabel>
                    <FormControl>
                      <Select 
                        onValueChange={(value) => field.onChange(parseInt(value))} 
                        value={field.value.toString()}
                      >
                        <SelectTrigger className="h-10">
                          <SelectValue placeholder="Selecione um cliente" />
                        </SelectTrigger>
                        <SelectContent>
                          {clients.map((client) => (
                            <SelectItem key={client.id} value={client.id.toString()}>
                              {client.nome}
                              {client.id_manual ? ` (ID: ${client.id_manual})` : ''}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </FormControl>
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
                    <FormControl>
                      <Select 
                        onValueChange={field.onChange} 
                        value={field.value}
                      >
                        <SelectTrigger className="h-10">
                          <SelectValue placeholder="Selecione o tipo" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="sessão">Sessão</SelectItem>
                          <SelectItem value="avaliação">Avaliação</SelectItem>
                          <SelectItem value="consulta">Consulta</SelectItem>
                        </SelectContent>
                      </Select>
                    </FormControl>
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
                name="estado"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Estado</FormLabel>
                    <FormControl>
                      <Select 
                        onValueChange={field.onChange} 
                        value={field.value}
                      >
                        <SelectTrigger className="h-10">
                          <SelectValue placeholder="Selecione o estado" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="pendente">Pendente</SelectItem>
                          <SelectItem value="confirmado">Confirmado</SelectItem>
                          <SelectItem value="cancelado">Cancelado</SelectItem>
                          <SelectItem value="realizado">Realizado</SelectItem>
                        </SelectContent>
                      </Select>
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
                      <Textarea {...field} placeholder="Adicione observações sobre o agendamento" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <DialogFooter className={`flex ${isMobile ? 'flex-col space-y-2' : 'justify-between'}`}>
                {selectedAppointment && (
                  <Button 
                    type="button" 
                    variant="destructive" 
                    onClick={handleDeleteAppointment}
                    className="w-full sm:w-auto"
                  >
                    Eliminar
                  </Button>
                )}
                <div className={`flex ${isMobile ? 'flex-col space-y-2' : 'space-x-2'}`}>
                  <DialogClose asChild>
                    <Button type="button" variant="outline" className="w-full sm:w-auto">Cancelar</Button>
                  </DialogClose>
                  <Button type="submit" className="bg-[#3f9094] hover:bg-[#265255] w-full sm:w-auto">
                    {selectedAppointment ? 'Atualizar' : 'Adicionar'}
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
