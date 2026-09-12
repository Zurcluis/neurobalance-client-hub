import React, { useState, useEffect, useRef, useCallback } from 'react';
import { initialMockRooms } from '../components/clinic-floor-plan/mockData';
import { RoomData } from '../components/clinic-floor-plan/types';
import { SummaryCards } from '../components/clinic-floor-plan/SummaryCards';
import { ClinicFloorPlan } from '../components/clinic-floor-plan/ClinicFloorPlan';
import { RoomDetailsPanel } from '../components/clinic-floor-plan/RoomDetailsPanel';
import { StatusLegend } from '../components/clinic-floor-plan/StatusLegend';
import PageLayout from '@/components/layout/PageLayout';
import PageHeader from '@/components/shared/PageHeader';
import { useAdminAuth } from '@/hooks/useAdminAuth';
import { cn } from '@/lib/utils';
import { Shield, RefreshCw, Building2, Info } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';

interface ClinicFloorPlanPageProps {
  isEmbedded?: boolean;
}

const STORAGE_KEY = 'neurobalance_clinic_rooms_v2';

const ClinicFloorPlanPage: React.FC<ClinicFloorPlanPageProps> = ({ isEmbedded = false }) => {
  const { session } = useAdminAuth();
  const isPartner = session?.role === 'partner';
  const pageContainerRef = useRef<HTMLDivElement>(null);

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

  useEffect(() => {
    document.title = 'Planta da Clínica | NeuroBalance';
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(rooms));
    } catch (e) {
      console.error('Erro ao guardar estado das salas:', e);
    }
  }, [rooms]);

  const playChime = useCallback(() => {
    if (!soundEnabled) return;
    try {
      const AudioCtxClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (!AudioCtxClass) return;
      const audioCtx = new AudioCtxClass();
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(587.33, audioCtx.currentTime);
      osc.frequency.setValueAtTime(880.00, audioCtx.currentTime + 0.15);

      gain.gain.setValueAtTime(0.2, audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.8);

      osc.connect(gain);
      gain.connect(audioCtx.destination);

      osc.start();
      osc.stop(audioCtx.currentTime + 0.8);
    } catch (e) {
      // Áudio é opcional; falha silenciosa
    }
  }, [soundEnabled]);

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

  useEffect(() => {
    const checkStatuses = () => {
      const now = new Date().getTime();

      setRooms(prevRooms => prevRooms.map(room => {
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

        if (!room.sessionEnd) return room;

        const endTime = new Date(room.sessionEnd).getTime();
        const difference = endTime - now;

        let newStatus = room.status;

        if (difference <= 0) {
          if (room.status !== 'atrasada') {
            playChime();
          }
          newStatus = 'atrasada';
        } else if (difference <= 10 * 60000) {
          if (room.status === 'ocupada') {
            playChime();
          }
          newStatus = 'a_terminar';
        } else if (room.status === 'a_terminar' && difference > 10 * 60000) {
          newStatus = 'ocupada';
        }

        if (newStatus !== room.status) {
          return { ...room, status: newStatus };
        }

        return room;
      }));
    };

    checkStatuses();
    const interval = setInterval(checkStatuses, 10000);
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

  const content = (
    <div
      ref={pageContainerRef}
      className={cn(
        isEmbedded ? "w-full" : "w-full mx-auto flex flex-col gap-6",
        isFullscreen && "bg-slate-900 text-white p-6 min-h-screen overflow-y-auto"
      )}
    >
      {!isEmbedded && (
        <PageHeader
          title="Planta da Clínica"
          description="Monitorização de ocupação e gestão de gabinetes em tempo real"
          icon={<Building2 className="h-5 w-5" />}
          actions={
            <>
              <Badge
                variant="outline"
                className="gap-1.5 border-amber-300 bg-amber-50 text-amber-800 dark:border-amber-800 dark:bg-amber-950/40 dark:text-amber-300"
                title="Os estados das salas são simulados localmente; apenas clientes e agendamentos do painel são reais."
              >
                <Info className="h-3.5 w-3.5" />
                Demo
              </Badge>
              <Badge variant="outline" className="gap-1.5 border-emerald-300 bg-emerald-50 text-emerald-800 dark:border-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300">
                <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                Ao vivo
              </Badge>
              <Button
                variant="outline"
                size="sm"
                onClick={handleResetToDefaults}
                className="gap-2"
                title="Repor estado inicial da simulação"
              >
                <RefreshCw className="h-4 w-4" />
                Repor Estado
              </Button>
            </>
          }
        />
      )}

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

      <div className="flex flex-col lg:flex-row gap-6 flex-1 min-h-[620px]">
        <div className="flex-1 min-w-0 flex flex-col">
          <ClinicFloorPlan
            rooms={rooms}
            selectedRoomId={selectedRoomId}
            onRoomSelect={handleRoomSelect}
            selectedServiceFilter={selectedServiceFilter}
            viewMode={viewMode}
          />
          <StatusLegend />
        </div>

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

  if (isPartner) {
    return (
      <PageLayout>
        <div className="flex min-h-[60vh] items-center justify-center">
          <div className="text-center p-8">
            <Shield className="h-16 w-16 text-destructive mx-auto mb-4" />
            <h2 className="text-xl font-bold mb-2">Acesso Negado</h2>
            <p className="text-muted-foreground">Não tem permissão para aceder à planta da clínica.</p>
          </div>
        </div>
      </PageLayout>
    );
  }

  return (
    <PageLayout>
      {content}
    </PageLayout>
  );
};

export default ClinicFloorPlanPage;
