import React, { useMemo } from 'react';
import { format } from 'date-fns';
import { pt } from 'date-fns/locale';
import { CalendarClock, UserPlus, Users } from 'lucide-react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '../ui/dialog';
import { Button } from '../ui/button';
import { suggestWaitlistCandidates } from '@/utils/slotSuggestions';
import type { AppointmentLike, ClientLike } from '@/utils/slotSuggestions';

export interface WaitlistSlot {
  dateStr: string;
  hora: string;
  tipo: string;
}

interface WaitlistFillPanelProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  slot: WaitlistSlot | null;
  appointments: AppointmentLike[];
  clients: ClientLike[];
  isCreating?: boolean;
  onCreate: (client: ClientLike) => void;
}

const WaitlistFillPanel: React.FC<WaitlistFillPanelProps> = ({
  open,
  onOpenChange,
  slot,
  appointments,
  clients,
  isCreating = false,
  onCreate,
}) => {
  const candidates = useMemo(() => {
    if (!slot || !open) return [];
    const slotDate = new Date(`${slot.dateStr}T00:00:00`);
    if (Number.isNaN(slotDate.getTime())) return [];
    return suggestWaitlistCandidates({
      clients,
      appointments,
      slotDate,
      slotType: slot.tipo,
      max: 5,
    });
  }, [slot, open, clients, appointments]);

  if (!slot) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[520px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Preencher com lista de espera
          </DialogTitle>
          <DialogDescription>
            Vaga livre: {format(new Date(`${slot.dateStr}T00:00:00`), "eeee, dd 'de' MMMM", { locale: pt })} às {slot.hora} ({slot.tipo})
          </DialogDescription>
        </DialogHeader>

        {candidates.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-2 rounded-md border border-border bg-muted/40 py-8 text-center">
            <CalendarClock className="h-8 w-8 text-muted-foreground" />
            <p className="text-sm font-medium">Sem candidatos compatíveis</p>
            <p className="max-w-[320px] text-xs text-muted-foreground">
              Nenhum cliente com histórico deste tipo de sessão está livre na semana da vaga.
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            <p className="text-xs text-muted-foreground">
              Clientes com histórico de {slot.tipo} e sem sessão marcada nessa semana, ordenados por histórico:
            </p>
            {candidates.map((candidate) => (
              <div
                key={candidate.client.id}
                className="flex flex-col gap-2 rounded-md border border-border p-3 sm:flex-row sm:items-center sm:justify-between"
              >
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium">
                    {candidate.client.id_manual ? `[${candidate.client.id_manual}] ` : ''}
                    {candidate.client.nome}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {candidate.matchingCount} {candidate.matchingCount === 1 ? 'sessão anterior' : 'sessões anteriores'}
                    {candidate.lastSessionDate &&
                      ` · última em ${format(candidate.lastSessionDate, 'dd/MM/yyyy', { locale: pt })}`}
                  </p>
                </div>
                <Button
                  size="sm"
                  className="shrink-0"
                  disabled={isCreating}
                  onClick={() => onCreate(candidate.client)}
                >
                  <UserPlus className="h-4 w-4 mr-1" />
                  Agendar
                </Button>
              </div>
            ))}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default WaitlistFillPanel;
