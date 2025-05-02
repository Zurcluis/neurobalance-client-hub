
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Calendar, User, BarChart3, Plus } from 'lucide-react';
import { ClientData } from '@/components/clients/ClientCard';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';

const DashboardOverview = () => {
  // Load clients from localStorage
  const loadClientsFromStorage = (): ClientData[] => {
    const storedClients = localStorage.getItem('clients');
    return storedClients ? JSON.parse(storedClients) : [];
  };
  
  const clients = loadClientsFromStorage();
  
  // Calculate summary statistics if there are clients
  const totalClients = clients.length;
  const totalSessions = clients.reduce((sum, client) => sum + client.sessionCount, 0);
  const totalRevenue = clients.reduce((sum, client) => sum + (client.totalPaid || 0), 0);
  
  // Get today's appointments
  const today = new Date();
  const todayString = today.toLocaleDateString('en-US', { day: '2-digit', month: 'short' });
  const todayAppointments = clients.filter(client => 
    client.nextSession?.includes(todayString)
  );
  
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
        <Card className="dashboard-card">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Clientes</CardTitle>
            <User className="h-5 w-5 text-[#3A726D]" />
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{totalClients}</p>
          </CardContent>
        </Card>
        
        <Card className="dashboard-card">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Sessões</CardTitle>
            <Calendar className="h-5 w-5 text-[#3A726D]" />
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{totalSessions}</p>
          </CardContent>
        </Card>
        
        <Card className="dashboard-card">
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
              <div className="space-y-4">
                {todayAppointments.map(client => (
                  <div key={client.id} className="flex items-center justify-between p-3 bg-[#E6ECEA]/50 rounded-lg">
                    <div>
                      <p className="font-medium">{client.name}</p>
                      <p className="text-sm text-gray-600">{client.phone}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-medium">{client.nextSession?.split(', ')[1]}</p>
                      <p className="text-xs text-gray-500">Sessão #{client.sessionCount + 1}</p>
                    </div>
                  </div>
                ))}
              </div>
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
    </div>
  );
};

export default DashboardOverview;
