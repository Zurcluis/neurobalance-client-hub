import React from 'react';
import { RoomData, RoomStatus } from './types';
import { CountdownTimer } from './CountdownTimer';

interface RoomBlockProps {
  room: RoomData;
  isSelected: boolean;
  onClick: (room: RoomData) => void;
  className?: string;
  isWC?: boolean;
  style?: React.CSSProperties;
}

export const RoomBlock: React.FC<RoomBlockProps> = ({ room, isSelected, onClick, className = '', isWC = false, style }) => {
  const getStatusStyles = (status: RoomStatus) => {
    switch (status) {
      case 'livre':
        return 'bg-[#e2f1e2] border-[#81c784] text-[#2e7d32]';
      case 'ocupada':
        return 'bg-[#e0f2f3] border-[#3f9094] text-[#265255]';
      case 'a_terminar':
        return 'bg-[#fff4e5] border-[#ff9800] text-[#e65100]';
      case 'atrasada':
        return 'bg-[#ffebee] border-[#f44336] text-[#c62828]';
      case 'indisponivel':
        return 'bg-[#f5f5f5] border-[#c5cfce] text-[#616161]';
      default:
        return 'bg-white border-slate-200';
    }
  };

  const statusStyles = getStatusStyles(room.status);
  
  if (isWC) {
    return (
      <div style={style} className={`border-2 rounded-lg p-2 flex flex-col items-center justify-center bg-slate-100 border-slate-300 text-slate-500 ${className}`}>
        <span className="font-bold text-sm">{room.roomName}</span>
      </div>
    );
  }

  // Entrance and Reception (Non-interactive blocks if no status, but reception might not be in the rooms array)
  if (room.roomId === 'entrada' || room.roomId === 'rececao' || room.roomId === 'corredor') {
     return (
        <div style={style} className={`border-2 border-dashed rounded-lg p-2 flex items-center justify-center bg-white border-slate-300 text-slate-400 ${className}`}>
          <span className="font-bold tracking-widest uppercase">{room.roomName}</span>
        </div>
     );
  }

  return (
    <div 
      style={style}
      onClick={() => onClick(room)}
      className={`relative flex flex-col border-2 rounded-lg p-3 transition-all cursor-pointer shadow-sm
        ${statusStyles}
        ${isSelected ? 'ring-4 ring-offset-2 ring-blue-400 scale-[1.02] z-10' : 'hover:scale-[1.01] hover:shadow-md'}
        ${className}
      `}
    >
      <div className="flex justify-between items-start mb-2">
        <div>
          <h3 className="font-bold text-lg leading-tight">{room.roomName}</h3>
          <p className="text-xs font-medium opacity-80">{room.serviceType}</p>
        </div>
        {room.status === 'indisponivel' && (
           <span className="text-xs bg-slate-200 text-slate-600 px-2 py-0.5 rounded-full font-semibold">Indisponível</span>
        )}
      </div>
      
      <div className="mt-auto">
        {(room.status === 'ocupada' || room.status === 'a_terminar' || room.status === 'atrasada') && (
          <div className="bg-white/60 rounded-md p-2 mt-2 backdrop-blur-sm border border-white/40">
            <p className="text-sm font-semibold truncate" title={room.currentClientName}>{room.currentClientName}</p>
            {room.sessionEnd && (
              <div className="mt-1">
                <CountdownTimer targetDate={room.sessionEnd} />
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
