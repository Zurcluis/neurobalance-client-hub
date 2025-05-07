import React, { useState, useEffect, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Calendar, Check, Edit, FileText, Trash2, Upload } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogClose } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { useForm } from 'react-hook-form';
import { ClientDetailData, Session } from '@/types/client';
import { Progress } from '@/components/ui/progress';
import { parseISO, isBefore, format, compareDesc } from 'date-fns';
import { toast } from 'sonner';

// Interface para representar um agendamento do calendário
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

// Estrutura de dados para o formulário de edição
interface EditSessionFormData {
    notes: string;
    terapeuta?: string;
    filesToUpload?: FileList;
}

// Estrutura unificada para renderizar sessões realizadas
interface RealizedSessionView extends Session {
    isFromCalendar: boolean;
    calendarTitle?: string;
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

  const sessionForm = useForm<Session>();
  const maxSessionsForm = useForm<{ maxSessions: number }>({
    defaultValues: { maxSessions: client.maxSessions || 0 }
  });
  const editSessionForm = useForm<EditSessionFormData>();

  const [upcomingAppointments, setUpcomingAppointments] = useState<Appointment[]>([]);
  const [pastCalendarAppointments, setPastCalendarAppointments] = useState<Appointment[]>([]);
  const [completedSessionsPercentage, setCompletedSessionsPercentage] = useState(0);
  const [totalRealizedCount, setTotalRealizedCount] = useState(0);
  const [totalUpcomingCount, setTotalUpcomingCount] = useState(0);

  const supabase = (window as any).supabase;

  const loadFromStorage = <T extends unknown>(key: string, defaultValue: T): T => {
    const storedData = localStorage.getItem(key);
    return storedData ? JSON.parse(storedData) : defaultValue;
  };

  const saveToStorage = <T extends unknown>(key: string, data: T): void => {
    localStorage.setItem(key, JSON.stringify(data));
  };

  useEffect(() => {
    const loadAppointments = (): Appointment[] => {
      const savedAppointments = localStorage.getItem('appointments');
      return savedAppointments ? JSON.parse(savedAppointments) : [];
    };

    const appointments = loadAppointments();
    const clientAppointments = appointments.filter((app: Appointment) => app.clientId === clientId);
    
    const now = new Date();
    const futureAppointments: Appointment[] = [];
    const pastAppointments: Appointment[] = [];

    clientAppointments.forEach((app: Appointment) => {
      try {
      const appDate = parseISO(app.date);
        if (!isNaN(appDate.getTime())) {
           if (isBefore(appDate, now)) {
             pastAppointments.push(app);
           } else {
             futureAppointments.push(app);
           }
        } else {
          console.warn(`Data inválida encontrada para agendamento ${app.id}: ${app.date}`);
        }
      } catch (error) {
         console.error(`Erro ao processar data do agendamento ${app.id}: ${app.date}`, error);
      }
    });
    
    setUpcomingAppointments(futureAppointments.sort((a, b) => compareDesc(parseISO(a.date), parseISO(b.date))));
    setPastCalendarAppointments(pastAppointments);

  }, [clientId]);

  const allRealizedSessions = useMemo((): RealizedSessionView[] => {
    const manualSessionsView: RealizedSessionView[] = sessions.map(s => ({ 
        ...s, 
        isFromCalendar: false 
    }));

    const pastCalendarSessionsView: RealizedSessionView[] = pastCalendarAppointments.map(app => {
        const existingManualSession = sessions.find(s => s.id === app.id);
        if (existingManualSession) {
            return { ...existingManualSession, isFromCalendar: true, calendarTitle: app.title };
        } else {
            return {
                id: app.id,
                clientId: app.clientId,
                date: app.date,
                notes: app.notes || '',
                paid: false,
                terapeuta: undefined,
                arquivos: [],
                isFromCalendar: true,
                calendarTitle: app.title
            };
        }
    });
    
    const combined = [...manualSessionsView, ...pastCalendarSessionsView];
    const uniqueSessions = combined.reduce((acc, current) => {
        const x = acc.find(item => item.id === current.id);
        if (!x) {
            if (!current.isFromCalendar || !sessions.some(s => s.id === current.id)) {
                 acc.push(current);
            }
        } else if (!x.isFromCalendar && current.isFromCalendar) {
        }
        return acc;
    }, [] as RealizedSessionView[]);

    return uniqueSessions.sort((a, b) => compareDesc(parseISO(a.date), parseISO(b.date)));

  }, [sessions, pastCalendarAppointments]);

