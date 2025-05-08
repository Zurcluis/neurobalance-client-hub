import React, { useState, useEffect } from 'react';
import PageLayout from '@/components/layout/PageLayout';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { Check, ChevronsUpDown, Timer, Clipboard, ClipboardList } from "lucide-react";
import { ClientDetailData, Session, MonitorableSession } from '@/types/client';
import { cn } from "@/lib/utils";
import { toast } from 'sonner';
import { format, parseISO } from 'date-fns';
import useClients from '@/hooks/useClients';
import useSessionMonitoring from '@/hooks/useSessionMonitoring';
import useSessions from '@/hooks/useSessions';
import SessionHistory from '@/components/monitoring/SessionHistory';
import SessionMonitorInterface from '@/components/monitoring/SessionMonitorInterface';
import { Database } from '@/integrations/supabase/types';

type Client = Database['public']['Tables']['clientes']['Row'];
type DBSession = Database['public']['Tables']['sessoes_ativas']['Row'];

const MonitoringPage = () => {
  // Use hooks for data management
  const { clients, isLoading: isLoadingClients } = useClients();
  const { sessions, isLoading: isLoadingSessions, addSession } = useSessions();
  const { 
    activeSession,
    setActiveSession,
    isLoading: isLoadingSession,
    startTimer,
    pauseTimer,
    saveSessionNotes,
    finishSession
  } = useSessionMonitoring();
  
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [isClientSelectorOpen, setIsClientSelectorOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  
  // State for new session modal
  const [showNewSessionModal, setShowNewSessionModal] = useState(false);
  const [sessionType, setSessionType] = useState<string>('');
  const [isNewSession, setIsNewSession] = useState(false);

  // Check if there's an active session in the global hook and sync
  useEffect(() => {
    if (activeSession && (!selectedClient || selectedClient.id.toString() !== activeSession.clientId)) {
      const clientFromSession = clients.find(c => c.id.toString() === activeSession.clientId);
      if (clientFromSession) {
        setSelectedClient(clientFromSession);
      }
    }
  }, [activeSession, clients, selectedClient]);

  // Filter clients based on search
  const filteredClients = searchQuery.trim() === '' 
    ? clients 
    : clients.filter(client => 
        client.nome.toLowerCase().includes(searchQuery.toLowerCase()) ||
        client.id.toString().includes(searchQuery.toLowerCase()));

  const handleSessionSelect = (sessionId: string) => {
    const session = sessions.find(s => s.id === sessionId);
    if (session) {
      const monitorableSession: MonitorableSession = {
        ...session,
        source: 'manual',
        calendarTitle: session.type || 'Sessão Manual'
      };
      
      setActiveSession(monitorableSession);
      setIsNewSession(false);
    }
  };

  const handleClientSearchInput = (value: string) => {
    setSearchQuery(value);
  };

  const openNewSessionModal = () => {
    setSessionType('');
    setShowNewSessionModal(true);
  };

  const createNewSession = async () => {
    if (!selectedClient || !sessionType) {
      toast.error("Selecione um cliente e um tipo de sessão");
      return;
    }

    const now = new Date();
    const newSession = {
      id_cliente: selectedClient.id,
      inicio: now.toISOString(),
      fim: null,
      duracao: 0,
      notas: "",
      status: "em_andamento"
    };

    try {
      const session = await addSession(newSession);
      
      // Convert to MonitorableSession and set as active
      const monitorableSession: MonitorableSession = {
        ...session,
        source: 'manual',
        calendarTitle: sessionType
      };
      
      setActiveSession(monitorableSession);
      setIsNewSession(true);
      setShowNewSessionModal(false);
      toast.success("Nova sessão iniciada");
    } catch (error: any) {
      console.error("Erro ao criar sessão:", error);
      toast.error(`Erro ao criar sessão: ${error.message}`);
    }
  };

  // Convert MonitorableSession to DBSession for the interface
  const convertToDBSession = (session: MonitorableSession): DBSession => {
    return {
      id: parseInt(session.id),
      id_cliente: parseInt(session.clientId),
      inicio: session.date,
      fim: session.endDate || '',
      duracao: session.duracao || 0,
      notas: session.notes,
      criado_em: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
  };

  return (
    <PageLayout>
      <h1 className="text-3xl font-bold gradient-heading mb-4">Monitorização de Sessão</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
         {/* Column 1: Client/Session Selection */}
         <div className="md:col-span-1 space-y-4">
            <div>
                <Label htmlFor="client-selector" className="text-base font-medium">Selecionar Cliente</Label>
                <Popover open={isClientSelectorOpen} onOpenChange={setIsClientSelectorOpen}>
                    <PopoverTrigger asChild>
                        <Button
                            variant="outline"
                            role="combobox"
                            aria-expanded={isClientSelectorOpen}
                            className="w-full justify-between mt-1 rounded-lg h-10 border-[#E6ECEA]"
                            disabled={isLoadingClients}
                        >
                            {selectedClient
                                ? selectedClient.nome
                                : isLoadingClients ? "Carregando..." : "Selecione um cliente..."}
                            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                        </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-[--radix-popover-trigger-width] p-0">
                        <Command>
                            <CommandInput 
                                placeholder="Pesquisar cliente..." 
                                value={searchQuery}
                                onValueChange={handleClientSearchInput}
                            />
                            <CommandList>
                                <CommandEmpty>Nenhum cliente encontrado.</CommandEmpty>
                                <CommandGroup>
                                    {filteredClients.map((client) => (
                                        <CommandItem
                                            key={client.id}
                                            value={client.nome}
                                            onSelect={() => {
                                                setSelectedClient(client);
                                                setIsClientSelectorOpen(false);
                                            }}
                                        >
                                            <Check
                                                className={cn(
                                                    "mr-2 h-4 w-4",
                                                    selectedClient?.id === client.id ? "opacity-100" : "opacity-0"
                                                )}
                                            />
                                            {client.nome}
                                        </CommandItem>
                                    ))}
                                </CommandGroup>
                            </CommandList>
                        </Command>
                    </PopoverContent>
                </Popover>
            </div>

            {/* Session History */}
            {selectedClient && (
                <div className="mt-4">
                    <SessionHistory 
                        sessions={sessions}
                        selectedSessionId={activeSession?.id}
                        onSelectSession={handleSessionSelect}
                    />
                </div>
            )}
         </div>

         {/* Column 2: Session Monitor */}
         <div className="md:col-span-2">
            {activeSession && selectedClient ? (
                <SessionMonitorInterface 
                    client={selectedClient}
                    activeSession={convertToDBSession(activeSession)}
                    startSession={async () => { await startTimer(); }}
                    pauseSession={async () => { await pauseTimer(); }}
                    resumeSession={async () => { await startTimer(); }}
                    finishSession={async (notes: string) => { await finishSession(notes); }}
                    saveSessionNotes={async (notes: string) => { await saveSessionNotes(notes); }}
                    isLoading={isLoadingSession}
                    autoStart={isNewSession}
                />
            ) : (
                <div className="flex flex-col items-center justify-center h-[400px] bg-gray-50 rounded-lg border-2 border-dashed border-gray-200">
                    <Timer className="h-12 w-12 text-gray-400 mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">Nenhuma sessão selecionada</h3>
                    <p className="text-sm text-gray-500 mb-4">
                        Selecione um cliente e uma sessão para começar a monitorização
                    </p>
                    {selectedClient && (
                        <Button onClick={openNewSessionModal}>
                            Iniciar Nova Sessão
                        </Button>
                    )}
                </div>
            )}
         </div>
      </div>

      {/* New Session Modal */}
      <Dialog open={showNewSessionModal} onOpenChange={setShowNewSessionModal}>
        <DialogContent>
            <DialogHeader>
                <DialogTitle>Nova Sessão</DialogTitle>
                <DialogDescription>
                    Selecione o tipo de sessão para iniciar
                </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
                <div>
                    <Label htmlFor="session-type">Tipo de Sessão</Label>
                    <Select value={sessionType} onValueChange={setSessionType}>
                        <SelectTrigger>
                            <SelectValue placeholder="Selecione o tipo de sessão" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="regular">Sessão Regular</SelectItem>
                            <SelectItem value="avaliacao">Avaliação</SelectItem>
                            <SelectItem value="retorno">Retorno</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
                <div className="flex justify-end space-x-2">
                    <Button variant="outline" onClick={() => setShowNewSessionModal(false)}>
                        Cancelar
                    </Button>
                    <Button onClick={createNewSession} disabled={!sessionType}>
                        Iniciar Sessão
                    </Button>
                </div>
            </div>
        </DialogContent>
      </Dialog>
    </PageLayout>
  );
};

export default MonitoringPage;
 