import React, { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { PlayCircle, PauseCircle, StopCircle, Save } from 'lucide-react';
import { useTimer } from '@/hooks/useTimer';
import { Database } from '@/integrations/supabase/types';

type Client = Database['public']['Tables']['clientes']['Row'];
type Session = Database['public']['Tables']['sessoes_ativas']['Row'];

interface SessionMonitorInterfaceProps {
  client: Client;
  activeSession: Session | null;
  startSession: () => Promise<void>;
  pauseSession: () => Promise<void>;
  resumeSession: () => Promise<void>;
  finishSession: (notes: string) => Promise<void>;
  saveSessionNotes: (notes: string) => Promise<void>;
  isLoading: boolean;
  autoStart?: boolean;
}

const SessionMonitorInterface: React.FC<SessionMonitorInterfaceProps> = ({
  client,
  activeSession,
  startSession,
  pauseSession,
  resumeSession,
  finishSession,
  saveSessionNotes,
  isLoading,
  autoStart = false,
}) => {
  const { time, isRunning, start, pause, reset } = useTimer();
  const [observations, setObservations] = useState('');

  useEffect(() => {
    if (autoStart && activeSession?.status === 'em_andamento' && !isRunning) {
      start();
    }
  }, [autoStart, activeSession, isRunning, start]);

  useEffect(() => {
    if (activeSession) {
      setObservations(activeSession.notes || '');
    }
  }, [activeSession]);

  const handleSaveNotes = async () => {
    await saveSessionNotes(observations);
  };

  const handleFinishSession = async () => {
    await finishSession(observations);
    reset();
  };

  const calculateAge = (birthDate: string | null): string => {
    if (!birthDate) return "N/A";
    const today = new Date();
    const birth = new Date(birthDate);
    let age = today.getFullYear() - birth.getFullYear();
    const monthDiff = today.getMonth() - birth.getMonth();
    
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
      age--;
    }
    
    return `${age} anos`;
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Informações do Cliente</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <p><strong>Nome:</strong> {client.nome}</p>
              <p><strong>Email:</strong> {client.email}</p>
              <p><strong>Telefone:</strong> {client.telefone}</p>
              <p><strong>Idade:</strong> {calculateAge(client.data_nascimento)}</p>
            </div>
            <div>
              <p><strong>Género:</strong> {client.genero}</p>
              <p><strong>Morada:</strong> {client.morada}</p>
              <p><strong>Estado:</strong> {client.estado}</p>
              <p><strong>Tipo de Contacto:</strong> {client.tipo_contato}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>
            {activeSession?.status === 'em_andamento'
              ? 'Sessão em Andamento'
              : activeSession?.status === 'finalizada'
              ? 'Sessão Finalizada'
              : 'Nova Sessão'}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="text-center">
              <div className="text-4xl font-mono mb-4">
                {String(Math.floor(time / 3600)).padStart(2, '0')}:
                {String(Math.floor((time % 3600) / 60)).padStart(2, '0')}:
                {String(time % 60).padStart(2, '0')}
              </div>
              <div className="flex justify-center gap-2">
                {!activeSession ? (
                  <Button
                    onClick={startSession}
                    disabled={isLoading || activeSession?.status === 'finalizada'}
                  >
                    <PlayCircle className="h-5 w-5 mr-2" />
                    Iniciar Sessão
                  </Button>
                ) : isRunning ? (
                  <Button
                    onClick={pauseSession}
                    disabled={isLoading || activeSession?.status === 'finalizada'}
                  >
                    <PauseCircle className="h-5 w-5 mr-2" />
                    Pausar
                  </Button>
                ) : (
                  <Button
                    onClick={resumeSession}
                    disabled={isLoading || activeSession?.status === 'finalizada'}
                  >
                    <PlayCircle className="h-5 w-5 mr-2" />
                    Retomar
                  </Button>
                )}
                {activeSession && (
                  <Button
                    onClick={handleFinishSession}
                    disabled={isLoading || activeSession?.status === 'finalizada'}
                    variant="destructive"
                  >
                    <StopCircle className="h-5 w-5 mr-2" />
                    Finalizar
                  </Button>
                )}
              </div>
            </div>

            <div className="space-y-2">
              <label className="font-medium">Observações</label>
              <Textarea
                value={observations}
                onChange={(e) => setObservations(e.target.value)}
                placeholder="Adicione observações sobre a sessão..."
                className="min-h-[100px]"
                disabled={isLoading || activeSession?.status === 'finalizada'}
              />
              <Button
                onClick={handleSaveNotes}
                variant="outline"
                className="w-full"
                disabled={isLoading || activeSession?.status === 'finalizada'}
              >
                <Save className="h-4 w-4 mr-2" />
                Salvar Observações
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default SessionMonitorInterface; 