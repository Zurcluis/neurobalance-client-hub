import React, { useState, useEffect } from 'react';
import { format, addHours, startOfDay, isSameDay, parseISO, addDays, subDays } from 'date-fns';
import { pt } from 'date-fns/locale';
import { Database } from '@/integrations/supabase/types';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '../ui/button';

type Appointment = Database['public']['Tables']['agendamentos']['Row'] & {
  clientes: {
    nome: string;
    email: string;
    telefone: string;
  } | null;
  cor?: string;
};

interface TimeGridViewProps {
  days: Date[];
  appointments: Appointment[];
  onTimeSlotClick: (date: Date) => void;
  onEventClick: (appointment: Appointment) => void;
  onDateChange?: (date: Date) => void;
  isDailyView?: boolean;
}

const TimeGridView: React.FC<TimeGridViewProps> = ({
  days,
  appointments,
  onTimeSlotClick,
  onEventClick,
  onDateChange,
  isDailyView = false,
}) => {
  const hours = Array.from({ length: 24 }, (_, i) => i);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [currentDate, setCurrentDate] = useState(days[0]);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 60000); // Atualiza a cada minuto

    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    if (days.length > 0) {
      setCurrentDate(days[0]);
    }
  }, [days]);

  const getAppointmentsForDayAndHour = (day: Date, hour: number) => {
    return appointments.filter(appointment => {
      const appointmentDate = parseISO(appointment.data);
      const appointmentHour = appointmentDate.getHours();
      return isSameDay(appointmentDate, day) && appointmentHour === hour;
    });
  };

  const handleTimeSlotClick = (day: Date, hour: number) => {
    const clickedDate = new Date(day);
    clickedDate.setHours(hour, 0, 0, 0);
    onTimeSlotClick(clickedDate);
  };

  const navigateDay = (direction: 'prev' | 'next') => {
    const newDate = direction === 'prev' ? subDays(currentDate, 1) : addDays(currentDate, 1);
    setCurrentDate(newDate);
    if (onDateChange) {
      onDateChange(newDate);
    }
  };

  const goToToday = () => {
    const today = new Date();
    setCurrentDate(today);
    if (onDateChange) {
      onDateChange(today);
    }
  };

  const getCurrentTimePosition = () => {
    const now = currentTime;
    const hour = now.getHours();
    const minutes = now.getMinutes();
    return (hour + minutes / 60) * 60; // 60px por hora
  };

  return (
    <div className="flex flex-col bg-white border border-gray-200 rounded-lg overflow-hidden">
      {/* Header com navegação para vista diária */}
      {isDailyView && (
        <div className="flex items-center justify-between p-3 border-b border-gray-200 bg-gray-50">
          <div className="flex items-center space-x-2">
            <Button variant="ghost" size="sm" onClick={goToToday}>
              Hoje
            </Button>
            <Button variant="ghost" size="sm" onClick={() => navigateDay('prev')}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="sm" onClick={() => navigateDay('next')}>
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
          <div className="text-lg font-medium text-gray-900">
            {format(currentDate, "dd 'de' MMMM 'de' yyyy", { locale: pt })}
          </div>
          <div className="w-20"></div> {/* Espaçador */}
        </div>
      )}

      {/* Header com os dias */}
      <div className="grid grid-cols-8 border-b border-gray-200 bg-gray-50">
        <div className="p-3 text-xs font-medium text-gray-500 border-r border-gray-200">
          GMT+01
        </div>
        {days.map((day, index) => (
          <div key={index} className="p-3 text-center border-r border-gray-200 last:border-r-0">
            <div className="text-xs font-medium text-gray-500 uppercase mb-1">
              {format(day, 'EEE', { locale: pt }).substring(0, 3)}
            </div>
            <div className={`text-2xl font-normal ${
              isSameDay(day, new Date()) 
                ? 'bg-[#3f9094] text-white w-10 h-10 rounded-full flex items-center justify-center mx-auto' 
                : 'text-gray-900'
            }`}>
              {format(day, 'd')}
            </div>
          </div>
        ))}
      </div>

      {/* Grid de horas */}
      <div className="flex-1 overflow-y-auto max-h-[600px] relative">
        {/* Linha do tempo atual */}
        {isDailyView && isSameDay(currentDate, new Date()) && (
          <div 
            className="absolute left-0 right-0 z-10 pointer-events-none"
            style={{ 
              top: `${getCurrentTimePosition()}px`,
              transform: 'translateY(-1px)'
            }}
          >
            <div className="flex items-center">
              <div className="w-12 h-2 bg-red-500 rounded-r-full"></div>
              <div className="flex-1 h-0.5 bg-red-500"></div>
            </div>
          </div>
        )}

        {hours.map(hour => (
          <div key={hour} className="grid grid-cols-8 border-b border-gray-100 hover:bg-gray-50 min-h-[60px]">
            {/* Coluna das horas */}
            <div className="p-2 text-xs text-gray-500 border-r border-gray-200 flex items-start justify-end pr-3">
              {hour === 0 ? '' : `${hour}:00`}
            </div>
            
            {/* Colunas dos dias */}
            {days.map((day, dayIndex) => {
              const dayAppointments = getAppointmentsForDayAndHour(day, hour);
              
              return (
                <div
                  key={dayIndex}
                  className="border-r border-gray-200 last:border-r-0 p-1 cursor-pointer hover:bg-[#e6f2f3] transition-colors relative min-h-[60px]"
                  onClick={() => handleTimeSlotClick(day, hour)}
                >
                  {dayAppointments.map((appointment, appointmentIndex) => (
                    <div
                      key={appointmentIndex}
                      className="text-xs p-1 mb-1 rounded cursor-pointer hover:shadow-md transition-shadow"
                      style={{
                        backgroundColor: (appointment as any).cor || '#3B82F6',
                        color: 'white'
                      }}
                      onClick={(e) => {
                        e.stopPropagation();
                        onEventClick(appointment);
                      }}
                    >
                      <div className="font-medium truncate">
                        {appointment.titulo}
                      </div>
                      <div className="text-xs opacity-90 truncate">
                        {appointment.clientes?.nome || 'Sem cliente'}
                      </div>
                    </div>
                  ))}
                </div>
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
};

export default TimeGridView; 