import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useDemoSession } from '../utils/demoSession';

export default function RequireDemoSession() {
  const { session } = useDemoSession();
  const location = useLocation();
  return session ? <Outlet /> : <Navigate to="/login" replace state={{ from: location.pathname + location.search + location.hash }} />;
}
