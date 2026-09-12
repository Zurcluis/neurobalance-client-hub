import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Calendar,
  CalendarPlus,
  CheckCircle2,
  Clock,
  Info,
  Loader2,
  Sparkles,
  User,
} from 'lucide-react';
import { addDays, format } from 'date-fns';
import { pt } from 'date-fns/locale';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { EmptyState } from '@/components/shared/EmptyState';
import { ConfirmDialog } from '@/components/shared/ConfirmDialog';
import { useClientAvailability } from '@/hooks/useClientAvailability';
import { useSuggestedAppointments } from '@/hooks/useSuggestedAppointments';
import { cn } from '@/lib/utils';
import { parseLocalISO } from '@/utils/dateUtils';
import {
  BOOKING_DAYS_AHEAD,
  SESSION_DURATION_MINUTES,
  appointmentOverlapsSlot,
  computeFreeSlotsForDate,
  isSlotWithinAvailability,
  mergeSuggestionSlots,
  toDateKey,
  type ClinicBusinessHours,
  type FreeSlot,
  type OccupiedAppointment,
} from './slotComputation';

interface SelfSchedulingPanelProps {
  clienteId: number;
  onOpenChat?: () => void;
  onBooked?: () => void;
}

type RpcFn = <T = unknown>(
  fn: string,
  args?: Record<string, unknown>
) => Promise<{ data: T | null; error: { message: string } | null }>;

const rpc = supabase.rpc as unknown as RpcFn;

const DAY_CHIP_LABELS = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];

