import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useLocation } from 'react-router-dom';
import { initialMockRooms } from '../components/clinic-floor-plan/mockData';
import { RoomData } from '../components/clinic-floor-plan/types';
import { SummaryCards } from '../components/clinic-floor-plan/SummaryCards';
import { ClinicFloorPlan } from '../components/clinic-floor-plan/ClinicFloorPlan';
import { RoomDetailsPanel } from '../components/clinic-floor-plan/RoomDetailsPanel';
import { StatusLegend } from '../components/clinic-floor-plan/StatusLegend';
import PageLayout from '@/components/layout/PageLayout';
import AdminSidebar from '@/components/admin/AdminSidebar';
import { useAdminAuth } from '@/hooks/useAdminAuth';
import { useIsMobile } from '@/hooks/use-mobile';
import { cn } from '@/lib/utils';
import { Shield, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

interface ClinicFloorPlanPageProps {
  isEmbedded?: boolean;
}

const STORAGE_KEY = 'neurobalance_clinic_rooms_v2';

const ClinicFloorPlanPage: React.FC<ClinicFloorPlanPageProps> = ({ isEmbedded = false }) => {
  const { session } = useAdminAuth();
  const location = useLocation();
  const isMobile = useIsMobile();
  const isAdminRoute = location.pathname.startsWith('/admin');
  const isPartner = session?.role === 'partner';
  const pageContainerRef = useRef<HTMLDivElement>(null);

  // Initialize rooms from localStorage if present
  const [rooms, setRooms] = useState<RoomData[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        return JSON.parse(saved);
      }
    } catch (e) {
      console.error('Erro ao ler estado das salas:', e);
    }
    return initialMockRooms;
  });

  const [selectedRoomId, setSelectedRoomId] = useState<string | null>(null);
  const [selectedServiceFilter, setSelectedServiceFilter] = useState<string>('all');
  const [viewMode, setViewMode] = useState<'architectural' | 'schematic'>('architectural');
  const [soundEnabled, setSoundEnabled] = useState<boolean>(true);
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);

  // Save to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(rooms));
    } catch (e) {
      console.error('Erro ao guardar estado das salas:', e);
    }
  }, [rooms]);

  // Audio chime using Web Audio API
  const playChime = useCallback(() => {
    if (!soundEnabled) return;
    try {
      const AudioCtxClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (!AudioCtxClass) return;
      const audioCtx = new AudioCtxClass();
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      
      osc.type = 'sine';
      osc.frequency.setValueAtTime(587.33, audioCtx.currentTime); // D5
      osc.frequency.setValueAtTime(880.00, audioCtx.currentTime + 0.15); // A5
      
      gain.gain.setValueAtTime(0.2, audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.8);
      
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      
      osc.start();
      osc.stop(audioCtx.currentTime + 0.8);
    } catch (e) {
      console.log('Audio not supported or permitted yet', e);
    }
  }, [soundEnabled]);

  // Fullscreen toggle
  const handleToggleFullscreen = () => {
    if (!document.fullscreenElement) {
      if (pageContainerRef.current) {
        pageContainerRef.current.requestFullscreen().catch(err => {
          console.error(`Erro ao ativar modo ecrã completo: ${err.message}`);
        });
        setIsFullscreen(true);
      }
    } else {
      document.exitFullscreen().catch(err => {
        console.error(`Erro ao sair de ecrã completo: ${err.message}`);
      });
      setIsFullscreen(false);
    }
  };

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  // Time checker to automatically update room statuses based on sessionEnd & cleaningUntil
  useEffect(() => {
    const checkStatuses = () => {
      const now = new Date().getTime();

      setRooms(prevRooms => prevRooms.map(room => {
        // Check cleaning status
        if (room.status === 'higienizacao' && room.cleaningUntil) {
          const cleanEnd = new Date(room.cleaningUntil).getTime();
          if (now >= cleanEnd) {
            toast.success(`Higienização concluída na ${room.roomName}!`);
            playChime();
            return {
              ...room,
              status: 'livre',
              cleaningUntil: undefined,
            };
          }
        }

        // Check session status
        if (!room.sessionEnd) return room;

        const endTime = new Date(room.sessionEnd).getTime();
        const difference = endTime - now;

        let newStatus = room.status;

        if (difference <= 0) {
          if (room.status !== 'atrasada') {
            playChime();
          }
          newStatus = 'atrasada';
        } else if (difference <= 10 * 60000) { // 10 minutes
          if (room.status === 'ocupada') {
            playChime();
          }
          newStatus = 'a_terminar';
        } else if (room.status === 'a_terminar' && difference > 10 * 60000) {
          newStatus = 'ocupada'; // Extended
        }

        if (newStatus !== room.status) {
          return { ...room, status: newStatus };
        }

        return room;
      }));
    };

    checkStatuses();
    const interval = setInterval(checkStatuses, 10000); // Check every 10 seconds
    return () => clearInterval(interval);
  }, [playChime]);

  const handleRoomSelect = (room: RoomData) => {
    setSelectedRoomId(room.roomId);
  };

  const handleUpdateRoom = (roomId: string, updates: Partial<RoomData>) => {
    setRooms(prevRooms => prevRooms.map(r => {
      if (r.roomId === roomId) {
        return { ...r, ...updates };
      }
      return r;
    }));
  };

  const handleResetToDefaults = () => {
    setRooms(initialMockRooms);
    localStorage.removeItem(STORAGE_KEY);
    toast.success('Estado das salas reposto para a configuração inicial!');
  };

  const selectedRoom = selectedRoomId ? rooms.find(r => r.roomId === selectedRoomId) || null : null;

  if (isPartner && isAdminRoute) {
    return (
      <div className="flex min-h-screen bg-gray-50 dark:bg-gray-900">
        <AdminSidebar />
        <main className={cn(
          "flex-1 transition-all duration-300 flex items-center justify-center",
          isMobile ? "ml-0" : "ml-64"
        )}>
          <div className="text-center p-8">
            <Shield className="h-16 w-16 text-red-500 mx-auto mb-4" />
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Acesso Negado</h2>
            <p className="text-gray-600 dark:text-gray-400">Você não tem permissão para aceder à planta da clínica.</p>
          </div>
        </main>
      </div>
    );
  }

  const content = (
    <div 
      ref={pageContainerRef}
      className={cn(
        isEmbedded ? "w-full" : "p-4 sm:p-6 w-full max-w-[1680px] mx-auto min-h-[calc(100vh-4rem)] flex flex-col",
        isFullscreen && "bg-slate-900 text-white p-6 min-h-screen overflow-y-auto"
      )}
    >
      {/* Header */}
      {!isEmbedded && (
        <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl sm:text-3xl font-black text-gray-900 dark:text-white tracking-tight">
                Planta Interativa da Clínica
              </h1>
              <span className="bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 text-xs font-black px-2.5 py-0.5 rounded-full border border-emerald-300 flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                AO VIVO
              </span>
            </div>
            <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 mt-1">
              Monitorização, ocupação e gestão de gabinetes em tempo real
            </p>
          </div>

          {/* Top Quick Tools */}
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleResetToDefaults}
              className="text-xs rounded-xl h-9 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800"
              title="Repor estado inicial da simulação"
            >
              <RefreshCw className="w-3.5 h-3.5 mr-1.5" />
              Repor Estado
            </Button>
          </div>
        </div>
      )}

      {/* Summary KPI Cards & Global Filter Bar */}
      <SummaryCards 
        rooms={rooms} 
        selectedServiceFilter={selectedServiceFilter}
        onSelectServiceFilter={setSelectedServiceFilter}
        isFullscreen={isFullscreen}
        onToggleFullscreen={handleToggleFullscreen}
        soundEnabled={soundEnabled}
        onToggleSound={() => setSoundEnabled(!soundEnabled)}
        viewMode={viewMode}
        onToggleViewMode={setViewMode}
      />

      {/* Main Content Area: Map Canvas + Side Management Drawer */}
      <div className="flex flex-col lg:flex-row gap-6 flex-1 min-h-[620px]">
        {/* Floor Plan Canvas */}
        <div className="flex-1 flex flex-col">
          <ClinicFloorPlan 
            rooms={rooms} 
            selectedRoomId={selectedRoomId} 
            onRoomSelect={handleRoomSelect}
            selectedServiceFilter={selectedServiceFilter}
            viewMode={viewMode}
          />
          <StatusLegend />
        </div>

        {/* Side Panel Area */}
        <div className="w-full lg:w-[380px] xl:w-[420px] lg:shrink-0 h-auto">
          <RoomDetailsPanel 
            room={selectedRoom} 
            onClose={() => setSelectedRoomId(null)}
            onUpdateRoom={handleUpdateRoom}
          />
        </div>
      </div>
    </div>
  );

  if (isEmbedded) {
    return content;
  }

  if (isAdminRoute && session) {
    return (
      <div className="flex min-h-screen bg-gray-50 dark:bg-gray-900">
        <AdminSidebar />
        <main className={cn(
          "flex-1 transition-all duration-300",
          isMobile ? "ml-0" : "ml-64"
        )}>
          <div className={cn(
            "p-4 sm:p-6",
            isMobile && "pt-20"
          )}>
            {content}
          </div>
        </main>
      </div>
    );
  }

  return (
    <PageLayout>
      {content}
    </PageLayout>
  );
};

export default ClinicFloorPlanPage;

