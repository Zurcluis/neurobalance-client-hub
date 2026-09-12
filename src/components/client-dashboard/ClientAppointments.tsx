import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Calendar,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  MessageSquare,
  User,
  Phone,
  Loader2,
  RotateCcw
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { format, isAfter, isBefore, addHours } from 'date-fns';
import { pt } from 'date-fns/locale';
import { parseLocalISO } from '@/utils/dateUtils';
import { EmptyState } from '@/components/shared/EmptyState';
import { TableSkeleton } from '@/components/shared/SkeletonCard';
import ClientReminders from '@/components/client-dashboard/ClientReminders';
import SelfSchedulingPanel from '@/components/availability/SelfSchedulingPanel';

import {
  AppointmentWithConfirmation,
  APPOINTMENT_STATUS_LABELS,
  APPOINTMENT_TYPE_LABELS,
  getAppointmentStatusColor,
  isAppointmentConfirmable
} from '@/types/client-dashboard';

interface ClientAppointmentsProps {
  clientId: number;
  onOpenChat?: () => void;
}

type RpcFn = <T = unknown>(
  fn: string,
  args?: Record<string, unknown>
) => Promise<{ data: T | null; error: { message: string } | null }>;

const rpc = supabase.rpc as unknown as RpcFn;

interface AppointmentActionDialogProps {
  appointment: AppointmentWithConfirmation;
  mode: 'confirm' | 'cancel';
  pending: boolean;
  onConfirm: (status: 'confirmed' | 'cancelled', notes?: string) => void;
}

