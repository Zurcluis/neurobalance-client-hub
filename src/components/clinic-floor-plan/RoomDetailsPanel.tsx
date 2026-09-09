import React, { useState, useEffect } from 'react';
import { RoomData, RoomStatus } from './types';
import {
  Clock,
  User,
  X,
  Play,
  Square,
  Sparkles,
  CheckCircle2,
  Wrench,
  Layers,
  CalendarClock
} from 'lucide-react';
import { CountdownTimer } from './CountdownTimer';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

interface AppointmentItem {
  id: string | number;
  data: string;
  hora: string;
  client_name: string;
  service_type?: string;
  therapist_name?: string;
  status?: string;
}

interface RoomDetailsPanelProps {
  room: RoomData | null;
  onClose: () => void;
  onUpdateRoom: (roomId: string, updates: Partial<RoomData>) => void;
}

const statusLabels: Record<RoomStatus, string> = {
  livre: 'Disponível',
  ocupada: 'Em Atendimento',
  a_terminar: 'A Terminar',
  atrasada: 'Sessão Excedida',
  higienizacao: 'Em Limpeza',
  indisponivel: 'Indisponível',
};

const statusDot: Record<RoomStatus, string> = {
  livre: 'bg-emerald-500',
  ocupada: 'bg-teal-600',
  a_terminar: 'bg-amber-500 animate-ping',
  atrasada: 'bg-red-500 animate-ping',
  higienizacao: 'bg-purple-500',
  indisponivel: 'bg-muted-foreground',
};

