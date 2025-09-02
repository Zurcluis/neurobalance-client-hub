import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAdminAuth } from '@/hooks/useAdminAuth';
import { Loader2, Shield } from 'lucide-react';

interface AdminProtectedRouteProps {
  children: React.ReactNode;
  requiredPermission?: string;
}

const AdminLoadingSpinner = () => (
  <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100">
    <div className="text-center">
      <Loader2 className="h-12 w-12 animate-spin text-slate-600 mx-auto mb-4" />
      <p className="text-slate-600 text-lg font-medium">Carregando área administrativa...</p>
    </div>
  </div>
);

export const AdminProtectedRoute: React.FC<AdminProtectedRouteProps> = ({ 
  children, 
  requiredPermission 
}) => {
  const { isAuthenticated, loading, hasPermission } = useAdminAuth();
  const location = useLocation();

  if (loading) {
    return <AdminLoadingSpinner />;
  }

  if (!isAuthenticated) {
    // Redirecionar para login com a URL atual como redirect
    return <Navigate to={`/admin-login?redirect=${encodeURIComponent(location.pathname)}`} replace />;
  }

  if (requiredPermission && !hasPermission(requiredPermission)) {
    // Usuário não tem permissão necessária
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100">
        <div className="text-center max-w-md mx-auto p-8">
          <Shield className="h-16 w-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Acesso Negado</h2>
          <p className="text-gray-600 mb-6">
            Você não tem permissão para acessar esta área. Entre em contato com o administrador.
          </p>
          <button
            onClick={() => window.history.back()}
            className="bg-slate-600 hover:bg-slate-700 text-white px-6 py-2 rounded-lg transition-colors"
          >
            Voltar
          </button>
        </div>
      </div>
    );
  }

  return <>{children}</>;
};
