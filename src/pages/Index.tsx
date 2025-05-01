
import React, { useEffect, useState } from 'react';
import PageLayout from '@/components/layout/PageLayout';
import DashboardOverview from '@/components/dashboard/DashboardOverview';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Calendar } from 'lucide-react';
import { parseISO, format, isSameDay } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Link } from 'react-router-dom';
import { Badge } from '@/components/ui/badge';

const Index = () => {
  const [todayAppointments, setTodayAppointments] = useState<any[]>([]);
  const [upcomingAppointments, setUpcomingAppointments] = useState<any[]>([]);

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

  const getAppointmentTypeColor = (type: string) => {
    switch (type) {
      case 'avaliação':
        return 'bg-[#9e50b3]/20 text-[#9e50b3] border-[#9e50b3]/30';
      case 'sessão':
        return 'bg-[#1088c4]/20 text-[#1088c4] border-[#1088c4]/30';
      case 'consulta':
        return 'bg-[#ecc249]/20 text-[#ecc249] border-[#ecc249]/30';
      default:
        return 'bg-gray-200 text-[#265255] border-gray-300';
    }
  };

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
      
      {todayAppointments.length > 0 && (
        <Card className="glassmorphism mb-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              <span>Agendamentos de Hoje</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {todayAppointments.map((appointment: any) => (
                <div 
                  key={appointment.id} 
                  className={`p-3 rounded-lg border ${getAppointmentTypeColor(appointment.type)}`}
                >
                  <div className="flex justify-between items-center">
                    <div>
                      <h3 className="font-medium">{appointment.title}</h3>
                      <p className="text-sm">{appointment.clientName}</p>
                      <p className="text-xs">ID: {appointment.clientId}</p>
                    </div>
                    <div>
                      <span className="text-sm px-3 py-1 rounded-full bg-white/30 backdrop-blur-sm">
                        {appointment.date.split('T')[1] || '09:00'}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
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
            <div className="space-y-3">
              {upcomingAppointments.map((appointment: any) => (
                <div 
                  key={appointment.id} 
                  className={`p-3 rounded-lg border ${getAppointmentTypeColor(appointment.type)}`}
                >
                  <div className="flex justify-between items-center">
                    <div>
                      <Link to={`/clients/${appointment.clientId}`} className="hover:underline">
                        <h3 className="font-medium">{appointment.title}</h3>
                      </Link>
                      <p className="text-sm">{appointment.clientName}</p>
                      <p className="text-xs">ID: {appointment.clientId}</p>
                    </div>
                    <div className="flex flex-col items-end gap-1">
                      <span className="text-sm px-3 py-1 rounded-full bg-white/30 backdrop-blur-sm">
                        {format(parseISO(appointment.date), "dd/MM/yyyy")} às {appointment.date.split('T')[1] || '09:00'}
                      </span>
                      <Badge
                        variant="outline"
                        className={appointment.confirmed ? "bg-green-100 text-green-800" : "bg-yellow-100 text-yellow-800"}
                      >
                        {appointment.confirmed ? "Confirmado" : "Pendente"}
                      </Badge>
                    </div>
                  </div>
                </div>
              ))}
            </div>
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
      
      <DashboardOverview />
    </PageLayout>
  );
};

export default Index;
