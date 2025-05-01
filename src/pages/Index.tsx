
import React, { useEffect, useState } from 'react';
import PageLayout from '@/components/layout/PageLayout';
import DashboardOverview from '@/components/dashboard/DashboardOverview';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Calendar } from 'lucide-react';
import { parseISO, format, isSameDay } from 'date-fns';
import { ptBR } from 'date-fns/locale';

const Index = () => {
  const [todayAppointments, setTodayAppointments] = useState<any[]>([]);

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
      
      <DashboardOverview />
    </PageLayout>
  );
};

export default Index;
