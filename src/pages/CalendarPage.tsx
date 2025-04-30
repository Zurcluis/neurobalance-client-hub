
import React from 'react';
import PageLayout from '@/components/layout/PageLayout';
import AppointmentCalendar from '@/components/calendar/AppointmentCalendar';

const CalendarPage = () => {
  return (
    <PageLayout>
      <div className="mb-6">
        <h1 className="text-4xl font-bold gradient-heading">Calendário</h1>
        <p className="text-neuro-gray mt-2">Gerencie consultas e agendamentos dos clientes</p>
      </div>
      
      <div className="bg-gradient-to-br from-[#c5cfce]/60 to-[#e5e9e9]/60 rounded-2xl p-6 backdrop-blur-sm border border-white/20 shadow-lg">
        <AppointmentCalendar />
      </div>
    </PageLayout>
  );
};

export default CalendarPage;
