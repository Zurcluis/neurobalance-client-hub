
import React, { useState } from 'react';
import { Calendar as CalendarComponent } from '@/components/ui/calendar';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { format } from 'date-fns';
import { CalendarPlus, Plus } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';

interface Appointment {
  id: string;
  clientId: string;
  clientName: string;
  date: Date;
  time: string;
  type: 'sessão' | 'avaliação' | 'consulta';
  notes?: string;
}

interface AddAppointmentFormData {
  clientId: string;
  clientName: string;
  time: string;
  type: 'sessão' | 'avaliação' | 'consulta';
  notes?: string;
}

// Sample appointments data
const sampleAppointments: Appointment[] = [
  {
    id: '1',
    clientId: '1',
    clientName: 'Maria Silva',
    date: new Date(2025, 3, 28),
    time: '10:00',
    type: 'session',
    notes: 'Regular neurofeedback session'
  },
  {
    id: '2',
    clientId: '2',
    clientName: 'João Santos',
    date: new Date(2025, 3, 28),
    time: '14:00',
    type: 'assessment',
    notes: 'Initial assessment'
  },
  {
    id: '3',
    clientId: '3',
    clientName: 'Ana Costa',
    date: new Date(2025, 3, 29),
    time: '11:00',
    type: 'consultation',
    notes: 'Follow-up consultation'
  }
];

const AppointmentCalendar = () => {
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
  const [appointments, setAppointments] = useState<Appointment[]>(sampleAppointments);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  
  // Filter appointments for the selected date
  const appointmentsForSelectedDate = selectedDate 
    ? appointments.filter(
        app => app.date.toDateString() === selectedDate.toDateString()
      ) 
    : [];
    
  // Get appropriate background color based on appointment type
  const getAppointmentColor = (type: string) => {
    switch(type) {
      case 'sessão':
        return 'bg-neuro-soft-purple';
      case 'avaliação':
        return 'bg-neuro-soft-pink';
      case 'consulta':
        return 'bg-neuro-soft-blue';
      default:
        return 'bg-neuro-soft-gray';
    }
  };

  const handleAddAppointment = (data: AddAppointmentFormData) => {
    if (!selectedDate) {
      toast.error('Por favor, selecione uma data');
      return;
    }

    const newAppointment: Appointment = {
      id: (appointments.length + 1).toString(),
      date: selectedDate,
      ...data
    };

    setAppointments([...appointments, newAppointment]);
    setIsDialogOpen(false);
    toast.success('Agendamento criado com sucesso');
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <Card className="lg:col-span-1 glassmorphism">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CalendarPlus className="h-5 w-5" />
            <span>Selecionar Data</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <CalendarComponent
            mode="single"
            selected={selectedDate}
            onSelect={setSelectedDate}
            className="rounded-md border"
          />
        </CardContent>
      </Card>
      
      <Card className="lg:col-span-2 glassmorphism">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>
            {selectedDate ? format(selectedDate, 'PPP') : 'Nenhuma Data Selecionada'}
          </CardTitle>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" className="flex items-center gap-1">
                <Plus className="h-4 w-4" />
                <span>Novo Agendamento</span>
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Criar Novo Agendamento</DialogTitle>
              </DialogHeader>
              <form className="space-y-4" onSubmit={(e) => {
                e.preventDefault();
                const formData = new FormData(e.currentTarget);
                handleAddAppointment({
                  clientId: formData.get('clientId') as string,
                  clientName: formData.get('clientName') as string,
                  time: formData.get('time') as string,
                  type: formData.get('type') as 'sessão' | 'avaliação' | 'consulta',
                  notes: formData.get('notes') as string
                });
              }}>
                <div className="space-y-2">
                  <Label htmlFor="clientName">Nome do Cliente</Label>
                  <Input 
                    id="clientName" 
                    name="clientName" 
                    required 
                    placeholder="Nome do cliente"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="time">Hora</Label>
                  <Input 
                    id="time" 
                    name="time" 
                    type="time" 
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="type">Tipo</Label>
                  <Select name="type" defaultValue="sessão">
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione o tipo" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="sessão">Sessão</SelectItem>
                      <SelectItem value="avaliação">Avaliação</SelectItem>
                      <SelectItem value="consulta">Consulta</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="notes">Notas</Label>
                  <Input 
                    id="notes" 
                    name="notes" 
                    placeholder="Notas adicionais"
                  />
                </div>

                <Button type="submit" className="w-full">
                  Criar Agendamento
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        </CardHeader>
        <CardContent>
          {appointmentsForSelectedDate.length > 0 ? (
            <div className="space-y-4">
              {appointmentsForSelectedDate.map((appointment) => (
                <div 
                  key={appointment.id} 
                  className={`p-4 rounded-lg ${getAppointmentColor(appointment.type)} border border-white/20`}
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="font-medium">{appointment.clientName}</h3>
                      <p className="text-sm capitalize">{appointment.type}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-medium">{appointment.time}</p>
                    </div>
                  </div>
                  {appointment.notes && (
                    <p className="text-sm mt-2 text-neuro-gray">{appointment.notes}</p>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="py-12 text-center">
              <p className="text-neuro-gray">Nenhum agendamento para esta data</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default AppointmentCalendar;
