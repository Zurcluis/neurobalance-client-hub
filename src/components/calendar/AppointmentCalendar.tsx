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
import { addDays, format, isSameDay, parseISO } from 'date-fns';
import { pt } from 'date-fns/locale';
import { Card, CardContent } from '../ui/card';
import { ClientDetailData } from '@/types/client';
import { useIsMobile } from '@/hooks/use-mobile';
import { Plus } from 'lucide-react';

// Importações do FullCalendar
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction';

type AppointmentType = 'sessão' | 'avaliação' | 'consulta';
type CalendarView = 'dayGridMonth' | 'timeGridWeek' | 'timeGridDay';

interface Appointment {
  id: string;
  title: string;
  date: string;
  clientName: string;
  clientId: string;
  type: AppointmentType;
  notes?: string;
  confirmed?: boolean;
}

interface AppointmentFormValues {
  title: string;
  date: string;
  time: string;
  clientName: string;
  clientId: string;
  type: AppointmentType;
  notes: string;
  confirmed?: boolean;
}

const defaultAppointments: Appointment[] = [
  {
    id: '1',
    title: 'Sessão de Neurofeedback',
    date: format(addDays(new Date(), 1), 'yyyy-MM-dd') + 'T10:00:00',
    clientName: 'Maria Silva',
    clientId: 'CL001',
    type: 'sessão',
    notes: 'Segunda sessão de follow-up.',
    confirmed: true
  },
  {
    id: '2',
    title: 'Avaliação Inicial',
    date: format(addDays(new Date(), 3), 'yyyy-MM-dd') + 'T09:00:00',
    clientName: 'Pedro Carvalho',
    clientId: 'CL002',
    type: 'avaliação',
    notes: 'Primeiro contacto, avaliação inicial.',
    confirmed: true
  },
  {
    id: '3',
    title: 'Consulta de Acompanhamento',
    date: format(addDays(new Date(), 5), 'yyyy-MM-dd') + 'T14:30:00',
    clientName: 'Ana Ferreira',
    clientId: 'CL003',
    type: 'consulta',
    notes: 'Discussão de resultados após 5 sessões.',
    confirmed: false
  },
];

