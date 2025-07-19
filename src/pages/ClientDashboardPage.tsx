import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import { 
  User, 
  Calendar, 
  CreditCard, 
  FileText, 
  MessageSquare, 
  Bell, 
  LogOut,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  Phone,
  Mail,
  MapPin,
  CalendarDays,
  Euro,
  Activity,
  TrendingUp,
  Settings
} from 'lucide-react';
import { useClientAuth, useClientData, useClientMessages, useClientNotifications } from '@/hooks/useClientAuth';
import { toast } from 'sonner';
import { format, parseISO, isAfter, isBefore } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import ClientAppointments from '@/components/client-dashboard/ClientAppointments';
import ClientPayments from '@/components/client-dashboard/ClientPayments';
import ClientReports from '@/components/client-dashboard/ClientReports';
import ClientChat from '@/components/client-dashboard/ClientChat';
import ClientProfile from '@/components/client-dashboard/ClientProfile';
import ClientNotifications from '@/components/client-dashboard/ClientNotifications';

const ClientDashboardPage = () => {
  const { session, logout, isAuthenticated } = useClientAuth();
  const { clientData, loading: clientLoading } = useClientData();
  const { messages, unreadCount: unreadMessages = 0 } = useClientMessages();
  const { notifications, unreadCount: unreadNotifications = 0 } = useClientNotifications();
  const [activeTab, setActiveTab] = useState('overview');
  const navigate = useNavigate();

  // Redirecionar se não estiver autenticado
  useEffect(() => {
    if (!isAuthenticated && !clientLoading) {
      navigate('/client-login', { replace: true });
    }
  }, [isAuthenticated, clientLoading, navigate]);

  const handleLogout = () => {
    logout();
    toast.success('Logout realizado com sucesso');
    navigate('/client-login', { replace: true });
  };

  if (clientLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#3f9094] mx-auto mb-4"></div>
          <p className="text-gray-600">Carregando seu dashboard...</p>
        </div>
      </div>
    );
  }

  if (!session || !clientData) {
    return null;
  }

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Bom dia';
    if (hour < 18) return 'Boa tarde';
    return 'Boa noite';
  };

  return (
    <div className="min-h-screen bg-gray-50 touch-manipulation">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <img 
                src="/lovable-uploads/e18faaaf-ef2c-4678-98cf-d9e7b9fa5ea5.png" 
                alt="NeuroBalance Logo" 
                className="h-12 w-auto mr-2 sm:h-16 sm:mr-3 lg:h-24"
              />
              <div className="min-w-0 flex-1">
                <h1 className="text-lg font-semibold text-gray-900 truncate sm:text-xl">
                  {getGreeting()}, {clientData.nome.split(' ')[0]}
                </h1>
                <p className="text-xs text-gray-600 sm:text-sm">Portal do Cliente</p>
              </div>
            </div>

            <div className="flex items-center space-x-2 sm:space-x-4">
              {/* Notificações */}
              <Button
                variant="ghost"
                size="sm"
                className="relative p-2 h-9 w-9 sm:h-10 sm:w-10"
                onClick={() => setActiveTab('notifications')}
              >
                <Bell className="h-4 w-4 sm:h-5 sm:w-5" />
                {unreadNotifications > 0 && (
                  <Badge className="absolute -top-1 -right-1 h-4 w-4 rounded-full p-0 flex items-center justify-center bg-red-500 text-white text-xs sm:h-5 sm:w-5">
                    {unreadNotifications}
                  </Badge>
                )}
              </Button>

              {/* Mensagens */}
              <Button
                variant="ghost"
                size="sm"
                className="relative p-2 h-9 w-9 sm:h-10 sm:w-10"
                onClick={() => setActiveTab('chat')}
              >
                <MessageSquare className="h-4 w-4 sm:h-5 sm:w-5" />
                {unreadMessages > 0 && (
                  <Badge className="absolute -top-1 -right-1 h-4 w-4 rounded-full p-0 flex items-center justify-center bg-red-500 text-white text-xs sm:h-5 sm:w-5">
                    {unreadMessages}
                  </Badge>
                )}
              </Button>

              {/* Avatar e Logout */}
              <div className="flex items-center space-x-1 sm:space-x-2">
                <Avatar className="h-7 w-7 sm:h-8 sm:w-8">
                  <AvatarFallback className="bg-[#3f9094] text-white text-xs sm:text-sm">
                    {getInitials(clientData.nome)}
                  </AvatarFallback>
                </Avatar>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleLogout}
                  className="text-gray-600 hover:text-gray-900 p-2 h-9 w-9 sm:h-10 sm:w-10"
                >
                  <LogOut className="h-4 w-4 sm:h-5 sm:w-5" />
                </Button>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-8 py-4 sm:py-8">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4 sm:space-y-6">
          {/* Navigation Tabs */}
          <TabsList className="grid w-full grid-cols-6 bg-white rounded-lg shadow-sm overflow-x-auto">
            <TabsTrigger value="overview" className="flex flex-col items-center gap-1 p-2 sm:p-3 text-xs sm:text-sm">
              <Activity className="h-4 w-4 sm:h-5 sm:w-5" />
              <span className="hidden xs:inline">Visão Geral</span>
            </TabsTrigger>
            <TabsTrigger value="profile" className="flex flex-col items-center gap-1 p-2 sm:p-3 text-xs sm:text-sm">
              <User className="h-4 w-4 sm:h-5 sm:w-5" />
              <span className="hidden xs:inline">Perfil</span>
            </TabsTrigger>
            <TabsTrigger value="appointments" className="flex flex-col items-center gap-1 p-2 sm:p-3 text-xs sm:text-sm">
              <Calendar className="h-4 w-4 sm:h-5 sm:w-5" />
              <span className="hidden xs:inline">Agendamentos</span>
            </TabsTrigger>
            <TabsTrigger value="payments" className="flex flex-col items-center gap-1 p-2 sm:p-3 text-xs sm:text-sm">
              <CreditCard className="h-4 w-4 sm:h-5 sm:w-5" />
              <span className="hidden xs:inline">Pagamentos</span>
            </TabsTrigger>
            <TabsTrigger value="reports" className="flex flex-col items-center gap-1 p-2 sm:p-3 text-xs sm:text-sm">
              <FileText className="h-4 w-4 sm:h-5 sm:w-5" />
              <span className="hidden xs:inline">Relatórios</span>
            </TabsTrigger>
            <TabsTrigger value="chat" className="flex flex-col items-center gap-1 p-2 sm:p-3 text-xs sm:text-sm">
              <MessageSquare className="h-4 w-4 sm:h-5 sm:w-5" />
              <span className="hidden xs:inline">Chat</span>
            </TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-4 sm:space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-6">
              {/* Estatísticas Rápidas */}
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Sessões Realizadas</CardTitle>
                  <CheckCircle className="h-4 w-4 text-green-600" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-gray-900">
                    {clientData.numero_sessoes || 0}
                  </div>
                  <p className="text-xs text-gray-600">
                    de {clientData.max_sessoes || 0} planejadas
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Pago</CardTitle>
                  <Euro className="h-4 w-4 text-green-600" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-gray-900">
                    €{clientData.total_pago || 0}
                  </div>
                  <p className="text-xs text-gray-600">
                    Valor total investido
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Próxima Sessão</CardTitle>
                  <Clock className="h-4 w-4 text-blue-600" />
                </CardHeader>
                <CardContent>
                  <div className="text-sm font-medium text-gray-900">
                    {clientData.proxima_sessao ? 
                      format(parseISO(clientData.proxima_sessao), 'dd/MM/yyyy', { locale: ptBR }) :
                      'Não agendada'
                    }
                  </div>
                  <p className="text-xs text-gray-600">
                    {clientData.proxima_sessao ? 
                      format(parseISO(clientData.proxima_sessao), 'HH:mm', { locale: ptBR }) :
                      'Contacte a clínica'
                    }
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Progresso</CardTitle>
                  <TrendingUp className="h-4 w-4 text-purple-600" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-gray-900">
                    {clientData.max_sessoes > 0 ? 
                      Math.round((clientData.numero_sessoes / clientData.max_sessoes) * 100) : 0
                    }%
                  </div>
                  <p className="text-xs text-gray-600">
                    Do tratamento concluído
                  </p>
                </CardContent>
              </Card>
            </div>

            {/* Resumo Rápido */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Calendar className="h-5 w-5" />
                    Próximos Agendamentos
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {/* Aqui seria carregado dos agendamentos reais */}
                    <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
                      <div>
                        <p className="font-medium">Sessão de Neurofeedback</p>
                        <p className="text-sm text-gray-600">15/01/2025 às 14:30</p>
                      </div>
                      <Badge variant="outline" className="text-blue-600 border-blue-600">
                        Confirmado
                      </Badge>
                    </div>
                    <Button 
                      variant="outline" 
                      className="w-full"
                      onClick={() => setActiveTab('appointments')}
                    >
                      Ver Todos os Agendamentos
                    </Button>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Bell className="h-5 w-5" />
                    Notificações Recentes
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {notifications.slice(0, 3).map((notification) => (
                      <div key={notification.id} className="flex items-start space-x-3">
                        <div className="flex-shrink-0">
                          <div className="w-2 h-2 bg-blue-500 rounded-full mt-2"></div>
                        </div>
                        <div className="flex-1">
                          <p className="text-sm font-medium">{notification.title}</p>
                          <p className="text-xs text-gray-600">{notification.message}</p>
                          <p className="text-xs text-gray-500 mt-1">
                            {format(parseISO(notification.created_at), 'dd/MM/yyyy HH:mm', { locale: ptBR })}
                          </p>
                        </div>
                      </div>
                    ))}
                    <Button 
                      variant="outline" 
                      className="w-full"
                      onClick={() => setActiveTab('notifications')}
                    >
                      Ver Todas as Notificações
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Profile Tab */}
          <TabsContent value="profile">
            <ClientProfile clientData={clientData} />
          </TabsContent>

          {/* Appointments Tab */}
          <TabsContent value="appointments">
            <ClientAppointments clientId={session.clientId} />
          </TabsContent>

          {/* Payments Tab */}
          <TabsContent value="payments">
            <ClientPayments clientId={session.clientId} />
          </TabsContent>

          {/* Reports Tab */}
          <TabsContent value="reports">
            <ClientReports clientId={session.clientId} />
          </TabsContent>

          {/* Chat Tab */}
          <TabsContent value="chat">
            <ClientChat clientId={session.clientId} />
          </TabsContent>

          {/* Notifications Tab - Hidden but accessible */}
          <TabsContent value="notifications">
            <ClientNotifications />
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
};

export default ClientDashboardPage; 