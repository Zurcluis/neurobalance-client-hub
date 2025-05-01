
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Calendar, Check, Trash2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Form, FormControl, FormField, FormItem, FormLabel } from '@/components/ui/form';
import { useForm } from 'react-hook-form';
import { ClientDetailData, Session } from '@/types/client';
import { Progress } from '@/components/ui/progress';
import { parseISO, isBefore, format } from 'date-fns';
import { toast } from 'sonner';

interface ClientSessionsProps {
  sessions: Session[];
  clientId: string;
  onAddSession: (session: Session) => void;
  onUpdateClient: (client: ClientDetailData) => void;
  client: ClientDetailData;
}

const ClientSessions = ({ sessions, clientId, onAddSession, client, onUpdateClient }: ClientSessionsProps) => {
  const [isSessionDialogOpen, setIsSessionDialogOpen] = useState(false);
  const [isMaxSessionsDialogOpen, setIsMaxSessionsDialogOpen] = useState(false);
  const sessionForm = useForm<Session>();
  const maxSessionsForm = useForm<{ maxSessions: number }>({
    defaultValues: {
      maxSessions: client.maxSessions || 0
    }
  });
  const [upcomingSessions, setUpcomingSessions] = useState<any[]>([]);
  const [completedSessionsPercentage, setCompletedSessionsPercentage] = useState(0);

  const loadFromStorage = <T extends unknown>(key: string, defaultValue: T): T => {
    const storedData = localStorage.getItem(key);
    return storedData ? JSON.parse(storedData) : defaultValue;
  };

  const saveToStorage = <T extends unknown>(key: string, data: T): void => {
    localStorage.setItem(key, JSON.stringify(data));
  };

  useEffect(() => {
    // Load appointments from localStorage to sync with calendar
    const loadAppointments = () => {
      const savedAppointments = localStorage.getItem('appointments');
      return savedAppointments ? JSON.parse(savedAppointments) : [];
    };

    const appointments = loadAppointments();
    const clientAppointments = appointments.filter((app: any) => app.clientId === clientId);
    
    // Filter future appointments
    const now = new Date();
    const future = clientAppointments.filter((app: any) => {
      const appDate = parseISO(app.date);
      return !isBefore(appDate, now);
    });
    
    setUpcomingSessions(future);

    // Calculate completed sessions percentage
    const maxSessions = client.maxSessions || 0;
    const totalCompleted = sessions.length;
    
    const completedPercentage = maxSessions > 0 
      ? (totalCompleted / maxSessions) * 100
      : totalCompleted > 0 ? (totalCompleted / (totalCompleted + future.length)) * 100 : 0;
    
    setCompletedSessionsPercentage(completedPercentage > 100 ? 100 : completedPercentage);
  }, [clientId, sessions, client.maxSessions]);

  const handleDeleteSession = (sessionId: string) => {
    const allSessions = loadFromStorage<Session[]>('sessions', []);
    const updatedSessions = allSessions.filter(session => session.id !== sessionId);
    saveToStorage('sessions', updatedSessions);
    
    // Update client's sessionCount
    const clients = loadFromStorage<ClientDetailData[]>('clients', []);
    const updatedClients = clients.map(c => 
      c.id === clientId ? {...c, sessionCount: Math.max(0, (c.sessionCount || 0) - 1)} : c
    );
    saveToStorage('clients', updatedClients);
    
    // Update the UI by filtering out the deleted session
    toast.success("Sessão eliminada com sucesso");
    
    // Refresh the page to update the sessions list
    window.location.reload();
  };

  const handleSetMaxSessions = (data: { maxSessions: number }) => {
    const updatedClient = { ...client, maxSessions: data.maxSessions };
    onUpdateClient(updatedClient);
    setIsMaxSessionsDialogOpen(false);
    toast.success("Número máximo de sessões definido com sucesso");
  };

  return (
    <Card className="glassmorphism">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="flex items-center gap-2">
          <Calendar className="h-5 w-5" />
          <span>Histórico de Sessões</span>
        </CardTitle>
        <div className="flex gap-2">
          <Button 
            variant="outline"
            size="sm"
            onClick={() => {
              maxSessionsForm.reset({ maxSessions: client.maxSessions || 0 });
              setIsMaxSessionsDialogOpen(true);
            }}
          >
            Definir Total de Sessões
          </Button>
          <Button 
            className="bg-[#3f9094] hover:bg-[#265255]"
            onClick={() => {
              sessionForm.reset({
                id: '',
                clientId: clientId,
                date: new Date().toISOString().split('T')[0],
                notes: '',
                paid: false,
              });
              setIsSessionDialogOpen(true);
            }}
          >
            Adicionar Sessão
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="mb-6">
          <div className="flex justify-between mb-2">
            <span className="text-sm font-medium">Progresso das Sessões</span>
            <span className="text-sm font-medium">
              {sessions.length} / {client.maxSessions ? client.maxSessions : (sessions.length + upcomingSessions.length)} 
              ({Math.round(completedSessionsPercentage)}%)
            </span>
          </div>
          <Progress value={completedSessionsPercentage} className="h-2" />
          <div className="mt-2 text-xs text-gray-500">
            {sessions.length} sessões realizadas, {upcomingSessions.length} sessões agendadas
            {client.maxSessions ? `, ${client.maxSessions} sessões planeadas no total` : ''}
          </div>
        </div>

        {upcomingSessions.length > 0 && (
          <div className="mb-6">
            <h3 className="text-sm font-semibold mb-3">Próximas Sessões Agendadas</h3>
            <div className="space-y-2">
              {upcomingSessions.map((session: any) => (
                <div key={session.id} className="p-3 rounded-lg bg-[#1088c4]/10 border border-[#1088c4]/20">
                  <div className="flex justify-between items-start">
                    <div>
                      <h4 className="font-medium text-sm">{session.title}</h4>
                      <p className="text-xs text-gray-700">
                        {format(new Date(session.date), 'dd/MM/yyyy')} às {session.date.split('T')[1] || ''}
                      </p>
                    </div>
                    <Badge variant="outline" className="text-xs bg-[#1088c4]/20">
                      Agendada
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        <h3 className="text-sm font-semibold mb-3">Sessões Realizadas</h3>
        {sessions.length > 0 ? (
          <div className="space-y-3">
            {sessions.map((session) => (
              <div key={session.id} className="p-4 rounded-lg bg-[#c5cfce] border border-white/20 relative">
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="absolute top-2 right-2 text-red-500 hover:text-red-700 hover:bg-red-100"
                  onClick={() => handleDeleteSession(session.id)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
                <div className="flex justify-between items-start pr-8">
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="font-medium">
                        Sessão em {new Date(session.date).toLocaleDateString('pt-PT')}
                      </h3>
                      <Badge variant={session.paid ? "default" : "outline"} className="text-xs">
                        {session.paid ? 'Pago' : 'Não Pago'}
                      </Badge>
                    </div>
                    <p className="text-sm mt-2 text-gray-700">{session.notes}</p>
                  </div>
                  <Check className="h-5 w-5 text-[#3f9094]" />
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="py-8 text-center">
            <p className="text-gray-600">Sem histórico de sessões disponível</p>
          </div>
        )}
      </CardContent>

      <Dialog open={isSessionDialogOpen} onOpenChange={setIsSessionDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Adicionar Nova Sessão</DialogTitle>
          </DialogHeader>
          <Form {...sessionForm}>
            <form onSubmit={sessionForm.handleSubmit(onAddSession)} className="space-y-4">
              <FormField
                control={sessionForm.control}
                name="date"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Data da Sessão</FormLabel>
                    <FormControl>
                      <Input {...field} type="date" required />
                    </FormControl>
                  </FormItem>
                )}
              />
              
              <FormField
                control={sessionForm.control}
                name="notes"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Notas da Sessão</FormLabel>
                    <FormControl>
                      <Textarea {...field} className="min-h-[100px]" />
                    </FormControl>
                  </FormItem>
                )}
              />
              
              <FormField
                control={sessionForm.control}
                name="paid"
                render={({ field }) => (
                  <FormItem>
                    <div className="flex items-center gap-2">
                      <FormControl>
                        <input 
                          type="checkbox" 
                          checked={field.value}
                          onChange={field.onChange}
                          id="paid-checkbox"
                          className="h-4 w-4"
                        />
                      </FormControl>
                      <FormLabel htmlFor="paid-checkbox" className="cursor-pointer">
                        Sessão paga
                      </FormLabel>
                    </div>
                  </FormItem>
                )}
              />
              
              <div className="flex justify-end gap-2">
                <Button 
                  type="button" 
                  variant="outline"
                  onClick={() => setIsSessionDialogOpen(false)}
                >
                  Cancelar
                </Button>
                <Button 
                  type="submit" 
                  className="bg-[#3f9094] hover:bg-[#265255]"
                >
                  Adicionar Sessão
                </Button>
              </div>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      <Dialog open={isMaxSessionsDialogOpen} onOpenChange={setIsMaxSessionsDialogOpen}>
        <DialogContent className="sm:max-w-[400px]">
          <DialogHeader>
            <DialogTitle>Definir Total de Sessões</DialogTitle>
          </DialogHeader>
          <Form {...maxSessionsForm}>
            <form onSubmit={maxSessionsForm.handleSubmit(handleSetMaxSessions)} className="space-y-4">
              <FormField
                control={maxSessionsForm.control}
                name="maxSessions"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Número Total de Sessões Planeadas</FormLabel>
                    <FormControl>
                      <Input 
                        {...field} 
                        type="number" 
                        min="0"
                        onChange={(e) => field.onChange(parseInt(e.target.value) || 0)} 
                      />
                    </FormControl>
                  </FormItem>
                )}
              />
              
              <div className="flex justify-end gap-2">
                <Button 
                  type="button" 
                  variant="outline"
                  onClick={() => setIsMaxSessionsDialogOpen(false)}
                >
                  Cancelar
                </Button>
                <Button 
                  type="submit" 
                  className="bg-[#3f9094] hover:bg-[#265255]"
                >
                  Guardar
                </Button>
              </div>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </Card>
  );
};

export default ClientSessions;
