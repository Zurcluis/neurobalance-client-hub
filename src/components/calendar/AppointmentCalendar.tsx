
import React, { useState, useEffect } from 'react';
import { Calendar } from '../ui/calendar';
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

type AppointmentType = 'sessão' | 'avaliação' | 'consulta';

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
    date: format(addDays(new Date(), 1), 'yyyy-MM-dd'),
    clientName: 'Maria Silva',
    clientId: 'CL001',
    type: 'sessão',
    notes: 'Segunda sessão de follow-up.',
    confirmed: true
  },
  {
    id: '2',
    title: 'Avaliação Inicial',
    date: format(addDays(new Date(), 3), 'yyyy-MM-dd'),
    clientName: 'Pedro Carvalho',
    clientId: 'CL002',
    type: 'avaliação',
    notes: 'Primeiro contacto, avaliação inicial.',
    confirmed: true
  },
  {
    id: '3',
    title: 'Consulta de Acompanhamento',
    date: format(addDays(new Date(), 5), 'yyyy-MM-dd'),
    clientName: 'Ana Ferreira',
    clientId: 'CL003',
    type: 'consulta',
    notes: 'Discussão de resultados após 5 sessões.',
    confirmed: false
  },
];

const AppointmentCalendar = () => {
  const [appointments, setAppointments] = useState<Appointment[]>(() => {
    const savedAppointments = localStorage.getItem('appointments');
    return savedAppointments ? JSON.parse(savedAppointments) : defaultAppointments;
  });
  
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null);
  const [currentMonth, setCurrentMonth] = useState<Date>(new Date());
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
    
    // If client was selected from dropdown, update client name
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

  const handleDateSelect = (date: Date | undefined) => {
    if (!date) return;
    
    setSelectedDate(date);
    form.setValue('date', format(date, 'yyyy-MM-dd'));
    // Always open dialog when selecting a date to add a new appointment
    // This allows scheduling multiple events on the same day
    setSelectedAppointment(null);
    form.reset({
      title: '',
      date: format(date, 'yyyy-MM-dd'),
      time: '09:00',
      clientName: '',
      clientId: '',
      type: 'sessão',
      notes: '',
      confirmed: false
    });
    setIsDialogOpen(true);
  };

  const handleAppointmentSelect = (appointment: Appointment) => {
    setSelectedAppointment(appointment);
    const [datePart, timePart] = appointment.date.split('T');
    
    form.reset({
      title: appointment.title,
      date: datePart,
      time: timePart || '09:00',
      clientName: appointment.clientName,
      clientId: appointment.clientId || '',
      type: appointment.type,
      notes: appointment.notes || '',
      confirmed: appointment.confirmed || false
    });
    
    setIsDialogOpen(true);
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

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center mb-8">
        <h2 className="text-4xl font-bold text-[#265255] gradient-heading">Calendário</h2>
        <Button 
          className="bg-[#3f9094] hover:bg-[#265255]" 
          onClick={() => {
            setSelectedAppointment(null);
            form.reset();
            setIsDialogOpen(true);
          }}
        >
          Novo Agendamento
        </Button>
      </div>
      
      <div className={`grid grid-cols-1 gap-6 ${isMobile ? '' : 'lg:grid-cols-4'}`}>
        <Card className={`glassmorphism ${isMobile ? '' : 'lg:col-span-3'} p-4 min-h-[800px]`}>
          <CardContent className="p-0 h-full">
            <Calendar 
              mode="single"
              className="rounded-xl w-full h-full"
              selected={selectedDate}
              onSelect={handleDateSelect}
              locale={pt}
              month={currentMonth}
              onMonthChange={setCurrentMonth}
              modifiers={{
                hasAppointment: (date) => getDayAppointments(date).length > 0
              }}
              modifiersStyles={{
                hasAppointment: {
                  backgroundColor: 'rgba(63, 144, 148, 0.1)',
                  border: '1px solid rgba(63, 144, 148, 0.3)',
                  borderRadius: '0.5rem',
                }
              }}
              classNames={{
                day_selected: "bg-[#3f9094] text-white hover:bg-[#265255] hover:text-white focus:bg-[#3f9094] focus:text-white",
                day_today: "bg-[#c5cfce]/30 text-[#265255] font-bold",
                day: "h-16 w-16 lg:h-24 lg:w-24 p-0 font-normal aria-selected:opacity-100 rounded-lg relative",
                months: "flex flex-col sm:flex-row space-y-4 sm:space-x-4 sm:space-y-0",
                month: "space-y-8 w-full",
                caption: "flex justify-center pt-2 pb-4 relative items-center text-[#265255]",
                caption_label: "text-xl font-medium",
                nav: "space-x-2 flex items-center",
                nav_button: "h-9 w-9 bg-transparent p-0 opacity-70 hover:opacity-100 border border-[#3f9094]/30 rounded-full hover:bg-[#3f9094]/10",
                nav_button_previous: "absolute left-1",
                nav_button_next: "absolute right-1",
                table: "w-full border-collapse space-y-2",
                head_row: "flex w-full mb-2",
                head_cell: "text-[#265255] font-semibold rounded-md w-16 lg:w-24 text-base",
                row: "flex w-full mt-4",
                cell: "h-16 w-16 lg:h-24 lg:w-24 text-center p-0 relative [&:has([aria-selected])]:bg-[#3f9094]/10 first:[&:has([aria-selected])]:rounded-l-lg last:[&:has([aria-selected])]:rounded-r-lg focus-within:relative focus-within:z-20",
              }}
              components={{
                DayContent: (props) => {
                  const dayAppointments = getDayAppointments(props.date);
                  return (
                    <div className="h-full w-full flex flex-col">
                      <div className="text-center py-1">{props.date.getDate()}</div>
                      <div className="flex-1 overflow-hidden">
                        {dayAppointments.slice(0, 3).map((app, idx) => (
                          <div 
                            key={`${app.id}-${idx}`}
                            className={`text-xs p-1 my-0.5 rounded-md truncate cursor-pointer ${getAppointmentTypeColor(app.type)} ${getAppointmentTypeBoxShadow(app.type)}`}
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              handleAppointmentSelect(app);
                            }}
                          >
                            <div className="truncate font-medium">{app.title}</div>
                            <div className="truncate text-[10px]">{app.clientId}</div>
                          </div>
                        ))}
                        {dayAppointments.length > 3 && (
                          <div className="text-xs text-center text-[#265255]">
                            +{dayAppointments.length - 3} mais
                          </div>
                        )}
                      </div>
                    </div>
                  );
                }
              }}
            />
          </CardContent>
        </Card>

        <Card className="glassmorphism">
          <CardContent className="p-4">
            <h3 className="text-2xl font-medium mb-4 text-[#265255]">Eventos do dia</h3>
            {selectedDate ? (
              <div className="space-y-3">
                {getDayAppointments(selectedDate).map((appointment) => (
                  <div 
                    key={appointment.id} 
                    className={`p-4 rounded-lg cursor-pointer transition-all hover:translate-y-[-2px] ${getAppointmentTypeColor(appointment.type)} ${getAppointmentTypeBoxShadow(appointment.type)} backdrop-blur-sm border border-white/20`}
                    onClick={() => handleAppointmentSelect(appointment)}
                  >
                    <div className="flex justify-between items-center">
                      <div>
                        <h4 className="font-medium">{appointment.title}</h4>
                        <p className="text-sm">{appointment.clientName}</p>
                        <p className="text-xs font-semibold">ID: {appointment.clientId}</p>
                      </div>
                      <div>
                        <span className="text-xs px-3 py-1.5 rounded-full bg-white/30 backdrop-blur-sm">
                          {appointment.date.split('T')[1] || '09:00'}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
                {getDayAppointments(selectedDate).length === 0 && (
                  <p className="text-center py-8 text-gray-500">Sem agendamentos para este dia</p>
                )}
              </div>
            ) : (
              <p className="text-center py-8 text-gray-500">Selecione uma data para ver os agendamentos</p>
            )}
            
            <div className="mt-8 space-y-2">
              <h4 className="font-medium text-[#265255]">Tipos de Eventos</h4>
              <div className="flex items-center space-x-2">
                <div className="w-4 h-4 rounded-full bg-[#9e50b3]/20"></div>
                <span className="text-sm text-[#265255]">Avaliação Inicial</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-4 h-4 rounded-full bg-[#1088c4]/20"></div>
                <span className="text-sm text-[#265255]">Neurofeedback</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-4 h-4 rounded-full bg-[#ecc249]/20"></div>
                <span className="text-sm text-[#265255]">Discussão de resultados</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
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
              
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="date"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Data</FormLabel>
                      <FormControl>
                        <Input type="date" {...field} required />
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
                        <Input type="time" {...field} defaultValue="09:00" required />
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
                          <SelectTrigger>
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
                        <SelectTrigger>
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
                        <SelectTrigger>
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
                        className="min-h-[100px]"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <DialogFooter className="flex justify-between">
                {selectedAppointment && (
                  <Button 
                    type="button" 
                    variant="destructive" 
                    onClick={handleDeleteAppointment}
                  >
                    Eliminar
                  </Button>
                )}
                <div className="flex space-x-2">
                  <DialogClose asChild>
                    <Button type="button" variant="outline">Cancelar</Button>
                  </DialogClose>
                  <Button type="submit" className="bg-[#3f9094] hover:bg-[#265255]">
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
