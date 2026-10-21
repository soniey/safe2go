import { Navigate, Outlet } from 'react-router-dom';
import { useDemoSession } from '../../utils/demoSession';

// Maintenance crews only use the mobile crew app, so admin pages send them there.
export default function AdminOnly() {
  const { session } = useDemoSession();
  return session?.type === 'demo-maintenance' ? <Navigate to="/staff" replace /> : <Outlet />;
}
