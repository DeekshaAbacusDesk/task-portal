import { Navigate, Outlet, useLocation, type Location } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { FullPageLoader } from './FullPageLoader';
import { HOME_PATH } from './paths';

/** Routes like /login that an authenticated user should not see. */
export function PublicOnlyRoute() {
  const { status } = useAuth();
  const location = useLocation();

  if (status === 'checking') return <FullPageLoader />;
  if (status === 'authenticated') {
    // Return the user to the page that bounced them to login, if any.
    const from = (location.state as { from?: Location } | null)?.from;
    // Keep the query string too, so filters in a deep link (?status=pending) survive the login detour.
    const target = from ? `${from.pathname}${from.search}` : HOME_PATH;
    return <Navigate to={target} replace />;
  }
  return <Outlet />;
}
