import React, { useState, useEffect } from 'react';
import { ClientDetailData } from '@/types/client';
import { MonitorableSession } from '@/types/client';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Play, Pause, RotateCcw, Save, Timer, CheckCircle2 } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import useSessionMonitoring from '@/hooks/useSessionMonitoring';

interface SessionMonitorInterfaceProps {
  session: MonitorableSession;
  client: ClientDetailData;
  autoStart?: boolean;
}

// Função para formatar tempo (segundos -> HH:MM:SS)
const formatTime = (totalSeconds: number): string => {
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
};

const SessionMonitorInterface = ({ session, client, autoStart = false }: SessionMonitorInterfaceProps) => {
  // Usar o hook global para monitorização
  const {
    activeSession,
    setActiveSession,
    isRunning,
    timeElapsed,
    startTimer,
    pauseTimer,
    resetTimer,
    saveSessionNotes,
    finishSession,
    isLoading
  } = useSessionMonitoring();

  // Estado local apenas para o texto de observações e modal
  const [observations, setObservations] = useState('');
  const [showFinishDialog, setShowFinishDialog] = useState(false);

  // Inicializar a sessão ativa no hook quando o componente é montado ou a sessão muda
  useEffect(() => {
    // Verificar se a sessão no hook é diferente da que estamos monitorando agora
    if (!activeSession || activeSession.id !== session.id) {
      setActiveSession(session);
    }
    
    // Iniciar automaticamente o cronômetro se a flag estiver ativa
    if (autoStart && session.status === 'em_andamento' && !isRunning) {
      startTimer();
    }
  }, [session, autoStart, activeSession, setActiveSession, startTimer, isRunning]);

  // Sincronizar o estado local de observações com o da sessão ativa
  useEffect(() => {
    if (activeSession) {
      setObservations(activeSession.notes || '');
    }
  }, [activeSession]);

  // Handler para salvar observações
  const handleSaveNotes = async () => {
    await saveSessionNotes(observations);
  };

  // Handler para finalizar sessão
  const handleFinishSession = async () => {
    await finishSession(observations);
    setShowFinishDialog(false);
  };

  // Função para calcular idade (duplicada, idealmente mover para utils)
  const calculateAge = (birthday: string | undefined): string => {
    if (!birthday) return "N/A";
    try {
      const birthDate = new Date(birthday);
      const today = new Date();
      let age = today.getFullYear() - birthDate.getFullYear();
      const m = today.getMonth() - birthDate.getMonth();
      if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
        age--;
      }
      return `${age} anos`;
    } catch (e) {
      return "N/A";
    }
  };

  return (
    <div className="p-6 border rounded-xl bg-background shadow-md space-y-6">
      {/* Título e Tipo da Sessão */}
      <div className="flex justify-between items-center">
        <h3 className="text-xl font-semibold">
          Monitorizando: {activeSession?.source === 'calendar' ? activeSession.calendarTitle || 'Agendamento' : 'Sessão Manual'}
        </h3>
        <span className="text-sm font-medium px-3 py-1.5 rounded-full bg-primary/10 text-primary">
          {activeSession?.type || (activeSession?.source === 'manual' ? 'Manual' : 'Não especificado')}
        </span>
      </div>
      
      {/* Dados do Cliente */}
      <Card className="overflow-hidden rounded-xl border-[#E6ECEA] shadow-sm">
        <CardHeader><CardTitle className="text-base">Dados do Cliente</CardTitle></CardHeader>
        <CardContent className="text-sm space-y-1">
          <p><strong>Nome:</strong> {client.name}</p>
          <p><strong>Idade:</strong> {calculateAge(client.birthday)}</p>
          <p><strong>Total de Sessões (Realizadas):</strong> {client.sessionCount}</p>
          <p><strong>Estado da Sessão:</strong> {
            activeSession?.status === 'em_andamento' 
              ? (isRunning ? 'Em andamento' : 'Pausada') 
              : activeSession?.status === 'finalizada' 
                ? 'Finalizada' 
                : 'Não iniciada'
          }</p>
        </CardContent>
      </Card>

      {/* Cronômetro */}
      <Card className="overflow-hidden rounded-xl border-[#E6ECEA] shadow-sm">
        <CardHeader className="pb-0">
          <CardTitle className="text-base">Cronômetro da Sessão</CardTitle>
        </CardHeader>
        <CardContent className="py-8">
          <div className="flex flex-col items-center justify-center gap-6">
            {/* Display do cronômetro */}
            <div className="text-5xl font-mono font-semibold tabular-nums text-center py-6">
              {formatTime(timeElapsed)}
            </div>
            
            {/* Controles do cronômetro */}
            <div className="flex gap-4 justify-center">
              {!isRunning ? (
                <Button 
                  variant="default" 
                  className="bg-[#3A726D] hover:bg-[#265255] rounded-full h-14 w-14 p-0 shadow-md transition-transform hover:scale-105" 
                  onClick={startTimer} 
                  aria-label="Iniciar cronômetro"
                  disabled={isLoading || activeSession?.status === 'finalizada'}
                >
                  <Play className="h-7 w-7" />
                </Button>
              ) : (
                <Button 
                  variant="default" 
                  className="bg-amber-600 hover:bg-amber-700 rounded-full h-14 w-14 p-0 shadow-md transition-transform hover:scale-105" 
                  onClick={pauseTimer} 
                  aria-label="Pausar cronômetro"
                  disabled={isLoading}
                >
                  <Pause className="h-7 w-7" />
                </Button>
              )}
              
              <Button 
                variant="outline" 
                className="rounded-full h-14 w-14 p-0 border-gray-300 shadow-sm transition-transform hover:scale-105" 
                onClick={resetTimer} 
                aria-label="Reiniciar cronômetro"
                disabled={isLoading || activeSession?.status === 'finalizada'}
              >
                <RotateCcw className="h-6 w-6" />
              </Button>
              
              <Button 
                variant="default" 
                className="bg-green-600 hover:bg-green-700 rounded-full h-14 w-14 p-0 shadow-md transition-transform hover:scale-105" 
                onClick={() => setShowFinishDialog(true)} 
                aria-label="Finalizar sessão"
                disabled={isLoading || activeSession?.status === 'finalizada'}
              >
                <CheckCircle2 className="h-7 w-7" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Observações */}
      <div className="space-y-2">
        <Label htmlFor="session-observations" className="text-base font-medium">Observações em Tempo Real</Label>
        <Textarea 
          id="session-observations"
          value={observations}
          onChange={(e) => setObservations(e.target.value)}
          placeholder="Digite suas observações aqui..."
          className="min-h-[150px] text-sm rounded-xl border-[#E6ECEA]"
          disabled={isLoading || activeSession?.status === 'finalizada'}
        />
      </div>

      {/* Botão Salvar */}
      <div className="flex justify-end">
        <Button 
          onClick={handleSaveNotes} 
          className="flex items-center gap-2 bg-[#3A726D] hover:bg-[#265255] rounded-lg px-5 py-2 shadow-md transition-transform hover:scale-105"
          disabled={isLoading || activeSession?.status === 'finalizada'}
        >
          <Save className="h-4 w-4"/>
          Salvar Observações
        </Button>
      </div>
      
      {/* Modal de Confirmação */}
      <Dialog open={showFinishDialog} onOpenChange={setShowFinishDialog}>
        <DialogContent className="sm:max-w-[425px] rounded-xl bg-white p-6 border-[#E6ECEA]">
          <DialogHeader>
            <DialogTitle className="text-xl font-semibold text-[#3A726D]">Finalizar Sessão</DialogTitle>
            <DialogDescription className="text-gray-600">
              Deseja finalizar esta sessão? O tempo total será registrado e a sessão será marcada como concluída.
            </DialogDescription>
          </DialogHeader>
          <div className="py-6 space-y-2">
            <p className="text-sm">
              <strong>Tipo:</strong> {activeSession?.type || 'Não especificado'}
            </p>
            <p className="text-sm">
              <strong>Cliente:</strong> {client.name}
            </p>
            <p className="text-sm">
              <strong>Tempo total:</strong> {formatTime(timeElapsed)}
            </p>
          </div>
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => setShowFinishDialog(false)}
              className="rounded-lg border-gray-300"
              disabled={isLoading}
            >
              Cancelar
            </Button>
            <Button 
              className="bg-[#3A726D] hover:bg-[#265255] rounded-lg shadow-sm" 
              onClick={handleFinishSession}
              disabled={isLoading}
            >
              {isLoading ? 'Finalizando...' : 'Finalizar Sessão'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default SessionMonitorInterface; 