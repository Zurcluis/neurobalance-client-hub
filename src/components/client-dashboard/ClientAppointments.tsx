import React, { useState, useEffect } from 'react';
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
  MapPin,
  User,
  Phone,
  Loader2
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { format, parseISO, isAfter, isBefore, addHours } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { 
  AppointmentWithConfirmation, 
  APPOINTMENT_STATUS_LABELS, 
  APPOINTMENT_TYPE_LABELS,
  getAppointmentStatusColor,
  isAppointmentConfirmable 
} from '@/types/client-dashboard';

interface ClientAppointmentsProps {
  clientId: number;
}

const ClientAppointments: React.FC<ClientAppointmentsProps> = ({ clientId }) => {
  const [appointments, setAppointments] = useState<AppointmentWithConfirmation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [confirmingAppointment, setConfirmingAppointment] = useState<number | null>(null);
  const [confirmationNotes, setConfirmationNotes] = useState('');
  const [selectedAppointment, setSelectedAppointment] = useState<AppointmentWithConfirmation | null>(null);

  // Carregar agendamentos
  useEffect(() => {
    fetchAppointments();
  }, [clientId]);

  const fetchAppointments = async () => {
    try {
      setLoading(true);
      setError(null);

      // Buscar agendamentos do cliente
      const { data: appointmentsData, error: appointmentsError } = await supabase
        .from('agendamentos')
        .select('*')
        .eq('id_cliente', clientId)
        .order('data', { ascending: true });

      if (appointmentsError) {
        throw appointmentsError;
      }

      // Buscar confirmações existentes
      const { data: confirmationsData, error: confirmationsError } = await supabase
        .from('appointment_confirmations')
        .select('*')
        .eq('id_cliente', clientId);

      if (confirmationsError) {
        throw confirmationsError;
      }

      // Combinar dados
      const appointmentsWithConfirmations = appointmentsData.map(appointment => ({
        ...appointment,
        confirmation: confirmationsData.find(conf => conf.id_agendamento === appointment.id)
      }));

      setAppointments(appointmentsWithConfirmations);
    } catch (error: any) {
      console.error('Erro ao carregar agendamentos:', error);
      setError(error.message);
      toast.error('Erro ao carregar agendamentos');
    } finally {
      setLoading(false);
    }
  };

  const handleConfirmAppointment = async (appointmentId: number, status: 'confirmed' | 'cancelled', notes?: string) => {
    try {
      setConfirmingAppointment(appointmentId);

      // Usar função SECURITY DEFINER para confirmar/cancelar agendamento
      // Esta função atualiza tanto a confirmação quanto o estado do agendamento de forma atómica
      const { data: result, error } = await supabase.rpc<any, any>('client_confirm_appointment', {
        p_appointment_id: appointmentId,
        p_client_id: clientId,
        p_status: status,
        p_notes: notes || null
      });

      if (error) {
        console.error('Erro na função client_confirm_appointment:', error);
        throw error;
      }

      if (result && !result.success) {
        throw new Error(result.error || 'Erro ao confirmar agendamento');
      }

      // Enviar notificação para a clínica
      const appointment = appointments.find(apt => apt.id === appointmentId);
      if (appointment) {
        await supabase.rpc<any, any>('send_client_notification', {
          client_id: clientId,
          notification_title: `Agendamento ${status === 'confirmed' ? 'Confirmado' : 'Cancelado'}`,
          notification_message: `O cliente ${status === 'confirmed' ? 'confirmou' : 'cancelou'} o agendamento de ${format(parseISO(appointment.data || ''), 'dd/MM/yyyy HH:mm', { locale: ptBR })}`,
          notification_type: status === 'confirmed' ? 'success' : 'warning',
          expires_hours: 72
        });
      }

      toast.success(`Agendamento ${status === 'confirmed' ? 'confirmado' : 'cancelado'} com sucesso`);
      
      // Recarregar agendamentos
      await fetchAppointments();
      
      // Limpar estados
      setConfirmationNotes('');
      setSelectedAppointment(null);
    } catch (error: any) {
      console.error('Erro ao confirmar agendamento:', error);
      toast.error(error.message || 'Erro ao processar confirmação');
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

  const canConfirmAppointment = (appointment: AppointmentWithConfirmation) => {
    return isAppointmentConfirmable(appointment);
  };

  const isPastAppointment = (appointment: AppointmentWithConfirmation) => {
    return isBefore(parseISO(appointment.data), new Date());
  };

  const isUpcomingAppointment = (appointment: AppointmentWithConfirmation) => {
    const appointmentDate = parseISO(appointment.data);
    const now = new Date();
    return isAfter(appointmentDate, now) && isBefore(appointmentDate, addHours(now, 48));
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin text-[#3f9094]" />
      </div>
    );
  }

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    );
  }

  const upcomingAppointments = appointments.filter(apt => !isPastAppointment(apt));
  const pastAppointments = appointments.filter(apt => isPastAppointment(apt));

  return (
    <div className="space-y-6">
      {/* Agendamentos Próximos */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Próximos Agendamentos
          </CardTitle>
          <CardDescription>
            Confirme ou cancele seus agendamentos futuros
          </CardDescription>
        </CardHeader>
        <CardContent>
          {upcomingAppointments.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <Calendar className="h-12 w-12 mx-auto mb-4 text-gray-300" />
              <p>Nenhum agendamento futuro encontrado</p>
              <p className="text-sm">Contacte a clínica para agendar uma sessão</p>
            </div>
          ) : (
            <div className="space-y-4">
              {upcomingAppointments.map((appointment) => (
                <div
                  key={appointment.id}
                  className={`p-4 rounded-lg border-2 ${
                    isUpcomingAppointment(appointment) 
                      ? 'border-blue-200 bg-blue-50' 
                      : 'border-gray-200 bg-white'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <h3 className="font-semibold text-lg">{appointment.titulo}</h3>
                        {getStatusBadge(appointment)}
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-600">
                        <div className="flex items-center gap-2">
                          <Calendar className="h-4 w-4" />
                          <span>{format(parseISO(appointment.data), 'dd/MM/yyyy', { locale: ptBR })}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Clock className="h-4 w-4" />
                          <span>{appointment.hora}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <User className="h-4 w-4" />
                          <span>{getAppointmentTypeLabel(appointment.tipo)}</span>
                        </div>
                        {appointment.terapeuta && (
                          <div className="flex items-center gap-2">
                            <User className="h-4 w-4" />
                            <span>{appointment.terapeuta}</span>
                          </div>
                        )}
                      </div>

                      {appointment.notas && (
                        <div className="mt-3 p-3 bg-gray-50 rounded-md">
                          <p className="text-sm text-gray-700">{appointment.notas}</p>
                        </div>
                      )}

                      {appointment.confirmation?.notes && (
                        <div className="mt-3 p-3 bg-green-50 rounded-md">
                          <p className="text-sm text-green-700">
                            <strong>Sua nota:</strong> {appointment.confirmation.notes}
                          </p>
                        </div>
                      )}
                    </div>

                    {canConfirmAppointment(appointment) && (
                      <div className="flex flex-col gap-2 ml-4">
                        <Dialog>
                          <DialogTrigger asChild>
                            <Button 
                              size="sm" 
                              className="bg-green-600 hover:bg-green-700"
                              onClick={() => setSelectedAppointment(appointment)}
                            >
                              <CheckCircle className="h-4 w-4 mr-1" />
                              Confirmar
                            </Button>
                          </DialogTrigger>
                          <DialogContent>
                            <DialogHeader>
                              <DialogTitle>Confirmar Agendamento</DialogTitle>
                              <DialogDescription>
                                Confirme sua presença para {appointment.titulo} em{' '}
                                {format(parseISO(appointment.data), 'dd/MM/yyyy', { locale: ptBR })} às {appointment.hora}
                              </DialogDescription>
                            </DialogHeader>
                            <div className="space-y-4">
                              <div>
                                <label className="text-sm font-medium">Observações (opcional)</label>
                                <Textarea
                                  placeholder="Alguma observação sobre o agendamento..."
                                  value={confirmationNotes}
                                  onChange={(e) => setConfirmationNotes(e.target.value)}
                                  className="mt-1"
                                />
                              </div>
                              <div className="flex gap-2">
                                <Button
                                  onClick={() => handleConfirmAppointment(appointment.id, 'confirmed', confirmationNotes)}
                                  disabled={confirmingAppointment === appointment.id}
                                  className="bg-green-600 hover:bg-green-700"
                                >
                                  {confirmingAppointment === appointment.id ? (
                                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                                  ) : (
                                    <CheckCircle className="h-4 w-4 mr-2" />
                                  )}
                                  Confirmar
                                </Button>
                                <Button
                                  variant="outline"
                                  onClick={() => {
                                    setConfirmationNotes('');
                                    setSelectedAppointment(null);
                                  }}
                                >
                                  Cancelar
                                </Button>
                              </div>
                            </div>
                          </DialogContent>
                        </Dialog>

                        <Dialog>
                          <DialogTrigger asChild>
                            <Button 
                              size="sm" 
                              variant="outline"
                              className="text-red-600 border-red-600 hover:bg-red-50"
                              onClick={() => setSelectedAppointment(appointment)}
                            >
                              <XCircle className="h-4 w-4 mr-1" />
                              Cancelar
                            </Button>
                          </DialogTrigger>
                          <DialogContent>
                            <DialogHeader>
                              <DialogTitle>Cancelar Agendamento</DialogTitle>
                              <DialogDescription>
                                Tem certeza que deseja cancelar {appointment.titulo} em{' '}
                                {format(parseISO(appointment.data), 'dd/MM/yyyy', { locale: ptBR })} às {appointment.hora}?
                              </DialogDescription>
                            </DialogHeader>
                            <div className="space-y-4">
                              <div>
                                <label className="text-sm font-medium">Motivo do cancelamento (opcional)</label>
                                <Textarea
                                  placeholder="Por favor, informe o motivo do cancelamento..."
                                  value={confirmationNotes}
                                  onChange={(e) => setConfirmationNotes(e.target.value)}
                                  className="mt-1"
                                />
                              </div>
                              <div className="flex gap-2">
                                <Button
                                  onClick={() => handleConfirmAppointment(appointment.id, 'cancelled', confirmationNotes)}
                                  disabled={confirmingAppointment === appointment.id}
                                  variant="destructive"
                                >
                                  {confirmingAppointment === appointment.id ? (
                                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                                  ) : (
                                    <XCircle className="h-4 w-4 mr-2" />
                                  )}
                                  Cancelar Agendamento
                                </Button>
                                <Button
                                  variant="outline"
                                  onClick={() => {
                                    setConfirmationNotes('');
                                    setSelectedAppointment(null);
                                  }}
                                >
                                  Manter Agendamento
                                </Button>
                              </div>
                            </div>
                          </DialogContent>
                        </Dialog>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Histórico de Agendamentos */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Histórico de Agendamentos
          </CardTitle>
          <CardDescription>
            Seus agendamentos anteriores
          </CardDescription>
        </CardHeader>
        <CardContent>
          {pastAppointments.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <Clock className="h-12 w-12 mx-auto mb-4 text-gray-300" />
              <p>Nenhum agendamento anterior encontrado</p>
            </div>
          ) : (
            <div className="space-y-3">
              {pastAppointments.map((appointment) => (
                <div
                  key={appointment.id}
                  className="p-4 rounded-lg border bg-gray-50"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <h3 className="font-medium">{appointment.titulo}</h3>
                        {getStatusBadge(appointment)}
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-gray-600">
                        <div className="flex items-center gap-2">
                          <Calendar className="h-4 w-4" />
                          <span>{format(parseISO(appointment.data), 'dd/MM/yyyy', { locale: ptBR })}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Clock className="h-4 w-4" />
                          <span>{appointment.hora}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <User className="h-4 w-4" />
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

      {/* Informações Importantes */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertCircle className="h-5 w-5" />
            Informações Importantes
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3 text-sm">
            <div className="flex items-start gap-2">
              <CheckCircle className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
              <p>Confirme seus agendamentos com pelo menos 2 horas de antecedência</p>
            </div>
            <div className="flex items-start gap-2">
              <XCircle className="h-4 w-4 text-red-600 mt-0.5 flex-shrink-0" />
              <p>Cancelamentos devem ser feitos com 24 horas de antecedência</p>
            </div>
            <div className="flex items-start gap-2">
              <Phone className="h-4 w-4 text-blue-600 mt-0.5 flex-shrink-0" />
              <p>Para reagendamentos, entre em contacto diretamente com a clínica</p>
            </div>
            <div className="flex items-start gap-2">
              <MessageSquare className="h-4 w-4 text-purple-600 mt-0.5 flex-shrink-0" />
              <p>Use o chat para comunicar qualquer dúvida ou necessidade especial</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ClientAppointments; 