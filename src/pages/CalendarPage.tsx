import React, { useMemo } from 'react';
import PageLayout from '@/components/layout/PageLayout';
import AppointmentCalendar from '@/components/calendar/AppointmentCalendar';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Calendar, 
  Clock, 
  Users, 
  Plus,
  CheckCircle2,
  AlertCircle,
  XCircle,
  TrendingUp,
  Target
} from 'lucide-react';
import useAppointments from '@/hooks/useAppointments';
import useClients from '@/hooks/useClients';
import { parseISO, isToday, isFuture, isPast, startOfWeek, endOfWeek, isWithinInterval, format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

const CalendarPage = () => {
  const { appointments, isLoading } = useAppointments();
  const { clients } = useClients();

  // Métricas do Calendário
  const calendarMetrics = useMemo(() => {
    const now = new Date();
    const weekStart = startOfWeek(now, { weekStartsOn: 1 }); // Segunda-feira
    const weekEnd = endOfWeek(now, { weekStartsOn: 1 });

    // Sessões hoje
    const todayAppts = appointments.filter(apt => {
      if (!apt.data_hora) return false;
      return isToday(parseISO(apt.data_hora));
    });

    // Sessões esta semana
    const weekAppts = appointments.filter(apt => {
      if (!apt.data_hora) return false;
      const aptDate = parseISO(apt.data_hora);
      return isWithinInterval(aptDate, { start: weekStart, end: weekEnd });
    });

    // Sessões futuras
    const futureAppts = appointments.filter(apt => {
      if (!apt.data_hora) return false;
      return isFuture(parseISO(apt.data_hora));
    });

    // Sessões por estado
    const completed = appointments.filter(apt => apt.estado === 'realizado').length;
    const pending = appointments.filter(apt => apt.estado === 'agendado').length;
    const canceled = appointments.filter(apt => apt.estado === 'cancelado').length;

    // Taxa de comparecimento
    const totalPast = appointments.filter(apt => {
      if (!apt.data_hora) return false;
      return isPast(parseISO(apt.data_hora));
    }).length;
    const attendanceRate = totalPast > 0 ? (completed / totalPast) * 100 : 0;

    // Próxima sessão
    const nextAppointment = futureAppts.sort((a, b) => {
      if (!a.data_hora || !b.data_hora) return 0;
      return parseISO(a.data_hora).getTime() - parseISO(b.data_hora).getTime();
    })[0];

    // Cliente da próxima sessão
    const nextClient = nextAppointment ? clients.find(c => c.id === nextAppointment.id_cliente) : null;

    return {
      todayCount: todayAppts.length,
      weekCount: weekAppts.length,
      futureCount: futureAppts.length,
      completedCount: completed,
      pendingCount: pending,
      canceledCount: canceled,
      attendanceRate,
      nextAppointment,
      nextClient
    };
  }, [appointments, clients]);

  return (
    <PageLayout>
      <div className="space-y-6">
        {/* Header Melhorado */}
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-[#3f9094] to-[#2A5854] bg-clip-text text-transparent">
              Calendário de Sessões
            </h1>
            <p className="text-gray-600 mt-1">Gerencie consultas e agendamentos dos clientes</p>
          </div>
          
          <Button className="gap-2 bg-gradient-to-r from-[#3f9094] to-[#2A5854] hover:opacity-90">
            <Plus className="h-4 w-4" />
            Nova Sessão
          </Button>
        </div>

        {/* Cards de Resumo */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Hoje */}
          <Card className="bg-gradient-to-br from-blue-50 to-white dark:from-blue-950/20 dark:to-gray-900 border-t-4 border-t-blue-500">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center gap-2">
                <Clock className="h-4 w-4 text-blue-600" />
                Hoje
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-blue-600">
                {calendarMetrics.todayCount}
              </div>
              <p className="text-xs text-gray-600 mt-1">
                {calendarMetrics.todayCount === 1 ? 'sessão agendada' : 'sessões agendadas'}
              </p>
            </CardContent>
          </Card>

          {/* Esta Semana */}
          <Card className="bg-gradient-to-br from-green-50 to-white dark:from-green-950/20 dark:to-gray-900 border-t-4 border-t-green-500">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center gap-2">
                <Calendar className="h-4 w-4 text-green-600" />
                Esta Semana
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-green-600">
                {calendarMetrics.weekCount}
              </div>
              <p className="text-xs text-gray-600 mt-1">
                sessões programadas
              </p>
            </CardContent>
          </Card>

          {/* Pendentes */}
          <Card className="bg-gradient-to-br from-orange-50 to-white dark:from-orange-950/20 dark:to-gray-900 border-t-4 border-t-orange-500">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center gap-2">
                <AlertCircle className="h-4 w-4 text-orange-600" />
                Pendentes
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-orange-600">
                {calendarMetrics.pendingCount}
              </div>
              <p className="text-xs text-gray-600 mt-1">
                aguardando confirmação
              </p>
            </CardContent>
          </Card>

          {/* Taxa de Comparecimento */}
          <Card className="bg-gradient-to-br from-purple-50 to-white dark:from-purple-950/20 dark:to-gray-900 border-t-4 border-t-purple-500">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center gap-2">
                <Target className="h-4 w-4 text-purple-600" />
                Taxa de Comparecimento
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-purple-600">
                {calendarMetrics.attendanceRate.toFixed(0)}%
              </div>
              <div className="flex items-center gap-1 mt-1">
                <TrendingUp className="h-3 w-3 text-purple-600" />
                <span className="text-xs text-gray-600">
                  {calendarMetrics.completedCount} realizadas
                </span>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Próxima Sessão em Destaque */}
        {calendarMetrics.nextAppointment && calendarMetrics.nextClient && (
          <Card className="border-l-4 border-l-blue-500 bg-gradient-to-r from-blue-50 to-white dark:from-blue-950/20 dark:to-gray-900">
            <CardHeader className="pb-3">
              <div className="flex items-center gap-2">
                <Clock className="h-5 w-5 text-blue-500" />
                <CardTitle className="text-lg">Próxima Sessão</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-gradient-to-br from-[#3f9094] to-[#5DA399] rounded-full flex items-center justify-center text-white font-bold text-lg">
                    {calendarMetrics.nextClient.nome.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <p className="font-bold text-gray-900">{calendarMetrics.nextClient.nome}</p>
                    <p className="text-sm text-gray-600">
                      {format(parseISO(calendarMetrics.nextAppointment.data_hora), "EEEE, d 'de' MMMM 'às' HH:mm", { locale: ptBR })}
                    </p>
                    {calendarMetrics.nextAppointment.notas && (
                      <p className="text-xs text-gray-500 mt-1">
                        {calendarMetrics.nextAppointment.notas}
                      </p>
                    )}
                  </div>
                </div>
                <Badge className="bg-blue-500">
                  {calendarMetrics.nextAppointment.estado === 'agendado' ? 'Agendado' : 
                   calendarMetrics.nextAppointment.estado === 'confirmado' ? 'Confirmado' : 
                   calendarMetrics.nextAppointment.estado}
                </Badge>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Resumo de Estados */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="h-5 w-5" />
              Resumo de Sessões
            </CardTitle>
            <CardDescription>
              Distribuição por estado
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="flex items-center justify-between p-4 bg-green-50 dark:bg-green-950/20 rounded-lg border border-green-200 dark:border-green-800">
                <div className="flex items-center gap-3">
                  <CheckCircle2 className="h-8 w-8 text-green-600" />
                  <div>
                    <p className="text-sm font-medium text-gray-700 dark:text-gray-300">Realizadas</p>
                    <p className="text-2xl font-bold text-green-600">{calendarMetrics.completedCount}</p>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between p-4 bg-orange-50 dark:bg-orange-950/20 rounded-lg border border-orange-200 dark:border-orange-800">
                <div className="flex items-center gap-3">
                  <Clock className="h-8 w-8 text-orange-600" />
                  <div>
                    <p className="text-sm font-medium text-gray-700 dark:text-gray-300">Pendentes</p>
                    <p className="text-2xl font-bold text-orange-600">{calendarMetrics.pendingCount}</p>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between p-4 bg-red-50 dark:bg-red-950/20 rounded-lg border border-red-200 dark:border-red-800">
                <div className="flex items-center gap-3">
                  <XCircle className="h-8 w-8 text-red-600" />
                  <div>
                    <p className="text-sm font-medium text-gray-700 dark:text-gray-300">Canceladas</p>
                    <p className="text-2xl font-bold text-red-600">{calendarMetrics.canceledCount}</p>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Calendário Principal */}
        <div className="bg-gradient-to-br from-[#c5cfce]/60 to-[#e5e9e9]/60 rounded-2xl p-6 backdrop-blur-sm border border-white/20 shadow-lg">
          <AppointmentCalendar />
        </div>
      </div>
    </PageLayout>
  );
};

export default CalendarPage;
