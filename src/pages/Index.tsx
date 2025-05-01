
import React, { useEffect, useState } from 'react';
import PageLayout from '@/components/layout/PageLayout';
import DashboardOverview from '@/components/dashboard/DashboardOverview';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Calendar } from 'lucide-react';
import { parseISO, format, isSameDay } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Link } from 'react-router-dom';
import { Badge } from '@/components/ui/badge';
import UpcomingAppointmentsTable from '@/components/dashboard/UpcomingAppointmentsTable';
import { useIsMobile } from '@/hooks/use-mobile';

const Index = () => {
  const [todayAppointments, setTodayAppointments] = useState<any[]>([]);
  const [upcomingAppointments, setUpcomingAppointments] = useState<any[]>([]);
  const isMobile = useIsMobile();

  useEffect(() => {
    // Load appointments from localStorage
    const loadAppointments = () => {
      const savedAppointments = localStorage.getItem('appointments');
      return savedAppointments ? JSON.parse(savedAppointments) : [];
    };

    const appointments = loadAppointments();
    const today = new Date();
    
    // Filter appointments for today
    const todaysAppts = appointments.filter((app: any) => {
      const appDate = parseISO(app.date);
      return isSameDay(appDate, today);
    });
    
    setTodayAppointments(todaysAppts);

    // Filter upcoming appointments (future appointments excluding today)
    const future = appointments.filter((app: any) => {
      const appDate = parseISO(app.date);
      return appDate > today && !isSameDay(appDate, today);
    });

    // Sort by date, closest first
    future.sort((a: any, b: any) => {
      return parseISO(a.date).getTime() - parseISO(b.date).getTime();
    });

    // Take only the next 5 appointments
    setUpcomingAppointments(future.slice(0, 5));
  }, []);

  return (
    <PageLayout>
      <div className="mb-8">
        <h1 className="text-3xl font-bold gradient-heading">Dashboard</h1>
        <p className="text-neuro-gray mt-2">Welcome to NeuroBalance Client Management System</p>
      </div>
      
      <div className="flex justify-center mb-8">
        <img 
          src="/lovable-uploads/e18faaaf-ef2c-4678-98cf-d9e7b9fa5ea5.png" 
          alt="NeuroBalance Logo" 
          className="h-40 w-auto" // Logo size doubled
        />
      </div>
      
      <DashboardOverview />
      
      {/* MOVED: Today and Upcoming Appointments moved to bottom */}
      <div className="mt-8 space-y-8">
        {todayAppointments.length > 0 ? (
          <Card className="glassmorphism mb-8">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                <span>Agendamentos de Hoje</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <UpcomingAppointmentsTable appointments={todayAppointments} />
              <div className="mt-3 text-right">
                <Link 
                  to="/calendar" 
                  className="text-[#3f9094] hover:text-[#265255] text-sm inline-flex items-center"
                >
                  Ver calendário completo
                </Link>
              </div>
            </CardContent>
          </Card>
        ) : (
          <Card className="glassmorphism mb-8">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                <span>Agendamentos de Hoje</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="text-center py-8">
              <p className="text-gray-500 mb-2">Sem agendamentos para hoje</p>
              <Link 
                to="/calendar" 
                className="text-[#3f9094] hover:text-[#265255] text-sm inline-block"
              >
                Ir para o calendário
              </Link>
            </CardContent>
          </Card>
        )}

        {upcomingAppointments.length > 0 && (
          <Card className="glassmorphism mb-8">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                <span>Próximos Agendamentos</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <UpcomingAppointmentsTable appointments={upcomingAppointments} />
              <div className="mt-3 text-right">
                <Link 
                  to="/calendar" 
                  className="text-[#3f9094] hover:text-[#265255] text-sm inline-flex items-center"
                >
                  Ver todos os agendamentos
                </Link>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </PageLayout>
  );
};

export default Index;
