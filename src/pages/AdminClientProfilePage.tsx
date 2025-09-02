import React from 'react';
import { useParams } from 'react-router-dom';
import { useIsMobile } from '@/hooks/use-mobile';
import { cn } from '@/lib/utils';
import AdminSidebar from '@/components/admin/AdminSidebar';
import { useAdminAuth } from '@/hooks/useAdminAuth';
import { ADMIN_PERMISSIONS } from '@/types/admin';
import { Users } from 'lucide-react';
import ClientDetailPage from './ClientDetailPage';
import { AdminContextProvider } from '@/contexts/AdminContext';

const AdminClientProfilePage = () => {
  const { hasPermission } = useAdminAuth();
  const isMobile = useIsMobile();
  const { clientId } = useParams();
  
  // Verificar permissões
  const canViewClients = hasPermission(ADMIN_PERMISSIONS.VIEW_CLIENTS);

  if (!canViewClients) {
    return (
      <div className="flex min-h-screen bg-gray-50">
        <AdminSidebar />
        <main className={cn(
          "flex-1 transition-all duration-300 flex items-center justify-center",
          isMobile ? "ml-0" : "ml-64"
        )}>
          <div className="text-center">
            <Users className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-gray-900 mb-2">Acesso Negado</h2>
            <p className="text-gray-600">Você não tem permissão para ver os clientes.</p>
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
          "p-6",
          isMobile && "pt-20"
        )}>
          {/* Renderizar a página completa de perfil do cliente no contexto administrativo */}
          <AdminContextProvider isAdminContext={true}>
            <ClientDetailPage />
          </AdminContextProvider>
        </div>
      </main>
    </div>
  );
};

export default AdminClientProfilePage;
