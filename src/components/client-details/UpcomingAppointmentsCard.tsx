import { Calendar } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import type { Appointment } from '@/hooks/useAppointments';
import StatusBadge from './StatusBadge';
import { formatSessionDateTime, getSessionTypeLabel } from './sessionView';

interface UpcomingAppointmentsCardProps {
  appointments: Appointment[];
}

const UpcomingAppointmentsCard = ({ appointments }: UpcomingAppointmentsCardProps) => {
  if (appointments.length === 0) return null;

  return (
    <Card className="shadow-sm">
      <CardHeader className="px-6">
        <CardTitle className="flex items-center gap-3 text-base font-semibold">
          <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
            <Calendar className="h-4 w-4" />
          </span>
          Próximos Agendamentos ({appointments.length})
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0 pb-4">
        <div className="overflow-x-auto">
          <Table className="min-w-[640px]">
            <TableHeader>
              <TableRow>
                <TableHead>Data</TableHead>
                <TableHead>Título</TableHead>
                <TableHead>Tipo</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead>Notas</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {appointments.map((appointment) => (
                <TableRow key={appointment.id}>
                  <TableCell className="whitespace-nowrap">
                    {formatSessionDateTime(appointment.data, appointment.hora)}
                  </TableCell>
                  <TableCell className="max-w-[200px] truncate">{appointment.titulo}</TableCell>
                  <TableCell>{getSessionTypeLabel(appointment.tipo)}</TableCell>
                  <TableCell>
                    <StatusBadge status={appointment.estado} />
                  </TableCell>
                  <TableCell>
                    {appointment.notas ? (
                      <div className="max-w-xs truncate">{appointment.notas}</div>
                    ) : (
                      <span className="text-muted-foreground text-sm">Sem notas</span>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
};

export default UpcomingAppointmentsCard;
