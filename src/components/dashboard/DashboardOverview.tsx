import React, { useEffect, useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Calendar, User, BarChart3, Plus, DollarSign } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Link, useNavigate } from 'react-router-dom';
import UpcomingAppointmentsTable from '@/components/dashboard/UpcomingAppointmentsTable';
import useClients from '@/hooks/useClients';
import useAppointments from '@/hooks/useAppointments';
import usePayments from '@/hooks/usePayments';
import { useExpenses } from '@/hooks/useExpenses';
import { format, isToday, parseISO, isFuture } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { ResponsiveContainer, BarChart, CartesianGrid, XAxis, YAxis, Tooltip, Legend, Bar } from 'recharts';
import { Database } from '@/integrations/supabase/types';

// Definição do tipo do cliente
type Client = Database['public']['Tables']['clientes']['Row'];

// Movendo a função para fora dos componentes para que possa ser usada em qualquer lugar
const getClientSessionsAndPayments = (clientId: number, appointments: any[], payments: any[]) => {
  const clientAppointments = appointments.filter(apt => apt.id_cliente === clientId);
  const clientPayments = payments.filter(payment => payment.id_cliente === clientId);
  
  const sessionCount = clientAppointments.length;
  const totalPaid = clientPayments.reduce((total, payment) => total + (payment.valor || 0), 0);
  
  return { sessionCount, totalPaid };
};

const RecentClientsTable = ({ clients, appointments, payments }: { clients: Client[], appointments: any[], payments: any[] }) => {
  const navigate = useNavigate();
  
  return (
    <div className="space-y-2">
      {clients.map(client => {
        const { sessionCount, totalPaid } = getClientSessionsAndPayments(client.id, appointments, payments);
        return (
          <div 
            key={client.id} 
            className="flex items-center justify-between p-3 bg-[#E6ECEA]/50 rounded-lg cursor-pointer hover:bg-[#E6ECEA]/80"
            onClick={() => navigate(`/clients/${client.id}`)}
          >
            <div>
              <p className="font-medium">{client.nome}</p>
              <p className="text-sm text-gray-600">{client.email || 'Sem email'}</p>
            </div>
            <div className="text-right">
              <p className="text-sm font-medium">{sessionCount} sessões</p>
              <p className="text-xs text-gray-500">€{totalPaid.toLocaleString()}</p>
            </div>
          </div>
        );
      })}
      {clients.length > 3 && (
        <Link 
          to="/clients" 
          className="text-[#3A726D] hover:text-[#2A5854] text-sm flex justify-center mt-2"
        >
          Ver todos os clientes
        </Link>
      )}
    </div>
  );
};