const AppointmentActionDialog: React.FC<AppointmentActionDialogProps> = ({
  appointment,
  mode,
  pending,
  onConfirm
}) => {
  const [open, setOpen] = useState(false);
  const [notes, setNotes] = useState('');
  const isConfirm = mode === 'confirm';

  const handleOpenChange = (nextOpen: boolean) => {
    setOpen(nextOpen);
    if (!nextOpen) setNotes('');
  };

  const handleAction = () => {
    onConfirm(isConfirm ? 'confirmed' : 'cancelled', notes);
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        {isConfirm ? (
          <Button size="sm">
            <CheckCircle className="h-4 w-4 mr-1" />
            Confirmar
          </Button>
        ) : (
          <Button size="sm" variant="outline" className="text-destructive border-destructive/30 hover:bg-destructive/10">
            <XCircle className="h-4 w-4 mr-1" />
            Cancelar
          </Button>
        )}
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{isConfirm ? 'Confirmar Agendamento' : 'Cancelar Agendamento'}</DialogTitle>
          <DialogDescription>
            {isConfirm
              ? `Confirme a sua presença em ${appointment.titulo} a ${format(parseLocalISO(appointment.data), "d 'de' MMMM", { locale: pt })} às ${appointment.hora}`
              : `Tem a certeza de que pretende cancelar ${appointment.titulo} a ${format(parseLocalISO(appointment.data), "d 'de' MMMM", { locale: pt })} às ${appointment.hora}?`}
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <label htmlFor={`notes-${mode}-${appointment.id}`} className="text-sm font-medium">
              {isConfirm ? 'Observações (opcional)' : 'Motivo do cancelamento (opcional)'}
            </label>
            <Textarea
              id={`notes-${mode}-${appointment.id}`}
              placeholder={isConfirm
                ? 'Alguma observação sobre o agendamento...'
                : 'Indique o motivo do cancelamento...'}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="mt-1"
            />
          </div>
          <div className="flex gap-2">
            <Button
              onClick={handleAction}
              disabled={pending}
              variant={isConfirm ? 'default' : 'destructive'}
            >
              {pending ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : isConfirm ? (
                <CheckCircle className="h-4 w-4 mr-2" />
              ) : (
                <XCircle className="h-4 w-4 mr-2" />
              )}
              {isConfirm ? 'Confirmar' : 'Cancelar Agendamento'}
            </Button>
            <Button variant="outline" onClick={() => handleOpenChange(false)}>
              {isConfirm ? 'Cancelar' : 'Manter Agendamento'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

const ClientAppointments: React.FC<ClientAppointmentsProps> = ({ clientId, onOpenChat }) => {
  const [appointments, setAppointments] = useState<AppointmentWithConfirmation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [confirmingAppointment, setConfirmingAppointment] = useState<number | null>(null);

  const fetchAppointments = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const { data: appointmentsData, error: appointmentsError } = await supabase
        .from('agendamentos')
        .select('*')
        .eq('id_cliente', clientId)
        .order('data', { ascending: true });

      if (appointmentsError) {
        throw appointmentsError;
      }

      const { data: confirmationsData, error: confirmationsError } = await supabase
        .from('appointment_confirmations')
        .select('*')
        .eq('id_cliente', clientId);

      if (confirmationsError) {
        throw confirmationsError;
      }

      const appointmentsWithConfirmations = (appointmentsData || []).map(appointment => ({
        ...appointment,
        confirmation: confirmationsData?.find(conf => conf.id_agendamento === appointment.id)
      }));

      setAppointments(appointmentsWithConfirmations);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erro desconhecido';
      setError(message);
      toast.error('Erro ao carregar agendamentos');
    } finally {
      setLoading(false);
    }
  }, [clientId]);

  useEffect(() => {
    fetchAppointments();
  }, [fetchAppointments]);

  const handleConfirmAppointment = async (appointmentId: number, status: 'confirmed' | 'cancelled', notes?: string) => {
    try {
      setConfirmingAppointment(appointmentId);

      const { data: result, error: rpcError } = await rpc<{ success: boolean; error?: string }>('client_confirm_appointment', {
        p_appointment_id: appointmentId,
        p_client_id: clientId,
        p_status: status,
        p_notes: notes || null
      });

      if (rpcError) {
        throw rpcError;
      }

      if (result && !result.success) {
        throw new Error(result.error || 'Erro ao confirmar agendamento');
      }

      const appointment = appointments.find(apt => apt.id === appointmentId);
      if (appointment) {
        await rpc('send_client_notification', {
          client_id: clientId,
          notification_title: `Agendamento ${status === 'confirmed' ? 'Confirmado' : 'Cancelado'}`,
          notification_message: `O cliente ${status === 'confirmed' ? 'confirmou' : 'cancelou'} o agendamento de ${format(parseLocalISO(appointment.data || ''), "d 'de' MMMM 'às' HH:mm", { locale: pt })}`,
          notification_type: status === 'confirmed' ? 'success' : 'warning',
          expires_hours: 72
        });
      }

      toast.success(`Agendamento ${status === 'confirmed' ? 'confirmado' : 'cancelado'} com sucesso`);

      await fetchAppointments();
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erro ao processar a confirmação';
      toast.error(message);
    } finally {
      setConfirmingAppointment(null);
    }
  };

  const getAppointmentTypeLabel = (type: string) => {
    return APPOINTMENT_TYPE_LABELS[type as keyof typeof APPOINTMENT_TYPE_LABELS] || type;
  };

  const getStatusBadge = (appointment: AppointmentWithConfirmation) => {
    const confirmation = appointment.confirmation;
    if (confirmation) {
      return (
        <Badge className={getAppointmentStatusColor(confirmation.status)}>
          {APPOINTMENT_STATUS_LABELS[confirmation.status as keyof typeof APPOINTMENT_STATUS_LABELS]}
        </Badge>
      );
    }

    return (
      <Badge className={getAppointmentStatusColor(appointment.estado)}>
        {APPOINTMENT_STATUS_LABELS[appointment.estado as keyof typeof APPOINTMENT_STATUS_LABELS] || appointment.estado}
      </Badge>
    );
  };

  const isPastAppointment = (appointment: AppointmentWithConfirmation) => {
    return isBefore(parseLocalISO(appointment.data), new Date());
  };

  const isUpcomingAppointment = (appointment: AppointmentWithConfirmation) => {
    const appointmentDate = parseLocalISO(appointment.data);
    const now = new Date();
    return isAfter(appointmentDate, now) && isBefore(appointmentDate, addHours(now, 48));
  };

  if (loading) {
    return <TableSkeleton rows={4} />;
  }

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription className="flex items-center justify-between gap-3 flex-wrap">
          <span>{error}</span>
          <Button size="sm" variant="outline" onClick={() => fetchAppointments()} className="h-8">
            <RotateCcw className="h-3.5 w-3.5 mr-1" />
            Tentar novamente
          </Button>
        </AlertDescription>
      </Alert>
    );
  }

  const upcomingAppointments = appointments.filter(apt => !isPastAppointment(apt));
  const pastAppointments = appointments.filter(apt => isPastAppointment(apt));

  return (
    <div className="space-y-6 min-w-0">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
              <Calendar className="h-4 w-4 text-primary" />
            </div>
            Próximos Agendamentos
          </CardTitle>
          <CardDescription>
            Confirme ou cancele os seus agendamentos futuros
          </CardDescription>
        </CardHeader>
        <CardContent>
          {upcomingAppointments.length === 0 ? (
            <EmptyState
              icon={<Calendar className="h-10 w-10" />}
              title="Sem agendamentos futuros"
              description="Contacte a clínica para agendar uma sessão."
              action={onOpenChat ? {
                label: 'Enviar mensagem',
                onClick: onOpenChat,
                icon: <MessageSquare className="h-4 w-4" />
              } : undefined}
            />
          ) : (
            <div className="space-y-4">
              {upcomingAppointments.map((appointment) => (
                <div
                  key={appointment.id}
                  className={`p-4 rounded-lg border min-w-0 ${
                    isUpcomingAppointment(appointment)
                      ? 'border-primary/30 bg-primary/5'
                      : 'border-border bg-card'
                  }`}
                >
                  <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-2 mb-2">
                        <h3 className="font-semibold text-lg text-foreground">{appointment.titulo}</h3>
                        {getStatusBadge(appointment)}
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-2 sm:gap-4 text-sm text-muted-foreground">
                        <div className="flex items-center gap-2">
                          <Calendar className="h-4 w-4 flex-shrink-0" />
                          <span>{format(parseLocalISO(appointment.data), "d 'de' MMMM", { locale: pt })}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Clock className="h-4 w-4 flex-shrink-0" />
                          <span>{appointment.hora}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <User className="h-4 w-4 flex-shrink-0" />
                          <span>{getAppointmentTypeLabel(appointment.tipo)}</span>
                        </div>
                        {appointment.terapeuta && (
                          <div className="flex items-center gap-2">
                            <User className="h-4 w-4 flex-shrink-0" />
                            <span>{appointment.terapeuta}</span>
                          </div>
                        )}
                      </div>

                      {appointment.notas && (
                        <div className="mt-3 p-3 bg-muted/50 rounded-md">
                          <p className="text-sm text-foreground/80">{appointment.notas}</p>
                        </div>
                      )}

                      {appointment.confirmation?.notes && (
                        <div className="mt-3 p-3 bg-emerald-50 dark:bg-emerald-950/20 rounded-md">
                          <p className="text-sm text-emerald-700 dark:text-emerald-300">
                            <strong>A sua nota:</strong> {appointment.confirmation.notes}
                          </p>
                        </div>
                      )}
                    </div>

                    {isAppointmentConfirmable(appointment) && (
                      <div className="flex sm:flex-col gap-2 sm:ml-4 flex-shrink-0">
                        <AppointmentActionDialog
                          appointment={appointment}
                          mode="confirm"
                          pending={confirmingAppointment === appointment.id}
                          onConfirm={(status, notes) => handleConfirmAppointment(appointment.id, status, notes)}
                        />
                        <AppointmentActionDialog
                          appointment={appointment}
                          mode="cancel"
                          pending={confirmingAppointment === appointment.id}
                          onConfirm={(status, notes) => handleConfirmAppointment(appointment.id, status, notes)}
                        />
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <ClientReminders clientId={clientId} appointments={upcomingAppointments} />

      <SelfSchedulingPanel
        clienteId={clientId}
        onOpenChat={onOpenChat}
        onBooked={fetchAppointments}
      />

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
              <Clock className="h-4 w-4 text-primary" />
            </div>
            Histórico de Agendamentos
          </CardTitle>
          <CardDescription>
            Os seus agendamentos anteriores
          </CardDescription>
        </CardHeader>
        <CardContent>
          {pastAppointments.length === 0 ? (
            <EmptyState
              icon={<Clock className="h-10 w-10" />}
              title="Sem histórico"
              description="Ainda não existem agendamentos anteriores."
              className="py-8"
            />
          ) : (
            <div className="space-y-3">
              {pastAppointments.map((appointment) => (
                <div
                  key={appointment.id}
                  className="p-4 rounded-lg border border-border bg-muted/50"
                >
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-2 mb-2">
                        <h3 className="font-medium text-foreground">{appointment.titulo}</h3>
                        {getStatusBadge(appointment)}
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-3 gap-2 sm:gap-4 text-sm text-muted-foreground">
                        <div className="flex items-center gap-2">
                          <Calendar className="h-4 w-4 flex-shrink-0" />
                          <span>{format(parseLocalISO(appointment.data), "d 'de' MMMM", { locale: pt })}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Clock className="h-4 w-4 flex-shrink-0" />
                          <span>{appointment.hora}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <User className="h-4 w-4 flex-shrink-0" />
                          <span>{getAppointmentTypeLabel(appointment.tipo)}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertCircle className="h-5 w-5 text-primary" />
            Informações Importantes
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3 text-sm">
            <div className="flex items-start gap-2">
              <CheckCircle className="h-4 w-4 text-emerald-600 mt-0.5 flex-shrink-0" />
              <p>Confirme os seus agendamentos com pelo menos 2 horas de antecedência</p>
            </div>
            <div className="flex items-start gap-2">
              <XCircle className="h-4 w-4 text-red-600 mt-0.5 flex-shrink-0" />
              <p>Os cancelamentos devem ser feitos com 24 horas de antecedência</p>
            </div>
            <div className="flex items-start gap-2">
              <Phone className="h-4 w-4 text-blue-600 mt-0.5 flex-shrink-0" />
              <p>Para reagendamentos, contacte diretamente a clínica</p>
            </div>
            <div className="flex items-start gap-2">
              <MessageSquare className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
              <p>Use o chat para comunicar qualquer dúvida ou necessidade especial</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ClientAppointments;
