import { useEffect } from 'react';
import PageLayout from '@/components/layout/PageLayout';
import AppointmentCalendar from '@/components/calendar/AppointmentCalendar';

const CalendarPage = () => {
  useEffect(() => {
    document.title = 'Calendário | NeuroBalance';
  }, []);

  return (
    <PageLayout showBreadcrumbs={false}>
      <div className="w-full h-[calc(100vh-70px)] min-h-[600px] bg-card rounded-lg border border-border overflow-hidden">
        <AppointmentCalendar />
      </div>
    </PageLayout>
  );
};

export default CalendarPage;
