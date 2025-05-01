
import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import PageLayout from '@/components/layout/PageLayout';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent } from '@/components/ui/card';
import { ArrowLeft } from 'lucide-react';
import { toast } from 'sonner';
import { ClientDetailData, Session, Payment, ClientFile } from '@/types/client';
import ClientProfile from '@/components/client-details/ClientProfile';
import ClientSessions from '@/components/client-details/ClientSessions';
import ClientPayments from '@/components/client-details/ClientPayments';
import ClientFiles from '@/components/client-details/ClientFiles';
import { parseISO, format, isSameDay, isBefore } from 'date-fns';

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

  // Carregar dados
  useEffect(() => {
    const clients = loadFromStorage<ClientDetailData[]>('clients', []);
    const foundClient = clients.find(c => c.id === clientId);
    
    if (foundClient) {
      setClient(foundClient);
    }
    
    const allSessions = loadFromStorage<Session[]>('sessions', []);
    const clientSessions = allSessions.filter(session => session.clientId === clientId);
    setSessions(clientSessions);
    
    const allPayments = loadFromStorage<Payment[]>('payments', []);
    const clientPayments = allPayments.filter(payment => payment.clientId === clientId);
    setPayments(clientPayments);
    
    const allFiles = loadFromStorage<ClientFile[]>('clientFiles', []);
    const clientFiles = allFiles.filter(file => file.clientId === clientId);
    setFiles(clientFiles);

    // Load appointments to get next session
    const appointments = loadFromStorage('appointments', []);
    const clientAppointments = appointments.filter((app: any) => app.clientId === clientId);
    
    // Find closest future appointment
    const now = new Date();
    const futureAppointments = clientAppointments
      .filter((app: any) => {
        const appDate = parseISO(app.date);
        return !isBefore(appDate, now);
      })
      .sort((a: any, b: any) => {
        return parseISO(a.date).getTime() - parseISO(b.date).getTime();
      });
    
    // Update client with next session info if available
    if (foundClient && futureAppointments.length > 0) {
      const nextSession = futureAppointments[0];
      const appointmentDate = parseISO(nextSession.date);
      const formattedDate = format(appointmentDate, "dd/MM/yyyy 'às' HH:mm");
      
      const updatedClient = {
        ...foundClient,
        nextSession: formattedDate
      };
      
      // Update in state but don't save to localStorage yet to avoid circular updates
      setClient(updatedClient);
    }

  }, [clientId]);

  // Se o cliente não for encontrado, mostrar erro
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
  const updateClient = (data: ClientDetailData) => {
    const clients = loadFromStorage<ClientDetailData[]>('clients', []);
    const updatedClients = clients.map(c => c.id === clientId ? {...c, ...data} : c);
    saveToStorage('clients', updatedClients);
    setClient({...client, ...data});
    toast.success('Informações do cliente atualizadas com sucesso');
  };

  const addSession = (data: Session) => {
    const newSession = {
      ...data,
      id: Date.now().toString(),
      clientId: clientId as string,
    };
    const allSessions = loadFromStorage<Session[]>('sessions', []);
    const updatedSessions = [...allSessions, newSession];
    saveToStorage('sessions', updatedSessions);
    
    const clients = loadFromStorage<ClientDetailData[]>('clients', []);
    const updatedClients = clients.map(c => 
      c.id === clientId ? {...c, sessionCount: (c.sessionCount || 0) + 1} : c
    );
    saveToStorage('clients', updatedClients);
    
    setSessions(prev => [...prev, newSession]);
    setClient(prev => prev ? {...prev, sessionCount: (prev.sessionCount || 0) + 1} : null);
    toast.success('Sessão adicionada com sucesso');
  };

  const addPayment = (data: Payment) => {
    const newPayment = {
      ...data,
      id: Date.now().toString(),
      clientId: clientId as string,
    };
    const allPayments = loadFromStorage<Payment[]>('payments', []);
    const updatedPayments = [...allPayments, newPayment];
    saveToStorage('payments', updatedPayments);
    
    const clients = loadFromStorage<ClientDetailData[]>('clients', []);
    const updatedClients = clients.map(c => 
      c.id === clientId ? {...c, totalPaid: (c.totalPaid || 0) + data.amount} : c
    );
    saveToStorage('clients', updatedClients);
    
    setPayments(prev => [...prev, newPayment]);
    setClient(prev => prev ? {...prev, totalPaid: (prev.totalPaid || 0) + data.amount} : null);
  };

  const deletePayment = (paymentId: string) => {
    const paymentToDelete = payments.find(p => p.id === paymentId);
    
    if (!paymentToDelete) return;
    
    // Update client's total paid amount
    const clients = loadFromStorage<ClientDetailData[]>('clients', []);
    const updatedClients = clients.map(c => 
      c.id === clientId 
        ? {...c, totalPaid: Math.max(0, (c.totalPaid || 0) - paymentToDelete.amount)} 
        : c
    );
    saveToStorage('clients', updatedClients);
    
    // Update payments in localStorage
    const allPayments = loadFromStorage<Payment[]>('payments', []);
    const updatedPayments = allPayments.filter(p => p.id !== paymentId);
    saveToStorage('payments', updatedPayments);
    
    // Update state
    setPayments(prev => prev.filter(p => p.id !== paymentId));
    setClient(prev => prev 
      ? {...prev, totalPaid: Math.max(0, (prev.totalPaid || 0) - paymentToDelete.amount)} 
      : null
    );
    
    toast.success('Pagamento eliminado com sucesso');
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      
      const allowedTypes = ['application/pdf', 'text/plain', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'];
      if (!allowedTypes.includes(file.type)) {
        toast.error('Tipo de ficheiro não suportado. Apenas PDF, TXT e XLSX são permitidos.');
        return;
      }
      
      const fileUrl = URL.createObjectURL(file);
      
      let fileType = 'outro';
      if (file.type === 'application/pdf') fileType = 'pdf';
      else if (file.type === 'text/plain') fileType = 'txt';
      else if (file.type === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet') fileType = 'xlsx';
      
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
          <p className="text-gray-600 mt-1">{client.email} • {client.phone}</p>
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
        <Card className="glassmorphism">
          <CardContent className="pt-6">
            <p className="text-gray-600">Total de Sessões</p>
            <p className="text-2xl font-bold">{client.sessionCount}</p>
          </CardContent>
        </Card>
        
        <Card className="glassmorphism">
          <CardContent className="pt-6">
            <p className="text-gray-600">Total Pago</p>
            <p className="text-2xl font-bold">€{client.totalPaid?.toLocaleString()}</p>
          </CardContent>
        </Card>
        
        <Card className="glassmorphism md:col-span-2">
          <CardContent className="pt-6">
            <p className="text-gray-600">Próxima Sessão</p>
            {client.nextSession ? (
              <p className="text-xl font-medium">{client.nextSession}</p>
            ) : (
              <p className="text-gray-500">Sem sessões agendadas</p>
            )}
          </CardContent>
        </Card>
      </div>
      
      <Tabs defaultValue="profile" className="w-full">
        <TabsList className="grid grid-cols-4 mb-6">
          <TabsTrigger value="profile">Perfil</TabsTrigger>
          <TabsTrigger value="sessions">Sessões</TabsTrigger>
          <TabsTrigger value="payments">Pagamentos</TabsTrigger>
          <TabsTrigger value="files">Ficheiros</TabsTrigger>
        </TabsList>
        
        <TabsContent value="profile" className="mt-0">
          <ClientProfile client={client} onUpdateClient={updateClient} />
        </TabsContent>
        
        <TabsContent value="sessions" className="mt-0">
          <ClientSessions
            sessions={sessions}
            clientId={clientId as string}
            onAddSession={addSession}
          />
        </TabsContent>
        
        <TabsContent value="payments" className="mt-0">
          <ClientPayments
            payments={payments}
            clientId={clientId as string}
            onAddPayment={addPayment}
            onDeletePayment={deletePayment}
          />
        </TabsContent>
        
        <TabsContent value="files" className="mt-0">
          <ClientFiles
            files={files}
            onUploadFile={handleFileUpload}
            onDeleteFile={deleteFile}
          />
        </TabsContent>
      </Tabs>
    </PageLayout>
  );
};

export default ClientDetailPage;
