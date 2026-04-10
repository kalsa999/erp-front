import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { PageLoader } from '../components/ui/Spinner';
import type { UserRole } from '../types';

interface PrivateRouteProps {
  roles?: UserRole[];
  children?: React.ReactNode;
}

export function PrivateRoute({ roles, children }: PrivateRouteProps) {
  const { isAuthenticated, isLoading, user } = useAuth();

  if (isLoading) return <PageLoader />;
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  if (roles && user && !roles.includes(user.role)) return <Navigate to="/" replace />;

  return children ? <>{children}</> : <Outlet />;
}
