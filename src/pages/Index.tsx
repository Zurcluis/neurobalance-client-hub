import React, { useMemo } from 'react';
import PageLayout from '@/components/layout/PageLayout';
import DashboardOverview from '@/components/dashboard/DashboardOverview';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Plus, 
  Calendar, 
  Users, 
  Euro, 
  TrendingUp,
  Clock,
  Target,
  Zap,
  ArrowRight
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import useAppointments from '@/hooks/useAppointments';
import { parseISO, isToday, isTomorrow, addDays, isBefore, isAfter } from 'date-fns';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

const Index = () => {
  const navigate = useNavigate();
  const { appointments } = useAppointments();

  // Calcular métricas rápidas
  const quickMetrics = useMemo(() => {
    const now = new Date();
    const todayAppts = appointments.filter(apt => {
      if (!apt.data_hora) return false;
      return isToday(parseISO(apt.data_hora));
    });

    const tomorrowAppts = appointments.filter(apt => {
      if (!apt.data_hora) return false;
      return isTomorrow(parseISO(apt.data_hora));
    });

    const upcomingAppts = appointments.filter(apt => {
      if (!apt.data_hora) return false;
      const aptDate = parseISO(apt.data_hora);
      const sevenDaysLater = addDays(now, 7);
      return isAfter(aptDate, now) && isBefore(aptDate, sevenDaysLater);
    });

    const pendingAppts = appointments.filter(apt => apt.estado === 'agendado').length;

    return {
      todayCount: todayAppts.length,
      tomorrowCount: tomorrowAppts.length,
      upcomingCount: upcomingAppts.length,
      pendingCount: pendingAppts,
      nextAppointment: upcomingAppts[0]
    };
  }, [appointments]);

  return (
    <PageLayout>
      <div className="space-y-6">
        {/* Header Melhorado */}
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-[#3f9094] to-[#2A5854] bg-clip-text text-transparent">
              Dashboard
            </h1>
            <p className="text-gray-600 mt-1">
              Bem-vindo ao NeuroBalance CMS - Visão geral do seu negócio
            </p>
          </div>
          
          {/* Ações Rápidas */}
          <div className="flex flex-wrap gap-2">
            <Button 
              size="sm" 
              variant="outline" 
              className="gap-2"
              onClick={() => navigate('/clients')}
            >
              <Users className="h-4 w-4" />
              Clientes
            </Button>
            <Button 
              size="sm" 
              variant="outline" 
              className="gap-2"
              onClick={() => navigate('/calendar')}
            >
              <Calendar className="h-4 w-4" />
              Calendário
            </Button>
            <Button 
              size="sm" 
              className="gap-2 bg-gradient-to-r from-[#3f9094] to-[#2A5854] hover:opacity-90"
              onClick={() => navigate('/clients')}
            >
              <Plus className="h-4 w-4" />
              Novo Cliente
            </Button>
          </div>
        </div>

        {/* Alertas Rápidos */}
        {(quickMetrics.todayCount > 0 || quickMetrics.tomorrowCount > 0 || quickMetrics.pendingCount > 0) && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Sessões Hoje */}
            {quickMetrics.todayCount > 0 && (
              <Card className="border-l-4 border-l-blue-500 bg-gradient-to-r from-blue-50 to-white dark:from-blue-950/20 dark:to-gray-900">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Clock className="h-5 w-5 text-blue-500" />
                      <CardTitle className="text-lg">Hoje</CardTitle>
                    </div>
                    <Badge className="bg-blue-500">
                      {quickMetrics.todayCount}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-gray-600 mb-3">
                    {quickMetrics.todayCount === 1 ? 'Sessão agendada' : 'Sessões agendadas'} para hoje
                  </p>
                  <Button 
                    size="sm" 
                    variant="outline" 
                    className="w-full gap-2"
                    onClick={() => navigate('/calendar')}
                  >
                    Ver Calendário
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                </CardContent>
              </Card>
            )}

            {/* Sessões Amanhã */}
            {quickMetrics.tomorrowCount > 0 && (
              <Card className="border-l-4 border-l-green-500 bg-gradient-to-r from-green-50 to-white dark:from-green-950/20 dark:to-gray-900">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Calendar className="h-5 w-5 text-green-500" />
                      <CardTitle className="text-lg">Amanhã</CardTitle>
                    </div>
                    <Badge className="bg-green-500">
                      {quickMetrics.tomorrowCount}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-gray-600 mb-3">
                    {quickMetrics.tomorrowCount === 1 ? 'Sessão agendada' : 'Sessões agendadas'} para amanhã
                  </p>
                  <Button 
                    size="sm" 
                    variant="outline" 
                    className="w-full gap-2"
                    onClick={() => navigate('/calendar')}
                  >
                    Ver Calendário
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                </CardContent>
              </Card>
            )}

            {/* Sessões Pendentes */}
            {quickMetrics.pendingCount > 0 && (
              <Card className="border-l-4 border-l-orange-500 bg-gradient-to-r from-orange-50 to-white dark:from-orange-950/20 dark:to-gray-900">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Target className="h-5 w-5 text-orange-500" />
                      <CardTitle className="text-lg">Pendentes</CardTitle>
                    </div>
                    <Badge className="bg-orange-500">
                      {quickMetrics.pendingCount}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-gray-600 mb-3">
                    {quickMetrics.pendingCount === 1 ? 'Sessão pendente' : 'Sessões pendentes'} de confirmação
                  </p>
                  <Button 
                    size="sm" 
                    variant="outline" 
                    className="w-full gap-2"
                    onClick={() => navigate('/calendar')}
                  >
                    Ver Detalhes
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                </CardContent>
              </Card>
            )}
          </div>
        )}

        {/* Dashboard Principal */}
        <DashboardOverview />
      </div>
    </PageLayout>
  );
};

export default Index;
