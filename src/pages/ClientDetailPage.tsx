import React, { useState, useEffect, useCallback } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import PageLayout from '@/components/layout/PageLayout';
import { useAdminContext } from '@/contexts/AdminContext';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent } from '@/components/ui/card';
import { ArrowLeft, CalendarPlus, CreditCard, User, TrendingUp, Clock, Phone, Mail, Copy, ExternalLink } from 'lucide-react';
import { Progress } from '@/components/ui/progress';
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
  
  // Helper function para copiar texto
  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast.success(`${label} copiado!`);
  };

  // Calcular progresso das sessões
  const sessionProgress = client.max_sessoes 
    ? Math.min(((client.numero_sessoes || 0) / client.max_sessoes) * 100, 100)
    : 0;

  // Função para obter iniciais do nome
  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(n => n[0])
      .slice(0, 2)
      .join('')
      .toUpperCase();
  };

  // Função para gerar cor baseada no nome
  const getAvatarColor = (name: string) => {
    const colors = [
      'from-teal-400 to-cyan-500',
      'from-violet-400 to-purple-500',
      'from-rose-400 to-pink-500',
      'from-amber-400 to-orange-500',
      'from-emerald-400 to-green-500',
      'from-blue-400 to-indigo-500',
    ];
    const index = name.charCodeAt(0) % colors.length;
    return colors[index];
  };

  const pageContent = (
    <div className="space-y-6">
      {/* Header Hero Section */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-[#3f9094]/10 via-white to-[#3f9094]/5 dark:from-[#3f9094]/20 dark:via-gray-900 dark:to-[#3f9094]/10 border border-[#3f9094]/20 p-4 sm:p-6">
        {/* Background Pattern */}
        <div className="absolute inset-0 opacity-5">
          <div className="absolute top-0 right-0 w-64 h-64 bg-[#3f9094] rounded-full blur-3xl transform translate-x-1/2 -translate-y-1/2"></div>
          <div className="absolute bottom-0 left-0 w-48 h-48 bg-cyan-500 rounded-full blur-3xl transform -translate-x-1/2 translate-y-1/2"></div>
        </div>
        
        <div className="relative">
          {/* Top Row - Back Button */}
          <div className="flex items-center justify-between mb-4">
            <Link to={isAdminContext ? "/admin/clients" : "/clients"}>
              <Button variant="ghost" size="sm" className="text-gray-600 hover:text-[#3f9094] hover:bg-[#3f9094]/10">
                <ArrowLeft className="mr-1.5 h-4 w-4" />
                Voltar
              </Button>
            </Link>
            
            {/* Quick Actions - Desktop */}
            <div className="hidden sm:flex items-center gap-2">
              <Button 
                variant="outline" 
                size="sm"
                className="border-[#3f9094]/30 text-[#3f9094] hover:bg-[#3f9094]/10"
                onClick={() => setActiveTab('sessions')}
              >
                <CalendarPlus className="h-4 w-4 mr-1.5" />
                Agendar
              </Button>
              <Button 
                variant="outline" 
                size="sm"
                className="border-[#3f9094]/30 text-[#3f9094] hover:bg-[#3f9094]/10"
                onClick={() => setActiveTab('payments')}
              >
                <CreditCard className="h-4 w-4 mr-1.5" />
                Pagamento
              </Button>
            </div>
          </div>
          
          {/* Client Info Row */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
            {/* Avatar */}
            <div className={`w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-gradient-to-br ${getAvatarColor(client.nome)} flex items-center justify-center shadow-lg flex-shrink-0`}>
              <span className="text-white text-xl sm:text-2xl font-bold">
                {getInitials(client.nome)}
              </span>
            </div>
            
            {/* Name & Contact */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900 dark:text-white truncate">
                  {client.nome}
                </h1>
                {client.id_manual && (
                  <span className="px-2 py-0.5 bg-[#3f9094]/20 text-[#3f9094] rounded-full text-xs font-medium">
                    ID: {client.id_manual}
                  </span>
                )}
              </div>
              
              {/* Contact Info with copy buttons */}
              <div className="flex flex-wrap items-center gap-3 mt-2">
                <button 
                  onClick={() => copyToClipboard(client.email, 'Email')}
                  className="flex items-center gap-1.5 text-sm text-gray-600 dark:text-gray-400 hover:text-[#3f9094] transition-colors group"
                >
                  <Mail className="h-3.5 w-3.5" />
                  <span className="truncate max-w-[200px]">{client.email}</span>
                  <Copy className="h-3 w-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                </button>
                <button 
                  onClick={() => copyToClipboard(client.telefone, 'Telefone')}
                  className="flex items-center gap-1.5 text-sm text-gray-600 dark:text-gray-400 hover:text-[#3f9094] transition-colors group"
                >
                  <Phone className="h-3.5 w-3.5" />
                  <span>{client.telefone}</span>
                  <Copy className="h-3 w-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                </button>
              </div>
            </div>
          </div>
          
          {/* Quick Actions - Mobile */}
          <div className="flex sm:hidden items-center gap-2 mt-4">
            <Button 
              variant="outline" 
              size="sm"
              className="flex-1 border-[#3f9094]/30 text-[#3f9094] hover:bg-[#3f9094]/10"
              onClick={() => setActiveTab('sessions')}
            >
              <CalendarPlus className="h-4 w-4 mr-1.5" />
              Agendar
            </Button>
            <Button 
              variant="outline" 
              size="sm"
              className="flex-1 border-[#3f9094]/30 text-[#3f9094] hover:bg-[#3f9094]/10"
              onClick={() => setActiveTab('payments')}
            >
              <CreditCard className="h-4 w-4 mr-1.5" />
              Pagamento
            </Button>
          </div>
        </div>
      </div>
      
      {/* Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {/* Sessões Card com Progresso */}
        <Card className="bg-gradient-to-br from-white to-gray-50 dark:from-gray-800 dark:to-gray-900 border-gray-200 dark:border-gray-700 shadow-sm hover:shadow-md transition-shadow">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <div className="p-2 rounded-lg bg-[#3f9094]/10">
                <TrendingUp className="h-4 w-4 text-[#3f9094]" />
              </div>
              <span className="text-xs text-gray-500 dark:text-gray-400 font-medium">Sessões</span>
            </div>
            <p className="text-2xl font-bold text-gray-900 dark:text-white">
              {client.numero_sessoes || 0}
              {client.max_sessoes && (
                <span className="text-sm font-normal text-gray-400">/{client.max_sessoes}</span>
              )}
            </p>
            {client.max_sessoes && (
              <div className="mt-2">
                <Progress value={sessionProgress} className="h-1.5" />
                <p className="text-[10px] text-gray-400 mt-1">{Math.round(sessionProgress)}% concluído</p>
              </div>
            )}
          </CardContent>
        </Card>
        
        {/* Total Pago Card */}
        <Card className="bg-gradient-to-br from-white to-gray-50 dark:from-gray-800 dark:to-gray-900 border-gray-200 dark:border-gray-700 shadow-sm hover:shadow-md transition-shadow">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <div className="p-2 rounded-lg bg-emerald-500/10">
                <CreditCard className="h-4 w-4 text-emerald-500" />
              </div>
              <span className="text-xs text-gray-500 dark:text-gray-400 font-medium">Total Pago</span>
            </div>
            <p className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">
              €{(client.total_pago || 0).toLocaleString('pt-PT', { minimumFractionDigits: 0 })}
            </p>
          </CardContent>
        </Card>
        
        {/* Próxima Sessão Card */}
        <Card className="col-span-2 bg-gradient-to-br from-white to-gray-50 dark:from-gray-800 dark:to-gray-900 border-gray-200 dark:border-gray-700 shadow-sm hover:shadow-md transition-shadow">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <div className="p-2 rounded-lg bg-blue-500/10">
                <Clock className="h-4 w-4 text-blue-500" />
              </div>
              <span className="text-xs text-gray-500 dark:text-gray-400 font-medium">Próxima Sessão</span>
            </div>
            {client.proxima_sessao ? (
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-lg font-semibold text-gray-900 dark:text-white">{client.proxima_sessao}</p>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="text-sm text-gray-500">{client.proxima_sessao_titulo}</span>
                    {client.proxima_sessao_tipo && (
                      <span className="px-1.5 py-0.5 bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded text-xs">
                        {client.proxima_sessao_tipo}
                      </span>
                    )}
                  </div>
                </div>
                {client.proxima_sessao_estado && (
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                    client.proxima_sessao_estado === 'confirmado' ? 'bg-green-100 text-green-700' :
                    client.proxima_sessao_estado === 'pendente' ? 'bg-amber-100 text-amber-700' :
                    'bg-gray-100 text-gray-700'
                  }`}>
                    {client.proxima_sessao_estado}
                  </span>
                )}
              </div>
            ) : (
              <div className="flex items-center justify-between">
                <p className="text-gray-400 dark:text-gray-500 text-sm">Sem sessões agendadas</p>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="text-[#3f9094] hover:bg-[#3f9094]/10"
                  onClick={() => setActiveTab('sessions')}
                >
                  <CalendarPlus className="h-4 w-4 mr-1" />
                  Agendar
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
      
      {/* Tabs Section */}
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
