import React, { useMemo } from 'react';
import PageLayout from '@/components/layout/PageLayout';
import AppointmentCalendar from '@/components/calendar/AppointmentCalendar';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Calendar,
  Clock,
  Plus,
  CheckCircle2,
  AlertCircle,
  XCircle,
  TrendingUp,
  Target,
  MessageSquare
} from 'lucide-react';
import { SmsAutomationSettings } from '@/components/marketing/SmsAutomationSettings';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import useAppointments from '@/hooks/useAppointments';
import useClients from '@/hooks/useClients';
import { isToday, isFuture, isPast, startOfWeek, endOfWeek, isWithinInterval, format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { parseLocalISO } from '@/utils/dateUtils';

const parseISO = parseLocalISO;


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
      if (!apt.data) return false;
      return isToday(parseISO(apt.data));
    });

    // Sessões esta semana
    const weekAppts = appointments.filter(apt => {
      if (!apt.data) return false;
      const aptDate = parseISO(apt.data);
      return isWithinInterval(aptDate, { start: weekStart, end: weekEnd });
    });

    // Sessões futuras
    const futureAppts = appointments.filter(apt => {
      if (!apt.data) return false;
      return isFuture(parseISO(apt.data));
    });

    // Sessões por estado
    const completed = appointments.filter(apt => apt.estado === 'realizado').length;
    const pending = appointments.filter(apt => apt.estado === 'agendado').length;
    const canceled = appointments.filter(apt => apt.estado === 'cancelado').length;

    // Taxa de comparecimento
    const totalPast = appointments.filter(apt => {
      if (!apt.data) return false;
      return isPast(parseISO(apt.data));
    }).length;
    const attendanceRate = totalPast > 0 ? (completed / totalPast) * 100 : 0;

    // Próxima sessão
    const nextAppointment = futureAppts.sort((a, b) => {
      if (!a.data || !b.data) return 0;
      return parseISO(a.data).getTime() - parseISO(b.data).getTime();
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
              Gestão de Agendamentos
            </h1>
            <p className="text-gray-600 mt-1">Calendário e Automação de SMS</p>
          </div>

          <Button className="gap-2 bg-gradient-to-r from-[#3f9094] to-[#2A5854] hover:opacity-90">
            <Plus className="h-4 w-4" />
            Nova Sessão
          </Button>
        </div>

        <Tabs defaultValue="calendar" className="w-full space-y-6">
          <TabsList className="bg-white/50 backdrop-blur-sm border border-gray-200 p-1">
            <TabsTrigger value="calendar" className="gap-2 data-[state=active]:bg-[#3f9094] data-[state=active]:text-white">
              <Calendar className="h-4 w-4" />
              Calendário
            </TabsTrigger>
            <TabsTrigger value="sms" className="gap-2 data-[state=active]:bg-[#3f9094] data-[state=active]:text-white">
              <MessageSquare className="h-4 w-4" />
              Automação SMS
            </TabsTrigger>
          </TabsList>

          <TabsContent value="calendar" className="space-y-8 animate-in fade-in-50 duration-500">
            {/* Calendário Principal - Agora no Topo */}
            <div className="bg-gradient-to-br from-white to-[#f8fafc] rounded-2xl p-4 sm:p-6 shadow-xl border border-gray-100 ring-1 ring-black/5">
              <AppointmentCalendar />
            </div>

            {/* Cards de Resumo */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Hoje */}
              <Card className="bg-white dark:bg-gray-900 border-none shadow-sm ring-1 ring-black/5 overflow-hidden group hover:shadow-md transition-shadow">
                <div className="h-1 bg-blue-500 w-full" />
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-gray-500 dark:text-gray-400 flex items-center gap-2">
                    <Clock className="h-4 w-4 text-blue-500" />
                    Hoje
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-gray-900 dark:text-gray-100">
                    {calendarMetrics.todayCount}
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    {calendarMetrics.todayCount === 1 ? 'sessão agendada' : 'sessões agendadas'}
                  </p>
                </CardContent>
              </Card>

              {/* Esta Semana */}
              <Card className="bg-white dark:bg-gray-900 border-none shadow-sm ring-1 ring-black/5 overflow-hidden group hover:shadow-md transition-shadow">
                <div className="h-1 bg-green-500 w-full" />
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-gray-500 dark:text-gray-400 flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-green-500" />
                    Esta Semana
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-gray-900 dark:text-gray-100">
                    {calendarMetrics.weekCount}
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    sessões programadas
                  </p>
                </CardContent>
              </Card>

              {/* Pendentes */}
              <Card className="bg-white dark:bg-gray-900 border-none shadow-sm ring-1 ring-black/5 overflow-hidden group hover:shadow-md transition-shadow">
                <div className="h-1 bg-orange-500 w-full" />
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-gray-500 dark:text-gray-400 flex items-center gap-2">
                    <AlertCircle className="h-4 w-4 text-orange-500" />
                    Pendentes
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-gray-900 dark:text-gray-100">
                    {calendarMetrics.pendingCount}
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    aguardando confirmação
                  </p>
                </CardContent>
              </Card>

              {/* Taxa de Comparecimento */}
              <Card className="bg-white dark:bg-gray-900 border-none shadow-sm ring-1 ring-black/5 overflow-hidden group hover:shadow-md transition-shadow">
                <div className="h-1 bg-purple-500 w-full" />
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-gray-500 dark:text-gray-400 flex items-center gap-2">
                    <Target className="h-4 w-4 text-purple-500" />
                    Comparecimento
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-gray-900 dark:text-gray-100">
                    {calendarMetrics.attendanceRate.toFixed(0)}%
                  </div>
                  <div className="flex items-center gap-1 mt-1">
                    <TrendingUp className="h-3 w-3 text-purple-500" />
                    <span className="text-xs text-gray-500">
                      {calendarMetrics.completedCount} realizadas
                    </span>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Próxima Sessão e Resumo de Estados em Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Próxima Sessão em Destaque */}
              <div className="lg:col-span-2">
                {calendarMetrics.nextAppointment && calendarMetrics.nextClient ? (
                  <Card className="h-full border-none shadow-sm ring-1 ring-black/5 bg-gradient-to-br from-[#3f9094]/5 to-white dark:to-gray-900">
                    <CardHeader className="pb-3 border-b border-gray-100/50">
                      <div className="flex items-center gap-2">
                        <Clock className="h-5 w-5 text-[#3f9094]" />
                        <CardTitle className="text-lg">Próxima Sessão</CardTitle>
                      </div>
                    </CardHeader>
                    <CardContent className="pt-6">
                      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
                        <div className="flex items-center gap-4">
                          <div className="w-14 h-14 bg-gradient-to-br from-[#3f9094] to-[#2A5854] rounded-2xl flex items-center justify-center text-white font-bold text-xl shadow-lg transform -rotate-3">
                            {calendarMetrics.nextClient.nome.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <p className="font-bold text-xl text-gray-900 dark:text-gray-100">{calendarMetrics.nextClient.nome}</p>
                            <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400 mt-1">
                              <Calendar className="h-4 w-4" />
                              <p className="text-sm">
                                {format(parseISO(calendarMetrics.nextAppointment.data), "EEEE, d 'de' MMMM", { locale: ptBR })}
                              </p>
                              <p className="text-sm font-bold bg-gray-100 px-2 py-0.5 rounded">
                                {format(parseISO(calendarMetrics.nextAppointment.data), "HH:mm")}
                              </p>
                            </div>
                          </div>
                        </div>
                        <div className="flex flex-col items-end gap-2">
                          <Badge className="bg-[#3f9094] hover:bg-[#2d7a7e] px-3 py-1 text-sm font-medium">
                            {calendarMetrics.nextAppointment.estado === 'agendado' ? 'Agendado' :
                              calendarMetrics.nextAppointment.estado === 'confirmado' ? 'Confirmado' :
                                calendarMetrics.nextAppointment.estado}
                          </Badge>
                          {calendarMetrics.nextAppointment.tipo && (
                            <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">{calendarMetrics.nextAppointment.tipo}</span>
                          )}
                        </div>
                      </div>
                      {calendarMetrics.nextAppointment.notas && (
                        <div className="mt-6 p-3 bg-white/50 rounded-lg border border-gray-100 italic text-sm text-gray-600">
                          "{calendarMetrics.nextAppointment.notas}"
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ) : (
                  <Card className="h-full border-dashed border-2 flex items-center justify-center p-12 text-gray-400">
                    <div className="text-center">
                      <Calendar className="h-12 w-14 mx-auto mb-4 opacity-20" />
                      <p>Sem agendamentos futuros</p>
                    </div>
                  </Card>
                )}
              </div>

              {/* Resumo de Estados - Vertical em Desktop */}
              <Card className="border-none shadow-sm ring-1 ring-black/5">
                <CardHeader>
                  <CardTitle className="text-base flex items-center gap-2">
                    <TrendingUp className="h-5 w-5 text-gray-400" />
                    Resumo de Estados
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between p-3 bg-green-50 dark:bg-green-950/20 rounded-xl border border-green-100">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-white rounded-lg shadow-sm">
                        <CheckCircle2 className="h-5 w-5 text-green-600" />
                      </div>
                      <span className="text-sm font-medium text-gray-700">Realizadas</span>
                    </div>
                    <span className="text-xl font-bold text-green-600">{calendarMetrics.completedCount}</span>
                  </div>

                  <div className="flex items-center justify-between p-3 bg-orange-50 dark:bg-orange-950/20 rounded-xl border border-orange-100">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-white rounded-lg shadow-sm">
                        <Clock className="h-5 w-5 text-orange-600" />
                      </div>
                      <span className="text-sm font-medium text-gray-700">Pendentes</span>
                    </div>
                    <span className="text-xl font-bold text-orange-600">{calendarMetrics.pendingCount}</span>
                  </div>

                  <div className="flex items-center justify-between p-3 bg-red-50 dark:bg-red-950/20 rounded-xl border border-red-100">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-white rounded-lg shadow-sm">
                        <XCircle className="h-5 w-5 text-red-600" />
                      </div>
                      <span className="text-sm font-medium text-gray-700">Canceladas</span>
                    </div>
                    <span className="text-xl font-bold text-red-600">{calendarMetrics.canceledCount}</span>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="sms" className="animate-in slide-in-from-left-4 duration-500">
            <div className="bg-white rounded-2xl p-4 sm:p-6 shadow-xl border border-gray-100 ring-1 ring-black/5">
              <SmsAutomationSettings />
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </PageLayout>
  );
};

export default CalendarPage;
