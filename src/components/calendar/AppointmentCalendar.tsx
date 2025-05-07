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
import useAppointments from '@/hooks/useAppointments';
import useClients from '@/hooks/useClients';
import { Database } from '@/integrations/supabase/types';

// Importações do FullCalendar
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction';

type AppointmentType = 'sessão' | 'avaliação' | 'consulta';
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
}

interface AppointmentData {
  titulo: string;
  data: string;
  hora: string;
  id_cliente: number;
  tipo: string;
  notas: string;
  estado: string;
}

const AppointmentCalendar = () => {
  const calendarRef = useRef<FullCalendar>(null);
  const { appointments, isLoading: isLoadingAppointments, addAppointment, updateAppointment, deleteAppointment } = useAppointments();
  const { clients, isLoading: isLoadingClients } = useClients();
  
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null);
  const [currentView, setCurrentView] = useState<CalendarView>('dayGridMonth');
  const isMobile = useIsMobile();

  const form = useForm<AppointmentFormValues>({
    defaultValues: {
      titulo: '',
      data: '',
      hora: '',
      id_cliente: 0,
      tipo: 'sessão',
      notas: '',
      estado: 'agendado'
    },
  });

  const handleDateSelect = (info: any) => {
    const selectedDate = info.start;
    setSelectedDate(selectedDate);
  };

  const handleEventClick = (info: any) => {
    const appointmentId = parseInt(info.event.id);
    const appointment = appointments.find(app => app.id === appointmentId);
    
    if (appointment) {
      setSelectedAppointment(appointment);
      const [datePart, timePart] = appointment.data.split('T');
      
      form.reset({
        titulo: appointment.titulo,
        data: datePart,
        hora: timePart ? timePart.substring(0, 5) : '09:00',
        id_cliente: appointment.id_cliente,
        tipo: appointment.tipo as AppointmentType,
        notas: appointment.notas || '',
        estado: appointment.estado
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
      const appointmentData: AppointmentData = {
        titulo: data.titulo,
        data: `${data.data}T${data.hora}:00`,
        hora: data.hora,
        id_cliente: data.id_cliente,
        tipo: data.tipo,
        notas: data.notas,
        estado: data.estado
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
    return appointments.filter(appointment => {
      const appointmentDate = parseISO(appointment.data);
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
    const appointmentType = appointment.tipo as AppointmentType;
    return {
      id: appointment.id.toString(),
      title: appointment.titulo,
      start: appointment.data,
      extendedProps: {
        clientName: appointment.clientes.nome,
        clientId: appointment.id_cliente.toString(),
        type: appointmentType,
        notes: appointment.notas,
        estado: appointment.estado
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
      
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
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

        {/* Eventos do dia */}
        <Card className={`glassmorphism ${isMobile ? 'mt-2' : ''}`}>
          <CardContent className="p-3 sm:p-4">
            <h3 className="text-xl font-medium mb-3 text-[#265255]">Eventos do dia</h3>
            {selectedDate ? (
              <div className="space-y-2 sm:space-y-3">
                {getDayAppointments(selectedDate).map(appointment => (
                  <div 
                    key={appointment.id} 
                    className={`p-3 sm:p-4 rounded-lg cursor-pointer transition-all hover:translate-y-[-2px] ${getAppointmentTypeColor(appointment.tipo as AppointmentType)} ${getAppointmentTypeBoxShadow(appointment.tipo as AppointmentType)} backdrop-blur-sm border border-white/20`}
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
                        estado: appointment.estado
                      });
                      
                      setIsDialogOpen(true);
                    }}
                  >
                    <div className="flex justify-between items-center">
                      <div>
                        <h4 className="font-medium line-clamp-1">{appointment.titulo}</h4>
                        <p className="text-sm line-clamp-1">{appointment.clientes.nome}</p>
                        <p className="text-xs font-semibold">ID: {appointment.id_cliente}</p>
                      </div>
                      <div>
                        <span className="text-xs px-2 py-1 rounded-full bg-white/30 backdrop-blur-sm">
                          {appointment.data.split('T')[1] ? appointment.data.split('T')[1].substring(0, 5) : '09:00'}
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
                        <Input type="time" {...field} defaultValue="09:00" required className="mobile-time-input" />
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
