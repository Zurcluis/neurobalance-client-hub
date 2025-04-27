
import React from 'react';
import PageLayout from '@/components/layout/PageLayout';
import AppointmentCalendar from '@/components/calendar/AppointmentCalendar';

const CalendarPage = () => {
  return (
    <PageLayout>
      <div className="mb-8">
        <h1 className="text-3xl font-bold gradient-heading">Calendar</h1>
        <p className="text-neuro-gray mt-2">Schedule and manage client appointments</p>
      </div>
      
      <AppointmentCalendar />
    </PageLayout>
  );
};

export default CalendarPage;
