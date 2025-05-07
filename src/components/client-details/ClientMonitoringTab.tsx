import React, { useState, useMemo } from 'react';
import { ClientDetailData, Session } from '@/types/client';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from '@/components/ui/label';
import { format, parseISO, compareDesc, isBefore } from 'date-fns';
import { Card, CardContent } from '@/components/ui/card';
import SessionMonitorInterface from '@/components/monitoring/SessionMonitorInterface'; // Importa o componente real
import { toast } from 'sonner'; // Importa toast para feedback
import useSessionMonitoring from '@/hooks/useSessionMonitoring';

// Interface para Appointments (duplicada de ClientDetailPage, idealmente mover para types)
interface Appointment {
  id: string;
  title: string;
  clientName: string;
  clientId: string;
  type: string;
  notes: string;
  date: string;
  confirmed: boolean;
}

// Estrutura unificada para sessões monitoráveis já definida em types/client.ts
// Esta interface não precisa mais ser definida aqui

interface ClientMonitoringTabProps {
  client: ClientDetailData;
  manualSessions: Session[];
  appointments: Appointment[];
  onUpdateSession: (session: Session) => void; // Função para atualizar estado/DB
}

const ClientMonitoringTab = ({ client, manualSessions, appointments, onUpdateSession }: ClientMonitoringTabProps) => {
  const [selectedMonitorSessionId, setSelectedMonitorSessionId] = useState<string | null>(null);
  
  // Usar o hook global de monitorização
  const {
    activeSession,
    setActiveSession,
    isLoading
  } = useSessionMonitoring();

  const supabase = (window as any).supabase;

  // Combina e ordena todas as sessões e agendamentos
  const allMonitorableSessions = useMemo(() => {
    const now = new Date();

    // Mapeia sessões manuais
    const mappedManualSessions = manualSessions.map(s => ({
      ...s,
      source: 'manual' as const
    }));

    // Mapeia agendamentos
    const mappedAppointments = appointments.map(app => ({
      id: app.id,
      clientId: app.clientId,
      date: app.date,
      notes: app.notes,
      type: app.type,
      source: 'calendar' as const,
      calendarTitle: app.title
    }));

    // Combina e remove duplicados (prioriza versão manual/editada se ID igual)
    const combined = [...mappedAppointments];
    mappedManualSessions.forEach(manualSession => {
        const existingIndex = combined.findIndex(item => item.id === manualSession.id);
        if (existingIndex > -1) {
            combined[existingIndex] = manualSession;
        } else {
            combined.push(manualSession);
        }
    });

    // *** Filtra itens sem ID válido ANTES de ordenar e retornar ***
    const validSessions = combined.filter(session => {
        if (!session.id || session.id.trim() === "") {
            console.warn("Sessão/Agendamento filtrado por ID inválido:", session);
            return false; // Exclui o item
        }
        return true; // Mantém o item
    });

    return validSessions.sort((a, b) => compareDesc(parseISO(a.date), parseISO(b.date)));

  }, [manualSessions, appointments]);

  const handleSelectSession = (sessionId: string) => {
    setSelectedMonitorSessionId(sessionId);
    
    // Encontra a sessão selecionada e a define como ativa no hook global
    const session = allMonitorableSessions.find(s => s.id === sessionId);
    if (session) {
      setActiveSession(session);
    }
  };
  
  // Se houver uma sessão ativa no hook global, sincronizar o seletor local
  React.useEffect(() => {
    if (activeSession && activeSession.clientId === client.id && activeSession.id !== selectedMonitorSessionId) {
      setSelectedMonitorSessionId(activeSession.id);
    }
  }, [activeSession, client.id, selectedMonitorSessionId]);

  return (
    <Card>
      <CardContent className="pt-6 space-y-6">
        <div>
          <Label htmlFor="monitor-session-selector">Selecionar Sessão para Monitorizar</Label>
          <Select 
              value={selectedMonitorSessionId || undefined}
              onValueChange={handleSelectSession}
          >
              <SelectTrigger id="monitor-session-selector" className="mt-1">
                  <SelectValue placeholder="Escolha uma sessão..." />
              </SelectTrigger>
              <SelectContent>
                  {allMonitorableSessions.length > 0 ? (
                      allMonitorableSessions.map(session => (
                          <SelectItem key={session.id} value={session.id}>
                              {session.source === 'calendar' ? session.calendarTitle || 'Agendamento' : 'Sessão Manual'} em {format(parseISO(session.date), 'dd/MM/yyyy HH:mm')} {session.terapeuta ? `(${session.terapeuta})` : ''}
                          </SelectItem>
                      ))
                  ) : (
                      <SelectItem value="none" disabled>Nenhuma sessão ou agendamento encontrado</SelectItem>
                  )}
              </SelectContent>
          </Select>
        </div>

        <div className="mt-6 min-h-[300px]"> {/* Placeholder para a interface */} 
            {selectedMonitorSessionId && activeSession ? (
                // Renderiza a interface real de monitorização usando o hook global
                <SessionMonitorInterface 
                    session={activeSession} 
                    client={client} 
                /> 
            ) : (
                <div className="flex items-center justify-center h-full text-center text-muted-foreground">
                    <p>Selecione uma sessão acima para iniciar a monitorização.</p>
                </div>
            )}
        </div>
      </CardContent>
    </Card>
  );
};

export default ClientMonitoringTab; 