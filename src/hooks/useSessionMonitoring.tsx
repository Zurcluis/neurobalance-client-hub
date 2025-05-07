import { useState, useEffect, useCallback, useRef } from 'react';
import { toast } from 'sonner';
import { MonitorableSession } from '@/types/client';

// Interface para os dados do cronômetro
interface TimerData {
  isRunning: boolean;
  timeElapsed: number;
  lastSyncedTime: number;
  lastTimestamp: number;
}

// Interface para retorno do hook
interface UseSessionMonitoringResult {
  // Estado da sessão atual
  activeSession: MonitorableSession | null;
  setActiveSession: (session: MonitorableSession | null) => void;
  
  // Estado do cronômetro
  isRunning: boolean;
  timeElapsed: number;
  
  // Funções de controle
  startTimer: () => void;
  pauseTimer: () => void;
  resetTimer: () => void;
  
  // Funções de persistência
  saveSessionNotes: (notes: string) => Promise<void>;
  saveSessionTime: () => Promise<void>;
  finishSession: (notes: string) => Promise<void>;
  
  // Estado
  isLoading: boolean;
  error: string | null;
}

// Chave para armazenamento no localStorage
const TIMER_STORAGE_KEY = 'neurobalance_active_session';

/**
 * Hook para gerenciamento de monitorização de sessões com estado compartilhado entre rotas
 */
