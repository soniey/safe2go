import { useEffect, useState } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import Sidebar from './Sidebar';
import Header from './Header';
import { navigation } from '../utils/navigation';

export default function Layout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [desktopHidden, setDesktopHidden] = useState(false);
  const [isMobile, setIsMobile] = useState(() => !window.matchMedia('(min-width: 1024px)').matches);
  const { pathname } = useLocation();
  const title = navigation.find(item => item.path === pathname)?.label || 'Page not found';
  useEffect(() => { document.title = `${title} · RoadGuard`; }, [title]);
  useEffect(() => {
    const media = window.matchMedia('(min-width: 1024px)');
    const update = () => { setIsMobile(!media.matches); setSidebarOpen(false); };
    media.addEventListener('change', update);
    return () => media.removeEventListener('change', update);
  }, []);
  useEffect(() => { const close = event => { if (event.key === 'Escape') setSidebarOpen(false); }; window.addEventListener('keydown', close); return () => window.removeEventListener('keydown', close); }, []);
  function toggleSidebar() { if (window.matchMedia('(min-width: 1024px)').matches) setDesktopHidden(value => !value); else setSidebarOpen(value => !value); }
  return <div className={desktopHidden ? 'app-shell sidebar-hidden' : 'app-shell'}><Sidebar open={sidebarOpen} hidden={isMobile && !sidebarOpen} onClose={() => setSidebarOpen(false)} /><div className="workspace"><Header title={title} onToggle={toggleSidebar} sidebarOpen={isMobile ? sidebarOpen : !desktopHidden} /><main id="main-content" tabIndex={-1}><Outlet /></main><footer className="workspace-footer"><span>RoadGuard <span className="text-neutral-300 mx-2">/</span> Township safety, connected.</span><span>All readings and detections are simulated.</span></footer></div></div>;
}