  useEffect(() => {
    const realizedCount = allRealizedSessions.length;
    const upcomingCount = upcomingAppointments.length;
    
    setTotalRealizedCount(realizedCount);
    setTotalUpcomingCount(upcomingCount);

    const maxSessions = client.maxSessions || 0;
    let completedPercentage = 0;
    if (maxSessions > 0) {
       completedPercentage = (realizedCount / maxSessions) * 100;
    } else {
       const totalPlanned = realizedCount + upcomingCount;
       completedPercentage = totalPlanned > 0 ? (realizedCount / totalPlanned) * 100 : 0;
    }
    
    setCompletedSessionsPercentage(completedPercentage > 100 ? 100 : completedPercentage);

  }, [allRealizedSessions, upcomingAppointments, client.maxSessions]);

  useEffect(() => {
    if (sessionToEdit) {
      editSessionForm.reset({
        notes: sessionToEdit.notes || '',
        terapeuta: sessionToEdit.terapeuta || '',
        filesToUpload: undefined
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
    
    const clients = loadFromStorage<ClientDetailData[]>('clients', []);
    const updatedClients = clients.map(c => 
      c.id === clientId ? {...c, sessionCount: Math.max(0, (c.sessionCount || 0) - 1)} : c
    );
    saveToStorage('clients', updatedClients);
    
    toast.success("Sessão eliminada com sucesso");
    window.location.reload();
  };

  const handleSetMaxSessions = (data: { maxSessions: number }) => {
    const updatedClient = { ...client, maxSessions: data.maxSessions };
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
      let uploadedFilePaths: string[] = [];

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
                  return uploadData.path;
              }
              return null;
          });
          const results = await Promise.all(uploadPromises);
          uploadedFilePaths = results.filter((path): path is string => path !== null);
      }

      try {
          const currentFiles = sessionToEdit.arquivos || [];
          const updatedFiles = [...new Set([...currentFiles, ...uploadedFilePaths])];

          const sessionDataToSave: Partial<Session> & { id: string } = {
              id: sessionToEdit.id,
              clientId: sessionToEdit.clientId,
              date: sessionToEdit.date,
              notes: data.notes,
              arquivos: updatedFiles,
              terapeuta: data.terapeuta || sessionToEdit.terapeuta,
              paid: sessionToEdit.paid
          };

          const { data: upsertData, error: upsertError } = await supabase
              .from('sessoes')
              .upsert(sessionDataToSave)
              .select()
              .single();

          if (upsertError) throw upsertError;

          if (upsertData) {
             onUpdateSession(upsertData as Session);
             setSessionToEdit(null);
             toast.success("Sessão atualizada com sucesso!");
          } else {
             toast.error("Não foi possível obter os dados atualizados da sessão após salvar.");
          }

      } catch (error: any) {
          console.error('Erro ao salvar sessão no DB:', error);
          toast.error(`Erro ao salvar alterações: ${error.message}`);
      } finally {
          setIsUploading(false);
      }
  };

