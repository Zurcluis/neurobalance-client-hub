import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";

interface ProtectedRouteProps {
  children: React.ReactNode;
}

const ProtectedRoute = ({ children }: ProtectedRouteProps) => {
  const { session, loading } = useAuth();
  const location = useLocation();

  // Check if we're in development mode and should skip authentication
  const isDevMode = import.meta.env.DEV || import.meta.env.VITE_SKIP_AUTH === 'true';
  
  console.log('ProtectedRoute:', { session, loading, path: location.pathname, isDevMode });

  // In dev mode, skip authentication entirely
  if (isDevMode) {
    console.log('Dev mode detected, skipping authentication');
    return <>{children}</>;
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-semibold">Loading...</h2>
          <p className="text-muted-foreground mt-2">Please wait while we check your authentication.</p>
        </div>
      </div>
    );
  }

  if (!session) {
    console.log('No session, redirecting to ldsogin page');
    // Redirect to login page but save the attempted url
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return <>{children}</>;
};

export default ProtectedRoute; 