const AppointmentCalendar = () => {
  const calendarRef = useRef<FullCalendar>(null);
  const [appointments, setAppointments] = useState<Appointment[]>(() => {
    const savedAppointments = localStorage.getItem('appointments');
    return savedAppointments ? JSON.parse(savedAppointments) : defaultAppointments;
  });
  
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null);
  const [currentView, setCurrentView] = useState<CalendarView>('dayGridMonth');
  const [clients, setClients] = useState<ClientDetailData[]>([]);
  const isMobile = useIsMobile();

  useEffect(() => {
    // Load clients from localStorage
    const loadedClients = localStorage.getItem('clients');
    if (loadedClients) {
      setClients(JSON.parse(loadedClients));
    }
  }, []);

  const form = useForm<AppointmentFormValues>({
    defaultValues: {
      title: '',
      date: '',
      time: '',
      clientName: '',
      clientId: '',
      type: 'sessão',
      notes: '',
      confirmed: false
    },
  });

  const onSubmit = (data: AppointmentFormValues) => {
    const combinedDateTime = `${data.date}T${data.time}`;
    
    // Se um cliente for selecionado no dropdown, atualiza o nome do cliente
    if (data.clientId) {
      const selectedClient = clients.find(client => client.id === data.clientId);
      if (selectedClient) {
        data.clientName = selectedClient.name;
      }
    }
    
    if (selectedAppointment) {
      // Editar agendamento existente
      const updatedAppointments = appointments.map(app => 
        app.id === selectedAppointment.id ? 
        { ...app, title: data.title, clientName: data.clientName, clientId: data.clientId, type: data.type, notes: data.notes, date: combinedDateTime, confirmed: data.confirmed } : 
        app
      );
      setAppointments(updatedAppointments);
      localStorage.setItem('appointments', JSON.stringify(updatedAppointments));
      toast.success('Agendamento atualizado com sucesso');
    } else {
      // Adicionar novo agendamento
      const newAppointment: Appointment = {
        id: Date.now().toString(),
        title: data.title,
        clientName: data.clientName,
        clientId: data.clientId || `CL${Math.floor(1000 + Math.random() * 9000)}`,
        type: data.type,
        notes: data.notes,
        date: combinedDateTime,
        confirmed: data.confirmed
      };
      
      const newAppointments = [...appointments, newAppointment];
      setAppointments(newAppointments);
      localStorage.setItem('appointments', JSON.stringify(newAppointments));
      toast.success('Agendamento adicionado com sucesso');
    }
    
    setIsDialogOpen(false);
    form.reset();
    setSelectedAppointment(null);
  };

  const handleDateSelect = (info: any) => {
    const selectedDate = info.start;
    
    setSelectedDate(selectedDate);
    form.setValue('date', format(selectedDate, 'yyyy-MM-dd'));
    
    // Determina hora com base na visualização
    let defaultTime = '09:00';
    if (currentView === 'timeGridWeek' || currentView === 'timeGridDay') {
      defaultTime = format(selectedDate, 'HH:mm');
    }
    
    // Sempre abre o diálogo ao selecionar uma data para adicionar um novo agendamento
    setSelectedAppointment(null);
    form.reset({
      title: '',
      date: format(selectedDate, 'yyyy-MM-dd'),
      time: defaultTime,
      clientName: '',
      clientId: '',
      type: 'sessão',
      notes: '',
      confirmed: false
    });
    setIsDialogOpen(true);
  };

  const handleEventClick = (info: any) => {
    const appointmentId = info.event.id;
    const appointment = appointments.find(app => app.id === appointmentId);
    
    if (appointment) {
    setSelectedAppointment(appointment);
    const [datePart, timePart] = appointment.date.split('T');
    
    form.reset({
      title: appointment.title,
      date: datePart,
        time: timePart ? timePart.substring(0, 5) : '09:00',
      clientName: appointment.clientName,
      clientId: appointment.clientId || '',
      type: appointment.type,
      notes: appointment.notes || '',
      confirmed: appointment.confirmed || false
    });
    
    setIsDialogOpen(true);
    }
  };

  const handleDeleteAppointment = () => {
    if (selectedAppointment) {
      const updatedAppointments = appointments.filter(app => app.id !== selectedAppointment.id);
      setAppointments(updatedAppointments);
      localStorage.setItem('appointments', JSON.stringify(updatedAppointments));
      toast.success('Agendamento removido com sucesso');
      setIsDialogOpen(false);
      setSelectedAppointment(null);
      form.reset();
    }
  };

  const getDayAppointments = (day: Date) => {
    return appointments.filter(appointment => {
      const appointmentDate = parseISO(appointment.date);
      return isSameDay(appointmentDate, day);
    });
  };

  const getAppointmentTypeColor = (type: AppointmentType) => {
    switch (type) {
      case 'avaliação':
        return 'bg-[#9e50b3]/20 text-[#9e50b3]';
      case 'sessão':
        return 'bg-[#1088c4]/20 text-[#1088c4]';
      case 'consulta':
        return 'bg-[#ecc249]/20 text-[#ecc249]';
      default:
        return 'bg-gray-200 text-[#265255]';
    }
  };

  const getAppointmentTypeBoxShadow = (type: AppointmentType) => {
    switch (type) {
      case 'avaliação':
        return 'shadow-[0_0_15px_rgba(158,80,179,0.3)]';
      case 'sessão':
        return 'shadow-[0_0_15px_rgba(16,136,196,0.3)]';
      case 'consulta':
        return 'shadow-[0_0_15px_rgba(236,194,73,0.3)]';
      default:
        return 'shadow-md';
    }
  };

  const getAppointmentBackgroundColor = (type: AppointmentType) => {
    switch (type) {
      case 'avaliação':
        return 'rgba(158,80,179,0.2)';
      case 'sessão':
        return 'rgba(16,136,196,0.2)';
      case 'consulta':
        return 'rgba(236,194,73,0.2)';
      default:
        return 'rgba(128,128,128,0.2)';
    }
  };
  
  const getAppointmentBorderColor = (type: AppointmentType) => {
    switch (type) {
      case 'avaliação':
        return '#9e50b3';
      case 'sessão':
        return '#1088c4';
      case 'consulta':
        return '#ecc249';
      default:
        return '#265255';
    }
  };
  
  const getAppointmentTextColor = (type: AppointmentType) => {
    switch (type) {
      case 'avaliação':
        return '#9e50b3';
      case 'sessão':
        return '#1088c4';
      case 'consulta':
        return '#ecc249';
      default:
        return '#265255';
    }
  };

  // Converter appointments para formato de eventos do FullCalendar
  const calendarEvents = appointments.map(appointment => {
    const appointmentType = appointment.type;
    return {
      id: appointment.id,
      title: appointment.title,
      start: appointment.date,
      extendedProps: {
        clientName: appointment.clientName,
        clientId: appointment.clientId,
        type: appointmentType,
        notes: appointment.notes,
        confirmed: appointment.confirmed
      },
      backgroundColor: getAppointmentBackgroundColor(appointmentType),
      borderColor: getAppointmentBorderColor(appointmentType),
      textColor: getAppointmentTextColor(appointmentType),
      classNames: ['rounded-lg', 'py-1', 'px-2', 'border', 'border-white/20', 'backdrop-blur-sm'],
    };
  });

  // Opções para personalizar o FullCalendar
  const calendarOptions: any = {
    plugins: [dayGridPlugin, timeGridPlugin, interactionPlugin],
    initialView: isMobile ? 'timeGridDay' : currentView,
    headerToolbar: {
      left: isMobile ? 'prev,next' : 'prev,next today',
      center: 'title',
      right: isMobile ? 'dayGridMonth,timeGridDay' : 'dayGridMonth,timeGridWeek,timeGridDay'
    },
    titleFormat: { 
      month: 'long', 
      year: 'numeric' 
    },
    buttonText: {
      today: isMobile ? 'Hoje' : 'Hoje',
      month: isMobile ? 'Mês' : 'Mês',
      week: 'Semana',
      day: isMobile ? 'Dia' : 'Dia'
    },
    dayHeaderFormat: { weekday: isMobile ? 'narrow' : 'short' },
    locale: 'pt-br',
    events: calendarEvents,
    eventClick: handleEventClick,
    selectable: true,
    select: handleDateSelect,
    eventTimeFormat: {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false
    },
    slotLabelFormat: {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false
    },
    allDaySlot: false,
    height: 'auto',
    aspectRatio: isMobile ? 1.2 : 1.8,
    contentHeight: isMobile ? 500 : 800,
    slotMinTime: '08:00',
    slotMaxTime: '20:00',
    slotDuration: isMobile ? '01:00:00' : '00:30:00',
    slotLabelInterval: isMobile ? '01:00:00' : undefined,
    nowIndicator: true,
    eventOverlap: true,
    stickyHeaderDates: true,
    dayMaxEventRows: isMobile ? 3 : 6,
    moreLinkClick: 'day',
    expandRows: false,
    fixedWeekCount: false,
    handleWindowResize: true,
    eventMaxStack: isMobile ? 3 : 6,
    views: {
      dayGridMonth: {
        dayMaxEventRows: isMobile ? 2 : 6,
        eventTimeFormat: {
          hour: 'numeric',
          minute: '2-digit',
          omitZeroMinute: true
        }
      },
      timeGridWeek: {
        slotDuration: isMobile ? '01:00:00' : '00:30:00',
        slotLabelInterval: isMobile ? '01:00:00' : undefined,
      },
      timeGridDay: {
        slotDuration: '00:30:00',
        nowIndicator: true,
        dayHeaderFormat: { weekday: 'long', month: 'long', day: 'numeric' }
      }
    },
    datesSet: (dateInfo: any) => {
      if (calendarRef.current) {
        const view = calendarRef.current.getApi().view;
        setCurrentView(view.type as CalendarView);
      }
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 mb-4 sm:mb-8">
        <h2 className={`text-2xl sm:text-4xl font-bold text-[#265255] gradient-heading ${isMobile ? 'mb-2' : ''}`}>
          Calendário
        </h2>
        <Button 
          className="bg-[#3f9094] hover:bg-[#265255] w-full sm:w-auto h-10 whitespace-nowrap" 
          onClick={() => {
            setSelectedAppointment(null);
            form.reset();
            setIsDialogOpen(true);
          }}
        >
          <Plus className="h-4 w-4 mr-2" />
          Novo Agendamento
        </Button>
      </div>
      
      <div className={`grid grid-cols-1 gap-6 ${isMobile ? '' : 'lg:grid-cols-4'}`}>
        <Card className={`glassmorphism ${isMobile ? '' : 'lg:col-span-3'} p-2 sm:p-4 min-h-[500px] sm:min-h-[800px]`}>
          <CardContent className="p-0 sm:p-1 h-full">
            <div className="calendar-container">
              <FullCalendar
                ref={calendarRef}
                {...calendarOptions}
              />
                    </div>
          </CardContent>
        </Card>

        {/* Eventos do dia (Desktop e mobile) */}
        <Card className={`glassmorphism ${isMobile ? 'mt-2' : ''}`}>
          <CardContent className="p-3 sm:p-4">
            <h3 className="text-xl font-medium mb-3 text-[#265255]">Eventos do dia</h3>
            {selectedDate ? (
              <div className="space-y-2 sm:space-y-3">
                {getDayAppointments(selectedDate).map((appointment) => (
                  <div 
                    key={appointment.id} 
                    className={`p-3 sm:p-4 rounded-lg cursor-pointer transition-all hover:translate-y-[-2px] ${getAppointmentTypeColor(appointment.type)} ${getAppointmentTypeBoxShadow(appointment.type)} backdrop-blur-sm border border-white/20`}
                    onClick={() => {
                      setSelectedAppointment(appointment);
                      const [datePart, timePart] = appointment.date.split('T');
                      
                      form.reset({
                        title: appointment.title,
                        date: datePart,
                        time: timePart ? timePart.substring(0, 5) : '09:00',
                        clientName: appointment.clientName,
                        clientId: appointment.clientId || '',
                        type: appointment.type,
                        notes: appointment.notes || '',
                        confirmed: appointment.confirmed || false
                      });
                      
                      setIsDialogOpen(true);
                    }}
                  >
                    <div className="flex justify-between items-center">
                      <div>
                        <h4 className="font-medium line-clamp-1">{appointment.title}</h4>
                        <p className="text-sm line-clamp-1">{appointment.clientName}</p>
                        <p className="text-xs font-semibold">ID: {appointment.clientId}</p>
                      </div>
                      <div>
                        <span className="text-xs px-2 py-1 rounded-full bg-white/30 backdrop-blur-sm">
                          {appointment.date.split('T')[1] ? appointment.date.split('T')[1].substring(0, 5) : '09:00'}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
                {getDayAppointments(selectedDate).length === 0 && (
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
                  <div className="w-3 h-3 sm:w-4 sm:h-4 rounded-full bg-[#9e50b3]/20"></div>
                  <span className="text-xs sm:text-sm text-[#265255]">Avaliação</span>
              </div>
              <div className="flex items-center space-x-2">
                  <div className="w-3 h-3 sm:w-4 sm:h-4 rounded-full bg-[#1088c4]/20"></div>
                  <span className="text-xs sm:text-sm text-[#265255]">Neurofeedback</span>
              </div>
              <div className="flex items-center space-x-2">
                  <div className="w-3 h-3 sm:w-4 sm:h-4 rounded-full bg-[#ecc249]/20"></div>
                  <span className="text-xs sm:text-sm text-[#265255]">Discussão</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {selectedAppointment ? 'Editar Agendamento' : 'Novo Agendamento'}
            </DialogTitle>
            <DialogDescription>
              {selectedAppointment 
                ? 'Faça alterações no agendamento existente.' 
                : 'Preencha os detalhes para criar um novo agendamento.'}
            </DialogDescription>
          </DialogHeader>
          
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="title"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Título</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="Título do agendamento" required />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="date"
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
                  name="time"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Hora</FormLabel>
                      <FormControl>
                        <Input type="time" {...field} defaultValue="09:00" required className="mobile-time-input" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              
              <div className="grid grid-cols-1 gap-4">
                <FormField
                  control={form.control}
                  name="clientId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Cliente</FormLabel>
                      <FormControl>
                        <Select 
                          onValueChange={field.onChange} 
                          value={field.value}
                        >
                          <SelectTrigger className="h-10">
                            <SelectValue placeholder="Selecione um cliente" />
                          </SelectTrigger>
                          <SelectContent>
                            {clients.map((client) => (
                              <SelectItem key={client.id} value={client.id}>
                                {client.name} ({client.id})
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              
              <FormField
                control={form.control}
                name="clientName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nome do Cliente (se não estiver na lista)</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="Nome do cliente" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="type"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Tipo</FormLabel>
                    <Select 
                      onValueChange={field.onChange} 
                      defaultValue={field.value}
                      value={field.value}
                    >
                      <FormControl>
                        <SelectTrigger className="h-10">
                          <SelectValue placeholder="Selecione o tipo de agendamento" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="sessão">Neurofeedback</SelectItem>
                        <SelectItem value="avaliação">Avaliação Inicial</SelectItem>
                        <SelectItem value="consulta">Discussão de resultados</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="confirmed"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Estado</FormLabel>
                    <Select 
                      onValueChange={(value) => field.onChange(value === 'true')} 
                      defaultValue={String(field.value)}
                      value={String(field.value)}
                    >
                      <FormControl>
                        <SelectTrigger className="h-10">
                          <SelectValue placeholder="Selecione o estado" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="true">Confirmado</SelectItem>
                        <SelectItem value="false">Pendente</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="notes"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Notas</FormLabel>
                    <FormControl>
                      <Textarea 
                        {...field} 
                        placeholder="Notas adicionais sobre o agendamento" 
                        className="min-h-[80px] sm:min-h-[100px]"
                      />
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
