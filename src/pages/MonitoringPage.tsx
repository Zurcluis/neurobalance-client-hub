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
import SessionHistory from '@/components/monitoring/SessionHistory';
import SessionMonitorInterface from '@/components/monitoring/SessionMonitorInterface';

const MonitoringPage = () => {
  // Usar o hook useClients para obter a lista de clientes
  const { clients, isLoading: isLoadingClients } = useClients();
  
  // Usar o hook de monitorização global
  const { 
    activeSession,
    setActiveSession,
    isLoading: isLoadingSession
  } = useSessionMonitoring();
  
  const [selectedClient, setSelectedClient] = useState<ClientDetailData | null>(null);
  const [sessions, setSessions] = useState<Session[]>([]);
  const [isLoadingSessions, setIsLoadingSessions] = useState(false);
  const [isClientSelectorOpen, setIsClientSelectorOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  
  // Estado para o modal de nova sessão
  const [showNewSessionModal, setShowNewSessionModal] = useState(false);
  const [sessionType, setSessionType] = useState<string>('');
  
  // Referência para a sessão recém-criada
  const [isNewSession, setIsNewSession] = useState(false);

  const supabase = (window as any).supabase;

  // Verificar se há uma sessão ativa no hook global e sincronizar
  useEffect(() => {
    if (activeSession && (!selectedClient || selectedClient.id !== activeSession.clientId)) {
      // Buscar cliente da sessão ativa
      const clientFromSession = clients.find(c => c.id === activeSession.clientId);
      if (clientFromSession) {
        setSelectedClient(clientFromSession);
      }
    }
  }, [activeSession, clients, selectedClient]);

  // Filtrar clientes com base na pesquisa
  const filteredClients = searchQuery.trim() === '' 
    ? clients 
    : clients.filter(client => 
        client.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        client.id.toLowerCase().includes(searchQuery.toLowerCase()));

  // Buscar sessões quando um cliente é selecionado
  useEffect(() => {
    const fetchSessions = async () => {
      if (!selectedClient || !supabase) {
        setSessions([]);
        return;
      }
      setIsLoadingSessions(true);
      setIsNewSession(false); // Reset do flag de nova sessão
      try {
        const { data, error } = await supabase
          .from('sessoes') // Nome da tabela de sessões
          .select('*') // Pega todos os dados da sessão
          .eq('clientId', selectedClient.id)
          .order('date', { ascending: false }); // Ordena pelas mais recentes
          
        if (error) throw error;
        setSessions(data || []);
        
        // Se há uma sessão em andamento para este cliente, selecioná-la automaticamente
        const activeSessionForClient = data?.find(s => s.status === 'em_andamento');
        if (activeSessionForClient) {
          handleSessionSelect(activeSessionForClient.id);
        } else if (activeSession && activeSession.clientId === selectedClient.id) {
          // Limpar a sessão ativa se o cliente selecionado não tem sessões em andamento
          setActiveSession(null);
        }
      } catch (error: any) {
        console.error("Erro ao buscar sessões:", error);
        toast.error(`Erro ao buscar sessões: ${error.message}`);
        setSessions([]);
      } finally {
        setIsLoadingSessions(false);
      }
    };
    fetchSessions();
  }, [selectedClient, supabase, setActiveSession, activeSession]);

  const handleSessionSelect = (sessionId: string) => {
    const session = sessions.find(s => s.id === sessionId);
    if (session) {
      // Converter para MonitorableSession
      const monitorableSession: MonitorableSession = {
        ...session,
        source: 'manual',
        calendarTitle: session.type || 'Sessão Manual'
      };
      
      // Definir como sessão ativa no hook global
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
    if (!selectedClient || !supabase || !sessionType) {
      toast.error("Selecione um cliente e um tipo de sessão");
      return;
    }

    const now = new Date();
    const newSession = {
      id: `session_${Date.now()}`,
      clientId: selectedClient.id,
      date: now.toISOString(),
      notes: "",
      paid: false,
      terapeuta: "", // Poderia ser preenchido com o usuário atual se houvesse autenticação
      type: sessionType,
      status: "em_andamento",
      duracao: 0
    };

    try {
      const { error } = await supabase
        .from('sessoes')
        .insert(newSession);

      if (error) throw error;

      // Adiciona a nova sessão ao estado local
      setSessions(prev => [newSession, ...prev]);
      
      // Converter para MonitorableSession e definir como ativa
      const monitorableSession: MonitorableSession = {
        ...newSession,
        source: 'manual',
        calendarTitle: newSession.type || 'Sessão Manual'
      };
      
      setActiveSession(monitorableSession);
      setIsNewSession(true); // Marca essa sessão como recém-criada
      setShowNewSessionModal(false);
      toast.success("Nova sessão iniciada");
    } catch (error: any) {
      console.error("Erro ao criar sessão:", error);
      toast.error(`Erro ao criar sessão: ${error.message}`);
    }
  };

  return (
    <PageLayout>
      <h1 className="text-3xl font-bold gradient-heading mb-4">Monitorização de Sessão</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
         {/* Coluna 1: Seleção Cliente/Sessão */}
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
                                ? selectedClient.name
                                : isLoadingClients ? "Carregando..." : "Selecione um cliente..."}
                            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                        </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-[--radix-popover-trigger-width] p-0 rounded-lg shadow-md border-[#E6ECEA]">
                        <Command>
                            <CommandInput 
                              placeholder="Procurar cliente..." 
                              value={searchQuery}
                              onValueChange={handleClientSearchInput}
                              className="h-10"
                            />
                            <CommandList>
                                <CommandEmpty>Nenhum cliente encontrado.</CommandEmpty>
                                <CommandGroup>
                                    {filteredClients.map((client) => (
                                        <CommandItem
                                            key={client.id}
                                            value={client.id}
                                            onSelect={(currentValue) => {
                                                const clientObj = clients.find(c => c.id === currentValue);
                                                setSelectedClient(clientObj || null);
                                                setIsClientSelectorOpen(false);
                                            }}
                                        >
                                            <Check
                                                className={cn(
                                                    "mr-2 h-4 w-4",
                                                    selectedClient?.id === client.id ? "opacity-100" : "opacity-0"
                                                )}
                                            />
                                            {client.name}
                                        </CommandItem>
                                    ))}
                                </CommandGroup>
                            </CommandList>
                        </Command>
                    </PopoverContent>
                </Popover>
            </div>

            {selectedClient && (
              <div className="space-y-4">
                {!isLoadingSessions && (
                  <div className="flex justify-between">
                    <Button 
                      variant="default" 
                      className="w-full bg-[#3A726D] hover:bg-[#265255] text-white rounded-lg shadow-md transition-transform hover:scale-[1.02]"
                      onClick={openNewSessionModal}
                    >
                      <Timer className="mr-2 h-5 w-5" />
                      Nova Sessão
                    </Button>
                  </div>
                )}

                <SessionHistory 
                  sessions={sessions} 
                  selectedSessionId={activeSession?.id}
                  onSelectSession={handleSessionSelect}
                />
              </div>
            )}
         </div>

         {/* Coluna 2 e 3: Interface de Monitorização */}
         <div className="md:col-span-2">
            {selectedClient && activeSession ? (
                <SessionMonitorInterface 
                  session={activeSession}
                  client={selectedClient}
                  autoStart={isNewSession} 
                />
            ) : (
                <div className="p-8 border rounded-xl bg-white dark:bg-gray-800 shadow-md text-center h-full flex flex-col justify-center items-center">
                    {isLoadingClients || isLoadingSession ? (
                      <p className="text-gray-500">Carregando...</p>
                    ) : !selectedClient ? (
                      <div className="space-y-4">
                        <div className="bg-gray-100 dark:bg-gray-700 rounded-full p-4 w-16 h-16 mx-auto flex items-center justify-center">
                          <ClipboardList className="h-8 w-8 text-[#3A726D]" />
                        </div>
                        <div>
                          <h3 className="text-xl font-semibold">Selecione um cliente</h3>
                          <p className="text-gray-500 mt-1">Escolha um cliente para iniciar a monitorização</p>
                        </div>
                      </div>
                    ) : isLoadingSessions ? (
                      <p className="text-gray-500">Carregando sessões...</p>
                    ) : (
                      <div className="space-y-4">
                        <div className="bg-gray-100 dark:bg-gray-700 rounded-full p-4 w-16 h-16 mx-auto flex items-center justify-center">
                          <Timer className="h-8 w-8 text-[#3A726D]" />
                        </div>
                        <div>
                          <h3 className="text-xl font-semibold">Nenhuma sessão selecionada</h3>
                          <p className="text-gray-500 mt-1">Selecione uma sessão ou crie uma nova para iniciar a monitorização</p>
                        </div>
                        <Button 
                          variant="default" 
                          className="bg-[#3A726D] hover:bg-[#265255] mt-4 shadow-md transition-transform hover:scale-105"
                          onClick={openNewSessionModal}
                        >
                          <Timer className="mr-2 h-4 w-4" />
                          Nova Sessão
                        </Button>
                      </div>
                    )}
                </div>
            )}
         </div>
      </div>

      {/* Modal de seleção de tipo de sessão */}
      <Dialog open={showNewSessionModal} onOpenChange={setShowNewSessionModal}>
        <DialogContent className="sm:max-w-[450px] rounded-xl bg-white border-[#E6ECEA] shadow-lg p-0 overflow-hidden">
          <div className="bg-[#3A726D] p-6 text-white">
            <DialogTitle className="text-xl font-semibold">Nova Sessão</DialogTitle>
            <DialogDescription className="text-[#E6ECEA] mt-1">
              Selecione o tipo de sessão para iniciar o monitoramento
            </DialogDescription>
          </div>
          
          <div className="p-6 space-y-5">
            <div className="space-y-3">
              <Label htmlFor="session-type" className="text-base font-medium">Tipo de Sessão</Label>
              <Select value={sessionType} onValueChange={setSessionType}>
                <SelectTrigger 
                  id="session-type" 
                  className="w-full border-[#E6ECEA] rounded-lg h-11"
                >
                  <SelectValue placeholder="Selecione o tipo de sessão" />
                </SelectTrigger>
                <SelectContent className="rounded-lg border-[#E6ECEA]">
                  <SelectItem value="Avaliação Inicial" className="py-3 cursor-pointer">
                    <div className="flex items-center gap-2">
                      <Clipboard className="h-4 w-4 text-[#3A726D]" />
                      <span>Avaliação Inicial</span>
                    </div>
                  </SelectItem>
                  <SelectItem value="Sessão de Neurofeedback" className="py-3 cursor-pointer">
                    <div className="flex items-center gap-2">
                      <Timer className="h-4 w-4 text-[#3A726D]" />
                      <span>Sessão de Neurofeedback</span>
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="flex justify-end space-x-3 pt-4">
              <Button 
                variant="outline" 
                onClick={() => setShowNewSessionModal(false)}
                className="rounded-lg border-[#E6ECEA]"
              >
                Cancelar
              </Button>
              <Button 
                className="bg-[#3A726D] hover:bg-[#265255] rounded-lg shadow-md transition-transform hover:scale-105" 
                onClick={createNewSession} 
                disabled={!sessionType}
              >
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
 