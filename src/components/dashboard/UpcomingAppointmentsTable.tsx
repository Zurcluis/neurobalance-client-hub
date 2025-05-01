
import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Link } from 'react-router-dom';
import { parseISO, format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useIsMobile } from '@/hooks/use-mobile';

interface Appointment {
  id: string;
  title: string;
  date: string;
  clientName: string;
  clientId: string;
  type: 'sessão' | 'avaliação' | 'consulta';
  confirmed?: boolean;
}

interface UpcomingAppointmentsTableProps {
  appointments: Appointment[];
}

const UpcomingAppointmentsTable = ({ appointments }: UpcomingAppointmentsTableProps) => {
  const isMobile = useIsMobile();
  
  const getAppointmentTypeLabel = (type: string) => {
    switch (type) {
      case 'avaliação':
        return 'Avaliação';
      case 'sessão':
        return 'Neurofeedback';
      case 'consulta':
        return 'Discussão';
      default:
        return type;
    }
  };
  
  const getAppointmentTypeColor = (type: string) => {
    switch (type) {
      case 'avaliação':
        return 'bg-[#9e50b3] text-white';
      case 'sessão':
        return 'bg-[#1088c4] text-white';
      case 'consulta':
        return 'bg-[#ecc249] text-white';
      default:
        return 'bg-gray-200 text-gray-800';
    }
  };
  
  return (
    <div className="overflow-x-auto">
      <table className="w-full bg-gradient-to-r from-blue-400/30 to-teal-400/30 rounded-lg overflow-hidden">
        <thead className="bg-white/20 backdrop-blur-sm">
          <tr>
            <th className="py-3 px-4 text-left font-medium text-[#265255]">Horário</th>
            <th className="py-3 px-4 text-left font-medium text-[#265255]">Cliente</th>
            <th className="py-3 px-4 text-left font-medium text-[#265255]">Tipo</th>
            <th className="py-3 px-4 text-left font-medium text-[#265255]">Status</th>
          </tr>
        </thead>
        <tbody>
          {appointments.map((appointment) => {
            const appointmentDate = parseISO(appointment.date);
            const timeString = appointment.date.split('T')[1] || '09:00';
            const [hours, minutes] = timeString.split(':');
            const formattedStartTime = `${hours}:${minutes}`;
            const endTimeHours = parseInt(hours) + 1;
            const formattedEndTime = `${endTimeHours}:${minutes}`;
            
            return (
              <tr key={appointment.id} className="border-t border-white/20 hover:bg-white/10">
                <td className="py-3 px-4 text-[#265255]">
                  {formattedStartTime} - {formattedEndTime}
                </td>
                <td className="py-3 px-4">
                  <Link to={`/clients/${appointment.clientId}`} className="hover:underline text-[#265255] font-medium">
                    {appointment.clientName}
                  </Link>
                  {!isMobile && (
                    <div className="text-xs text-gray-600">ID: {appointment.clientId}</div>
                  )}
                </td>
                <td className="py-3 px-4">
                  <Badge className={`${getAppointmentTypeColor(appointment.type)}`}>
                    {getAppointmentTypeLabel(appointment.type)}
                  </Badge>
                </td>
                <td className="py-3 px-4">
                  <Badge variant="outline" className={appointment.confirmed ? "bg-green-100 text-green-800" : "bg-yellow-100 text-yellow-800"}>
                    {appointment.confirmed ? "Confirmado" : "Pendente"}
                  </Badge>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
};

export default UpcomingAppointmentsTable;
