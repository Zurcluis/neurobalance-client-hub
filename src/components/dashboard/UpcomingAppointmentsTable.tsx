import { Badge } from '@/components/ui/badge';
import { Link } from 'react-router-dom';
import { parseISO, format } from 'date-fns';
import { useScreenSize } from '@/hooks/use-mobile';

interface Appointment {
  id: string;
  title: string;
  date: string;
  clientName: string;
  clientId: string;
  type: string;
  confirmed?: boolean;
}

interface UpcomingAppointmentsTableProps {
  appointments: Appointment[];
}

const UpcomingAppointmentsTable = ({ appointments }: UpcomingAppointmentsTableProps) => {
  const { isMobile: isBelowLg } = useScreenSize('lg');

  const getAppointmentTypeLabel = (type: string) => {
    if (!type) return 'Sessão';
    const t = type.toLowerCase();
    if (t === 'discussão de resultados') return 'Discussão';
    if (t === 'consulta de psicologia' || t === 'psicologia') return 'Psicologia';
    if (t === 'constelações familiares' || t === 'constelacoes familiares' || t === 'constelações' || t === 'constelacoes') return 'Constelações';
    if (t === 'ioga' || t === 'yoga' || t === 'yoga nidra') return 'Yoga Nidra';
    if (t === 'biorresonância magnética' || t === 'biorressonância magnética' || t === 'biorresonancia magnetica' || t === 'biorresonância' || t === 'biorressonância') return 'Biorresonância Magnética';
    return type.charAt(0).toUpperCase() + type.slice(1);
  };
  
  const getAppointmentTypeColor = (type: string) => {
    if (!type) return 'bg-[#039BE5] text-white border-none';
    const t = type.toLowerCase();
    
    if (t.includes('reavaliação') || t.includes('reavaliacao')) return 'bg-[#3F51B5] text-white border-none';
    if (t.includes('avaliação')) return 'bg-[#7986CB] text-white border-none';
    if (t.includes('neurofeedback')) return 'bg-[#039BE5] text-white border-none';
    if (t.includes('discussão')) return 'bg-[#F6BF26] text-gray-900 border-none font-medium';
    if (t.includes('psicologia')) return 'bg-[#F4511E] text-white border-none';
    if (t.includes('constelaç') || t.includes('constelac')) return 'bg-[#8E24AA] text-white border-none';
    if (t.includes('ioga') || t.includes('yoga') || t.includes('nidra')) return 'bg-[#33B679] text-white border-none';
    if (t.includes('biorresonância') || t.includes('biorressonancia') || t.includes('biorresonancia')) return 'bg-[#7CB342] text-white border-none';
    if (t.includes('ofes')) return 'bg-[#D50000] text-white border-none';
    
    switch (t) {
      case 'sessão': return 'bg-[#039BE5] text-white border-none';
      case 'consulta': return 'bg-[#0B8043] text-white border-none';
      default: return 'bg-gray-600 text-white border-none';
    }
  };
  
  // Renderização em cartões para telemóvel e tablet (abaixo de lg)
  if (isBelowLg) {
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
              className="bg-card/60 p-3 rounded-lg shadow-sm border border-border"
            >
              <div className="flex justify-between items-start mb-1.5">
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium truncate">{appointment.title}</div>
                  <Link to={`/clients/${appointment.clientId}`} className="text-xs text-primary hover:underline">
                    {appointment.clientName}
                  </Link>
                </div>
                <div className="text-right">
                  <div className="text-xs font-medium text-muted-foreground">
                    {formattedStartTime} - {formattedEndTime}
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between mt-1">
                <Badge className={`${getAppointmentTypeColor(appointment.type)} text-xs px-2 py-0.5`}>
                  {getAppointmentTypeLabel(appointment.type)}
                </Badge>
                <Badge variant="outline" className={`text-xs ${appointment.confirmed ? "bg-green-500/15 text-green-700 dark:text-green-400" : "bg-amber-500/15 text-amber-700 dark:text-amber-400"}`}>
                  {appointment.confirmed ? "Confirmado" : "Pendente"}
                </Badge>
              </div>
            </div>
          );
        })}
        
        {appointments.length === 0 && (
          <div className="text-center py-4 text-muted-foreground text-sm">
            Sem agendamentos
          </div>
        )}
      </div>
    );
  }
  
  // Versão tabela (ecrãs lg e acima)
  return (
    <div className="overflow-x-auto table-container">
      <table className="w-full">
        <thead>
          <tr className="text-left text-xs uppercase tracking-wider text-muted-foreground bg-muted/50">
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
              <tr key={appointment.id} className="border-t border-border hover:bg-muted/40 transition-colors">
                <td className="py-3 px-4 text-sm text-muted-foreground tabular-nums">
                  {formattedStartTime} - {formattedEndTime}
                </td>
                <td className="py-3 px-4">
                  <Link to={`/clients/${appointment.clientId}`} className="hover:underline text-foreground font-medium text-sm">
                    {appointment.clientName}
                  </Link>
                  <div className="text-xs text-muted-foreground">ID: {appointment.clientId}</div>
                </td>
                <td className="py-3 px-4">
                  <Badge className={`${getAppointmentTypeColor(appointment.type)}`}>
                    {getAppointmentTypeLabel(appointment.type)}
                  </Badge>
                </td>
                <td className="py-3 px-4">
                  <Badge variant="outline" className={`text-xs ${appointment.confirmed ? "bg-green-500/15 text-green-700 dark:text-green-400" : "bg-amber-500/15 text-amber-700 dark:text-amber-400"}`}>
                    {appointment.confirmed ? "Confirmado" : "Pendente"}
                  </Badge>
                </td>
              </tr>
            );
          })}
          
          {appointments.length === 0 && (
            <tr>
              <td colSpan={4} className="text-center py-4 text-muted-foreground">
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
