import React from 'react';
import { RoomData, RoomStatus } from './types';
import { CountdownTimer } from './CountdownTimer';
import { 
  User, 
  Sparkles, 
  CheckCircle2 
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface RoomBlockProps {
  room: RoomData;
  isSelected: boolean;
  onClick: (room: RoomData) => void;
  className?: string;
  isWC?: boolean;
  style?: React.CSSProperties;
}

export const RoomBlock: React.FC<RoomBlockProps> = ({ 
  room, 
  isSelected, 
  onClick, 
  className = '', 
  isWC = false, 
  style
}) => {
  const getStatusStyles = (status: RoomStatus) => {
    switch (status) {
      case 'livre':
        return {
          overlay: 'bg-emerald-500/10 hover:bg-emerald-500/20 border-emerald-500/50 hover:border-emerald-500 text-emerald-900',
          badge: 'bg-emerald-100/90 text-emerald-800 border-emerald-300',
          indicator: 'bg-emerald-500',
          label: 'Livre'
        };
      case 'ocupada':
        return {
          overlay: 'bg-[#3f9094]/20 hover:bg-[#3f9094]/30 border-[#3f9094] hover:border-[#265255] text-slate-900',
          badge: 'bg-[#e0f2f3]/95 text-[#265255] border-[#3f9094]',
          indicator: 'bg-[#3f9094]',
          label: 'Em Sessão'
        };
      case 'a_terminar':
        return {
          overlay: 'bg-amber-500/25 hover:bg-amber-500/35 border-amber-500 text-amber-950 ring-2 ring-amber-400/40 animate-pulse',
          badge: 'bg-amber-100/95 text-amber-900 border-amber-400',
          indicator: 'bg-amber-500 animate-ping',
          label: 'A Terminar'
        };
      case 'atrasada':
        return {
          overlay: 'bg-red-500/25 hover:bg-red-500/35 border-red-500 text-red-950 ring-2 ring-red-400/50 animate-pulse',
          badge: 'bg-red-100/95 text-red-900 border-red-400',
          indicator: 'bg-red-500 animate-ping',
          label: 'Atrasada'
        };
      case 'higienizacao':
        return {
          overlay: 'bg-purple-500/20 hover:bg-purple-500/30 border-purple-500 text-purple-950',
          badge: 'bg-purple-100/95 text-purple-900 border-purple-300',
          indicator: 'bg-purple-500',
          label: 'Higienização'
        };
      case 'indisponivel':
        return {
          overlay: 'bg-gray-500/20 hover:bg-gray-500/30 border-gray-400 text-gray-700 backdrop-grayscale',
          badge: 'bg-gray-200/90 text-gray-700 border-gray-300',
          indicator: 'bg-gray-400',
          label: 'Indisponível'
        };
      default:
        return {
          overlay: 'bg-white/40 border-slate-300 text-slate-700',
          badge: 'bg-white text-slate-700 border-slate-200',
          indicator: 'bg-slate-400',
          label: 'Indefinido'
        };
    }
  };

  const statusStyle = getStatusStyles(room.status);

  const getServiceIcon = (service: string) => {
    const s = service.toLowerCase();
    if (s.includes('neurofeedback')) return '🧠';
    if (s.includes('yoga') || s.includes('relaxamento')) return '🧘';
    if (s.includes('avaliação') || s.includes('qeeg') || s.includes('diagnóstico')) return '🩺';
    if (s.includes('ocupacional')) return '🛋️';
    return '📋';
  };

  if (isWC) {
    return (
      <div 
        style={style} 
        className={cn(
          "rounded-xl p-1.5 flex flex-col items-center justify-center bg-white/75 dark:bg-gray-800/75 border border-slate-300 dark:border-gray-600 text-slate-600 dark:text-gray-300 shadow-sm backdrop-blur-xs select-none",
          className
        )}
      >
        <span className="text-xs font-bold tracking-wider">{room.roomName}</span>
        <span className="text-[10px] text-slate-400">WC</span>
      </div>
    );
  }

  // Non-room zone (Receção / Entrada)
  if (room.roomId === 'rececao') {
    return (
      <div
        style={style}
        onClick={() => onClick(room)}
        className={cn(
          "rounded-2xl p-2.5 flex flex-col justify-between cursor-pointer transition-all border-2 border-dashed border-[#3f9094]/40 bg-[#3f9094]/10 hover:bg-[#3f9094]/20 backdrop-blur-xs shadow-sm hover:shadow-md",
          isSelected && "ring-4 ring-[#3f9094] border-solid scale-[1.01] z-20",
          className
        )}
      >
        <div className="flex items-center justify-between">
          <span className="text-xs font-black tracking-widest uppercase text-[#265255] dark:text-[#53b8bc] flex items-center gap-1.5">
            🛎️ {room.roomName || 'Receção'}
          </span>
          <span className="text-[10px] bg-white/80 dark:bg-gray-800/80 px-2 py-0.5 rounded-full font-bold text-gray-600 border border-gray-200">
            Balcão de Atendimento
          </span>
        </div>
        <p className="text-[11px] text-gray-500 dark:text-gray-400 mt-auto font-medium">
          Check-in central & Acolhimento
        </p>
      </div>
    );
  }

  const isOccupied = room.status === 'ocupada' || room.status === 'a_terminar' || room.status === 'atrasada';

  return (
    <div 
      style={style}
      onClick={() => onClick(room)}
      className={cn(
        "group relative flex flex-col justify-between border-2 rounded-2xl p-2.5 sm:p-3 transition-all duration-200 cursor-pointer shadow-sm backdrop-blur-[2px] select-none",
        statusStyle.overlay,
        isSelected
          ? 'ring-4 ring-[#3f9094] ring-offset-2 scale-[1.02] shadow-xl z-20 bg-white/90 dark:bg-gray-800/90'
          : 'hover:scale-[1.01] hover:shadow-lg',
        className
      )}
    >
      {/* Top Header: Room Name + Service Tag + Status Badge */}
      <div className="flex items-start justify-between gap-1.5">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5">
            <span className="text-sm font-black text-gray-900 dark:text-white tracking-tight flex items-center gap-1">
              <span>{getServiceIcon(room.serviceType)}</span>
              <span className="truncate">{room.roomName}</span>
            </span>
          </div>
          <p className="text-[10px] sm:text-[11px] font-semibold text-gray-600 dark:text-gray-300 truncate opacity-90">
            {room.serviceType}
          </p>
        </div>

        {/* Status Pill Badge */}
        <div className={cn(
          "shrink-0 px-2 py-0.5 rounded-full text-[10px] sm:text-xs font-bold border flex items-center gap-1 shadow-2xs backdrop-blur-md",
          statusStyle.badge
        )}>
          <span className={cn("w-1.5 h-1.5 rounded-full", statusStyle.indicator)} />
          <span>{statusStyle.label}</span>
        </div>
      </div>

      {/* Center / Body: Client and Therapist Info */}
      <div className="my-auto py-1">
        {isOccupied && (
          <div className="bg-white/80 dark:bg-gray-800/80 rounded-xl p-1.5 sm:p-2 backdrop-blur-md border border-white/60 dark:border-gray-700/60 shadow-2xs">
            <div className="flex items-center justify-between gap-1">
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-1 text-xs font-bold text-gray-900 dark:text-white truncate">
                  <User className="w-3 h-3 text-[#3f9094] shrink-0" />
                  <span className="truncate" title={room.currentClientName}>{room.currentClientName}</span>
                </div>
                {room.therapistName && (
                  <p className="text-[10px] text-gray-500 dark:text-gray-400 truncate pl-4">
                    {room.therapistName}
                  </p>
                )}
              </div>

              {/* Countdown timer */}
              {room.sessionEnd && (
                <div className="shrink-0">
                  <CountdownTimer targetDate={room.sessionEnd} />
                </div>
              )}
            </div>
          </div>
        )}

        {room.status === 'higienizacao' && (
          <div className="bg-purple-100/80 dark:bg-purple-950/40 rounded-xl p-1.5 sm:p-2 border border-purple-200 text-purple-900 dark:text-purple-200">
            <div className="flex items-center gap-1.5 text-xs font-bold">
              <Sparkles className="w-3.5 h-3.5 text-purple-600 animate-spin" style={{ animationDuration: '6s' }} />
              <span>Em Preparação & Limpeza</span>
            </div>
            {room.cleaningUntil && (
              <div className="mt-1">
                <CountdownTimer targetDate={room.cleaningUntil} isCleaning={true} />
              </div>
            )}
          </div>
        )}

        {room.status === 'livre' && (
          <div className="py-1">
            <div className="flex items-center gap-1 text-[11px] font-semibold text-emerald-700 dark:text-emerald-400">
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>Pronta para atendimento</span>
            </div>
          </div>
        )}
      </div>

      {/* Bottom Quick-Action Bar (appears on hover / selection) */}
      <div className="mt-auto pt-1 flex items-center justify-between gap-1">
        <span className="text-[9px] font-medium text-gray-500 uppercase tracking-widest">
          {room.capacity ? `${room.capacity} Lugares` : 'Gabinete'}
        </span>

        <span className="text-[10px] font-bold text-[#3f9094] group-hover:underline flex items-center gap-0.5">
          Gerir ➜
        </span>
      </div>
    </div>
  );
};

