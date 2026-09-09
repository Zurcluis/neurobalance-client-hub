import PageLayout from '@/components/layout/PageLayout';
import AppointmentCalendar from '@/components/calendar/AppointmentCalendar';

const CalendarPage = () => {
  return (
    <PageLayout showBreadcrumbs={false}>
      <div className="w-full h-[calc(100vh-70px)] min-h-[600px] bg-white rounded-lg border border-gray-200 overflow-hidden">
        <AppointmentCalendar />
      </div>
    </PageLayout>
  );
};

export default CalendarPage;
