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
  Layers
} from 'lucide-react';
import { CountdownTimer } from './CountdownTimer';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
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

export const RoomDetailsPanel: React.FC<RoomDetailsPanelProps> = ({ room, onClose, onUpdateRoom }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [clientName, setClientName] = useState('');
  const [clientId, setClientId] = useState<number | undefined>(undefined);
  const [therapistName, setTherapistName] = useState('Bárbara Carvalho');
  const [sessionDurationMinutes, setSessionDurationMinutes] = useState<number>(60);
  const [sessionNotes, setSessionNotes] = useState('');
  
  const [ongoingClients, setOngoingClients] = useState<{ id: number, nome: string }[]>([]);
  const [todayAppointments, setTodayAppointments] = useState<AppointmentItem[]>([]);

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

  // Fetch today's clients & appointments
  useEffect(() => {
    const fetchData = async () => {
      if (!roomId || roomId === 'rececao') return;

      try {
        // Fetch active clients
        const { data: clientsData, error: clientErr } = await supabase
          .from('clientes')
          .select('id, nome')
          .order('nome');

        if (!clientErr && clientsData) {
          setOngoingClients(clientsData);
        }

        // Fetch today's appointments
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
      }
    };

    fetchData();
  }, [roomId]);

  if (!room) {
    return (
      <div className="h-full w-full flex flex-col items-center justify-center bg-white/60 dark:bg-gray-800/60 backdrop-blur-md border border-gray-200/80 dark:border-gray-700/80 rounded-3xl p-8 text-center text-gray-400">
        <div className="w-16 h-16 rounded-2xl bg-gray-100 dark:bg-gray-700 flex items-center justify-center mb-4">
          <Layers className="w-8 h-8 text-gray-400" />
        </div>
        <h3 className="text-base font-bold text-gray-700 dark:text-gray-200">Nenhum Gabinete Selecionado</h3>
        <p className="text-xs text-gray-500 mt-1 max-w-[240px]">
          Clique em qualquer sala na planta interativa para ver os detalhes, gerir sessões ou iniciar atendimentos.
        </p>
      </div>
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
    toast.info(`Estado da ${room.roomName} alterado para ${status}.`);
  };

  return (
    <div className="h-full flex flex-col bg-white/95 dark:bg-gray-800/95 backdrop-blur-xl border border-gray-200/80 dark:border-gray-700/80 rounded-3xl shadow-xl overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between p-4 sm:p-5 border-b border-gray-100 dark:border-gray-700/60 bg-gray-50/70 dark:bg-gray-900/40">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-black text-gray-900 dark:text-white tracking-tight">{room.roomName}</h2>
            {room.capacity && (
              <Badge variant="secondary" className="text-[10px] font-bold">
                {room.capacity} Lugares
              </Badge>
            )}
          </div>
          <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 mt-0.5">{room.serviceType}</p>
        </div>

        <button 
          onClick={onClose} 
          className="p-2 text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 hover:bg-gray-200/60 dark:hover:bg-gray-700 rounded-full transition"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-5">
        {/* Status Badge & Live Timer Header */}
        <div className="flex items-center justify-between gap-2 bg-gray-50 dark:bg-gray-900/60 p-3 rounded-2xl border border-gray-200/60 dark:border-gray-700/60">
          <div className="flex items-center gap-2">
            <span className={`w-3 h-3 rounded-full ${
              room.status === 'livre' ? 'bg-emerald-500' :
              room.status === 'ocupada' ? 'bg-[#3f9094]' :
              room.status === 'a_terminar' ? 'bg-amber-500 animate-ping' :
              room.status === 'atrasada' ? 'bg-red-500 animate-ping' :
              room.status === 'higienizacao' ? 'bg-purple-500' : 'bg-gray-400'
            }`} />
            <span className="text-xs font-black uppercase tracking-wider text-gray-800 dark:text-gray-200">
              {room.status === 'livre' ? 'Disponível' :
               room.status === 'ocupada' ? 'Em Atendimento' :
               room.status === 'a_terminar' ? 'A Terminar' :
               room.status === 'atrasada' ? 'Sessão Excedida' :
               room.status === 'higienizacao' ? 'Em Limpeza' : 'Indisponível'}
            </span>
          </div>

          {isOccupied && room.sessionEnd && (
            <CountdownTimer targetDate={room.sessionEnd} />
          )}

          {isCleaning && room.cleaningUntil && (
            <CountdownTimer targetDate={room.cleaningUntil} isCleaning={true} />
          )}
        </div>

        {/* Equipment & Features in this Room */}
        {room.equipment && room.equipment.length > 0 && (
          <div>
            <p className="text-[11px] font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-1.5 flex items-center gap-1">
              <Wrench className="w-3.5 h-3.5" />
              Equipamento & Recursos
            </p>
            <div className="flex flex-wrap gap-1.5">
              {room.equipment.map((eq, i) => (
                <span 
                  key={i} 
                  className="px-2.5 py-1 text-[11px] font-semibold bg-gray-100 dark:bg-gray-700/60 text-gray-700 dark:text-gray-300 rounded-lg border border-gray-200/60 dark:border-gray-600/60"
                >
                  {eq}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Active Session Info Card */}
        {isOccupied && !isEditing && (
          <div className="bg-cyan-50/50 dark:bg-cyan-950/20 rounded-2xl p-4 border border-cyan-200/80 dark:border-cyan-800/60 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-[#265255] dark:text-cyan-300 uppercase tracking-wider">
                Sessão em Curso
              </span>
              <button 
                onClick={() => setIsEditing(true)} 
                className="text-xs font-bold text-[#3f9094] hover:underline"
              >
                Editar
              </button>
            </div>

            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm font-bold text-gray-900 dark:text-white">
                <User className="w-4 h-4 text-[#3f9094]" />
                <span>{room.currentClientName || 'Cliente não identificado'}</span>
              </div>
              {room.therapistName && (
                <div className="flex items-center gap-2 text-xs text-gray-600 dark:text-gray-300 pl-6">
                  <span>Terapeuta: <strong>{room.therapistName}</strong></span>
                </div>
              )}
              {room.sessionStart && room.sessionEnd && (
                <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400 pl-6">
                  <Clock className="w-3.5 h-3.5 text-gray-400" />
                  <span>
                    {new Date(room.sessionStart).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    {' até '}
                    {new Date(room.sessionEnd).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
              )}
            </div>

            {/* Quick Extension Buttons */}
            <div className="pt-2 border-t border-cyan-100 dark:border-cyan-900/60">
              <p className="text-[11px] font-bold text-gray-500 uppercase tracking-wider mb-2">Prolongar Tempo:</p>
              <div className="grid grid-cols-3 gap-2">
                <button
                  onClick={() => handleExtendTime(5)}
                  className="py-1.5 px-2 text-xs font-bold bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200 rounded-xl border border-gray-200 dark:border-gray-700 hover:bg-gray-50 transition shadow-2xs"
                >
                  +5 min
                </button>
                <button
                  onClick={() => handleExtendTime(10)}
                  className="py-1.5 px-2 text-xs font-bold bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200 rounded-xl border border-gray-200 dark:border-gray-700 hover:bg-gray-50 transition shadow-2xs"
                >
                  +10 min
                </button>
                <button
                  onClick={() => handleExtendTime(15)}
                  className="py-1.5 px-2 text-xs font-bold bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200 rounded-xl border border-gray-200 dark:border-gray-700 hover:bg-gray-50 transition shadow-2xs"
                >
                  +15 min
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Start Session / Edit Form */}
        {(isFree || isEditing) && (
          <div className="bg-gray-50 dark:bg-gray-900/40 rounded-2xl p-4 border border-gray-200/80 dark:border-gray-700/80 space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-gray-700 dark:text-gray-300">
              {isEditing ? 'Editar Dados da Consulta' : 'Iniciar Nova Sessão'}
            </h3>

            {/* Client selector or input */}
            <div>
              <label className="text-xs font-semibold text-gray-600 dark:text-gray-400">Cliente</label>
              <div className="relative mt-1">
                <select
                  value={clientName}
                  onChange={(e) => {
                    const selected = ongoingClients.find(c => c.nome === e.target.value);
                    setClientName(e.target.value);
                    if (selected) setClientId(selected.id);
                  }}
                  className="w-full px-3 py-2 text-sm bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-[#3f9094] outline-none"
                >
                  <option value="">Selecione um cliente...</option>
                  {ongoingClients.map(c => (
                    <option key={c.id} value={c.nome}>{c.nome}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Therapist */}
            <div>
              <label className="text-xs font-semibold text-gray-600 dark:text-gray-400">Profissional / Terapeuta</label>
              <input
                type="text"
                value={therapistName}
                onChange={(e) => setTherapistName(e.target.value)}
                placeholder="Nome da terapeuta"
                className="w-full mt-1 px-3 py-2 text-sm bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-[#3f9094] outline-none"
              />
            </div>

            {/* Duration Selector */}
            {!isEditing && (
              <div>
                <label className="text-xs font-semibold text-gray-600 dark:text-gray-400">Duração Prevista</label>
                <div className="grid grid-cols-4 gap-1.5 mt-1">
                  {[30, 45, 60, 90].map((d) => (
                    <button
                      key={d}
                      type="button"
                      onClick={() => setSessionDurationMinutes(d)}
                      className={`py-1.5 text-xs font-bold rounded-xl border transition ${
                        sessionDurationMinutes === d
                          ? 'bg-[#3f9094] text-white border-[#3f9094]'
                          : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border-gray-200 dark:border-gray-700 hover:bg-gray-100'
                      }`}
                    >
                      {d} min
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Form actions */}
            <div className="pt-2 flex gap-2">
              {isEditing ? (
                <>
                  <Button onClick={handleSaveDetails} className="flex-1 bg-[#3f9094] hover:bg-[#265255] text-white rounded-xl">
                    Guardar
                  </Button>
                  <Button variant="outline" onClick={() => setIsEditing(false)} className="rounded-xl">
                    Cancelar
                  </Button>
                </>
              ) : (
                <Button 
                  onClick={() => handleStartSession()} 
                  className="w-full bg-[#3f9094] hover:bg-[#265255] text-white rounded-xl py-5 font-bold shadow-md flex items-center justify-center gap-2"
                >
                  <Play className="w-4 h-4 fill-white" /> Iniciar Atendimento
                </Button>
              )}
            </div>
          </div>
        )}

        {/* 1-Click Check-in from Today's Schedule */}
        {isFree && todayAppointments.length > 0 && (
          <div className="space-y-2">
            <p className="text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400 flex items-center justify-between">
              <span>Consultas Agendadas para Hoje</span>
              <Badge variant="outline" className="text-[10px]">{todayAppointments.length}</Badge>
            </p>

            <div className="space-y-1.5 max-h-48 overflow-y-auto">
              {todayAppointments.slice(0, 4).map((appt) => (
                <div 
                  key={appt.id}
                  className="bg-white dark:bg-gray-800 rounded-xl p-2.5 border border-gray-200 dark:border-gray-700 flex items-center justify-between gap-2 hover:border-[#3f9094] transition group"
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs font-bold text-gray-900 dark:text-white truncate">
                        {appt.client_name}
                      </span>
                    </div>
                    <p className="text-[10px] text-gray-500 dark:text-gray-400">
                      ⏰ {appt.hora} • {appt.service_type || 'Sessão'}
                    </p>
                  </div>

                  <Button
                    size="sm"
                    onClick={() => handleStartSession(appt.client_name, appt.therapist_name, 60)}
                    className="h-7 px-2.5 text-[11px] font-bold bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg"
                  >
                    Check-in
                  </Button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Action Buttons for Finished Session / Cleaning */}
        {isOccupied && (
          <div className="space-y-2 pt-2">
            <h4 className="text-xs font-bold uppercase tracking-wider text-gray-500">Conclusão de Sessão:</h4>
            <div className="grid grid-cols-2 gap-2">
              <Button
                variant="outline"
                onClick={() => handleEndSession(false)}
                className="w-full text-xs font-bold text-gray-700 dark:text-gray-200 border-gray-300 dark:border-gray-600 rounded-xl hover:bg-gray-100"
              >
                <Square className="w-3.5 h-3.5 mr-1.5" /> Terminar (Livre)
              </Button>
              <Button
                onClick={() => handleEndSession(true)}
                className="w-full text-xs font-bold bg-purple-600 hover:bg-purple-700 text-white rounded-xl shadow-sm"
              >
                <Sparkles className="w-3.5 h-3.5 mr-1.5" /> Higienizar (10m)
              </Button>
            </div>
          </div>
        )}

        {/* Cleaning State Actions */}
        {isCleaning && (
          <div className="pt-2">
            <Button
              onClick={() => setStatus('livre')}
              className="w-full bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold py-3"
            >
              <CheckCircle2 className="w-4 h-4 mr-2" /> Concluir Limpeza & Marcar Livre
            </Button>
          </div>
        )}

        {/* Change Status to Indisponível / Livre */}
        {!isOccupied && (
          <div className="pt-2 border-t border-gray-100 dark:border-gray-700/60 flex gap-2">
            {room.status === 'indisponivel' ? (
              <Button
                variant="outline"
                onClick={() => setStatus('livre')}
                className="w-full text-xs font-bold rounded-xl text-emerald-600 hover:bg-emerald-50"
              >
                Reativar Gabinete (Livre)
              </Button>
            ) : (
              <Button
                variant="ghost"
                onClick={() => setStatus('indisponivel')}
                className="w-full text-xs text-gray-500 hover:text-gray-700 rounded-xl"
              >
                Marcar como Indisponível temporariamente
              </Button>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default RoomDetailsPanel;
