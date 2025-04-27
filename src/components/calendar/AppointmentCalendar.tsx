
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

  // Custom Day Renderer for the Calendar
  const renderDay = (day: Date, selectedDate: Date | undefined, props: React.HTMLAttributes<HTMLDivElement>) => {
    const dayAppointments = getDayAppointments(day);
    
    return (
      <div
        {...props}
        className={`relative h-20 w-full border p-1 ${props.className}`}
        onClick={() => handleDateSelect(day)}
      >
        <span className="absolute top-1 left-1 text-sm font-medium">
          {format(day, 'd')}
        </span>
        <div className="mt-5 space-y-1 overflow-y-auto max-h-14">
          {dayAppointments.slice(0, 2).map((appointment) => (
            <button
              key={appointment.id}
              onClick={(e) => {
                e.stopPropagation();
                handleAppointmentSelect(appointment);
              }}
              className={`w-full text-left px-1 py-0.5 text-xs rounded truncate ${getAppointmentTypeColor(appointment.type)}`}
            >
              {appointment.title}
            </button>
          ))}
          {dayAppointments.length > 2 && (
            <div className="text-xs text-gray-500">
              +{dayAppointments.length - 2} mais
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold gradient-heading">Calendário</h1>
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
      
      <div className="card-glass">
        <Calendar 
          mode="single"
          className="rounded-md border p-3"
          selected={selectedDate}
          onSelect={handleDateSelect}
          locale={pt}
          month={currentMonth}
          onMonthChange={setCurrentMonth}
          modifiersStyles={{
            selected: { backgroundColor: "#3f9094" }
          }}
          modifiers={{
            hasAppointment: (date) => {
              return getDayAppointments(date).length > 0;
            }
          }}
          styles={{
            months: { display: "flex", flexDirection: "row" },
            month: { margin: "0 1rem" },
            caption: { display: "flex", justifyContent: "space-between", padding: "0 1rem", alignItems: "center" },
            caption_label: { fontSize: "1rem", fontWeight: "500", color: "#265255" },
            nav: { display: "flex", gap: "0.25rem" },
            nav_button: { cursor: "pointer", padding: "0.25rem", border: "none", backgroundColor: "transparent", color: "#3f9094" },
            nav_button_previous: {},
            nav_button_next: {},
            table: { width: "100%" },
            head_row: { display: "flex", margin: "0.5rem 0" },
            head_cell: { width: "2.5rem", textAlign: "center", color: "#3f9094", fontWeight: "500" },
            row: { display: "grid", gridTemplateColumns: "repeat(7, 1fr)", margin: "0.25rem 0" },
            cell: { 
              textAlign: "center", 
              padding: "0.25rem",
              position: "relative",
              height: "2.5rem",
              width: "2.5rem"
            },
            day: { 
              margin: 0,
              width: "100%",
              height: "100%",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              cursor: "pointer"
            },
            day_selected: { backgroundColor: "#3f9094", color: "white", borderRadius: "50%" },
            day_today: { fontWeight: "bold", border: "1px solid #3f9094", borderRadius: "50%" },
            day_outside: { opacity: 0.5 },
            day_disabled: { opacity: 0.5, cursor: "default" },
            day_hidden: { visibility: "hidden" }
          }}
        />
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

// Função utilitária para combinar classes do tailwind
function cn(...classes: (string | boolean | undefined)[]) {
  return classes.filter(Boolean).join(' ');
}