export const RoomDetailsPanel: React.FC<RoomDetailsPanelProps> = ({ room, onClose, onUpdateRoom }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [clientName, setClientName] = useState('');
  const [clientId, setClientId] = useState<number | undefined>(undefined);
  const [therapistName, setTherapistName] = useState('Bárbara Carvalho');
  const [sessionDurationMinutes, setSessionDurationMinutes] = useState<number>(60);
  const [sessionNotes, setSessionNotes] = useState('');

  const [ongoingClients, setOngoingClients] = useState<{ id: number, nome: string }[]>([]);
  const [todayAppointments, setTodayAppointments] = useState<AppointmentItem[]>([]);
  const [appointmentsLoading, setAppointmentsLoading] = useState(false);

  const isOccupied = room && (room.status === 'ocupada' || room.status === 'a_terminar' || room.status === 'atrasada');
  const isCleaning = room?.status === 'higienizacao';
  const isFree = room?.status === 'livre';

  useEffect(() => {
    if (room) {
      setClientName(room.currentClientName || '');
      setTherapistName(room.therapistName || 'Bárbara Carvalho');
      setSessionNotes(room.notes || '');
      setIsEditing(false);
    }
  }, [room]);

  const roomId = room?.roomId;

  useEffect(() => {
    const fetchData = async () => {
      if (!roomId || roomId === 'rececao') return;

      setAppointmentsLoading(true);

      try {
        const { data: clientsData, error: clientErr } = await supabase
          .from('clientes')
          .select('id, nome')
          .order('nome');

        if (!clientErr && clientsData) {
          setOngoingClients(clientsData);
        }

        const todayStr = new Date().toISOString().split('T')[0];
        const { data: apptData, error: apptErr } = await supabase
          .from('agendamentos')
          .select('id, data, hora, client_name, service_type, therapist_name, status')
          .eq('data', todayStr)
          .order('hora');

        if (!apptErr && apptData) {
          setTodayAppointments(apptData);
        }
      } catch (error) {
        console.error('Erro ao carregar dados da sala:', error);
      } finally {
        setAppointmentsLoading(false);
      }
    };

    fetchData();
  }, [roomId]);

  if (!room) {
    return (
      <Card className="h-full w-full border-dashed">
        <CardContent className="flex flex-col items-center justify-center p-8 text-center">
          <div className="h-14 w-14 rounded-xl bg-muted flex items-center justify-center mb-4">
            <Layers className="h-7 w-7 text-muted-foreground" />
          </div>
          <CardTitle className="text-base font-semibold">Nenhum Gabinete Selecionado</CardTitle>
          <p className="text-xs text-muted-foreground mt-1 max-w-[240px]">
            Clique em qualquer sala na planta interativa para ver os detalhes, gerir sessões ou iniciar atendimentos.
          </p>
        </CardContent>
      </Card>
    );
  }

  const handleStartSession = (customClient?: string, customTherapist?: string, duration?: number) => {
    const targetClient = customClient || clientName || 'Novo Cliente';
    const targetTherapist = customTherapist || therapistName || 'Bárbara Carvalho';
    const dur = duration || sessionDurationMinutes || 60;

    const start = new Date();
    const end = new Date(start.getTime() + dur * 60000);

    onUpdateRoom(room.roomId, {
      status: 'ocupada',
      sessionStart: start.toISOString(),
      sessionEnd: end.toISOString(),
      currentClientName: targetClient,
      currentClientId: clientId,
      therapistName: targetTherapist,
      notes: sessionNotes,
    });

    toast.success(`Sessão iniciada na ${room.roomName} (${dur} min) para ${targetClient}!`);
    setIsEditing(false);
  };

  const handleEndSession = (startCleaning = false) => {
    if (startCleaning) {
      const cleanEnd = new Date(new Date().getTime() + 10 * 60000);
      onUpdateRoom(room.roomId, {
        status: 'higienizacao',
        sessionStart: undefined,
        sessionEnd: undefined,
        currentClientName: undefined,
        currentClientId: undefined,
        therapistName: undefined,
        cleaningUntil: cleanEnd.toISOString(),
      });
      toast.info(`${room.roomName} em higienização (10 min).`);
    } else {
      onUpdateRoom(room.roomId, {
        status: 'livre',
        sessionStart: undefined,
        sessionEnd: undefined,
        currentClientName: undefined,
        currentClientId: undefined,
        therapistName: undefined,
        cleaningUntil: undefined,
      });
      toast.success(`${room.roomName} marcada como livre.`);
    }
  };

  const handleExtendTime = (minutes: number) => {
    if (room.sessionEnd) {
      const currentEnd = new Date(room.sessionEnd).getTime();
      const baseTime = currentEnd < new Date().getTime() ? new Date().getTime() : currentEnd;
      const newEnd = new Date(baseTime + minutes * 60000);

      onUpdateRoom(room.roomId, {
        status: 'ocupada',
        sessionEnd: newEnd.toISOString()
      });
      toast.success(`+${minutes} minutos adicionados à ${room.roomName}!`);
    }
  };

  const handleSaveDetails = () => {
    onUpdateRoom(room.roomId, {
      currentClientName: clientName,
      therapistName: therapistName,
      notes: sessionNotes,
    });
    setIsEditing(false);
    toast.success('Detalhes atualizados com sucesso!');
  };

  const setStatus = (status: RoomStatus) => {
    if (status === 'higienizacao') {
      const cleanEnd = new Date(new Date().getTime() + 10 * 60000);
      onUpdateRoom(room.roomId, { status, cleaningUntil: cleanEnd.toISOString() });
    } else {
      onUpdateRoom(room.roomId, { status });
    }
    toast.info(`Estado da ${room.roomName} alterado para ${statusLabels[status].toLowerCase()}.`);
  };

  return (
    <Card className="h-full flex flex-col shadow-md overflow-hidden">
      <CardHeader className="p-4 sm:p-5 pb-4 border-b bg-muted/50">
        <div className="flex items-center justify-between gap-2">
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <CardTitle className="text-base font-semibold truncate">{room.roomName}</CardTitle>
              {room.capacity && (
                <Badge variant="secondary" className="text-[10px] font-semibold shrink-0">
                  {room.capacity} lugares
                </Badge>
              )}
            </div>
            <p className="text-xs text-muted-foreground mt-0.5 truncate">{room.serviceType}</p>
          </div>

          <button
            onClick={onClose}
            aria-label="Fechar painel"
            className="p-2 text-muted-foreground hover:text-foreground hover:bg-muted rounded-full transition"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
      </CardHeader>

      <CardContent className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-5">
        <div className="flex items-center justify-between gap-2 bg-muted/50 p-3 rounded-lg border">
          <div className="flex items-center gap-2">
            <span className={cn('h-3 w-3 rounded-full', statusDot[room.status])} />
            <span className="text-xs font-semibold uppercase tracking-wider">
              {statusLabels[room.status]}
            </span>
          </div>

          {isOccupied && room.sessionEnd && (
            <CountdownTimer targetDate={room.sessionEnd} />
          )}

          {isCleaning && room.cleaningUntil && (
            <CountdownTimer targetDate={room.cleaningUntil} isCleaning={true} />
          )}
        </div>

        {room.equipment && room.equipment.length > 0 && (
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground mb-1.5 flex items-center gap-1">
              <Wrench className="h-3.5 w-3.5" />
              Equipamento & Recursos
            </p>
            <div className="flex flex-wrap gap-1.5">
              {room.equipment.map((eq, i) => (
                <span
                  key={i}
                  className="px-2.5 py-1 text-[11px] font-medium bg-muted text-foreground rounded-md border"
                >
                  {eq}
                </span>
              ))}
            </div>
          </div>
        )}

        {isOccupied && !isEditing && (
          <Card className="border-teal-200 dark:border-teal-900">
            <CardContent className="p-4 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-teal-700 dark:text-teal-300 uppercase tracking-wider">
                  Sessão em Curso
                </span>
                <button
                  onClick={() => setIsEditing(true)}
                  className="text-xs font-semibold text-primary hover:underline"
                >
                  Editar
                </button>
              </div>

              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm font-semibold">
                  <User className="h-4 w-4 text-teal-600" />
                  <span>{room.currentClientName || 'Cliente não identificado'}</span>
                </div>
                {room.therapistName && (
                  <div className="flex items-center gap-2 text-xs text-muted-foreground pl-6">
                    <span>Terapeuta: <strong className="font-semibold">{room.therapistName}</strong></span>
                  </div>
                )}
                {room.sessionStart && room.sessionEnd && (
                  <div className="flex items-center gap-2 text-xs text-muted-foreground pl-6">
                    <Clock className="h-3.5 w-3.5" />
                    <span className="tabular-nums">
                      {new Date(room.sessionStart).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      {' até '}
                      {new Date(room.sessionEnd).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                )}
              </div>

              <div className="pt-2 border-t">
                <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider mb-2">Prolongar tempo</p>
                <div className="grid grid-cols-3 gap-2">
                  {[5, 10, 15].map((m) => (
                    <Button
                      key={m}
                      variant="outline"
                      size="sm"
                      onClick={() => handleExtendTime(m)}
                      className="text-xs font-semibold tabular-nums"
                    >
                      +{m} min
                    </Button>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {(isFree || isEditing) && (
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-semibold">
                {isEditing ? 'Editar Dados da Consulta' : 'Iniciar Nova Sessão'}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="space-y-1.5">
                <Label htmlFor={`cliente-${room.roomId}`}>Cliente</Label>
                <select
                  id={`cliente-${room.roomId}`}
                  value={clientName}
                  onChange={(e) => {
                    const selected = ongoingClients.find(c => c.nome === e.target.value);
                    setClientName(e.target.value);
                    if (selected) setClientId(selected.id);
                  }}
                  className="h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  <option value="">Selecione um cliente...</option>
                  {ongoingClients.map(c => (
                    <option key={c.id} value={c.nome}>{c.nome}</option>
                  ))}
                </select>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor={`terapeuta-${room.roomId}`}>Profissional / Terapeuta</Label>
                <Input
                  id={`terapeuta-${room.roomId}`}
                  type="text"
                  value={therapistName}
                  onChange={(e) => setTherapistName(e.target.value)}
                  placeholder="Nome do terapeuta"
                />
              </div>

              {!isEditing && (
                <div className="space-y-1.5">
                  <Label>Duração Prevista</Label>
                  <div className="grid grid-cols-4 gap-1.5">
                    {[30, 45, 60, 90].map((d) => (
                      <button
                        key={d}
                        type="button"
                        onClick={() => setSessionDurationMinutes(d)}
                        className={cn(
                          'py-1.5 text-xs font-semibold rounded-md border transition tabular-nums',
                          sessionDurationMinutes === d
                            ? 'bg-primary text-primary-foreground border-primary'
                            : 'bg-background text-muted-foreground hover:bg-muted'
                        )}
                      >
                        {d} min
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <div className="pt-2 flex gap-2">
                {isEditing ? (
                  <>
                    <Button onClick={handleSaveDetails} className="flex-1">
                      Guardar
                    </Button>
                    <Button variant="outline" onClick={() => setIsEditing(false)}>
                      Cancelar
                    </Button>
                  </>
                ) : (
                  <Button
                    onClick={() => handleStartSession()}
                    className="w-full font-semibold gap-2"
                  >
                    <Play className="h-4 w-4" /> Iniciar Atendimento
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {isFree && (appointmentsLoading || todayAppointments.length > 0) && (
          <div className="space-y-2">
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center justify-between">
              <span>Consultas Agendadas para Hoje</span>
              <Badge variant="outline" className="text-[10px] tabular-nums">{todayAppointments.length}</Badge>
            </p>

            <div className="space-y-1.5 max-h-48 overflow-y-auto">
              {appointmentsLoading && (
                <div className="space-y-2">
                  {[0, 1, 2].map((i) => (
                    <Skeleton key={i} className="h-12 w-full rounded-lg" />
                  ))}
                </div>
              )}

              {!appointmentsLoading && todayAppointments.slice(0, 4).map((appt) => (
                <div
                  key={appt.id}
                  className="bg-card rounded-lg p-2.5 border flex items-center justify-between gap-2 hover:border-primary transition group"
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs font-semibold truncate">
                        {appt.client_name}
                      </span>
                    </div>
                    <p className="text-[10px] text-muted-foreground flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      <span className="tabular-nums">{appt.hora}</span>
                      <span className="truncate">• {appt.service_type || 'Sessão'}</span>
                    </p>
                  </div>

                  <Button
                    size="sm"
                    onClick={() => handleStartSession(appt.client_name, appt.therapist_name, 60)}
                    className="h-7 px-2.5 text-[11px] font-semibold gap-1"
                  >
                    Check-in
                  </Button>
                </div>
              ))}
            </div>
          </div>
        )}

        {isOccupied && (
          <div className="space-y-2 pt-2">
            <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
              <CalendarClock className="h-3.5 w-3.5" />
              Conclusão de Sessão
            </h4>
            <div className="grid grid-cols-2 gap-2">
              <Button
                variant="outline"
                onClick={() => handleEndSession(false)}
                className="w-full text-xs font-semibold"
              >
                <Square className="h-3.5 w-3.5" /> Terminar (Livre)
              </Button>
              <Button
                onClick={() => handleEndSession(true)}
                className="w-full text-xs font-semibold bg-purple-600 hover:bg-purple-700 text-white"
              >
                <Sparkles className="h-3.5 w-3.5" /> Higienizar (10m)
              </Button>
            </div>
          </div>
        )}

        {isCleaning && (
          <div className="pt-2">
            <Button
              onClick={() => setStatus('livre')}
              className="w-full font-semibold py-3 bg-emerald-600 hover:bg-emerald-700 text-white"
            >
              <CheckCircle2 className="h-4 w-4" /> Concluir Limpeza & Marcar Livre
            </Button>
          </div>
        )}

        {!isOccupied && (
          <div className="pt-2 border-t flex gap-2">
            {room.status === 'indisponivel' ? (
              <Button
                variant="outline"
                onClick={() => setStatus('livre')}
                className="w-full text-xs font-semibold text-emerald-700 hover:bg-emerald-50 dark:hover:bg-emerald-950/40"
              >
                Reativar Gabinete (Livre)
              </Button>
            ) : (
              <Button
                variant="ghost"
                onClick={() => setStatus('indisponivel')}
                className="w-full text-xs text-muted-foreground hover:text-foreground"
              >
                Marcar como Indisponível temporariamente
              </Button>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default RoomDetailsPanel;
