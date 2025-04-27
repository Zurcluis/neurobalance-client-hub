
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Calendar, User, BarChart3 } from 'lucide-react';
import { ClientData } from '@/components/clients/ClientCard';

// Sample clients for dashboard
const sampleClients: ClientData[] = [
  {
    id: '1',
    name: 'Maria Silva',
    email: 'maria.silva@example.com',
    phone: '912345678',
    sessionCount: 12,
    nextSession: '28 Apr, 10:00',
    totalPaid: 1440
  },
  {
    id: '2',
    name: 'João Santos',
    email: 'joao.santos@example.com',
    phone: '923456789',
    sessionCount: 5,
    nextSession: '28 Apr, 14:00',
    totalPaid: 600
  },
  {
    id: '3',
    name: 'Ana Costa',
    email: 'ana.costa@example.com',
    phone: '934567890',
    sessionCount: 8,
    nextSession: '29 Apr, 11:00',
    totalPaid: 960
  }
];

const DashboardOverview = () => {
  // Calculate summary statistics
  const totalClients = sampleClients.length;
  const totalSessions = sampleClients.reduce((sum, client) => sum + client.sessionCount, 0);
  const totalRevenue = sampleClients.reduce((sum, client) => sum + client.totalPaid, 0);
  
  // Get today's appointments
  const today = new Date();
  const todayString = today.toLocaleDateString('en-US', { day: '2-digit', month: 'short' });
  const todayAppointments = sampleClients.filter(client => 
    client.nextSession?.includes(todayString)
  );
  
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="glassmorphism">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Clients</CardTitle>
            <User className="h-4 w-4 text-neuro-primary" />
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{totalClients}</p>
          </CardContent>
        </Card>
        
        <Card className="glassmorphism">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Sessions</CardTitle>
            <Calendar className="h-4 w-4 text-neuro-primary" />
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{totalSessions}</p>
          </CardContent>
        </Card>
        
        <Card className="glassmorphism">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
            <BarChart3 className="h-4 w-4 text-neuro-primary" />
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">€{totalRevenue.toLocaleString()}</p>
          </CardContent>
        </Card>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="glassmorphism">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              <span>Today's Appointments</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {todayAppointments.length > 0 ? (
              <div className="space-y-4">
                {todayAppointments.map(client => (
                  <div key={client.id} className="flex items-center justify-between p-3 bg-neuro-soft-purple rounded-lg">
                    <div>
                      <p className="font-medium">{client.name}</p>
                      <p className="text-sm text-neuro-gray">{client.phone}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-medium">{client.nextSession?.split(', ')[1]}</p>
                      <p className="text-xs text-neuro-gray">Session #{client.sessionCount + 1}</p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="py-8 text-center">
                <p className="text-neuro-gray">No appointments scheduled for today</p>
              </div>
            )}
          </CardContent>
        </Card>
        
        <Card className="glassmorphism">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              <span>Recent Clients</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {sampleClients.slice(0, 3).map(client => (
                <div key={client.id} className="flex items-center justify-between p-3 bg-neuro-soft-blue rounded-lg">
                  <div>
                    <p className="font-medium">{client.name}</p>
                    <p className="text-sm text-neuro-gray">{client.email}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium">{client.sessionCount} sessions</p>
                    <p className="text-xs text-neuro-gray">€{client.totalPaid.toLocaleString()}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default DashboardOverview;
