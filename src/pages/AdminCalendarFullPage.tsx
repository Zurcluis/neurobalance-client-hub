import React from 'react';
import { useIsMobile } from '@/hooks/use-mobile';
import { cn } from '@/lib/utils';
import AdminSidebar from '@/components/admin/AdminSidebar';
import { useAdminAuth } from '@/hooks/useAdminAuth';
import { ADMIN_PERMISSIONS } from '@/types/admin';
import AppointmentCalendar from '@/components/calendar/AppointmentCalendar';
import { Calendar as CalendarIcon } from 'lucide-react';

const AdminCalendarFullPage = () => {
  const { hasPermission } = useAdminAuth();
  const isMobile = useIsMobile();

  // Verificar permissões
  const canViewCalendar = hasPermission(ADMIN_PERMISSIONS.VIEW_CALENDAR);
  const canManageAppointments = hasPermission(ADMIN_PERMISSIONS.MANAGE_APPOINTMENTS);

  if (!canViewCalendar) {
    return (
      <div className="flex min-h-screen bg-gray-50">
        <AdminSidebar />
        <main className={cn(
          "flex-1 transition-all duration-300 flex items-center justify-center",
          isMobile ? "ml-0" : "ml-64"
        )}>
          <div className="text-center">
            <CalendarIcon className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-gray-900 mb-2">Acesso Negado</h2>
            <p className="text-gray-600">Você não tem permissão para ver o calendário.</p>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-gray-50">
      <AdminSidebar />
      
      <main className={cn(
        "flex-1 transition-all duration-300",
        isMobile ? "ml-0" : "ml-64"
      )}>
        <div className={cn(
          "h-full",
          isMobile && "pt-16"
        )}>
          {/* Usar o componente de calendário completo existente */}
          <AppointmentCalendar />
        </div>
      </main>
    </div>
  );
};

export default AdminCalendarFullPage;
