import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Skeleton } from '@/components/ui/skeleton';
import {
  User,
  Calendar,
  CreditCard,
  Bell,
  LogOut,
  Clock,
  CalendarDays,
  Euro,
  Activity,
  TrendingUp,
  ArrowRight,
  MessageSquare,
  RotateCcw,
  AlertCircle,
  type LucideIcon
} from 'lucide-react';
import { useClientAuth, useClientData, useClientMessages, useClientNotifications } from '@/hooks/useClientAuth';
import { format, formatDistanceToNow } from 'date-fns';
import { pt } from 'date-fns/locale';
import { parseLocalISO } from '@/utils/dateUtils';
import KpiCard from '@/components/shared/KpiCard';
import ClientAppointments from '@/components/client-dashboard/ClientAppointments';
import ClientPayments from '@/components/client-dashboard/ClientPayments';
import ClientChat from '@/components/client-dashboard/ClientChat';
import ClientProfile from '@/components/client-dashboard/ClientProfile';
import ClientNotifications from '@/components/client-dashboard/ClientNotifications';
import { ClientAvailabilityCalendar } from '@/components/availability';
import { NotificationPanel } from '@/components/availability/NotificationPanel';
import { cn } from '@/lib/utils';

interface NavItem {
  id: string;
  icon: LucideIcon;
  label: string;
  badge?: number;
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

const ClientDashboardPage = () => {
  const { session, logout, isAuthenticated, loading: authLoading } = useClientAuth();
  const { clientData, loading: clientLoading, error: clientError, refetch: refetchClientData } = useClientData();
  const { unreadCount: unreadMessages = 0 } = useClientMessages();
  const { notifications, unreadCount: unreadNotifications = 0 } = useClientNotifications();
  const [activeTab, setActiveTab] = useState('overview');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    if (!authLoading && !isAuthenticated && !clientLoading) {
      navigate('/client-login', { replace: true });
    }
  }, [isAuthenticated, clientLoading, authLoading, navigate]);

  const handleLogout = () => {
    logout();
    navigate('/client-login', { replace: true });
  };

  if (clientLoading || authLoading) {
    return (
      <div className="min-h-screen bg-background touch-manipulation">
        <div className="h-16 bg-card border-b border-border" />
        <div className="max-w-7xl mx-auto p-4 sm:p-6 space-y-6">
          <div className="flex items-center gap-4">
            <Skeleton className="h-16 w-16 rounded-2xl" />
            <div className="space-y-2">
              <Skeleton className="h-6 w-48" />
              <Skeleton className="h-4 w-32" />
            </div>
          </div>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
            {[1, 2, 3, 4].map((i) => (
              <Skeleton key={i} className="h-28 rounded-2xl" />
            ))}
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {[1, 2].map((i) => (
              <Skeleton key={i} className="h-64 rounded-2xl" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (!session || !clientData) {
    if (clientError) {
      return (
        <div className="min-h-screen bg-background flex items-center justify-center p-4">
          <div className="bg-card border border-border rounded-2xl p-8 max-w-sm w-full text-center space-y-4">
            <div className="w-12 h-12 rounded-xl bg-destructive/10 flex items-center justify-center mx-auto">
              <AlertCircle className="h-6 w-6 text-destructive" />
            </div>
            <div>
              <h2 className="font-semibold text-foreground">Não foi possível carregar o portal</h2>
              <p className="text-sm text-muted-foreground mt-1">
                Ocorreu um erro ao obter os seus dados. Verifique a ligação e tente novamente.
              </p>
            </div>
            <Button onClick={() => refetchClientData()} className="w-full h-11 rounded-xl">
              <RotateCcw className="h-4 w-4 mr-2" />
              Tentar novamente
            </Button>
          </div>
        </div>
      );
    }
    return null;
  }

  const progressPercentage = clientData.max_sessoes > 0
    ? Math.round(((clientData.numero_sessoes || 0) / clientData.max_sessoes) * 100)
    : 0;

  const navItems: NavItem[] = [
    { id: 'overview', icon: Activity, label: 'Visão Geral' },
    { id: 'profile', icon: User, label: 'Perfil' },
    { id: 'appointments', icon: Calendar, label: 'Agendamentos' },
    { id: 'availability', icon: Clock, label: 'Disponibilidade' },
    { id: 'payments', icon: CreditCard, label: 'Pagamentos' },
    { id: 'chat', icon: MessageSquare, label: 'Chat', badge: unreadMessages },
    { id: 'notifications', icon: Bell, label: 'Avisos', badge: unreadNotifications },
  ];

  const mobileNavItems: NavItem[] = [
    { id: 'overview', icon: Activity, label: 'Início' },
    { id: 'appointments', icon: Calendar, label: 'Agenda' },
    { id: 'availability', icon: Clock, label: 'Horários' },
    { id: 'payments', icon: CreditCard, label: 'Pagam.' },
    { id: 'chat', icon: MessageSquare, label: 'Chat', badge: unreadMessages },
  ];

  const renderNavButton = (item: NavItem) => (
    <button
      key={item.id}
      onClick={() => {
        setActiveTab(item.id);
        setSidebarOpen(false);
      }}
      className={cn(
        "w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left transition-colors duration-200",
        activeTab === item.id
          ? "bg-primary text-primary-foreground shadow-sm"
          : "text-muted-foreground hover:bg-muted hover:text-foreground"
      )}
    >
      <div className={cn(
        "w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 transition-colors",
        activeTab === item.id
          ? "bg-primary-foreground/15 text-primary-foreground"
          : "bg-primary/10 text-primary"
      )}>
        <item.icon className="h-5 w-5" />
      </div>
      <span className="font-medium flex-1 truncate">{item.label}</span>
      {item.badge && item.badge > 0 && (
        <span className={cn(
          "px-2 py-0.5 text-xs font-bold rounded-full",
          activeTab === item.id
            ? "bg-primary-foreground/25 text-primary-foreground"
            : "bg-destructive text-destructive-foreground"
        )}>
          {item.badge > 9 ? '9+' : item.badge}
        </span>
      )}
    </button>
  );

  return (
    <div className="min-h-screen bg-background touch-manipulation">
      <header className="sticky top-0 z-40 bg-card/95 backdrop-blur border-b border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-3 min-w-0">
              <Button
                variant="ghost"
                size="sm"
                className="lg:hidden p-2 hover:bg-muted rounded-xl transition-colors"
                onClick={() => setSidebarOpen(!sidebarOpen)}
                aria-label={sidebarOpen ? 'Fechar menu' : 'Abrir menu'}
                aria-expanded={sidebarOpen}
              >
                <div className="relative w-5 h-5">
                  <span className={cn(
                    "absolute left-0 block w-5 h-0.5 bg-foreground transition-all duration-300",
                    sidebarOpen ? "top-2 rotate-45" : "top-1"
                  )} />
                  <span className={cn(
                    "absolute left-0 top-2 block w-5 h-0.5 bg-foreground transition-all duration-300",
                    sidebarOpen && "opacity-0"
                  )} />
                  <span className={cn(
                    "absolute left-0 block w-5 h-0.5 bg-foreground transition-all duration-300",
                    sidebarOpen ? "top-2 -rotate-45" : "top-3"
                  )} />
                </div>
              </Button>

              <img
                src="/lovable-uploads/e18faaaf-ef2c-4678-98cf-d9e7b9fa5ea5.png"
                alt="NeuroBalance Logo"
                className="h-10 sm:h-12 w-auto"
              />
              <div className="min-w-0 flex-1 hidden sm:block">
                <h1 className="text-lg font-bold text-foreground whitespace-nowrap truncate">
                  {getGreeting()}, {clientData.nome.split(' ')[0]}
                </h1>
                <p className="text-xs text-muted-foreground font-medium">Bem-vindo ao seu portal pessoal</p>
              </div>
            </div>

            <div className="flex items-center gap-1 sm:gap-2">
              <Button
                variant="ghost"
                size="sm"
                className={cn(
                  "relative p-2 h-10 w-10 rounded-xl transition-colors duration-200",
                  activeTab === 'notifications'
                    ? "bg-primary/10 text-primary"
                    : "hover:bg-muted text-muted-foreground"
                )}
                onClick={() => setActiveTab('notifications')}
                aria-label="Avisos"
              >
                <Bell className="h-5 w-5" />
                {unreadNotifications > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 h-5 w-5 rounded-full bg-destructive text-destructive-foreground text-[10px] font-bold flex items-center justify-center">
                    {unreadNotifications > 9 ? '9+' : unreadNotifications}
                  </span>
                )}
              </Button>

              <Button
                variant="ghost"
                size="sm"
                className={cn(
                  "relative p-2 h-10 w-10 rounded-xl transition-colors duration-200",
                  activeTab === 'chat'
                    ? "bg-primary/10 text-primary"
                    : "hover:bg-muted text-muted-foreground"
                )}
                onClick={() => setActiveTab('chat')}
                aria-label="Mensagens"
              >
                <MessageSquare className="h-5 w-5" />
                {unreadMessages > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 h-5 w-5 rounded-full bg-destructive text-destructive-foreground text-[10px] font-bold flex items-center justify-center">
                    {unreadMessages > 9 ? '9+' : unreadMessages}
                  </span>
                )}
              </Button>

              <div className="hidden sm:block h-8 w-px bg-border mx-1" />

              <div className="flex items-center gap-2">
                <Avatar className="h-9 w-9 ring-2 ring-background shadow-sm">
                  <AvatarFallback className="bg-primary text-primary-foreground text-sm font-bold">
                    {getInitials(clientData.nome)}
                  </AvatarFallback>
                </Avatar>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleLogout}
                  className="text-muted-foreground hover:text-destructive hover:bg-destructive/10 p-2 h-10 w-10 rounded-xl transition-colors"
                  aria-label="Terminar sessão"
                >
                  <LogOut className="h-5 w-5" />
                </Button>
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="flex flex-1 overflow-hidden">
        {sidebarOpen && (
          <div
            className="fixed inset-0 bg-foreground/50 z-40 lg:hidden"
            onClick={() => setSidebarOpen(false)}
            aria-hidden="true"
          />
        )}

        <div className={cn(
          "w-72 bg-card border-r border-border flex flex-col fixed lg:relative inset-y-0 left-0 z-50 shadow-xl lg:shadow-none",
          "transform transition-transform duration-300 ease-out",
          sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        )}>
          <div className="p-5 border-b border-border">
            <h2 className="text-lg font-bold text-foreground">Menu</h2>
            <p className="text-xs text-muted-foreground">Navegação rápida</p>
          </div>

          <nav className="flex-1 p-4 space-y-1.5 overflow-y-auto">
            {navItems.map(renderNavButton)}
          </nav>

          <div className="p-4 border-t border-border">
            <div className="p-4 rounded-xl bg-primary/10 border border-primary/20">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
                  <TrendingUp className="h-4 w-4 text-primary-foreground" />
                </div>
                <span className="text-sm font-semibold text-foreground">Progresso</span>
              </div>
              <div className="relative h-2 bg-muted rounded-full overflow-hidden">
                <div
                  className="absolute inset-y-0 left-0 bg-primary rounded-full transition-all duration-1000"
                  style={{ width: `${progressPercentage}%` }}
                />
              </div>
              <p className="text-xs text-muted-foreground mt-2">
                {clientData.numero_sessoes || 0} de {clientData.max_sessoes || 0} sessões
              </p>
            </div>
          </div>
        </div>

        <div className="flex-1 min-w-0">
          <div className="p-4 sm:p-6">
            {activeTab === 'overview' && (
              <div className="space-y-6 min-w-0">
                <div className="sm:hidden">
                  <h1 className="text-xl font-bold text-foreground">
                    {getGreeting()}, {clientData.nome.split(' ')[0]}
                  </h1>
                  <p className="text-sm text-muted-foreground">Aqui está o resumo do seu progresso</p>
                </div>

                <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 min-w-0">
                  <KpiCard
                    icon={CalendarDays}
                    label="Sessões"
                    value={clientData.numero_sessoes || 0}
                    sub={`de ${clientData.max_sessoes || 0} planeadas`}
                    tone="teal"
                  />
                  <KpiCard
                    icon={Euro}
                    label="Total Pago"
                    value={`€${clientData.total_pago || 0}`}
                    sub="Valor investido"
                    tone="emerald"
                  />
                  <KpiCard
                    icon={Calendar}
                    label="Próxima Sessão"
                    value={clientData.proxima_sessao
                      ? format(parseLocalISO(clientData.proxima_sessao), 'd MMM', { locale: pt })
                      : '—'}
                    sub={clientData.proxima_sessao
                      ? (clientData.proxima_sessao_hora || format(parseLocalISO(clientData.proxima_sessao), 'HH:mm'))
                      : 'Sem agendamento'}
                    tone="blue"
                  />
                  <KpiCard
                    icon={TrendingUp}
                    label="Progresso"
                    value={`${progressPercentage}%`}
                    sub="do plano de sessões"
                    tone="amber"
                  />
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6 min-w-0">
                  <div className="bg-card rounded-2xl border border-border shadow-sm overflow-hidden min-w-0">
                    <div className="p-5 border-b border-border">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                          <Calendar className="h-5 w-5 text-primary" />
                        </div>
                        <div>
                          <h3 className="font-semibold text-foreground">Próximos Agendamentos</h3>
                          <p className="text-xs text-muted-foreground">As suas sessões agendadas</p>
                        </div>
                      </div>
                    </div>
                    <div className="p-5">
                      <div className="space-y-3">
                        {clientData.proxima_sessao ? (
                          <div className="flex items-center justify-between gap-3 p-4 bg-primary/5 rounded-xl border border-primary/20">
                            <div className="flex items-center gap-3 min-w-0">
                              <div className="w-12 h-12 rounded-xl bg-card border border-border flex flex-col items-center justify-center flex-shrink-0">
                                <span className="text-[10px] text-muted-foreground font-medium uppercase">
                                  {format(parseLocalISO(clientData.proxima_sessao), 'MMM', { locale: pt })}
                                </span>
                                <span className="text-lg font-bold text-foreground leading-tight">
                                  {format(parseLocalISO(clientData.proxima_sessao), 'd')}
                                </span>
                              </div>
                              <div className="min-w-0">
                                <p className="font-semibold text-foreground truncate">
                                  {clientData.proxima_sessao_titulo || 'Sessão'}
                                </p>
                                <p className="text-sm text-muted-foreground truncate">
                                  {format(parseLocalISO(clientData.proxima_sessao), "EEEE 'às'", { locale: pt })}{' '}
                                  {clientData.proxima_sessao_hora || format(parseLocalISO(clientData.proxima_sessao), 'HH:mm')}
                                  {clientData.proxima_sessao_terapeuta && ` · ${clientData.proxima_sessao_terapeuta}`}
                                </p>
                              </div>
                            </div>
                            <Badge className={
                              clientData.proxima_sessao_estado === 'confirmado'
                                ? "bg-emerald-100 text-emerald-700 hover:bg-emerald-100 dark:bg-emerald-950/40 dark:text-emerald-300 border-0"
                                : "bg-amber-100 text-amber-700 hover:bg-amber-100 dark:bg-amber-950/40 dark:text-amber-300 border-0"
                            }>
                              {clientData.proxima_sessao_estado === 'confirmado' ? 'Confirmado' : 'Pendente'}
                            </Badge>
                          </div>
                        ) : (
                          <div className="text-center py-6 text-muted-foreground">
                            <CalendarDays className="h-10 w-10 mx-auto mb-2 text-muted-foreground/40" />
                            <p className="text-sm">Nenhuma sessão agendada</p>
                          </div>
                        )}
                        <Button
                          variant="outline"
                          className="w-full rounded-xl h-11 font-medium hover:bg-primary/10 hover:text-primary hover:border-primary/30 transition-colors"
                          onClick={() => setActiveTab('appointments')}
                        >
                          Ver todos os agendamentos
                          <ArrowRight className="h-4 w-4 ml-2" />
                        </Button>
                      </div>
                    </div>
                  </div>

                  <div className="bg-card rounded-2xl border border-border shadow-sm overflow-hidden min-w-0">
                    <div className="p-5 border-b border-border">
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                            <Bell className="h-5 w-5 text-primary" />
                          </div>
                          <div>
                            <h3 className="font-semibold text-foreground">Avisos</h3>
                            <p className="text-xs text-muted-foreground">Atualizações recentes</p>
                          </div>
                        </div>
                        {unreadNotifications > 0 && (
                          <Badge className="bg-destructive text-destructive-foreground border-0">
                            {unreadNotifications} novas
                          </Badge>
                        )}
                      </div>
                    </div>
                    <div className="p-5">
                      <div className="space-y-3">
                        {notifications.length > 0 ? (
                          notifications.slice(0, 3).map((notification) => (
                            <div
                              key={notification.id}
                              className="flex items-start gap-3 p-3 rounded-xl transition-colors hover:bg-muted/50 min-w-0"
                            >
                              <div className="w-2 h-2 rounded-full mt-2 flex-shrink-0 bg-primary" />
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium text-foreground truncate">{notification.title}</p>
                                <p className="text-xs text-muted-foreground line-clamp-1">{notification.message}</p>
                                <p className="text-xs text-muted-foreground/70 mt-1">
                                  {formatDistanceToNow(parseLocalISO(notification.created_at), { addSuffix: true, locale: pt })}
                                </p>
                              </div>
                            </div>
                          ))
                        ) : (
                          <div className="text-center py-6 text-muted-foreground">
                            <Bell className="h-10 w-10 mx-auto mb-2 text-muted-foreground/40" />
                            <p className="text-sm">Nenhum aviso</p>
                          </div>
                        )}
                        <Button
                          variant="outline"
                          className="w-full rounded-xl h-11 font-medium hover:bg-primary/10 hover:text-primary hover:border-primary/30 transition-colors"
                          onClick={() => setActiveTab('notifications')}
                        >
                          Ver todos os avisos
                          <ArrowRight className="h-4 w-4 ml-2" />
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'profile' && (
              <ClientProfile clientData={clientData} onOpenChat={() => setActiveTab('chat')} />
            )}

            {activeTab === 'appointments' && (
              <ClientAppointments clientId={session.clientId} onOpenChat={() => setActiveTab('chat')} />
            )}

            {activeTab === 'payments' && (
              <ClientPayments clientId={session.clientId} />
            )}

            {activeTab === 'chat' && (
              <ClientChat clientId={session.clientId} />
            )}

            {activeTab === 'notifications' && (
              <ClientNotifications />
            )}

            {activeTab === 'availability' && clientData && (
              <div className="space-y-6 min-w-0">
                <ClientAvailabilityCalendar clienteId={clientData.id} />
                <NotificationPanel clienteId={clientData.id} />
              </div>
            )}
          </div>
        </div>
      </main>

      <nav className="fixed bottom-0 left-0 right-0 lg:hidden z-50 safe-area-bottom">
        <div className="absolute inset-0 bg-card/95 backdrop-blur border-t border-border" />

        <div className="relative flex justify-around items-stretch h-16 px-2">
          {mobileNavItems.map((item) => (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className="relative flex flex-col items-center justify-center flex-1 py-1 group"
              aria-label={item.label}
            >
              <div className={cn(
                "absolute inset-x-1.5 top-1 bottom-1 rounded-2xl transition-colors duration-300",
                activeTab === item.id ? "bg-primary/10" : "bg-transparent"
              )} />

              <div className="relative">
                <div className={cn(
                  "w-9 h-9 rounded-xl flex items-center justify-center transition-colors duration-300",
                  activeTab === item.id
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground group-hover:text-foreground"
                )}>
                  <item.icon className="h-5 w-5" />
                </div>

                {item.badge && item.badge > 0 && (
                  <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] rounded-full bg-destructive text-destructive-foreground text-[10px] font-bold flex items-center justify-center">
                    {item.badge > 9 ? '9+' : item.badge}
                  </span>
                )}
              </div>

              <span className={cn(
                "text-[10px] font-medium mt-0.5 transition-colors",
                activeTab === item.id ? "text-primary" : "text-muted-foreground"
              )}>
                {item.label}
              </span>
            </button>
          ))}
        </div>
      </nav>

      <div className="h-20 lg:hidden" />
    </div>
  );
};

export default ClientDashboardPage;