const SelfSchedulingPanel: React.FC<SelfSchedulingPanelProps> = ({
  clienteId,
  onOpenChat,
  onBooked,
}) => {
  const { availabilities } = useClientAvailability(clienteId);
  const { suggestions, acceptSuggestion, linkToAppointment } = useSuggestedAppointments(clienteId);

  const [clinic, setClinic] = useState<ClinicBusinessHours | null>(null);
  const [occupied, setOccupied] = useState<OccupiedAppointment[]>([]);
  const [loadingData, setLoadingData] = useState(true);
  const [selectedDate, setSelectedDate] = useState<Date>(() => new Date());
  const [selectedSlot, setSelectedSlot] = useState<FreeSlot | null>(null);
  const [step, setStep] = useState<1 | 2>(1);
  const [notes, setNotes] = useState('');
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [lastBooked, setLastBooked] = useState<string | null>(null);

  const days = useMemo(() => {
    const today = new Date();
    return Array.from({ length: BOOKING_DAYS_AHEAD }, (_, i) => addDays(today, i));
  }, []);

  const fetchData = useCallback(async () => {
    if (!clienteId) return;
    setLoadingData(true);
    try {
      const todayKey = toDateKey(new Date());
      const maxKey = toDateKey(addDays(new Date(), BOOKING_DAYS_AHEAD));

      const [clinicResult, appointmentsResult] = await Promise.all([
        supabase
          .from('clinic_info')
          .select('horario_segunda_sexta, horario_sabado, horario_domingo')
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle(),
        supabase
          .from('agendamentos')
          .select('id, data, hora, estado')
          .eq('id_cliente', clienteId)
          .gte('data', todayKey)
          .lte('data', maxKey)
          .neq('estado', 'cancelado'),
      ]);

      if (clinicResult.data) {
        setClinic(clinicResult.data as ClinicBusinessHours);
      }
      setOccupied((appointmentsResult.data || []) as OccupiedAppointment[]);
    } catch {
      setClinic(null);
      setOccupied([]);
    } finally {
      setLoadingData(false);
    }
  }, [clienteId]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const activeSuggestions = useMemo(
    () => suggestions.filter((s) => s.status === 'pendente'),
    [suggestions]
  );

  const slotsByDay = useMemo(() => {
    const map = new Map<string, FreeSlot[]>();
    for (const day of days) {
      const key = toDateKey(day);
      const free = computeFreeSlotsForDate(day, clinic, availabilities, occupied);
      map.set(key, mergeSuggestionSlots(free, activeSuggestions, key));
    }
    return map;
  }, [days, clinic, availabilities, occupied, activeSuggestions]);

  const selectedKey = toDateKey(selectedDate);
  const daySlots = slotsByDay.get(selectedKey) || [];
  const totalSlots = Array.from(slotsByDay.values()).reduce((acc, slots) => acc + slots.length, 0);

  const handleSelectSlot = (slot: FreeSlot) => {
    setSelectedSlot(slot);
    setStep(2);
  };

  const validateSlot = useCallback(
    async (slot: FreeSlot): Promise<boolean> => {
      const { data: conflicts, error } = await supabase
        .from('agendamentos')
        .select('id, data, hora, estado')
        .eq('id_cliente', clienteId)
        .eq('data', slot.data)
        .neq('estado', 'cancelado');

      if (error) {
        toast.error('Não foi possível validar a disponibilidade. Tente novamente.');
        return false;
      }

      const conflictList = (conflicts || []) as OccupiedAppointment[];
      const hasConflict = conflictList.some((apt) =>
        appointmentOverlapsSlot(apt, slot.data, slot.hora, slot.horaFim)
      );

      if (hasConflict) {
        toast.error('Este horário já não está disponível. Escolha outro, por favor.');
        await fetchData();
        setStep(1);
        setSelectedSlot(null);
        return false;
      }

      const freshSlots = computeFreeSlotsForDate(
        parseLocalISO(slot.data),
        clinic,
        availabilities,
        conflictList
      );
      const withinAvailability = isSlotWithinAvailability(
        parseLocalISO(slot.data),
        clinic,
        availabilities,
        slot.hora,
        slot.horaFim
      );
      const stillFree = freshSlots.some((candidate) => candidate.hora === slot.hora);

      if (!stillFree && !withinAvailability) {
        toast.error('O horário escolhido já não está dentro da disponibilidade. Escolha outro.');
        await fetchData();
        setStep(1);
        setSelectedSlot(null);
        return false;
      }

      return true;
    },
    [clienteId, clinic, availabilities, fetchData]
  );

  const handleConfirm = useCallback(async () => {
    if (!selectedSlot || submitting) return;

    setSubmitting(true);
    try {
      const isValid = await validateSlot(selectedSlot);
      if (!isValid) return;

      const { data: inserted, error: insertError } = await supabase
        .from('agendamentos')
        .insert({
          titulo: 'Sessão',
          data: selectedSlot.data,
          hora: selectedSlot.hora,
          tipo: 'sessao',
          estado: 'pendente',
          id_cliente: clienteId,
          notas: notes.trim() || null,
        })
        .select('id')
        .single();

      if (insertError || !inserted) {
        throw insertError || new Error('Erro ao criar o agendamento');
      }

      const appointmentId = (inserted as { id: number }).id;

      if (selectedSlot.suggestionId) {
        await acceptSuggestion(selectedSlot.suggestionId);
        await linkToAppointment(selectedSlot.suggestionId, appointmentId);
      }

      await rpc('send_client_notification', {
        client_id: clienteId,
        notification_title: 'Pedido de agendamento',
        notification_message: `O cliente pediu agendamento para ${format(
          parseLocalISO(selectedSlot.data),
          "d 'de' MMMM",
          { locale: pt }
        )} às ${selectedSlot.hora} (aguardando confirmação).`,
        notification_type: 'appointment',
        expires_hours: 168,
      });

      toast.success('Pedido de agendamento enviado. A equipa irá confirmar.');
      setLastBooked(
        `${format(parseLocalISO(selectedSlot.data), "EEEE, d 'de' MMMM", { locale: pt })} às ${selectedSlot.hora}`
      );
      setSelectedSlot(null);
      setNotes('');
      setStep(1);
      await fetchData();
      onBooked?.();
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Erro desconhecido';
      toast.error(`Não foi possível concluir o agendamento: ${message}`);
    } finally {
      setSubmitting(false);
      setConfirmOpen(false);
    }
  }, [
    selectedSlot,
    submitting,
    validateSlot,
    clienteId,
    notes,
    acceptSuggestion,
    linkToAppointment,
    fetchData,
    onBooked,
  ]);

  const renderStepOne = () => (
    <div className="space-y-4">
      {lastBooked && (
        <Alert className="border-primary/30 bg-primary/5">
          <CheckCircle2 className="h-4 w-4 text-primary" />
          <AlertDescription className="text-sm text-foreground">
            Pedido enviado para {lastBooked}. Irá constar nos seus agendamentos como pendente até
            confirmação da equipa.
          </AlertDescription>
        </Alert>
      )}

      <div className="flex gap-2 overflow-x-auto pb-1 -mx-1 px-1">
        {days.map((day) => {
          const key = toDateKey(day);
          const count = (slotsByDay.get(key) || []).length;
          const isSelected = key === selectedKey;
          return (
            <button
              key={key}
              type="button"
              onClick={() => setSelectedDate(day)}
              disabled={count === 0}
              aria-pressed={isSelected}
              className={cn(
                'flex flex-col items-center justify-center min-w-[52px] h-[64px] rounded-xl border transition-colors flex-shrink-0',
                isSelected
                  ? 'bg-primary text-primary-foreground border-primary'
                  : 'bg-card text-foreground border-border hover:bg-muted',
                count === 0 && 'opacity-40 cursor-not-allowed'
              )}
            >
              <span className="text-[10px] uppercase font-medium">
                {DAY_CHIP_LABELS[day.getDay()]}
              </span>
              <span className="text-lg font-bold leading-tight">{format(day, 'd')}</span>
              <span className="text-[10px]">{count > 0 ? `${count} livres` : '—'}</span>
            </button>
          );
        })}
      </div>

      {loadingData ? (
        <div className="flex items-center justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin text-primary" />
        </div>
      ) : daySlots.length === 0 ? (
        <EmptyState
          icon={<Calendar className="h-10 w-10" />}
          title="Sem horários livres neste dia"
          description="Escolha outro dia no calendário ou contacte a equipa para combinar um horário."
          className="py-6"
          action={
            onOpenChat
              ? { label: 'Falar com a equipa', onClick: onOpenChat }
              : undefined
          }
        />
      ) : (
        <div>
          <p className="text-sm font-medium text-foreground mb-2">
            {format(selectedDate, "EEEE, d 'de' MMMM", { locale: pt })}
          </p>
          <div className="grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-5 gap-2">
            {daySlots.map((slot) => (
              <button
                key={`${slot.hora}-${slot.origem}`}
                type="button"
                onClick={() => handleSelectSlot(slot)}
                className={cn(
                  'flex flex-col items-center justify-center min-h-[56px] rounded-xl border px-2 py-2 transition-colors',
                  'border-border bg-card hover:bg-primary/10 hover:border-primary/40'
                )}
                aria-label={`Marcar às ${slot.hora}`}
              >
                <span className="text-sm font-semibold text-foreground">{slot.hora}</span>
                <span className="text-[10px] text-muted-foreground">
                  {slot.origem === 'sugestao' ? 'Sugerido' : 'Livre'}
                </span>
              </button>
            ))}
          </div>
          <div className="flex items-center gap-4 mt-3 text-xs text-muted-foreground">
            <span className="flex items-center gap-1">
              <Clock className="h-3 w-3" /> Sessões de {SESSION_DURATION_MINUTES} minutos
            </span>
            <span className="flex items-center gap-1">
              <Sparkles className="h-3 w-3" /> Sugerido pela equipa
            </span>
          </div>
        </div>
      )}
    </div>
  );

  const renderStepTwo = () => {
    if (!selectedSlot) return null;
    return (
      <div className="space-y-4">
        <div className="rounded-xl border border-border bg-muted/40 p-4 space-y-3">
          <div className="flex items-center justify-between gap-2">
            <span className="text-sm font-medium text-muted-foreground">Resumo do agendamento</span>
            <Badge variant="outline" className="bg-primary/10 text-primary border-primary/20">
              Passo 2 de 2
            </Badge>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-primary flex-shrink-0" />
              <span className="font-medium text-foreground">
                {format(parseLocalISO(selectedSlot.data), "EEEE, d 'de' MMMM 'de' yyyy", { locale: pt })}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-primary flex-shrink-0" />
              <span className="font-medium text-foreground">
                {selectedSlot.hora} - {selectedSlot.horaFim}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <User className="h-4 w-4 text-primary flex-shrink-0" />
              <span className="font-medium text-foreground">Sessão de Neurofeedback</span>
            </div>
            <div className="flex items-center gap-2">
              <Info className="h-4 w-4 text-primary flex-shrink-0" />
              <span className="font-medium text-foreground">
                {selectedSlot.origem === 'sugestao'
                  ? 'Horário sugerido pela equipa'
                  : 'Horário livre da clínica'}
              </span>
            </div>
          </div>
          {selectedSlot.origem === 'sugestao' && (
            <p className="text-xs text-muted-foreground flex items-center gap-1">
              <Sparkles className="h-3 w-3" /> Ao confirmar, a sugestão da equipa será vinculada a
              este agendamento.
            </p>
          )}
        </div>

        <div>
          <label htmlFor="self-scheduling-notes" className="text-sm font-medium text-foreground">
            Notas (opcional)
          </label>
          <Textarea
            id="self-scheduling-notes"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Alguma informação que a equipa deva saber..."
            className="mt-1 min-h-[80px]"
            maxLength={500}
          />
        </div>

        <div className="flex flex-col sm:flex-row gap-2">
          <Button
            variant="outline"
            className="sm:flex-1 h-11 rounded-xl"
            onClick={() => {
              setStep(1);
              setSelectedSlot(null);
            }}
            disabled={submitting}
          >
            Escolher outro horário
          </Button>
          <Button className="sm:flex-1 h-11 rounded-xl" onClick={() => setConfirmOpen(true)} disabled={submitting}>
            {submitting ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <CheckCircle2 className="h-4 w-4 mr-2" />}
            Confirmar pedido
          </Button>
        </div>
      </div>
    );
  };

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
              <CalendarPlus className="h-4 w-4 text-primary" />
            </div>
            Marcar Nova Sessão
          </CardTitle>
          <CardDescription>
            Escolha um horário livre a partir da disponibilidade da clínica. O pedido fica pendente
            até confirmação da equipa.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {step === 1 ? renderStepOne() : renderStepTwo()}
          {!loadingData && totalSlots === 0 && step === 1 && (
            <p className="text-xs text-muted-foreground mt-4">
              Não existem horários livres nos próximos {BOOKING_DAYS_AHEAD} dias.
            </p>
          )}
        </CardContent>
      </Card>

      <ConfirmDialog
        open={confirmOpen}
        onOpenChange={setConfirmOpen}
        onConfirm={handleConfirm}
        title="Confirmar agendamento"
        description={
          selectedSlot
            ? `Sessão a ${format(parseLocalISO(selectedSlot.data), "d 'de' MMMM", {
                locale: pt,
              })} às ${selectedSlot.hora}. O agendamento será criado com estado pendente e a equipa irá confirmá-lo.`
            : ''
        }
        confirmText="Confirmar pedido"
        cancelText="Rever escolha"
        variant="info"
      />
    </>
  );
};

export default SelfSchedulingPanel;
