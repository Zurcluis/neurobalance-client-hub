import { useEffect } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useAdminAuth } from "@/hooks/useAdminAuth";
import { toast } from "sonner";

interface ProtectedRouteProps {
  children: React.ReactNode;
  requireNonPartner?: boolean;
}

const ProtectedRoute = ({ children, requireNonPartner = false }: ProtectedRouteProps) => {
  const { session, loading } = useAuth();
  const { session: adminSession, loading: adminLoading } = useAdminAuth();
  const location = useLocation();

  const isPartner = adminSession?.role === 'partner';

  useEffect(() => {
    if (requireNonPartner && isPartner) {
      toast.error("Acesso restrito: esta página não está disponível para parceiros.");
    }
  }, [requireNonPartner, isPartner]);

  if (requireNonPartner && isPartner) {
    return <Navigate to="/clients" replace />;
  }

  // Check if we're in development mode and should skip authentication
  const isDevMode = import.meta.env.DEV || import.meta.env.VITE_SKIP_AUTH === 'true';
  
  // In dev mode, skip authentication entirely
  if (isDevMode) {
    return <>{children}</>;
  }

  if (loading || adminLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-semibold">A carregar...</h2>
          <p className="text-muted-foreground mt-2">A verificar autenticação e permissões.</p>
        </div>
      </div>
    );
  }

  if (!session) {
    // Redirect to login page but save the attempted url
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return <>{children}</>;
};

export default ProtectedRoute; 