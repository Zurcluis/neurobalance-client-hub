import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Link } from 'react-router-dom';
import { parseISO, format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useIsMobile, useScreenSize } from '@/hooks/use-mobile';

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
  const { isPortrait } = useScreenSize();
  
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
  
  // Renderização mobile adaptada
  if (isMobile && isPortrait) {
    return (
      <div className="space-y-2">
        {appointments.map((appointment) => {
          const appointmentDate = parseISO(appointment.date);
          const formattedStartTime = format(appointmentDate, 'HH:mm');
          
          // Estima o fim da sessão (45 minutos depois)
          const endTime = new Date(appointmentDate);
          endTime.setMinutes(endTime.getMinutes() + 45);
          const formattedEndTime = format(endTime, 'HH:mm');
          
          return (
            <div 
              key={appointment.id} 
              className="bg-white/70 dark:bg-gray-800/70 backdrop-blur-sm p-3 rounded-lg shadow-sm border border-gray-100 dark:border-gray-700"
            >
              <div className="flex justify-between items-start mb-1.5">
                <div className="flex-1">
                  <div className="text-sm font-medium truncate">{appointment.title}</div>
                  <Link to={`/clients/${appointment.clientId}`} className="text-xs text-[#265255] hover:underline">
                    {appointment.clientName}
                  </Link>
                </div>
                <div className="text-right">
                  <div className="text-xs font-medium text-gray-600">
                    {formattedStartTime} - {formattedEndTime}
                  </div>
                </div>
              </div>
              
              <div className="flex items-center justify-between mt-1">
                <Badge className={`${getAppointmentTypeColor(appointment.type)} text-xs px-2 py-0.5`}>
                  {getAppointmentTypeLabel(appointment.type)}
                </Badge>
                <Badge variant="outline" className={`text-xs ${appointment.confirmed ? "bg-green-100 text-green-800" : "bg-yellow-100 text-yellow-800"}`}>
                  {appointment.confirmed ? "Confirmado" : "Pendente"}
                </Badge>
              </div>
            </div>
          );
        })}
        
        {appointments.length === 0 && (
          <div className="text-center py-4 text-gray-500 text-sm">
            Sem agendamentos
          </div>
        )}
      </div>
    );
  }
  
  // Versão desktop ou mobile em landscape
  return (
    <div className="overflow-x-auto table-container">
      <table className="w-full">
        <thead>
          <tr className="text-left text-xs uppercase tracking-wider text-[#265255] bg-[#E6ECEA]/40">
            <th className="py-2 px-4 font-medium">Horário</th>
            <th className="py-2 px-4 font-medium">Cliente</th>
            <th className="py-2 px-4 font-medium">Tipo</th>
            <th className="py-2 px-4 font-medium">Estado</th>
          </tr>
        </thead>
        <tbody>
          {appointments.map((appointment) => {
            const appointmentDate = parseISO(appointment.date);
            const formattedStartTime = format(appointmentDate, 'HH:mm');
            
            // Estima o fim da sessão (45 minutos depois)
            const endTime = new Date(appointmentDate);
            endTime.setMinutes(endTime.getMinutes() + 45);
            const formattedEndTime = format(endTime, 'HH:mm');
            
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
          
          {appointments.length === 0 && (
            <tr>
              <td colSpan={4} className="text-center py-4 text-gray-500">
                Sem agendamentos
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
};

export default UpcomingAppointmentsTable;
