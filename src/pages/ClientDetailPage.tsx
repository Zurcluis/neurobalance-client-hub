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
import useClients from '@/hooks/useClients';
import usePayments from '@/hooks/usePayments';
import { supabase } from '@/integrations/supabase/client';

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
  const { clients, isLoading: isLoadingClients, updateClient: updateClientInDb } = useClients();
  const { payments, isLoading: isLoadingPayments, addPayment: addPaymentToDb, deletePayment: deletePaymentFromDb } = usePayments(clientId);
  
  // Estados
  const [client, setClient] = useState<ClientDetailData | null>(null);
  const [sessions, setSessions] = useState<Session[]>([]);
  const [files, setFiles] = useState<ClientFile[]>([]);
  const [moods, setMoods] = useState<ClientMood[]>([]);
  const [allAppointments, setAllAppointments] = useState<Appointment[]>([]);
  const [activeTab, setActiveTab] = useState('profile');
  const [isLoading, setIsLoading] = useState(true);

  // Carregar dados
  useEffect(() => {
    if (!isLoadingClients && clientId) {
      const foundClient = clients.find(c => c.id.toString() === clientId);
      
      if (foundClient) {
        const clientToSet: ClientDetailData = {
          ...foundClient,
          genero: foundClient.genero as 'Homem' | 'Mulher' | 'Outro',
          estado: foundClient.estado as 'ongoing' | 'thinking' | 'no-need' | 'finished' | 'call',
          tipo_contato: foundClient.tipo_contato as 'Lead' | 'Contato' | 'Email' | 'Instagram' | 'Facebook',
          como_conheceu: foundClient.como_conheceu as 'Anúncio' | 'Instagram' | 'Facebook' | 'Recomendação',
          proxima_sessao: null
        };
        setClient(clientToSet);
      }
      setIsLoading(false);
    }
  }, [clientId, clients, isLoadingClients]);

  // Se o cliente não for encontrado, mostrar erro
  if (isLoading || isLoadingClients) {
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
  const updateClient = async (data: Partial<ClientDetailData>) => {
    if (!client) return;
    
    try {
      await updateClientInDb(client.id, data);
      setClient(prevClient => {
        if (!prevClient) return null;
        return { ...prevClient, ...data };
      });
    } catch (error) {
      console.error('Error updating client:', error);
      toast.error('Failed to update client');
    }
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
             updateClient({ numero_sessoes: (client?.numero_sessoes || 0) + 1 });
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
             updateClient({ numero_sessoes: (client?.numero_sessoes || 0) + 1 });
        }

        return updatedSessionList; // Retorna a lista atualizada para o estado local
     });
  };

  const addPayment = async (data: Omit<Payment, 'id' | 'id_cliente' | 'criado_em' | 'updated_at'>) => {
    try {
      const newPayment = {
        id_cliente: parseInt(clientId as string, 10),
        data: data.data,
        valor: data.valor,
        descricao: data.descricao,
        tipo: data.tipo,
        criado_em: new Date().toISOString()
      };

      await addPaymentToDb(newPayment);
      updateClient({ total_pago: (client?.total_pago || 0) + data.valor });
      toast.success('Pagamento adicionado com sucesso');
    } catch (error) {
      console.error("Erro ao adicionar pagamento:", error);
      toast.error("Erro ao adicionar pagamento");
    }
  };

  const deletePayment = async (paymentId: number) => {
    try {
      const paymentToDelete = payments.find(p => p.id === paymentId);
      if (!paymentToDelete) return;

      await deletePaymentFromDb(paymentId.toString());
      updateClient({ total_pago: Math.max(0, (client?.total_pago || 0) - paymentToDelete.valor) });
      toast.success('Pagamento eliminado com sucesso');
    } catch (error) {
      console.error("Erro ao eliminar pagamento:", error);
      toast.error("Erro ao eliminar pagamento");
    }
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
  const renderTabContent = () => {
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
        return <ClientPayments 
                  payments={payments} 
                  clientId={clientId!} 
                  onAddPayment={addPayment} 
                  onDeletePayment={deletePayment}
               />;
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
          <h1 className="text-3xl font-bold gradient-heading">{client.nome}</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">{client.email} • {client.telefone}</p>
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
        <Card className="glassmorphism">
          <CardContent className="pt-6">
            <p className="text-gray-600 dark:text-gray-400">Total de Sessões</p>
            <p className="text-2xl font-bold">{client.numero_sessoes || 0}</p>
          </CardContent>
        </Card>
        
        <Card className="glassmorphism">
          <CardContent className="pt-6">
            <p className="text-gray-600 dark:text-gray-400">Total Pago</p>
            <p className="text-2xl font-bold">€{client.total_pago?.toLocaleString() || '0.00'}</p>
          </CardContent>
        </Card>
        
        <Card className="glassmorphism md:col-span-2">
          <CardContent className="pt-6">
            <p className="text-gray-600 dark:text-gray-400">Próxima Sessão</p>
            {client.proxima_sessao ? (
              <p className="text-xl font-medium">{client.proxima_sessao}</p>
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
        
        {renderTabContent()}
      </Tabs>
    </PageLayout>
  );
};

export default ClientDetailPage;
