import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Users, 
  Calendar, 
  Clock, 
  CheckCircle, 
  AlertCircle,
  TrendingUp,
  Activity,
  Shield,
  ArrowRight
} from 'lucide-react';
import { useAdminAuth, useAdminDashboardStats } from '@/hooks/useAdminAuth';
import { useIsMobile } from '@/hooks/use-mobile';
import { cn } from '@/lib/utils';
import { Link } from 'react-router-dom';
import AdminSidebar from '@/components/admin/AdminSidebar';
import { ADMIN_PERMISSIONS } from '@/types/admin';

const AdminDashboardPage = () => {
  const { session, hasPermission } = useAdminAuth();
  const { stats, loading: statsLoading } = useAdminDashboardStats();
  const isMobile = useIsMobile();

  const quickActions = [
    {
      title: 'Gerir Clientes',
      description: 'Ver e editar informações dos clientes',
      icon: <Users className="h-5 w-5" />,
      path: '/admin/clients',
      permission: ADMIN_PERMISSIONS.VIEW_CLIENTS,
      color: 'bg-blue-500'
    },
    {
      title: 'Ver Calendário',
      description: 'Consultar e gerir agendamentos',
      icon: <Calendar className="h-5 w-5" />,
      path: '/admin/calendar',
      permission: ADMIN_PERMISSIONS.VIEW_CALENDAR,
      color: 'bg-green-500'
    },
  ];

  const filteredActions = quickActions.filter(action => 
    !action.permission || hasPermission(action.permission)
  );

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Bom dia';
    if (hour < 18) return 'Boa tarde';
    return 'Boa noite';
  };

  return (
    <div className="flex min-h-screen bg-gray-50">
      <AdminSidebar />
      
      <main className={cn(
        "flex-1 transition-all duration-300",
        isMobile ? "ml-0" : "ml-64"
      )}>
        <div className={cn(
          "p-6 space-y-6",
          isMobile && "pt-20"
        )}>
          {/* Header */}
          <div className="flex items-start justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                {getGreeting()}, {session?.adminName}!
              </h1>
              <p className="text-gray-600 mt-1">
                Bem-vindo à área administrativa do NeuroBalance
              </p>
              <div className="flex items-center gap-2 mt-2">
                <Badge variant="outline" className="bg-gray-100 text-gray-700">
                  <Shield className="h-3 w-3 mr-1" />
                  {session?.role === 'admin' ? 'Administrador' : 'Assistente'}
                </Badge>
                <Badge variant="outline" className="bg-green-100 text-green-700">
                  <Activity className="h-3 w-3 mr-1" />
                  Online
                </Badge>
              </div>
            </div>
          </div>

          {/* Estatísticas */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-blue-700">
                  Total de Clientes
                </CardTitle>
                <Users className="h-4 w-4 text-blue-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-blue-900">
                  {statsLoading ? '...' : stats?.totalClients || 0}
                </div>
                <p className="text-xs text-blue-600 mt-1">
                  Clientes registados
                </p>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-green-50 to-green-100 border-green-200">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-green-700">
                  Agendamentos Hoje
                </CardTitle>
                <Calendar className="h-4 w-4 text-green-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-900">
                  {statsLoading ? '...' : stats?.todayAppointments || 0}
                </div>
                <p className="text-xs text-green-600 mt-1">
                  Para hoje
                </p>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-amber-50 to-amber-100 border-amber-200">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-amber-700">
                  Pendentes
                </CardTitle>
                <Clock className="h-4 w-4 text-amber-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-amber-900">
                  {statsLoading ? '...' : stats?.pendingAppointments || 0}
                </div>
                <p className="text-xs text-amber-600 mt-1">
                  Aguardam confirmação
                </p>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-purple-700">
                  Esta Semana
                </CardTitle>
                <TrendingUp className="h-4 w-4 text-purple-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-purple-900">
                  {statsLoading ? '...' : stats?.weekAppointments || 0}
                </div>
                <p className="text-xs text-purple-600 mt-1">
                  Agendamentos
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Ações Rápidas */}
          <Card>
            <CardHeader>
              <CardTitle className="text-xl text-gray-900">Ações Rápidas</CardTitle>
              <p className="text-gray-600">Acesso rápido às funcionalidades principais</p>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {filteredActions.map((action, index) => (
                  <Link key={index} to={action.path}>
                    <Card className="hover:shadow-md transition-shadow cursor-pointer border-gray-200 hover:border-gray-300">
                      <CardContent className="p-4">
                        <div className="flex items-start gap-4">
                          <div className="bg-[#3f9094] p-3 rounded-lg text-white">
                            {action.icon}
                          </div>
                          <div className="flex-1">
                            <h3 className="font-semibold text-gray-900 mb-1">
                              {action.title}
                            </h3>
                            <p className="text-sm text-gray-600 mb-3">
                              {action.description}
                            </p>
                            <div className="flex items-center text-sm text-gray-500 hover:text-gray-700">
                              Acessar
                              <ArrowRight className="h-4 w-4 ml-1" />
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </Link>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Informações do Sistema */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg text-gray-900">Informações da Sessão</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Email:</span>
                  <span className="text-sm font-medium text-gray-900">{session?.adminEmail}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Função:</span>
                  <Badge variant="outline">
                    {session?.role === 'admin' ? 'Administrador' : 'Assistente'}
                  </Badge>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Permissões:</span>
                  <span className="text-sm font-medium text-gray-900">
                    {session?.permissions.length || 0} ativas
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Sessão expira:</span>
                  <span className="text-sm font-medium text-gray-900">
                    {session?.expiresAt ? new Date(session.expiresAt).toLocaleDateString('pt-PT') : 'N/A'}
                  </span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg text-gray-900">Estado do Sistema</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  <span className="text-sm text-gray-700">Sistema operacional</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  <span className="text-sm text-gray-700">Base de dados conectada</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  <span className="text-sm text-gray-700">Autenticação ativa</span>
                </div>
                <div className="flex items-center gap-2">
                  <AlertCircle className="h-4 w-4 text-amber-500" />
                  <span className="text-sm text-gray-700">Funcionalidades limitadas</span>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Rodapé */}
          <div className="text-center text-sm text-gray-500 border-t border-gray-200 pt-6">
            <p>
              NeuroBalance - Área Administrativa v1.0.0
            </p>
            <p className="mt-1">
              Acesso restrito a pessoal autorizado
            </p>
          </div>
        </div>
      </main>
    </div>
  );
};

export default AdminDashboardPage;
