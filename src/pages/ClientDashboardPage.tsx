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
  X,
  Sparkles,
  ArrowRight
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
import { ClientAvailabilityManager, ClientAvailabilityCalendar } from '@/components/availability';
import { NotificationPanel } from '@/components/availability/NotificationPanel';
import { cn } from '@/lib/utils';

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
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-teal-50/30 to-cyan-50/20">
        <div className="h-16 bg-white/80 backdrop-blur-md border-b border-gray-100 animate-pulse" />
        <div className="max-w-7xl mx-auto p-6 space-y-6">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-teal-100 to-cyan-100 animate-pulse" />
            <div className="space-y-2">
              <div className="h-6 w-48 bg-gray-200 rounded-lg animate-pulse" />
              <div className="h-4 w-32 bg-gray-100 rounded-lg animate-pulse" />
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-32 bg-white rounded-2xl border border-gray-100 animate-pulse" />
            ))}
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {[1, 2].map((i) => (
              <div key={i} className="h-64 bg-white rounded-2xl border border-gray-100 animate-pulse" />
            ))}
          </div>
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
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-teal-50/30 to-cyan-50/20 touch-manipulation">
      {/* Header com Glassmorphism */}
      <header className="sticky top-0 z-40 bg-white/80 backdrop-blur-xl border-b border-gray-100/50 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-3">
              {/* Mobile Menu Button */}
              <Button
                variant="ghost"
                size="sm"
                className="lg:hidden p-2 hover:bg-teal-50 rounded-xl transition-all"
                onClick={() => setSidebarOpen(!sidebarOpen)}
              >
                <div className="relative w-5 h-5">
                  <span className={cn(
                    "absolute left-0 block w-5 h-0.5 bg-gray-600 transition-all duration-300",
                    sidebarOpen ? "top-2 rotate-45" : "top-1"
                  )} />
                  <span className={cn(
                    "absolute left-0 top-2 block w-5 h-0.5 bg-gray-600 transition-all duration-300",
                    sidebarOpen && "opacity-0"
                  )} />
                  <span className={cn(
                    "absolute left-0 block w-5 h-0.5 bg-gray-600 transition-all duration-300",
                    sidebarOpen ? "top-2 -rotate-45" : "top-3"
                  )} />
                </div>
              </Button>
              
              <img 
                src="/lovable-uploads/e18faaaf-ef2c-4678-98cf-d9e7b9fa5ea5.png" 
                alt="NeuroBalance Logo" 
                className="h-24 w-auto sm:h-28 lg:h-32 transition-transform hover:scale-105"
              />
              <div className="min-w-0 flex-1 hidden sm:block">
                <h1 className="text-lg font-bold bg-gradient-to-r from-gray-900 via-teal-800 to-teal-600 bg-clip-text text-transparent whitespace-nowrap">
                  {getGreeting()}, {clientData.nome.split(' ')[0]}! ✨
                </h1>
                <p className="text-xs text-gray-500 font-medium">Bem-vindo ao seu portal pessoal</p>
              </div>
            </div>

            <div className="flex items-center gap-1 sm:gap-2">
              {/* Notificações */}
              <Button
                variant="ghost"
                size="sm"
                className={cn(
                  "relative p-2 h-10 w-10 rounded-xl transition-all duration-200",
                  activeTab === 'notifications' 
                    ? "bg-teal-100 text-teal-700" 
                    : "hover:bg-gray-100 text-gray-600"
                )}
                onClick={() => setActiveTab('notifications')}
              >
                <Bell className="h-5 w-5" />
                {unreadNotifications > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 h-5 w-5 rounded-full bg-gradient-to-r from-rose-500 to-pink-500 text-white text-[10px] font-bold flex items-center justify-center animate-pulse shadow-lg">
                    {unreadNotifications > 9 ? '9+' : unreadNotifications}
                  </span>
                )}
              </Button>

              {/* Mensagens */}
              <Button
                variant="ghost"
                size="sm"
                className={cn(
                  "relative p-2 h-10 w-10 rounded-xl transition-all duration-200",
                  activeTab === 'chat' 
                    ? "bg-teal-100 text-teal-700" 
                    : "hover:bg-gray-100 text-gray-600"
                )}
                onClick={() => setActiveTab('chat')}
              >
                <MessageSquare className="h-5 w-5" />
                {unreadMessages > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 h-5 w-5 rounded-full bg-gradient-to-r from-rose-500 to-pink-500 text-white text-[10px] font-bold flex items-center justify-center animate-pulse shadow-lg">
                    {unreadMessages > 9 ? '9+' : unreadMessages}
                  </span>
                )}
              </Button>

              {/* Separador */}
              <div className="hidden sm:block h-8 w-px bg-gray-200 mx-1" />

              {/* Avatar e Logout */}
              <div className="flex items-center gap-2">
                <div className="relative group">
                  <div className="absolute -inset-0.5 bg-gradient-to-r from-teal-400 to-cyan-400 rounded-full opacity-0 group-hover:opacity-100 blur transition-opacity" />
                  <Avatar className="relative h-9 w-9 ring-2 ring-white shadow-md">
                    <AvatarFallback className="bg-gradient-to-br from-teal-500 to-cyan-600 text-white text-sm font-bold">
                      {getInitials(clientData.nome)}
                    </AvatarFallback>
                  </Avatar>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleLogout}
                  className="text-gray-500 hover:text-rose-600 hover:bg-rose-50 p-2 h-10 w-10 rounded-xl transition-all"
                >
                  <LogOut className="h-5 w-5" />
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
        
        {/* Sidebar Navigation - Moderna */}
        <div className={cn(
          "w-72 bg-white/95 backdrop-blur-xl border-r border-gray-100/50 flex flex-col fixed lg:relative inset-y-0 left-0 z-50 shadow-2xl lg:shadow-none",
          "transform transition-all duration-500 ease-out",
          sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        )}>
          {/* Header da Sidebar com Logo */}
          <div className="p-5 border-b border-gray-100">
            <div className="flex items-center gap-3">
              <img 
                src="/lovable-uploads/e18faaaf-ef2c-4678-98cf-d9e7b9fa5ea5.png" 
                alt="NeuroBalance Logo" 
                className="h-28 w-auto"
              />
              <div>
                <h2 className="text-lg font-bold text-gray-900">Menu</h2>
                <p className="text-xs text-gray-500">Navegação rápida</p>
              </div>
            </div>
          </div>
          
          <nav className="flex-1 p-4 space-y-1.5 overflow-y-auto">
            {[
              { id: 'overview', icon: Activity, label: 'Visão Geral', bgColor: 'bg-violet-100', iconColor: 'text-violet-600' },
              { id: 'profile', icon: User, label: 'Perfil', bgColor: 'bg-blue-100', iconColor: 'text-blue-600' },
              { id: 'appointments', icon: Calendar, label: 'Agendamentos', bgColor: 'bg-emerald-100', iconColor: 'text-emerald-600' },
              { id: 'availability', icon: Clock, label: 'Minha Disponibilidade', bgColor: 'bg-amber-100', iconColor: 'text-amber-600' },
              { id: 'payments', icon: CreditCard, label: 'Pagamentos', bgColor: 'bg-rose-100', iconColor: 'text-rose-600' },
              { id: 'chat', icon: MessageSquare, label: 'Chat', bgColor: 'bg-indigo-100', iconColor: 'text-indigo-600', badge: unreadMessages },
            ].map((item) => (
              <button
                key={item.id}
                onClick={() => {
                  setActiveTab(item.id);
                  setSidebarOpen(false);
                }}
                className={cn(
                  "w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left transition-all duration-200 group",
                  activeTab === item.id
                    ? "bg-gradient-to-r from-teal-500 to-cyan-600 text-white shadow-lg shadow-teal-500/30"
                    : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                )}
              >
                <div className={cn(
                  "w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 transition-all",
                  activeTab === item.id 
                    ? "bg-white/20" 
                    : item.bgColor
                )}>
                  <item.icon className={cn(
                    "h-5 w-5 transition-transform group-hover:scale-110",
                    activeTab === item.id ? "text-white" : item.iconColor
                  )} />
                </div>
                <span className="font-medium flex-1">{item.label}</span>
                {item.badge && item.badge > 0 && (
                  <span className={cn(
                    "ml-auto px-2 py-0.5 text-xs font-bold rounded-full",
                    activeTab === item.id 
                      ? "bg-white/30 text-white" 
                      : "bg-rose-100 text-rose-600"
                  )}>
                    {item.badge}
                  </span>
                )}
                {activeTab === item.id && (
                  <ArrowRight className="ml-auto h-4 w-4 text-white/70" />
                )}
              </button>
            ))}
          </nav>

          {/* Footer da Sidebar */}
          <div className="p-4 border-t border-gray-100">
            <div className="p-4 rounded-xl bg-gradient-to-br from-teal-50 to-cyan-50 border border-teal-100">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-teal-500 to-cyan-600 flex items-center justify-center">
                  <TrendingUp className="h-4 w-4 text-white" />
                </div>
                <span className="text-sm font-semibold text-gray-800">Progresso</span>
              </div>
              <div className="relative h-2 bg-gray-200 rounded-full overflow-hidden">
                <div 
                  className="absolute inset-y-0 left-0 bg-gradient-to-r from-teal-500 to-cyan-500 rounded-full transition-all duration-1000"
                  style={{ width: `${clientData.max_sessoes > 0 ? (clientData.numero_sessoes / clientData.max_sessoes) * 100 : 0}%` }}
                />
              </div>
              <p className="text-xs text-gray-500 mt-2">
                {clientData.numero_sessoes} de {clientData.max_sessoes} sessões
              </p>
            </div>
          </div>
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto">
          <div className="p-6">
          {/* Overview Tab */}
            {activeTab === 'overview' && (
              <div className="space-y-6">
                {/* Saudação Mobile */}
                <div className="sm:hidden">
                  <h1 className="text-xl font-bold text-gray-900">
                    {getGreeting()}, {clientData.nome.split(' ')[0]}! ✨
                  </h1>
                  <p className="text-sm text-gray-500">Aqui está o resumo do seu progresso</p>
                </div>

                {/* Estatísticas - Design Moderno */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
                  {/* Card Sessões */}
                  <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 p-4 sm:p-5 text-white shadow-lg shadow-emerald-500/30 group hover:shadow-xl hover:shadow-emerald-500/40 transition-all duration-300 hover:-translate-y-1">
                    <div className="absolute top-0 right-0 w-20 h-20 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2" />
                    <div className="relative">
                      <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-white/20 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                        <CheckCircle className="h-5 w-5 sm:h-6 sm:w-6 text-white" />
                      </div>
                      <p className="text-xs sm:text-sm text-white/80 font-medium mb-1">Sessões</p>
                      <p className="text-2xl sm:text-3xl font-bold">{clientData.numero_sessoes || 0}</p>
                      <p className="text-xs text-white/60 mt-1">de {clientData.max_sessoes || 0} planejadas</p>
                    </div>
                  </div>

                  {/* Card Pagamentos */}
                  <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-violet-500 to-purple-600 p-4 sm:p-5 text-white shadow-lg shadow-violet-500/30 group hover:shadow-xl hover:shadow-violet-500/40 transition-all duration-300 hover:-translate-y-1">
                    <div className="absolute top-0 right-0 w-20 h-20 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2" />
                    <div className="relative">
                      <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-white/20 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                        <Euro className="h-5 w-5 sm:h-6 sm:w-6 text-white" />
                      </div>
                      <p className="text-xs sm:text-sm text-white/80 font-medium mb-1">Total Pago</p>
                      <p className="text-2xl sm:text-3xl font-bold">€{clientData.total_pago || 0}</p>
                      <p className="text-xs text-white/60 mt-1">Valor investido</p>
                    </div>
                  </div>

                  {/* Card Próxima Sessão */}
                  <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-blue-500 to-cyan-600 p-4 sm:p-5 text-white shadow-lg shadow-blue-500/30 group hover:shadow-xl hover:shadow-blue-500/40 transition-all duration-300 hover:-translate-y-1">
                    <div className="absolute top-0 right-0 w-20 h-20 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2" />
                    <div className="relative">
                      <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-white/20 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                        <CalendarDays className="h-5 w-5 sm:h-6 sm:w-6 text-white" />
                      </div>
                      <p className="text-xs sm:text-sm text-white/80 font-medium mb-1">Próxima Sessão</p>
                      <p className="text-lg sm:text-xl font-bold">
                        {clientData.proxima_sessao 
                          ? format(parseISO(clientData.proxima_sessao), 'dd MMM', { locale: ptBR })
                          : 'Agendar'}
                      </p>
                      <p className="text-xs text-white/60 mt-1">
                        {clientData.proxima_sessao 
                          ? format(parseISO(clientData.proxima_sessao), 'HH:mm', { locale: ptBR })
                          : 'Sem agendamento'}
                      </p>
                    </div>
                  </div>

                  {/* Card Progresso */}
                  <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-amber-500 to-orange-600 p-4 sm:p-5 text-white shadow-lg shadow-amber-500/30 group hover:shadow-xl hover:shadow-amber-500/40 transition-all duration-300 hover:-translate-y-1">
                    <div className="absolute top-0 right-0 w-20 h-20 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2" />
                    <div className="relative">
                      <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-white/20 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                        <TrendingUp className="h-5 w-5 sm:h-6 sm:w-6 text-white" />
                      </div>
                      <p className="text-xs sm:text-sm text-white/80 font-medium mb-1">Progresso</p>
                      <p className="text-2xl sm:text-3xl font-bold">
                        {clientData.max_sessoes > 0 
                          ? Math.round((clientData.numero_sessoes / clientData.max_sessoes) * 100) 
                          : 0}%
                      </p>
                      <div className="mt-2 h-1.5 bg-white/20 rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-white rounded-full transition-all duration-1000"
                          style={{ width: `${clientData.max_sessoes > 0 ? (clientData.numero_sessoes / clientData.max_sessoes) * 100 : 0}%` }}
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Resumo Rápido */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
                  {/* Card Próximos Agendamentos */}
                  <div className="bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow overflow-hidden">
                    <div className="p-5 border-b border-gray-50">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center shadow-lg shadow-emerald-500/30">
                            <Calendar className="h-5 w-5 text-white" />
                          </div>
                          <div>
                            <h3 className="font-semibold text-gray-900">Próximos Agendamentos</h3>
                            <p className="text-xs text-gray-500">Suas sessões agendadas</p>
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className="p-5">
                      <div className="space-y-3">
                        {clientData.proxima_sessao ? (
                          <div className="flex items-center justify-between p-4 bg-gradient-to-r from-teal-50 to-cyan-50 rounded-xl border border-teal-100 group hover:border-teal-200 transition-colors">
                            <div className="flex items-center gap-3">
                              <div className="w-12 h-12 rounded-xl bg-white shadow-sm flex flex-col items-center justify-center">
                                <span className="text-xs text-gray-500 font-medium">
                                  {format(parseISO(clientData.proxima_sessao), 'MMM', { locale: ptBR }).toUpperCase()}
                                </span>
                                <span className="text-lg font-bold text-gray-900">
                                  {format(parseISO(clientData.proxima_sessao), 'd')}
                                </span>
                              </div>
                              <div>
                                <p className="font-semibold text-gray-900">Sessão de Neurofeedback</p>
                                <p className="text-sm text-gray-500">
                                  {format(parseISO(clientData.proxima_sessao), "EEEE 'às' HH:mm", { locale: ptBR })}
                                </p>
                              </div>
                            </div>
                            <Badge className="bg-emerald-100 text-emerald-700 hover:bg-emerald-100 border-0">
                              Confirmado
                            </Badge>
                          </div>
                        ) : (
                          <div className="text-center py-6 text-gray-500">
                            <CalendarDays className="h-10 w-10 mx-auto mb-2 text-gray-300" />
                            <p className="text-sm">Nenhuma sessão agendada</p>
                          </div>
                        )}
                        <Button 
                          variant="outline" 
                          className="w-full rounded-xl h-11 font-medium hover:bg-teal-50 hover:text-teal-700 hover:border-teal-200 transition-colors"
                          onClick={() => setActiveTab('appointments')}
                        >
                          Ver Todos os Agendamentos
                          <ArrowRight className="h-4 w-4 ml-2" />
                        </Button>
                      </div>
                    </div>
                  </div>

                  {/* Card Notificações */}
                  <div className="bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow overflow-hidden">
                    <div className="p-5 border-b border-gray-50">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center shadow-lg shadow-violet-500/30">
                            <Bell className="h-5 w-5 text-white" />
                          </div>
                          <div>
                            <h3 className="font-semibold text-gray-900">Notificações</h3>
                            <p className="text-xs text-gray-500">Atualizações recentes</p>
                          </div>
                        </div>
                        {unreadNotifications > 0 && (
                          <Badge className="bg-rose-100 text-rose-700 border-0">
                            {unreadNotifications} novas
                          </Badge>
                        )}
                      </div>
                    </div>
                    <div className="p-5">
                      <div className="space-y-3">
                        {notifications.length > 0 ? (
                          notifications.slice(0, 3).map((notification, idx) => (
                            <div 
                              key={notification.id} 
                              className={cn(
                                "flex items-start gap-3 p-3 rounded-xl transition-colors hover:bg-gray-50",
                                idx === 0 && "bg-violet-50/50"
                              )}
                            >
                              <div className={cn(
                                "w-2 h-2 rounded-full mt-2 flex-shrink-0",
                                idx === 0 ? "bg-violet-500" : "bg-gray-300"
                              )} />
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium text-gray-900 truncate">{notification.title}</p>
                                <p className="text-xs text-gray-500 line-clamp-1">{notification.message}</p>
                                <p className="text-xs text-gray-400 mt-1">
                                  {format(parseISO(notification.created_at), "d 'de' MMM, HH:mm", { locale: ptBR })}
                                </p>
                              </div>
                            </div>
                          ))
                        ) : (
                          <div className="text-center py-6 text-gray-500">
                            <Bell className="h-10 w-10 mx-auto mb-2 text-gray-300" />
                            <p className="text-sm">Nenhuma notificação</p>
                          </div>
                        )}
                        <Button 
                          variant="outline" 
                          className="w-full rounded-xl h-11 font-medium hover:bg-violet-50 hover:text-violet-700 hover:border-violet-200 transition-colors"
                          onClick={() => setActiveTab('notifications')}
                        >
                          Ver Todas as Notificações
                          <ArrowRight className="h-4 w-4 ml-2" />
                        </Button>
                      </div>
                    </div>
                  </div>
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
                <ClientAvailabilityCalendar clienteId={clientData.id} />
                <NotificationPanel clienteId={clientData.id} />
              </div>
            )}
          </div>
        </div>
      </main>

      {/* Mobile Bottom Navigation - Design Premium */}
      <nav className="fixed bottom-0 left-0 right-0 lg:hidden z-50 safe-area-bottom">
        {/* Blur Background */}
        <div className="absolute inset-0 bg-white/80 backdrop-blur-xl border-t border-gray-100/50" />
        
        {/* Navigation Items */}
        <div className="relative flex justify-around items-center h-16 px-2">
          {[
            { id: 'overview', icon: Activity, label: 'Início' },
            { id: 'appointments', icon: Calendar, label: 'Agenda' },
            { id: 'availability', icon: Clock, label: 'Disp.' },
            { id: 'payments', icon: CreditCard, label: 'Pagam.' },
            { id: 'chat', icon: MessageSquare, label: 'Chat', badge: unreadMessages },
          ].map((item) => (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className="relative flex flex-col items-center justify-center flex-1 h-full py-1 group"
            >
              {/* Pill Background Animado */}
              <div className={cn(
                "absolute inset-x-2 top-1 bottom-1 rounded-2xl transition-all duration-300",
                activeTab === item.id 
                  ? "bg-gradient-to-r from-teal-500/10 to-cyan-500/10 scale-100" 
                  : "scale-0"
              )} />
              
              {/* Ícone */}
              <div className={cn(
                "relative w-10 h-10 rounded-xl flex items-center justify-center transition-all duration-300",
                activeTab === item.id 
                  ? "bg-gradient-to-r from-teal-500 to-cyan-600 shadow-lg shadow-teal-500/30 -translate-y-1" 
                  : "group-hover:bg-gray-100"
              )}>
                <item.icon className={cn(
                  "h-5 w-5 transition-colors",
                  activeTab === item.id ? "text-white" : "text-gray-500 group-hover:text-gray-700"
                )} />
                
                {/* Badge */}
                {item.badge && item.badge > 0 && (
                  <span className={cn(
                    "absolute -top-1 -right-1 min-w-[18px] h-[18px] rounded-full text-[10px] font-bold flex items-center justify-center",
                    activeTab === item.id 
                      ? "bg-white text-teal-600" 
                      : "bg-gradient-to-r from-rose-500 to-pink-500 text-white"
                  )}>
                    {item.badge > 9 ? '9+' : item.badge}
                  </span>
                )}
              </div>
              
              {/* Label */}
              <span className={cn(
                "text-[10px] font-medium mt-0.5 transition-colors",
                activeTab === item.id ? "text-teal-600" : "text-gray-500"
              )}>
                {item.label}
              </span>
            </button>
          ))}
        </div>
      </nav>

      {/* Spacer for bottom navigation on mobile */}
      <div className="h-20 lg:hidden" />
    </div>
  );
};

export default ClientDashboardPage; 