const DashboardOverview = () => {
  const navigate = useNavigate();
  const { clients, isLoading: isClientsLoading } = useClients();
  const { appointments, isLoading: isAppointmentsLoading } = useAppointments();
  const { payments, isLoading: isPaymentsLoading, getTotalRevenue } = usePayments();
  const { expenses, isLoading: isExpensesLoading, getTotalExpenses } = useExpenses();
  
  const [todayAppointments, setTodayAppointments] = useState<any[]>([]);
  const [upcomingAppointments, setUpcomingAppointments] = useState<any[]>([]);
  const [completedSessions, setCompletedSessions] = useState<number>(0);
  const [totalSessions, setTotalSessions] = useState<number>(0);
  const [recentClients, setRecentClients] = useState<any[]>([]);
  
  useEffect(() => {
    if (!isAppointmentsLoading && appointments) {
      // Filtra agendamentos de hoje
      const today = new Date();
      
      const todaysAppts = appointments.filter(appointment => {
        const appointmentDate = parseISO(appointment.data);
        return isToday(appointmentDate);
      }).sort((a, b) => new Date(a.data).getTime() - new Date(b.data).getTime());
      
      // Filtra agendamentos futuros
      const futureAppts = appointments.filter(appointment => {
        const appointmentDate = parseISO(appointment.data);
        return isFuture(appointmentDate);
      }).sort((a, b) => new Date(a.data).getTime() - new Date(b.data).getTime());
      
      // Conta sessões completadas (passadas)
      const completed = appointments.filter(appointment => {
        const appointmentDate = parseISO(appointment.data);
        return appointmentDate < today && appointment.estado === 'realizado';
      }).length;

      // Conta total de sessões (incluindo futuras)
      const total = appointments.length;
      
      setTodayAppointments(todaysAppts);
      setUpcomingAppointments(futureAppts.slice(0, 4)); // Próximos 4 agendamentos
      setCompletedSessions(completed);
      setTotalSessions(total);
    }
  }, [appointments, isAppointmentsLoading]);
  
  useEffect(() => {
    if (!isClientsLoading && clients) {
      // Organiza clientes por data de criação (mais recentes primeiro)
      const sortedClients = [...clients]
        .sort((a, b) => {
          const dateA = a.criado_em ? new Date(a.criado_em).getTime() : 0;
          const dateB = b.criado_em ? new Date(b.criado_em).getTime() : 0;
          return dateB - dateA;
        })
        .slice(0, 3); // Pega os 3 mais recentes
        
      setRecentClients(sortedClients);
    }
  }, [clients, isClientsLoading]);
    
  // Formata agendamentos para o componente UpcomingAppointmentsTable
  const formatAppointmentsForTable = (appointments) => {
    return appointments.map(appointment => ({
      id: appointment.id.toString(),
      title: appointment.titulo,
      date: appointment.data,
      clientName: appointment.clientes?.nome || 'Cliente não definido',
      clientId: appointment.id_cliente.toString(),
      type: appointment.tipo,
      confirmed: appointment.estado === 'confirmado' || appointment.estado === 'realizado'
    }));
  };
  
  const totalRevenue = !isPaymentsLoading ? getTotalRevenue() : 0;
  const totalExpenses = !isExpensesLoading ? getTotalExpenses() : 0;
  const totalProfit = totalRevenue - totalExpenses;
  
  // Preparar dados para gráfico de receita mensal
  const monthlyRevenue = useMemo(() => {
    const months: Record<string, number> = {};
    const monthNames = [
      'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
      'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
    ];
    
    // Inicializar os últimos 6 meses com zero
    const today = new Date();
    for (let i = 5; i >= 0; i--) {
      const month = new Date(today.getFullYear(), today.getMonth() - i, 1);
      const monthName = monthNames[month.getMonth()];
      months[monthName] = 0;
    }
    
    // Preencher com dados reais
    payments.forEach(payment => {
      try {
        // Verificar se payment.data existe antes de usar parseISO e split
        if (payment.data) {
          const paymentDate = parseISO(payment.data);
          const monthName = monthNames[paymentDate.getMonth()];
          
          // Só incluir pagamentos dos últimos 6 meses
          const sixMonthsAgo = new Date();
          sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
          
          if (paymentDate >= sixMonthsAgo && months[monthName] !== undefined) {
            months[monthName] += payment.valor;
          }
        }
      } catch (error) {
        console.error('Erro ao processar data do pagamento:', error);
      }
    });
    
    // Converter para formato adequado para Recharts
    return Object.entries(months).map(([month, value]) => ({
      month,
      value
    }));
  }, [payments]);
  
  // Se estiver carregando, mostre um indicador
  if (isClientsLoading || isAppointmentsLoading || isPaymentsLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-lg">Carregando dados...</p>
      </div>
    );
  }
  
  // If no clients exist, show welcome screen
  if (clients.length === 0) {
    return (
      <div className="space-y-6">
        <div className="flex flex-col items-center justify-center p-12 bg-white rounded-xl shadow-md text-center">
          <h2 className="text-2xl font-bold text-[#3A726D] mb-4">Bem-vindo ao NeuroBalance CMS</h2>
          <p className="text-gray-600 max-w-md mb-8">
            Este é o seu sistema de gestão de clientes. Comece adicionando o seu primeiro cliente para
            visualizar estatísticas e agendamentos.
          </p>
          <div className="flex gap-4">
            <Button 
              asChild
              className="bg-[#3A726D] hover:bg-[#2A5854]"
            >
              <Link to="/clients">
                <Plus className="h-4 w-4 mr-2" />
                Adicionar Cliente
              </Link>
            </Button>
            <Button 
              asChild
              variant="outline" 
            >
              <Link to="/calendar">
                <Calendar className="h-4 w-4 mr-2" />
                Ver Calendário
              </Link>
            </Button>
          </div>
        </div>
      </div>
    );
  }
  
  // If clients exist, show regular dashboard
  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
        <Card 
          className="dashboard-card hover:shadow-lg hover:translate-y-[-2px] transition-all cursor-pointer"
          onClick={() => navigate('/clients')}
        >
          <CardHeader className="flex flex-row items-center justify-between pb-2 px-4 pt-4">
            <CardTitle className="text-sm font-medium">Total Clientes</CardTitle>
            <User className="h-5 w-5 text-[#3A726D]" />
          </CardHeader>
          <CardContent className="px-4 pb-4">
            <div className="flex items-baseline flex-wrap">
              <p className="text-xl sm:text-2xl font-bold">{clients.length}</p>
              <p className="text-xs text-green-600 ml-2">↑ this month</p>
            </div>
          </CardContent>
        </Card>
        
        <Card 
          className="dashboard-card hover:shadow-lg hover:translate-y-[-2px] transition-all cursor-pointer"
          onClick={() => navigate('/calendar')}
        >
          <CardHeader className="flex flex-row items-center justify-between pb-2 px-4 pt-4">
            <CardTitle className="text-sm font-medium">Total Sessões</CardTitle>
            <Calendar className="h-5 w-5 text-[#3A726D]" />
          </CardHeader>
          <CardContent className="px-4 pb-4">
            <div className="flex items-baseline flex-wrap">
              <p className="text-xl sm:text-2xl font-bold">{totalSessions}</p>
              <p className="text-xs text-green-600 ml-2">↑ this month</p>
            </div>
            <p className="text-xs text-gray-500 mt-1">{completedSessions} sessões realizadas</p>
          </CardContent>
        </Card>
        
        <Card 
          className="dashboard-card hover:shadow-lg hover:translate-y-[-2px] transition-all cursor-pointer"
          onClick={() => navigate('/finances')}
        >
          <CardHeader className="flex flex-row items-center justify-between pb-2 px-4 pt-4">
            <CardTitle className="text-sm font-medium">Receita Total</CardTitle>
            <BarChart3 className="h-5 w-5 text-[#3A726D]" />
          </CardHeader>
          <CardContent className="px-4 pb-4">
            <div className="flex items-baseline flex-wrap">
              <p className="text-xl sm:text-2xl font-bold">€{totalRevenue.toLocaleString()}</p>
              <p className="text-xs text-green-600 ml-2">↑ this month</p>
            </div>
            <p className="text-xs text-gray-500 mt-1">Média de €{(totalRevenue / (completedSessions || 1)).toFixed(2)} por sessão</p>
          </CardContent>
        </Card>

        <Card 
          className="dashboard-card hover:shadow-lg hover:translate-y-[-2px] transition-all cursor-pointer"
          onClick={() => navigate('/finances')}
        >
          <CardHeader className="flex flex-row items-center justify-between pb-2 px-4 pt-4">
            <CardTitle className="text-sm font-medium">Lucro Total</CardTitle>
            <DollarSign className="h-5 w-5 text-[#3A726D]" />
          </CardHeader>
          <CardContent className="px-4 pb-4">
            <div className="flex items-baseline flex-wrap">
              <p className="text-xl sm:text-2xl font-bold">€{totalProfit.toLocaleString()}</p>
              <p className={`text-xs ${totalProfit >= 0 ? 'text-green-600' : 'text-red-600'} ml-2`}>
                {totalProfit >= 0 ? '↑' : '↓'} this month
              </p>
            </div>
            <p className="text-xs text-gray-500 mt-1">
              Receita: €{totalRevenue.toLocaleString()} | Despesas: €{totalExpenses.toLocaleString()}
            </p>
          </CardContent>
        </Card>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
        <Card className="dashboard-card">
          <CardHeader className="px-4 pt-4 pb-2">
            <CardTitle className="flex items-center gap-2 text-base">
              <Calendar className="h-5 w-5" />
              <span>Agendamentos de Hoje</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="px-4 pb-4">
            {todayAppointments.length > 0 ? (
              <div className="overflow-x-auto -mx-4 px-4 pb-1">
                <UpcomingAppointmentsTable appointments={formatAppointmentsForTable(todayAppointments)} />
              </div>
            ) : (
              <div className="py-8 text-center">
                <p className="text-gray-500">Sem agendamentos para hoje</p>
                <Link 
                  to="/calendar" 
                  className="text-[#3A726D] hover:text-[#2A5854] text-sm mt-2 inline-block"
                >
                  Ir para o calendário
                </Link>
              </div>
            )}
          </CardContent>
        </Card>
        
        <Card className="dashboard-card">
          <CardHeader className="px-4 pt-4 pb-2">
            <CardTitle className="flex items-center gap-2 text-base">
              <User className="h-5 w-5" />
              <span>Clientes Recentes</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="px-4 pb-4">
            {recentClients.length > 0 ? (
              <div className="overflow-x-auto -mx-4 px-4 pb-1">
                <RecentClientsTable clients={recentClients} appointments={appointments} payments={payments} />
              </div>
            ) : (
              <div className="py-8 text-center">
                <p className="text-gray-500">Sem clientes recentes</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
      
      <div className="grid grid-cols-1 gap-4 sm:gap-6">
        <Card className="dashboard-card">
          <CardHeader className="px-4 pt-4 pb-2">
            <CardTitle className="flex items-center gap-2 text-base">
              <BarChart3 className="h-5 w-5" />
              <span>Resumo Financeiro</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="px-4 pb-4">
            <div className="h-[250px] sm:h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={monthlyRevenue} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
                  <XAxis 
                    dataKey="month" 
                    tickFormatter={(value) => value.substring(0, 3)}
                    fontSize={12} 
                  />
                  <YAxis 
                    tickFormatter={(value) => `€${value}`}
                    width={50}
                    fontSize={12}
                  />
                  <Tooltip 
                    formatter={(value: any) => [`€${value}`, 'Receita']}
                    labelFormatter={(label: string) => `Mês: ${label}`}
                  />
                  <Legend wrapperStyle={{ fontSize: '12px' }} />
                  <Bar dataKey="value" name="Receita Mensal" fill="#3f9094" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default DashboardOverview;
