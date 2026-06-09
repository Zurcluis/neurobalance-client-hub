import React, { useState, useEffect } from 'react';
import { RoomData, RoomStatus } from './types';
import { Clock, User, Calendar, X, Play, Square, MoreHorizontal, Loader2 } from 'lucide-react';
import { CountdownTimer } from './CountdownTimer';
import { supabase } from '@/integrations/supabase/client';

interface RoomDetailsPanelProps {
  room: RoomData | null;
  onClose: () => void;
  onUpdateRoom: (roomId: string, updates: Partial<RoomData>) => void;
}

export const RoomDetailsPanel: React.FC<RoomDetailsPanelProps> = ({ room, onClose, onUpdateRoom }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [clientName, setClientName] = useState('');
  const [therapistName, setTherapistName] = useState('');
  const [ongoingClients, setOngoingClients] = useState<{ id: number, nome: string }[]>([]);
  const [loadingClients, setLoadingClients] = useState(false);

  const isOccupied = room && (room.status === 'ocupada' || room.status === 'a_terminar' || room.status === 'atrasada');
  const showForm = isEditing || (!isOccupied && room?.status !== 'indisponivel');

  // Determinar se a sala atual permite a seleção de clientes da base de dados
  const isSelectableRoom = room && (
    room.serviceType.toLowerCase().includes('avaliação') || 
    room.serviceType.toLowerCase().includes('neurofeedback') ||
    room.serviceType.toLowerCase().includes('consulta')
  );

  useEffect(() => {
    if (room) {
      setClientName(room.currentClientName || '');
      setTherapistName(room.therapistName || '');
      setIsEditing(false);
    }
  }, [room]);

  useEffect(() => {
    if (showForm && isSelectableRoom) {
      const fetchClients = async () => {
        setLoadingClients(true);
        try {
          const { data, error } = await supabase
            .from('clientes')
            .select('id, nome')
            .eq('estado', 'ongoing')
            .order('nome');
          
          if (error) throw error;
          setOngoingClients(data || []);
        } catch (error) {
          console.error('Erro ao buscar clientes:', error);
        } finally {
          setLoadingClients(false);
        }
      };
      fetchClients();
    }
  }, [isEditing, isSelectableRoom]);

  if (!room) {
    return (
      <div className="h-full w-full flex items-center justify-center bg-slate-50 border border-slate-200 rounded-2xl p-8 text-center text-slate-400">
        <p>Selecione uma sala na planta para ver os detalhes e gerir o estado.</p>
      </div>
    );
  }

  const handleStartSession = () => {
    const start = new Date();
    const end = new Date(start.getTime() + 60 * 60000); // +1 hour by default
    onUpdateRoom(room.roomId, {
      status: 'ocupada',
      sessionStart: start.toISOString(),
      sessionEnd: end.toISOString(),
      currentClientName: clientName || 'Novo Cliente',
      therapistName: therapistName || 'Profissional',
    });
  };

  const handleEndSession = () => {
    onUpdateRoom(room.roomId, {
      status: 'livre',
      sessionStart: undefined,
      sessionEnd: undefined,
      currentClientName: undefined,
      therapistName: undefined,
    });
  };

  const handleExtendTime = (minutes: number) => {
    if (room.sessionEnd) {
      const newEnd = new Date(new Date(room.sessionEnd).getTime() + minutes * 60000);
      onUpdateRoom(room.roomId, { sessionEnd: newEnd.toISOString() });
    }
  };

  const handleSaveDetails = () => {
    onUpdateRoom(room.roomId, {
      currentClientName: clientName,
      therapistName: therapistName,
    });
    setIsEditing(false);
  };

  const setStatus = (status: RoomStatus) => {
    onUpdateRoom(room.roomId, { status });
  };

  return (
    <div className="h-full flex flex-col bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
      <div className="flex items-center justify-between p-5 border-b border-slate-100 bg-slate-50/50">
        <div>
          <h2 className="text-xl font-bold text-slate-800">{room.roomName}</h2>
          <p className="text-sm text-slate-500 font-medium">{room.serviceType}</p>
        </div>
        <button onClick={onClose} className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition-colors md:hidden">
          <X className="w-5 h-5" />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-5 space-y-6">
        {/* Status Header */}
        <div className="flex items-center gap-3">
          <div className={`px-3 py-1.5 rounded-md text-sm font-bold uppercase tracking-wider flex items-center gap-2
            ${room.status === 'livre' ? 'bg-[#e2f1e2] text-[#2e7d32]' : ''}
            ${room.status === 'ocupada' ? 'bg-[#e0f2f3] text-[#265255]' : ''}
            ${room.status === 'a_terminar' ? 'bg-[#fff4e5] text-[#e65100]' : ''}
            ${room.status === 'atrasada' ? 'bg-[#ffebee] text-[#c62828]' : ''}
            ${room.status === 'indisponivel' ? 'bg-slate-200 text-slate-600' : ''}
          `}>
            {room.status.replace('_', ' ')}
          </div>
          {isOccupied && room.sessionEnd && (
            <CountdownTimer targetDate={room.sessionEnd} />
          )}
        </div>

        {/* Current Details */}
        <div className="bg-slate-50 rounded-xl p-4 border border-slate-100 space-y-3">
          {showForm ? (
            <div className="space-y-3">
              <div>
                <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Cliente Atual</label>
                {isSelectableRoom ? (
                  <div className="relative">
                    <select
                      value={clientName}
                      onChange={(e) => setClientName(e.target.value)}
                      disabled={loadingClients}
                      className="w-full mt-1 px-3 py-2 border border-slate-300 rounded-md text-sm focus:ring-2 focus:ring-[#3f9094] focus:border-transparent outline-none appearance-none disabled:bg-slate-100 disabled:text-slate-400"
                    >
                      <option value="">Selecione um cliente (Go On)</option>
                      {ongoingClients.map(client => (
                        <option key={client.id} value={client.nome}>
                          {client.nome}
                        </option>
                      ))}
                    </select>
                    {loadingClients && (
                      <Loader2 className="absolute right-3 top-[14px] w-4 h-4 animate-spin text-slate-400" />
                    )}
                  </div>
                ) : (
                  <input 
                    type="text" 
                    value={clientName} 
                    onChange={(e) => setClientName(e.target.value)}
                    className="w-full mt-1 px-3 py-2 border border-slate-300 rounded-md text-sm focus:ring-2 focus:ring-[#3f9094] focus:border-transparent outline-none"
                    placeholder="Nome do cliente"
                  />
                )}
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Profissional</label>
                <input 
                  type="text" 
                  value={therapistName} 
                  onChange={(e) => setTherapistName(e.target.value)}
                  className="w-full mt-1 px-3 py-2 border border-slate-300 rounded-md text-sm focus:ring-2 focus:ring-[#3f9094] focus:border-transparent outline-none"
                  placeholder="Nome do profissional"
                />
              </div>
              {isOccupied && (
                <div className="flex gap-2 pt-2">
                  <button onClick={handleSaveDetails} className="flex-1 bg-[#3f9094] text-white py-2 rounded-md text-sm font-medium hover:bg-[#265255] transition-colors">Guardar</button>
                  <button onClick={() => setIsEditing(false)} className="flex-1 bg-white border border-slate-300 text-slate-700 py-2 rounded-md text-sm font-medium hover:bg-slate-50 transition-colors">Cancelar</button>
                </div>
              )}
            </div>
          ) : (
            <>
              <div className="flex items-start gap-3">
                <User className="w-5 h-5 text-slate-400 mt-0.5" />
                <div>
                  <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Cliente Atual</p>
                  <p className="font-medium text-slate-800">{room.currentClientName || '-'}</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Calendar className="w-5 h-5 text-slate-400 mt-0.5" />
                <div>
                  <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Profissional</p>
                  <p className="font-medium text-slate-800">{room.therapistName || '-'}</p>
                </div>
              </div>
              {isOccupied && (
                <div className="flex items-start gap-3">
                  <Clock className="w-5 h-5 text-slate-400 mt-0.5" />
                  <div>
                    <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Horário da Sessão</p>
                    <p className="font-medium text-slate-800 text-sm">
                      {room.sessionStart ? new Date(room.sessionStart).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) : '-'} 
                      {' até '}
                      {room.sessionEnd ? new Date(room.sessionEnd).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) : '-'}
                    </p>
                  </div>
                </div>
              )}
              {isOccupied && (
                <button 
                  onClick={() => setIsEditing(true)}
                  className="text-sm text-[#3f9094] font-medium hover:underline mt-2 inline-block"
                >
                  Editar detalhes
                </button>
              )}
            </>
          )}
        </div>

        {/* Actions */}
        <div className="space-y-3">
          <h3 className="text-sm font-bold text-slate-800 border-b border-slate-100 pb-2">Ações Rápidas</h3>
          
          <div className="grid grid-cols-2 gap-2">
            {!isOccupied && room.status !== 'indisponivel' ? (
              <button onClick={handleStartSession} className="col-span-2 flex items-center justify-center gap-2 bg-[#3f9094] hover:bg-[#265255] text-white py-3 rounded-lg font-medium transition-colors shadow-sm">
                <Play className="w-4 h-4" /> Iniciar Sessão
              </button>
            ) : isOccupied ? (
              <button onClick={handleEndSession} className="col-span-2 flex items-center justify-center gap-2 bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 py-3 rounded-lg font-medium transition-colors shadow-sm">
                <Square className="w-4 h-4" /> Terminar Sessão
              </button>
            ) : null}

            {isOccupied && (
              <>
                <button onClick={() => handleExtendTime(5)} className="bg-slate-100 hover:bg-slate-200 text-slate-700 py-2 rounded-md text-sm font-medium transition-colors">
                  +5 Minutos
                </button>
                <button onClick={() => handleExtendTime(10)} className="bg-slate-100 hover:bg-slate-200 text-slate-700 py-2 rounded-md text-sm font-medium transition-colors">
                  +10 Minutos
                </button>
              </>
            )}
            
            {!isOccupied && room.status !== 'indisponivel' && (
              <button onClick={() => setStatus('indisponivel')} className="col-span-2 bg-slate-100 hover:bg-slate-200 text-slate-700 py-2.5 rounded-lg text-sm font-medium transition-colors">
                Marcar como Indisponível
              </button>
            )}

            {!isOccupied && room.status === 'indisponivel' && (
              <button onClick={() => setStatus('livre')} className="col-span-2 bg-slate-100 hover:bg-slate-200 text-slate-700 py-2.5 rounded-lg text-sm font-medium transition-colors">
                Marcar como Livre
              </button>
            )}
          </div>
        </div>

      </div>
    </div>
  );
};
