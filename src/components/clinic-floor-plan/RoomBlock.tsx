import React from 'react';
import { RoomData, RoomStatus } from './types';
import { CountdownTimer } from './CountdownTimer';
import {
  User,
  Sparkles,
  CheckCircle2,
  Brain,
  Flower2,
  Stethoscope,
  Armchair,
  ClipboardList,
  ConciergeBell,
  ArrowRight,
  LucideIcon
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
          overlay: 'bg-emerald-500/10 hover:bg-emerald-500/20 border-emerald-500/50 hover:border-emerald-500 text-emerald-900 dark:text-emerald-100',
          badge: 'bg-emerald-100/90 text-emerald-800 border-emerald-300',
          indicator: 'bg-emerald-500',
          label: 'Livre'
        };
      case 'ocupada':
        return {
          overlay: 'bg-teal-500/20 hover:bg-teal-500/30 border-teal-600 hover:border-teal-700 text-foreground',
          badge: 'bg-teal-50/95 text-teal-800 border-teal-300',
          indicator: 'bg-teal-600',
          label: 'Em Sessão'
        };
      case 'a_terminar':
        return {
          overlay: 'bg-amber-500/25 hover:bg-amber-500/35 border-amber-500 text-amber-950 dark:text-amber-100 ring-2 ring-amber-400/40 animate-pulse',
          badge: 'bg-amber-100/95 text-amber-900 border-amber-400',
          indicator: 'bg-amber-500 animate-ping',
          label: 'A Terminar'
        };
      case 'atrasada':
        return {
          overlay: 'bg-red-500/25 hover:bg-red-500/35 border-red-500 text-red-950 dark:text-red-100 ring-2 ring-red-400/50 animate-pulse',
          badge: 'bg-red-100/95 text-red-900 border-red-400',
          indicator: 'bg-red-500 animate-ping',
          label: 'Atrasada'
        };
      case 'higienizacao':
        return {
          overlay: 'bg-purple-500/20 hover:bg-purple-500/30 border-purple-500 text-purple-950 dark:text-purple-100',
          badge: 'bg-purple-100/95 text-purple-900 border-purple-300',
          indicator: 'bg-purple-500',
          label: 'Higienização'
        };
      case 'indisponivel':
        return {
          overlay: 'bg-muted/60 hover:bg-muted/70 border-border text-muted-foreground backdrop-grayscale',
          badge: 'bg-muted text-muted-foreground border-border',
          indicator: 'bg-muted-foreground',
          label: 'Indisponível'
        };
      default:
        return {
          overlay: 'bg-white/40 border-border text-foreground',
          badge: 'bg-background text-foreground border-border',
          indicator: 'bg-muted-foreground',
          label: 'Indefinido'
        };
    }
  };

  const statusStyle = getStatusStyles(room.status);

  const getServiceIcon = (service: string): LucideIcon => {
    const s = service.toLowerCase();
    if (s.includes('neurofeedback')) return Brain;
    if (s.includes('yoga') || s.includes('relaxamento')) return Flower2;
    if (s.includes('avaliação') || s.includes('qeeg') || s.includes('diagnóstico')) return Stethoscope;
    if (s.includes('ocupacional')) return Armchair;
    return ClipboardList;
  };

  if (isWC) {
    return (
      <div
        style={style}
        className={cn(
          "rounded-lg p-1.5 flex flex-col items-center justify-center bg-card/75 border text-muted-foreground shadow-sm backdrop-blur-xs select-none",
          className
        )}
      >
        <span className="text-xs font-semibold tracking-wider">{room.roomName}</span>
        <span className="text-[10px] text-muted-foreground/70">WC</span>
      </div>
    );
  }

  if (room.roomId === 'rececao') {
    return (
      <div
        style={style}
        onClick={() => onClick(room)}
        className={cn(
          "rounded-xl p-2.5 flex flex-col justify-between cursor-pointer transition-all border-2 border-dashed border-primary/40 bg-primary/10 hover:bg-primary/20 backdrop-blur-xs shadow-sm hover:shadow-md",
          isSelected && "ring-4 ring-primary border-solid scale-[1.01] z-20",
          className
        )}
      >
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold tracking-widest uppercase text-primary dark:text-teal-300 flex items-center gap-1.5">
            <ConciergeBell className="h-3.5 w-3.5" />
            {room.roomName || 'Receção'}
          </span>
          <span className="text-[10px] bg-card/80 px-2 py-0.5 rounded-full font-medium text-muted-foreground border">
            Balcão de Atendimento
          </span>
        </div>
        <p className="text-[11px] text-muted-foreground mt-auto font-medium">
          Check-in central & Acolhimento
        </p>
      </div>
    );
  }

  const isOccupied = room.status === 'ocupada' || room.status === 'a_terminar' || room.status === 'atrasada';
  const ServiceIcon = getServiceIcon(room.serviceType);

  return (
    <div
      style={style}
      onClick={() => onClick(room)}
      className={cn(
        "group relative flex flex-col justify-between border-2 rounded-xl p-2.5 sm:p-3 transition-all duration-200 cursor-pointer shadow-sm backdrop-blur-[2px] select-none",
        statusStyle.overlay,
        isSelected
          ? 'ring-4 ring-primary ring-offset-2 scale-[1.02] shadow-xl z-20 bg-card/90'
          : 'hover:scale-[1.01] hover:shadow-lg',
        className
      )}
    >
      <div className="flex items-start justify-between gap-1.5">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5">
            <span className="text-sm font-bold text-foreground tracking-tight flex items-center gap-1">
              <ServiceIcon className="h-3.5 w-3.5 shrink-0" />
              <span className="truncate">{room.roomName}</span>
            </span>
          </div>
          <p className="text-[10px] sm:text-[11px] font-medium text-foreground/70 truncate opacity-90">
            {room.serviceType}
          </p>
        </div>

        <div className={cn(
          "shrink-0 px-2 py-0.5 rounded-full text-[10px] sm:text-xs font-semibold border flex items-center gap-1 shadow-2xs backdrop-blur-md",
          statusStyle.badge
        )}>
          <span className={cn("w-1.5 h-1.5 rounded-full", statusStyle.indicator)} />
          <span>{statusStyle.label}</span>
        </div>
      </div>

      <div className="my-auto py-1">
        {isOccupied && (
          <div className="bg-card/80 rounded-lg p-1.5 sm:p-2 backdrop-blur-md border shadow-2xs">
            <div className="flex items-center justify-between gap-1">
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-1 text-xs font-semibold text-foreground truncate">
                  <User className="h-3 w-3 text-teal-600 shrink-0" />
                  <span className="truncate" title={room.currentClientName}>{room.currentClientName}</span>
                </div>
                {room.therapistName && (
                  <p className="text-[10px] text-muted-foreground truncate pl-4">
                    {room.therapistName}
                  </p>
                )}
              </div>

              {room.sessionEnd && (
                <div className="shrink-0">
                  <CountdownTimer targetDate={room.sessionEnd} />
                </div>
              )}
            </div>
          </div>
        )}

        {room.status === 'higienizacao' && (
          <div className="bg-purple-100/80 dark:bg-purple-950/40 rounded-lg p-1.5 sm:p-2 border border-purple-200 dark:border-purple-900 text-purple-900 dark:text-purple-200">
            <div className="flex items-center gap-1.5 text-xs font-semibold">
              <Sparkles className="h-3.5 w-3.5 text-purple-600 animate-spin" style={{ animationDuration: '6s' }} />
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
            <div className="flex items-center gap-1 text-[11px] font-medium text-emerald-700 dark:text-emerald-400">
              <CheckCircle2 className="h-3.5 w-3.5" />
              <span>Pronta para atendimento</span>
            </div>
          </div>
        )}
      </div>

      <div className="mt-auto pt-1 flex items-center justify-between gap-1">
        <span className="text-[9px] font-medium text-muted-foreground uppercase tracking-widest">
          {room.capacity ? `${room.capacity} Lugares` : 'Gabinete'}
        </span>

        <span className="text-[10px] font-semibold text-primary group-hover:underline flex items-center gap-0.5">
          Gerir
          <ArrowRight className="h-3 w-3" />
        </span>
      </div>
    </div>
  );
};
