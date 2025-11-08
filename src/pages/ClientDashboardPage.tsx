import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import { 
  User, 
  Calendar, 
  CreditCard, 
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
  Settings,
  Menu,
  X
} from 'lucide-react';
import { useClientAuth, useClientData, useClientMessages, useClientNotifications } from '@/hooks/useClientAuth';
import { toast } from 'sonner';
import { format, parseISO, isAfter, isBefore } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import ClientAppointments from '@/components/client-dashboard/ClientAppointments';
import ClientPayments from '@/components/client-dashboard/ClientPayments';
import ClientChat from '@/components/client-dashboard/ClientChat';
import ClientProfile from '@/components/client-dashboard/ClientProfile';
import ClientNotifications from '@/components/client-dashboard/ClientNotifications';
import { ClientAvailabilityManager } from '@/components/availability';
import { NotificationPanel } from '@/components/availability/NotificationPanel';

const ClientDashboardPage = () => {
  const { session, logout, isAuthenticated } = useClientAuth();
  const { clientData, loading: clientLoading } = useClientData();
  const { messages, unreadCount: unreadMessages = 0 } = useClientMessages();
  const { notifications, unreadCount: unreadNotifications = 0 } = useClientNotifications();
  const [activeTab, setActiveTab] = useState('overview');
  const [sidebarOpen, setSidebarOpen] = useState(false);
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
              {/* Mobile Menu Button */}
              <Button
                variant="ghost"
                size="sm"
                className="lg:hidden mr-2"
                onClick={() => setSidebarOpen(!sidebarOpen)}
              >
                {sidebarOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
              </Button>
              
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
      <main className="flex flex-1 overflow-hidden">
        {/* Mobile Overlay */}
        {sidebarOpen && (
          <div 
            className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
            onClick={() => setSidebarOpen(false)}
          />
        )}
        
        {/* Sidebar Navigation */}
        <div className={`w-64 bg-white border-r border-gray-200 flex flex-col fixed lg:relative inset-y-0 left-0 z-50 transform transition-transform duration-300 ease-in-out ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        }`}>
          <div className="p-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">Menu</h2>
          </div>
          
          <nav className="flex-1 p-4 space-y-2">
            <button
              onClick={() => {
                setActiveTab('overview');
                setSidebarOpen(false);
              }}
              className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-left transition-colors ${
                activeTab === 'overview'
                  ? 'bg-[#3f9094] text-white'
                  : 'text-gray-700 hover:bg-gray-100'
              }`}
            >
              <Activity className="h-5 w-5" />
              <span>Visão Geral</span>
            </button>
            
            <button
              onClick={() => {
                setActiveTab('profile');
                setSidebarOpen(false);
              }}
              className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-left transition-colors ${
                activeTab === 'profile'
                  ? 'bg-[#3f9094] text-white'
                  : 'text-gray-700 hover:bg-gray-100'
              }`}
            >
              <User className="h-5 w-5" />
              <span>Perfil</span>
            </button>
            
            <button
              onClick={() => {
                setActiveTab('appointments');
                setSidebarOpen(false);
              }}
              className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-left transition-colors ${
                activeTab === 'appointments'
                  ? 'bg-[#3f9094] text-white'
                  : 'text-gray-700 hover:bg-gray-100'
              }`}
            >
              <Calendar className="h-5 w-5" />
              <span>Agendamentos</span>
            </button>
            
            <button
              onClick={() => {
                setActiveTab('availability');
                setSidebarOpen(false);
              }}
              className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-left transition-colors ${
                activeTab === 'availability'
                  ? 'bg-[#3f9094] text-white'
                  : 'text-gray-700 hover:bg-gray-100'
              }`}
            >
              <Clock className="h-5 w-5" />
              <span>Minha Disponibilidade</span>
            </button>
            
            <button
              onClick={() => {
                setActiveTab('payments');
                setSidebarOpen(false);
              }}
              className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-left transition-colors ${
                activeTab === 'payments'
                  ? 'bg-[#3f9094] text-white'
                  : 'text-gray-700 hover:bg-gray-100'
              }`}
            >
              <CreditCard className="h-5 w-5" />
              <span>Pagamentos</span>
            </button>
            
            
            <button
              onClick={() => {
                setActiveTab('chat');
                setSidebarOpen(false);
              }}
              className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-left transition-colors ${
                activeTab === 'chat'
                  ? 'bg-[#3f9094] text-white'
                  : 'text-gray-700 hover:bg-gray-100'
              }`}
            >
              <MessageSquare className="h-5 w-5" />
              <span>Chat</span>
            </button>
          </nav>
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto">
          <div className="p-6">
          {/* Overview Tab */}
            {activeTab === 'overview' && (
              <div className="space-y-4 sm:space-y-6">
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
              </div>
            )}

          {/* Profile Tab */}
            {activeTab === 'profile' && (
            <ClientProfile clientData={clientData} />
            )}

          {/* Appointments Tab */}
            {activeTab === 'appointments' && (
            <ClientAppointments clientId={session.clientId} />
            )}

          {/* Payments Tab */}
            {activeTab === 'payments' && (
            <ClientPayments clientId={session.clientId} />
            )}


          {/* Chat Tab */}
            {activeTab === 'chat' && (
            <ClientChat clientId={session.clientId} />
            )}

            {/* Notifications Tab */}
            {activeTab === 'notifications' && (
            <ClientNotifications />
            )}

            {activeTab === 'availability' && clientData && (
              <div className="space-y-6">
                <ClientAvailabilityManager clienteId={clientData.id} />
                <NotificationPanel clienteId={clientData.id} />
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
};

export default ClientDashboardPage; 