
import React, { useState } from 'react';
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

type AppointmentType = 'sessão' | 'avaliação' | 'consulta';

interface Appointment {
  id: string;
  title: string;
  date: string;
  clientName: string;
  type: AppointmentType;
  notes?: string;
}

interface AppointmentFormValues {
  title: string;
  date: string;
  time: string;
  clientName: string;
  type: AppointmentType;
  notes: string;
}

const defaultAppointments: Appointment[] = [
  {
    id: '1',
    title: 'Sessão de Neurofeedback',
    date: format(addDays(new Date(), 1), 'yyyy-MM-dd'),
    clientName: 'Maria Silva',
    type: 'sessão',
    notes: 'Segunda sessão de follow-up.',
  },
  {
    id: '2',
    title: 'Avaliação Inicial',
    date: format(addDays(new Date(), 3), 'yyyy-MM-dd'),
    clientName: 'Pedro Carvalho',
    type: 'avaliação',
    notes: 'Primeiro contacto, avaliação inicial.',
  },
  {
    id: '3',
    title: 'Consulta de Acompanhamento',
    date: format(addDays(new Date(), 5), 'yyyy-MM-dd'),
    clientName: 'Ana Ferreira',
    type: 'consulta',
    notes: 'Discussão de resultados após 5 sessões.',
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

  const form = useForm<AppointmentFormValues>({
    defaultValues: {
      title: '',
      date: '',
      time: '',
      clientName: '',
      type: 'sessão',
      notes: '',
    },
  });

  const onSubmit = (data: AppointmentFormValues) => {
    const combinedDateTime = `${data.date}T${data.time}`;
    
    if (selectedAppointment) {
      // Editar agendamento existente
      const updatedAppointments = appointments.map(app => 
        app.id === selectedAppointment.id ? 
        { ...app, title: data.title, clientName: data.clientName, type: data.type, notes: data.notes, date: combinedDateTime } : 
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
        type: data.type,
        notes: data.notes,
        date: combinedDateTime,
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
    // Se não houver um agendamento selecionado, abra para adicionar novo
    if (!selectedAppointment) {
      setIsDialogOpen(true);
    }
  };

  const handleAppointmentSelect = (appointment: Appointment) => {
    setSelectedAppointment(appointment);
    const [datePart, timePart] = appointment.date.split('T');
    
    form.reset({
      title: appointment.title,
      date: datePart,
      time: timePart || '09:00',
      clientName: appointment.clientName,
      type: appointment.type,
      notes: appointment.notes || '',
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
      case 'sessão':
        return 'bg-[#c5cfce] text-[#265255]';
      case 'avaliação':
        return 'bg-[#3f9094]/20 text-[#265255]';
      case 'consulta':
        return 'bg-[#3f9094]/40 text-[#265255]';
      default:
        return 'bg-gray-200 text-gray-800';
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-[#265255]">Calendário</h2>
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
      
      <div className="card-glass p-4">
        <Calendar 
          mode="single"
          className="rounded-md border w-full"
          selected={selectedDate}
          onSelect={handleDateSelect}
          locale={pt}
          month={currentMonth}
          onMonthChange={setCurrentMonth}
          modifiers={{
            hasAppointment: (date) => getDayAppointments(date).length > 0
          }}
          classNames={{
            day_selected: "bg-[#3f9094] text-primary-foreground hover:bg-[#265255] hover:text-primary-foreground focus:bg-primary focus:text-primary-foreground",
          }}
        />
      </div>

      <div className="mt-6">
        <h3 className="text-lg font-medium mb-3 text-[#265255]">Eventos do dia</h3>
        {selectedDate ? (
          <div className="space-y-2">
            {getDayAppointments(selectedDate).map((appointment) => (
              <div 
                key={appointment.id} 
                className="p-3 rounded-lg bg-white shadow-sm border border-gray-100 cursor-pointer"
                onClick={() => handleAppointmentSelect(appointment)}
              >
                <div className="flex justify-between items-center">
                  <div>
                    <h4 className="font-medium">{appointment.title}</h4>
                    <p className="text-sm text-gray-600">{appointment.clientName}</p>
                  </div>
                  <div>
                    <span className={`text-xs px-2 py-1 rounded-full ${getAppointmentTypeColor(appointment.type)}`}>
                      {appointment.type}
                    </span>
                  </div>
                </div>
              </div>
            ))}
            {getDayAppointments(selectedDate).length === 0 && (
              <p className="text-center py-4 text-gray-500">Sem agendamentos para este dia</p>
            )}
          </div>
        ) : (
          <p className="text-center py-4 text-gray-500">Selecione uma data para ver os agendamentos</p>
        )}
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
              
              <FormField
                control={form.control}
                name="clientName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nome do Cliente</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="Nome do cliente" required />
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
                        <SelectItem value="sessão">Sessão</SelectItem>
                        <SelectItem value="avaliação">Avaliação</SelectItem>
                        <SelectItem value="consulta">Consulta</SelectItem>
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
