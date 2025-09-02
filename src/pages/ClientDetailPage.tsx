import React, { useState, useEffect, useCallback } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import PageLayout from '@/components/layout/PageLayout';
import { useAdminContext } from '@/contexts/AdminContext';
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
import { parseISO, format, isSameDay, isBefore, compareDesc, isAfter } from 'date-fns';
import useClients from '@/hooks/useClients';
import usePayments from '@/hooks/usePayments.tsx';
import useAppointments from '@/hooks/useAppointments';
import { supabase } from '@/integrations/supabase/client';
import ClientDetailTabs from '@/components/client-details/ClientDetailTabs';

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

// Tipo para os agendamentos vindos do Supabase
type DbAppointment = {
  id: number;
  titulo: string;
  data: string;
  hora: string;
  id_cliente: number;
  tipo: string;
  notas: string;
  estado: string;
  clientes: {
    nome: string;
    email: string;
    telefone: string;
  };
};

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
  const { isAdminContext } = useAdminContext();
  const { clientId } = useParams<{ clientId: string }>();
  const navigate = useNavigate();
  const { clients, isLoading: isLoadingClients, updateClient: updateClientInDb, deleteClient: deleteClientFromDb } = useClients();
  const { payments, isLoading: isLoadingPayments, addPayment: addPaymentToDb } = usePayments(clientId ? parseInt(clientId, 10) : undefined);
  const { appointments, isLoading: isLoadingAppointments } = useAppointments();
  
  // Estados
  const [client, setClient] = useState<ClientDetailData | null>(null);
  const [sessions, setSessions] = useState<Session[]>([]);
  const [files, setFiles] = useState<ClientFile[]>([]);
  const [moods, setMoods] = useState<ClientMood[]>([]);
  const [allAppointments, setAllAppointments] = useState<Appointment[]>([]);
  const [activeTab, setActiveTab] = useState('profile');
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingMoods, setIsLoadingMoods] = useState(true);

  // Função para obter a próxima sessão do cliente
  const findNextAppointment = useCallback(() => {
    if (!appointments || !clientId) return null;
    
    const now = new Date();
    const clientAppointments = appointments.filter(app => 
      app.id_cliente?.toString() === clientId && 
      isAfter(parseISO(app.data), now)
    );
    
    if (clientAppointments.length === 0) return null;
    
    // Ordenar por data, do mais próximo para o mais distante
    clientAppointments.sort((a, b) => 
      compareDesc(parseISO(b.data), parseISO(a.data)) * -1
    );
    
    return clientAppointments[0];
  }, [appointments, clientId]);

  // Função para formatar a data da próxima sessão para exibição
  const formatNextAppointment = useCallback((appointment: DbAppointment | null) => {
    if (!appointment) return null;
    
    const appointmentDate = parseISO(appointment.data);
    const formattedDate = format(appointmentDate, 'dd/MM/yyyy');
    const formattedTime = format(appointmentDate, 'HH:mm');
    const appointmentType = appointment.tipo.charAt(0).toUpperCase() + appointment.tipo.slice(1);
    
    return {
      formattedText: `${formattedDate} às ${formattedTime}`,
      title: appointment.titulo,
      type: appointmentType,
      status: appointment.estado
    };
  }, []);

  // Carregar dados
  useEffect(() => {
    if (!isLoadingClients && clientId) {
      const foundClient = clients.find(c => c.id?.toString() === clientId);
      
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

  // Atualizar a próxima sessão sempre que os agendamentos forem carregados ou atualizados
  useEffect(() => {
    if (!isLoadingAppointments && clientId) {
      const nextAppointment = findNextAppointment();
      const formattedNextAppointment = formatNextAppointment(nextAppointment);
      
      // Apenas atualizar se a sessão atual for diferente
      if (formattedNextAppointment !== null) {
        setClient(prevClient => {
          if (!prevClient) return null;
          
          // Verificar se o valor já é o mesmo para evitar atualizações desnecessárias
          if (prevClient.proxima_sessao === formattedNextAppointment.formattedText &&
              prevClient.proxima_sessao_titulo === formattedNextAppointment.title &&
              prevClient.proxima_sessao_tipo === formattedNextAppointment.type &&
              prevClient.proxima_sessao_estado === formattedNextAppointment.status) {
            return prevClient; // Retorna o mesmo objeto se não houver alterações
          }
          
          return {
            ...prevClient,
            proxima_sessao: formattedNextAppointment.formattedText,
            proxima_sessao_titulo: formattedNextAppointment.title,
            proxima_sessao_tipo: formattedNextAppointment.type,
            proxima_sessao_estado: formattedNextAppointment.status
          };
        });
      } else {
        // Caso não tenha próxima sessão
        setClient(prevClient => {
          if (!prevClient) return null;
          
          // Verificar se já está null para evitar atualizações desnecessárias
          if (prevClient.proxima_sessao === null &&
              prevClient.proxima_sessao_titulo === null &&
              prevClient.proxima_sessao_tipo === null &&
              prevClient.proxima_sessao_estado === null) {
            return prevClient;
          }
          
          return {
            ...prevClient,
            proxima_sessao: null,
            proxima_sessao_titulo: null,
            proxima_sessao_tipo: null,
            proxima_sessao_estado: null
          };
        });
      }
    }
  }, [appointments, clientId, isLoadingAppointments, findNextAppointment, formatNextAppointment]);

  // Carregar dados de humor do Supabase
  useEffect(() => {
    if (clientId) {
      const fetchMoods = async () => {
        setIsLoadingMoods(true);
        try {
          // Tentar carregar do Supabase primeiro
          const { data: supabaseMoods, error } = await supabase
            .from('humor_cliente')
            .select('*')
            .eq('id_cliente', parseInt(clientId))
            .order('data', { ascending: false });
            
          if (error) {
            console.error('Erro ao carregar estados emocionais do Supabase:', error);
            // Se falhar, carregar do localStorage como fallback
            const localMoods = loadFromStorage<ClientMood[]>('clientMoods', [])
              .filter(mood => mood.clientId === clientId);
            setMoods(localMoods);
          } else if (supabaseMoods) {
            // Mapear os dados do Supabase para o formato ClientMood
            const formattedMoods: ClientMood[] = supabaseMoods.map(mood => ({
              id: mood.id.toString(),
              clientId: clientId,
              mood: mood.humor,
              sleepQuality: mood.qualidade_sono,
              notes: mood.notas,
              date: mood.data
            }));
            
            setMoods(formattedMoods);
            
            // Atualizar o localStorage com os dados mais recentes do Supabase
            const allMoods = loadFromStorage<ClientMood[]>('clientMoods', []);
            const filteredMoods = allMoods.filter(mood => mood.clientId !== clientId);
            saveToStorage('clientMoods', [...filteredMoods, ...formattedMoods]);
          }
        } catch (error) {
          console.error('Erro ao carregar estados emocionais:', error);
          toast.error('Falha ao carregar registros de humor');
        } finally {
          setIsLoadingMoods(false);
        }
      };
      
      fetchMoods();
    }
  }, [clientId]);

  // Se o cliente não for encontrado, mostrar erro
  if (isLoading || isLoadingClients) {
    const loadingContent = <div>Carregando...</div>;
    
    return isAdminContext ? loadingContent : (
      <PageLayout>
        {loadingContent}
      </PageLayout>
    );
  }

  if (!client) {
    const errorContent = (
      <div className="text-center py-12">
        <h2 className="text-2xl font-bold text-red-500">Cliente Não Encontrado</h2>
        <p className="mt-2 mb-6">O cliente que procura não existe ou foi removido.</p>
        <Link to={isAdminContext ? "/admin/clients" : "/clients"}>
            <Button>
              <ArrowLeft className="mr-2 h-4 w-4" />
              Voltar para Clientes
            </Button>
          </Link>
        </div>
    );

    return isAdminContext ? errorContent : (
      <PageLayout>
        {errorContent}
      </PageLayout>
    );
  }

  // Handlers
  const updateClient = async (data: Partial<ClientDetailData>) => {
    if (!client || !clientId) return;
    
    try {
      // Verificar se o ID foi alterado
      if (data.id && data.id !== client.id) {
        // Operação de alteração de ID é diferente de uma atualização normal
        
        // 1. Remover o ID do objeto antes de passar para o Supabase para que ele não tente atualizar o ID
        const { id, ...updateData } = data;
        
        if (!id) {
          throw new Error('ID não fornecido para a operação de alteração de ID');
        }
        
        // 2. Criar um novo cliente com o novo ID
        // Precisamos garantir que todos os campos obrigatórios estejam presentes
        const newClientData = {
          id: id,
          nome: client.nome,
          email: client.email, 
          telefone: client.telefone,
          data_nascimento: client.data_nascimento,
          genero: client.genero,
          morada: client.morada || '',
          estado: client.estado,
          tipo_contato: client.tipo_contato,
          como_conheceu: client.como_conheceu,
          ...updateData
        };
        
        const { error: insertError } = await supabase
          .from('clientes')
          .insert([newClientData]);
          
        if (insertError) {
          throw new Error(`Falha ao criar cliente com novo ID: ${insertError.message}`);
        }
        
        // 3. Atualizar referências em outras tabelas
        
        // 3.1 Atualizar pagamentos
        const { error: paymentsError } = await supabase
          .from('pagamentos')
          .update({ id_cliente: id })
          .eq('id_cliente', client.id);
          
        if (paymentsError) {
          toast.warning(`Falha ao atualizar referências de pagamentos: ${paymentsError.message}`);
          console.error('Erro ao atualizar pagamentos:', paymentsError);
        }
        
        // 3.2 Atualizar sessões/agendamentos
        const { error: appointmentsError } = await supabase
          .from('agendamentos')
          .update({ id_cliente: id })
          .eq('id_cliente', client.id);
          
        if (appointmentsError) {
          toast.warning(`Falha ao atualizar referências de agendamentos: ${appointmentsError.message}`);
          console.error('Erro ao atualizar agendamentos:', appointmentsError);
        }
        
        // 3.3 Atualizar registros de humor
        const { error: moodError } = await supabase
          .from('humor_cliente')
          .update({ id_cliente: id })
          .eq('id_cliente', client.id);
          
        if (moodError) {
          toast.warning(`Falha ao atualizar registros de humor: ${moodError.message}`);
          console.error('Erro ao atualizar registros de humor:', moodError);
        }
        
        // 4. Excluir o cliente com o ID antigo
        const { error: deleteError } = await supabase
          .from('clientes')
          .delete()
          .eq('id', client.id);
          
        if (deleteError) {
          throw new Error(`Falha ao excluir cliente com ID antigo: ${deleteError.message}`);
        }
        
        // 5. Atualizar o cliente no estado local
        setClient(prevClient => {
          if (!prevClient) return null;
          return { ...prevClient, ...data };
        });
        
        // 6. Redirecionar para a página do cliente com o novo ID
        navigate(`/clients/${id}`);
        
        toast.success('ID do cliente e perfil atualizados com sucesso!');
      } else {
        // Atualização normal sem alterar o ID
        // Remover campos temporários que não existem no banco de dados
        const { 
          proxima_sessao_titulo, 
          proxima_sessao_tipo, 
          proxima_sessao_estado, 
          ...updateData 
        } = data;
        
        await updateClientInDb(parseInt(clientId, 10), updateData);
        setClient(prevClient => {
          if (!prevClient) return null;
          const updatedClient = { ...prevClient, ...data };
          if (data.data_nascimento) {
            updatedClient.data_nascimento = typeof data.data_nascimento === 'string' ? data.data_nascimento : format(data.data_nascimento, 'yyyy-MM-dd');
          }
          return updatedClient;
        });
        toast.success('Perfil do cliente atualizado com sucesso!');
      }
    } catch (error) {
      console.error('Error updating client:', error);
      toast.error(`Falha ao atualizar o perfil do cliente: ${(error as Error).message}`);
    }
  };

  const handleDeleteClient = async () => {
    if (!client || !clientId) return;

    try {
      await deleteClientFromDb(parseInt(clientId, 10));
      toast.success('Cliente eliminado com sucesso!');
      navigate('/clients');
    } catch (error) {
      console.error('Error deleting client:', error);
      toast.error('Falha ao eliminar o cliente.');
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

  const editPayment = async (paymentId: number, data: Omit<Payment, 'id' | 'id_cliente' | 'criado_em' | 'updated_at'>) => {
    try {
      // Encontrar o pagamento para calcular a diferença no valor
      const originalPayment = payments.find(p => p.id === paymentId);
      if (!originalPayment) return;
      
      // Calcular diferença no valor para atualizar o total pago do cliente
      const valueDifference = data.valor - originalPayment.valor;
      
      // Atualizar o pagamento no banco de dados
      const { error } = await supabase
        .from('pagamentos')
        .update({
          data: data.data,
          valor: data.valor,
          descricao: data.descricao,
          tipo: data.tipo,
          updated_at: new Date().toISOString()
        })
        .eq('id', paymentId);
        
      if (error) throw error;
      
      // Atualizar o total pago no cliente
      if (valueDifference !== 0) {
        updateClient({ total_pago: (client?.total_pago || 0) + valueDifference });
      }
      
      toast.success('Pagamento atualizado com sucesso');
    } catch (error) {
      console.error("Erro ao editar pagamento:", error);
      toast.error("Erro ao editar pagamento");
    }
  };

  const deletePayment = async (paymentId: number) => {
    try {
      const paymentToDelete = payments.find(p => p.id === paymentId);
      if (!paymentToDelete) return;
      
      // Usando Supabase diretamente
      const { error } = await supabase
        .from('pagamentos')
        .delete()
        .eq('id', paymentId);
        
      if (error) throw error;
      
      // Atualizar o total pago
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
  
  const handleAddMood = async (mood: Omit<ClientMood, 'id' | 'clientId'>) => {
    try {
      // O ID será atribuído pelo ClientMoodTracker após a inserção no Supabase
      const newMood = { ...mood, id: Date.now().toString(), clientId: clientId as string };
      
      // Atualizar estado localmente
      setMoods(prev => [newMood, ...prev]);
      
      // O ClientMoodTracker já cuida da persistência no Supabase e localStorage
      toast.success("Registo de humor adicionado com sucesso.");
    } catch (error) {
      console.error('Erro ao adicionar humor:', error);
      toast.error('Falha ao adicionar registo de humor');
    }
  };

  // Renderização
  const renderTabContent = () => {
    switch (activeTab) {
      case 'profile':
        return (
          <ClientProfile 
            client={client!} 
            onUpdateClient={updateClient} 
            onDeleteClient={handleDeleteClient} 
          />
        );
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
                  payments={payments as any[]} 
                  clientId={clientId!} 
                  onAddPayment={addPayment} 
                  onDeletePayment={deletePayment}
                  onEditPayment={editPayment}
               />;
      case 'files':
        return <ClientFiles files={files} onUploadFile={handleFileUpload} onDeleteFile={deleteFile} />;
      case 'reports':
        return <ClientReports client={client!} sessions={sessions} payments={payments as any[]} />;
      case 'mood':
        return <ClientMoodTracker 
                 clientId={clientId!} 
                 onSubmitMood={handleAddMood} 
                 moods={moods}
               />;
      default:
        return <ClientProfile client={client!} onUpdateClient={updateClient} onDeleteClient={handleDeleteClient} />;
    }
  };
  
  // Prepare the tabs data for the ClientDetailTabs component
  const tabs = [
    { id: 'profile', label: 'Perfil', content: renderTabContent() },
    { id: 'sessions', label: 'Sessões', content: null },
    { id: 'payments', label: 'Pagamentos', content: null },
    { id: 'files', label: 'Ficheiros', content: null },
    { id: 'reports', label: 'Relatórios', content: null },
    { id: 'mood', label: 'Estado Emocional', content: null }
  ];
  
  const pageContent = (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-3 sm:mb-6 gap-2">
        <div className="flex items-center">
          <Link to={isAdminContext ? "/admin/clients" : "/clients"}>
            <Button variant="outline" size="sm" className="mr-2 sm:mr-4">
              <ArrowLeft className="mr-1 sm:mr-2 h-4 w-4" />
              <span className="hidden xs:inline">Voltar</span>
            </Button>
          </Link>
          <div className="min-w-0 flex-1">
            <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold gradient-heading truncate">{client.nome}</h1>
            <p className="text-gray-600 dark:text-gray-400 mt-1 text-xs sm:text-sm lg:text-base overflow-hidden text-ellipsis">
              {client.email} • {client.telefone}
            </p>
          </div>
        </div>
      </div>
      
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-3 lg:gap-6 mb-4 sm:mb-6">
        <Card className="glassmorphism client-profile-card">
          <CardContent className="pt-3 sm:pt-4 lg:pt-6">
            <p className="text-gray-600 dark:text-gray-400 text-xs sm:text-sm">Total de Sessões</p>
            <p className="text-lg sm:text-xl lg:text-2xl font-bold">{client.numero_sessoes || 0}</p>
          </CardContent>
        </Card>
        
        <Card className="glassmorphism client-profile-card">
          <CardContent className="pt-3 sm:pt-4 lg:pt-6">
            <p className="text-gray-600 dark:text-gray-400 text-xs sm:text-sm">Total Pago</p>
            <p className="text-lg sm:text-xl lg:text-2xl font-bold">€{client.total_pago?.toLocaleString() || '0.00'}</p>
          </CardContent>
        </Card>
        
        <Card className="glassmorphism client-profile-card sm:col-span-2">
          <CardContent className="pt-3 sm:pt-4 lg:pt-6">
            <p className="text-gray-600 dark:text-gray-400 text-xs sm:text-sm">Próxima Sessão</p>
            {client.proxima_sessao ? (
              <div className="space-y-1">
                <div className="flex items-center">
                  <p className="text-base sm:text-lg lg:text-xl font-medium truncate">{client.proxima_sessao}</p>
                  {client.proxima_sessao_estado && (
                    <span className={`status-indicator status-indicator-${client.proxima_sessao_estado} ml-2 flex-shrink-0`}></span>
                  )}
                </div>
                <div className="flex flex-wrap items-center text-xs sm:text-sm text-gray-500 dark:text-gray-400 gap-1">
                  <span className="truncate">{client.proxima_sessao_titulo}</span>
                  {client.proxima_sessao_tipo && (
                    <span className="px-1.5 sm:px-2 py-0.5 rounded-full bg-gray-100 dark:bg-gray-700 text-xs flex-shrink-0">
                      {client.proxima_sessao_tipo}
                    </span>
                  )}
                </div>
              </div>
            ) : (
              <p className="text-gray-500 dark:text-gray-400 text-xs sm:text-sm">Sem sessões agendadas</p>
            )}
          </CardContent>
        </Card>
      </div>
      
      <ClientDetailTabs 
        activeTab={activeTab} 
        onTabChange={setActiveTab} 
        tabs={tabs.map(tab => ({
          ...tab,
          content: tab.id === activeTab ? renderTabContent() : null
        }))}
      />
    </div>
  );

  return isAdminContext ? pageContent : (
    <PageLayout>
      {pageContent}
    </PageLayout>
  );
};

export default ClientDetailPage;
