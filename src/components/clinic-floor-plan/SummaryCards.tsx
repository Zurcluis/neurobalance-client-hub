import React from 'react';
import { RoomData } from './types';
import { CheckCircle2, Clock, Users, Sparkles, DoorOpen, Maximize2, Minimize2, Volume2, VolumeX, PencilRuler, LayoutGrid } from 'lucide-react';
import KpiCard from '@/components/shared/KpiCard';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { cn } from '@/lib/utils';

interface SummaryCardsProps {
  rooms: RoomData[];
  selectedServiceFilter: string;
  onSelectServiceFilter: (filter: string) => void;
  isFullscreen?: boolean;
  onToggleFullscreen?: () => void;
  soundEnabled?: boolean;
  onToggleSound?: () => void;
  viewMode?: 'architectural' | 'schematic';
  onToggleViewMode?: (mode: 'architectural' | 'schematic') => void;
}

const services = [
  { id: 'all', label: 'Todas as Salas' },
  { id: 'neurofeedback', label: 'Neurofeedback' },
  { id: 'yoga', label: 'Yoga Nidra' },
  { id: 'avaliacao', label: 'Avaliação & Diagnóstico' },
  { id: 'ocupacional', label: 'Terapia Ocupacional' },
];

export const SummaryCards: React.FC<SummaryCardsProps> = ({
  rooms,
  selectedServiceFilter,
  onSelectServiceFilter,
  isFullscreen,
  onToggleFullscreen,
  soundEnabled,
  onToggleSound,
  viewMode = 'architectural',
  onToggleViewMode,
}) => {
  const totals = {
    total: rooms.length,
    livre: rooms.filter((r) => r.status === 'livre').length,
    ocupada: rooms.filter((r) => r.status === 'ocupada' || r.status === 'a_terminar' || r.status === 'atrasada').length,
    a_terminar: rooms.filter((r) => r.status === 'a_terminar' || r.status === 'atrasada').length,
    higienizacao: rooms.filter((r) => r.status === 'higienizacao').length,
    indisponivel: rooms.filter((r) => r.status === 'indisponivel').length,
  };

  const occupancyPct = Math.round((totals.ocupada / (totals.total || 1)) * 100);

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
        <KpiCard
          icon={CheckCircle2}
          label="Livres"
          value={totals.livre}
          sub="Sem sessão ativa"
          tone="emerald"
        />
        <KpiCard
          icon={Users}
          label="Em Sessão"
          value={totals.ocupada}
          sub={`${occupancyPct}% de ocupação`}
          tone="teal"
        />
        <KpiCard
          icon={Clock}
          label="A Terminar"
          value={totals.a_terminar}
          sub="Faltam menos de 10 min"
          tone="amber"
        />
        <KpiCard
          icon={Sparkles}
          label="Higienização"
          value={totals.higienizacao}
          sub="Preparação para reutilização"
          tone="purple"
        />
        <KpiCard
          icon={DoorOpen}
          label="Total Gabinetes"
          value={totals.total}
          sub={`${totals.indisponivel} indisponíveis`}
          tone="slate"
          className="col-span-2 sm:col-span-1"
        />
      </div>

      <Card className="p-2.5 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-1.5">
            {services.map((s) => (
              <button
                key={s.id}
                onClick={() => onSelectServiceFilter(s.id)}
                className={cn(
                  'px-3 py-1.5 text-xs font-semibold rounded-md transition-colors',
                  selectedServiceFilter === s.id
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-muted text-muted-foreground hover:bg-muted/70 hover:text-foreground'
                )}
              >
                {s.label}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-2">
            {onToggleViewMode && (
              <div className="flex items-center bg-muted rounded-md p-0.5">
                <button
                  onClick={() => onToggleViewMode('architectural')}
                  className={cn(
                    'flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold rounded-sm transition-colors',
                    viewMode === 'architectural'
                      ? 'bg-background text-primary shadow-sm'
                      : 'text-muted-foreground hover:text-foreground'
                  )}
                  title="Planta Real da Arquitetura"
                >
                  <PencilRuler className="h-3.5 w-3.5" />
                  Planta Real
                </button>
                <button
                  onClick={() => onToggleViewMode('schematic')}
                  className={cn(
                    'flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold rounded-sm transition-colors',
                    viewMode === 'schematic'
                      ? 'bg-background text-primary shadow-sm'
                      : 'text-muted-foreground hover:text-foreground'
                  )}
                  title="Vista Esquemática Rápida"
                >
                  <LayoutGrid className="h-3.5 w-3.5" />
                  Esquemático
                </button>
              </div>
            )}

            {onToggleSound && (
              <Button
                variant="outline"
                size="sm"
                onClick={onToggleSound}
                className="h-8 px-2.5 text-xs gap-1.5"
                title={soundEnabled ? 'Silenciar avisos sonoros' : 'Ativar avisos sonoros de fim de sessão'}
              >
                {soundEnabled ? <Volume2 className="h-4 w-4" /> : <VolumeX className="h-4 w-4 text-muted-foreground" />}
                <span className="hidden sm:inline">{soundEnabled ? 'Som Ativo' : 'Mudo'}</span>
              </Button>
            )}

            {onToggleFullscreen && (
              <Button
                variant="outline"
                size="sm"
                onClick={onToggleFullscreen}
                className="h-8 px-2.5 text-xs gap-1.5"
                title={isFullscreen ? 'Sair do ecrã completo' : 'Modo Monitor de Receção (Ecrã Completo)'}
              >
                {isFullscreen ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
                <span className="hidden md:inline">{isFullscreen ? 'Sair Kiosk' : 'Modo Receção'}</span>
              </Button>
            )}
          </div>
        </div>
      </Card>
    </div>
  );
};
