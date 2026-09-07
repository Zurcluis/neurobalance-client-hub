import React from 'react';
import { RoomData } from './types';
import { CheckCircle2, Clock, Users, Sparkles, Maximize2, Minimize2, Volume2, VolumeX } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

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

  const services = [
    { id: 'all', label: 'Todas as Salas' },
    { id: 'neurofeedback', label: '🧠 Neurofeedback' },
    { id: 'yoga', label: '🧘 Yoga Nidra' },
    { id: 'avaliacao', label: '🩺 Avaliação & Diagnóstico' },
    { id: 'ocupacional', label: '🛋️ Terapia Ocupacional' },
  ];

  return (
    <div className="space-y-4 mb-6">
      {/* KPI Cards Row */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
        {/* Livres */}
        <div className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-md rounded-2xl shadow-sm border border-emerald-100 dark:border-emerald-950 p-3.5 flex items-center justify-between transition-all hover:shadow-md">
          <div>
            <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Livres</p>
            <p className="text-2xl font-black text-emerald-600 dark:text-emerald-400 mt-0.5">{totals.livre}</p>
          </div>
          <div className="p-2.5 rounded-xl bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400">
            <CheckCircle2 className="w-5 h-5" />
          </div>
        </div>

        {/* Em Sessão */}
        <div className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-md rounded-2xl shadow-sm border border-cyan-100 dark:border-cyan-950 p-3.5 flex items-center justify-between transition-all hover:shadow-md">
          <div>
            <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Em Sessão</p>
            <p className="text-2xl font-black text-[#3f9094] dark:text-[#53b8bc] mt-0.5">{totals.ocupada}</p>
          </div>
          <div className="p-2.5 rounded-xl bg-teal-50 dark:bg-teal-900/30 text-[#3f9094]">
            <Users className="w-5 h-5" />
          </div>
        </div>

        {/* A Terminar / Atrasadas */}
        <div className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-md rounded-2xl shadow-sm border border-amber-100 dark:border-amber-950 p-3.5 flex items-center justify-between transition-all hover:shadow-md">
          <div>
            <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">A Terminar</p>
            <p className="text-2xl font-black text-amber-600 dark:text-amber-400 mt-0.5">{totals.a_terminar}</p>
          </div>
          <div className="p-2.5 rounded-xl bg-amber-50 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400">
            <Clock className="w-5 h-5" />
          </div>
        </div>

        {/* Higienização */}
        <div className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-md rounded-2xl shadow-sm border border-purple-100 dark:border-purple-950 p-3.5 flex items-center justify-between transition-all hover:shadow-md">
          <div>
            <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Higienização</p>
            <p className="text-2xl font-black text-purple-600 dark:text-purple-400 mt-0.5">{totals.higienizacao}</p>
          </div>
          <div className="p-2.5 rounded-xl bg-purple-50 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400">
            <Sparkles className="w-5 h-5" />
          </div>
        </div>

        {/* Indisponíveis / Total */}
        <div className="col-span-2 sm:col-span-1 bg-white/90 dark:bg-gray-800/90 backdrop-blur-md rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 p-3.5 flex items-center justify-between transition-all hover:shadow-md">
          <div>
            <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Total Gabinetes</p>
            <p className="text-2xl font-black text-gray-800 dark:text-gray-200 mt-0.5">{totals.total}</p>
          </div>
          <Badge variant="outline" className="text-xs font-bold text-gray-600">
            {Math.round((totals.ocupada / (totals.total || 1)) * 100)}% Ocup.
          </Badge>
        </div>
      </div>

      {/* Control Bar: Filters & Quick Actions */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-white/80 dark:bg-gray-800/80 backdrop-blur-md p-2.5 rounded-2xl border border-gray-200/80 dark:border-gray-700/80 shadow-sm">
        {/* Service Filters */}
        <div className="flex flex-wrap items-center gap-1.5">
          {services.map((s) => (
            <button
              key={s.id}
              onClick={() => onSelectServiceFilter(s.id)}
              className={`px-3 py-1.5 text-xs font-semibold rounded-xl transition-all ${
                selectedServiceFilter === s.id
                  ? 'bg-[#3f9094] text-white shadow-sm'
                  : 'bg-gray-100 dark:bg-gray-700/60 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
              }`}
            >
              {s.label}
            </button>
          ))}
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2">
          {onToggleViewMode && (
            <div className="flex items-center bg-gray-100 dark:bg-gray-700 rounded-xl p-0.5">
              <button
                onClick={() => onToggleViewMode('architectural')}
                className={`px-2.5 py-1 text-xs font-bold rounded-lg transition-all ${
                  viewMode === 'architectural'
                    ? 'bg-white dark:bg-gray-800 text-[#3f9094] shadow-sm'
                    : 'text-gray-500 hover:text-gray-800'
                }`}
                title="Planta Real da Arquitetura"
              >
                📐 Planta Real
              </button>
              <button
                onClick={() => onToggleViewMode('schematic')}
                className={`px-2.5 py-1 text-xs font-bold rounded-lg transition-all ${
                  viewMode === 'schematic'
                    ? 'bg-white dark:bg-gray-800 text-[#3f9094] shadow-sm'
                    : 'text-gray-500 hover:text-gray-800'
                }`}
                title="Vista Esquemática Rápida"
              >
                📊 Esquemático
              </button>
            </div>
          )}

          {onToggleSound && (
            <Button
              variant="outline"
              size="sm"
              onClick={onToggleSound}
              className="h-8 px-2.5 rounded-xl text-xs flex items-center gap-1.5"
              title={soundEnabled ? 'Silenciar avisos sonoros' : 'Ativar avisos sonoros de fim de sessão'}
            >
              {soundEnabled ? <Volume2 className="w-4 h-4 text-emerald-600" /> : <VolumeX className="w-4 h-4 text-gray-400" />}
              <span className="hidden sm:inline">{soundEnabled ? 'Som Ativo' : 'Mudo'}</span>
            </Button>
          )}

          {onToggleFullscreen && (
            <Button
              variant="outline"
              size="sm"
              onClick={onToggleFullscreen}
              className="h-8 px-2.5 rounded-xl text-xs flex items-center gap-1.5 text-[#3f9094] hover:bg-[#3f9094]/10"
              title={isFullscreen ? 'Sair do ecrã completo' : 'Modo Monitor de Receção (Ecrã Completo)'}
            >
              {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
              <span className="hidden md:inline">{isFullscreen ? 'Sair Kiosk' : 'Modo Receção'}</span>
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};

