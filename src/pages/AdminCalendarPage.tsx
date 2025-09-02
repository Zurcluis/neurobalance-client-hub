import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  Calendar as CalendarIcon, 
  Clock, 
  Plus,
  Filter,
  Eye,
  CheckCircle,
  XCircle,
  AlertCircle
} from 'lucide-react';
import { useIsMobile } from '@/hooks/use-mobile';
import { cn } from '@/lib/utils';
import AdminSidebar from '@/components/admin/AdminSidebar';
import { useAdminAuth } from '@/hooks/useAdminAuth';
import { ADMIN_PERMISSIONS } from '@/types/admin';
import useAppointments from '@/hooks/useAppointments';
import useClients from '@/hooks/useClients';
import { format, parseISO, startOfDay, endOfDay, isSameDay, addDays, startOfWeek, endOfWeek } from 'date-fns';
import { pt } from 'date-fns/locale';

const AdminCalendarPage = () => {
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [viewMode, setViewMode] = useState<'day' | 'week'>('day');
  const [statusFilter, setStatusFilter] = useState<'all' | 'pendente' | 'confirmado' | 'cancelado'>('all');
  
  const { hasPermission } = useAdminAuth();
  const { appointments, isLoading: appointmentsLoading } = useAppointments();
  const { clients } = useClients();
  const isMobile = useIsMobile();

  // Verificar permissões
  const canViewCalendar = hasPermission(ADMIN_PERMISSIONS.VIEW_CALENDAR);
  const canManageAppointments = hasPermission(ADMIN_PERMISSIONS.MANAGE_APPOINTMENTS);

  // Filtrar agendamentos baseado na data e status
  const getFilteredAppointments = () => {
    let filtered = appointments;

    // Filtrar por data baseado no modo de visualização
    if (viewMode === 'day') {
      filtered = filtered.filter(apt => 
        isSameDay(parseISO(apt.data), selectedDate)
      );
    } else if (viewMode === 'week') {
      const weekStart = startOfWeek(selectedDate, { weekStartsOn: 1 });
      const weekEnd = endOfWeek(selectedDate, { weekStartsOn: 1 });
      filtered = filtered.filter(apt => {
        const aptDate = parseISO(apt.data);
        return aptDate >= weekStart && aptDate <= weekEnd;
      });
    }

    // Filtrar por status
    if (statusFilter !== 'all') {
      filtered = filtered.filter(apt => apt.estado === statusFilter);
    }

    return filtered.sort((a, b) => 
      new Date(a.data).getTime() - new Date(b.data).getTime()
    );
  };

  const filteredAppointments = getFilteredAppointments();

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'confirmado':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'pendente':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'cancelado':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'realizado':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'confirmado':
        return <CheckCircle className="h-4 w-4" />;
      case 'pendente':
        return <AlertCircle className="h-4 w-4" />;
      case 'cancelado':
        return <XCircle className="h-4 w-4" />;
      default:
        return <Clock className="h-4 w-4" />;
    }
  };

  const getClientName = (clientId: number | null) => {
    if (!clientId) return 'Cliente não associado';
    const client = clients.find(c => c.id === clientId);
    return client?.nome || 'Cliente não encontrado';
  };

  const navigateDate = (direction: 'prev' | 'next') => {
    const increment = viewMode === 'day' ? 1 : 7;
    setSelectedDate(prev => 
      direction === 'next' 
        ? addDays(prev, increment)
        : addDays(prev, -increment)
    );
  };

  if (!canViewCalendar) {
    return (
      <div className="flex min-h-screen bg-slate-50">
        <AdminSidebar />
        <main className={cn(
          "flex-1 transition-all duration-300 flex items-center justify-center",
          isMobile ? "ml-0" : "ml-64"
        )}>
          <div className="text-center">
            <CalendarIcon className="h-16 w-16 text-slate-400 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-slate-900 mb-2">Acesso Negado</h2>
            <p className="text-slate-600">Você não tem permissão para ver o calendário.</p>
          </div>
        </main>
      </div>
    );
  }

  if (appointmentsLoading) {
    return (
      <div className="flex min-h-screen bg-slate-50">
        <AdminSidebar />
        <main className={cn(
          "flex-1 transition-all duration-300 flex items-center justify-center",
          isMobile ? "ml-0" : "ml-64"
        )}>
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-slate-600 mx-auto mb-4"></div>
            <p className="text-slate-600">Carregando calendário...</p>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-slate-50">
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
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <CalendarIcon className="h-8 w-8 text-slate-600" />
              <div>
                <h1 className="text-3xl font-bold text-slate-900">
                  Calendário
                </h1>
                <p className="text-slate-600">
                  Consultar e gerir agendamentos
                </p>
              </div>
            </div>
          </div>

          {/* Controles */}
          <Card>
            <CardContent className="p-4">
              <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
                <div className="flex flex-col sm:flex-row gap-3">
                  {/* Navegação de data */}
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => navigateDate('prev')}
                    >
                      ←
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setSelectedDate(new Date())}
                    >
                      Hoje
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => navigateDate('next')}
                    >
                      →
                    </Button>
                  </div>

                  {/* Modo de visualização */}
                  <div className="flex items-center gap-1 bg-slate-100 rounded-lg p-1">
                    <Button
                      variant={viewMode === 'day' ? 'default' : 'ghost'}
                      size="sm"
                      onClick={() => setViewMode('day')}
                      className="h-8"
                    >
                      Dia
                    </Button>
                    <Button
                      variant={viewMode === 'week' ? 'default' : 'ghost'}
                      size="sm"
                      onClick={() => setViewMode('week')}
                      className="h-8"
                    >
                      Semana
                    </Button>
                  </div>

                  {/* Filtro de status */}
                  <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value as any)}
                    className="px-3 py-2 border border-slate-300 rounded-md bg-white text-sm"
                  >
                    <option value="all">Todos os Status</option>
                    <option value="pendente">Pendentes</option>
                    <option value="confirmado">Confirmados</option>
                    <option value="cancelado">Cancelados</option>
                  </select>
                </div>

                <div className="text-lg font-semibold text-slate-900">
                  {viewMode === 'day' 
                    ? format(selectedDate, 'dd \'de\' MMMM \'de\' yyyy', { locale: pt })
                    : `Semana de ${format(startOfWeek(selectedDate, { weekStartsOn: 1 }), 'dd/MM', { locale: pt })} a ${format(endOfWeek(selectedDate, { weekStartsOn: 1 }), 'dd/MM', { locale: pt })}`
                  }
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Estatísticas */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="bg-blue-100 p-2 rounded-lg">
                    <CalendarIcon className="h-5 w-5 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-slate-900">{filteredAppointments.length}</p>
                    <p className="text-sm text-slate-600">
                      {viewMode === 'day' ? 'Hoje' : 'Esta Semana'}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="bg-green-100 p-2 rounded-lg">
                    <CheckCircle className="h-5 w-5 text-green-600" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-slate-900">
                      {filteredAppointments.filter(apt => apt.estado === 'confirmado').length}
                    </p>
                    <p className="text-sm text-slate-600">Confirmados</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="bg-yellow-100 p-2 rounded-lg">
                    <AlertCircle className="h-5 w-5 text-yellow-600" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-slate-900">
                      {filteredAppointments.filter(apt => apt.estado === 'pendente').length}
                    </p>
                    <p className="text-sm text-slate-600">Pendentes</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="bg-red-100 p-2 rounded-lg">
                    <XCircle className="h-5 w-5 text-red-600" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-slate-900">
                      {filteredAppointments.filter(apt => apt.estado === 'cancelado').length}
                    </p>
                    <p className="text-sm text-slate-600">Cancelados</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Lista de Agendamentos */}
          <Card>
            <CardHeader>
              <CardTitle className="text-xl text-slate-900">
                Agendamentos
                {viewMode === 'day' && ` - ${format(selectedDate, 'dd/MM/yyyy', { locale: pt })}`}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {filteredAppointments.length > 0 ? (
                <div className="space-y-4">
                  {filteredAppointments.map((appointment) => (
                    <div
                      key={appointment.id}
                      className="p-4 border border-slate-200 rounded-lg hover:shadow-md transition-shadow"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <h3 className="font-semibold text-slate-900">
                              {appointment.titulo}
                            </h3>
                            <Badge className={getStatusColor(appointment.estado)}>
                              <div className="flex items-center gap-1">
                                {getStatusIcon(appointment.estado)}
                                <span className="capitalize">{appointment.estado}</span>
                              </div>
                            </Badge>
                          </div>
                          
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-slate-600">
                            <div className="flex items-center gap-2">
                              <CalendarIcon className="h-4 w-4" />
                              <span>
                                {format(parseISO(appointment.data), 'dd/MM/yyyy', { locale: pt })}
                              </span>
                            </div>
                            <div className="flex items-center gap-2">
                              <Clock className="h-4 w-4" />
                              <span>{appointment.hora}</span>
                            </div>
                          </div>
                          
                          <div className="mt-2">
                            <p className="text-sm font-medium text-slate-700">
                              Cliente: {getClientName(appointment.id_cliente)}
                            </p>
                            {appointment.tipo && (
                              <p className="text-sm text-slate-600">
                                Tipo: <span className="capitalize">{appointment.tipo}</span>
                              </p>
                            )}
                            {appointment.notas && (
                              <p className="text-sm text-slate-600 mt-1">
                                Notas: {appointment.notas}
                              </p>
                            )}
                          </div>
                        </div>
                        
                        {canManageAppointments && (
                          <div className="ml-4">
                            <Button
                              size="sm"
                              variant="outline"
                            >
                              <Eye className="h-4 w-4 mr-1" />
                              Ver
                            </Button>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <CalendarIcon className="h-12 w-12 text-slate-400 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-slate-900 mb-2">
                    Nenhum agendamento encontrado
                  </h3>
                  <p className="text-slate-600">
                    {statusFilter !== 'all' || viewMode !== 'day'
                      ? 'Tente ajustar os filtros ou mudar o período.'
                      : 'Não há agendamentos para este dia.'
                    }
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
};

export default AdminCalendarPage;
