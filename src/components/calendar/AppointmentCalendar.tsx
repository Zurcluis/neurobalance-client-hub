
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
import { Calendar, Plus } from 'lucide-react';

interface Appointment {
  id: string;
  clientId: string;
  clientName: string;
  date: Date;
  time: string;
  type: 'session' | 'assessment' | 'consultation';
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
  
  // Filter appointments for the selected date
  const appointmentsForSelectedDate = selectedDate 
    ? sampleAppointments.filter(
        app => app.date.toDateString() === selectedDate.toDateString()
      ) 
    : [];
    
  // Get appropriate background color based on appointment type
  const getAppointmentColor = (type: string) => {
    switch(type) {
      case 'session':
        return 'bg-neuro-soft-purple';
      case 'assessment':
        return 'bg-neuro-soft-pink';
      case 'consultation':
        return 'bg-neuro-soft-blue';
      default:
        return 'bg-neuro-soft-gray';
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <Card className="lg:col-span-1 glassmorphism">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            <span>Select Date</span>
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
            {selectedDate ? format(selectedDate, 'PPPP') : 'No Date Selected'}
          </CardTitle>
          <Button variant="outline" className="flex items-center gap-1">
            <Plus className="h-4 w-4" />
            <span>New Appointment</span>
          </Button>
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
              <p className="text-neuro-gray">No appointments scheduled for this date</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default AppointmentCalendar;
