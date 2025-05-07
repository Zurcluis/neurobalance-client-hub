import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Calendar, User, BarChart3, Plus } from 'lucide-react';
import { ClientData } from '@/components/clients/ClientCard';
import { Button } from '@/components/ui/button';
import { Link, useNavigate } from 'react-router-dom';
import UpcomingAppointmentsTable from '@/components/dashboard/UpcomingAppointmentsTable';

interface Appointment {
  id: string;
  title: string;
  date: string;
  clientName: string;
  clientId: string;
  type: 'sessão' | 'avaliação' | 'consulta';
  confirmed?: boolean;
}

const DashboardOverview = () => {
  const navigate = useNavigate();
  
  // Load clients from localStorage
  const loadClientsFromStorage = (): ClientData[] => {
    const storedClients = localStorage.getItem('clients');
    return storedClients ? JSON.parse(storedClients) : [];
  };
  
  // Load appointments from localStorage
  const loadAppointmentsFromStorage = (): Appointment[] => {
    const storedAppointments = localStorage.getItem('appointments');
    return storedAppointments ? JSON.parse(storedAppointments) : [];
  };
  
  const clients = loadClientsFromStorage();
  const [todayAppointments, setTodayAppointments] = useState<Appointment[]>([]);
  const [upcomingAppointments, setUpcomingAppointments] = useState<Appointment[]>([]);
  const [pastAppointments, setPastAppointments] = useState<Appointment[]>([]);
  
  useEffect(() => {
    const appointments = loadAppointmentsFromStorage();
    const now = new Date();
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    // Filter today's appointments
    const todaysAppts = appointments.filter((appointment) => {
      const appointmentDate = new Date(appointment.date);
      appointmentDate.setHours(0, 0, 0, 0);
      return appointmentDate.getTime() === today.getTime();
    });
    
    // Filter upcoming appointments (future dates, not today)
    const futureAppts = appointments.filter((appointment) => {
      const appointmentDate = new Date(appointment.date);
      appointmentDate.setHours(0, 0, 0, 0);
      return appointmentDate > today;
    }).sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    
    // Filter past appointments (dates before today)
    const pastAppts = appointments.filter((appointment) => {
      const appointmentDate = new Date(appointment.date);
      return appointmentDate < now;
    });
    
    setTodayAppointments(todaysAppts);
    setUpcomingAppointments(futureAppts.slice(0, 4)); // Get only the next 4 appointments
    setPastAppointments(pastAppts);
  }, []);
  
  // Calculate summary statistics if there are clients
  const totalClients = clients.length;
  const totalSessions = pastAppointments.length; // Apenas sessões realizadas
  const totalRevenue = clients.reduce((sum, client) => sum + (client.totalPaid || 0), 0);
  
  // If no clients exist, show welcome screen
  if (totalClients === 0) {
    return (
      <div className="space-y-6">
        <div className="flex flex-col items-center justify-center p-12 bg-white rounded-xl shadow-md text-center">
          <h2 className="text-2xl font-bold text-[#3A726D] mb-4">Bem-vindo ao NeuroBalance CMS</h2>
          <p className="text-gray-600 max-w-md mb-8">
            Este é o seu sistema de gestão de clientes. Comece adicionando o seu primeiro cliente para
            visualizar estatísticas e agendamentos.
          </p>
          <div className="flex gap-4">
            <Button 
              asChild
              className="bg-[#3A726D] hover:bg-[#2A5854]"
            >
              <Link to="/clients">
                <Plus className="h-4 w-4 mr-2" />
                Adicionar Cliente
              </Link>
            </Button>
            <Button 
              asChild
              variant="outline" 
            >
              <Link to="/calendar">
                <Calendar className="h-4 w-4 mr-2" />
                Ver Calendário
              </Link>
            </Button>
          </div>
        </div>
      </div>
    );
  }
  
  // If clients exist, show regular dashboard
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card 
          className="dashboard-card hover:shadow-lg hover:translate-y-[-2px] transition-all cursor-pointer"
          onClick={() => navigate('/clients')}
        >
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Clientes</CardTitle>
            <User className="h-5 w-5 text-[#3A726D]" />
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{totalClients}</p>
          </CardContent>
        </Card>
        
        <Card 
          className="dashboard-card hover:shadow-lg hover:translate-y-[-2px] transition-all cursor-pointer"
          onClick={() => navigate('/calendar')}
        >
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Sessões</CardTitle>
            <Calendar className="h-5 w-5 text-[#3A726D]" />
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{totalSessions}</p>
            <p className="text-xs text-gray-500 mt-1">Sessões já realizadas</p>
          </CardContent>
        </Card>
        
        <Card 
          className="dashboard-card hover:shadow-lg hover:translate-y-[-2px] transition-all cursor-pointer"
          onClick={() => navigate('/finances')}
        >
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Receita Total</CardTitle>
            <BarChart3 className="h-5 w-5 text-[#3A726D]" />
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">€{totalRevenue.toLocaleString()}</p>
          </CardContent>
        </Card>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="dashboard-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              <span>Agendamentos de Hoje</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {todayAppointments.length > 0 ? (
              <UpcomingAppointmentsTable appointments={todayAppointments} />
            ) : (
              <div className="py-8 text-center">
                <p className="text-gray-500">Sem agendamentos para hoje</p>
                <Link 
                  to="/calendar" 
                  className="text-[#3A726D] hover:text-[#2A5854] text-sm mt-2 inline-block"
                >
                  Ir para o calendário
                </Link>
              </div>
            )}
          </CardContent>
        </Card>
        
        <Card className="dashboard-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              <span>Clientes Recentes</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {clients.slice(0, 3).map(client => (
                <div key={client.id} className="flex items-center justify-between p-3 bg-[#E6ECEA]/50 rounded-lg">
                  <div>
                    <p className="font-medium">{client.name}</p>
                    <p className="text-sm text-gray-600">{client.email}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium">{client.sessionCount} sessões</p>
                    <p className="text-xs text-gray-500">€{client.totalPaid?.toLocaleString() || 0}</p>
                  </div>
                </div>
              ))}
              {clients.length > 3 && (
                <Link 
                  to="/clients" 
                  className="text-[#3A726D] hover:text-[#2A5854] text-sm flex justify-center mt-2"
                >
                  Ver todos os clientes
                </Link>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* New section for Upcoming Appointments */}
      <Card className="dashboard-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            <span>Próximos Agendamentos</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {upcomingAppointments.length > 0 ? (
            <UpcomingAppointmentsTable appointments={upcomingAppointments} />
          ) : (
            <div className="py-8 text-center">
              <p className="text-gray-500">Sem agendamentos futuros</p>
              <Link 
                to="/calendar" 
                className="text-[#3A726D] hover:text-[#2A5854] text-sm mt-2 inline-block"
              >
                Adicionar agendamento
              </Link>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default DashboardOverview;
