import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Calendar, Check, Edit, FileText, Trash2, Upload, Filter, Clock, SortAsc, SortDesc, FileType, Clipboard, RefreshCw, Link2Off } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogClose, DialogDescription } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { useForm } from 'react-hook-form';
import { ClientDetailData, Session } from '@/types/client';
import { Progress } from '@/components/ui/progress';
import { parseISO, isBefore, format, compareDesc, isAfter } from 'date-fns';
import { toast } from 'sonner';
import { ptBR } from 'date-fns/locale';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import useAppointments from '@/hooks/useAppointments';
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";

// Interface para representar um agendamento do calendário
interface Appointment {
  id: number;
  titulo: string;
  data: string;
  hora: string;
  id_cliente: number;
  tipo: string;
  notas: string;
  estado: string;
  terapeuta?: string;
  clientes: {
    nome: string;
    email: string;
    telefone: string;
  };
}

// Estrutura de dados para o formulário de edição
interface EditSessionFormData {
    notes: string;
    terapeuta?: string;
    duration?: number;
    filesToUpload?: FileList;
    titulo?: string;
    tipo?: string;
    estado?: string;
}

// Definição do tipo de arquivo para resolver incompatibilidade de tipos
interface SessionFile {
    name: string;
    path: string;
    uploadedAt: string;
}

// Estrutura unificada para renderizar sessões realizadas
interface RealizedSessionView extends Omit<Session, 'arquivos'> {
    isFromCalendar: boolean;
    calendarTitle?: string;
    status?: string;
    sessionType?: string;
    duration?: number;
    arquivos: SessionFile[];
    time?: string;
}

interface ClientSessionsProps {
  sessions: Session[];
  clientId: string;
  onAddSession: (session: Session) => void;
  onUpdateClient: (client: ClientDetailData) => void;
  onUpdateSession: (session: Session) => void;
  client: ClientDetailData;
}