  return (
    <Card className="glassmorphism">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="flex items-center gap-2">
          <Calendar className="h-5 w-5" />
          <span>Histórico de Sessões</span>
        </CardTitle>
        <div className="flex gap-2 flex-wrap">
          <Button variant="outline" size="sm" onClick={() => { maxSessionsForm.reset({ maxSessions: client.maxSessions || 0 }); setIsMaxSessionsDialogOpen(true); }}>Definir Total de Sessões</Button>
          <Button className="bg-[#3f9094] hover:bg-[#265255]" size="sm" onClick={() => { sessionForm.reset({ id: '', clientId: clientId, date: new Date().toISOString().split('T')[0], notes: '', paid: false }); setIsSessionDialogOpen(true); }}>Adicionar Sessão (Manual)</Button>
          <Button variant="outline" size="sm" className="bg-blue-500 hover:bg-blue-700 text-white" onClick={() => setIsCompleteDialogOpen(true)}>Concluir Processo</Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="mb-6">
          <div className="flex justify-between mb-2">
            <span className="text-sm font-medium">Progresso das Sessões</span>
            <span className="text-sm font-medium">
              {totalRealizedCount} / {client.maxSessions ? client.maxSessions : (totalRealizedCount + totalUpcomingCount)} 
              ({Math.round(completedSessionsPercentage)}%)
            </span>
          </div>
          <Progress value={completedSessionsPercentage} className="h-2" />
          <div className="mt-2 text-xs text-gray-500">
            {totalRealizedCount} sessões realizadas, {totalUpcomingCount} sessões agendadas
            {client.maxSessions ? `, ${client.maxSessions} sessões planeadas no total` : ''}
          </div>
        </div>

        {upcomingAppointments.length > 0 && (
          <div className="mb-6">
            <h3 className="text-sm font-semibold mb-3">Próximas Sessões Agendadas (Calendário)</h3>
            <div className="space-y-2">
              {upcomingAppointments.map((appointment: Appointment) => (
                <div key={appointment.id} className="p-3 rounded-lg bg-[#1088c4]/10 border border-[#1088c4]/20">
                  <div className="flex justify-between items-start">
                    <div>
                      <h4 className="font-medium text-sm">{appointment.title || 'Agendamento'}</h4>
                      <p className="text-xs text-gray-700 dark:text-gray-300">
                        {format(parseISO(appointment.date), 'dd/MM/yyyy HH:mm')}
                      </p>
                      {appointment.notes && <p className="text-xs text-gray-500 mt-1">Notas: {appointment.notes}</p>}
                    </div>
                    <Badge variant="outline" className="text-xs bg-[#1088c4]/20">Agendada</Badge>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        <h3 className="text-sm font-semibold mb-3">Sessões Realizadas</h3>
        {allRealizedSessions.length > 0 ? (
          <div className="space-y-3">
            {allRealizedSessions.map((session) => (
              <div key={session.id} className={`p-4 rounded-lg border relative ${session.isFromCalendar && !sessions.some(s => s.id === session.id) ? 'bg-[#e0e0e0] border-gray-300/50' : 'bg-[#c5cfce] border-white/20'}`}>
                {!session.isFromCalendar && (
                <Button 
                  variant="ghost" 
                      size="icon"
                      className="absolute top-2 right-2 text-red-500 hover:text-red-700 hover:bg-red-100 h-7 w-7"
                  onClick={() => handleDeleteSession(session.id)}
                      aria-label="Eliminar sessão"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
                )}
                <div className="flex flex-col sm:flex-row justify-between items-start pr-10">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <h3 className="font-medium">
                        {session.isFromCalendar ? `${session.calendarTitle || 'Agendamento'} (Calendário)` : 'Sessão (Manual)'} em {format(parseISO(session.date), 'dd/MM/yyyy HH:mm')}
                      </h3>
                      {(!session.isFromCalendar || sessions.some(s => s.id === session.id)) && (
                      <Badge variant={session.paid ? "default" : "outline"} className="text-xs">
                        {session.paid ? 'Pago' : 'Não Pago'}
                      </Badge>
                      )}
                      {session.terapeuta && (
                         <span className="text-xs text-gray-600">(Terapeuta: {session.terapeuta})</span>
                      )}
                    </div>
                    <p className="text-sm mt-1 text-gray-700 dark:text-gray-300">{session.notes || "Sem observações."}</p>
                  </div>
                  <div className="flex items-center gap-2 mt-2 sm:mt-0">
                     {session.arquivos && session.arquivos.length > 0 && (
                         <Dialog>
                             <DialogTrigger asChild>
                                 <Button variant="outline" size="sm" className="flex items-center gap-1">
                                     <FileText className="h-4 w-4" />
                                     <span>Ficheiros ({session.arquivos.length})</span>
                                 </Button>
                             </DialogTrigger>
                             <DialogContent>
                                 <DialogHeader><DialogTitle>Ficheiros da Sessão</DialogTitle></DialogHeader>
                                 <div className="py-4 space-y-2">
                                     {session.arquivos.map((filePath, index) => {
                                         const fileName = filePath.split('/').pop();
                                         const { data: urlData } = supabase.storage.from('ficheiros').getPublicUrl(filePath);
                                         const fileUrl = urlData?.publicUrl;
                                         return (
                                             <div key={index} className="flex items-center justify-between">
                                                 <span className="text-sm truncate">{fileName || '-'}</span>
                                                 {fileUrl ? (<a href={fileUrl} target="_blank" rel="noopener noreferrer" className="text-sm text-blue-600 hover:underline">Ver</a>) : (<span className="text-sm text-gray-500">Link indisponível</span>)}
                                             </div>
                                         );
                                     })}
                                 </div>
                                 <DialogFooter><DialogClose asChild><Button type="button" variant="secondary">Fechar</Button></DialogClose></DialogFooter>
                             </DialogContent>
                         </Dialog>
                     )}
                     <Button 
                        variant="secondary" 
                        size="sm" 
                        className="flex items-center gap-1"
                        onClick={() => setSessionToEdit(session)}
                     >
                        <Edit className="h-4 w-4" />
                        <span>Editar</span>
                     </Button>
                     <Check className="h-5 w-5 text-gray-500" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="py-8 text-center">
            <p className="text-gray-600 dark:text-gray-300">Sem histórico de sessões realizadas disponível</p>
          </div>
        )}
      </CardContent>

      <Dialog open={isSessionDialogOpen} onOpenChange={setIsSessionDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader><DialogTitle>Adicionar Nova Sessão (Manual)</DialogTitle></DialogHeader>
          <Form {...sessionForm}>
            <form onSubmit={sessionForm.handleSubmit((data) => { onAddSession(data); setIsSessionDialogOpen(false); })} className="space-y-4">
              <FormField control={sessionForm.control} name="date" render={({ field }) => (<FormItem><FormLabel>Data da Sessão</FormLabel><FormControl><Input {...field} type="date" required /></FormControl></FormItem>)} />
              <FormField control={sessionForm.control} name="notes" render={({ field }) => (<FormItem><FormLabel>Notas da Sessão</FormLabel><FormControl><Textarea {...field} className="min-h-[100px]" /></FormControl></FormItem>)} />
              <FormField control={sessionForm.control} name="paid" render={({ field }) => (<FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm"><div className="space-y-0.5"><FormLabel>Sessão Paga?</FormLabel></div><FormControl><input type="checkbox" checked={field.value} onChange={field.onChange} className="form-checkbox h-5 w-5 text-primary"/></FormControl></FormItem>)} />
              <FormField control={sessionForm.control} name="terapeuta" render={({ field }) => (<FormItem><FormLabel>Terapeuta (Opcional)</FormLabel><FormControl><Input {...field} placeholder="Nome do terapeuta" /></FormControl></FormItem>)} />
              <div className="flex justify-end gap-2"><Button type="button" variant="outline" onClick={() => setIsSessionDialogOpen(false)}>Cancelar</Button><Button type="submit" className="bg-[#3f9094] hover:bg-[#265255]">Adicionar Sessão</Button></div>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      <Dialog open={isEditModalOpen} onOpenChange={(open) => !open && setSessionToEdit(null)}>
          <DialogContent className="sm:max-w-[600px]">
              <DialogHeader>
                  <DialogTitle>Editar Sessão Realizada</DialogTitle>
              </DialogHeader>
              <Form {...editSessionForm}>
                  <form onSubmit={editSessionForm.handleSubmit(handleSaveEdit)} className="space-y-4">
                      <FormField control={editSessionForm.control} name="notes" render={({ field }) => ( <FormItem><FormLabel>Observações</FormLabel><FormControl><Textarea {...field} className="min-h-[150px]" placeholder="Adicione as observações da sessão..."/></FormControl><FormMessage /></FormItem> )}/>
                      <FormField control={editSessionForm.control} name="terapeuta" render={({ field }) => ( <FormItem><FormLabel>Terapeuta (Opcional)</FormLabel><FormControl><Input {...field} placeholder="Nome do terapeuta" /></FormControl><FormMessage /></FormItem> )}/>
                      <FormField control={editSessionForm.control} name="filesToUpload" render={({ field: { onChange, value, ...rest } }) => ( <FormItem> <FormLabel>Adicionar Ficheiros (.txt, .pdf, .jpg, .png)</FormLabel><FormControl><Input type="file" {...rest} multiple accept=".txt,.pdf,.jpg,.png,.jpeg" onChange={(e) => onChange(e.target.files)} className="cursor-pointer"/></FormControl><FormMessage /></FormItem> )}/>
                      {sessionToEdit?.arquivos && sessionToEdit.arquivos.length > 0 && (
                          <div className="space-y-2 pt-2 border-t">
                              <p className="text-sm font-medium">Ficheiros existentes:</p>
                              <ul className="list-disc list-inside text-sm space-y-1">
                                  {sessionToEdit.arquivos.map((filePath, index) => ( <li key={index} className="truncate">{filePath.split('/').pop()}</li> ))}
                              </ul>
                    </div>
                )}
                      <DialogFooter>
                          <Button type="button" variant="outline" onClick={() => setSessionToEdit(null)}>Cancelar</Button>
                          <Button type="submit" className="bg-[#3f9094] hover:bg-[#265255]" disabled={isUploading}>{isUploading ? 'Salvando...' : 'Salvar Alterações'}</Button>
                      </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      <Dialog open={isMaxSessionsDialogOpen} onOpenChange={setIsMaxSessionsDialogOpen}>
        <DialogContent className="sm:max-w-[400px]">
           <DialogHeader><DialogTitle>Definir Total de Sessões</DialogTitle></DialogHeader>
          <Form {...maxSessionsForm}>
            <form onSubmit={maxSessionsForm.handleSubmit(handleSetMaxSessions)} className="space-y-4">
               <FormField control={maxSessionsForm.control} name="maxSessions" render={({ field }) => (<FormItem><FormLabel>Número Total de Sessões</FormLabel><FormControl><Input type="number" min="0" {...field} onChange={event => field.onChange(+event.target.value)}/></FormControl></FormItem>)} />
               <div className="flex justify-end gap-2"><Button type="button" variant="outline" onClick={() => setIsMaxSessionsDialogOpen(false)}>Cancelar</Button><Button type="submit" className="bg-[#3f9094] hover:bg-[#265255]">Guardar</Button></div>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      <Dialog open={isCompleteDialogOpen} onOpenChange={setIsCompleteDialogOpen}>
        <DialogContent className="sm:max-w-[400px]">
           <DialogHeader><DialogTitle>Concluir Processo</DialogTitle></DialogHeader>
           <div className="py-4"><p>Tem certeza que deseja marcar este processo como concluído? O cliente será movido para a categoria "Concluídos".</p></div>
           <div className="flex justify-end gap-2"><Button type="button" variant="outline" onClick={() => setIsCompleteDialogOpen(false)}>Cancelar</Button><Button type="button" className="bg-blue-500 hover:bg-blue-700" onClick={handleCompleteProcess}>Confirmar Conclusão</Button></div>
        </DialogContent>
      </Dialog>

    </Card>
  );
};

export default ClientSessions;
