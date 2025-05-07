import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import PageLayout from '@/components/layout/PageLayout';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent } from '@/components/ui/card';
import { ArrowLeft } from 'lucide-react';
import { toast } from 'sonner';
import { ClientDetailData, Session, Payment, ClientFile, ClientMood } from '@/types/client';
import ClientProfile from '@/components/client-details/ClientProfile';
import ClientSessions from '@/components/client-details/ClientSessions';
import ClientPayments from '@/components/client-details/ClientPayments';
import ClientFiles from '@/components/client-details/ClientFiles';
import ClientReports from '@/components/client-details/ClientReports';
import ClientMoodTracker from '@/components/client-details/ClientMoodTracker';
import ClientMonitoringTab from '@/components/client-details/ClientMonitoringTab';
import { parseISO, format, isSameDay, isBefore, compareDesc } from 'date-fns';

// Interface para Appointments (pode ser movida para types)
interface Appointment {
  id: string;
  title: string;
  clientName: string;
  clientId: string;
  type: string; // Campo tipo é importante aqui
  notes: string;
  date: string;
  confirmed: boolean;
}

// Função para carregar dados do localStorage
const loadFromStorage = <T extends unknown>(key: string, defaultValue: T): T => {
  const storedData = localStorage.getItem(key);
  return storedData ? JSON.parse(storedData) : defaultValue;
};

// Função para salvar dados no localStorage
const saveToStorage = <T extends unknown>(key: string, data: T): void => {
  localStorage.setItem(key, JSON.stringify(data));
};

