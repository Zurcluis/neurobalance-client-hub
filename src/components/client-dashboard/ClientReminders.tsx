import React, { useEffect, useMemo, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { BellRing, Calendar, Info, Loader2 } from 'lucide-react';
import { format } from 'date-fns';
import { pt } from 'date-fns/locale';
import { supabase } from '@/integrations/supabase/client';
import { EmptyState } from '@/components/shared/EmptyState';
import { useClientAuth } from '@/hooks/useClientAuth';
import { parseLocalISO } from '@/utils/dateUtils';
import type { AppointmentWithConfirmation } from '@/types/client-dashboard';

interface ClientRemindersProps {
  clientId: number;
  appointments: AppointmentWithConfirmation[];
}

interface ReminderStatusEntry {
  estado_sms: 'enviado' | 'agendado' | 'programado';
  enviado_em: string | null;
}

type ServiceState = 'checking' | 'configured' | 'unconfigured' | 'unavailable';

interface RemindersStatusResponse {
  configured?: boolean;
  authorized?: boolean;
  reminders?: { id_agendamento: number; estado_sms: ReminderStatusEntry['estado_sms']; enviado_em: string | null }[];
}

const REMINDER_WINDOW_HOURS = 48;

const REMINDER_BADGE: Record<ReminderStatusEntry['estado_sms'], string> = {
  enviado: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300 border-0',
  agendado: 'bg-blue-100 text-blue-700 dark:bg-blue-950/40 dark:text-blue-300 border-0',
  programado: 'bg-muted text-muted-foreground border-0',
};

const REMINDER_LABEL: Record<ReminderStatusEntry['estado_sms'], string> = {
  enviado: 'Enviado',
  agendado: 'Agendado',
  programado: 'Programado',
};

const hoursUntil = (appointment: AppointmentWithConfirmation): number => {
  const start = parseLocalISO(appointment.data);
  const [hh, mm] = (appointment.hora || '00:00').split(':').map(Number);
  start.setHours(hh || 0, mm || 0, 0, 0);
  return (start.getTime() - Date.now()) / (1000 * 60 * 60);
};

const ClientReminders: React.FC<ClientRemindersProps> = ({ clientId, appointments }) => {
  const { session } = useClientAuth();
  const [serviceState, setServiceState] = useState<ServiceState>('checking');
  const [remoteStatus, setRemoteStatus] = useState<Record<number, ReminderStatusEntry>>({});

  const upcoming = useMemo(
    () =>
      appointments
        .filter(
          (apt) =>
            hoursUntil(apt) > 0 &&
            apt.estado !== 'cancelado' &&
            apt.estado !== 'realizado'
        )
        .sort((a, b) => parseLocalISO(a.data).getTime() - parseLocalISO(b.data).getTime())
        .slice(0, 5),
    [appointments]
  );

  useEffect(() => {
    let cancelled = false;

    const loadStatus = async () => {
      if (!session?.token || !clientId) {
        setServiceState('unavailable');
        return;
      }

      setServiceState('checking');
      try {
        const { data, error } = await supabase.functions.invoke<RemindersStatusResponse>(
          'send-sms-reminder',
          { body: { action: 'reminders-status', token: session.token } }
        );

        if (cancelled) return;

        if (error) {
          setServiceState('unavailable');
          return;
        }

        if (data && data.authorized === false) {
          setServiceState('unavailable');
          return;
        }

        setServiceState(data?.configured ? 'configured' : 'unconfigured');
        const entries: Record<number, ReminderStatusEntry> = {};
        (data?.reminders || []).forEach((reminder) => {
          entries[reminder.id_agendamento] = {
            estado_sms: reminder.estado_sms,
            enviado_em: reminder.enviado_em,
          };
        });
        setRemoteStatus(entries);
      } catch {
        if (!cancelled) setServiceState('unavailable');
      }
    };

    loadStatus();
    return () => {
      cancelled = true;
    };
  }, [session?.token, clientId]);

  const getReminderState = (appointment: AppointmentWithConfirmation): ReminderStatusEntry => {
    const remote = remoteStatus[appointment.id];
    if (remote) return remote;
    const hours = hoursUntil(appointment);
    if (hours <= REMINDER_WINDOW_HOURS) return { estado_sms: 'agendado', enviado_em: null };
    return { estado_sms: 'programado', enviado_em: null };
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between gap-2 flex-wrap">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
              <BellRing className="h-4 w-4 text-primary" />
            </div>
            <div>
              <CardTitle>Os seus lembretes</CardTitle>
              <CardDescription>
                Aviso por SMS enviado automaticamente antes de cada sessão
              </CardDescription>
            </div>
          </div>
          {serviceState === 'checking' && (
            <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
          )}
          {serviceState === 'unconfigured' && (
            <Badge variant="outline" className="bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300 border-amber-200 dark:border-amber-900">
              <Info className="h-3 w-3 mr-1" />
              Serviço de SMS não configurado
            </Badge>
          )}
          {serviceState === 'unavailable' && (
            <Badge variant="outline" className="bg-muted text-muted-foreground border-0">
              Estado indisponível
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {serviceState === 'unconfigured' && (
          <p className="text-xs text-muted-foreground mb-4">
            Os lembretes por SMS estão desativados nesta clínica. Continuará a receber os avisos no
            portal e por email quando aplicável.
          </p>
        )}
        {upcoming.length === 0 ? (
          <EmptyState
            icon={<Calendar className="h-10 w-10" />}
            title="Sem lembretes futuros"
            description="Assim que tiver sessões agendadas, o estado dos lembretes aparece aqui."
            className="py-6"
          />
        ) : (
          <div className="space-y-3">
            {upcoming.map((appointment) => {
              const state = getReminderState(appointment);
              return (
                <div
                  key={appointment.id}
                  className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 p-3 rounded-xl border border-border bg-muted/30"
                >
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-foreground truncate">{appointment.titulo}</p>
                    <p className="text-xs text-muted-foreground">
                      {format(parseLocalISO(appointment.data), "EEEE, d 'de' MMMM", { locale: pt })} às{' '}
                      {appointment.hora}
                      {state.enviado_em &&
                        ` · enviado em ${format(new Date(state.enviado_em), "d/M 'às' HH:mm")}`}
                    </p>
                  </div>
                  <Badge className={REMINDER_BADGE[state.estado_sms]}>
                    {REMINDER_LABEL[state.estado_sms]}
                  </Badge>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default ClientReminders;
