import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Loader2 } from 'lucide-react';

interface ProtectedRouteProps {
  children: React.ReactNode;
}

const ProtectedRoute = ({ children }: ProtectedRouteProps) => {
  const { session, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!session) {
    console.log('No session, redirecting to login');
    return (
      <Navigate
        to="/login"
        state={{
          from: location,
          error: 'Your session has expired. Please log in again.'
        }}
        replace
      />
    );
  }

  return <>{children}</>;
};

export default ProtectedRoute; 