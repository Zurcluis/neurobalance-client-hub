import React, { useState, useRef } from 'react';
import { RoomData } from './types';
import { RoomBlock } from './RoomBlock';
import { ZoomIn, ZoomOut, RotateCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface ClinicFloorPlanProps {
  rooms: RoomData[];
  selectedRoomId: string | null;
  onRoomSelect: (room: RoomData) => void;
  selectedServiceFilter?: string;
  viewMode?: 'architectural' | 'schematic';
}

export const ClinicFloorPlan: React.FC<ClinicFloorPlanProps> = ({ 
  rooms, 
  selectedRoomId, 
  onRoomSelect,
  selectedServiceFilter = 'all',
  viewMode = 'architectural'
}) => {
  const [zoom, setZoom] = useState(1);
  const [panPosition, setPanPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const containerRef = useRef<HTMLDivElement>(null);

  const getRoom = (id: string, fallbackName?: string, service?: string) => 
    rooms.find(r => r.roomId === id) || {
      roomId: id, 
      roomName: fallbackName || id, 
      status: 'indisponivel', 
      serviceType: service || ''
    } as RoomData;

  const matchesFilter = (serviceType: string) => {
    if (selectedServiceFilter === 'all') return true;
    const s = serviceType.toLowerCase();
    if (selectedServiceFilter === 'neurofeedback') return s.includes('neurofeedback');
    if (selectedServiceFilter === 'yoga') return s.includes('yoga') || s.includes('relaxamento');
    if (selectedServiceFilter === 'avaliacao') return s.includes('avaliação') || s.includes('diagnóstico') || s.includes('qeeg') || s.includes('consulta');
    if (selectedServiceFilter === 'ocupacional') return s.includes('ocupacional');
    return true;
  };

  const handleZoomIn = () => setZoom(prev => Math.min(prev + 0.2, 2.2));
  const handleZoomOut = () => setZoom(prev => Math.max(prev - 0.2, 0.7));
  const handleResetZoom = () => {
    setZoom(1);
    setPanPosition({ x: 0, y: 0 });
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    if (zoom <= 1) return;
    setIsDragging(true);
    setDragStart({ x: e.clientX - panPosition.x, y: e.clientY - panPosition.y });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return;
    setPanPosition({
      x: e.clientX - dragStart.x,
      y: e.clientY - dragStart.y
    });
  };

  const handleMouseUp = () => setIsDragging(false);

  // Exact relative architectural bounds mapped over /planta/planta.png
  const architecturalLayout = {
    'sala-4': { left: '9.3%', top: '12.8%', width: '17.6%', height: '22.0%' },
    'wc1': { left: '27.4%', top: '12.8%', width: '8.8%', height: '14.2%' },
    'wc2': { left: '36.4%', top: '12.8%', width: '8.8%', height: '14.2%' },
    'sala-3': { left: '16.2%', top: '34.8%', width: '27.4%', height: '19.4%' },
    'sala-1': { left: '16.2%', top: '54.6%', width: '20.6%', height: '31.2%' },
    'rececao': { left: '37.3%', top: '54.6%', width: '28.4%', height: '31.2%' },
    'sala-2': { left: '66.2%', top: '54.2%', width: '24.6%', height: '31.6%' },
    'sala-5': { left: '53.6%', top: '25.0%', width: '18.2%', height: '28.8%' },
    'sala-6': { left: '72.2%', top: '25.0%', width: '18.2%', height: '28.8%' },
  };

  return (
    <div className="relative flex flex-col bg-slate-900/5 dark:bg-black/30 rounded-3xl p-3 sm:p-5 border border-slate-200/80 dark:border-slate-800 shadow-inner overflow-hidden">
      {/* Floating Viewport Toolbar */}
      <div className="absolute top-6 right-6 z-30 flex items-center gap-1.5 bg-white/90 dark:bg-gray-800/90 backdrop-blur-md px-3 py-1.5 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-700">
        <span className="text-[11px] font-bold text-gray-500 mr-1 hidden sm:inline">
          {Math.round(zoom * 100)}%
        </span>
        <Button
          variant="ghost"
          size="icon"
          onClick={handleZoomIn}
          className="h-7 w-7 rounded-xl text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700"
          title="Aumentar Zoom"
        >
          <ZoomIn className="w-4 h-4" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          onClick={handleZoomOut}
          className="h-7 w-7 rounded-xl text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700"
          title="Diminuir Zoom"
        >
          <ZoomOut className="w-4 h-4" />
        </Button>
        {(zoom !== 1 || panPosition.x !== 0 || panPosition.y !== 0) && (
          <Button
            variant="ghost"
            size="icon"
            onClick={handleResetZoom}
            className="h-7 w-7 rounded-xl text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700"
            title="Repor Vista"
          >
            <RotateCcw className="w-4 h-4" />
          </Button>
        )}
      </div>

      {/* Main Floor Plan Canvas */}
      <div 
        ref={containerRef}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        className={cn(
          "w-full overflow-x-auto overflow-y-hidden rounded-2xl flex items-center justify-center p-2 min-h-[520px] transition-cursor",
          zoom > 1 ? (isDragging ? "cursor-grabbing" : "cursor-grab") : "cursor-default"
        )}
      >
        <div
          style={{
            transform: `scale(${zoom}) translate(${panPosition.x / zoom}px, ${panPosition.y / zoom}px)`,
            transformOrigin: 'center center',
            transition: isDragging ? 'none' : 'transform 0.2s ease-out',
            width: '100%',
            maxWidth: '1050px',
            aspectRatio: '1.33 / 1',
            minWidth: '780px'
          }}
          className="relative rounded-2xl shadow-2xl overflow-hidden border-2 border-stone-300 dark:border-stone-700 bg-[#f7f4ed]"
        >
          {/* Architectural Background Image */}
          <img
            src="/planta/planta.png"
            alt="Planta da Clínica NeuroBalance"
            className="absolute inset-0 w-full h-full object-contain pointer-events-none select-none"
            style={{
              filter: viewMode === 'schematic' ? 'grayscale(80%) opacity(30%)' : 'none'
            }}
          />

          {/* ════ OVERLAY INTERATIVO DAS SALAS ════ */}

          {/* Sala 4: Superior Esquerdo */}
          <div 
            style={{ position: 'absolute', ...architecturalLayout['sala-4'], zIndex: 10 }}
            className={cn(!matchesFilter(getRoom('sala-4').serviceType) && "opacity-25 grayscale")}
          >
            <RoomBlock
              room={getRoom('sala-4', 'Sala 4', 'Avaliação QEEG & Diagnóstico')}
              isSelected={selectedRoomId === 'sala-4'}
              onClick={onRoomSelect}
              className="w-full h-full"
            />
          </div>

          {/* WC 1 */}
          <div style={{ position: 'absolute', ...architecturalLayout['wc1'], zIndex: 5 }}>
            <RoomBlock
              room={{ roomId: 'wc1', roomName: 'WC 1', status: 'livre', serviceType: '' }}
              isSelected={false}
              onClick={() => {}}
              isWC={true}
              className="w-full h-full"
            />
          </div>

          {/* WC 2 */}
          <div style={{ position: 'absolute', ...architecturalLayout['wc2'], zIndex: 5 }}>
            <RoomBlock
              room={{ roomId: 'wc2', roomName: 'WC 2', status: 'livre', serviceType: '' }}
              isSelected={false}
              onClick={() => {}}
              isWC={true}
              className="w-full h-full"
            />
          </div>

          {/* Sala 3: Centro-Esquerdo */}
          <div 
            style={{ position: 'absolute', ...architecturalLayout['sala-3'], zIndex: 10 }}
            className={cn(!matchesFilter(getRoom('sala-3').serviceType) && "opacity-25 grayscale")}
          >
            <RoomBlock
              room={getRoom('sala-3', 'Sala 3', 'Yoga Nidra & Relaxamento')}
              isSelected={selectedRoomId === 'sala-3'}
              onClick={onRoomSelect}
              className="w-full h-full"
            />
          </div>

          {/* Sala 1: Inferior Esquerdo */}
          <div 
            style={{ position: 'absolute', ...architecturalLayout['sala-1'], zIndex: 10 }}
            className={cn(!matchesFilter(getRoom('sala-1').serviceType) && "opacity-25 grayscale")}
          >
            <RoomBlock
              room={getRoom('sala-1', 'Sala 1', 'Consulta & Avaliação')}
              isSelected={selectedRoomId === 'sala-1'}
              onClick={onRoomSelect}
              className="w-full h-full"
            />
          </div>

          {/* Receção: Centro Inferior */}
          <div style={{ position: 'absolute', ...architecturalLayout['rececao'], zIndex: 10 }}>
            <RoomBlock
              room={{
                roomId: 'rececao',
                roomName: 'Receção',
                status: 'livre',
                serviceType: 'Atendimento e Acolhimento'
              }}
              isSelected={selectedRoomId === 'rececao'}
              onClick={onRoomSelect}
              className="w-full h-full"
            />
          </div>

          {/* Sala 2: Inferior Direito */}
          <div 
            style={{ position: 'absolute', ...architecturalLayout['sala-2'], zIndex: 10 }}
            className={cn(!matchesFilter(getRoom('sala-2').serviceType) && "opacity-25 grayscale")}
          >
            <RoomBlock
              room={getRoom('sala-2', 'Sala 2', 'Terapia Ocupacional')}
              isSelected={selectedRoomId === 'sala-2'}
              onClick={onRoomSelect}
              className="w-full h-full"
            />
          </div>

          {/* Sala 5: Superior Centro-Direito */}
          <div 
            style={{ position: 'absolute', ...architecturalLayout['sala-5'], zIndex: 10 }}
            className={cn(!matchesFilter(getRoom('sala-5').serviceType) && "opacity-25 grayscale")}
          >
            <RoomBlock
              room={getRoom('sala-5', 'Sala 5', 'Neurofeedback (Gabinete A)')}
              isSelected={selectedRoomId === 'sala-5'}
              onClick={onRoomSelect}
              className="w-full h-full"
            />
          </div>

          {/* Sala 6: Superior Extremo Direito */}
          <div 
            style={{ position: 'absolute', ...architecturalLayout['sala-6'], zIndex: 10 }}
            className={cn(!matchesFilter(getRoom('sala-6').serviceType) && "opacity-25 grayscale")}
          >
            <RoomBlock
              room={getRoom('sala-6', 'Sala 6', 'Neurofeedback (Gabinete B)')}
              isSelected={selectedRoomId === 'sala-6'}
              onClick={onRoomSelect}
              className="w-full h-full"
            />
          </div>

        </div>
      </div>
    </div>
  );
};

