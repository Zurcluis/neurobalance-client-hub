import React from 'react';
import PageLayout from '@/components/layout/PageLayout';
import AppointmentCalendar from '@/components/calendar/AppointmentCalendar';

const CalendarPage = () => {
  return (
    <PageLayout showBreadcrumbs={false}>
      <div className="w-full h-[calc(100vh-70px)] min-h-[700px] bg-gradient-to-br from-white to-[#f8fafc] rounded-2xl p-1 sm:p-2 shadow-xl border border-gray-100 ring-1 ring-black/5 overflow-hidden">
        <AppointmentCalendar />
      </div>
    </PageLayout>
  );
};

export default CalendarPage;