export const useSessionMonitoring = (): UseSessionMonitoringResult => {
  // Estado da sessão que está sendo monitorada
  const [activeSession, setActiveSessionState] = useState<MonitorableSession | null>(null);
  
  // Estado do cronômetro
  const [timeElapsed, setTimeElapsed] = useState<number>(0);
  const [isRunning, setIsRunning] = useState<boolean>(false);
  
  // Estado de UI
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  
  // Referência para o intervalo do cronômetro
  const timerIntervalRef = useRef<NodeJS.Timeout | null>(null);
  
  // Acesso ao Supabase
  const supabase = typeof window !== 'undefined' ? (window as any).supabase : null;

  // Definição prévia da função de salvar tempo para usar em outros lugares
  const saveSessionTime = useCallback(async () => {
    if (!activeSession || !supabase) {
      return;
    }
    
    try {
      setIsLoading(true);
      
      const { error } = await supabase
        .from('sessoes')
        .update({ duracao: timeElapsed })
        .eq('id', activeSession.id);
      
      if (error) throw error;
      
      // Atualizar o activeSession localmente com o novo tempo
      setActiveSessionState(prev => prev ? { ...prev, duracao: timeElapsed } : null);
      
    } catch (error: any) {
      console.error("Erro ao salvar tempo da sessão:", error);
      setError(`Erro ao salvar tempo: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  }, [activeSession, timeElapsed, supabase]);

  // Carregar dados do localStorage na montagem do componente
  useEffect(() => {
    const loadStoredSession = async () => {
      try {
        const storedData = localStorage.getItem(TIMER_STORAGE_KEY);
        if (storedData) {
          const { session, timer } = JSON.parse(storedData);
          if (session && timer) {
            setActiveSessionState(session);
            
            // Se o cronômetro estava rodando, calcular o tempo decorrido desde o último registro
            if (timer.isRunning) {
              const now = Date.now();
              const timePassed = Math.floor((now - timer.lastTimestamp) / 1000);
              setTimeElapsed(timer.timeElapsed + timePassed);
              // O startTimer será chamado depois que o hook estiver totalmente inicializado
              setTimeout(() => startTimer(), 0);
            } else {
              setTimeElapsed(timer.timeElapsed);
            }
          }
        }
      } catch (error) {
        console.error('Erro ao carregar sessão do localStorage:', error);
      }
    };
    
    loadStoredSession();
    
    // Cleanup
    return () => {
      if (timerIntervalRef.current) {
        clearInterval(timerIntervalRef.current);
      }
    };
  }, []);
  
  // Persistir dados no localStorage quando o estado muda
  useEffect(() => {
    if (activeSession) {
      const timerData: TimerData = {
        isRunning,
        timeElapsed,
        lastSyncedTime: timeElapsed,
        lastTimestamp: Date.now()
      };
      
      localStorage.setItem(
        TIMER_STORAGE_KEY, 
        JSON.stringify({ 
          session: activeSession, 
          timer: timerData 
        })
      );
    } else {
      // Se não há sessão ativa, remover do localStorage
      localStorage.removeItem(TIMER_STORAGE_KEY);
    }
  }, [activeSession, isRunning, timeElapsed]);
  
  // Sincronizar periodicamente o tempo com o Supabase (a cada 30 segundos)
  useEffect(() => {
    if (activeSession && isRunning) {
      const syncInterval = setInterval(() => {
        saveSessionTime();
      }, 30000); // 30 segundos
      
      return () => clearInterval(syncInterval);
    }
  }, [activeSession, isRunning, saveSessionTime]);
  
  // Setters que também atualizam localStorage
  const setActiveSession = useCallback((session: MonitorableSession | null) => {
    setActiveSessionState(session);
    if (session) {
      setTimeElapsed(session.duracao || 0);
    } else {
      setTimeElapsed(0);
      setIsRunning(false);
      if (timerIntervalRef.current) {
        clearInterval(timerIntervalRef.current);
        timerIntervalRef.current = null;
      }
    }
  }, []);
  
  // Funções de controle do cronômetro
  const startTimer = useCallback(() => {
    if (isRunning) return;
    
    setIsRunning(true);
    const intervalId = setInterval(() => {
      setTimeElapsed(prev => prev + 1);
    }, 1000);
    
    timerIntervalRef.current = intervalId;
  }, [isRunning]);
  
  const pauseTimer = useCallback(() => {
    if (!isRunning || !timerIntervalRef.current) return;
    
    clearInterval(timerIntervalRef.current);
    timerIntervalRef.current = null;
    setIsRunning(false);
    
    // Salvar o tempo no Supabase ao pausar (chamada em um tick separado para evitar referência circular)
    setTimeout(() => {
      saveSessionTime();
    }, 0);
  }, [isRunning, saveSessionTime]);
  
  const resetTimer = useCallback(() => {
    if (timerIntervalRef.current) {
      clearInterval(timerIntervalRef.current);
      timerIntervalRef.current = null;
    }
    
    setIsRunning(false);
    setTimeElapsed(0);
  }, []);
  
  const saveSessionNotes = useCallback(async (notes: string) => {
    if (!activeSession || !supabase) {
      toast.error("Sessão não encontrada ou conexão indisponível");
      return;
    }
    
    try {
      setIsLoading(true);
      
      const { error } = await supabase
        .from('sessoes')
        .update({ notes })
        .eq('id', activeSession.id);
      
      if (error) throw error;
      
      // Atualizar a sessão localmente
      setActiveSessionState(prev => prev ? { ...prev, notes } : null);
      
      toast.success("Observações salvas com sucesso");
    } catch (error: any) {
      console.error("Erro ao salvar observações:", error);
      setError(`Erro ao salvar observações: ${error.message}`);
      toast.error(`Erro ao salvar observações: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  }, [activeSession, supabase]);
  
  const finishSession = useCallback(async (notes: string) => {
    if (!activeSession || !supabase) {
      toast.error("Sessão não encontrada ou conexão indisponível");
      return;
    }
    
    // Pausar o timer se estiver rodando
    if (isRunning && timerIntervalRef.current) {
      clearInterval(timerIntervalRef.current);
      timerIntervalRef.current = null;
      setIsRunning(false);
    }
    
    try {
      setIsLoading(true);
      
      const { error } = await supabase
        .from('sessoes')
        .update({ 
          duracao: timeElapsed,
          notes,
          status: 'finalizada',
          endDate: new Date().toISOString() 
        })
        .eq('id', activeSession.id);
      
      if (error) throw error;
      
      // Limpar o estado local após finalizar
      localStorage.removeItem(TIMER_STORAGE_KEY);
      setActiveSessionState(null);
      setTimeElapsed(0);
      
      toast.success("Sessão finalizada com sucesso");
    } catch (error: any) {
      console.error("Erro ao finalizar sessão:", error);
      setError(`Erro ao finalizar sessão: ${error.message}`);
      toast.error(`Erro ao finalizar sessão: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  }, [activeSession, timeElapsed, isRunning, supabase]);
  
  return {
    activeSession,
    setActiveSession,
    isRunning,
    timeElapsed,
    startTimer,
    pauseTimer,
    resetTimer,
    saveSessionNotes,
    saveSessionTime,
    finishSession,
    isLoading,
    error
  };
};

export default useSessionMonitoring; 