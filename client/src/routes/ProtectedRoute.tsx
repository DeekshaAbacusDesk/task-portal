import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { useTaskRealtime } from '../realtime/useTaskRealtime';
import { FullPageLoader } from './FullPageLoader';

export function ProtectedRoute() {
  const { status } = useAuth();
  const location = useLocation();

  if (status === 'checking') return <FullPageLoader />;
  if (status === 'anonymous') return <Navigate to="/login" replace state={{ from: location }} />;
  return (
    <>
      <RealtimeSync />
      <Outlet />
    </>
  );
}

/** One socket connection for the whole authenticated app, kept alive across page navigation. */
function RealtimeSync() {
  useTaskRealtime();
  return null;
}