const ClientSessions = ({ sessions, clientId, onAddSession, client, onUpdateClient, onUpdateSession }: ClientSessionsProps) => {
  const [isSessionDialogOpen, setIsSessionDialogOpen] = useState(false);
  const [isMaxSessionsDialogOpen, setIsMaxSessionsDialogOpen] = useState(false);
  const [isCompleteDialogOpen, setIsCompleteDialogOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [sessionToEdit, setSessionToEdit] = useState<RealizedSessionView | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [refreshTrigger, setRefreshTrigger] = useState<number>(0);
  const [syncProgress, setSyncProgress] = useState<boolean>(false);
  const lastUpdatedValueRef = useRef<number>(-1);
  
  // Estados para filtragem e ordenação
  const [filterType, setFilterType] = useState<string>('all');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [searchText, setSearchText] = useState<string>('');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  
  // Obter dados de agendamentos diretamente do hook
  const { appointments, isLoading: isLoadingAppointments } = useAppointments();

  const sessionForm = useForm<Session>();
  const maxSessionsForm = useForm<{ maxSessions: number }>({
    defaultValues: { maxSessions: client.max_sessoes || 0 }
  });
  const editSessionForm = useForm<EditSessionFormData>();

  const [pastCalendarAppointments, setPastCalendarAppointments] = useState<Appointment[]>([]);
  const [upcomingAppointments, setUpcomingAppointments] = useState<Appointment[]>([]);
  const [completedSessionsPercentage, setCompletedSessionsPercentage] = useState(0);
  const [totalRealizedCount, setTotalRealizedCount] = useState(0);
  const [totalUpcomingCount, setTotalUpcomingCount] = useState(0);
  const [sessionNotes, setSessionNotes] = useState<{ [key: string]: string }>({});

  const supabase = (window as any).supabase;

  const loadFromStorage = <T extends unknown>(key: string, defaultValue: T): T => {
    const storedData = localStorage.getItem(key);
    return storedData ? JSON.parse(storedData) : defaultValue;
  };

  const saveToStorage = <T extends unknown>(key: string, data: T): void => {
    localStorage.setItem(key, JSON.stringify(data));
  };

  // Função para forçar a atualização dos dados
  const refreshData = () => {
    setRefreshTrigger(prev => prev + 1);
    toast.success("Dados atualizados");
  };

  useEffect(() => {
    // Filtrar agendamentos do cliente atual
    if (!isLoadingAppointments && appointments && client && client.id) {
      const clientAppointments = appointments.filter(apt => apt.id_cliente === client.id);
    
      const now = new Date();
      // Separar agendamentos passados e futuros
      const pastAppointments = clientAppointments.filter(app => {
        try {
          const appDate = parseISO(app.data);
          return !isNaN(appDate.getTime()) && 
                 (isBefore(appDate, now) || app.estado === 'realizado');
        } catch (error) {
          console.error(`Erro ao processar data do agendamento ${app.id}: ${app.data}`, error);
          return false;
        }
      });
      
      const futureAppointments = clientAppointments.filter(app => {
        try {
          const appDate = parseISO(app.data);
          return !isNaN(appDate.getTime()) && 
                 isAfter(appDate, now) && 
                 app.estado !== 'realizado' && 
                 app.estado !== 'cancelado';
        } catch (error) {
          console.error(`Erro ao processar data do agendamento ${app.id}: ${app.data}`, error);
          return false;
        }
      }).sort((a, b) => new Date(a.data).getTime() - new Date(b.data).getTime());

      setPastCalendarAppointments(pastAppointments);
      setUpcomingAppointments(futureAppointments);
      setTotalUpcomingCount(futureAppointments.length);
    }
  }, [appointments, isLoadingAppointments, client.id, refreshTrigger]);

  // Carregar notas de sessão
  useEffect(() => {
    const loadSessionNotes = async () => {
      if (!supabase || !client.id) return;
      
      try {
        const { data, error } = await supabase
          .from('sessoes')
          .select('id, notes')
          .eq('id_cliente', client.id);
        
        if (error) throw error;
        
        const notesMap: { [key: string]: string } = {};
        data.forEach((session: any) => {
          if (session.notes) {
            notesMap[session.id] = session.notes;
          }
        });
        
        setSessionNotes(notesMap);
      } catch (error) {
        console.error('Erro ao carregar notas das sessões:', error);
      }
    };
    
    loadSessionNotes();
  }, [supabase, client.id, refreshTrigger]);

  // Processar arquivos de sessão para novo formato
  const processSessionFiles = (files: any[]): SessionFile[] => {
    if (!files) return [];
    
    return files.map(file => {
      if (typeof file === 'string') {
        return {
          name: file.split('/').pop() || 'arquivo',
          path: file,
          uploadedAt: new Date().toISOString()
        };
      }
      return file as SessionFile;
    });
  };

  const allRealizedSessions = useMemo((): RealizedSessionView[] => {
    const manualSessionsView: RealizedSessionView[] = sessions.map(s => ({ 
        ...s, 
      isFromCalendar: false,
      sessionType: s.type || 'Sessão Manual',
      duration: s.duracao,
      arquivos: processSessionFiles(s.arquivos || [])
    }));

    const pastCalendarSessionsView: RealizedSessionView[] = pastCalendarAppointments.map(app => {
      const existingManualSession = sessions.find(s => s.id === app.id.toString());
      const sessionNote = sessionNotes[app.id.toString()] || app.notas || '';
      
      // Formatar a hora do agendamento para garantir consistência
      const appDate = parseISO(app.data);
      const formattedTime = app.hora || format(appDate, 'HH:mm');
      
      if (existingManualSession) {
        return { 
          ...existingManualSession, 
          isFromCalendar: true, 
          calendarTitle: app.titulo,
          status: app.estado,
          sessionType: app.tipo,
          notes: sessionNote,
          terapeuta: app.terapeuta ?? existingManualSession.terapeuta,
          arquivos: processSessionFiles(existingManualSession.arquivos || []),
          time: formattedTime // Adicionar o campo time para garantir consistência
        };
      } else {
        return {
          id: app.id.toString(),
          clientId: app.id_cliente.toString(),
          date: app.data,
          notes: sessionNote,
          paid: false,
          terapeuta: app.terapeuta ?? '',
          arquivos: [],
          isFromCalendar: true,
          calendarTitle: app.titulo,
          status: app.estado,
          sessionType: app.tipo,
          time: formattedTime // Adicionar o campo time para garantir consistência
        };
      }
    });
    
    const combined = [...manualSessionsView, ...pastCalendarSessionsView];
    
    // Remova duplicatas, preferindo sempre a versão do calendário se tiver status "realizado"
    const uniqueSessions = combined.reduce((acc, current) => {
      const existingIndex = acc.findIndex(item => item.id === current.id);
      
      if (existingIndex === -1) {
        // Se não existe, adiciona
        return [...acc, current];
      } else {
        const existing = acc[existingIndex];
        
        // Se a sessão atual é do calendário e tem status "realizado", ou a existente não tem
        if ((current.isFromCalendar && current.status === 'realizado') || 
            (existing.isFromCalendar === false && current.isFromCalendar)) {
          // Substitui a existente
          return acc.map((s, i) => i === existingIndex ? {
            ...s,
            ...current,
            // Preserva os arquivos e notas da sessão manual se existirem
            arquivos: existing.arquivos?.length ? existing.arquivos : current.arquivos,
            notes: existing.notes || current.notes,
          } : s);
        }
        
        // Caso contrário, mantém a existente
        return acc;
      }
    }, [] as RealizedSessionView[]);

    return uniqueSessions.sort((a, b) => {
      const dateA = parseISO(a.date);
      const dateB = parseISO(b.date);
      return sortOrder === 'desc' ? compareDesc(dateA, dateB) : compareDesc(dateB, dateA);
    });

  }, [sessions, pastCalendarAppointments, sessionNotes, sortOrder, refreshTrigger]);

  // Aplicar filtros à lista de sessões
  const filteredSessions = useMemo(() => {
    return allRealizedSessions.filter(session => {
      // Filtro por tipo
      if (filterType !== 'all' && session.sessionType?.toLowerCase() !== filterType.toLowerCase()) {
        return false;
      }
      
      // Filtro por status
      if (filterStatus !== 'all') {
        if (filterStatus === 'realizado' && session.status !== 'realizado') {
          return false;
        }
        if (filterStatus === 'nao_realizado' && session.status === 'realizado') {
          return false;
        }
      }
      
      // Filtro por texto de busca
      if (searchText) {
        const searchLower = searchText.toLowerCase();
        const matchesType = session.sessionType?.toLowerCase().includes(searchLower);
        const matchesNotes = session.notes?.toLowerCase().includes(searchLower);
        const matchesTherapist = session.terapeuta?.toLowerCase().includes(searchLower);
        const matchesCalendarTitle = session.calendarTitle?.toLowerCase().includes(searchLower);
        
        return matchesType || matchesNotes || matchesTherapist || matchesCalendarTitle;
      }
      
      return true;
    });
  }, [allRealizedSessions, filterType, searchText, filterStatus]);

  // Função para sincronizar manualmente
  const syncSessionCount = () => {
    const realizedCount = allRealizedSessions.filter(s => s.status === 'confirmado').length;
    if (client.numero_sessoes !== realizedCount) {
      onUpdateClient({
        ...client,
        numero_sessoes: realizedCount
      });
      lastUpdatedValueRef.current = realizedCount;
      toast.success("Contagem de sessões sincronizada com sucesso!");
    } else {
      toast.info("Contagem de sessões já está sincronizada!");
    }
  };

  useEffect(() => {
    // Conta apenas sessões com status 'confirmado'
    const realizedCount = allRealizedSessions.filter(s => s.status === 'confirmado').length;
    setTotalRealizedCount(realizedCount);

    const maxSessions = client.max_sessoes || 0;
    let completedPercentage = 0;
    if (maxSessions > 0) {
       completedPercentage = (realizedCount / maxSessions) * 100;
    }
    setCompletedSessionsPercentage(completedPercentage > 100 ? 100 : completedPercentage);

    // Atualização automática APENAS se sincProgress estiver ativado
    // E se nunca tivermos atualizado antes ou se o valor mudou desde a última atualização
    if (syncProgress && 
        client.numero_sessoes !== realizedCount && 
        lastUpdatedValueRef.current !== realizedCount) {
      lastUpdatedValueRef.current = realizedCount;
      onUpdateClient({
        ...client,
        numero_sessoes: realizedCount
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [allRealizedSessions, client.max_sessoes]);

  useEffect(() => {
    if (sessionToEdit) {
      editSessionForm.reset({
        notes: sessionToEdit.notes || '',
        terapeuta: sessionToEdit.terapeuta || '',
        duration: sessionToEdit.duration,
        filesToUpload: undefined,
        titulo: sessionToEdit.calendarTitle || '',
        tipo: sessionToEdit.sessionType || '',
        estado: sessionToEdit.status || ''
      });
      setIsEditModalOpen(true);
    } else {
      setIsEditModalOpen(false);
    }
  }, [sessionToEdit, editSessionForm]);

  const handleDeleteSession = (sessionId: string) => {
    const sessionToDelete = sessions.find(s => s.id === sessionId);
    if (!sessionToDelete) {
        toast.error("Não é possível eliminar sessões originadas no calendário.");
        return;
    }

    const allSessions = loadFromStorage<Session[]>('sessions', []);
    const updatedSessions = allSessions.filter(session => session.id !== sessionId);
    saveToStorage('sessions', updatedSessions);
    
    if (client.id) {
    const clients = loadFromStorage<ClientDetailData[]>('clients', []);
      const updatedClients = clients.map(c => {
        if (c.id === client.id) {
          return {
            ...c, 
            numero_sessoes: Math.max(0, (c.numero_sessoes || 0) - 1)
          };
        }
        return c;
      });
    saveToStorage('clients', updatedClients);
    }
    
    toast.success("Sessão eliminada com sucesso");
    window.location.reload();
  };

  const handleSetMaxSessions = (data: { maxSessions: number }) => {
    const updatedClient = { ...client, max_sessoes: data.maxSessions };
    onUpdateClient(updatedClient);
    setIsMaxSessionsDialogOpen(false);
    toast.success("Número máximo de sessões definido com sucesso");
  };

  const handleCompleteProcess = () => {
    const updatedClient = { ...client, status: 'finished' as const };
    onUpdateClient(updatedClient);
    setIsCompleteDialogOpen(false);
    toast.success("Processo concluído com sucesso");
    setTimeout(() => { window.location.href = '/clients'; }, 1500);
  };

  const handleSaveEdit = async (data: EditSessionFormData) => {
      if (!sessionToEdit || !supabase) {
          toast.error("Erro: Sessão não encontrada ou Supabase não conectado.");
          return;
      }

      setIsUploading(true);
      let uploadedFilePaths: SessionFile[] = [];

      if (data.filesToUpload && data.filesToUpload.length > 0) {
          const files = Array.from(data.filesToUpload);
          const uploadPromises = files.map(async (file) => {
              const filePath = `sessoes/${sessionToEdit.id}/${file.name}`;
              const { data: uploadData, error } = await supabase.storage
                  .from('ficheiros').upload(filePath, file, { upsert: true });
              if (error) {
                  console.error('Erro no upload:', error);
                  toast.error(`Erro ao carregar ${file.name}: ${error.message}`);
                  return null;
              } else if (uploadData) {
                  return {
                    name: file.name,
                    path: uploadData.path,
                    uploadedAt: new Date().toISOString()
                  };
              }
              return null;
          });
          const results = await Promise.all(uploadPromises);
          uploadedFilePaths = results.filter(Boolean) as SessionFile[];
      }

      const updatedSessionFiles = [
          ...(sessionToEdit.arquivos || []),
          ...uploadedFilePaths
      ];

      // First, update in the database
      const sessionId = sessionToEdit.id;
      try {
          // Se a sessão for originada no calendário, atualizamos o agendamento correspondente
          if (sessionToEdit.isFromCalendar) {
              const { error: calendarError } = await supabase
                  .from('agendamentos')
                  .update({
                      titulo: data.titulo,
                      tipo: data.tipo,
                      estado: data.estado,
                      notas: data.notes,
                      terapeuta: data.terapeuta // Garantir que o terapeuta seja salvo
                  })
                  .eq('id', parseInt(sessionId));
              
              if (calendarError) {
                  console.error('Erro ao atualizar agendamento:', calendarError);
                  toast.error(`Erro ao atualizar agendamento: ${calendarError.message}`);
              }
          }

          // Depois atualizamos a sessão na tabela de sessões
          const { error } = await supabase
              .from('sessoes')
              .update({
                  notes: data.notes,
                  terapeuta: data.terapeuta,
                  duracao: data.duration,
                  arquivos: updatedSessionFiles,
                  type: data.tipo
              })
              .eq('id', sessionId);

          if (error) throw error;

          // Then update in the local state
          const updatedSession: Session = {
              id: sessionToEdit.id,
              clientId: sessionToEdit.clientId,
              date: sessionToEdit.date,
              notes: data.notes,
              terapeuta: data.terapeuta,
              paid: sessionToEdit.paid,
              arquivos: updatedSessionFiles.map(file => typeof file === 'string' ? file : file.path),
              type: data.tipo || sessionToEdit.sessionType,
              duracao: data.duration
          };

          onUpdateSession(updatedSession);
          refreshData();
          setSessionToEdit(null);
          setIsEditModalOpen(false);
          toast.success("Sessão atualizada com sucesso!");
      } catch (error) {
          console.error("Erro ao atualizar sessão:", error);
          toast.error("Falha ao atualizar sessão. Tente novamente.");
      } finally {
          setIsUploading(false);
      }
  };

  const getSessionTypeLabel = (type: string | undefined) => {
    if (!type) return 'N/A';
    
    switch (type.toLowerCase()) {
      case 'sessão':
        return 'Neurofeedback';
      case 'avaliação':
        return 'Avaliação';
      case 'consulta':
        return 'Discussão';
      default:
        return type;
    }
  };

  const getSessionTypeOptions = () => {
    const uniqueTypes = new Set<string>();
    
    // Coletar todos os tipos únicos de sessão
    allRealizedSessions.forEach(session => {
      if (session.sessionType) {
        uniqueTypes.add(session.sessionType.toLowerCase());
      }
    });
    
    // Converter para array e ordenar
    return Array.from(uniqueTypes).sort();
  };

  const toggleSortOrder = () => {
    setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc');
  };

  const viewSessionNotes = (session: RealizedSessionView) => {
    const notes = session.notes || "Sem notas disponíveis para esta sessão.";
    toast.info(
      <div className="max-w-md">
        <h3 className="font-bold mb-2">Notas da Sessão</h3>
        {session.terapeuta && (
          <p className="text-sm mb-2"><strong>Terapeuta:</strong> {session.terapeuta}</p>
        )}
        <p className="whitespace-pre-wrap">{notes}</p>
      </div>,
      {
        duration: 10000,
        className: "session-notes-toast"
      }
    );
  };

  return (
    <div className="space-y-6">
      {client.max_sessoes > 0 && (
        <Card>
          <CardContent className="pt-6">
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <h4 className="text-sm font-medium">Progresso das Sessões</h4>
                <span className="text-sm text-muted-foreground">
                  <strong>{totalRealizedCount}</strong> de <strong>{client.max_sessoes}</strong> sessões realizadas
                </span>
              </div>
              <Progress 
                value={completedSessionsPercentage} 
                className={`h-3 ${
                  completedSessionsPercentage >= 100 ? 'bg-green-100' : 
                  completedSessionsPercentage >= 75 ? 'bg-emerald-100' :
                  completedSessionsPercentage >= 50 ? 'bg-amber-100' :
                  completedSessionsPercentage >= 25 ? 'bg-orange-100' :
                  'bg-red-100'
                }`}
              />
              <div className="flex justify-between items-center text-xs text-gray-500">
                <span>{Math.round(completedSessionsPercentage)}% concluído</span>
                <span>{client.max_sessoes - totalRealizedCount} sessões restantes</span>
              </div>
              <div className="flex items-center justify-between space-x-2 pt-2">
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={syncSessionCount}
                  className="text-xs"
                >
                  Sincronizar Contagem
                </Button>
                <div className="flex items-center gap-2">
                  <Switch 
                    id="sync-progress" 
                    checked={syncProgress} 
                    onCheckedChange={setSyncProgress} 
                    className="switch-checked"
                  />
                  <Label htmlFor="sync-progress" className="text-xs cursor-pointer flex items-center gap-1">
                    {syncProgress ? "Auto-Sincronizar" : "Manual"}
                    {!syncProgress && <Link2Off className="h-3 w-3" />}
                  </Label>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Nova seção: Próximos Agendamentos */}
      {upcomingAppointments.length > 0 && (
        <Card>
          <CardHeader className="px-6">
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Próximos Agendamentos ({totalUpcomingCount})
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Data</TableHead>
                    <TableHead>Título</TableHead>
                    <TableHead>Tipo</TableHead>
                    <TableHead>Estado</TableHead>
                    <TableHead>Notas</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {upcomingAppointments.map((appointment) => {
                    const appointmentDate = parseISO(appointment.data);
                    const appointmentTime = appointment.hora || format(appointmentDate, 'HH:mm');
                    const formattedDateTime = `${format(appointmentDate, 'dd/MM/yyyy')} ${appointmentTime}`;
                    return (
                      <TableRow key={appointment.id}>
                        <TableCell>{formattedDateTime}</TableCell>
                        <TableCell>{appointment.titulo}</TableCell>
                        <TableCell>{getSessionTypeLabel(appointment.tipo)}</TableCell>
                        <TableCell>
                          <div className={`px-2 py-1 rounded-full text-xs inline-block
                            ${appointment.estado === 'confirmado' ? 'bg-green-100 text-green-800' : 
                              appointment.estado === 'agendado' ? 'bg-blue-100 text-blue-800' : 
                              appointment.estado === 'em_andamento' ? 'bg-amber-100 text-amber-800' :
                              appointment.estado === 'pausado' ? 'bg-purple-100 text-purple-800' :
                              appointment.estado === 'cancelado' ? 'bg-red-100 text-red-800' : 
                              'bg-gray-100 text-gray-800'}`}>
                            {appointment.estado.charAt(0).toUpperCase() + appointment.estado.slice(1)}
                          </div>
                        </TableCell>
                        <TableCell>
                          {appointment.notas ? (
                            <div className="max-w-xs truncate">{appointment.notas}</div>
                          ) : (
                            <span className="text-gray-500 text-sm">Sem notas</span>
                          )}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="flex gap-2 flex-wrap md:flex-nowrap justify-between items-center">
        <div className="flex gap-2 flex-wrap md:flex-nowrap flex-1">
          <Input
            placeholder="Buscar nas sessões..."
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            className="max-w-xs"
          />
          
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" size="sm" className="h-10">
                <Filter className="h-4 w-4 mr-2" />
                Filtrar
                {filterType !== 'all' && <Badge className="ml-2">{getSessionTypeLabel(filterType)}</Badge>}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-80">
              <div className="space-y-4">
                <h4 className="font-medium">Filtrar por Tipo</h4>
                <div className="grid gap-2">
                  <div className="grid grid-cols-2 gap-2">
                    <Button 
                      variant={filterType === 'all' ? "default" : "outline"}
                      onClick={() => setFilterType('all')}
                      className="w-full"
                      size="sm"
                    >
                      Todos
                    </Button>
                    
                    {getSessionTypeOptions().map(type => (
                      <Button
                        key={type}
                        variant={filterType === type ? "default" : "outline"}
                        onClick={() => setFilterType(type)}
                        className="w-full"
                        size="sm"
                      >
                        {getSessionTypeLabel(type)}
                      </Button>
                    ))}
                  </div>
                </div>
                
                <h4 className="font-medium pt-2">Filtrar por Estado</h4>
                <div className="grid grid-cols-3 gap-2">
                  <Button 
                    variant={filterStatus === 'all' ? "default" : "outline"}
                    onClick={() => setFilterStatus('all')}
                    className="w-full"
                    size="sm"
                  >
                    Todos
                  </Button>
                  <Button 
                    variant={filterStatus === 'realizado' ? "default" : "outline"}
                    onClick={() => setFilterStatus('realizado')}
                    className="w-full"
                    size="sm"
                  >
                    Realizadas
                  </Button>
                  <Button 
                    variant={filterStatus === 'nao_realizado' ? "default" : "outline"}
                    onClick={() => setFilterStatus('nao_realizado')}
                    className="w-full"
                    size="sm"
                  >
                    Não Realizadas
                  </Button>
            </div>
          </div>
            </PopoverContent>
          </Popover>
          
          <Button 
            variant="outline" 
            size="sm" 
            className="h-10"
            onClick={toggleSortOrder}
          >
            {sortOrder === 'desc' ? (
              <>
                <SortDesc className="h-4 w-4 mr-2" />
                Mais Recentes
              </>
            ) : (
              <>
                <SortAsc className="h-4 w-4 mr-2" />
                Mais Antigos
              </>
            )}
          </Button>

                <Button 
            variant="outline" 
            size="sm" 
            className="h-10"
            onClick={refreshData}
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Atualizar
          </Button>
        </div>
        
        <div className="flex gap-2">
          <Dialog open={isMaxSessionsDialogOpen} onOpenChange={setIsMaxSessionsDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" size="sm">
                <Clock className="h-4 w-4 mr-2" />
                Número de Sessões
                </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Definir Número Máximo de Sessões</DialogTitle>
                <DialogDescription>
                  Defina o número máximo de sessões para este cliente para acompanhar o progresso.
                </DialogDescription>
              </DialogHeader>
              <Form {...maxSessionsForm}>
                <form onSubmit={maxSessionsForm.handleSubmit(handleSetMaxSessions)} className="space-y-4">
                  <FormField
                    control={maxSessionsForm.control}
                    name="maxSessions"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Número Máximo</FormLabel>
                        <FormControl>
                          <Input 
                            type="number" 
                            min="0" 
                            {...field} 
                            onChange={e => field.onChange(parseInt(e.target.value))}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <DialogFooter>
                    <Button type="submit">Guardar</Button>
                  </DialogFooter>
                </form>
              </Form>
            </DialogContent>
          </Dialog>
      
          <Dialog open={isCompleteDialogOpen} onOpenChange={setIsCompleteDialogOpen}>
                             <DialogTrigger asChild>
              <Button variant="outline" size="sm">
                <Check className="h-4 w-4 mr-2" />
                Completar Processo
                                 </Button>
                             </DialogTrigger>
                             <DialogContent>
              <DialogHeader>
                <DialogTitle>Completar Processo do Cliente</DialogTitle>
                <DialogDescription>
                  Tem certeza que deseja marcar este processo como concluído? Isso irá alterar o estado do cliente para "Finalizado".
                </DialogDescription>
              </DialogHeader>
              <DialogFooter>
                <DialogClose asChild>
                  <Button variant="outline">Cancelar</Button>
                </DialogClose>
                <Button onClick={handleCompleteProcess}>Confirmar</Button>
              </DialogFooter>
                             </DialogContent>
                         </Dialog>
        </div>
      </div>
      
      <Card>
        <CardHeader className="px-6">
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Sessões Realizadas
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {isLoadingAppointments ? (
            <div className="p-6 text-center">
              Carregando sessões...
            </div>
          ) : filteredSessions.length > 0 ? (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Data</TableHead>
                    <TableHead>Tipo</TableHead>
                    <TableHead>Terapeuta</TableHead>
                    <TableHead>Duração</TableHead>
                    <TableHead>Estado</TableHead>
                    <TableHead>Observações</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredSessions.map((session) => {
                    const sessionDate = parseISO(session.date);
                    const sessionTime = session.time || format(sessionDate, 'HH:mm');
                    const formattedDateTime = `${format(sessionDate, 'dd/MM/yyyy')} ${sessionTime}`;
                    
                    return (
                      <TableRow key={session.id}>
                        <TableCell>{formattedDateTime}</TableCell>
                        <TableCell>
                          {getSessionTypeLabel(session.sessionType)} 
                          {session.calendarTitle && 
                            <div className="text-xs text-gray-500 mt-1">{session.calendarTitle}</div>
                          }
                        </TableCell>
                        <TableCell>{session.terapeuta || "Não definido"}</TableCell>
                        <TableCell>
                          {session.duration ? 
                            `${Math.floor(session.duration / 3600)}h ${Math.floor((session.duration % 3600) / 60)}m` : 
                            "N/A"
                          }
                        </TableCell>
                        <TableCell>
                          <div className={`px-2 py-1 rounded-full text-xs inline-block 
                            ${session.status === 'realizado' ? 'bg-green-100 text-green-800' : 
                              session.status === 'agendado' ? 'bg-blue-100 text-blue-800' : 
                              session.status === 'em_andamento' ? 'bg-amber-100 text-amber-800' :
                              session.status === 'pausado' ? 'bg-purple-100 text-purple-800' :
                              session.status === 'cancelado' ? 'bg-red-100 text-red-800' : 
                              'bg-gray-100 text-gray-800'}`}>
                            {session.status ? (session.status.charAt(0).toUpperCase() + session.status.slice(1)) : "N/A"}
                          </div>
                        </TableCell>
                        <TableCell>
                          {session.notes ? (
                            <Button 
                              variant="ghost" 
                              size="sm" 
                              onClick={() => viewSessionNotes(session)}
                              className="h-8 px-2"
                            >
                              <Clipboard className="h-4 w-4 mr-1" />
                              Ver Notas
                            </Button>
                          ) : (
                            <span className="text-gray-500 text-sm">Sem notas</span>
                          )}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-1">
                     <Button 
                        size="sm" 
                              variant="ghost" 
                              className="h-8 w-8 p-0"
                        onClick={() => setSessionToEdit(session)}
                     >
                        <Edit className="h-4 w-4" />
                              <span className="sr-only">Editar</span>
                            </Button>
                            
                            {!session.isFromCalendar && (
                              <Button 
                                size="sm" 
                                variant="ghost" 
                                className="h-8 w-8 p-0 text-red-500 hover:text-red-600"
                                onClick={() => handleDeleteSession(session.id)}
                              >
                                <Trash2 className="h-4 w-4" />
                                <span className="sr-only">Eliminar</span>
                     </Button>
                            )}
                  </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
          </div>
        ) : (
            <div className="p-6 text-center">
              <p>Nenhuma sessão encontrada.</p>
              {(searchText || filterType !== 'all' || filterStatus !== 'all') ? (
                <Button 
                  variant="link" 
                  onClick={() => {
                    setSearchText('');
                    setFilterType('all');
                    setFilterStatus('all');
                  }}
                >
                  Limpar filtros
                </Button>
              ) : null}
          </div>
        )}
      </CardContent>
      </Card>

      {/* Modal de Edição de Sessão */}
      <Dialog open={isEditModalOpen} onOpenChange={(open) => !open && setSessionToEdit(null)}>
        <DialogContent className="sm:max-w-[500px]">
              <DialogHeader>
            <DialogTitle>Editar Sessão</DialogTitle>
            <DialogDescription>
              Atualize as informações da sessão selecionada.
            </DialogDescription>
              </DialogHeader>
              <Form {...editSessionForm}>
                  <form onSubmit={editSessionForm.handleSubmit(handleSaveEdit)} className="space-y-4">
              {sessionToEdit?.isFromCalendar && (
                <>
                  <FormField
                    control={editSessionForm.control}
                    name="titulo"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Título</FormLabel>
                        <FormControl>
                          <Input placeholder="Título da sessão" {...field} value={field.value || ''} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </>
              )}
              
              <FormField
                control={editSessionForm.control}
                name="tipo"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Tipo</FormLabel>
                    <FormControl>
                      <Select 
                        onValueChange={field.onChange} 
                        value={field.value || ''}
                      >
                        <SelectTrigger className="h-10">
                          <SelectValue placeholder="Selecione o tipo" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="sessão">Sessão</SelectItem>
                          <SelectItem value="avaliação">Avaliação</SelectItem>
                          <SelectItem value="consulta">Consulta</SelectItem>
                        </SelectContent>
                      </Select>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={editSessionForm.control}
                name="estado"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Estado</FormLabel>
                    <FormControl>
                      <Select 
                        onValueChange={field.onChange} 
                        value={field.value || ''}
                      >
                        <SelectTrigger className="h-10">
                          <SelectValue placeholder="Selecione o estado" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="pendente">Pendente</SelectItem>
                          <SelectItem value="confirmado">Confirmado</SelectItem>
                          <SelectItem value="cancelado">Cancelado</SelectItem>
                          <SelectItem value="realizado">Realizado</SelectItem>
                        </SelectContent>
                      </Select>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={editSessionForm.control}
                name="terapeuta"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Terapeuta</FormLabel>
                    <FormControl>
                      <Input placeholder="Nome do terapeuta" {...field} value={field.value || ''} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={editSessionForm.control}
                name="notes"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Observações</FormLabel>
                    <FormControl>
                      <Textarea placeholder="Observações da sessão" className="min-h-[100px]" {...field} value={field.value || ''} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={editSessionForm.control}
                name="duration"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Duração</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        {...field}
                        onChange={(e) => {
                          const value = e.target.value ? parseInt(e.target.value) : undefined;
                          field.onChange(value);
                        }}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={editSessionForm.control}
                name="filesToUpload"
                render={({ field: { value, onChange, ...fieldProps } }) => (
                  <FormItem>
                    <FormLabel>Adicionar Ficheiros</FormLabel>
                    <FormControl>
                      <Input
                        type="file"
                        multiple
                        {...fieldProps}
                        onChange={(e) => {
                          onChange(e.target.files || null);
                        }}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {sessionToEdit?.arquivos?.length > 0 && (
                <div>
                  <h4 className="text-sm font-medium mb-2">Ficheiros existentes:</h4>
                  <div className="max-h-[100px] overflow-y-auto space-y-1 border rounded-md p-2">
                    {sessionToEdit.arquivos.map((file, index) => (
                      <div key={index} className="text-sm flex items-center gap-2">
                        <FileText className="h-4 w-4 text-gray-500" />
                        <span>{typeof file === 'string' ? (file as string).split('/').pop() : file.name}</span>
                        <button
                          type="button"
                          onClick={() => {
                            const updatedFiles = [...sessionToEdit.arquivos];
                            updatedFiles.splice(index, 1);
                            setSessionToEdit({...sessionToEdit, arquivos: updatedFiles});
                          }}
                          className="ml-auto hover:text-red-500"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

                      <DialogFooter>
                          <Button type="button" variant="outline" onClick={() => setSessionToEdit(null)}>Cancelar</Button>
                <Button type="submit" disabled={isUploading}>
                  {isUploading && <span className="animate-spin mr-2">⏳</span>}
                  Guardar
                </Button>
                      </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ClientSessions;
