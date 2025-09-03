import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useMarketingAuth } from '@/hooks/useMarketingAuth';
import { Loader2 } from 'lucide-react';

interface MarketingProtectedRouteProps {
  children: React.ReactNode;
  permission?: string;
}

export const MarketingProtectedRoute: React.FC<MarketingProtectedRouteProps> = ({ 
  children, 
  permission 
}) => {
  const { isAuthenticated, loading, hasPermission } = useMarketingAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="flex items-center gap-2">
          <Loader2 className="h-6 w-6 animate-spin" />
          <span>Carregando...</span>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/marketing-login" state={{ from: location }} replace />;
  }

  if (permission && !hasPermission(permission)) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Acesso Negado</h2>
          <p className="text-gray-600">Você não tem permissão para acessar esta área.</p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
};