const ClientDetailPage = () => {
  const { clientId } = useParams<{ clientId: string }>();
  
  // Estados
  const [client, setClient] = useState<ClientDetailData | null>(null);
  const [sessions, setSessions] = useState<Session[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [files, setFiles] = useState<ClientFile[]>([]);
  const [moods, setMoods] = useState<ClientMood[]>([]);
  const [allAppointments, setAllAppointments] = useState<Appointment[]>([]);
  const [activeTab, setActiveTab] = useState('profile');
  const [isLoading, setIsLoading] = useState(true);

  // Carregar dados
  useEffect(() => {
    const clients = loadFromStorage<ClientDetailData[]>('clients', []);
    const foundClient = clients.find(c => c.id === clientId);
    
    let clientToSet = foundClient || null;
    
    if (foundClient) {
      // Carregar sessões manuais
    const allSessions = loadFromStorage<Session[]>('sessions', []);
    const clientSessions = allSessions.filter(session => session.clientId === clientId);
    setSessions(clientSessions);
    
      // Carregar pagamentos
    const allPayments = loadFromStorage<Payment[]>('payments', []);
    const clientPayments = allPayments.filter(payment => payment.clientId === clientId);
    setPayments(clientPayments);
    
      // Carregar ficheiros
    const allFiles = loadFromStorage<ClientFile[]>('clientFiles', []);
    const clientFiles = allFiles.filter(file => file.clientId === clientId);
    setFiles(clientFiles);
    
      // Carregar moods
    const allMoods = loadFromStorage<ClientMood[]>('clientMoods', []);
    const clientMoods = allMoods.filter(mood => mood.clientId === clientId);
    setMoods(clientMoods);

      // Carregar TODOS os agendamentos do cliente
      const appointments = loadFromStorage<Appointment[]>('appointments', []);
      const clientAppointments = appointments
          .filter((app: Appointment) => app.clientId === clientId)
          .sort((a, b) => compareDesc(parseISO(a.date), parseISO(b.date))); // Ordenar por data desc
      setAllAppointments(clientAppointments);
      
      // Determinar próxima sessão (lógica existente)
    const now = new Date();
      const futureAppointments = clientAppointments.filter((app: Appointment) => !isBefore(parseISO(app.date), now))
                                                .sort((a,b) => parseISO(a.date).getTime() - parseISO(b.date).getTime()); // Sort asc for next
    
      if (futureAppointments.length > 0) {
      const nextSession = futureAppointments[0];
      const appointmentDate = parseISO(nextSession.date);
      const formattedDate = format(appointmentDate, "dd/MM/yyyy 'às' HH:mm");
      
        // Atualiza o cliente que será setado no estado
        clientToSet = { ...foundClient, nextSession: formattedDate };
      } else {
        clientToSet = { ...foundClient, nextSession: null }; // Garante que nextSession é null se não houver futuras
      }
    }

    setClient(clientToSet);
    setIsLoading(false);
  }, [clientId]);

  // Se o cliente não for encontrado, mostrar erro
  if (isLoading) {
    return (
      <PageLayout>
        <div>Carregando...</div>
      </PageLayout>
    );
  }

  if (!client) {
    return (
      <PageLayout>
        <div className="text-center py-12">
          <h2 className="text-2xl font-bold text-red-500">Cliente Não Encontrado</h2>
          <p className="mt-2 mb-6">O cliente que procura não existe ou foi removido.</p>
          <Link to="/clients">
            <Button>
              <ArrowLeft className="mr-2 h-4 w-4" />
              Voltar para Clientes
            </Button>
          </Link>
        </div>
      </PageLayout>
    );
  }

  // Handlers
  const updateClient = (data: Partial<ClientDetailData>) => {
    setClient(prevClient => {
      if (!prevClient) return null;
      const newClientData = { ...prevClient, ...data };
      
      // Atualizar a lista geral de clientes no localStorage
    const clients = loadFromStorage<ClientDetailData[]>('clients', []);
      const updatedClients = clients.map(c => 
        c.id === clientId ? newClientData : c
      );
    saveToStorage('clients', updatedClients);
    
      toast.success("Dados do cliente atualizados.");
      return newClientData;
    });
  };

  const addSession = (data: Omit<Session, 'id' | 'clientId'>) => {
    const newSession: Session = {
      ...data,
      id: Date.now().toString(),
      clientId: clientId as string,
      arquivos: [],
    };

    // Salva no Supabase primeiro
    const supabase = (window as any).supabase;
    if (supabase) {
       supabase.from('sessoes').insert(newSession).then(({ error }: any) => {
          if (error) {
             toast.error(`Erro ao salvar sessão: ${error.message}`);
             console.error("Erro Supabase insert session:", error);
          } else {
             // Se salvou no Supabase, atualiza localStorage e estado
    const allSessions = loadFromStorage<Session[]>('sessions', []);
    const updatedSessions = [...allSessions, newSession];
    saveToStorage('sessions', updatedSessions);
             setSessions(prev => [...prev, newSession]);
             updateClient({ sessionCount: (client?.sessionCount || 0) + 1 });
             toast.success('Sessão adicionada com sucesso');
          }
       });
    } else {
       toast.error("Supabase não conectado. Não foi possível salvar a sessão.");
    }
  };

  const handleUpdateSession = (updatedSession: Session) => {
     setSessions(prevSessions => {
        const sessionIndex = prevSessions.findIndex(s => s.id === updatedSession.id);
        let updatedSessionList;
        
        if (sessionIndex > -1) {
            // Atualiza sessão existente na lista local
            updatedSessionList = [...prevSessions];
            updatedSessionList[sessionIndex] = updatedSession;
        } else {
            // Adiciona nova sessão à lista local (caso de 1ª edição de agendamento)
            updatedSessionList = [...prevSessions, updatedSession];
        }

        // Atualiza a lista geral de sessões no localStorage com os dados que vieram do Supabase
        const allSessions = loadFromStorage<Session[]>('sessions', []);
        const sessionExistsInAll = allSessions.some(s => s.id === updatedSession.id);
        let allUpdatedSessions;
        if (sessionExistsInAll) {
             allUpdatedSessions = allSessions.map(s => s.id === updatedSession.id ? updatedSession : s);
        } else {
             allUpdatedSessions = [...allSessions, updatedSession];
        }
        saveToStorage('sessions', allUpdatedSessions);
        
        // Se foi uma adição (vindo do calendário), atualiza contagem no cliente
        if (sessionIndex === -1) {
             updateClient({ sessionCount: (client?.sessionCount || 0) + 1 });
        }

        return updatedSessionList; // Retorna a lista atualizada para o estado local
     });
  };

  const addPayment = (data: Omit<Payment, 'id' | 'clientId'>) => {
    const newPayment: Payment = {
      ...data,
      id: Date.now().toString(),
      clientId: clientId as string,
    };
    const allPayments = loadFromStorage<Payment[]>('payments', []);
    const updatedPayments = [...allPayments, newPayment];
    saveToStorage('payments', updatedPayments);
    setPayments(prev => [...prev, newPayment]);
    updateClient({ totalPaid: (client?.totalPaid || 0) + data.amount });
    toast.success('Pagamento adicionado com sucesso');
  };

  const deletePayment = (paymentId: string) => {
    const paymentToDelete = payments.find(p => p.id === paymentId);
    if (!paymentToDelete) return;
    updateClient({ totalPaid: Math.max(0, (client?.totalPaid || 0) - paymentToDelete.amount) });
    const allPayments = loadFromStorage<Payment[]>('payments', []);
    const updatedPayments = allPayments.filter(p => p.id !== paymentId);
    saveToStorage('payments', updatedPayments);
    setPayments(prev => prev.filter(p => p.id !== paymentId));
    toast.success('Pagamento eliminado com sucesso');
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      
      const allowedTypes = [
        'application/pdf', 
        'text/plain', 
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'image/jpeg',
        'image/jpg',
        'image/png'
      ];
      
      if (!allowedTypes.includes(file.type)) {
        toast.error('Tipo de ficheiro não suportado. Apenas PDF, TXT, XLSX, JPG e PNG são permitidos.');
        return;
      }
      
      const fileUrl = URL.createObjectURL(file);
      
      let fileType = 'outro';
      if (file.type === 'application/pdf') fileType = 'pdf';
      else if (file.type === 'text/plain') fileType = 'txt';
      else if (file.type === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet') fileType = 'xlsx';
      else if (file.type === 'image/jpeg' || file.type === 'image/jpg') fileType = 'jpg';
      else if (file.type === 'image/png') fileType = 'png';
      
      const newFile: ClientFile = {
        id: Date.now().toString(),
        clientId: clientId as string,
        name: file.name,
        type: fileType,
        size: file.size,
        url: fileUrl,
        uploadDate: new Date().toISOString(),
      };
      
      const allFiles = loadFromStorage<ClientFile[]>('clientFiles', []);
      const updatedFiles = [...allFiles, newFile];
      saveToStorage('clientFiles', updatedFiles);
      
      setFiles(prev => [...prev, newFile]);
      toast.success('Ficheiro carregado com sucesso');
    }
  };

  const deleteFile = (fileId: string) => {
    const allFiles = loadFromStorage<ClientFile[]>('clientFiles', []);
    const updatedFiles = allFiles.filter(file => file.id !== fileId);
    saveToStorage('clientFiles', updatedFiles);
    setFiles(files.filter(file => file.id !== fileId));
    toast.success('Ficheiro eliminado com sucesso');
  };
  
  const handleAddMood = (mood: Omit<ClientMood, 'id' | 'clientId'>) => {
    const newMood = { ...mood, id: Date.now().toString(), clientId: clientId as string };
    const allMoods = loadFromStorage<ClientMood[]>('clientMoods', []);
    const updatedMoods = [...allMoods, newMood];
    saveToStorage('clientMoods', updatedMoods);
    setMoods(prev => [...prev, newMood]);
    toast.success("Registo de humor adicionado.");
  };

  // Renderização
  const renderContent = () => {
    switch (activeTab) {
      case 'profile':
        return <ClientProfile client={client!} onUpdateClient={updateClient} />;
      case 'sessions':
        return <ClientSessions 
                  sessions={sessions}
                  clientId={clientId!} 
                  onAddSession={addSession} 
                  client={client!} 
                  onUpdateClient={updateClient}
                  onUpdateSession={handleUpdateSession}
               />;
      case 'payments':
        return <ClientPayments payments={payments} clientId={clientId!} onAddPayment={addPayment} onDeletePayment={deletePayment}/>;
      case 'files':
        return <ClientFiles files={files} onUploadFile={handleFileUpload} onDeleteFile={deleteFile} />;
      case 'reports':
        return <ClientReports client={client!} sessions={sessions} payments={payments} />;
      case 'mood':
        return <ClientMoodTracker clientId={clientId!} onSubmitMood={handleAddMood} moods={moods} />;
      case 'monitoring':
        return <ClientMonitoringTab 
                 client={client!} 
                 manualSessions={sessions} 
                 appointments={allAppointments}
                 onUpdateSession={handleUpdateSession}
              />;
      default:
        return <ClientProfile client={client!} onUpdateClient={updateClient} />;
    }
  };
  
  return (
    <PageLayout>
      <div className="flex items-center mb-8">
        <Link to="/clients">
          <Button variant="outline" size="sm" className="mr-4">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Voltar
          </Button>
        </Link>
        <div>
          <h1 className="text-3xl font-bold gradient-heading">{client.name}</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">{client.email} • {client.phone}</p>
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
        <Card className="glassmorphism">
          <CardContent className="pt-6">
            <p className="text-gray-600 dark:text-gray-400">Total de Sessões</p>
            <p className="text-2xl font-bold">{client.sessionCount}</p>
          </CardContent>
        </Card>
        
        <Card className="glassmorphism">
          <CardContent className="pt-6">
            <p className="text-gray-600 dark:text-gray-400">Total Pago</p>
            <p className="text-2xl font-bold">€{client.totalPaid?.toLocaleString()}</p>
          </CardContent>
        </Card>
        
        <Card className="glassmorphism md:col-span-2">
          <CardContent className="pt-6">
            <p className="text-gray-600 dark:text-gray-400">Próxima Sessão</p>
            {client.nextSession ? (
              <p className="text-xl font-medium">{client.nextSession}</p>
            ) : (
              <p className="text-gray-500 dark:text-gray-400">Sem sessões agendadas</p>
            )}
          </CardContent>
        </Card>
      </div>
      
      <Tabs defaultValue="profile" onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-7 mb-6">
          <TabsTrigger value="profile">Perfil</TabsTrigger>
          <TabsTrigger value="sessions">Sessões</TabsTrigger>
          <TabsTrigger value="payments">Pagamentos</TabsTrigger>
          <TabsTrigger value="files">Ficheiros</TabsTrigger>
          <TabsTrigger value="reports">Relatórios</TabsTrigger>
          <TabsTrigger value="mood">Estado Emocional</TabsTrigger>
          <TabsTrigger value="monitoring">Monitorização</TabsTrigger>
        </TabsList>
        
        {renderContent()}
      </Tabs>
    </PageLayout>
  );
};

export default ClientDetailPage;
