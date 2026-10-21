import { useEffect, useRef, useState } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import Sidebar from './Sidebar';
import Header from './Header';
import { navigation } from '../utils/navigation';

export default function Layout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [desktopHidden, setDesktopHidden] = useState(false);
  const workspaceRef = useRef(null);
  const [isMobile, setIsMobile] = useState(() => !window.matchMedia('(min-width: 1024px)').matches);
  const { pathname } = useLocation();
  const title = navigation.find(item => item.path === pathname)?.label || 'Page not found';
  useEffect(() => { document.title = `${title} · Safe2Go`; }, [title]);
  useEffect(() => {
    const media = window.matchMedia('(min-width: 1024px)');
    const update = () => { setIsMobile(!media.matches); setSidebarOpen(false); };
    media.addEventListener('change', update);
    return () => media.removeEventListener('change', update);
  }, []);
  useEffect(() => { const close = event => { if (event.key === 'Escape') setSidebarOpen(false); }; window.addEventListener('keydown', close); return () => window.removeEventListener('keydown', close); }, []);
  useEffect(() => {
    if (!isMobile || !sidebarOpen) return;

    const previousFocus = document.activeElement;
    const previousOverflow = document.body.style.overflow;
    const sidebar = document.getElementById('main-sidebar');
    const workspace = workspaceRef.current;
    const controls = () => [...sidebar.querySelectorAll('a[href], button')];
    document.body.style.overflow = 'hidden';
    workspace.inert = true;
    sidebar.querySelector('[aria-label="Close navigation"]').focus();

    function keepFocusInSidebar(event) {
      if (event.key !== 'Tab') return;
      const items = controls();
      const first = items[0];
      const last = items[items.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    }

    sidebar.addEventListener('keydown', keepFocusInSidebar);
    return () => {
      document.body.style.overflow = previousOverflow;
      workspace.inert = false;
      sidebar.removeEventListener('keydown', keepFocusInSidebar);
      previousFocus?.focus();
    };
  }, [isMobile, sidebarOpen]);
  function toggleSidebar() { if (window.matchMedia('(min-width: 1024px)').matches) setDesktopHidden(value => !value); else setSidebarOpen(value => !value); }
  return <div className={desktopHidden ? 'app-shell sidebar-hidden' : 'app-shell'}><Sidebar open={sidebarOpen} hidden={isMobile && !sidebarOpen} onClose={() => setSidebarOpen(false)} /><div ref={workspaceRef} className="workspace"><Header title={title} onToggle={toggleSidebar} sidebarOpen={isMobile ? sidebarOpen : !desktopHidden} /><main id="main-content" tabIndex={-1}><Outlet /></main><footer className="workspace-footer"><span>Safe2Go <span className="text-neutral-300 mx-2">/</span> See risk earlier. Respond faster.</span><span>All readings and detections are simulated.</span></footer></div></div>;
}
