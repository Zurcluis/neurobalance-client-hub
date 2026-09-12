import { useCallback, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import PageLayout from '@/components/layout/PageLayout';
import { useAdminContext } from '@/contexts/AdminContext';
import { ArrowLeft, UserX } from 'lucide-react';
import { toast } from 'sonner';
import {
  ClientDetailData,
  ClientMood,
  Payment as ClientPayment,
  UpdateClient,
} from '@/types/client';
import ClientProfile from '@/components/client-details/ClientProfile';
import ClientSessions from '@/components/client-details/ClientSessions';
import ClientPayments from '@/components/client-details/ClientPayments';
import ClientFiles from '@/components/client-details/ClientFiles';
import ClientReports from '@/components/client-details/ClientReports';
import ClientMoodTracker from '@/components/client-details/ClientMoodTracker';
import ClientNotificationsTab, {
  buildClientNotifications,
} from '@/components/client-details/ClientNotificationsTab';
import ClientHeaderSummary from '@/components/client-details/ClientHeaderSummary';
import ClientDetailHeader from '@/components/client-details/ClientDetailHeader';
import ClientDetailTabs from '@/components/client-details/ClientDetailTabs';
import { useClientDetailData } from '@/components/client-details/useClientDetailData';
import { useAdminAuth } from '@/hooks/useAdminAuth';
import usePayments from '@/hooks/usePayments';
import { supabase } from '@/integrations/supabase/client';
import { EmptyState } from '@/components/shared/EmptyState';
import { DashboardSkeleton } from '@/components/shared/SkeletonCard';
import { LoadingSpinner } from '@/components/shared/LoadingSpinner';

const PARTNER_ALLOWED_TABS = ['profile', 'reports'];

const ClientDetailPage = () => {
  const { session } = useAdminAuth();
  const isPartner = session?.role === 'partner';
  const { isAdminContext } = useAdminContext();
  const { clientId } = useParams<{ clientId: string }>();
  const navigate = useNavigate();

  const {
    client,
    sessions,
    files,
    moods,
    setMoods,
    clients,
    isLoadingClients,
    appointments,
    isLoadingAppointments,
    appointmentsError,
    refetchAppointments,
    nextAppointment,
    realizedSessionsCount,
    isUploadingFiles,
    updateClientLocal,
    updateClientInDb,
    deleteClientInDb,
    handleUpdateSession,
    handleDeleteSession,
    handleUploadFiles,
    handleDeleteFile,
  } = useClientDetailData(clientId);

  const {
    payments,
    addPayment: addPaymentToDb,
    updatePayment: updatePaymentInDb,
    deletePayment: deletePaymentInDb,
  } = usePayments(clientId ? parseInt(clientId, 10) : undefined);

  const [activeTab, setActiveTab] = useState('profile');

  const handleTabChange = useCallback(
    (tab: string) => {
      if (isPartner && !PARTNER_ALLOWED_TABS.includes(tab)) return;
      setActiveTab(tab);
    },
    [isPartner]
  );

  const clientNotifications = useMemo(
    () =>
      buildClientNotifications({
        clientId,
        client,
        payments,
        realizedSessionsCount,
      }),
    [clientId, client, payments, realizedSessionsCount]
  );

  const tabs = useMemo(() => {
    const allTabs = [
      { id: 'profile', label: 'Perfil' },
      { id: 'sessions', label: 'Sessões' },
      { id: 'payments', label: 'Pagamentos' },
      { id: 'files', label: 'Ficheiros' },
      { id: 'reports', label: 'Relatórios' },
      { id: 'mood', label: 'Estado Emocional' },
      {
        id: 'notifications',
        label:
          clientNotifications.length > 0
            ? `Notificações (${clientNotifications.length})`
            : 'Notificações',
      },
    ];
    return isPartner ? allTabs.filter(t => PARTNER_ALLOWED_TABS.includes(t.id)) : allTabs;
  }, [clientNotifications.length, isPartner]);

  const backLink = isAdminContext ? '/admin/clients' : '/clients';

  const updateClient = async (data: Partial<ClientDetailData>) => {
    if (!client || !clientId) return;

    try {
      if (data.id && data.id !== client.id) {
        const { id, ...updateData } = data;
        if (!id) return;

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
          ...updateData,
        };

        const { error: insertError } = await supabase
          .from('clientes')
          .insert([newClientData]);

        if (insertError) {
          throw new Error(`Falha ao criar cliente com novo ID: ${insertError.message}`);
        }

        const { error: paymentsError } = await supabase
          .from('pagamentos')
          .update({ id_cliente: id })
          .eq('id_cliente', client.id);

        if (paymentsError) {
          toast.warning(`Falha ao atualizar referências de pagamentos: ${paymentsError.message}`);
        }

        const { error: appointmentsError } = await supabase
          .from('agendamentos')
          .update({ id_cliente: id })
          .eq('id_cliente', client.id);

        if (appointmentsError) {
          toast.warning(`Falha ao atualizar referências de agendamentos: ${appointmentsError.message}`);
        }

        const { error: moodError } = await supabase
          .from('humor_cliente')
          .update({ id_cliente: id })
          .eq('id_cliente', client.id);

        if (moodError) {
          toast.warning(`Falha ao atualizar registros de humor: ${moodError.message}`);
        }

        const { error: deleteError } = await supabase
          .from('clientes')
          .delete()
          .eq('id', client.id);

        if (deleteError) {
          throw new Error(`Falha ao excluir cliente com ID antigo: ${deleteError.message}`);
        }

        updateClientLocal(data);
        navigate(`/clients/${id}`);
        toast.success('ID do cliente e perfil atualizados com sucesso!');
      } else {
        const updateData: Partial<ClientDetailData> = { ...data };
        delete updateData.id;
        delete updateData.proxima_sessao;
        delete updateData.proxima_sessao_titulo;
        delete updateData.proxima_sessao_tipo;
        delete updateData.proxima_sessao_estado;

        const rawClient = clients.find(c => c.id?.toString() === clientId);
        const databaseKeys = rawClient ? Object.keys(rawClient) : [];

        const allowedColumns = [
          'nome', 'email', 'telefone', 'data_nascimento', 'genero', 'morada',
          'notas', 'estado', 'tipo_contato', 'como_conheceu', 'numero_sessoes',
          'total_pago', 'max_sessoes', 'responsavel', 'motivo', 'id_manual',
          'profissao', 'data_entrada_clinica', 'nif',
        ];

        const cleanUpdateData: Record<string, unknown> = {};
        Object.keys(updateData).forEach(key => {
          const isAllowed = allowedColumns.includes(key);
          const existsInDb = databaseKeys.length === 0 || databaseKeys.includes(key);
          if (isAllowed && existsInDb) {
            cleanUpdateData[key] = (updateData as Record<string, unknown>)[key];
          }
        });

        await updateClientInDb(parseInt(clientId, 10), cleanUpdateData as UpdateClient);

        updateClientLocal(data);
        toast.success('Perfil do cliente atualizado com sucesso!');
      }
    } catch (error) {
      toast.error(`Falha ao atualizar o perfil do cliente: ${(error as Error).message}`);
    }
  };

  const handleDeleteClient = async () => {
    if (!client || !clientId) return;

    try {
      await deleteClientInDb(parseInt(clientId, 10));
      toast.success('Cliente eliminado com sucesso!');
      navigate('/clients');
    } catch {
      toast.error('Falha ao eliminar o cliente.');
    }
  };

  const handleAddPayment = async (data: Omit<ClientPayment, 'id' | 'id_cliente' | 'criado_em' | 'updated_at'>) => {
    try {
      const newPayment = {
        id_cliente: parseInt(clientId as string, 10),
        data: data.data,
        valor: data.valor,
        descricao: data.descricao,
        tipo: data.tipo,
        nif: data.nif,
        tipo_servico: data.tipo_servico,
        numero_fatura: data.numero_fatura,
        valor_base: data.valor_base,
        valor_iva: data.valor_iva,
        retencao: data.retencao,
        estado: data.estado,
        criado_em: new Date().toISOString(),
      };

      await addPaymentToDb(newPayment);

      updateClient({
        total_pago: (client?.total_pago || 0) + data.valor,
      });
      toast.success('Pagamento adicionado com sucesso');
    } catch {
      toast.error('Erro ao adicionar pagamento');
    }
  };

  const editPayment = async (paymentId: number, data: Omit<ClientPayment, 'id' | 'id_cliente' | 'criado_em' | 'updated_at'>) => {
    try {
      const originalPayment = payments.find(p => p.id === paymentId);
      if (!originalPayment) return;

      const valueDifference = data.valor - originalPayment.valor;

      await updatePaymentInDb(paymentId, data);

      if (valueDifference !== 0) {
        updateClient({
          total_pago: (client?.total_pago || 0) + valueDifference,
        });
      }
    } catch {
      toast.error('Erro ao editar pagamento');
    }
  };

  const deletePayment = async (paymentId: number) => {
    try {
      const paymentToDelete = payments.find(p => p.id === paymentId);
      if (!paymentToDelete) return;

      await deletePaymentInDb(paymentId);

      updateClient({
        total_pago: Math.max(0, (client?.total_pago || 0) - paymentToDelete.valor),
      });
    } catch {
      toast.error('Erro ao eliminar pagamento');
    }
  };

  const handleAddMood = (mood: Omit<ClientMood, 'id' | 'clientId'>) => {
    if (!clientId) return;
    setMoods(prev => [{ ...mood, id: Date.now().toString(), clientId }, ...prev]);
    toast.success('Registo de humor adicionado com sucesso.');
  };

  const renderTabContent = () => {
    switch (activeTab) {
      case 'sessions':
        return (
          <ClientSessions
            sessions={sessions}
            clientId={clientId!}
            client={client!}
            appointments={appointments}
            isLoadingAppointments={isLoadingAppointments}
            appointmentsError={appointmentsError}
            onRefetchAppointments={refetchAppointments}
            onUpdateClient={updateClient}
            onUpdateSession={handleUpdateSession}
            onDeleteSession={handleDeleteSession}
            paidSessionsCount={realizedSessionsCount}
          />
        );
      case 'payments':
        return (
          <ClientPayments
            payments={payments as unknown as ClientPayment[]}
            clientId={clientId!}
            onAddPayment={handleAddPayment}
            onDeletePayment={deletePayment}
            onEditPayment={editPayment}
          />
        );
      case 'files':
        return (
          <ClientFiles
            files={files}
            isUploading={isUploadingFiles}
            onUploadFiles={handleUploadFiles}
            onDeleteFile={handleDeleteFile}
          />
        );
      case 'reports':
        return (
          <ClientReports
            client={client!}
            sessions={sessions}
            payments={payments as unknown as ClientPayment[]}
          />
        );
      case 'mood':
        return (
          <ClientMoodTracker
            clientId={clientId!}
            onSubmitMood={handleAddMood}
            moods={moods}
          />
        );
      case 'notifications':
        return (
          <ClientNotificationsTab
            notifications={clientNotifications}
            onGoToPayments={() => handleTabChange('payments')}
            onGoToSessions={() => handleTabChange('sessions')}
          />
        );
      default:
        return (
          <ClientProfile
            client={client!}
            onUpdateClient={updateClient}
            onDeleteClient={handleDeleteClient}
          />
        );
    }
  };

  if (isLoadingClients) {
    const loadingContent = (
      <div className="space-y-6">
        <DashboardSkeleton />
        <LoadingSpinner text="A carregar dados do cliente..." />
      </div>
    );

    return isAdminContext ? loadingContent : <PageLayout>{loadingContent}</PageLayout>;
  }

  if (!client) {
    const errorContent = (
      <EmptyState
        icon={<UserX className="h-10 w-10" />}
        title="Cliente não encontrado"
        description="O cliente que procura não existe ou foi removido."
        action={{
          label: 'Voltar para Clientes',
          onClick: () => navigate(backLink),
          icon: <ArrowLeft className="h-4 w-4" />,
          variant: 'outline',
        }}
      />
    );

    return isAdminContext ? errorContent : <PageLayout>{errorContent}</PageLayout>;
  }

  const pageContent = (
    <div className="space-y-6">
      <ClientDetailHeader
        client={client}
        isPartner={isPartner}
        backLink={backLink}
        notificationsCount={clientNotifications.length}
        onGoToNotifications={() => handleTabChange('notifications')}
        onGoToPayments={() => handleTabChange('payments')}
      />

      <ClientHeaderSummary
        client={client}
        realizedSessionsCount={realizedSessionsCount}
        payments={payments}
        isPartner={isPartner}
        nextAppointment={nextAppointment}
        onSchedule={() => navigate(`/calendar?client=${client.id}`)}
      />

      <ClientDetailTabs activeTab={activeTab} onTabChange={handleTabChange} tabs={tabs}>
        {renderTabContent()}
      </ClientDetailTabs>
    </div>
  );

  return isAdminContext ? pageContent : <PageLayout>{pageContent}</PageLayout>;
};

export default ClientDetailPage;
