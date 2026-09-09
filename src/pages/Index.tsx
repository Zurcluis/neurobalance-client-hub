import { useMemo } from 'react';
import PageLayout from '@/components/layout/PageLayout';
import PageHeader from '@/components/shared/PageHeader';
import QuickCard from '@/components/shared/QuickCard';
import DashboardOverview from '@/components/dashboard/DashboardOverview';
import { Button } from '@/components/ui/button';
import {
  Plus,
  Calendar,
  Clock,
  Target,
  LayoutDashboard,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import useAppointments from '@/hooks/useAppointments';
import { isToday, isTomorrow, addDays, isBefore, isAfter } from 'date-fns';
import { parseLocalISO } from '@/utils/dateUtils';
import LeadsReadyForConversion from '@/components/clients/LeadsReadyForConversion';
import { toast } from 'sonner';

const parseISO = parseLocalISO;

const Index = () => {
  const navigate = useNavigate();
  const { appointments } = useAppointments();

  const quickMetrics = useMemo(() => {
    const now = new Date();
    const todayAppts = appointments.filter(apt => {
      if (!apt.data) return false;
      return isToday(parseISO(apt.data));
    });

    const tomorrowAppts = appointments.filter(apt => {
      if (!apt.data) return false;
      return isTomorrow(parseISO(apt.data));
    });

    const upcomingAppts = appointments.filter(apt => {
      if (!apt.data) return false;
      const aptDate = parseISO(apt.data);
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

  const sessionsLabel = (count: number) =>
    `${count} ${count === 1 ? 'sessão agendada' : 'sessões agendadas'}`;

  return (
    <PageLayout>
      <div className="space-y-6">
        <PageHeader
          title="Dashboard"
          description="Bem-vindo ao NeuroBalance CMS - Visão geral do seu negócio"
          icon={<LayoutDashboard className="h-5 w-5" />}
          actions={
            <>
              <Button size="sm" variant="outline" className="gap-2" onClick={() => navigate('/calendar')}>
                <Calendar className="h-4 w-4" />
                Calendário
              </Button>
              <Button size="sm" className="gap-2" onClick={() => navigate('/clients?new=true')}>
                <Plus className="h-4 w-4" />
                Novo Cliente
              </Button>
            </>
          }
        />

        <LeadsReadyForConversion
          onConvertLead={() => {
            navigate('/clients');
            toast.info('Pode converter a lead diretamente na página de clientes.');
          }}
        />

        {(quickMetrics.todayCount > 0 || quickMetrics.tomorrowCount > 0 || quickMetrics.pendingCount > 0) && (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            {quickMetrics.todayCount > 0 && (
              <QuickCard
                icon={<Clock className="h-5 w-5" />}
                tint="bg-blue-500/10 text-blue-600 dark:text-blue-400"
                title="Hoje"
                description={`${sessionsLabel(quickMetrics.todayCount)} para hoje`}
                actionLabel="Ver calendário"
                onAction={() => navigate('/calendar')}
              />
            )}

            {quickMetrics.tomorrowCount > 0 && (
              <QuickCard
                icon={<Calendar className="h-5 w-5" />}
                tint="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                title="Amanhã"
                description={`${sessionsLabel(quickMetrics.tomorrowCount)} para amanhã`}
                actionLabel="Ver calendário"
                onAction={() => navigate('/calendar')}
              />
            )}

            {quickMetrics.pendingCount > 0 && (
              <QuickCard
                icon={<Target className="h-5 w-5" />}
                tint="bg-amber-500/10 text-amber-600 dark:text-amber-400"
                title="Pendentes"
                description={`${quickMetrics.pendingCount} ${quickMetrics.pendingCount === 1 ? 'sessão por confirmar' : 'sessões por confirmar'}`}
                actionLabel="Ver detalhes"
                onAction={() => navigate('/calendar')}
              />
            )}
          </div>
        )}

        <DashboardOverview />
      </div>
    </PageLayout>
  );
};

export default Index;
